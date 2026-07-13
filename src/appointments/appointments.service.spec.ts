import {
  BadRequestException,
  ConflictException,
  NotFoundException
} from '@nestjs/common';

import { AppointmentsService } from './appointments.service';
import { AppointmentStatus } from '../common/enums/appointment-status.enum';

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  const queryBuilderMock = {
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn()
  };

  const appointmentRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock)
  };

  const patientRepositoryMock = {
    findOne: jest.fn()
  };

  const userRepositoryMock = {
    findOne: jest.fn()
  };

  const availabilityServiceMock = {
    validateBusinessDay: jest.fn(),
    validateBusinessHour: jest.fn(),
    calculateEndTime: jest.fn()
  };

  const patient = {
    id: 'patient-1',
    firstName: 'Carlos',
    lastName: 'Yépez'
  };

  const physiotherapist = {
    id: 'physio-1',
    firstName: 'Ana',
    lastName: 'Fisio'
  };

  const appointment = {
    id: 'appointment-1',
    patient,
    physiotherapist,
    appointmentDate: '2026-07-13',
    startTime: '08:00',
    endTime: '09:00',
    status: AppointmentStatus.SCHEDULED
  };

  beforeEach(() => {
    jest.clearAllMocks();

    queryBuilderMock.leftJoin.mockReturnThis();
    queryBuilderMock.where.mockReturnThis();
    queryBuilderMock.andWhere.mockReturnThis();
    queryBuilderMock.getOne.mockResolvedValue(null);

    appointmentRepositoryMock.createQueryBuilder.mockReturnValue(queryBuilderMock);

    service = new AppointmentsService(
      appointmentRepositoryMock as any,
      patientRepositoryMock as any,
      userRepositoryMock as any,
      availabilityServiceMock as any
    );
  });

  it('should create an appointment when patient, physiotherapist and slot are valid', async () => {
    patientRepositoryMock.findOne.mockResolvedValue(patient);
    userRepositoryMock.findOne.mockResolvedValue(physiotherapist);
    availabilityServiceMock.calculateEndTime.mockReturnValue('09:00');

    appointmentRepositoryMock.create.mockReturnValue(appointment);
    appointmentRepositoryMock.save.mockResolvedValue(appointment);

    const result = await service.create({
      patientId: 'patient-1',
      physiotherapistId: 'physio-1',
      appointmentDate: '2026-07-13',
      startTime: '08:00',
      notes: 'Primera cita'
    } as any);

    expect(availabilityServiceMock.validateBusinessDay).toHaveBeenCalledWith(
      '2026-07-13'
    );
    expect(availabilityServiceMock.validateBusinessHour).toHaveBeenCalledWith(
      '08:00'
    );
    expect(availabilityServiceMock.calculateEndTime).toHaveBeenCalledWith(
      '08:00'
    );
    expect(appointmentRepositoryMock.create).toHaveBeenCalledWith({
      patient,
      physiotherapist,
      appointmentDate: '2026-07-13',
      startTime: '08:00',
      endTime: '09:00',
      notes: 'Primera cita',
      status: AppointmentStatus.SCHEDULED
    });
    expect(result).toEqual(appointment);
  });

  it('should throw not found when patient does not exist', async () => {
    patientRepositoryMock.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        patientId: 'missing-patient',
        physiotherapistId: 'physio-1',
        appointmentDate: '2026-07-13',
        startTime: '08:00'
      } as any)
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw not found when physiotherapist does not exist', async () => {
    patientRepositoryMock.findOne.mockResolvedValue(patient);
    userRepositoryMock.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        patientId: 'patient-1',
        physiotherapistId: 'missing-physio',
        appointmentDate: '2026-07-13',
        startTime: '08:00'
      } as any)
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw conflict when slot is already occupied', async () => {
    patientRepositoryMock.findOne.mockResolvedValue(patient);
    userRepositoryMock.findOne.mockResolvedValue(physiotherapist);
    queryBuilderMock.getOne.mockResolvedValue(appointment);

    await expect(
      service.create({
        patientId: 'patient-1',
        physiotherapistId: 'physio-1',
        appointmentDate: '2026-07-13',
        startTime: '08:00'
      } as any)
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should return appointments by date ordered by start time', async () => {
    appointmentRepositoryMock.find.mockResolvedValue([appointment]);

    const result = await service.findByDate('2026-07-13');

    expect(appointmentRepositoryMock.find).toHaveBeenCalledWith({
      where: { appointmentDate: '2026-07-13' },
      order: { startTime: 'ASC' }
    });
    expect(result).toEqual([appointment]);
  });

  it('should return all appointments ordered by date and start time', async () => {
    appointmentRepositoryMock.find.mockResolvedValue([appointment]);

    const result = await service.findAll();

    expect(appointmentRepositoryMock.find).toHaveBeenCalledWith({
      order: { appointmentDate: 'DESC', startTime: 'ASC' }
    });
    expect(result).toEqual([appointment]);
  });

  it('should find appointment by id', async () => {
    appointmentRepositoryMock.findOne.mockResolvedValue(appointment);

    const result = await service.findOne('appointment-1');

    expect(appointmentRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 'appointment-1' }
    });
    expect(result).toEqual(appointment);
  });

  it('should throw not found when appointment does not exist', async () => {
    appointmentRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('should cancel an appointment', async () => {
    appointmentRepositoryMock.findOne.mockResolvedValue({ ...appointment });
    appointmentRepositoryMock.save.mockImplementation(async (value) => value);

    const result = await service.cancel('appointment-1', {
      cancellationReason: 'Paciente no puede asistir'
    });

    expect(result.status).toBe(AppointmentStatus.CANCELLED);
    expect(result.cancellationReason).toBe('Paciente no puede asistir');
  });

  it('should throw bad request when cancelling an already cancelled appointment', async () => {
    appointmentRepositoryMock.findOne.mockResolvedValue({
      ...appointment,
      status: AppointmentStatus.CANCELLED
    });

    await expect(
      service.cancel('appointment-1', {
        cancellationReason: 'Duplicado'
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should mark appointment as attended', async () => {
    appointmentRepositoryMock.findOne.mockResolvedValue({ ...appointment });
    appointmentRepositoryMock.save.mockImplementation(async (value) => value);

    const result = await service.markAsAttended('appointment-1');

    expect(result.status).toBe(AppointmentStatus.ATTENDED);
  });

  it('should throw bad request when attending cancelled appointment', async () => {
    appointmentRepositoryMock.findOne.mockResolvedValue({
      ...appointment,
      status: AppointmentStatus.CANCELLED
    });

    await expect(service.markAsAttended('appointment-1')).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('should reschedule an appointment', async () => {
    appointmentRepositoryMock.findOne.mockResolvedValue({ ...appointment });
    userRepositoryMock.findOne.mockResolvedValue(physiotherapist);
    availabilityServiceMock.calculateEndTime.mockReturnValue('11:00');
    appointmentRepositoryMock.save.mockImplementation(async (value) => value);

    const result = await service.reschedule('appointment-1', {
      physiotherapistId: 'physio-1',
      appointmentDate: '2026-07-14',
      startTime: '10:00'
    } as any);

    expect(result.appointmentDate).toBe('2026-07-14');
    expect(result.startTime).toBe('10:00');
    expect(result.endTime).toBe('11:00');
    expect(result.status).toBe(AppointmentStatus.RESCHEDULED);
  });

  it('should throw bad request when rescheduling cancelled appointment', async () => {
    appointmentRepositoryMock.findOne.mockResolvedValue({
      ...appointment,
      status: AppointmentStatus.CANCELLED
    });

    await expect(
      service.reschedule('appointment-1', {
        physiotherapistId: 'physio-1',
        appointmentDate: '2026-07-14',
        startTime: '10:00'
      } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
