import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInitialRecordDto } from './dto/create-initial-record.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdateInitialRecordDto } from './dto/update-initial-record.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { InitialRecord } from './entities/initial-record.entity';
import { Patient } from './entities/patient.entity';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,

    @InjectRepository(InitialRecord)
    private readonly initialRecordRepository: Repository<InitialRecord>,
  ) {}

  async create(createPatientDto: CreatePatientDto) {
    const existingPatient = await this.patientRepository.findOne({
      where: { identification: createPatientDto.identification },
    });

    if (existingPatient) {
      throw new ConflictException('Ya existe un paciente con esta cédula');
    }

    const patient = this.patientRepository.create(createPatientDto);
    const savedPatient = await this.patientRepository.save(patient);

    this.logger.log(`Paciente creado: ${savedPatient.identification}`);

    return savedPatient;
  }

  findAll() {
    return this.patientRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const patient = await this.patientRepository.findOne({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    const patient = await this.findOne(id);

    Object.assign(patient, updatePatientDto);

    const updatedPatient = await this.patientRepository.save(patient);

    this.logger.log(`Paciente actualizado: ${updatedPatient.identification}`);

    return updatedPatient;
  }

  async createInitialRecord(
    patientId: string,
    createInitialRecordDto: CreateInitialRecordDto,
  ) {
    const patient = await this.findOne(patientId);

    const existingRecord = await this.initialRecordRepository.findOne({
      where: { patient: { id: patientId } },
    });

    if (existingRecord) {
      throw new ConflictException('El paciente ya tiene una ficha inicial');
    }

    const initialRecord = this.initialRecordRepository.create({
      ...createInitialRecordDto,
      patient,
    });

    const savedRecord = await this.initialRecordRepository.save(initialRecord);

    this.logger.log(
      `Ficha inicial creada para paciente: ${patient.identification}`,
    );

    return savedRecord;
  }

  async findInitialRecord(patientId: string) {
    await this.findOne(patientId);

    const initialRecord = await this.initialRecordRepository.findOne({
      where: { patient: { id: patientId } },
    });

    if (!initialRecord) {
      throw new NotFoundException('Ficha inicial no encontrada');
    }

    return initialRecord;
  }

  async updateInitialRecord(
    patientId: string,
    updateInitialRecordDto: UpdateInitialRecordDto,
  ) {
    const initialRecord = await this.findInitialRecord(patientId);

    Object.assign(initialRecord, updateInitialRecordDto);

    const updatedRecord =
      await this.initialRecordRepository.save(initialRecord);

    this.logger.log(`Ficha inicial actualizada para paciente: ${patientId}`);

    return updatedRecord;
  }
}
