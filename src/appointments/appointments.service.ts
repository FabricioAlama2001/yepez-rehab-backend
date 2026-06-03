import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvailabilityService } from '../availability/availability.service';
import { AppointmentStatus } from '../common/enums/appointment-status.enum';
import { AppLoggerService } from '../logs/app-logger/app-logger.service';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { Appointment } from './entities/appointment.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,

    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly availabilityService: AvailabilityService,
    private readonly appLogger: AppLoggerService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    this.availabilityService.validateBusinessDay(
      createAppointmentDto.appointmentDate,
    );
    this.availabilityService.validateBusinessHour(
      createAppointmentDto.startTime,
    );

    const patient = await this.patientRepository.findOne({
      where: { id: createAppointmentDto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const physiotherapist = await this.userRepository.findOne({
      where: { id: createAppointmentDto.physiotherapistId },
    });

    if (!physiotherapist) {
      throw new NotFoundException('Fisioterapeuta no encontrado');
    }

    await this.validateAvailability(
      createAppointmentDto.physiotherapistId,
      createAppointmentDto.appointmentDate,
      createAppointmentDto.startTime,
    );

    const endTime = this.availabilityService.calculateEndTime(
      createAppointmentDto.startTime,
    );

    const appointment = this.appointmentRepository.create({
      patient,
      physiotherapist,
      appointmentDate: createAppointmentDto.appointmentDate,
      startTime: createAppointmentDto.startTime,
      endTime,
      notes: createAppointmentDto.notes,
      status: AppointmentStatus.SCHEDULED,
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);

    this.appLogger.log(
      `Cita creada: ${savedAppointment.appointmentDate} ${savedAppointment.startTime}`,
      'AppointmentsService',
    );

    return savedAppointment;
  }

  findByDate(date: string) {
    return this.appointmentRepository.find({
      where: { appointmentDate: date },
      order: { startTime: 'ASC' },
    });
  }

  findAll() {
    return this.appointmentRepository.find({
      order: { appointmentDate: 'DESC', startTime: 'ASC' },
    });
  }

  async findOne(id: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return appointment;
  }

  async cancel(id: string, cancelAppointmentDto: CancelAppointmentDto) {
    const appointment = await this.findOne(id);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('La cita ya se encuentra cancelada');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancellationReason = cancelAppointmentDto.cancellationReason;

    const cancelledAppointment =
      await this.appointmentRepository.save(appointment);

    this.appLogger.warn(
      `Cita cancelada: ${cancelledAppointment.id}`,
      'AppointmentsService',
    );

    return cancelledAppointment;
  }

  async reschedule(id: string, rescheduleDto: RescheduleAppointmentDto) {
    const appointment = await this.findOne(id);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('No se puede reprogramar una cita cancelada');
    }

    this.availabilityService.validateBusinessDay(
      rescheduleDto.appointmentDate,
    );
    this.availabilityService.validateBusinessHour(rescheduleDto.startTime);

    const physiotherapist = await this.userRepository.findOne({
      where: { id: rescheduleDto.physiotherapistId },
    });

    if (!physiotherapist) {
      throw new NotFoundException('Fisioterapeuta no encontrado');
    }

    await this.validateAvailability(
      rescheduleDto.physiotherapistId,
      rescheduleDto.appointmentDate,
      rescheduleDto.startTime,
      appointment.id,
    );

    appointment.physiotherapist = physiotherapist;
    appointment.appointmentDate = rescheduleDto.appointmentDate;
    appointment.startTime = rescheduleDto.startTime;
    appointment.endTime = this.availabilityService.calculateEndTime(
      rescheduleDto.startTime,
    );
    appointment.status = AppointmentStatus.RESCHEDULED;

    const rescheduledAppointment =
      await this.appointmentRepository.save(appointment);

    this.appLogger.log(
      `Cita reprogramada: ${rescheduledAppointment.id}`,
      'AppointmentsService',
    );

    return rescheduledAppointment;
  }

  async markAsAttended(id: string) {
    const appointment = await this.findOne(id);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('No se puede atender una cita cancelada');
    }

    appointment.status = AppointmentStatus.ATTENDED;

    const attendedAppointment =
      await this.appointmentRepository.save(appointment);

    this.appLogger.log(
      `Cita marcada como atendida: ${attendedAppointment.id}`,
      'AppointmentsService',
    );

    return attendedAppointment;
  }

  private async validateAvailability(
    physiotherapistId: string,
    appointmentDate: string,
    startTime: string,
    ignoredAppointmentId?: string,
  ) {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoin('appointment.physiotherapist', 'physiotherapist')
      .where('physiotherapist.id = :physiotherapistId', { physiotherapistId })
      .andWhere('appointment.appointmentDate = :appointmentDate', {
        appointmentDate,
      })
      .andWhere('appointment.startTime = :startTime', { startTime })
      .andWhere('appointment.status != :cancelledStatus', {
        cancelledStatus: AppointmentStatus.CANCELLED,
      });

    if (ignoredAppointmentId) {
      query.andWhere('appointment.id != :ignoredAppointmentId', {
        ignoredAppointmentId,
      });
    }

    const existingAppointment = await query.getOne();

    if (existingAppointment) {
      this.appLogger.warn(
        `Intento de cita duplicada: ${appointmentDate} ${startTime}`,
        'AppointmentsService',
      );
      throw new ConflictException('El horario no se encuentra disponible');
    }
  }
}
