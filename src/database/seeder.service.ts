import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedRoles();
    await this.seedAdminUser();
  }

  private async seedRoles() {
    const roles = [
      {
        name: UserRole.ADMIN,
        description: 'Usuario administrador del sistema',
      },
      {
        name: UserRole.PHYSIOTHERAPIST,
        description: 'Usuario fisioterapeuta del centro',
      },
    ];

    for (const roleData of roles) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        await this.roleRepository.save(roleData);
        this.logger.log(`Rol creado: ${roleData.name}`);
      }
    }
  }

  private async seedAdminUser() {
    const adminEmail =
      this.configService.get<string>('ADMIN_EMAIL') || 'admin@yepezrehab.com';

    const existingAdmin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (existingAdmin) return;

    const adminRole = await this.roleRepository.findOne({
      where: { name: UserRole.ADMIN },
    });

    if (!adminRole) {
      this.logger.error('No existe el rol ADMIN');
      return;
    }

    const password =
      this.configService.get<string>('ADMIN_PASSWORD') || 'Admin123*';

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = this.userRepository.create({
      firstName: this.configService.get<string>('ADMIN_FIRST_NAME') || 'Admin',
      lastName: this.configService.get<string>('ADMIN_LAST_NAME') || 'User',
      email: adminEmail,
      passwordHash,
      role: adminRole,
      isActive: true,
    });

    await this.userRepository.save(admin);
    this.logger.log(`Usuario administrador creado: ${adminEmail}`);
  }
}
