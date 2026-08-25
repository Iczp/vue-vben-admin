import type { Plugin } from 'vite';

const FORM_FIELD_SLOT_MIGRATION_WARNING =
  '[Vben Form] BREAKING CHANGE: Named field slot control bindings moved to `slotProps.componentProps`. Replace `v-bind="slotProps"` with `v-bind="slotProps.componentProps"`. See https://doc.vben.pro/components/common-ui/vben-form.html';

function viteFormFieldSlotMigrationWarningPlugin(): Plugin {
  return {
    name: 'vite:form-field-slot-migration-warning',
  };
}

export {
  FORM_FIELD_SLOT_MIGRATION_WARNING,
  viteFormFieldSlotMigrationWarningPlugin,
};
