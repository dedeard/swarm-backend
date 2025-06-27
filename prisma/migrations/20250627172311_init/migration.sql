-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "cache";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-agent";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-audit";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-blog";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-company";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-component";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-cronjob";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-file-storage";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-legal";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-llmstxt";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-organization";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-rbac";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-subscriptions";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-team";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-tool";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-user";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-waitlist";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-webhook";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "swarm-workflow";

-- CreateEnum
CREATE TYPE "swarm-waitlist"."WaitlistPositionChangeReason" AS ENUM ('INITIAL_ENTRY', 'USER_APPROVED', 'USER_REJECTED', 'PRIORITY_BOOST', 'PRIORITY_PENALTY', 'REFERRAL_BONUS', 'ADMIN_ADJUSTMENT', 'BULK_REORDER', 'USER_WITHDREW');

-- CreateEnum
CREATE TYPE "swarm-waitlist"."WaitlistQuestionType" AS ENUM ('TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'NUMBER', 'URL', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN', 'DATE', 'BOOLEAN', 'RATING', 'FILE_UPLOAD');

-- CreateEnum
CREATE TYPE "swarm-waitlist"."WaitlistSettingType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'EMAIL', 'URL', 'DATE', 'TIME');

-- CreateEnum
CREATE TYPE "swarm-waitlist"."WaitlistStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'INVITED', 'ACTIVATED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "cache"."user_permission_cache" (
    "user_id" UUID NOT NULL,
    "permission_name" TEXT NOT NULL,
    "has_permission" BOOLEAN NOT NULL,
    "cached_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (NOW() + '00:15:00'::interval),

    CONSTRAINT "user_permission_cache_pkey" PRIMARY KEY ("user_id","permission_name")
);

-- CreateTable
CREATE TABLE "swarm-agent"."templates" (
    "template_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "category_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "settings" JSONB,
    "is_system" BOOLEAN DEFAULT false,
    "is_public" BOOLEAN DEFAULT false,
    "user_id" UUID,
    "company_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("template_id")
);

-- CreateTable
CREATE TABLE "swarm-agent"."prompts" (
    "prompt_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "category_id" UUID,
    "template_id" UUID,
    "agent_id" UUID,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "prompt_type" TEXT NOT NULL,
    "is_system" BOOLEAN DEFAULT false,
    "is_public" BOOLEAN DEFAULT false,
    "is_visible" BOOLEAN DEFAULT true,
    "position" INTEGER,
    "user_id" UUID,
    "company_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("prompt_id")
);

-- CreateTable
CREATE TABLE "swarm-agent"."logs" (
    "agent_log_id" BIGSERIAL NOT NULL,
    "agent_id" UUID,
    "user_id" UUID,
    "company_id" UUID,
    "input_token" INTEGER,
    "output_token" INTEGER,
    "embedding_token" INTEGER,
    "pricing" DECIMAL,
    "chat_history" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("agent_log_id")
);

-- CreateTable
CREATE TABLE "swarm-agent"."categories" (
    "category_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "swarm-agent"."agent_bucket_accesses" (
    "agent_id" UUID NOT NULL,
    "bucket_id" TEXT NOT NULL,
    "permission_level" TEXT NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_bucket_accesses_pkey" PRIMARY KEY ("agent_id","bucket_id")
);

-- CreateTable
CREATE TABLE "swarm-agent"."shares_users" (
    "agent_id" UUID NOT NULL,
    "shared_with_user_id" UUID NOT NULL,
    "permission_level" TEXT NOT NULL DEFAULT 'read',
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shares_users_pkey" PRIMARY KEY ("agent_id","shared_with_user_id")
);

-- CreateTable
CREATE TABLE "swarm-agent"."agent_tools" (
    "agent_id" UUID NOT NULL,
    "tool_id" UUID NOT NULL,

    CONSTRAINT "agent_tools_pkey" PRIMARY KEY ("agent_id","tool_id")
);

-- CreateTable
CREATE TABLE "swarm-agent"."agents" (
    "agent_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID,
    "company_id" UUID,
    "agent_name" TEXT NOT NULL,
    "description" TEXT,
    "route_path" TEXT,
    "agent_style" TEXT,
    "on_status" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "public_hash" TEXT,
    "is_public" BOOLEAN,
    "avatar_url" TEXT,
    "category_id" UUID,
    "template_id" UUID,
    "workflow_id" UUID,
    "use_memory" BOOLEAN DEFAULT false,
    "media_input" JSONB,
    "media_output" JSONB,
    "use_tool" BOOLEAN DEFAULT false,
    "model_default" TEXT,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("agent_id")
);

-- CreateTable
CREATE TABLE "swarm-audit"."rate_limit_log" (
    "user_id" UUID NOT NULL,
    "function_name" TEXT NOT NULL,
    "call_timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_info" JSONB,

    CONSTRAINT "rate_limit_log_pkey" PRIMARY KEY ("user_id","function_name","call_timestamp")
);

-- CreateTable
CREATE TABLE "swarm-audit"."error_log" (
    "error_id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "function_name" TEXT NOT NULL,
    "error_code" TEXT NOT NULL,
    "error_message" TEXT NOT NULL,
    "error_context" JSONB,
    "stack_trace" TEXT,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),
    "severity" TEXT DEFAULT 'ERROR',

    CONSTRAINT "error_log_pkey" PRIMARY KEY ("error_id")
);

-- CreateTable
CREATE TABLE "swarm-audit"."audit_log" (
    "log_id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "action_timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action_type" TEXT NOT NULL,
    "table_name_affected" TEXT,
    "row_id_affected" TEXT,
    "old_data_snapshot" JSONB,
    "new_data_snapshot" JSONB,
    "description" TEXT,
    "client_info" JSONB,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "swarm-audit"."audit_log_partitioned" (
    "log_id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "action_type" TEXT NOT NULL,
    "table_name_affected" TEXT,
    "row_id_affected" TEXT,
    "old_data_snapshot" JSONB,
    "new_data_snapshot" JSONB,
    "description" TEXT,
    "client_info" JSONB,
    "action_timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_partitioned_pkey" PRIMARY KEY ("log_id","action_timestamp")
);

-- CreateTable
CREATE TABLE "swarm-audit"."function_access_log" (
    "log_id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "function_name" TEXT NOT NULL,
    "access_granted" BOOLEAN NOT NULL,
    "access_timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_role" TEXT,
    "reason" TEXT,

    CONSTRAINT "function_access_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "swarm-blog"."blog_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "sort_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swarm-blog"."supported_languages" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "native_name" TEXT NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "sort_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supported_languages_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "swarm-blog"."blog_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "usage_count" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swarm-blog"."blog_article_tags" (
    "article_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_article_tags_pkey" PRIMARY KEY ("article_id","tag_id")
);

-- CreateTable
CREATE TABLE "swarm-blog"."blog_articles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "featured_image_url" TEXT,
    "meta_description" TEXT,
    "meta_keywords" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publish_date" TIMESTAMPTZ(6),
    "author_user_id" UUID NOT NULL,
    "category_id" UUID,
    "view_count" INTEGER DEFAULT 0,
    "is_featured" BOOLEAN DEFAULT false,
    "has_audio" BOOLEAN DEFAULT false,
    "source_language" TEXT DEFAULT 'en',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swarm-blog"."blog_article_translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "language_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "meta_description" TEXT,
    "meta_keywords" TEXT[],
    "slug" TEXT NOT NULL,
    "translation_status" TEXT NOT NULL DEFAULT 'draft',
    "translation_quality_score" INTEGER,
    "translator_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_article_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swarm-blog"."blog_audio_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "language_code" TEXT,
    "file_url" TEXT NOT NULL,
    "file_size_bytes" BIGINT,
    "duration_seconds" INTEGER,
    "audio_format" TEXT,
    "transcript" TEXT,
    "narrator_name" TEXT,
    "audio_quality" TEXT NOT NULL DEFAULT 'standard',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_audio_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swarm-company"."user_companies" (
    "user_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "role_id" UUID,

    CONSTRAINT "user_companies_pkey" PRIMARY KEY ("user_id","company_id")
);

