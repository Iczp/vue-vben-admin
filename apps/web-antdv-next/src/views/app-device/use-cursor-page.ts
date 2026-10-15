import type { CursorPage } from '#/api/modules/app-device';
import { computed, onScopeDispose, ref, shallowRef } from 'vue';

export function useCursorPage<T>(loader: (afterId: string | undefined, take: number) => Promise<CursorPage<T>>) {
  const items = shallowRef<T[]>([]);
  const loading = ref(false);
  const failed = ref(false);
  const take = ref(50);
  const cursors = ref<(string | undefined)[]>([undefined]);
  const index = ref(0);
  const nextId = ref<null | string>();
  let generation = 0;
  async function load(target = index.value) {
    const version = ++generation;
    loading.value = true;
    failed.value = false;
    try {
      const result = await loader(cursors.value[target], take.value);
      if (version !== generation) return false;
      items.value = result.items;
      nextId.value = result.nextId;
      index.value = target;
      return true;
    } catch {
      if (version === generation) failed.value = true;
      return false; // The shared request interceptor displays the ABP error.
    } finally {
      if (version === generation) loading.value = false;
    }
  }
  async function reset() {
    items.value = [];
    index.value = 0;
    cursors.value = [undefined];
    nextId.value = null;
    return load(0);
  }
  async function next() {
    if (loading.value || !nextId.value) return;
    cursors.value[index.value + 1] = nextId.value;
    await load(index.value + 1);
  }
  async function previous() {
    if (!loading.value && index.value > 0) await load(index.value - 1);
  }
  function clear() {
    generation++;
    items.value = [];
    nextId.value = null;
    index.value = 0;
    cursors.value = [undefined];
    loading.value = false;
    failed.value = false;
  }
  onScopeDispose(() => { generation++; });
  return { items, loading, failed, take, page: computed(() => index.value + 1), hasPrevious: computed(() => index.value > 0), hasNext: computed(() => Boolean(nextId.value)), load, reset, next, previous, clear };
}
