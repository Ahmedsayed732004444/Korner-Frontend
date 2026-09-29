import { useState, type FormEvent, type MouseEvent } from 'react'
import { Languages, Menu, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AccountButton, signOut } from '@/features/auth'
import { CartButton } from '@/features/cart'
import { useCategoryTree, type CategoryNode } from '@/features/catalog'
import { useSession } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { Button, Drawer, Input, Logo } from '@/shared/ui'
import styles from './Layout.module.scss'

const maxDesktopCategories = 5

export function Header() {
  const { t, i18n } = useTranslation()
  const localize = useLocalize()
  const { data: categories = [] } = useCategoryTree()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const categoryPath = (category: CategoryNode) => `/c/${localize(category.slugAr, category.slugEn)}`
  const switchLanguage = () => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        <button type="button" className={`${styles.iconButton} ${styles.mobileOnly}`} onClick={() => setMenuOpen(true)} aria-label={t('layout.openMenu')}>
          <Menu size={24} strokeWidth={1.75} aria-hidden="true" />
        </button>

        <Logo />

        <nav aria-label={t('layout.mainNav')} className={styles.desktopNav}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? styles.navActive : undefined)}>
            {t('common.home')}
          </NavLink>
          {categories.slice(0, maxDesktopCategories).map((category) => (
            <NavLink key={category.id} to={categoryPath(category)} className={({ isActive }) => (isActive ? styles.navActive : undefined)}>
              {localize(category.nameAr, category.nameEn)}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <button type="button" className={styles.iconButton} onClick={() => setSearchOpen(true)} aria-label={t('layout.search')}>
            <Search size={22} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button type="button" className={`${styles.languageButton} ${styles.desktopOnly}`} onClick={switchLanguage} lang={i18n.language === 'ar' ? 'en' : 'ar'}>
            <Languages size={18} aria-hidden="true" />
            {t('common.switchLanguage')}
          </button>
          <span className={styles.desktopOnly}>
            <AccountButton />
          </span>
          <CartButton />
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} categories={categories} categoryPath={categoryPath} onSwitchLanguage={switchLanguage} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  categories: CategoryNode[]
  categoryPath: (category: CategoryNode) => string
  onSwitchLanguage: () => void
}

function MobileMenu({ open, onClose, categories, categoryPath, onSwitchLanguage }: MobileMenuProps) {
  const { t, i18n } = useTranslation()
  const localize = useLocalize()
  const current = useSession()

  // Following any link inside the menu closes it.
  const closeOnLink = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest('a')) onClose()
  }

  return (
    <Drawer open={open} onClose={onClose} title={t('layout.menu')} side="start">
      <div onClick={closeOnLink}>
        <nav aria-label={t('layout.mainNav')} className={styles.mobileNav}>
          <Link to="/">{t('common.home')}</Link>
          {categories.map((category) => (
            <div key={category.id}>
              <Link to={categoryPath(category)}>{localize(category.nameAr, category.nameEn)}</Link>
              {category.children.length > 0 && (
                <div className={styles.mobileSubNav}>
                  {category.children.map((child) => (
                    <Link key={child.id} to={categoryPath(child)}>
                      {localize(child.nameAr, child.nameEn)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className={styles.mobileMenuFooter}>
          <Link to="/orders/track">{t('layout.trackOrder')}</Link>
          {current ? (
            <>
              <Link to="/account">{t('layout.account')}</Link>
              <button type="button" className={styles.textButton} onClick={() => void signOut()}>
                {t('layout.signOut')}
              </button>
            </>
          ) : (
            <Link to="/login">{t('layout.signIn')}</Link>
          )}
          <Button variant="secondary" fullWidth startIcon={<Languages size={18} aria-hidden="true" />} onClick={onSwitchLanguage} lang={i18n.language === 'ar' ? 'en' : 'ar'}>
            {t('common.switchLanguage')}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}

function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const text = query.trim()
    if (!text) return
    onClose()
    navigate(`/search?q=${encodeURIComponent(text)}`)
  }

  return (
    <Drawer open={open} onClose={onClose} title={t('layout.search')} side="top">
      <form role="search" onSubmit={submit} className={`container ${styles.searchForm}`}>
        <Input
          label={t('layout.searchLabel')}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('layout.searchPlaceholder')}
          autoFocus
          enterKeyHint="search"
        />
        <Button type="submit" size="lg" startIcon={<Search size={18} aria-hidden="true" />}>
          {t('layout.search')}
        </Button>
      </form>
    </Drawer>
  )
}
