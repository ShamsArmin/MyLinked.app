import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useDashboardTour } from '../useDashboardTour';

function renderHook(profile?: { hasSeenDashboardTour?: boolean }) {
  let result: ReturnType<typeof useDashboardTour> = {} as any;
  function Test(props: { profile?: { hasSeenDashboardTour?: boolean } }) {
    result = useDashboardTour(props.profile);
    return null;
  }
  const renderer = TestRenderer.create(<Test profile={profile} />);
  return {
    result,
    rerender: (p?: { hasSeenDashboardTour?: boolean }) => renderer.update(<Test profile={p} />),
  };
}

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
    const { result } = renderHook({ hasSeenDashboardTour: false });
    await act(async () => {});
    assert.equal(result.shouldStart, true);
  });

  it('does not start when server flag true', async () => {
    const { result } = renderHook({ hasSeenDashboardTour: true });
    await act(async () => {});
    assert.equal(result.shouldStart, false);
  });

  it('does not start when localStorage flag true', async () => {
    localStorage.setItem('ml_hasSeenDashboardTour_v1', '1');
    const { result } = renderHook({ hasSeenDashboardTour: false });
    await act(async () => {});
    assert.equal(result.shouldStart, false);
  });

  it('completeTour sets flags and calls PATCH', async () => {
    let called = false;
    // @ts-ignore
    global.fetch = async (url: string, opts: any) => {
      if (url === '/api/me' && opts?.method === 'PATCH') called = true;
      return { ok: true };
    };
    const { result } = renderHook({ hasSeenDashboardTour: false });
    await act(async () => {});
    await act(async () => {
      await result.completeTour();
    });
    assert.equal(localStorage.getItem('ml_hasSeenDashboardTour_v1'), '1');
    assert.equal(called, true);
    assert.equal(result.shouldStart, false);
  });

  it('startTour forces tour regardless of flags', () => {
    localStorage.setItem('ml_hasSeenDashboardTour_v1', '1');
    const { result } = renderHook({ hasSeenDashboardTour: true });
    act(() => {
      result.startTour();
    });
    assert.equal(result.shouldStart, true);
  });
});
