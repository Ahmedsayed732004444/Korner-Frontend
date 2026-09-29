import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { isEmail, passwordProblems } from '@/features/auth'
import { useRoles, useSaveUser, useStaffUsers, useToggleUser, useUnlockUser, type StaffUser } from '@/features/adminAccess'
import { errorMessage } from '@/shared/api'
import { Alert, Badge, Button, Checkbox, ChoiceGroup, Input, Skeleton } from '@/shared/ui'
import { PasswordHints } from '../../auth/PasswordHints'
import styles from '../Admin.module.scss'

export function UsersTab({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation()
  const { data: users, isLoading, error } = useStaffUsers()
  const toggle = useToggleUser()
  const unlock = useUnlockUser()
  const [editing, setEditing] = useState<StaffUser | null | undefined>(undefined)
  const [staffOnly, setStaffOnly] = useState(true)
  const [search, setSearch] = useState('')
  const failure = toggle.error ?? unlock.error

  const shown = (users ?? [])
    .filter((user) => !staffOnly || user.roles.some((role) => role !== 'Member'))
    .filter((user) => `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <section className={styles.panel}>
      <div className={styles.headRow}>
        <h2>{t('admin.access.users')}</h2>
        {canWrite && editing === undefined && <Button onClick={() => setEditing(null)}>{t('admin.access.addUser')}</Button>}
      </div>
      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {failure && <Alert tone="error" title={errorMessage(failure, t)} />}
      {isLoading && <Skeleton style={{ height: 160 }} />}

      {editing !== undefined && <UserForm key={editing?.id ?? 'new'} user={editing} onDone={() => setEditing(undefined)} />}

      <div className={styles.filters}>
        <Input label={t('admin.orders.search')} type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Checkbox checked={staffOnly} onChange={(event) => setStaffOnly(event.target.checked)} label={t('admin.access.staffOnly')} />
      </div>

      <ul className={styles.list}>
        {shown.map((user) => (
          <li key={user.id} className={styles.lookupRow}>
            <span>
              <strong>
                {user.firstName} {user.lastName}
              </strong>{' '}
              {user.isDisabled && <Badge tone="warning">{t('admin.access.disabled')}</Badge>}
              <small dir="ltr">{user.email}</small>
              <small>{user.roles.join(' · ')}</small>
            </span>
            {canWrite && (
              <span className={styles.actions}>
                <Button size="sm" variant="secondary" onClick={() => setEditing(user)}>
                  {t('account.edit')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => toggle.mutate(user.id)} loading={toggle.isPending && toggle.variables === user.id}>
                  {user.isDisabled ? t('admin.access.enable') : t('admin.access.disable')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => unlock.mutate(user.id)} loading={unlock.isPending && unlock.variables === user.id}>
                  {t('admin.access.unlock')}
                </Button>
              </span>
            )}
          </li>
        ))}
        {users && shown.length === 0 && <li>{t('admin.orders.none')}</li>}
      </ul>
    </section>
  )
}

function UserForm({ user, onDone }: { user: StaffUser | null; onDone: () => void }) {
  const { t } = useTranslation()
  const { data: roles } = useRoles()
  const save = useSaveUser()
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [chosen, setChosen] = useState<string[]>(user?.roles.filter((role) => role !== 'Member') ?? [])
  const [errors, setErrors] = useState<Partial<Record<'firstName' | 'lastName' | 'email' | 'password' | 'roles', string>>>({})

  // Staff can hold any active role except Member, which customers get on their own.
  const available = (roles ?? []).filter((role) => !role.isDeleted && role.name !== 'Member')

  const clear = (field: keyof typeof errors) => setErrors((current) => ({ ...current, [field]: undefined }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const required = t('checkout.errors.required')
    const short = t('admin.access.nameLength')
    const found: typeof errors = {}
    if (firstName.trim().length < 3) found.firstName = firstName.trim() ? short : required
    if (lastName.trim().length < 3) found.lastName = lastName.trim() ? short : required
    if (!isEmail(email)) found.email = t('auth.errors.email')
    if (!user && passwordProblems(password).length > 0) found.password = t('auth.errors.password')
    if (chosen.length === 0) found.roles = t('admin.access.pickRole')
    setErrors(found)
    if (Object.keys(found).length > 0) return

    save.mutate({ id: user?.id ?? null, input: { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), roles: chosen }, password }, { onSuccess: onDone })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h3>{user ? t('admin.access.editUser') : t('admin.access.addUser')}</h3>
      {save.error && <Alert tone="error" title={errorMessage(save.error, t)} />}
      <div className={styles.twoCols}>
        <Input label={t('auth.firstName')} value={firstName} onChange={(event) => { setFirstName(event.target.value); clear('firstName') }} error={errors.firstName} required />
        <Input label={t('auth.lastName')} value={lastName} onChange={(event) => { setLastName(event.target.value); clear('lastName') }} error={errors.lastName} required />
        <Input label={t('auth.email')} type="email" dir="ltr" value={email} onChange={(event) => { setEmail(event.target.value); clear('email') }} error={errors.email} required />
        {!user && <Input label={t('auth.password')} type="password" value={password} onChange={(event) => { setPassword(event.target.value); clear('password') }} error={errors.password} autoComplete="new-password" required />}
      </div>
      {!user && <PasswordHints password={password} />}
      <ChoiceGroup legend={t('admin.access.roles')}>
        {errors.roles && <small role="alert" style={{ color: 'var(--color-error)' }}>{errors.roles}</small>}
        {available.map((role) => (
          <Checkbox
            key={role.id}
            checked={chosen.includes(role.name)}
            onChange={(event) => {
              setChosen((current) => (event.target.checked ? [...current, role.name] : current.filter((name) => name !== role.name)))
              clear('roles')
            }}
            label={role.name}
          />
        ))}
      </ChoiceGroup>
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
