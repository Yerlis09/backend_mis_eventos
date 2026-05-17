import { describe, it, expect } from 'vitest';
import { adminApi } from './admin';

describe('adminApi', () => {
  it('listUsers returns paginated users', async () => {
    const page = await adminApi.listUsers({ page: 1, size: 10 });
    expect(page.items).toHaveLength(1);
    expect(page.items[0].email).toBe('test@test.com');
    expect(page.total).toBe(1);
  });

  it('listUsers works without params', async () => {
    const page = await adminApi.listUsers();
    expect(page.items).toBeDefined();
  });

  it('updateRole returns user with new role', async () => {
    const user = await adminApi.updateRole(1, { role: 'organizer' });
    expect(user.id).toBe(1);
    expect(user.role).toBe('organizer');
  });

  it('updateActive returns user with new active state', async () => {
    const user = await adminApi.updateActive(1, { is_active: false });
    expect(user.id).toBe(1);
    expect(user.is_active).toBe(false);
  });
});
