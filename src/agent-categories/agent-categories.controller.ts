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
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from '../auth/user.decorator';
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
  create(
    @Body() createAgentCategoryDto: CreateAgentCategoryDto,
    @User('sub') userId: string,
  ): Promise<AgentCategory> {
    return this.agentCategoriesService.create(createAgentCategoryDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agent categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all agent categories',
    type: [AgentCategoryEntity],
  })
  findAll(): Promise<AgentCategory[]> {
    return this.agentCategoriesService.findAll();
  }

  @Get(':id')
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
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AgentCategory | null> {
    return this.agentCategoriesService.findOne(id);
  }

  @Put(':id')
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
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAgentCategoryDto: UpdateAgentCategoryDto,
    @User('sub') userId: string,
  ): Promise<AgentCategory> {
    return this.agentCategoriesService.update(
      id,
      updateAgentCategoryDto,
      userId,
    );
  }

  @Delete(':id')
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
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.agentCategoriesService.remove(id);
  }
}
