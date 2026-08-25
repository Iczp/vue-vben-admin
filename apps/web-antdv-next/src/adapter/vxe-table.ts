import type { FormValues, TableActionProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { Recordable } from '@vben/types';

import type { ComponentPropsMap, ComponentType } from './component';

import { defineComponent, h } from 'vue';

import { useAccess } from '@vben/access';
import { VbenTableAction as VbenTableActionCore } from '@vben/common-ui';
import { Copy, IconifyIcon } from '@vben/icons';
import { $te } from '@vben/locales';
import {
  setupVbenVxeTable,
  useVbenVxeGrid as useGrid,
} from '@vben/plugins/vxe-table';
import { get, isFunction, isString } from '@vben/utils';

import { objectOmit } from '@vueuse/core';
import {
  Badge,
  Button,
  Image,
  message,
  Popconfirm,
  Progress,
  Switch,
  Tag,
  Tooltip,
} from 'antdv-next';
import dayjs from 'dayjs';

import { $t } from '#/locales';

import { useVbenForm } from './form';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        border: false,
        columnConfig: {
          resizable: true,
        },
        formConfig: {
          // 全局禁用vxe-table的表单配置，使用formOptions
          enabled: false,
        },
        minHeight: 180,
        proxyConfig: {
          autoLoad: true,
          response: {
            list: 'items',
            result: 'items',
            total: 'totalCount',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        round: true,
        showOverflow: true,
        size: 'small',
      } as VxeTableGridOptions,
    });

    /**
     * 解决vxeTable在热更新时可能会出错的问题
     */
    vxeUI.renderer.forEach((_item, key) => {
      if (key.startsWith('Cell')) {
        vxeUI.renderer.delete(key);
      }
    });

    // ==========================================
    // 1. 全局格式化函数 (DevExpress 风格 formatters)
    // ==========================================

    // 日期时间格式化: YYYY-MM-DD HH:mm:ss
    vxeUI.formats.add('formatDateTime', {
      cellFormatMethod({ cellValue }, format) {
        if (!cellValue) return '-';
        return dayjs(cellValue).format(
          isString(format) ? format : 'YYYY-MM-DD HH:mm:ss',
        );
      },
    });

    // 日期格式化: YYYY-MM-DD
    vxeUI.formats.add('formatDate', {
      cellFormatMethod({ cellValue }, format) {
        if (!cellValue) return '-';
        return dayjs(cellValue).format(
          isString(format) ? format : 'YYYY-MM-DD',
        );
      },
    });

    // 时间格式化: HH:mm:ss
    vxeUI.formats.add('formatTime', {
      cellFormatMethod({ cellValue }, format) {
        if (!cellValue) return '-';
        return dayjs(cellValue).format(isString(format) ? format : 'HH:mm:ss');
      },
    });

    // 布尔值格式化: true -> '是', false -> '否'
    vxeUI.formats.add('formatBool', {
      cellFormatMethod(
        { cellValue },
        trueText = $t('common.yes', '是'),
        falseText = $t('common.no', '否'),
      ) {
        if (cellValue === undefined || cellValue === null) return '-';
        return cellValue ? trueText : falseText;
      },
    });

    // 金额/数字千分位格式化: 12345.67 -> ￥12,345.67
    vxeUI.formats.add('formatAmount', {
      cellFormatMethod({ cellValue }, prefix = '￥', digits = 2) {
        if (cellValue === undefined || cellValue === null || isNaN(Number(cellValue))) return '-';
        const num = Number(cellValue).toFixed(digits);
        const parts = num.split('.');
        parts[0] = (parts[0] || '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return `${prefix}${parts.join('.')}`;
      },
    });

    // 百分比格式化: 0.856 -> 85.60%
    vxeUI.formats.add('formatPercent', {
      cellFormatMethod({ cellValue }, digits = 2) {
        if (cellValue === undefined || cellValue === null || isNaN(Number(cellValue))) return '-';
        return `${(Number(cellValue) * 100).toFixed(digits)}%`;
      },
    });

    // 空值兜底: null/undefined/'' -> '-'
    vxeUI.formats.add('formatEmpty', {
      cellFormatMethod({ cellValue }, fallback = '-') {
        return cellValue === undefined || cellValue === null || cellValue === ''
          ? fallback
          : cellValue;
      },
    });

    // ==========================================
    // 2. 自定义单元格渲染器 (DevExpress 风格 Renderers)
    // ==========================================

    // 图片渲染
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        return h(Image, { src: row[column.field], ...props });
      },
    });

    // 链接/按钮渲染
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        return h(
          Button,
          { size: 'small', type: 'link' },
          { default: () => props?.text },
        );
      },
    });

    // 状态/枚举 Tag 标签渲染
    vxeUI.renderer.add('CellTag', {
      renderTableDefault({ options, props }, { column, row }) {
        const value = get(row, column.field);
        const tagOptions = options ?? [
          { color: 'success', label: $t('common.enabled', '启用'), value: true },
          { color: 'error', label: $t('common.disabled', '禁用'), value: false },
        ];
        const tagItem = tagOptions.find((item: any) => item.value === value);
        return h(
          Tag,
          {
            ...props,
            ...objectOmit(tagItem ?? {}, ['label']),
          },
          { default: () => tagItem?.label ?? value },
        );
      },
    });

    // 徽标/圆点渲染
    vxeUI.renderer.add('CellBadge', {
      renderTableDefault({ options, props }, { column, row }) {
        const value = get(row, column.field);
        const badgeOptions = options ?? [
          { status: 'success', text: $t('common.enabled', '在线'), value: true },
          { status: 'default', text: $t('common.disabled', '离线'), value: false },
        ];
        const item = badgeOptions.find((b: any) => b.value === value);
        return h(Badge, {
          status: item?.status || 'default',
          text: item?.text || String(value),
          ...props,
        });
      },
    });

    // 进度条渲染
    vxeUI.renderer.add('CellProgress', {
      renderTableDefault({ props }, { column, row }) {
        const percent = Number(get(row, column.field)) || 0;
        return h(Progress, {
          percent,
          size: 'small',
          ...props,
        });
      },
    });

    // 跨环境通用剪贴板复制工具函数 (兼容 HTTP / 非安全上下文)
    function copyToClipboard(text: string) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise<void>((resolve, reject) => {
        try {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (successful) {
            resolve();
          } else {
            reject(new Error('execCommand failed'));
          }
        } catch (err) {
          reject(err);
        }
      });
    }

    // 可一键复制文本渲染
    vxeUI.renderer.add('CellCopyable', {
      renderTableDefault(_opts, { column, row }) {
        const text = String(get(row, column.field) ?? '');
        if (!text) return h('span', '-');

        return h('div', { class: 'inline-flex items-center gap-1 group' }, [
          h('span', { class: 'truncate max-w-[200px]', title: text }, text),
          h(
            Tooltip,
            { title: $t('common.copy', '点击复制') },
            {
              default: () =>
                h(
                  'a',
                  {
                    class:
                      'text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer',
                    onClick: async (e: MouseEvent) => {
                      e.stopPropagation();
                      try {
                        await copyToClipboard(text);
                        message.success($t('common.copySuccess', '复制成功'));
                      } catch {
                        message.error('复制失败，请手动复制');
                      }
                    },
                  },
                  [h(Copy, { class: 'size-3.5' })],
                ),
            },
          ),
        ]);
      },
    });

    // 开关 Switch 渲染
    vxeUI.renderer.add('CellSwitch', {
      renderTableDefault({ attrs, props }, { column, row }) {
        const loadingKey = `__loading_${column.field}`;
        const finallyProps = {
          checked: row[column.field],
          checkedChildren: $t('common.enabled', '启用'),
          checkedValue: true,
          loading: row[loadingKey] ?? false,
          'onUpdate:checked': onChange,
          unCheckedChildren: $t('common.disabled', '禁用'),
          unCheckedValue: false,
          ...props,
        };
        async function onChange(newVal: any) {
          row[loadingKey] = true;
          try {
            const result = await attrs?.beforeChange?.(newVal, row);
            if (result !== false) {
              row[column.field] = newVal;
            }
          } finally {
            row[loadingKey] = false;
          }
        }
        return h(Switch, finallyProps);
      },
    });

    // 表格操作按钮渲染器
    vxeUI.renderer.add('CellOperation', {
      renderTableDefault({ attrs, options, props }, { column, row }) {
        const defaultProps = { size: 'small', type: 'link', ...props };
        let align: string;
        switch (column.align) {
          case 'center': {
            align = 'center';
            break;
          }
          case 'left': {
            align = 'start';
            break;
          }
          default: {
            align = 'end';
            break;
          }
        }
        const presets: Recordable<Recordable<any>> = {
          delete: {
            danger: true,
            text: $t('common.delete', '删除'),
          },
          detail: {
            text: $t('common.detail', '详情'),
          },
          edit: {
            text: $t('common.edit', '编辑'),
          },
          permission: {
            text: $t('page.permission.title', '权限'),
          },
        };
        const operations: Array<Recordable<any>> = (
          options || ['edit', 'detail', 'delete']
        )
          .map((opt: any) => {
            if (isString(opt)) {
              return presets[opt]
                ? { code: opt, ...presets[opt], ...defaultProps }
                : {
                    code: opt,
                    text: $te(`common.${opt}`) ? $t(`common.${opt}`) : opt,
                    ...defaultProps,
                  };
            } else {
              return { ...defaultProps, ...presets[opt.code], ...opt };
            }
          })
          .map((opt: any) => {
            const optBtn: Recordable<any> = {};
            Object.keys(opt).forEach((key) => {
              optBtn[key] = isFunction(opt[key]) ? opt[key](row) : opt[key];
            });
            return optBtn;
          })
          .filter((opt: any) => opt.show !== false);

        function renderBtn(opt: Recordable<any>, listen = true) {
          return h(
            Button,
            {
              ...props,
              ...opt,
              icon: undefined,
              onClick: listen
                ? () =>
                    attrs?.onClick?.({
                      code: opt.code,
                      row,
                    })
                : undefined,
            },
            {
              default: () => {
                const content = [];
                if (opt.icon) {
                  content.push(
                    h(IconifyIcon, { class: 'size-5', icon: opt.icon }),
                  );
                }
                content.push(opt.text);
                return content;
              },
            },
          );
        }

        function renderConfirm(opt: Recordable<any>) {
          let viewportWrapper: HTMLElement | null = null;
          return h(
            Popconfirm,
            {
              getPopupContainer(el) {
                viewportWrapper = el.closest('.vxe-table--viewport-wrapper');
                return document.body;
              },
              placement: 'topLeft',
              title: $t('common.confirmDelete', '确认删除？'),
              ...props,
              ...opt,
              icon: undefined,
              onConfirm: () => {
                attrs?.onClick?.({
                  code: opt.code,
                  row,
                });
              },
              onOpenChange: (open: boolean) => {
                if (open) {
                  viewportWrapper?.style.setProperty('pointer-events', 'none');
                } else {
                  viewportWrapper?.style.removeProperty('pointer-events');
                }
              },
            },
            {
              default: () => renderBtn({ ...opt }, false),
              description: () =>
                h(
                  'div',
                  { class: 'truncate max-w-[200px]' },
                  `确定要删除【${row[attrs?.nameField || 'name'] || row.userName || row.clientId || row.id}】吗？`,
                ),
            },
          );
        }

        const btns = operations.map((opt) =>
          opt.code === 'delete' && attrs?.usePopconfirm !== false
            ? renderConfirm(opt)
            : renderBtn(opt),
        );
        return h(
          'div',
          {
            class: 'flex table-operations items-center gap-1',
            style: { justifyContent: align },
          },
          btns,
        );
      },
    });
  },
  useVbenForm,
});

