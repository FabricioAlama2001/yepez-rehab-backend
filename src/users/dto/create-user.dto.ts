import {
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class CreateUserDto {
  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
