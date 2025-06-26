import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Company } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    if (!createCompanyDto.name || createCompanyDto.name.trim().length === 0) {
      throw new BadRequestException('Company name is required');
    }

    const existingCompany = await this.prisma.company.findFirst({
      where: { name: createCompanyDto.name },
    });

    if (existingCompany) {
      throw new ConflictException('Company name already exists');
    }

    if (createCompanyDto.email && !this.isValidEmail(createCompanyDto.email)) {
      throw new BadRequestException('Invalid email format');
    }

    if (
      createCompanyDto.website &&
      !this.isValidUrl(createCompanyDto.website)
    ) {
      throw new BadRequestException('Invalid website URL format');
    }

    return this.prisma.company.create({
      data: {
        ...createCompanyDto,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async findAll(): Promise<Company[]> {
    return this.prisma.company.findMany();
  }

  async findOne(id: string): Promise<Company | null> {
    const company = await this.prisma.company.findUnique({
      where: { company_id: id },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    await this.findOne(id);

    if (updateCompanyDto.name) {
      const existingCompany = await this.prisma.company.findFirst({
        where: {
          name: updateCompanyDto.name,
          company_id: { not: id },
        },
      });
      if (existingCompany) {
        throw new ConflictException('Company name already exists');
      }
    }

    if (updateCompanyDto.email && !this.isValidEmail(updateCompanyDto.email)) {
      throw new BadRequestException('Invalid email format');
    }

    if (
      updateCompanyDto.website &&
      !this.isValidUrl(updateCompanyDto.website)
    ) {
      throw new BadRequestException('Invalid website URL format');
    }

    return this.prisma.company.update({
      where: { company_id: id },
      data: {
        ...updateCompanyDto,
        updated_at: new Date(),
      },
    });
  }

  async remove(id: string): Promise<any> {
    await this.findOne(id);

    const existingCompany = await this.prisma.company.findUnique({
      where: { company_id: id },
      include: {
        user_companies: true,
        agents: true,
        teams: true,
        buckets: true,
        components: true,
        cron_jobs: true,
        workflows: true,
        tools: true,
      },
    });

    if (!existingCompany) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    const dependencies: string[] = [];
    if (existingCompany.user_companies.length > 0) {
      dependencies.push(
        `${existingCompany.user_companies.length} user assignments`,
      );
    }
    if (existingCompany.agents.length > 0) {
      dependencies.push(`${existingCompany.agents.length} agents`);
    }
    if (existingCompany.teams.length > 0) {
      dependencies.push(`${existingCompany.teams.length} teams`);
    }
    if (existingCompany.buckets.length > 0) {
      dependencies.push(`${existingCompany.buckets.length} storage buckets`);
    }
    if (existingCompany.components.length > 0) {
      dependencies.push(`${existingCompany.components.length} components`);
    }
    if (existingCompany.cron_jobs.length > 0) {
      dependencies.push(`${existingCompany.cron_jobs.length} cron jobs`);
    }
    if (existingCompany.workflows.length > 0) {
      dependencies.push(`${existingCompany.workflows.length} workflows`);
    }
    if (existingCompany.tools.length > 0) {
      dependencies.push(`${existingCompany.tools.length} tools`);
    }

    if (dependencies.length > 0) {
      throw new ConflictException(
        `Cannot delete company with existing dependencies: ${dependencies.join(
          ', ',
        )}`,
      );
    }

    return this.prisma.company.delete({
      where: { company_id: id },
    });
  }
}
