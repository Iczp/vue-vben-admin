import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { ChatObjectDto } from '#/api/chat';

import { ChatObjectTypeEnums, VerificationMethodEnums } from '#/api/chat';

/**
 * 聊天对象综合列表列定义
 */
export function useColumns(
  onActionClick: OnActionClickFn<ChatObjectDto>,
): VxeTableGridColumns<ChatObjectDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 60,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'id',
      minWidth: 100,
      title: '对象 ID',
    },
    {
      field: 'name',
      minWidth: 140,
      title: '唯一账号 / 名称',
    },
    {
      field: 'displayName',
      formatter: 'formatEmpty',
      minWidth: 140,
      title: '显示昵称',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'default', label: '匿名', value: ChatObjectTypeEnums.Anonymous },
          { color: 'blue', label: '个人号', value: ChatObjectTypeEnums.Personal },
          { color: 'cyan', label: '群组/房间', value: ChatObjectTypeEnums.Room },
          { color: 'purple', label: '官方服务号', value: ChatObjectTypeEnums.Official },
          { color: 'orange', label: '订阅号', value: ChatObjectTypeEnums.Subscription },
          { color: 'magenta', label: '广场', value: ChatObjectTypeEnums.Square },
          { color: 'geekblue', label: '机器人', value: ChatObjectTypeEnums.Robot },
          { color: 'gold', label: '店长', value: ChatObjectTypeEnums.ShopKeeper },
          { color: 'lime', label: '店员', value: ChatObjectTypeEnums.ShopWaiter },
          { color: 'green', label: '客户', value: ChatObjectTypeEnums.Customer },
        ],
      },
      field: 'objectType',
      title: '对象类型',
      width: 120,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: '自由加入', value: VerificationMethodEnums.Free },
          { color: 'orange', label: '密码加群', value: VerificationMethodEnums.Password },
          { color: 'blue', label: '需管理员验证', value: VerificationMethodEnums.Verify },
        ],
      },
      field: 'verificationMethod',
      title: '加群/加好友方式',
      width: 130,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: '公开可搜', value: true },
          { color: 'default', label: '隐藏私密', value: false },
        ],
      },
      field: 'isPublic',
      title: '公开性',
      width: 100,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: '正常启用', value: true },
          { color: 'red', label: '已封禁/禁用', value: false },
        ],
      },
      field: 'isEnabled',
      title: '状态',
      width: 110,
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      minWidth: 165,
      title: '创建时间',
    },
    {
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          { code: 'edit', text: '编辑' },
          { code: 'verify_method', text: '验证方式' },
          {
            code: 'delete',
            props: { danger: true },
            text: '删除',
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 180,
    },
  ];
}
