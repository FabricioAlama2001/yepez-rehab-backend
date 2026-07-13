import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../common/enums/user-role.enum';

jest.mock('bcrypt', () => ({
  compare: jest.fn()
}));

describe('AuthService', () => {
  let service: AuthService;

  const usersServiceMock = {
    findByEmail: jest.fn()
  };

  const jwtServiceMock = {
    signAsync: jest.fn()
  };

  const activeUser = {
    id: 'user-1',
    firstName: 'Fabricio',
    lastName: 'Alama',
    email: 'admin@test.com',
    passwordHash: 'hashed-password',
    isActive: true,
    role: {
      name: UserRole.ADMIN
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AuthService(
      usersServiceMock as unknown as UsersService,
      jwtServiceMock as unknown as JwtService
    );
  });

  it('should login successfully with valid credentials', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(activeUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtServiceMock.signAsync.mockResolvedValue('jwt-token');

    const result = await service.login({
      email: 'admin@test.com',
      password: '123456'
    });

    expect(usersServiceMock.findByEmail).toHaveBeenCalledWith('admin@test.com');
    expect(bcrypt.compare).toHaveBeenCalledWith('123456', 'hashed-password');
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'admin@test.com',
      role: UserRole.ADMIN
    });

    expect(result).toEqual({
      accessToken: 'jwt-token',
      user: {
        id: 'user-1',
        firstName: 'Fabricio',
        lastName: 'Alama',
        email: 'admin@test.com',
        role: UserRole.ADMIN
      }
    });
  });

  it('should reject login when user does not exist', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@test.com',
        password: '123456'
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should reject login when user is inactive', async () => {
    usersServiceMock.findByEmail.mockResolvedValue({
      ...activeUser,
      isActive: false
    });

    await expect(
      service.login({
        email: 'admin@test.com',
        password: '123456'
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should reject login when password is invalid', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(activeUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({
        email: 'admin@test.com',
        password: 'wrong-password'
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
