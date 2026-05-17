import { describe, it, expect } from 'vitest';
import { authApi } from './auth';

describe('authApi', () => {
  it('login returns access_token', async () => {
    const res = await authApi.login({ email: 'test@test.com', password: '12345678' });
    expect(res.access_token).toBe('fake.jwt.token');
    expect(res.token_type).toBe('bearer');
  });

  it('register returns user', async () => {
    const user = await authApi.register({
      email: 'new@test.com',
      password: '12345678',
      full_name: 'New User',
    });
    expect(user.email).toBe('test@test.com');
    expect(user.role).toBe('admin');
  });

  it('me returns current user', async () => {
    const user = await authApi.me();
    expect(user.id).toBe(1);
    expect(user.is_active).toBe(true);
  });
});
