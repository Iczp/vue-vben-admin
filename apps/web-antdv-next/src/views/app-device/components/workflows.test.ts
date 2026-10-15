/* eslint-disable vue/one-component-per-file -- Small DOM stubs exercise the workflow, not the UI library. */
import type { App, PropType } from 'vue';

import type { AppDevice, DeviceGroup } from '#/api/modules/app-device';

import { createApp, defineComponent, h, nextTick, reactive, ref } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DevicePicker from './device-picker.vue';
import MemberAction from './member-action.vue';

const api = vi.hoisted(() => ({
  devices: vi.fn(),
  members: vi.fn(),
  submit: vi.fn(),
  operation: vi.fn(),
  warning: vi.fn(),
}));
vi.mock('#/api/modules/app-device', () => ({
  getAppDevices: api.devices,
  updateAppDeviceGroupMembers: api.members,
  submitAppDeviceOperation: api.submit,
  getAppDeviceOperation: api.operation,
}));
vi.mock('antdv-next', () => {
  const Button = defineComponent({
    props: { disabled: Boolean, loading: Boolean },
    emits: ['click'],
    setup:
      (props, { slots, emit }) =>
      () =>
        h(
          'button',
          {
            disabled: props.disabled || props.loading,
            onClick: () => emit('click'),
          },
          slots.default?.(),
        ),
  });
  const Input = defineComponent({
    props: { value: { type: String, default: '' } },
    emits: ['update:value', 'search'],
    setup:
      (props, { emit }) =>
      () =>
        h('input', {
          value: props.value,
          onInput: (e: Event) =>
            emit('update:value', (e.target as HTMLInputElement).value),
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Enter') emit('search');
          },
        }),
  });
  return {
    Button,
    Input: Object.assign(Input, { Search: Input }),
    Select: defineComponent({ setup: () => () => h('span') }),
    Modal: defineComponent({
      props: { open: Boolean },
      setup:
        (props, { slots }) =>
        () =>
          props.open ? h('section', slots.default?.()) : null,
    }),
    Alert: defineComponent({
      props: { message: { type: String, default: '' } },
      setup: (props) => () => h('aside', props.message),
    }),
    Progress: defineComponent({
      props: { percent: { type: Number, default: 0 } },
      setup: (props) => () => h('progress', { value: props.percent, max: 100 }),
    }),
    Table: defineComponent({
      props: {
        dataSource: { type: Array as PropType<AppDevice[]>, default: () => [] },
        rowSelection: {
          type: Object as PropType<{
            getCheckboxProps: (row: AppDevice) => { disabled: boolean };
            onChange: (keys: string[], rows: AppDevice[]) => void;
            selectedRowKeys: string[];
            type: string;
          }>,
          required: true,
        },
      },
      setup: (props) => () =>
        h(
          'div',
          props.dataSource.map((row) =>
            h(
              'button',
              {
                disabled: props.rowSelection.getCheckboxProps(row).disabled,
                onClick: () => {
                  const selected = props.rowSelection.selectedRowKeys;
                  let keys = [row.id];
                  if (props.rowSelection.type !== 'radio')
                    keys = selected.includes(row.id)
                      ? selected.filter((id) => id !== row.id)
                      : [...selected, row.id];
                  props.rowSelection.onChange(
                    keys,
                    props.dataSource.filter((d) => keys.includes(d.id)),
                  );
                },
              },
              `选择 ${row.deviceId}`,
            ),
          ),
        ),
    }),
    message: { success: vi.fn(), warning: api.warning },
  };
});

let app: App | undefined;
let host: HTMLDivElement;
function button(text: string) {
  const match = [...host.querySelectorAll('button')].find(
    (b) => b.textContent?.trim() === text,
  );
  if (!match) throw new Error(`Missing button: ${text}`);
  return match;
}
async function flush() {
  for (let i = 0; i < 8; i++) {
    await Promise.resolve();
    await nextTick();
  }
}
const device = (id: string): AppDevice => ({
  id,
  appId: 'app',
  deviceId: id,
  profile: {},
  isEnabled: true,
  revision: 1,
  creationTime: '',
  concurrencyStamp: 'stamp',
  groupIds: [],
});
const group: DeviceGroup = {
  id: 'group',
  appId: 'app',
  name: '测试组',
  concurrencyStamp: 'stamp',
};
beforeEach(() => {
  vi.clearAllMocks();
  host = document.createElement('div');
  document.body.append(host);
});
afterEach(() => {
  app?.unmount();
  app = undefined;
  host.remove();
  vi.useRealTimers();
});

