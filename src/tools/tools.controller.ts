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
import { Tool } from '@prisma/client';
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from '../auth/user.decorator';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { Tool as ToolEntity } from './entities/tool.entity';
import { ToolsService } from './tools.service';

@ApiTags('tools')
@Controller('tools')
@UseGuards(AuthGuard)
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tool' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The tool has been successfully created.',
    type: ToolEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  create(
    @Body() createToolDto: CreateToolDto,
    @User('sub') userId: string,
  ): Promise<Tool> {
    return this.toolsService.create(createToolDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tools' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all tools',
    type: [ToolEntity],
  })
  findAll(): Promise<Tool[]> {
    return this.toolsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tool by id' })
  @ApiParam({ name: 'id', description: 'The id of the tool' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the tool with the specified id',
    type: ToolEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tool not found',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Tool | null> {
    return this.toolsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a tool' })
  @ApiParam({ name: 'id', description: 'The id of the tool' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The tool has been successfully updated.',
    type: ToolEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tool not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateToolDto: UpdateToolDto,
  ): Promise<Tool> {
    return this.toolsService.update(id, updateToolDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tool' })
  @ApiParam({ name: 'id', description: 'The id of the tool' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The tool has been successfully deleted.',
    type: ToolEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tool not found',
  })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.toolsService.remove(id);
  }
}
