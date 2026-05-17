import { describe, it, expect } from 'vitest';
import { registrationsApi } from './registrations';

describe('registrationsApi', () => {
  it('register returns registration', async () => {
    const reg = await registrationsApi.register(1);
    expect(reg.event_id).toBe(1);
    expect(reg.user_id).toBe(1);
  });

  it('unregister resolves without error', async () => {
    await expect(registrationsApi.unregister(1)).resolves.toBeUndefined();
  });

  it('myRegistrations returns paginated list', async () => {
    const page = await registrationsApi.myRegistrations({ page: 1, size: 10 });
    expect(page.items).toHaveLength(1);
    expect(page.items[0].event_id).toBe(1);
  });
});
