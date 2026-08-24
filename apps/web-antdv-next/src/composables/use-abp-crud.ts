import type { PagedResultDto } from '#/api/abp/types';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Modal, message } from 'antdv-next';

import { type VxeTableGridOptions, useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';

export interface UseAbpCrudOptions<
  TEntity extends { id?: number | string },
  TQuery extends Record<string, any> = Record<string, any>,
> {
  /**
   * 表格列定义函数
   */
  columns: (helpers: {
    onAction: (params: { code: string; row: TEntity }) => void;
    onDelete: (row: TEntity) => void;
    onDetail?: (row: TEntity) => void;
    onEdit: (row: TEntity) => void;
    onPermission: (row: TEntity, providerName?: string) => void;
  }) => any[];

  /**
   * 默认初始查询参数
   */
  defaultQueryParams?: TQuery;

  /**
   * 详情弹窗组件
   */
  detailComponent?: any;

  /**
   * 表单弹窗组件（新增/编辑）
   */
  formComponent?: any;

  /**
   * 获取实体的显示名称（用于删除提示）
   */
  getEntityTitle?: (row: TEntity) => string;

  /**
   * 自定义 Grid 事件
   */
  gridEvents?: Record<string, any>;

  /**
   * 实体名称或多语言键
   */
  name?: string;

  /**
   * 自定义详情处理函数
   */
  onDetail?: (row: TEntity) => void;

  /**
   * 默认分页大小，默认 10
   */
  pageSize?: number;

  /**
   * 权限弹窗组件
   */
  permissionComponent?: any;

  /**
   * 统一 API 接口
   */
  service: {
    create?: (data: any) => Promise<any>;
    delete?: (id: any) => Promise<any>;
    get?: (id: any) => Promise<TEntity>;
    list: (params: any) => Promise<PagedResultDto<TEntity>>;
    update?: (id: any, data: any) => Promise<any>;
  };
}

/**
 * ABP vNext 通用 CRUD Composable
 * 统一封装了：
 * 1. ABP 分页参数转换 (currentPage + pageSize -> skipCount + maxResultCount)
 * 2. 排序参数转换 (sorts -> sorting: "Field asc|desc")
 * 3. 表格行双击统一行为：有详情进入详情，无详情进入编辑 (cellDblclick)
 * 4. 搜索过滤与自动刷新
 * 5. 新增/编辑/详情弹窗状态管理 (useVbenModal)
 * 6. 删除确认对话框与统一提示
 * 7. 权限弹窗快捷唤起
 */
export function useAbpCrud<
  TEntity extends { id?: number | string },
  TQuery extends Record<string, any> = Record<string, any>,
>(options: UseAbpCrudOptions<TEntity, TQuery>) {
  const queryParams = ref<TQuery>((options.defaultQueryParams || {}) as TQuery);

  // 表单弹窗（新增/编辑）
  const [FormModal, formModalApi] = options.formComponent
    ? useVbenModal({
        connectedComponent: options.formComponent,
        destroyOnClose: true,
      })
    : [null, null];

  // 详情弹窗
  const [DetailModal, detailModalApi] = options.detailComponent
    ? useVbenModal({
        connectedComponent: options.detailComponent,
        destroyOnClose: true,
      })
    : [null, null];

  // 权限弹窗
  const [PermModal, permModalApi] = options.permissionComponent
    ? useVbenModal({
        connectedComponent: options.permissionComponent,
        destroyOnClose: true,
      })
    : [null, null];

  /**
   * 打开创建弹窗
   */
  function onCreate() {
    formModalApi?.setData(null).open();
  }

  /**
   * 打开编辑弹窗
   */
  function onEdit(row: TEntity) {
    formModalApi?.setData(row).open();
  }

  /**
   * 打开详情弹窗
   */
  function onDetail(row: TEntity) {
    if (options.onDetail) {
      options.onDetail(row);
    } else if (detailModalApi) {
      detailModalApi.setData(row).open();
    } else {
      onEdit(row);
    }
  }

  /**
   * 打开权限分配弹窗
   */
  function onPermission(row: TEntity, providerName: string = 'U') {
    const title = options.getEntityTitle
      ? options.getEntityTitle(row)
      : (row as any).name || (row as any).userName || row.id;
    permModalApi
      ?.setData({
        displayName: title,
        providerKey: (row as any).name || row.id,
        providerName,
      })
      .open();
  }

  /**
   * 确认并删除实体
   */
  function onDelete(row: TEntity) {
    if (!options.service.delete || !row.id) return;
    const title = options.getEntityTitle
      ? options.getEntityTitle(row)
      : (row as any).name ||
        (row as any).userName ||
        (row as any).clientId ||
        row.id;

    Modal.confirm({
      cancelText: $t('common.cancel', '取消'),
      content: $t('ui.actionMessage.deleteConfirm', [`【${title}】`]),
      okText: $t('common.confirm', '确认'),
      okType: 'danger',
      async onOk() {
        if (row.id) {
          await options.service.delete?.(row.id);
          message.success($t('common.deleteSuccess', '删除成功'));
          refresh();
        }
      },
    });
  }

  /**
   * 处理通用动作点击
   */
  function onActionClick({ code, row }: { code: string; row: TEntity }) {
    switch (code) {
      case 'delete': {
        onDelete(row);
        break;
      }
      case 'detail': {
        onDetail(row);
        break;
      }
      case 'edit': {
        onEdit(row);
        break;
      }
      case 'permission': {
        onPermission(row);
        break;
      }
    }
  }

  // 初始化表格 Grid
  const [Grid, gridApi] = useVbenVxeGrid({
    gridEvents: {
      // 统一双击事件：有详情打开详情，无详情打开修改/编辑
      cellDblclick: (params: { row: TEntity }) => {
        if (options.detailComponent || options.onDetail) {
          onDetail(params.row);
        } else {
          onEdit(params.row);
        }
      },
      ...options.gridEvents,
    },
    gridOptions: {
      columns: options.columns({
        onAction: onActionClick,
        onDelete,
        onDetail,
        onEdit,
        onPermission,
      }),
      height: 'auto',
      keepSource: true,
      pagerConfig: {
        autoHidden: false,
        enabled: true,
        pageSize: options.pageSize || 10,
        pageSizes: [10, 20, 50, 100],
      },
      proxyConfig: {
        ajax: {
          query: async ({ page, sorts }) => {
            const skipCount = (page.currentPage - 1) * page.pageSize;
            const maxResultCount = page.pageSize;
            let sorting: string | undefined;

            if (sorts && sorts.length > 0) {
              const sort = sorts[0];
              if (sort?.field) {
                sorting = `${sort.field} ${sort.order}`;
              }
            }

            return await options.service.list({
              ...queryParams.value,
              maxResultCount,
              skipCount,
              sorting,
            });
          },
        },
      },
      toolbarConfig: {
        custom: true,
        export: false,
        refresh: true,
        zoom: true,
      },
    } as VxeTableGridOptions,
  });

  /**
   * 刷新表格数据
   */
  function refresh() {
    gridApi.query();
  }

  /**
   * 设置搜索参数并刷新
   */
  function search(params: Partial<TQuery>) {
    queryParams.value = {
      ...queryParams.value,
      ...params,
    };
    refresh();
  }

  /**
   * 重置搜索参数并刷新
   */
  function resetSearch() {
    queryParams.value = (options.defaultQueryParams || {}) as TQuery;
    refresh();
  }

  return {
    DetailModal,
    FormModal,
    Grid,
    PermModal,
    detailModalApi,
    formModalApi,
    gridApi,
    onActionClick,
    onCreate,
    onDelete,
    onDetail,
    onEdit,
    onPermission,
    permModalApi,
    queryParams,
    refresh,
    resetSearch,
    search,
  };
}
