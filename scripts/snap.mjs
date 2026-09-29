// Visual check: real device emulation (headless Chrome's plain --window-size can't go below ~500px).
// Usage: node scripts/snap.mjs <url> <out.png> [width=390] [height=844]
// Also reports horizontal overflow and the elements that cause it.
import { spawn } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const [url, out, width = '390', height = '844'] = process.argv.slice(2)
const chromePaths = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
]
const port = 9300 + Math.floor(Math.random() * 500)
const chrome = spawn(chromePaths.find((p) => existsSync(p)), [
  '--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${process.env.TEMP}/korner-snap-${port}`, 'about:blank',
], { stdio: 'ignore' })

try {
  let target
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200)
    try {
      target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')
    } catch {}
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }))
  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message)
      pending.delete(message.id)
    }
  })
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const messageId = ++id
      pending.set(messageId, resolve)
      ws.send(JSON.stringify({ id: messageId, method, params }))
    })

  const mobile = Number(width) < 768
  await send('Emulation.setDeviceMetricsOverride', { width: Number(width), height: Number(height), deviceScaleFactor: mobile ? 2 : 1, mobile })
  await send('Page.enable')
  // Optional: PRELOAD="js" runs before the app starts on every page load (e.g. to put a session in localStorage).
  if (process.env.PRELOAD) await send('Page.addScriptToEvaluateOnNewDocument', { source: process.env.PRELOAD })
  await send('Page.navigate', { url })
  await sleep(6000)

  // Optional: EVAL="js" runs in the page first (clicks, typing), then EVAL_WAIT ms pass before the screenshot.
  if (process.env.EVAL) {
    const result = await send('Runtime.evaluate', { returnByValue: true, awaitPromise: true, expression: process.env.EVAL })
    console.log('eval:', JSON.stringify(result.result.result?.value ?? result.result.exceptionDetails?.text))
    await sleep(Number(process.env.EVAL_WAIT ?? 2500))
  }

  const overflow = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const vw = document.documentElement.clientWidth
      const culprits = [...document.querySelectorAll('body *')]
        .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > vw + 1 || r.left < -1) })
        .filter((el) => !el.closest('.visually-hidden'))
        .slice(0, 8)
        .map((el) => el.tagName.toLowerCase() + '.' + [...el.classList].join('.') + ' ' + Math.round(el.getBoundingClientRect().width) + 'px')
      return { viewport: vw, scrollWidth: document.documentElement.scrollWidth, culprits }
    })()`,
  })
  console.log(JSON.stringify(overflow.result.result.value))

  const text = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: String.raw`document.getElementById('root')?.innerText.replace(/\s+/g, ' ').slice(0, 160) ?? 'NO ROOT'`,
  })
  console.log('page text:', text.result.result.value || '(empty)')

  const scrollHeight = (await send('Runtime.evaluate', { returnByValue: true, expression: 'document.documentElement.scrollHeight' })).result.result.value
  const fullHeight = Math.min(scrollHeight, 12000)
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: Number(width), height: fullHeight, scale: mobile ? 0.5 : 1 },
  })
  if (!shot.result) throw new Error(JSON.stringify(shot.error))
  writeFileSync(out, Buffer.from(shot.result.data, 'base64'))
  ws.close()
} finally {
  chrome.kill()
}
