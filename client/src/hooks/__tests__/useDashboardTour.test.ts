import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useDashboardTour } from '../useDashboardTour';

class LocalStorageMock {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

describe('useDashboardTour', () => {
  beforeEach(() => {
    // @ts-ignore
    global.localStorage = new LocalStorageMock();
    // @ts-ignore
    global.fetch = async () => ({ ok: true });
  });

  it('starts when neither localStorage nor server flag set', async () => {
    const { result } = renderHook(() => useDashboardTour({ hasSeenDashboardTour: false }));
    await waitFor(() => result.current.shouldStart === true);
    assert.equal(result.current.shouldStart, true);
  });

  it('does not start when server flag true', async () => {
    const { result } = renderHook(() => useDashboardTour({ hasSeenDashboardTour: true }));
    await waitFor(() => result.current.shouldStart === false);
    assert.equal(result.current.shouldStart, false);
  });

  it('does not start when localStorage flag true', async () => {
    localStorage.setItem('ml_hasSeenDashboardTour_v1', '1');
    const { result } = renderHook(() => useDashboardTour({ hasSeenDashboardTour: false }));
    await waitFor(() => result.current.shouldStart === false);
    assert.equal(result.current.shouldStart, false);
  });

  it('completeTour sets flags and calls PATCH', async () => {
    let called = false;
    // @ts-ignore
    global.fetch = async (url: string, opts: any) => {
      if (url === '/api/me' && opts?.method === 'PATCH') called = true;
      return { ok: true };
    };
    const { result } = renderHook(() => useDashboardTour({ hasSeenDashboardTour: false }));
    await waitFor(() => result.current.shouldStart === true);
    await act(async () => {
      await result.current.completeTour();
    });
    assert.equal(localStorage.getItem('ml_hasSeenDashboardTour_v1'), '1');
    assert.equal(called, true);
    assert.equal(result.current.shouldStart, false);
  });

  it('startTour forces tour regardless of flags', () => {
    localStorage.setItem('ml_hasSeenDashboardTour_v1', '1');
    const { result } = renderHook(() => useDashboardTour({ hasSeenDashboardTour: true }));
    act(() => result.current.startTour());
    assert.equal(result.current.shouldStart, true);
  });
});
