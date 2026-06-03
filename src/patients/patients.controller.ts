import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateInitialRecordDto } from './dto/create-initial-record.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdateInitialRecordDto } from './dto/update-initial-record.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  findAll() {
    return this.patientsService.findAll();
  }

  @Post(':id/initial-record')
  createInitialRecord(
    @Param('id') id: string,
    @Body() createInitialRecordDto: CreateInitialRecordDto,
  ) {
    return this.patientsService.createInitialRecord(id, createInitialRecordDto);
  }

  @Get(':id/initial-record')
  findInitialRecord(@Param('id') id: string) {
    return this.patientsService.findInitialRecord(id);
  }

  @Put(':id/initial-record')
  updateInitialRecord(
    @Param('id') id: string,
    @Body() updateInitialRecordDto: UpdateInitialRecordDto,
  ) {
    return this.patientsService.updateInitialRecord(id, updateInitialRecordDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto);
  }
}
