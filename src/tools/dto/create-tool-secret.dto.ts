import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateToolSecretDto {
  @IsUUID()
  tool_id: string;

  @IsString()
  vault_secret_id: string;

  @IsString()
  encrypted_secret_value: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ShareToolSecretWithUserDto {
  @IsUUID()
  shared_with_user_id: string;
}

export class ShareToolSecretWithCompanyRoleDto {
  @IsUUID()
  shared_with_company_id: string;

  @IsUUID()
  shared_with_role_id: string;
}
