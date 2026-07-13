import { ConflictException, NotFoundException } from '@nestjs/common';

import { PatientsService } from './patients.service';

describe('PatientsService', () => {
  let service: PatientsService;

  const patientRepositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn()
  };

  const initialRecordRepositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn()
  };

  const patient = {
    id: 'patient-1',
    firstName: 'Carlos',
    lastName: 'Yépez',
    identification: '0102030405',
    phone: '0999999999',
    email: 'carlos@test.com',
    birthDate: '1990-01-01',
    createdAt: new Date('2026-07-13T00:00:00.000Z')
  };

  const initialRecord = {
    id: 'record-1',
    painDescription: 'Dolor lumbar',
    medicalHistory: 'Sin antecedentes',
    allergies: 'Ninguna',
    currentMedication: 'Ninguna',
    previousTherapy: 'No',
    patient
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PatientsService(
      patientRepositoryMock as any,
      initialRecordRepositoryMock as any
    );
  });

  it('should create patient when identification is unique', async () => {
    patientRepositoryMock.findOne.mockResolvedValue(null);
    patientRepositoryMock.create.mockReturnValue(patient);
    patientRepositoryMock.save.mockResolvedValue(patient);

    const result = await service.create({
      firstName: 'Carlos',
      lastName: 'Yépez',
      identification: '0102030405',
      phone: '0999999999',
      email: 'carlos@test.com',
      birthDate: '1990-01-01'
    });

    expect(patientRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { identification: '0102030405' }
    });
    expect(patientRepositoryMock.create).toHaveBeenCalled();
    expect(patientRepositoryMock.save).toHaveBeenCalledWith(patient);
    expect(result).toEqual(patient);
  });

  it('should throw conflict when patient identification already exists', async () => {
    patientRepositoryMock.findOne.mockResolvedValue(patient);

    await expect(
      service.create({
        firstName: 'Carlos',
        lastName: 'Yépez',
        identification: '0102030405',
        phone: '0999999999',
        email: 'carlos@test.com',
        birthDate: '1990-01-01'
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should return all patients ordered by creation date', async () => {
    patientRepositoryMock.find.mockResolvedValue([patient]);

    const result = await service.findAll();

    expect(patientRepositoryMock.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' }
    });
    expect(result).toEqual([patient]);
  });

  it('should find patient by id', async () => {
    patientRepositoryMock.findOne.mockResolvedValue(patient);

    const result = await service.findOne('patient-1');

    expect(patientRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 'patient-1' }
    });
    expect(result).toEqual(patient);
  });

  it('should throw not found when patient does not exist', async () => {
    patientRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('should update patient data', async () => {
    patientRepositoryMock.findOne.mockResolvedValue(patient);
    patientRepositoryMock.save.mockResolvedValue({
      ...patient,
      phone: '0988888888'
    });

    const result = await service.update('patient-1', {
      phone: '0988888888'
    });

    expect(patientRepositoryMock.save).toHaveBeenCalled();
    expect(result.phone).toBe('0988888888');
  });

  it('should create initial record when patient does not have one', async () => {
    patientRepositoryMock.findOne.mockResolvedValue(patient);
    initialRecordRepositoryMock.findOne.mockResolvedValue(null);
    initialRecordRepositoryMock.create.mockReturnValue(initialRecord);
    initialRecordRepositoryMock.save.mockResolvedValue(initialRecord);

    const result = await service.createInitialRecord('patient-1', {
      painDescription: 'Dolor lumbar',
      medicalHistory: 'Sin antecedentes',
      allergies: 'Ninguna',
      currentMedication: 'Ninguna',
      previousTherapy: 'No'
    });

    expect(initialRecordRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { patient: { id: 'patient-1' } }
    });
    expect(initialRecordRepositoryMock.create).toHaveBeenCalledWith({
      painDescription: 'Dolor lumbar',
      medicalHistory: 'Sin antecedentes',
      allergies: 'Ninguna',
      currentMedication: 'Ninguna',
      previousTherapy: 'No',
      patient
    });
    expect(result).toEqual(initialRecord);
  });

  it('should throw conflict when initial record already exists', async () => {
    patientRepositoryMock.findOne.mockResolvedValue(patient);
    initialRecordRepositoryMock.findOne.mockResolvedValue(initialRecord);

    await expect(
      service.createInitialRecord('patient-1', {
        painDescription: 'Dolor lumbar'
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should find initial record by patient id', async () => {
    patientRepositoryMock.findOne.mockResolvedValue(patient);
    initialRecordRepositoryMock.findOne.mockResolvedValue(initialRecord);

    const result = await service.findInitialRecord('patient-1');

    expect(result).toEqual(initialRecord);
  });

  it('should throw not found when initial record does not exist', async () => {
    patientRepositoryMock.findOne.mockResolvedValue(patient);
    initialRecordRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findInitialRecord('patient-1')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('should update initial record', async () => {
    patientRepositoryMock.findOne.mockResolvedValue(patient);
    initialRecordRepositoryMock.findOne.mockResolvedValue(initialRecord);
    initialRecordRepositoryMock.save.mockResolvedValue({
      ...initialRecord,
      painDescription: 'Dolor cervical'
    });

    const result = await service.updateInitialRecord('patient-1', {
      painDescription: 'Dolor cervical'
    });

    expect(initialRecordRepositoryMock.save).toHaveBeenCalled();
    expect(result.painDescription).toBe('Dolor cervical');
  });
});
