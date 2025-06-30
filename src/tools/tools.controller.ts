import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import {
  CreateToolSecretDto,
  ShareToolSecretWithCompanyRoleDto,
  ShareToolSecretWithUserDto,
} from './dto/create-tool-secret.dto';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolSecretDto } from './dto/update-tool-secret.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { ToolsService } from './tools.service';

@Controller('tools')
@UseGuards(AuthGuard)
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post()
  create(@Request() req, @Body() createToolDto: CreateToolDto) {
    return this.toolsService.create({
      ...createToolDto,
      user_id: req.user.sub,
    });
  }

  @Get()
  findAll(@Request() req) {
    return this.toolsService.findAll(req.user.sub, req.user.company_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.toolsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateToolDto: UpdateToolDto) {
    return this.toolsService.update(id, updateToolDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.toolsService.remove(id);
  }

  // Tool Secret Management
  @Post(':id/secrets')
  createSecret(
    @Request() req,
    @Param('id') toolId: string,
    @Body() createToolSecretDto: CreateToolSecretDto,
  ) {
    return this.toolsService.createSecret(req.user.sub, {
      ...createToolSecretDto,
      tool_id: toolId,
    });
  }

  @Patch('secrets/:id')
  updateSecret(
    @Param('id') id: string,
    @Body() updateToolSecretDto: UpdateToolSecretDto,
  ) {
    return this.toolsService.updateSecret(id, updateToolSecretDto);
  }

  @Delete('secrets/:id')
  removeSecret(@Param('id') id: string) {
    return this.toolsService.removeSecret(id);
  }

  @Post('secrets/:id/share/user')
  shareSecretWithUser(
    @Param('id') id: string,
    @Body() shareDto: ShareToolSecretWithUserDto,
  ) {
    return this.toolsService.shareSecretWithUser(id, shareDto);
  }

  @Post('secrets/:id/share/company-role')
  shareSecretWithCompanyRole(
    @Param('id') id: string,
    @Body() shareDto: ShareToolSecretWithCompanyRoleDto,
  ) {
    return this.toolsService.shareSecretWithCompanyRole(id, shareDto);
  }

  @Delete('secrets/:id/share/user/:userId')
  revokeSecretFromUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.toolsService.revokeSecretFromUser(id, userId);
  }

  @Delete('secrets/:id/share/company-role/:companyId/:roleId')
  revokeSecretFromCompanyRole(
    @Param('id') id: string,
    @Param('companyId') companyId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.toolsService.revokeSecretFromCompanyRole(id, companyId, roleId);
  }
}
