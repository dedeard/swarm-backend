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
import { Agent as PrismaAgent } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../auth/user.decorator';
import { CompanyId } from '../common/decorators/company-id.decorator';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Controller('agents')
@UseGuards(AuthGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  create(
    @Body() createAgentDto: CreateAgentDto,
    @User('userId') userId: string,
  ): Promise<PrismaAgent> {
    return this.agentsService.create(createAgentDto, userId);
  }

  @Get()
  findAll(@CompanyId() companyId?: string): Promise<PrismaAgent[]> {
    console.log(companyId);
    return this.agentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PrismaAgent | null> {
    return this.agentsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAgentDto: UpdateAgentDto,
    @User('userId') userId: string,
  ): Promise<PrismaAgent> {
    return this.agentsService.update(id, updateAgentDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.agentsService.remove(id);
  }
}
