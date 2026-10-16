import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { UrlSecurityRuleDto } from '#/api/chat/security';

import { h } from 'vue';

import { Switch, Tag } from 'antdv-next';

import { UrlRiskCategory, UrlSecurityLevel } from '#/api/chat/security';
import { $t } from '#/locales';

export const LEVEL_OPTIONS = [
  { label: '全部安全级别', value: undefined },
  { label: '安全 (白名单)', value: UrlSecurityLevel.Safe },
  { label: '警告 (提示中转)', value: UrlSecurityLevel.Warning },
  { label: '阻断 (黑名单)', value: UrlSecurityLevel.Blocked },
];

export const CATEGORY_OPTIONS = [
  { label: '全部分类', value: undefined },
  { label: '官方/白名单', value: UrlRiskCategory.OfficialOrWhitelisted },
  { label: '未认证第三方', value: UrlRiskCategory.UnknownThirdParty },
  { label: '电信诈骗', value: UrlRiskCategory.Fraud },
  { label: '仿冒钓鱼', value: UrlRiskCategory.Phishing },
  { label: '色情低俗', value: UrlRiskCategory.Porn },
  { label: '非法赌博', value: UrlRiskCategory.IllegalGambling },
  { label: '病毒木马', value: UrlRiskCategory.Malware },
  { label: '其它违规', value: UrlRiskCategory.Other },
];

export function getLevelTag(level: UrlSecurityLevel) {
  switch (level) {
    case UrlSecurityLevel.Blocked: {
      return h(Tag, { color: 'error' }, () => '阻断 (黑名单)');
    }
    case UrlSecurityLevel.Safe: {
      return h(Tag, { color: 'success' }, () => '安全 (白名单)');
    }
    case UrlSecurityLevel.Warning: {
      return h(Tag, { color: 'warning' }, () => '警告 (提示)');
    }
    default: {
      return h(Tag, {}, () => '未知');
    }
  }
}

export function getCategoryTag(category: UrlRiskCategory) {
  switch (category) {
    case UrlRiskCategory.Fraud: {
      return h(Tag, { color: 'red' }, () => '电信诈骗');
    }
    case UrlRiskCategory.IllegalGambling: {
      return h(Tag, { color: 'purple' }, () => '非法赌博');
    }
    case UrlRiskCategory.Malware: {
      return h(Tag, { color: 'orange' }, () => '病毒木马');
    }
    case UrlRiskCategory.OfficialOrWhitelisted: {
      return h(Tag, { color: 'cyan' }, () => '官方/白名单');
    }
    case UrlRiskCategory.Phishing: {
      return h(Tag, { color: 'volcano' }, () => '仿冒钓鱼');
    }
    case UrlRiskCategory.Porn: {
      return h(Tag, { color: 'magenta' }, () => '色情低俗');
    }
    case UrlRiskCategory.UnknownThirdParty: {
      return h(Tag, { color: 'default' }, () => '未认证第三方');
    }
    default: {
      return h(Tag, {}, () => '其它');
    }
  }
}

export function useColumns(
  onActionClick: OnActionClickFn<UrlSecurityRuleDto>,
  onToggleEnabled: (row: UrlSecurityRuleDto, checked: boolean) => void,
): VxeTableGridColumns<UrlSecurityRuleDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 55,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'host',
      minWidth: 200,
      title: '域名 / 匹配模式',
    },
    {
      field: 'level',
      slots: {
        default: ({ row }) => getLevelTag(row.level),
      },
      title: '安全级别',
      width: 130,
    },
    {
      field: 'category',
      slots: {
        default: ({ row }) => getCategoryTag(row.category),
      },
      title: '风险分类',
      width: 130,
    },
    {
      field: 'reason',
      formatter: 'formatEmpty',
      minWidth: 180,
      title: '拦截或放行原因说明',
    },
    {
      field: 'hitCount',
      title: '拦截命中数',
      width: 100,
    },
    {
      field: 'isEnabled',
      slots: {
        default: ({ row }) =>
          h(Switch, {
            checked: row.isEnabled,
            checkedChildren: '启用',
            onChange: (checked) => onToggleEnabled(row, Boolean(checked)),
            unCheckedChildren: '停用',
          }),
      },
      title: '状态',
      width: 95,
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      title: '创建时间',
      width: 165,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'host',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          { code: 'edit', text: $t('common.edit', '编辑') },
          { code: 'delete', text: $t('common.delete', '删除') },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('common.action', '操作'),
      width: 130,
    },
  ];
}
