import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AvailabilityModule } from './availability/availability.module';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [AuthModule, UsersModule, RolesModule, PatientsModule, AppointmentsModule, AvailabilityModule, LogsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
