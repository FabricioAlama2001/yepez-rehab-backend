import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patient } from './patient.entity';

@Entity('initial_records')
export class InitialRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  consultationReason?: string;

  @Column({ type: 'text', nullable: true })
  painDescription?: string;

  @Column({ type: 'text', nullable: true })
  medicalHistory?: string;

  @Column({ type: 'text', nullable: true })
  allergies?: string;

  @Column({ type: 'text', nullable: true })
  surgeries?: string;

  @Column({ type: 'text', nullable: true })
  currentMedication?: string;

  @Column({ type: 'text', nullable: true })
  previousTherapy?: string;

  @OneToOne(() => Patient, (patient) => patient.initialRecord, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
