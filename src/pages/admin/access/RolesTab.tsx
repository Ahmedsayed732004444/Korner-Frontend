import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  groupPermissions,
  protectedRoles,
  togglePermission,
  usePermissionList,
  useRole,
  useRoles,
  useSaveRole,
  useToggleRole,
  type Role,
} from '@/features/adminAccess'
import { errorMessage } from '@/shared/api'
import { Alert, Badge, Button, Checkbox, ChoiceGroup, Input, Skeleton } from '@/shared/ui'
import styles from '../Admin.module.scss'

export function RolesTab({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation()
  const { data: roles, isLoading, error } = useRoles()
  const toggle = useToggleRole()
  // undefined = closed, 'new' = adding, an id = editing that role.
  const [editing, setEditing] = useState<string | 'new' | undefined>(undefined)

  return (
    <section className={styles.panel}>
      <div className={styles.headRow}>
        <h2>{t('admin.access.roles')}</h2>
        {canWrite && editing === undefined && <Button onClick={() => setEditing('new')}>{t('admin.access.addRole')}</Button>}
      </div>
      <p>{t('admin.access.rolesHint')}</p>
      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {toggle.error && <Alert tone="error" title={errorMessage(toggle.error, t)} />}
      {isLoading && <Skeleton style={{ height: 120 }} />}

      {editing !== undefined && <RoleLoader key={editing} id={editing === 'new' ? null : editing} onDone={() => setEditing(undefined)} />}

      <ul className={styles.list}>
        {roles?.map((role) => (
          <li key={role.id} className={styles.lookupRow}>
            <span>
              <strong>{role.name}</strong> {role.isDeleted && <Badge tone="warning">{t('admin.access.disabled')}</Badge>}
              {protectedRoles.includes(role.name) && <small>{t('admin.access.builtIn')}</small>}
            </span>
            {canWrite && !protectedRoles.includes(role.name) && (
              <span className={styles.actions}>
                <Button size="sm" variant="secondary" onClick={() => setEditing(role.id)}>
                  {t('account.edit')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => toggle.mutate(role.id)} loading={toggle.isPending && toggle.variables === role.id}>
                  {role.isDeleted ? t('admin.access.enable') : t('admin.access.disable')}
                </Button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function RoleLoader({ id, onDone }: { id: string | null; onDone: () => void }) {
  const { t } = useTranslation()
  const { data, isLoading, error } = useRole(id)
  if (id && isLoading) return <Skeleton style={{ height: 200 }} />
  if (id && (error || !data)) return <Alert tone="error" title={errorMessage(error, t)} />
  return <RoleForm role={data ?? null} onDone={onDone} />
}

function RoleForm({ role, onDone }: { role: (Role & { permissions: string[] }) | null; onDone: () => void }) {
  const { t } = useTranslation()
  const { data: all } = usePermissionList()
  const save = useSaveRole()
  const [name, setName] = useState(role?.name ?? '')
  const [selected, setSelected] = useState<string[]>(role?.permissions ?? [])
  const [errors, setErrors] = useState<{ name?: string; permissions?: string }>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const found = {
      name: name.trim() ? undefined : t('checkout.errors.required'),
      permissions: selected.length > 0 ? undefined : t('admin.access.pickPermission'),
    }
    setErrors(found)
    if (found.name || found.permissions) return
    save.mutate({ id: role?.id ?? null, name: name.trim(), permissions: selected }, { onSuccess: onDone })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h3>{role ? t('admin.access.editRole') : t('admin.access.addRole')}</h3>
      {save.error && <Alert tone="error" title={errorMessage(save.error, t)} />}
      <Input label={t('admin.access.roleName')} value={name} onChange={(event) => { setName(event.target.value); setErrors((c) => ({ ...c, name: undefined })) }} error={errors.name} required />
      {errors.permissions && <Alert tone="error" title={errors.permissions} />}
      <div className={styles.twoCols}>
        {groupPermissions(all ?? []).map((group) => (
          <ChoiceGroup key={group.area} legend={t(`admin.access.areas.${group.area}`, { defaultValue: group.area })}>
            {group.permissions.map((permission) => (
              <Checkbox
                key={permission}
                checked={selected.includes(permission)}
                onChange={(event) => {
                  setSelected((current) => togglePermission(current, permission, event.target.checked))
                  setErrors((c) => ({ ...c, permissions: undefined }))
                }}
                label={t(`admin.access.actions.${permission.split(':')[1]}`, { defaultValue: permission.split(':')[1] })}
              />
            ))}
          </ChoiceGroup>
        ))}
      </div>
      <div className={styles.actions}>
        <Button type="submit" loading={save.isPending}>
          {t('account.save')}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {t('account.cancelEdit')}
        </Button>
      </div>
    </form>
  )
}
