import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Type assertion to handle type safety until Prisma client is generated
    return (await this.prisma.user.create({
      data: createUserDto,
    })) as unknown as User;
  }

  async findAll(): Promise<User[]> {
    // Type assertion to handle type safety until Prisma client is generated
    return (await this.prisma.user.findMany()) as unknown as User[];
  }

  async findOne(id: number): Promise<User | null> {
    // Type assertion to handle type safety until Prisma client is generated
    return (await this.prisma.user.findUnique({
      where: { id },
    })) as unknown as User | null;
  }

  async findByEmail(email: string): Promise<User | null> {
    // Type assertion to handle type safety until Prisma client is generated
    return (await this.prisma.user.findUnique({
      where: { email },
    })) as unknown as User | null;
  }

  async remove(id: number): Promise<User> {
    // Type assertion to handle type safety until Prisma client is generated
    return (await this.prisma.user.delete({
      where: { id },
    })) as unknown as User;
  }
}
