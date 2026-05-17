// ── Auth ──────────────────────────────────────────────
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export type UserRole = 'attendee' | 'organizer' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  role: UserRole;
}

// ── Events ────────────────────────────────────────────
export type EventStatus = 'draft' | 'published' | 'cancelled';

export interface EventSession {
  id: number;
  title: string;
  speaker: string;
  start_datetime: string;
  end_datetime: string;
  capacity: number;
}

export interface Event {
  id: number;
  name: string;
  description: string | null;
  capacity: number;
  status: EventStatus;
  creator_id: number;
  sessions: EventSession[];
}

export interface EventCreatePayload {
  name: string;
  description?: string;
  capacity: number;
  status?: EventStatus;
}

export interface EventUpdatePayload {
  name?: string;
  description?: string;
  capacity?: number;
  status?: EventStatus;
}

// ── Sessions ──────────────────────────────────────────
export interface SessionCreatePayload {
  title: string;
  speaker: string;
  start_datetime: string;
  end_datetime: string;
  capacity: number;
}

export interface SessionUpdatePayload {
  title?: string;
  speaker?: string;
  start_datetime?: string;
  end_datetime?: string;
  capacity?: number;
}

// ── Registrations ─────────────────────────────────────
export interface Registration {
  id: number;
  user_id: number;
  event_id: number;
  registered_at: string;
}

// ── Pagination ────────────────────────────────────────
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
}

// ── Admin ─────────────────────────────────────────────
export interface UserRoleUpdate {
  role: UserRole;
}

export interface UserActiveUpdate {
  is_active: boolean;
}
