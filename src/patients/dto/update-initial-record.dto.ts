import { PartialType } from '@nestjs/mapped-types';
import { CreateInitialRecordDto } from './create-initial-record.dto';

export class UpdateInitialRecordDto extends PartialType(
  CreateInitialRecordDto,
) {}
