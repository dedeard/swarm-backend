import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Type assertion to handle type safety until Prisma client is generated
    return (await this.prisma.user.create({
      // @ts-expect-error
      data: createUserDto,
    })) as unknown as User;
  }

  async findAll(): Promise<User[]> {
    // Type assertion to handle type safety until Prisma client is generated
    return (await this.prisma.user.findMany()) as unknown as User[];
  }

  async findOne(id: number): Promise<User | null> {
    // Type assertion to handle type safety until Prisma client is generated
    const user = await this.prisma.user.findUnique({
      where: { id: String(id) },
    });

    if (!user) {
      return null;
    }

    return user as unknown as User;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    // Check if user exists
    const existingUser = await this.findOne(id);
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Type assertion to handle type safety until Prisma client is generated
    return (await this.prisma.user.update({
      where: { id: String(id) },
      data: updateUserDto,
    })) as unknown as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    // Type assertion to handle type safety until Prisma client is generated
    return (await this.prisma.user.findUnique({
      where: { email },
    })) as unknown as User | null;
  }

  async remove(id: number): Promise<User> {
    // Check if user exists
    const existingUser = await this.findOne(id);
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Type assertion to handle type safety until Prisma client is generated
    return (await this.prisma.user.delete({
      where: { id: String(id) },
    })) as unknown as User;
  }
}
