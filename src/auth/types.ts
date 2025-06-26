/**
 * Interface for the 'amr' (Authentication Methods References) claim array.
 */
export interface Amr {
  method: string;
  timestamp: number;
}

/**
 * Interface for the 'app_metadata' object.
 * This typically contains non-user-editable information.
 */
export interface AppMetadata {
  provider: string;
  providers: string[];
}

/**
 * Interface for the 'user_metadata' object.
 * This contains user-specific, editable information.
 */
export interface UserMetadata {
  avatar_url: string;
  email: string;
  email_verified: boolean;
  full_name: string;
  iss: string;
  name: string;
  phone_verified: boolean;
  picture: string;
  provider_id: string;
  sub: string;
}

/**
 * Main interface for the decoded Supabase JWT payload.
 */
export interface SupabaseJwtPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  email: string;
  phone: string;
  app_metadata: AppMetadata;
  user_metadata: UserMetadata;
  role: string;
  aal: string;
  amr: Amr[];
  session_id: string;
  is_anonymous: boolean;
}
