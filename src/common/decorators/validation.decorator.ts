import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Required string field with length validation
 */
export function IsRequiredString(
  options: {
    minLength?: number;
    maxLength?: number;
    description?: string;
    example?: string;
  } = {},
) {
  const { minLength = 1, maxLength = 255, description, example } = options;

  return applyDecorators(
    IsString(),
    IsNotEmpty(),
    MinLength(minLength),
    MaxLength(maxLength),
    ApiProperty({
      description,
      example,
      minLength,
      maxLength,
    }),
  );
}

/**
 * Optional string field with length validation
 */
export function IsOptionalString(
  options: {
    minLength?: number;
    maxLength?: number;
    description?: string;
    example?: string;
  } = {},
) {
  const { minLength = 1, maxLength = 255, description, example } = options;

  return applyDecorators(
    IsString(),
    IsOptional(),
    MinLength(minLength),
    MaxLength(maxLength),
    ApiProperty({
      description,
      example,
      minLength,
      maxLength,
      required: false,
    }),
  );
}

/**
 * Required email field
 */
export function IsRequiredEmail(
  options: {
    description?: string;
    example?: string;
  } = {},
) {
  const { description, example } = options;

  return applyDecorators(
    IsString(),
    IsNotEmpty(),
    IsEmail(),
    ApiProperty({
      description,
      example: example || 'user@example.com',
      format: 'email',
    }),
  );
}

/**
 * Required URL field
 */
export function IsRequiredUrl(
  options: {
    description?: string;
    example?: string;
  } = {},
) {
  const { description, example } = options;

  return applyDecorators(
    IsString(),
    IsNotEmpty(),
    IsUrl(),
    ApiProperty({
      description,
      example: example || 'https://example.com',
      format: 'uri',
    }),
  );
}

/**
 * Required UUID field
 */
export function IsRequiredUUID(
  options: {
    description?: string;
    example?: string;
  } = {},
) {
  const { description, example } = options;

  return applyDecorators(
    IsString(),
    IsNotEmpty(),
    IsUUID(),
    ApiProperty({
      description,
      example: example || '123e4567-e89b-12d3-a456-426614174000',
      format: 'uuid',
    }),
  );
}

/**
 * Required number field with range validation
 */
export function IsRequiredNumber(
  options: {
    min?: number;
    max?: number;
    description?: string;
    example?: number;
  } = {},
) {
  const { min, max, description, example } = options;

  const decorators = [
    IsNumber(),
    IsNotEmpty(),
    Type(() => Number),
    ApiProperty({
      description,
      example,
      type: 'number',
    }),
  ];

  if (min !== undefined) {
    decorators.push(Min(min));
  }

  if (max !== undefined) {
    decorators.push(Max(max));
  }

  return applyDecorators(...decorators);
}

/**
 * Required boolean field
 */
export function IsRequiredBoolean(
  options: {
    description?: string;
    example?: boolean;
  } = {},
) {
  const { description, example } = options;

  return applyDecorators(
    IsBoolean(),
    IsNotEmpty(),
    Type(() => Boolean),
    ApiProperty({
      description,
      example,
      type: 'boolean',
    }),
  );
}

/**
 * Required date field
 */
export function IsRequiredDate(
  options: {
    description?: string;
    example?: string;
  } = {},
) {
  const { description, example } = options;

  return applyDecorators(
    IsDate(),
    Type(() => Date),
    ApiProperty({
      description,
      example: example || new Date().toISOString(),
      format: 'date-time',
    }),
  );
}

/**
 * Required enum field
 */
export function IsRequiredEnum<T extends { [key: string]: string | number }>(
  enumType: T,
  options: {
    description?: string;
    example?: T[keyof T];
  } = {},
) {
  const { description, example } = options;

  return applyDecorators(
    IsEnum(enumType),
    IsNotEmpty(),
    ApiProperty({
      description,
      example,
      enum: enumType,
    }),
  );
}

/**
 * Password field with complexity requirements
 */
export function IsPassword(
  options: {
    description?: string;
    minLength?: number;
    maxLength?: number;
  } = {},
) {
  const {
    description = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    minLength = 8,
    maxLength = 32,
  } = options;

  return applyDecorators(
    IsString(),
    IsNotEmpty(),
    MinLength(minLength),
    MaxLength(maxLength),
    Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
      message: 'Password is too weak',
    }),
    ApiProperty({
      description,
      minLength,
      maxLength,
      example: 'StrongP@ss123',
    }),
  );
}
