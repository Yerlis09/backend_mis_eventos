import { describe, it, expect } from 'vitest';
import { sessionsApi } from './sessions';

describe('sessionsApi', () => {
  it('list returns sessions for event', async () => {
    const page = await sessionsApi.list(1);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].title).toBe('Opening Keynote');
  });

  it('create returns new session', async () => {
    const session = await sessionsApi.create(1, {
      title: 'New Talk',
      speaker: 'John Doe',
      start_datetime: '2026-06-01T11:00:00Z',
      end_datetime: '2026-06-01T12:00:00Z',
      capacity: 100,
    });
    expect(session.title).toBe('Opening Keynote');
  });

  it('update returns updated session', async () => {
    const session = await sessionsApi.update(1, 1, { title: 'Updated Talk' });
    expect(session.id).toBe(1);
  });

  it('remove resolves without error', async () => {
    await expect(sessionsApi.remove(1, 1)).resolves.toBeUndefined();
  });
});
