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
import { AgentCategory } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../auth/user.decorator';
import {
  Permissions,
  RolesAndPermissions,
} from '../common/decorators/auth.decorator';
import { Permission } from '../common/enums/permission.enum';
import { Role } from '../common/enums/role.enum';
import { AgentCategoriesService } from './agent-categories.service';
import { CreateAgentCategoryDto } from './dto/create-agent-category.dto';
import { UpdateAgentCategoryDto } from './dto/update-agent-category.dto';
import { AgentCategory as AgentCategoryEntity } from './entities/agent-category.entity';

@ApiTags('agent-categories')
@Controller('agent-categories')
@UseGuards(AuthGuard)
export class AgentCategoriesController {
  constructor(
    private readonly agentCategoriesService: AgentCategoriesService,
  ) {}

  @Post()
  @RolesAndPermissions(
    [Role.ADMIN, Role.AGENT_MANAGER],
    [Permission.AGENT_MANAGE_CATEGORIES],
  )
  @ApiOperation({ summary: 'Create a new agent category' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The agent category has been successfully created.',
    type: AgentCategoryEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions.',
  })
  create(
    @Body() createAgentCategoryDto: CreateAgentCategoryDto,
    @User('userId') userId: string,
  ): Promise<AgentCategory> {
    return this.agentCategoriesService.create(createAgentCategoryDto, userId);
  }

  @Get()
  @Permissions(Permission.AGENT_READ)
  @ApiOperation({ summary: 'Get all agent categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all agent categories',
    type: [AgentCategoryEntity],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions.',
  })
  findAll(): Promise<AgentCategory[]> {
    return this.agentCategoriesService.findAll();
  }

  @Get(':id')
  @Permissions(Permission.AGENT_READ)
  @ApiOperation({ summary: 'Get an agent category by id' })
  @ApiParam({ name: 'id', description: 'The id of the agent category' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the agent category with the specified id',
    type: AgentCategoryEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Agent category not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AgentCategory | null> {
    return this.agentCategoriesService.findOne(id);
  }

  @Put(':id')
  @RolesAndPermissions(
    [Role.ADMIN, Role.AGENT_MANAGER],
    [Permission.AGENT_MANAGE_CATEGORIES],
  )
  @ApiOperation({ summary: 'Update an agent category' })
  @ApiParam({ name: 'id', description: 'The id of the agent category' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The agent category has been successfully updated.',
    type: AgentCategoryEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Agent category not found',
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
    @Body() updateAgentCategoryDto: UpdateAgentCategoryDto,
    @User('userId') userId: string,
  ): Promise<AgentCategory> {
    return this.agentCategoriesService.update(
      id,
      updateAgentCategoryDto,
      userId,
    );
  }

  @Delete(':id')
  @RolesAndPermissions(
    [Role.ADMIN, Role.AGENT_MANAGER],
    [Permission.AGENT_MANAGE_CATEGORIES],
  )
  @ApiOperation({ summary: 'Delete an agent category' })
  @ApiParam({ name: 'id', description: 'The id of the agent category' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The agent category has been successfully deleted.',
    type: AgentCategoryEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Agent category not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions.',
  })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.agentCategoriesService.remove(id);
  }
}