export const useVbenVxeGrid = <
  T extends Record<string, any>,
  TFormValues extends FormValues = FormValues,
  TSubmitValues extends FormValues = TFormValues,
>(
  ...rest: Parameters<
    typeof useGrid<
      T,
      ComponentType,
      ComponentPropsMap,
      TFormValues,
      TSubmitValues
    >
  >
) =>
  useGrid<T, ComponentType, ComponentPropsMap, TFormValues, TSubmitValues>(
    ...rest,
  );

/**
 * 表格操作按钮组件
 */
export const VbenTableAction = defineComponent(
  (props: TableActionProps, { attrs, slots }) => {
    const { hasAccessByCodes } = useAccess();
    function hasPermission(auth?: string | string[]) {
      if (!auth) return true;
      return hasAccessByCodes(Array.isArray(auth) ? auth : [auth]);
    }
    return () =>
      h(VbenTableActionCore, { hasPermission, ...props, ...attrs }, slots);
  },
  {
    inheritAttrs: false,
    name: 'VbenTableAction',
  },
);

export type OnActionClickParams<T = Recordable<any>> = {
  code: string;
  row: T;
};
export type OnActionClickFn<T = Recordable<any>> = (
  params: OnActionClickParams<T>,
) => void;
export type * from '@vben/plugins/vxe-table';
