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
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Company } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import {
  Permissions,
  RolesAndPermissions,
} from '../common/decorators/auth.decorator';
import { Permission } from '../common/enums/permission.enum';
import { Role } from '../common/enums/role.enum';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company as CompanyEntity } from './entities/company.entity';

@ApiTags('companies')
@Controller('companies')
@UseGuards(AuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @RolesAndPermissions([Role.ADMIN], [Permission.COMPANY_MANAGE_SETTINGS])
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The company has been successfully created.',
    type: CompanyEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions.',
  })
  create(@Body() createCompanyDto: CreateCompanyDto): Promise<Company> {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @Permissions(Permission.COMPANY_MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all companies',
    type: [CompanyEntity],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions.',
  })
  findAll(): Promise<Company[]> {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @Permissions(Permission.COMPANY_MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Get a company by id' })
  @ApiParam({ name: 'id', description: 'The id of the company' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the company with the specified id',
    type: CompanyEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Company not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Company | null> {
    return this.companiesService.findOne(id);
  }

  @Put(':id')
  @RolesAndPermissions([Role.ADMIN], [Permission.COMPANY_MANAGE_SETTINGS])
  @ApiOperation({ summary: 'Update a company' })
  @ApiParam({ name: 'id', description: 'The id of the company' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The company has been successfully updated.',
    type: CompanyEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Company not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @RolesAndPermissions([Role.ADMIN], [Permission.COMPANY_MANAGE_SETTINGS])
  @ApiOperation({ summary: 'Delete a company' })
  @ApiParam({ name: 'id', description: 'The id of the company' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The company has been successfully deleted.',
    type: CompanyEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Company not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions.',
  })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.companiesService.remove(id);
  }
}
