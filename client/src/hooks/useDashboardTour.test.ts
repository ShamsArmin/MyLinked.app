import { test } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useDashboardTour } from './useDashboardTour';

const LS_KEY = 'ml_hasSeenDashboardTour_v1';

function setupLS(initial?: string) {
  const store: Record<string, string> = initial ? { [LS_KEY]: initial } : {};
  global.localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const key in store) delete store[key];
    },
  } as any;
  return store;
}

test('shouldStart is true when profile and LS unset', async () => {
  setupLS();
  let hook: any;
  const Comp = () => {
    hook = useDashboardTour({ hasSeenDashboardTour: false });
    return null;
  };
  await act(async () => {
    TestRenderer.create(<Comp />);
  });
  assert.equal(hook.shouldStart, true);
});

test('completeTour sets flag', async () => {
  const store = setupLS();
  let called = false;
  global.fetch = async () => {
    called = true;
    return { ok: true } as any;
  };
  let hook: any;
  const Comp = () => {
    hook = useDashboardTour({ hasSeenDashboardTour: false });
    return null;
  };
  await act(async () => {
    TestRenderer.create(<Comp />);
  });
  await act(async () => {
    await hook.completeTour();
  });
  assert.equal(store[LS_KEY], '1');
  assert.ok(called);
  assert.equal(hook.shouldStart, false);
});

test('startTour forces tour', async () => {
  setupLS('1');
  let hook: any;
  const Comp = () => {
    hook = useDashboardTour({ hasSeenDashboardTour: true });
    return null;
  };
  await act(async () => {
    TestRenderer.create(<Comp />);
  });
  assert.equal(hook.shouldStart, false);
  await act(() => {
    hook.startTour();
  });
  assert.equal(hook.shouldStart, true);
});
