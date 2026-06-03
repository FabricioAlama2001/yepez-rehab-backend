import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class AvailabilityService {
  private readonly openingHour = 8;
  private readonly closingHour = 15;

  validateBusinessDay(appointmentDate: string) {
    const date = new Date(`${appointmentDate}T00:00:00`);
    const day = date.getDay();

    if (day === 0 || day === 6) {
      throw new BadRequestException('Solo se permiten citas de lunes a viernes');
    }
  }

  validateBusinessHour(startTime: string) {
    const [hour, minutes] = startTime.split(':').map(Number);

    if (minutes !== 0) {
      throw new BadRequestException('Las citas deben iniciar en horas exactas');
    }

    if (hour < this.openingHour || hour >= this.closingHour) {
      throw new BadRequestException('El horario permitido es de 08:00 a 15:00');
    }
  }

  calculateEndTime(startTime: string) {
    const [hour] = startTime.split(':').map(Number);
    const endHour = hour + 1;

    return `${endHour.toString().padStart(2, '0')}:00`;
  }
}
