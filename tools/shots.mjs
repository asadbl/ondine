// Screenshot the site at chosen scroll positions via headless Chrome (CDP).
// node tools/shots.mjs <url> <outdir> <W> <H>
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
const [,, url, out, Wa = '1440', Ha = '900'] = process.argv
const W = +Wa, H = +Ha
mkdirSync(out, { recursive: true })
const port = 9600 + Math.floor(Math.random() * 100)
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--window-size=${W},${H}`, '--no-first-run', '--user-data-dir=/tmp/cdp-shot-' + port, '--use-angle=metal', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let wsUrl
for (let i = 0; i < 60; i++) { try { const t = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); if (t) { wsUrl = t.webSocketDebuggerUrl; break } } catch {} await sleep(250) }
const ws = new WebSocket(wsUrl); await new Promise((r) => (ws.onopen = r))
let id = 0; const pending = new Map(); const logs = []
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } else if (m.method === 'Runtime.exceptionThrown') logs.push(JSON.stringify(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)); else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push(m.params.args.map((a) => a.value || a.description).join(' ')) }
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value
await send('Page.enable'); await send('Runtime.enable')
const mobile = W < 760
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: mobile ? 2 : 1, mobile })
await send('Page.navigate', { url })
for (let i = 0; i < 120; i++) { await sleep(500); if (await ev('!!window.__film && window.__film.loaded() >= window.__film.N() - 2')) break }
await sleep(800)
const COUNT = +(process.env.COUNT || 16)
const shots = JSON.parse(await ev(`(() => { const walk = document.querySelector('.walk'); const top = walk.offsetTop, range = walk.offsetHeight - innerHeight;
  const el = (s) => document.querySelector(s).getBoundingClientRect().top + scrollY; const out = [];
  for (let i = 0; i < ${COUNT}; i++) out.push(['w' + String(i).padStart(2, '0'), top + range * i / (${COUNT} - 1)]);
  out.push(['x1-maison', el('.maison') - 40], ['x2-visit', el('.visit')], ['x3-letter', el('.letter')], ['x4-foot', document.body.scrollHeight - innerHeight]);
  return JSON.stringify(out) })()`))
for (const [name, yy] of shots) {
  await ev(`window.__lenis ? window.__lenis.scrollTo(${yy}, { immediate: true }) : window.scrollTo(0, ${yy})`)
  await sleep(+(process.env.WAIT || 1600))
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 })
  writeFileSync(`${out}/${name}.jpg`, Buffer.from(r.result.data, 'base64'))
}
console.log('errors:', logs.length ? logs.join('\n') : 'none')
ws.close(); chrome.kill()
process.exit(0)
