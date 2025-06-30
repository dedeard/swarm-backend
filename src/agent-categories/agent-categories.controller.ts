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
import { AgentCategory } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../auth/user.decorator';
import { AgentCategoriesService } from './agent-categories.service';
import { CreateAgentCategoryDto } from './dto/create-agent-category.dto';
import { UpdateAgentCategoryDto } from './dto/update-agent-category.dto';

@Controller('agent-categories')
@UseGuards(AuthGuard)
export class AgentCategoriesController {
  constructor(
    private readonly agentCategoriesService: AgentCategoriesService,
  ) {}

  @Post()
  create(
    @Body() createAgentCategoryDto: CreateAgentCategoryDto,
    @User('sub') userId: string,
  ): Promise<AgentCategory> {
    return this.agentCategoriesService.create(createAgentCategoryDto, userId);
  }

  @Get()
  findAll(): Promise<AgentCategory[]> {
    return this.agentCategoriesService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AgentCategory | null> {
    return this.agentCategoriesService.findOne(id);
  }

  @Put(':id')
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
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.agentCategoriesService.remove(id);
  }
}
