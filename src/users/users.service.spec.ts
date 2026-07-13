import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';
import { UserRole } from '../common/enums/user-role.enum';

jest.mock('bcrypt', () => ({
  hash: jest.fn()
}));

describe('UsersService', () => {
  let service: UsersService;

  const userRepositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn()
  };

  const roleRepositoryMock = {
    findOne: jest.fn()
  };

  const role = {
    id: 'role-1',
    name: UserRole.ADMIN
  };

  const savedUser = {
    id: 'user-1',
    firstName: 'Fabricio',
    lastName: 'Alama',
    email: 'fabricio@test.com',
    passwordHash: 'hashed-password',
    role,
    isActive: true,
    createdAt: new Date('2026-07-13T00:00:00.000Z'),
    updatedAt: new Date('2026-07-13T00:00:00.000Z')
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new UsersService(
      userRepositoryMock as any,
      roleRepositoryMock as any
    );
  });

  it('should create a user with hashed password', async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);
    roleRepositoryMock.findOne.mockResolvedValue(role);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

    userRepositoryMock.create.mockReturnValue(savedUser);
    userRepositoryMock.save.mockResolvedValue(savedUser);

    const result = await service.create({
      firstName: 'Fabricio',
      lastName: 'Alama',
      email: 'fabricio@test.com',
      password: '123456',
      role: UserRole.ADMIN
    });

    expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { email: 'fabricio@test.com' }
    });

    expect(roleRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { name: UserRole.ADMIN }
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);

    expect(userRepositoryMock.create).toHaveBeenCalledWith({
      firstName: 'Fabricio',
      lastName: 'Alama',
      email: 'fabricio@test.com',
      passwordHash: 'hashed-password',
      role,
      isActive: true
    });

    expect(result).toEqual({
      id: savedUser.id,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      role: savedUser.role.name,
      isActive: savedUser.isActive,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt
    });
  });

  it('should throw conflict when email already exists', async () => {
    userRepositoryMock.findOne.mockResolvedValue(savedUser);

    await expect(
      service.create({
        firstName: 'Fabricio',
        lastName: 'Alama',
        email: 'fabricio@test.com',
        password: '123456',
        role: UserRole.ADMIN
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should throw not found when role does not exist', async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);
    roleRepositoryMock.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        firstName: 'Fabricio',
        lastName: 'Alama',
        email: 'fabricio@test.com',
        password: '123456',
        role: UserRole.ADMIN
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should return users ordered by creation date', async () => {
    userRepositoryMock.find.mockResolvedValue([savedUser]);

    const result = await service.findAll();

    expect(userRepositoryMock.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' }
    });
    expect(result).toEqual([savedUser]);
  });

  it('should find user by id', async () => {
    userRepositoryMock.findOne.mockResolvedValue(savedUser);

    const result = await service.findById('user-1');

    expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 'user-1' }
    });
    expect(result).toEqual(savedUser);
  });

  it('should throw not found when user by id does not exist', async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findById('missing-id')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('should find user by email', async () => {
    userRepositoryMock.findOne.mockResolvedValue(savedUser);

    const result = await service.findByEmail('fabricio@test.com');

    expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { email: 'fabricio@test.com' }
    });
    expect(result).toEqual(savedUser);
  });
});
