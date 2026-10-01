import { Mail, MessageCircle, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCategoryTree } from '@/features/catalog'
import { useFooter, type FooterLink } from '@/features/content'
import type { StoreSettings } from '@/features/store'
import { useLocalize } from '@/shared/lib/localize'
import { Logo } from '@/shared/ui'
import styles from './Layout.module.scss'

const currentYear = new Date().getFullYear()

const socialNames = { Facebook: 'Facebook', Instagram: 'Instagram', TikTok: 'TikTok', YouTube: 'YouTube', X: 'X', Snapchat: 'Snapchat' } as const

// Store paths open inside the app; web addresses in a new tab; mailto:/tel: as they are.
function FooterAnchor({ link, className, children }: { link: FooterLink; className?: string; children: React.ReactNode }) {
  if (link.url.startsWith('/')) return <Link to={link.url} className={className}>{children}</Link>
  const external = /^https?:\/\//i.test(link.url)
  return (
    <a href={link.url} className={className} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  )
}

// Everything here except the template credit is edited by staff in Content > Footer.
export function Footer({ settings }: { settings: StoreSettings | undefined }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const { data: footer } = useFooter()
  const { data: categories = [] } = useCategoryTree()
  const whatsApp = settings?.supportWhatsApp?.replace(/[^\d]/g, '')
  const showCategories = footer?.showCategories ?? true
  const showContact = footer?.showContact ?? true

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerGrid}`}>
        <section className={styles.footerBrand}>
          <Logo />
          <p>{localize(footer?.taglineAr, footer?.taglineEn) || t('brand.tagline')}</p>
          <p className={styles.payments}>{t('footer.securePayment')}</p>
          {footer && footer.socialLinks.length > 0 && (
            <ul className={styles.social} aria-label={t('footer.social')}>
              {footer.socialLinks.map((social) => (
                <li key={social.platform}>
                  <a href={social.url} target="_blank" rel="noopener noreferrer">
                    {socialNames[social.platform]}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {showCategories && categories.length > 0 && (
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
        )}

        {footer?.columns.map((column, index) => (
          <nav key={index} aria-labelledby={`footer-column-${index}`}>
            <h2 id={`footer-column-${index}`}>{localize(column.titleAr, column.titleEn)}</h2>
            <ul>
              {column.links.map((link, linkIndex) => (
                <li key={linkIndex}>
                  <FooterAnchor link={link}>{localize(link.labelAr, link.labelEn)}</FooterAnchor>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {showContact && (whatsApp || settings?.supportPhone || settings?.supportEmail) && (
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
            </ul>
          </section>
        )}
      </div>

      <div className={`container ${styles.footerBottom}`}>
        <p>© {currentYear} {localize(footer?.copyrightAr, footer?.copyrightEn) || `Korner. ${t('footer.rights')}`}</p>
        {footer && footer.bottomLinks.length > 0 && (
          <nav aria-label={t('footer.legal')} className={styles.footerLegal}>
            {footer.bottomLinks.map((link, index) => (
              <FooterAnchor key={index} link={link}>
                {localize(link.labelAr, link.labelEn)}
              </FooterAnchor>
            ))}
          </nav>
        )}
        {/* Required by the free Colorlib template license unless a license is bought, so it is not editable. */}
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
