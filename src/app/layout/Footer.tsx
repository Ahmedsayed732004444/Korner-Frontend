import { Mail, MessageCircle, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCategoryTree } from '@/features/catalog'
import type { StoreSettings } from '@/features/store'
import { useLocalize } from '@/shared/lib/localize'
import { Logo } from '@/shared/ui'
import styles from './Layout.module.scss'

const currentYear = new Date().getFullYear()

export function Footer({ settings }: { settings: StoreSettings | undefined }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const { data: categories = [] } = useCategoryTree()
  const whatsApp = settings?.supportWhatsApp?.replace(/[^\d]/g, '')

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerGrid}`}>
        <section className={styles.footerBrand}>
          <Logo />
          <p>{t('brand.tagline')}</p>
          <p className={styles.payments}>{t('footer.securePayment')}</p>
        </section>

        <nav aria-labelledby="footer-shop">
          <h2 id="footer-shop">{t('footer.shop')}</h2>
          <ul>
            {categories.slice(0, 6).map((category) => (
              <li key={category.id}>
                <Link to={`/c/${localize(category.slugAr, category.slugEn)}`}>{localize(category.nameAr, category.nameEn)}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-help">
          <h2 id="footer-help">{t('footer.help')}</h2>
          <ul>
            <li><Link to="/orders/track">{t('layout.trackOrder')}</Link></li>
            <li><Link to="/pages/shipping">{t('footer.shipping')}</Link></li>
            <li><Link to="/pages/returns">{t('footer.returns')}</Link></li>
            <li><Link to="/pages/faq">{t('footer.faq')}</Link></li>
          </ul>
        </nav>

        <section aria-labelledby="footer-contact">
          <h2 id="footer-contact">{t('footer.contact')}</h2>
          <ul>
            {whatsApp && (
              <li>
                <a href={`https://wa.me/${whatsApp}`} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                  <MessageCircle size={18} aria-hidden="true" /> {t('footer.whatsApp')}
                </a>
              </li>
            )}
            {settings?.supportPhone && (
              <li>
                <a href={`tel:${settings.supportPhone}`} className={styles.contactLink} dir="ltr">
                  <Phone size={18} aria-hidden="true" /> {settings.supportPhone}
                </a>
              </li>
            )}
            {settings?.supportEmail && (
              <li>
                <a href={`mailto:${settings.supportEmail}`} className={styles.contactLink}>
                  <Mail size={18} aria-hidden="true" /> {settings.supportEmail}
                </a>
              </li>
            )}
            <li><Link to="/pages/about">{t('footer.about')}</Link></li>
          </ul>
        </section>
      </div>

      <div className={`container ${styles.footerBottom}`}>
        <p>
          © {currentYear} Korner. {t('footer.rights')}
        </p>
        <nav aria-label={t('footer.legal')} className={styles.footerLegal}>
          <Link to="/pages/terms">{t('footer.terms')}</Link>
          <Link to="/pages/privacy">{t('footer.privacy')}</Link>
        </nav>
        {/* Required by the free Colorlib template license unless a license is bought. */}
        <p className={styles.credit}>
          Design based on a template by{' '}
          <a href="https://colorlib.com" target="_blank" rel="noopener noreferrer">
            Colorlib
          </a>
        </p>
      </div>
    </footer>
  )
}
