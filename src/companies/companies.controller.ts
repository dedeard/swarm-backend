import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Company as PrismaCompany } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
@UseGuards(AuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto): Promise<PrismaCompany> {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  findAll(): Promise<PrismaCompany[]> {
    return this.companiesService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PrismaCompany | null> {
    return this.companiesService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ): Promise<PrismaCompany> {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.companiesService.remove(id);
  }
}
