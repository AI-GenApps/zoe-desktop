import { vi } from "vitest";

const _store: Record<string, number[]> = {};

export let strongholdShouldFail = false;
export function __setStrongholdShouldFail(val: boolean) {
  strongholdShouldFail = val;
}
export function __clearStore() {
  for (const k of Object.keys(_store)) delete _store[k];
}

const mockStore = {
  insert: vi.fn(async (key: string, value: number[]) => {
    _store[key] = value;
  }),
  get: vi.fn(async (key: string) => _store[key] ?? null),
  remove: vi.fn(async (key: string) => {
    delete _store[key];
  })
};

const mockClient = {
  getStore: vi.fn(() => mockStore)
};

const mockStronghold = {
  loadClient: vi.fn(async (_name: string) => mockClient),
  createClient: vi.fn(async (_name: string) => mockClient),
  save: vi.fn(async () => {})
};

export const Stronghold = {
  load: vi.fn(async (_path: string, _password: string) => {
    if (strongholdShouldFail) throw new Error("stronghold unavailable");
    return mockStronghold;
  })
};

export { mockStore, mockStronghold, mockClient };
