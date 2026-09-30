// Runs Lighthouse (mobile) on the main pages of a local production build and prints the four scores and what failed.
// Usage: npm run audit            (needs `npm run preview:audit` running)
//        PAGES="/,/shop" npm run audit
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

const base = process.env.BASE_URL ?? 'http://localhost:4173'
const pages = (process.env.PAGES ?? '/,/shop,/c/shoes,/p/navy-camel-sport-sneakers,/search?q=shirt,/cart,/checkout,/login,/orders/track,/pages/terms').split(',')
const categories = ['performance', 'accessibility', 'best-practices', 'seo']

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--disable-gpu'] })
try {
  for (const page of pages) {
    const result = await lighthouse(`${base}${page}`, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: categories, formFactor: 'mobile' })
    const lhr = result.lhr
    const scores = categories.map((id) => `${id.slice(0, 4)} ${Math.round((lhr.categories[id].score ?? 0) * 100)}`).join('  ')
    console.log(`
${page}  →  ${scores}`)
    for (const id of categories) {
      for (const ref of lhr.categories[id].auditRefs) {
        const audit = lhr.audits[ref.id]
        if (ref.weight > 0 && audit.score !== null && audit.score < 0.9) {
          const items = (audit.details?.items ?? []).slice(0, 3).map((item) => item.node?.snippet ?? item.url ?? '').filter(Boolean)
          console.log(`   [${id.slice(0, 4)}] ${audit.id} (${audit.displayValue ?? audit.score}) ${items.join(' | ').slice(0, 300)}`)
        }
      }
    }
  }
} finally {
  await chrome.kill()
}
