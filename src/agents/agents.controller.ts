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
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { Agent } from './entities/agent.entity';

@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The agent has been successfully created.',
    type: Agent,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  create(@Body() createAgentDto: CreateAgentDto): Promise<Agent> {
    return this.agentsService.create(createAgentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agents' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all agents',
    type: [Agent],
  })
  findAll(): Promise<Agent[]> {
    return this.agentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a agent by id' })
  @ApiParam({ name: 'id', description: 'The id of the agent' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the agent with the specified id',
    type: Agent,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Agent not found',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Agent | null> {
    return this.agentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a agent' })
  @ApiParam({ name: 'id', description: 'The id of the agent' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The agent has been successfully updated.',
    type: Agent,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Agent not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAgentDto: UpdateAgentDto,
  ): Promise<Agent> {
    return this.agentsService.update(id, updateAgentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a agent' })
  @ApiParam({ name: 'id', description: 'The id of the agent' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The agent has been successfully deleted.',
    type: Agent,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Agent not found',
  })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<Agent> {
    return this.agentsService.remove(id);
  }
}