-- CreateTable
CREATE TABLE "swarm-company"."companies" (
    "company_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "statutory_name" TEXT,
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state_province" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "website_url" TEXT,
    "social_accounts" JSONB,
    "chamber_of_commerce" TEXT,
    "duns_number" TEXT,
    "tax_id" TEXT,
    "industry" TEXT,
    "founded_date" DATE,
    "company_size" TEXT,
    "logo_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "swarm-component"."component_agent_associations" (
    "association_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "component_id" UUID,
    "agent_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_agent_associations_pkey" PRIMARY KEY ("association_id")
);

-- CreateTable
CREATE TABLE "swarm-component"."component_shares_users" (
    "share_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "component_id" UUID,
    "user_id" UUID,
    "permission_level" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_shares_users_pkey" PRIMARY KEY ("share_id")
);

-- CreateTable
CREATE TABLE "swarm-component"."component_shares_company_roles" (
    "share_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "component_id" UUID,
    "company_id" UUID,
    "role_id" UUID,
    "permission_level" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_shares_company_roles_pkey" PRIMARY KEY ("share_id")
);

-- CreateTable
CREATE TABLE "swarm-component"."component_versions" (
    "version_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "component_id" UUID,
    "version_number" TEXT NOT NULL,
    "changelog" TEXT,
    "package_url" TEXT,
    "version_metadata" JSONB,
    "is_latest" BOOLEAN DEFAULT false,
    "is_stable" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_versions_pkey" PRIMARY KEY ("version_id")
);

-- CreateTable
CREATE TABLE "swarm-component"."component_types" (
    "type_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_types_pkey" PRIMARY KEY ("type_id")
);

-- CreateTable
CREATE TABLE "swarm-component"."components" (
    "component_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_id" UUID,
    "type_id" UUID,
    "company_id" UUID,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "description" TEXT,
    "category" TEXT,
    "component_type" TEXT,
    "package_url" TEXT,
    "storybook_metadata" JSONB,
    "additional_metadata" JSONB,
    "is_public" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "components_pkey" PRIMARY KEY ("component_id")
);

-- CreateTable
CREATE TABLE "swarm-component"."component_sources" (
    "source_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_sources_pkey" PRIMARY KEY ("source_id")
);

-- CreateTable
CREATE TABLE "swarm-cronjob"."cron_jobs" (
    "cron_job_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "company_id" UUID,
    "name" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID,
    "enabled" BOOLEAN DEFAULT true,
    "next_run" TIMESTAMPTZ(6),
    "last_run" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cron_jobs_pkey" PRIMARY KEY ("cron_job_id")
);

-- CreateTable
CREATE TABLE "swarm-file-storage"."file_metadata" (
    "file_id" UUID NOT NULL,
    "bucket_id" TEXT NOT NULL,
    "object_path" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "company_id" UUID,
    "file_name" TEXT,
    "content_type" TEXT,
    "size_bytes" BIGINT,
    "is_public" BOOLEAN DEFAULT false,
    "need_embedding" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "file_metadata_pkey" PRIMARY KEY ("file_id")
);

-- CreateTable
CREATE TABLE "swarm-file-storage"."buckets" (
    "bucket_id" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "associated_company_id" UUID,
    "description" TEXT,
    "is_public" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "buckets_pkey" PRIMARY KEY ("bucket_id")
);

-- CreateTable
CREATE TABLE "swarm-file-storage"."file_shares_users" (
    "file_id" UUID NOT NULL,
    "shared_with_user_id" UUID NOT NULL,
    "permission_level" TEXT NOT NULL DEFAULT 'read',
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_shares_users_pkey" PRIMARY KEY ("file_id","shared_with_user_id")
);

-- CreateTable
CREATE TABLE "swarm-file-storage"."file_shares_company_roles" (
    "file_id" UUID NOT NULL,
    "shared_with_company_id" UUID NOT NULL,
    "shared_with_role_id" UUID NOT NULL,
    "permission_level" TEXT NOT NULL DEFAULT 'read',
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_shares_company_roles_pkey" PRIMARY KEY ("file_id","shared_with_company_id","shared_with_role_id","permission_level")
);

-- CreateTable
CREATE TABLE "swarm-file-storage"."file_embeddings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "file_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "chunk_index" SMALLINT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "file_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swarm-legal"."terms_and_conditions" (
    "term_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "version" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "content_markdown" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_from" TIMESTAMPTZ(6) NOT NULL,
    "valid_until" TIMESTAMPTZ(6),

    CONSTRAINT "terms_and_conditions_pkey" PRIMARY KEY ("term_id")
);

-- CreateTable
CREATE TABLE "swarm-legal"."privacy_policies" (
    "policy_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "version" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "content_markdown" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_from" TIMESTAMPTZ(6) NOT NULL,
    "valid_until" TIMESTAMPTZ(6),

    CONSTRAINT "privacy_policies_pkey" PRIMARY KEY ("policy_id")
);

-- CreateTable
CREATE TABLE "swarm-legal"."policy_versions" (
    "version_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "policies" JSONB NOT NULL,

    CONSTRAINT "policy_versions_pkey" PRIMARY KEY ("version_id")
);

-- CreateTable
CREATE TABLE "swarm-llmstxt"."llmstxt_registry" (
    "llmstxt_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "company_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source_url" TEXT,
    "type" TEXT NOT NULL DEFAULT 'basic',
    "relative_url" TEXT NOT NULL,
    "file_size" BIGINT,
    "file_hash" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "version" TEXT DEFAULT '1.0',
    "is_active" BOOLEAN DEFAULT true,
    "is_public" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llmstxt_registry_pkey" PRIMARY KEY ("llmstxt_id")
);

-- CreateTable
CREATE TABLE "swarm-llmstxt"."llmstxt" (
    "agent_id" UUID NOT NULL,
    "llmstxt_id" UUID NOT NULL,
    "priority" INTEGER DEFAULT 0,
    "is_required" BOOLEAN DEFAULT false,
    "usage_type" TEXT DEFAULT 'context',
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llmstxt_pkey" PRIMARY KEY ("agent_id","llmstxt_id")
);

