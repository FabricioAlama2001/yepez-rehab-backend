import { IsDateString, IsUUID, Matches } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsUUID()
  physiotherapistId: string;

  @IsDateString()
  appointmentDate: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;
}