describe('device selection', () => {
  it('keeps selections across cursor pages, enforces the cap, and clears on AppId change', async () => {
    api.devices.mockImplementation(
      async ({ appId, afterId }: { afterId?: string; appId: string }) => {
        if (appId === 'other') return { items: [device('other')] };
        if (afterId) return { items: [device('c')] };
        return { items: [device('a'), device('b')], nextId: 'b' };
      },
    );
    const scope = reactive({ appId: 'app' });
    const open = ref(true);
    const confirm = vi.fn();
    app = createApp(() =>
      h(DevicePicker, {
        ...scope,
        max: 2,
        open: open.value,
        'onUpdate:open': (value) => {
          open.value = value;
        },
        onConfirm: confirm,
      }),
    );
    app.mount(host);
    await flush();
    button('选择 a').click();
    await flush();
    button('下一页').click();
    await flush();
    button('选择 c').click();
    await flush();
    expect(host.textContent).toContain('确定选择（2）');
    button('上一页').click();
    await flush();
    expect(button('选择 b').disabled).toBe(true);
    button('确定选择（2）').click();
    await flush();
    expect(confirm.mock.calls[0]?.[0].map((row: AppDevice) => row.id)).toEqual([
      'a',
      'c',
    ]);
    open.value = true;
    await flush();
    button('选择 a').click();
    await flush();
    scope.appId = 'other';
    await flush();
    expect(host.textContent).toContain('确定选择（0）');
    expect(host.textContent).toContain('选择 other');
  });
  it('supports single selection with the same confirmation workflow', async () => {
    api.devices.mockResolvedValue({ items: [device('a'), device('b')] });
    const confirm = vi.fn();
    app = createApp(() =>
      h(DevicePicker, {
        appId: 'app',
        multiple: false,
        open: true,
        onConfirm: confirm,
      }),
    );
    app.mount(host);
    await flush();
    button('选择 a').click();
    await flush();
    button('选择 b').click();
    await flush();
    button('确定选择（1）').click();
    expect(confirm.mock.calls[0]?.[0].map((row: AppDevice) => row.id)).toEqual([
      'b',
    ]);
  });
});
describe('member operations', () => {
  it('uses the synchronous API for a bounded batch and reports completion', async () => {
    api.members.mockResolvedValue(undefined);
    const action = ref<InstanceType<typeof MemberAction>>();
    const success = vi.fn();
    app = createApp(() =>
      h(MemberAction, { ref: action, appId: 'app', onSuccess: success }),
    );
    app.mount(host);
    action.value?.start(group, ['a', 'b'], false);
    await flush();
    button('确认移除').click();
    await flush();
    expect(api.members).toHaveBeenCalledWith('app', 'group', ['a', 'b'], false);
    expect(api.submit).not.toHaveBeenCalled();
    expect(success).toHaveBeenCalledOnce();
  });
  it('reuses the idempotency key after an uncertain submission and completes the job', async () => {
    api.submit
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({
        id: 'job',
        state: 'Pending',
        total: 201,
        processed: 0,
        attempts: 0,
      });
    api.operation.mockResolvedValue({
      id: 'job',
      state: 'Completed',
      total: 201,
      processed: 201,
      attempts: 0,
    });
    const action = ref<InstanceType<typeof MemberAction>>();
    const success = vi.fn();
    app = createApp(() =>
      h(MemberAction, { ref: action, appId: 'app', onSuccess: success }),
    );
    app.mount(host);
    action.value?.start(
      group,
      Array.from({ length: 201 }, (_, i) => `device-${i}`),
      true,
    );
    await flush();
    button('确认添加').click();
    await flush();
    button('确认添加').click();
    await flush();
    expect(api.submit.mock.calls[0]?.[0].requestKey).toBe(
      api.submit.mock.calls[1]?.[0].requestKey,
    );
    expect(api.submit.mock.calls[0]?.[0].requestKey).toMatch(/^[\da-f]{32}$/);
    expect(api.members).not.toHaveBeenCalled();
    expect(success).toHaveBeenCalledOnce();
    expect(host.textContent).toContain('已完成');
  });
  it('reports completion when an idempotent retry finds an already completed job', async () => {
    api.submit.mockResolvedValue({
      id: 'already-done',
      state: 'Completed',
      total: 201,
      processed: 201,
      attempts: 0,
    });
    const action = ref<InstanceType<typeof MemberAction>>();
    const success = vi.fn();
    app = createApp(() =>
      h(MemberAction, { ref: action, appId: 'app', onSuccess: success }),
    );
    app.mount(host);
    action.value?.start(
      group,
      Array.from({ length: 201 }, (_, i) => `${i}`),
      true,
    );
    await flush();
    button('确认添加').click();
    await flush();
    expect(success).toHaveBeenCalledOnce();
    expect(api.operation).not.toHaveBeenCalled();
    expect(host.textContent).toContain('已完成');
  });
  it('stops polling when hidden and resumes by ID when reopened', async () => {
    vi.useFakeTimers();
    const pending = {
      id: 'job',
      state: 'Pending',
      total: 201,
      processed: 0,
      attempts: 0,
    };
    api.submit.mockResolvedValue(pending);
    api.operation.mockResolvedValue(pending);
    const action = ref<InstanceType<typeof MemberAction>>();
    app = createApp(() => h(MemberAction, { ref: action, appId: 'app' }));
    app.mount(host);
    action.value?.start(
      group,
      Array.from({ length: 201 }, (_, i) => `${i}`),
      true,
    );
    await flush();
    button('确认添加').click();
    await flush();
    button('关闭').click();
    await flush();
    await vi.advanceTimersByTimeAsync(6000);
    expect(api.operation).toHaveBeenCalledTimes(1);
    button('查看上次成员任务').click();
    await flush();
    expect(api.operation).toHaveBeenCalledTimes(2);
    expect(api.operation).toHaveBeenLastCalledWith('app', 'job');
  });
});
