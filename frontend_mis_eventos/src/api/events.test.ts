import { describe, it, expect } from 'vitest';
import { eventsApi } from './events';

describe('eventsApi', () => {
  it('list returns paginated events', async () => {
    const page = await eventsApi.list({ page: 1, size: 6 });
    expect(page.items).toHaveLength(1);
    expect(page.items[0].name).toBe('Tech Summit 2026');
    expect(page.total).toBe(1);
  });

  it('list accepts search param', async () => {
    const page = await eventsApi.list({ search: 'Tech' });
    expect(page.items).toBeDefined();
  });

  it('getById returns event', async () => {
    const event = await eventsApi.getById(1);
    expect(event.id).toBe(1);
    expect(event.status).toBe('published');
  });

  it('create returns new event', async () => {
    const event = await eventsApi.create({ name: 'New Event', capacity: 100 });
    expect(event.name).toBe('Tech Summit 2026');
  });

  it('update returns updated event', async () => {
    const event = await eventsApi.update(1, { name: 'Updated' });
    expect(event.id).toBe(1);
  });

  it('remove resolves without error', async () => {
    await expect(eventsApi.remove(1)).resolves.toBeUndefined();
  });
});
