// Lists every API request a page makes and how it ended (status, cancelled, or failed).
// Usage: node scripts/net.mjs <url> [width=1280] [height=900]
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const [url, width = '1280', height = '900'] = process.argv.slice(2)
const chromePaths = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
]
const port = 9800 + Math.floor(Math.random() * 500)
const chrome = spawn(chromePaths.find((p) => existsSync(p)), [
  '--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${process.env.TEMP}/korner-net-${port}`, 'about:blank',
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
  const requests = new Map()
  const consoleErrors = []
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    const { method, params } = message
    if (method === 'Network.requestWillBeSent' && params.request.url.includes('/api/')) {
      requests.set(params.requestId, { url: params.request.url.replace(/^https?:\/\/[^/]+/, ''), method: params.request.method, result: 'pending' })
    }
    if (method === 'Network.responseReceived' && requests.has(params.requestId)) requests.get(params.requestId).result = String(params.response.status)
    if (method === 'Network.loadingFinished' && requests.has(params.requestId) && requests.get(params.requestId).result === 'pending') requests.get(params.requestId).result = 'finished (no status event)'
    if (method === 'Network.requestServedFromCache' && requests.has(params.requestId)) requests.get(params.requestId).result = 'from cache'
    if (method === 'Network.loadingFailed' && requests.has(params.requestId)) {
      requests.get(params.requestId).result = params.canceled ? 'CANCELLED (by the app)' : `FAILED: ${params.errorText}`
    }
    if (method === 'Runtime.exceptionThrown') consoleErrors.push(params.exceptionDetails.text)
    if (method === 'Runtime.consoleAPICalled' && params.type === 'error') consoleErrors.push(params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 200))
  })
  const send = (method, params = {}) => ws.send(JSON.stringify({ id: ++id, method, params }))

  send('Network.enable')
  send('Runtime.enable')
  send('Emulation.setDeviceMetricsOverride', { width: Number(width), height: Number(height), deviceScaleFactor: 1, mobile: Number(width) < 768 })
  send('Page.navigate', { url })
  await sleep(9000)

  for (const request of requests.values()) console.log(`${request.method.padEnd(5)} ${request.url.padEnd(34)} ${request.result}`)
  console.log(consoleErrors.length ? `console errors:\n- ${consoleErrors.join('\n- ')}` : 'console errors: none')
  ws.close()
} finally {
  chrome.kill()
}
