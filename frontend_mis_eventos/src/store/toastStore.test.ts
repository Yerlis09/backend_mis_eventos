import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToastStore, toast } from './toastStore';

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useToastStore', () => {
  it('push adds a toast with default type info', () => {
    useToastStore.getState().push('Hello');
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Hello');
    expect(toasts[0].type).toBe('info');
  });

  it('push adds a toast with given type', () => {
    useToastStore.getState().push('Error!', 'error');
    const { toasts } = useToastStore.getState();
    expect(toasts[0].type).toBe('error');
  });

  it('remove deletes toast by id', () => {
    useToastStore.getState().push('To remove', 'success');
    const { toasts } = useToastStore.getState();
    const id = toasts[0].id;
    useToastStore.getState().remove(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('toast auto-removes after duration', () => {
    useToastStore.getState().push('Temp', 'info', 1000);
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('multiple toasts stack independently', () => {
    useToastStore.getState().push('A', 'success');
    useToastStore.getState().push('B', 'error');
    expect(useToastStore.getState().toasts).toHaveLength(2);
  });
});

describe('toast helpers', () => {
  it('toast.success pushes success type', () => {
    toast.success('Done');
    expect(useToastStore.getState().toasts[0].type).toBe('success');
  });

  it('toast.error pushes error type', () => {
    toast.error('Oops');
    expect(useToastStore.getState().toasts[0].type).toBe('error');
  });

  it('toast.info pushes info type', () => {
    toast.info('FYI');
    expect(useToastStore.getState().toasts[0].type).toBe('info');
  });

  it('toast.warning pushes warning type', () => {
    toast.warning('Watch out');
    expect(useToastStore.getState().toasts[0].type).toBe('warning');
  });
});
