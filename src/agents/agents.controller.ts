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
import { Agent as PrismaAgent } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../auth/user.decorator';
import {
  Permissions,
  RolesAndPermissions,
} from '../common/decorators/auth.decorator';
import { Permission } from '../common/enums/permission.enum';
import { Role } from '../common/enums/role.enum';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { Agent as AgentEntity } from './entities/agent.entity';

@ApiTags('agents')
@Controller('agents')
@UseGuards(AuthGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @RolesAndPermissions(
    [Role.ADMIN, Role.AGENT_MANAGER],
    [Permission.AGENT_CREATE],
  )
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The agent has been successfully created.',
    type: AgentEntity,
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
    @Body() createAgentDto: CreateAgentDto,
    @User('userId') userId: string,
  ): Promise<PrismaAgent> {
    return this.agentsService.create(createAgentDto, userId);
  }

  @Get()
  @Permissions(Permission.AGENT_READ)
  @ApiOperation({ summary: 'Get all agents' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all agents',
    type: [AgentEntity],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions.',
  })
  findAll(): Promise<PrismaAgent[]> {
    return this.agentsService.findAll();
  }

  @Get(':id')
  @Permissions(Permission.AGENT_READ)
  @ApiOperation({ summary: 'Get a agent by id' })
  @ApiParam({ name: 'id', description: 'The id of the agent' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the agent with the specified id',
    type: AgentEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Agent not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PrismaAgent | null> {
    return this.agentsService.findOne(id);
  }

  @Put(':id')
  @RolesAndPermissions(
    [Role.ADMIN, Role.AGENT_MANAGER],
    [Permission.AGENT_UPDATE],
  )
  @ApiOperation({ summary: 'Update a agent' })
  @ApiParam({ name: 'id', description: 'The id of the agent' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The agent has been successfully updated.',
    type: AgentEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Agent not found',
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
    @Body() updateAgentDto: UpdateAgentDto,
    @User('userId') userId: string,
  ): Promise<PrismaAgent> {
    return this.agentsService.update(id, updateAgentDto, userId);
  }

  @Delete(':id')
  @RolesAndPermissions(
    [Role.ADMIN, Role.AGENT_MANAGER],
    [Permission.AGENT_DELETE],
  )
  @ApiOperation({ summary: 'Delete a agent' })
  @ApiParam({ name: 'id', description: 'The id of the agent' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The agent has been successfully deleted.',
    type: AgentEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Agent not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions.',
  })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.agentsService.remove(id);
  }
}