-- CreateTable
CREATE TABLE "swarm-organization"."organizations" (
    "organization_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "company_id" UUID,
    "template_id" UUID,
    "workflow_id" UUID,
    "organization_name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "is_public" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "swarm-rbac"."postgresql_user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "postgresql_role" TEXT NOT NULL,
    "company_id" UUID,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "postgresql_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swarm-rbac"."roles" (
    "role_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_name" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "swarm-rbac"."casbin_policies" (
    "id" SERIAL NOT NULL,
    "ptype" TEXT NOT NULL,
    "v0" TEXT,
    "v1" TEXT,
    "v2" TEXT,
    "v3" TEXT,
    "v4" TEXT,
    "v5" TEXT,

    CONSTRAINT "casbin_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swarm-rbac"."function_permissions" (
    "permission_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "function_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "function_permissions_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "swarm-rbac"."role_function_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL,
    "permission_id" UUID,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" UUID,

    CONSTRAINT "role_function_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swarm-subscriptions"."pricing_tiers" (
    "tier_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "profile_id" UUID NOT NULL,
    "currency" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "yearly_price" DECIMAL,
    "period" TEXT NOT NULL,
    "vat_percentage" DECIMAL DEFAULT 0.0,
    "valid_from" TIMESTAMPTZ(6) NOT NULL,
    "valid_until" TIMESTAMPTZ(6),
    "channel" TEXT,
    "term_id" UUID,
    "policy_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_tiers_pkey" PRIMARY KEY ("tier_id")
);

-- CreateTable
CREATE TABLE "swarm-subscriptions"."discount_coupons" (
    "coupon_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" TEXT NOT NULL,
    "discount_value" DECIMAL,
    "extra_tokens" INTEGER,
    "extra_database_storage_mb" INTEGER,
    "extra_file_storage_mb" INTEGER,
    "currency" TEXT,
    "valid_from" TIMESTAMPTZ(6),
    "valid_until" TIMESTAMPTZ(6),
    "max_claims" INTEGER,
    "times_claimed" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_coupons_pkey" PRIMARY KEY ("coupon_id")
);

-- CreateTable
CREATE TABLE "swarm-subscriptions"."subscriptions" (
    "subscription_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "tier_id" UUID NOT NULL,
    "coupon_id" UUID,
    "applied_discount_type" TEXT,
    "applied_discount_value" DECIMAL,
    "granted_extra_tokens" INTEGER,
    "granted_extra_database_storage_mb" INTEGER,
    "granted_extra_file_storage_mb" INTEGER,
    "start_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateTable
CREATE TABLE "swarm-subscriptions"."pricing_profiles" (
    "profile_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "features" JSONB,
    "database_storage_mb" INTEGER,
    "file_storage_mb" INTEGER,
    "token_amount" INTEGER,
    "is_pooled" BOOLEAN,
    "max_users" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_profiles_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "swarm-team"."teams" (
    "team_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "company_id" UUID,
    "template_id" UUID,
    "workflow_id" UUID,
    "team_name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "is_public" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("team_id")
);

-- CreateTable
CREATE TABLE "swarm-team"."team_members" (
    "team_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("team_id","agent_id")
);

-- CreateTable
CREATE TABLE "swarm-tool"."tools" (
    "tool_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT,
    "cmd_install_" TEXT,
    "port" TEXT,
    "method" TEXT,
    "env" JSONB,
    "required_env" JSONB,
    "status" TEXT,
    "user_id" UUID,
    "company_id" UUID,
    "logo_url" TEXT,
    "slug" TEXT,
    "website" TEXT,
    "developer" TEXT,
    "source" TEXT,
    "license" TEXT,
    "detailed_description" TEXT,
    "security_note" TEXT,
    "usage_suggestions" JSONB,
    "functions" JSONB,
    "is_public" BOOLEAN DEFAULT false,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("tool_id")
);

-- CreateTable
CREATE TABLE "swarm-tool"."tool_secrets" (
    "secret_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "owner_user_id" UUID NOT NULL,
    "tool_id" UUID NOT NULL,
    "vault_secret_id" UUID NOT NULL,
    "encrypted_secret_value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "tool_secrets_pkey" PRIMARY KEY ("secret_id")
);

-- CreateTable
CREATE TABLE "swarm-tool"."tool_secret_shares_users" (
    "secret_id" UUID NOT NULL,
    "shared_with_user_id" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "tool_secret_shares_users_pkey" PRIMARY KEY ("secret_id","shared_with_user_id")
);

-- CreateTable
CREATE TABLE "swarm-tool"."tool_secret_shares_company_roles" (
    "secret_id" UUID NOT NULL,
    "shared_with_company_id" UUID NOT NULL,
    "shared_with_role_id" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "tool_secret_shares_company_roles_pkey" PRIMARY KEY ("secret_id","shared_with_company_id","shared_with_role_id")
);

-- CreateTable
CREATE TABLE "swarm-user"."user_profiles" (
    "user_id" UUID NOT NULL,
    "full_name" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "social_accounts" JSONB,
    "subscribe_newsletter" BOOLEAN DEFAULT false,
    "is_gdpr_compliant" BOOLEAN DEFAULT false,
    "waitlist" BOOLEAN DEFAULT false,
    "agreed_terms_id" UUID,
    "agreed_privacy_policy_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "swarm-waitlist"."waitlist_position_history" (
    "position_history_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "waitlist_entry_id" UUID NOT NULL,
    "old_position" INTEGER,
    "new_position" INTEGER NOT NULL,
    "total_count" INTEGER NOT NULL,
    "change_reason" "swarm-waitlist"."WaitlistPositionChangeReason" NOT NULL,
    "change_description" TEXT,
    "batch_id" UUID,
    "admin_user_id" UUID,
    "notification_sent" BOOLEAN NOT NULL DEFAULT false,
    "notification_sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_position_history_pkey" PRIMARY KEY ("position_history_id")
);

-- CreateTable
CREATE TABLE "swarm-waitlist"."waitlist_analytics" (
    "analytics_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" DATE NOT NULL,
    "total_entries" INTEGER NOT NULL DEFAULT 0,
    "new_entries_today" INTEGER NOT NULL DEFAULT 0,
    "approved_today" INTEGER NOT NULL DEFAULT 0,
    "rejected_today" INTEGER NOT NULL DEFAULT 0,
    "average_wait_time" DOUBLE PRECISION,
    "conversion_rate" DOUBLE PRECISION,
    "top_referral_sources" JSONB,
    "question_responses" JSONB,
    "geographic_data" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_analytics_pkey" PRIMARY KEY ("analytics_id")
);

-- CreateTable
CREATE TABLE "swarm-waitlist"."waitlist_questions" (
    "question_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_text" TEXT NOT NULL,
    "question_type" "swarm-waitlist"."WaitlistQuestionType" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "placeholder_text" TEXT,
    "help_text" TEXT,
    "validation_rules" JSONB,
    "conditional_logic" JSONB,
    "max_length" INTEGER,
    "min_length" INTEGER,
    "default_value" TEXT,
    "section_name" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_questions_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "swarm-waitlist"."waitlist_question_options" (
    "option_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "option_text" TEXT NOT NULL,
    "option_value" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_other_option" BOOLEAN NOT NULL DEFAULT false,
    "conditional_logic" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_question_options_pkey" PRIMARY KEY ("option_id")
);

-- CreateTable
CREATE TABLE "swarm-waitlist"."waitlist_responses" (
    "response_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "waitlist_entry_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "response_text" TEXT,
    "response_number" DOUBLE PRECISION,
    "response_boolean" BOOLEAN,
    "response_date" DATE,
    "selected_option_ids" TEXT[],
    "file_urls" TEXT[],
    "other_text" TEXT,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "validation_errors" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_responses_pkey" PRIMARY KEY ("response_id")
);

-- CreateTable
CREATE TABLE "swarm-waitlist"."waitlist_settings" (
    "settings_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT NOT NULL,
    "setting_type" "swarm-waitlist"."WaitlistSettingType" NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_editable" BOOLEAN NOT NULL DEFAULT true,
    "validation_rules" JSONB,
    "default_value" TEXT,
    "category" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_settings_pkey" PRIMARY KEY ("settings_id")
);

-- CreateTable
CREATE TABLE "swarm-waitlist"."waitlist_campaigns" (
    "campaign_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "max_entries" INTEGER,
    "priority_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "custom_questions" TEXT[],
    "landing_page_url" TEXT,
    "success_redirect_url" TEXT,
    "email_templates" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_campaigns_pkey" PRIMARY KEY ("campaign_id")
);

-- CreateTable
CREATE TABLE "swarm-waitlist"."waitlist_campaign_entries" (
    "campaign_entry_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "waitlist_entry_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaign_metadata" JSONB,

    CONSTRAINT "waitlist_campaign_entries_pkey" PRIMARY KEY ("campaign_entry_id")
);

-- CreateTable
CREATE TABLE "swarm-waitlist"."waitlist_entries" (
    "waitlist_entry_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "total_users_ahead" INTEGER NOT NULL DEFAULT 0,
    "status" "swarm-waitlist"."WaitlistStatus" NOT NULL DEFAULT 'PENDING',
    "priority_score" INTEGER NOT NULL DEFAULT 0,
    "referral_code" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMPTZ(6),
    "notified_at" TIMESTAMPTZ(6),

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("waitlist_entry_id")
);

-- CreateTable
CREATE TABLE "swarm-webhook"."outgoing_webhooks" (
    "webhook_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "company_id" UUID,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "headers" JSONB,
    "enabled" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outgoing_webhooks_pkey" PRIMARY KEY ("webhook_id")
);

-- CreateTable
CREATE TABLE "swarm-webhook"."webhooks" (
    "webhook_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "company_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "endpoint_path" TEXT NOT NULL,
    "secret_token" TEXT,
    "target_type" TEXT NOT NULL,
    "target_id" UUID,
    "webhook_config" JSONB DEFAULT '{}',
    "is_active" BOOLEAN DEFAULT true,
    "is_public" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("webhook_id")
);

-- CreateTable
CREATE TABLE "swarm-workflow"."types" (
    "type_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type_name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "logo_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "types_pkey" PRIMARY KEY ("type_id")
);

-- CreateTable
CREATE TABLE "swarm-workflow"."workflows" (
    "workflow_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID,
    "company_id" UUID,
    "workflow_type_id" UUID,
    "description" TEXT,
    "workflow_name" TEXT NOT NULL,
    "workflow_definition" JSONB NOT NULL,
    "version" INTEGER DEFAULT 1,
    "metadata" JSONB,
    "status" TEXT DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_public" BOOLEAN DEFAULT false,
    "template_id" UUID,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("workflow_id")
);

-- CreateIndex
CREATE INDEX "idx_user_permission_cache_expiry" ON "cache"."user_permission_cache"("expires_at");

-- CreateIndex
CREATE INDEX "idx_user_permission_cache_user_id" ON "cache"."user_permission_cache"("user_id");

-- CreateIndex
CREATE INDEX "idx_agent_templates_user_id" ON "swarm-agent"."templates"("user_id");

-- CreateIndex
CREATE INDEX "idx_agent_templates_company_id" ON "swarm-agent"."templates"("company_id");

-- CreateIndex
CREATE INDEX "idx_agent_templates_category_id" ON "swarm-agent"."templates"("category_id");

-- CreateIndex
CREATE INDEX "idx_agent_templates_is_public" ON "swarm-agent"."templates"("is_public");

-- CreateIndex
CREATE INDEX "idx_agent_templates_is_system" ON "swarm-agent"."templates"("is_system");

-- CreateIndex
CREATE INDEX "idx_agent_templates_name" ON "swarm-agent"."templates"("name");

-- CreateIndex
CREATE INDEX "idx_agent_templates_created_at" ON "swarm-agent"."templates"("created_at");

-- CreateIndex
CREATE INDEX "idx_agent_prompts_user_id" ON "swarm-agent"."prompts"("user_id");

-- CreateIndex
CREATE INDEX "idx_agent_prompts_agent_id" ON "swarm-agent"."prompts"("agent_id");

-- CreateIndex
CREATE INDEX "idx_agent_prompts_template_id" ON "swarm-agent"."prompts"("template_id");

-- CreateIndex
CREATE INDEX "idx_agent_prompts_category_id" ON "swarm-agent"."prompts"("category_id");

-- CreateIndex
CREATE INDEX "idx_agent_prompts_company_id" ON "swarm-agent"."prompts"("company_id");

-- CreateIndex
CREATE INDEX "idx_agent_prompts_type" ON "swarm-agent"."prompts"("prompt_type");

-- CreateIndex
CREATE INDEX "idx_agent_prompts_is_public" ON "swarm-agent"."prompts"("is_public");

-- CreateIndex
CREATE INDEX "idx_agent_prompts_position" ON "swarm-agent"."prompts"("position");

-- CreateIndex
CREATE INDEX "idx_agent_logs_agent_id" ON "swarm-agent"."logs"("agent_id");

-- CreateIndex
CREATE INDEX "idx_agent_logs_user_id" ON "swarm-agent"."logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_agent_logs_company_id" ON "swarm-agent"."logs"("company_id");

-- CreateIndex
CREATE INDEX "idx_agent_logs_created_at" ON "swarm-agent"."logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_agent_logs_agent_timestamp" ON "swarm-agent"."logs"("agent_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_agents_user_id" ON "swarm-agent"."agents"("user_id");

-- CreateIndex
CREATE INDEX "idx_agents_company_id" ON "swarm-agent"."agents"("company_id");

-- CreateIndex
CREATE INDEX "idx_agents_is_public" ON "swarm-agent"."agents"("is_public");

-- CreateIndex
CREATE INDEX "idx_agents_category_id" ON "swarm-agent"."agents"("category_id");

-- CreateIndex
CREATE INDEX "idx_agents_created_at" ON "swarm-agent"."agents"("created_at");

-- CreateIndex
CREATE INDEX "idx_agents_company_public" ON "swarm-agent"."agents"("company_id", "is_public");

-- CreateIndex
CREATE INDEX "idx_agents_name" ON "swarm-agent"."agents"("agent_name");

-- CreateIndex
CREATE INDEX "idx_agents_status" ON "swarm-agent"."agents"("on_status");

-- CreateIndex
CREATE INDEX "idx_rate_limit_log_user_function_time" ON "swarm-audit"."rate_limit_log"("user_id", "function_name", "call_timestamp");

-- CreateIndex
CREATE INDEX "idx_error_log_function_time" ON "swarm-audit"."error_log"("function_name", "occurred_at");

-- CreateIndex
CREATE INDEX "idx_error_log_severity_time" ON "swarm-audit"."error_log"("severity", "occurred_at");

-- CreateIndex
CREATE INDEX "idx_error_log_user_id" ON "swarm-audit"."error_log"("user_id");

-- CreateIndex
CREATE INDEX "idx_error_log_error_code" ON "swarm-audit"."error_log"("error_code");

-- CreateIndex
CREATE INDEX "idx_error_log_occurred_at" ON "swarm-audit"."error_log"("occurred_at");

-- CreateIndex
CREATE INDEX "idx_audit_log_partitioned_user_timestamp" ON "swarm-audit"."audit_log_partitioned"("user_id", "action_timestamp");

-- CreateIndex
CREATE INDEX "idx_audit_log_partitioned_action_type" ON "swarm-audit"."audit_log_partitioned"("action_type", "action_timestamp");

-- CreateIndex
CREATE INDEX "idx_audit_log_partitioned_table_name" ON "swarm-audit"."audit_log_partitioned"("table_name_affected", "action_timestamp");

-- CreateIndex
CREATE INDEX "idx_function_access_log_user_id" ON "swarm-audit"."function_access_log"("user_id");

-- CreateIndex
CREATE INDEX "idx_function_access_log_function_name" ON "swarm-audit"."function_access_log"("function_name");

-- CreateIndex
CREATE INDEX "idx_function_access_log_timestamp" ON "swarm-audit"."function_access_log"("access_timestamp");

-- CreateIndex
CREATE INDEX "idx_function_access_log_granted" ON "swarm-audit"."function_access_log"("access_granted");

-- CreateIndex
CREATE INDEX "idx_function_access_log_user_timestamp" ON "swarm-audit"."function_access_log"("user_id", "access_timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "swarm-blog"."blog_categories"("slug");

-- CreateIndex
CREATE INDEX "idx_blog_categories_active" ON "swarm-blog"."blog_categories"("is_active");

-- CreateIndex
CREATE INDEX "idx_blog_categories_sort_order" ON "swarm-blog"."blog_categories"("sort_order");

-- CreateIndex
CREATE INDEX "idx_blog_categories_slug" ON "swarm-blog"."blog_categories"("slug");

-- CreateIndex
CREATE INDEX "idx_supported_languages_active" ON "swarm-blog"."supported_languages"("is_active");

-- CreateIndex
CREATE INDEX "idx_supported_languages_sort_order" ON "swarm-blog"."supported_languages"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tags_slug_key" ON "swarm-blog"."blog_tags"("slug");

-- CreateIndex
CREATE INDEX "idx_blog_tags_active" ON "swarm-blog"."blog_tags"("is_active");

-- CreateIndex
CREATE INDEX "idx_blog_tags_usage_count" ON "swarm-blog"."blog_tags"("usage_count");

-- CreateIndex
CREATE INDEX "idx_blog_tags_slug" ON "swarm-blog"."blog_tags"("slug");

-- CreateIndex
CREATE INDEX "idx_blog_tags_name" ON "swarm-blog"."blog_tags"("name");

-- CreateIndex
CREATE INDEX "idx_blog_article_tags_tag" ON "swarm-blog"."blog_article_tags"("tag_id");

-- CreateIndex
CREATE INDEX "idx_blog_article_tags_created" ON "swarm-blog"."blog_article_tags"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "blog_articles_slug_key" ON "swarm-blog"."blog_articles"("slug");

-- CreateIndex
CREATE INDEX "idx_blog_articles_status" ON "swarm-blog"."blog_articles"("status");

-- CreateIndex
CREATE INDEX "idx_blog_articles_publish_date" ON "swarm-blog"."blog_articles"("publish_date");

-- CreateIndex
CREATE INDEX "idx_blog_articles_author" ON "swarm-blog"."blog_articles"("author_user_id");

-- CreateIndex
CREATE INDEX "idx_blog_articles_category_id" ON "swarm-blog"."blog_articles"("category_id");

-- CreateIndex
CREATE INDEX "idx_blog_articles_slug" ON "swarm-blog"."blog_articles"("slug");

-- CreateIndex
CREATE INDEX "idx_blog_articles_featured" ON "swarm-blog"."blog_articles"("is_featured");

-- CreateIndex
CREATE INDEX "idx_blog_articles_view_count" ON "swarm-blog"."blog_articles"("view_count");

-- CreateIndex
CREATE INDEX "idx_blog_articles_created_at" ON "swarm-blog"."blog_articles"("created_at");

-- CreateIndex
CREATE INDEX "idx_blog_article_translations_status" ON "swarm-blog"."blog_article_translations"("translation_status");

-- CreateIndex
CREATE INDEX "idx_blog_article_translations_language" ON "swarm-blog"."blog_article_translations"("language_code");

-- CreateIndex
CREATE INDEX "idx_blog_article_translations_translator" ON "swarm-blog"."blog_article_translations"("translator_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_article_translations_article_id_language_code_key" ON "swarm-blog"."blog_article_translations"("article_id", "language_code");

-- CreateIndex
CREATE UNIQUE INDEX "blog_article_translations_language_code_slug_key" ON "swarm-blog"."blog_article_translations"("language_code", "slug");

-- CreateIndex
CREATE INDEX "idx_blog_audio_files_article" ON "swarm-blog"."blog_audio_files"("article_id");

-- CreateIndex
CREATE INDEX "idx_blog_audio_files_language" ON "swarm-blog"."blog_audio_files"("language_code");

-- CreateIndex
CREATE INDEX "idx_blog_audio_files_quality" ON "swarm-blog"."blog_audio_files"("audio_quality");

-- CreateIndex
CREATE INDEX "idx_user_companies_user_id" ON "swarm-company"."user_companies"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_companies_company_id" ON "swarm-company"."user_companies"("company_id");

-- CreateIndex
CREATE INDEX "idx_user_companies_role_id" ON "swarm-company"."user_companies"("role_id");

-- CreateIndex
CREATE INDEX "idx_user_companies_composite" ON "swarm-company"."user_companies"("user_id", "company_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "swarm-company"."companies"("name");

-- CreateIndex
CREATE INDEX "idx_companies_name" ON "swarm-company"."companies"("name");

-- CreateIndex
CREATE INDEX "idx_companies_created_at" ON "swarm-company"."companies"("created_at");

-- CreateIndex
CREATE INDEX "idx_companies_industry" ON "swarm-company"."companies"("industry");

-- CreateIndex
CREATE INDEX "idx_companies_country" ON "swarm-company"."companies"("country");

-- CreateIndex
CREATE UNIQUE INDEX "component_agent_associations_component_id_agent_id_key" ON "swarm-component"."component_agent_associations"("component_id", "agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "component_shares_users_component_id_user_id_key" ON "swarm-component"."component_shares_users"("component_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "component_shares_company_roles_component_id_company_id_role_key" ON "swarm-component"."component_shares_company_roles"("component_id", "company_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "component_versions_component_id_version_number_key" ON "swarm-component"."component_versions"("component_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "component_types_name_key" ON "swarm-component"."component_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "components_name_key" ON "swarm-component"."components"("name");

-- CreateIndex
CREATE UNIQUE INDEX "component_sources_name_key" ON "swarm-component"."component_sources"("name");

-- CreateIndex
CREATE INDEX "idx_file_metadata_user_id" ON "swarm-file-storage"."file_metadata"("owner_user_id");

-- CreateIndex
CREATE INDEX "idx_file_metadata_bucket_id" ON "swarm-file-storage"."file_metadata"("bucket_id");

-- CreateIndex
CREATE INDEX "idx_file_metadata_company_id" ON "swarm-file-storage"."file_metadata"("company_id");

-- CreateIndex
CREATE INDEX "idx_file_metadata_created_at" ON "swarm-file-storage"."file_metadata"("created_at");

-- CreateIndex
CREATE INDEX "idx_file_metadata_content_type" ON "swarm-file-storage"."file_metadata"("content_type");

-- CreateIndex
CREATE INDEX "idx_file_metadata_is_public" ON "swarm-file-storage"."file_metadata"("is_public");

-- CreateIndex
CREATE UNIQUE INDEX "file_metadata_bucket_id_object_path_key" ON "swarm-file-storage"."file_metadata"("bucket_id", "object_path");

-- CreateIndex
CREATE INDEX "idx_file_embeddings_file_id" ON "swarm-file-storage"."file_embeddings"("file_id");

-- CreateIndex
CREATE INDEX "idx_file_embeddings_created_at" ON "swarm-file-storage"."file_embeddings"("created_at");

-- CreateIndex
CREATE INDEX "idx_llmstxt_registry_user_id" ON "swarm-llmstxt"."llmstxt_registry"("user_id");

-- CreateIndex
CREATE INDEX "idx_llmstxt_registry_company_id" ON "swarm-llmstxt"."llmstxt_registry"("company_id");

-- CreateIndex
CREATE INDEX "idx_llmstxt_registry_is_public" ON "swarm-llmstxt"."llmstxt_registry"("is_public");

-- CreateIndex
CREATE INDEX "idx_llmstxt_registry_is_active" ON "swarm-llmstxt"."llmstxt_registry"("is_active");

-- CreateIndex
CREATE INDEX "idx_llmstxt_registry_type" ON "swarm-llmstxt"."llmstxt_registry"("type");

-- CreateIndex
CREATE INDEX "idx_llmstxt_registry_name" ON "swarm-llmstxt"."llmstxt_registry"("name");

-- CreateIndex
CREATE INDEX "idx_llmstxt_registry_tags" ON "swarm-llmstxt"."llmstxt_registry"("tags");

-- CreateIndex
CREATE INDEX "idx_postgresql_user_roles_user_id" ON "swarm-rbac"."postgresql_user_roles"("user_id");

-- CreateIndex
CREATE INDEX "idx_postgresql_user_roles_role" ON "swarm-rbac"."postgresql_user_roles"("postgresql_role");

-- CreateIndex
CREATE INDEX "idx_postgresql_user_roles_company" ON "swarm-rbac"."postgresql_user_roles"("company_id");

-- CreateIndex
CREATE INDEX "idx_postgresql_user_roles_active" ON "swarm-rbac"."postgresql_user_roles"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "postgresql_user_roles_user_id_postgresql_role_company_id_key" ON "swarm-rbac"."postgresql_user_roles"("user_id", "postgresql_role", "company_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "swarm-rbac"."roles"("role_name");

-- CreateIndex
CREATE INDEX "idx_roles_name" ON "swarm-rbac"."roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "function_permissions_function_name_key" ON "swarm-rbac"."function_permissions"("function_name");

-- CreateIndex
CREATE INDEX "idx_function_permissions_name" ON "swarm-rbac"."function_permissions"("function_name");

-- CreateIndex
CREATE INDEX "idx_role_function_permissions_role" ON "swarm-rbac"."role_function_permissions"("role_id");

-- CreateIndex
CREATE INDEX "idx_role_function_permissions_permission" ON "swarm-rbac"."role_function_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "idx_role_function_permissions_composite" ON "swarm-rbac"."role_function_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_function_permissions_role_id_permission_id_key" ON "swarm-rbac"."role_function_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "discount_coupons_code_key" ON "swarm-subscriptions"."discount_coupons"("code");

-- CreateIndex
CREATE INDEX "idx_subscriptions_user_id" ON "swarm-subscriptions"."subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_tier_id" ON "swarm-subscriptions"."subscriptions"("tier_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_status" ON "swarm-subscriptions"."subscriptions"("status");

-- CreateIndex
CREATE INDEX "idx_subscriptions_end_date" ON "swarm-subscriptions"."subscriptions"("end_date");

-- CreateIndex
CREATE INDEX "idx_subscriptions_coupon_id" ON "swarm-subscriptions"."subscriptions"("coupon_id");

-- CreateIndex
CREATE INDEX "idx_tools_user_id" ON "swarm-tool"."tools"("user_id");

-- CreateIndex
CREATE INDEX "idx_tools_company_id" ON "swarm-tool"."tools"("company_id");

-- CreateIndex
CREATE INDEX "idx_tools_is_public" ON "swarm-tool"."tools"("is_public");

-- CreateIndex
CREATE INDEX "idx_tools_name" ON "swarm-tool"."tools"("name");

-- CreateIndex
CREATE INDEX "idx_tools_slug" ON "swarm-tool"."tools"("slug");

-- CreateIndex
CREATE INDEX "idx_tools_status" ON "swarm-tool"."tools"("status");

-- CreateIndex
CREATE INDEX "idx_user_profiles_user_id" ON "swarm-user"."user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_profiles_country" ON "swarm-user"."user_profiles"("country");

-- CreateIndex
CREATE INDEX "idx_user_profiles_newsletter" ON "swarm-user"."user_profiles"("subscribe_newsletter");

-- CreateIndex
CREATE INDEX "idx_user_profiles_waitlist" ON "swarm-user"."user_profiles"("waitlist");

-- CreateIndex
CREATE INDEX "idx_user_profiles_created_at" ON "swarm-user"."user_profiles"("created_at");

-- CreateIndex
CREATE INDEX "idx_waitlist_position_history_entry_id" ON "swarm-waitlist"."waitlist_position_history"("waitlist_entry_id");

-- CreateIndex
CREATE INDEX "idx_waitlist_position_history_created_at" ON "swarm-waitlist"."waitlist_position_history"("created_at");

-- CreateIndex
CREATE INDEX "idx_waitlist_position_history_reason" ON "swarm-waitlist"."waitlist_position_history"("change_reason");

-- CreateIndex
CREATE INDEX "idx_waitlist_position_history_batch_id" ON "swarm-waitlist"."waitlist_position_history"("batch_id");

-- CreateIndex
CREATE INDEX "idx_waitlist_position_history_notification" ON "swarm-waitlist"."waitlist_position_history"("notification_sent");

-- CreateIndex
CREATE INDEX "idx_waitlist_analytics_date" ON "swarm-waitlist"."waitlist_analytics"("date");

-- CreateIndex
CREATE INDEX "idx_waitlist_analytics_created_at" ON "swarm-waitlist"."waitlist_analytics"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_analytics_date_key" ON "swarm-waitlist"."waitlist_analytics"("date");

-- CreateIndex
CREATE INDEX "idx_waitlist_questions_active" ON "swarm-waitlist"."waitlist_questions"("is_active");

-- CreateIndex
CREATE INDEX "idx_waitlist_questions_order" ON "swarm-waitlist"."waitlist_questions"("display_order");

-- CreateIndex
CREATE INDEX "idx_waitlist_questions_type" ON "swarm-waitlist"."waitlist_questions"("question_type");

-- CreateIndex
CREATE INDEX "idx_waitlist_questions_section" ON "swarm-waitlist"."waitlist_questions"("section_name");

-- CreateIndex
CREATE INDEX "idx_waitlist_questions_created_at" ON "swarm-waitlist"."waitlist_questions"("created_at");

-- CreateIndex
CREATE INDEX "idx_waitlist_question_options_question_id" ON "swarm-waitlist"."waitlist_question_options"("question_id");

-- CreateIndex
CREATE INDEX "idx_waitlist_question_options_order" ON "swarm-waitlist"."waitlist_question_options"("display_order");

-- CreateIndex
CREATE INDEX "idx_waitlist_question_options_active" ON "swarm-waitlist"."waitlist_question_options"("is_active");

-- CreateIndex
CREATE INDEX "idx_waitlist_responses_entry_id" ON "swarm-waitlist"."waitlist_responses"("waitlist_entry_id");

-- CreateIndex
CREATE INDEX "idx_waitlist_responses_question_id" ON "swarm-waitlist"."waitlist_responses"("question_id");

-- CreateIndex
CREATE INDEX "idx_waitlist_responses_valid" ON "swarm-waitlist"."waitlist_responses"("is_valid");

-- CreateIndex
CREATE INDEX "idx_waitlist_responses_created_at" ON "swarm-waitlist"."waitlist_responses"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_responses_waitlist_entry_id_question_id_key" ON "swarm-waitlist"."waitlist_responses"("waitlist_entry_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_settings_setting_key_key" ON "swarm-waitlist"."waitlist_settings"("setting_key");

-- CreateIndex
CREATE INDEX "idx_waitlist_settings_key" ON "swarm-waitlist"."waitlist_settings"("setting_key");

-- CreateIndex
CREATE INDEX "idx_waitlist_settings_category" ON "swarm-waitlist"."waitlist_settings"("category");

-- CreateIndex
CREATE INDEX "idx_waitlist_settings_public" ON "swarm-waitlist"."waitlist_settings"("is_public");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_campaigns_slug_key" ON "swarm-waitlist"."waitlist_campaigns"("slug");

-- CreateIndex
CREATE INDEX "idx_waitlist_campaigns_slug" ON "swarm-waitlist"."waitlist_campaigns"("slug");

-- CreateIndex
CREATE INDEX "idx_waitlist_campaigns_active" ON "swarm-waitlist"."waitlist_campaigns"("is_active");

-- CreateIndex
CREATE INDEX "idx_waitlist_campaigns_start_date" ON "swarm-waitlist"."waitlist_campaigns"("start_date");

-- CreateIndex
CREATE INDEX "idx_waitlist_campaigns_end_date" ON "swarm-waitlist"."waitlist_campaigns"("end_date");

-- CreateIndex
CREATE INDEX "idx_waitlist_campaign_entries_campaign_id" ON "swarm-waitlist"."waitlist_campaign_entries"("campaign_id");

-- CreateIndex
CREATE INDEX "idx_waitlist_campaign_entries_entry_id" ON "swarm-waitlist"."waitlist_campaign_entries"("waitlist_entry_id");

-- CreateIndex
CREATE INDEX "idx_waitlist_campaign_entries_joined_at" ON "swarm-waitlist"."waitlist_campaign_entries"("joined_at");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_campaign_entries_campaign_id_waitlist_entry_id_key" ON "swarm-waitlist"."waitlist_campaign_entries"("campaign_id", "waitlist_entry_id");

-- CreateIndex
CREATE INDEX "idx_waitlist_entries_user_id" ON "swarm-waitlist"."waitlist_entries"("user_id");

-- CreateIndex
CREATE INDEX "idx_waitlist_entries_email" ON "swarm-waitlist"."waitlist_entries"("email");

-- CreateIndex
CREATE INDEX "idx_waitlist_entries_status" ON "swarm-waitlist"."waitlist_entries"("status");

-- CreateIndex
CREATE INDEX "idx_waitlist_entries_position" ON "swarm-waitlist"."waitlist_entries"("position");

-- CreateIndex
CREATE INDEX "idx_waitlist_entries_created_at" ON "swarm-waitlist"."waitlist_entries"("created_at");

-- CreateIndex
CREATE INDEX "idx_waitlist_entries_priority_score" ON "swarm-waitlist"."waitlist_entries"("priority_score");

-- CreateIndex
CREATE INDEX "idx_waitlist_entries_referral_code" ON "swarm-waitlist"."waitlist_entries"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_email_key" ON "swarm-waitlist"."waitlist_entries"("email");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_user_id_key" ON "swarm-waitlist"."waitlist_entries"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhooks_endpoint_path_key" ON "swarm-webhook"."webhooks"("endpoint_path");

-- CreateIndex
CREATE UNIQUE INDEX "types_type_name_key" ON "swarm-workflow"."types"("type_name");

-- CreateIndex
CREATE INDEX "idx_workflows_user_id" ON "swarm-workflow"."workflows"("user_id");

-- CreateIndex
CREATE INDEX "idx_workflows_company_id" ON "swarm-workflow"."workflows"("company_id");

-- CreateIndex
CREATE INDEX "idx_workflows_is_public" ON "swarm-workflow"."workflows"("is_public");

-- CreateIndex
CREATE INDEX "idx_workflows_status" ON "swarm-workflow"."workflows"("status");

-- CreateIndex
CREATE INDEX "idx_workflows_created_at" ON "swarm-workflow"."workflows"("created_at");

-- CreateIndex
CREATE INDEX "idx_workflows_name" ON "swarm-workflow"."workflows"("workflow_name");

-- AddForeignKey
ALTER TABLE "swarm-agent"."templates" ADD CONSTRAINT "templates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "swarm-agent"."categories"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-agent"."templates" ADD CONSTRAINT "templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-agent"."prompts" ADD CONSTRAINT "prompts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "swarm-agent"."categories"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-agent"."prompts" ADD CONSTRAINT "prompts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "swarm-agent"."templates"("template_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-agent"."prompts" ADD CONSTRAINT "prompts_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "swarm-agent"."agents"("agent_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-agent"."prompts" ADD CONSTRAINT "prompts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-agent"."logs" ADD CONSTRAINT "logs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "swarm-agent"."agents"("agent_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-agent"."logs" ADD CONSTRAINT "logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-agent"."agent_bucket_accesses" ADD CONSTRAINT "agent_bucket_accesses_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "swarm-agent"."agents"("agent_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-agent"."agent_bucket_accesses" ADD CONSTRAINT "agent_bucket_accesses_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "swarm-file-storage"."buckets"("bucket_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-agent"."shares_users" ADD CONSTRAINT "shares_users_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "swarm-agent"."agents"("agent_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-agent"."agent_tools" ADD CONSTRAINT "agent_tools_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "swarm-agent"."agents"("agent_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-agent"."agent_tools" ADD CONSTRAINT "agent_tools_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "swarm-tool"."tools"("tool_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-agent"."agents" ADD CONSTRAINT "agents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-agent"."agents" ADD CONSTRAINT "agents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "swarm-agent"."categories"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-agent"."agents" ADD CONSTRAINT "agents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "swarm-agent"."templates"("template_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-blog"."blog_article_tags" ADD CONSTRAINT "blog_article_tags_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "swarm-blog"."blog_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-blog"."blog_article_tags" ADD CONSTRAINT "blog_article_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "swarm-blog"."blog_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-blog"."blog_articles" ADD CONSTRAINT "blog_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "swarm-blog"."blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-blog"."blog_article_translations" ADD CONSTRAINT "blog_article_translations_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "swarm-blog"."blog_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-blog"."blog_article_translations" ADD CONSTRAINT "blog_article_translations_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "swarm-blog"."supported_languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-blog"."blog_audio_files" ADD CONSTRAINT "blog_audio_files_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "swarm-blog"."blog_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-blog"."blog_audio_files" ADD CONSTRAINT "blog_audio_files_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "swarm-blog"."supported_languages"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-company"."user_companies" ADD CONSTRAINT "user_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-company"."user_companies" ADD CONSTRAINT "user_companies_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "swarm-rbac"."roles"("role_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-component"."component_agent_associations" ADD CONSTRAINT "component_agent_associations_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "swarm-component"."components"("component_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-component"."component_agent_associations" ADD CONSTRAINT "component_agent_associations_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "swarm-agent"."agents"("agent_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-component"."component_shares_users" ADD CONSTRAINT "component_shares_users_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "swarm-component"."components"("component_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-component"."component_shares_company_roles" ADD CONSTRAINT "component_shares_company_roles_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "swarm-component"."components"("component_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-component"."component_shares_company_roles" ADD CONSTRAINT "component_shares_company_roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-component"."component_shares_company_roles" ADD CONSTRAINT "component_shares_company_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "swarm-rbac"."roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-component"."component_versions" ADD CONSTRAINT "component_versions_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "swarm-component"."components"("component_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-component"."components" ADD CONSTRAINT "components_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "swarm-component"."component_sources"("source_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-component"."components" ADD CONSTRAINT "components_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "swarm-component"."component_types"("type_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-component"."components" ADD CONSTRAINT "components_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-cronjob"."cron_jobs" ADD CONSTRAINT "cron_jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-file-storage"."file_metadata" ADD CONSTRAINT "file_metadata_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "swarm-file-storage"."buckets"("bucket_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-file-storage"."file_metadata" ADD CONSTRAINT "file_metadata_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "swarm-user"."user_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-file-storage"."file_metadata" ADD CONSTRAINT "file_metadata_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-file-storage"."buckets" ADD CONSTRAINT "buckets_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "swarm-user"."user_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-file-storage"."buckets" ADD CONSTRAINT "buckets_associated_company_id_fkey" FOREIGN KEY ("associated_company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-file-storage"."file_shares_users" ADD CONSTRAINT "file_shares_users_shared_with_user_id_fkey" FOREIGN KEY ("shared_with_user_id") REFERENCES "swarm-user"."user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-file-storage"."file_shares_users" ADD CONSTRAINT "file_shares_users_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "swarm-file-storage"."file_metadata"("file_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-file-storage"."file_shares_company_roles" ADD CONSTRAINT "file_shares_company_roles_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "swarm-file-storage"."file_metadata"("file_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-file-storage"."file_shares_company_roles" ADD CONSTRAINT "file_shares_company_roles_shared_with_company_id_fkey" FOREIGN KEY ("shared_with_company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-file-storage"."file_shares_company_roles" ADD CONSTRAINT "file_shares_company_roles_shared_with_role_id_fkey" FOREIGN KEY ("shared_with_role_id") REFERENCES "swarm-rbac"."roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-file-storage"."file_embeddings" ADD CONSTRAINT "file_embeddings_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "swarm-file-storage"."file_metadata"("file_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-llmstxt"."llmstxt" ADD CONSTRAINT "llmstxt_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "swarm-agent"."agents"("agent_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-llmstxt"."llmstxt" ADD CONSTRAINT "llmstxt_llmstxt_id_fkey" FOREIGN KEY ("llmstxt_id") REFERENCES "swarm-llmstxt"."llmstxt_registry"("llmstxt_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-organization"."organizations" ADD CONSTRAINT "organizations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-rbac"."postgresql_user_roles" ADD CONSTRAINT "postgresql_user_roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-rbac"."role_function_permissions" ADD CONSTRAINT "role_function_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "swarm-rbac"."roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-rbac"."role_function_permissions" ADD CONSTRAINT "role_function_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "swarm-rbac"."function_permissions"("permission_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-subscriptions"."pricing_tiers" ADD CONSTRAINT "pricing_tiers_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "swarm-subscriptions"."pricing_profiles"("profile_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-subscriptions"."pricing_tiers" ADD CONSTRAINT "pricing_tiers_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "swarm-legal"."terms_and_conditions"("term_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-subscriptions"."pricing_tiers" ADD CONSTRAINT "pricing_tiers_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "swarm-legal"."privacy_policies"("policy_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-subscriptions"."subscriptions" ADD CONSTRAINT "subscriptions_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "swarm-subscriptions"."pricing_tiers"("tier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-subscriptions"."subscriptions" ADD CONSTRAINT "subscriptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "swarm-subscriptions"."discount_coupons"("coupon_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-team"."teams" ADD CONSTRAINT "teams_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-team"."team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "swarm-team"."teams"("team_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-team"."team_members" ADD CONSTRAINT "team_members_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "swarm-agent"."agents"("agent_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-tool"."tools" ADD CONSTRAINT "tools_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-tool"."tool_secrets" ADD CONSTRAINT "tool_secrets_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "swarm-tool"."tools"("tool_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-tool"."tool_secret_shares_users" ADD CONSTRAINT "tool_secret_shares_users_secret_id_fkey" FOREIGN KEY ("secret_id") REFERENCES "swarm-tool"."tool_secrets"("secret_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-tool"."tool_secret_shares_company_roles" ADD CONSTRAINT "tool_secret_shares_company_roles_secret_id_fkey" FOREIGN KEY ("secret_id") REFERENCES "swarm-tool"."tool_secrets"("secret_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-tool"."tool_secret_shares_company_roles" ADD CONSTRAINT "tool_secret_shares_company_roles_shared_with_company_id_fkey" FOREIGN KEY ("shared_with_company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-tool"."tool_secret_shares_company_roles" ADD CONSTRAINT "tool_secret_shares_company_roles_shared_with_role_id_fkey" FOREIGN KEY ("shared_with_role_id") REFERENCES "swarm-rbac"."roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-waitlist"."waitlist_position_history" ADD CONSTRAINT "waitlist_position_history_waitlist_entry_id_fkey" FOREIGN KEY ("waitlist_entry_id") REFERENCES "swarm-waitlist"."waitlist_entries"("waitlist_entry_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-waitlist"."waitlist_question_options" ADD CONSTRAINT "waitlist_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "swarm-waitlist"."waitlist_questions"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-waitlist"."waitlist_responses" ADD CONSTRAINT "waitlist_responses_waitlist_entry_id_fkey" FOREIGN KEY ("waitlist_entry_id") REFERENCES "swarm-waitlist"."waitlist_entries"("waitlist_entry_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-waitlist"."waitlist_responses" ADD CONSTRAINT "waitlist_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "swarm-waitlist"."waitlist_questions"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-waitlist"."waitlist_campaign_entries" ADD CONSTRAINT "waitlist_campaign_entries_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "swarm-waitlist"."waitlist_campaigns"("campaign_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-waitlist"."waitlist_campaign_entries" ADD CONSTRAINT "waitlist_campaign_entries_waitlist_entry_id_fkey" FOREIGN KEY ("waitlist_entry_id") REFERENCES "swarm-waitlist"."waitlist_entries"("waitlist_entry_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-webhook"."outgoing_webhooks" ADD CONSTRAINT "outgoing_webhooks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-webhook"."webhooks" ADD CONSTRAINT "webhooks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-workflow"."workflows" ADD CONSTRAINT "workflows_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "swarm-company"."companies"("company_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swarm-workflow"."workflows" ADD CONSTRAINT "workflows_workflow_type_id_fkey" FOREIGN KEY ("workflow_type_id") REFERENCES "swarm-workflow"."types"("type_id") ON DELETE SET NULL ON UPDATE CASCADE;
