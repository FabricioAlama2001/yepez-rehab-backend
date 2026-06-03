import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityModule } from '../availability/availability.module';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Patient, User]),
    AvailabilityModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService, TypeOrmModule],
})
export class AppointmentsModule {}
