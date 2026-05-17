import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:8000/api/v1';

export const mockUser = {
  id: 1,
  email: 'test@test.com',
  full_name: 'Test User',
  is_active: true,
  role: 'admin' as const,
};

export const mockEvent = {
  id: 1,
  name: 'Tech Summit 2026',
  description: 'A great tech event',
  capacity: 200,
  status: 'published' as const,
  creator_id: 1,
  sessions: [],
};

export const mockSession = {
  id: 1,
  title: 'Opening Keynote',
  speaker: 'Ana Martínez',
  start_datetime: '2026-06-01T09:00:00Z',
  end_datetime: '2026-06-01T10:00:00Z',
  capacity: 200,
};

export const mockRegistration = {
  id: 1,
  user_id: 1,
  event_id: 1,
  registered_at: '2026-05-15T12:00:00Z',
};

export const mockPage = <T>(items: T[]) => ({
  items,
  total: items.length,
  page: 1,
  size: 10,
  pages: 1,
});

export const handlers = [
  // ── Auth ──
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({ access_token: 'fake.jwt.token', token_type: 'bearer' }),
  ),
  http.post(`${BASE}/auth/register`, () =>
    HttpResponse.json(mockUser, { status: 201 }),
  ),
  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json(mockUser),
  ),

  // ── Events ──
  http.get(`${BASE}/events`, () =>
    HttpResponse.json(mockPage([mockEvent])),
  ),
  http.get(`${BASE}/events/:id`, () =>
    HttpResponse.json(mockEvent),
  ),
  http.post(`${BASE}/events`, () =>
    HttpResponse.json(mockEvent, { status: 201 }),
  ),
  http.put(`${BASE}/events/:id`, () =>
    HttpResponse.json(mockEvent),
  ),
  http.delete(`${BASE}/events/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  // ── Sessions ──
  http.get(`${BASE}/events/:eventId/sessions`, () =>
    HttpResponse.json(mockPage([mockSession])),
  ),
  http.post(`${BASE}/events/:eventId/sessions`, () =>
    HttpResponse.json(mockSession, { status: 201 }),
  ),
  http.put(`${BASE}/events/:eventId/sessions/:sessionId`, () =>
    HttpResponse.json(mockSession),
  ),
  http.delete(`${BASE}/events/:eventId/sessions/:sessionId`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  // ── Registrations ──
  http.post(`${BASE}/events/:eventId/register`, () =>
    HttpResponse.json(mockRegistration, { status: 201 }),
  ),
  http.delete(`${BASE}/events/:eventId/unregister`, () =>
    new HttpResponse(null, { status: 204 }),
  ),
  http.get(`${BASE}/my-registrations`, () =>
    HttpResponse.json(mockPage([mockRegistration])),
  ),

  // ── Admin ──
  http.get(`${BASE}/admin/users`, () =>
    HttpResponse.json(mockPage([mockUser])),
  ),
  http.patch(`${BASE}/admin/users/:id/role`, () =>
    HttpResponse.json({ ...mockUser, role: 'organizer' }),
  ),
  http.patch(`${BASE}/admin/users/:id/active`, () =>
    HttpResponse.json({ ...mockUser, is_active: false }),
  ),
];
