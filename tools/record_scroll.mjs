// Record the site scrolling from top to bottom as an image sequence on a virtual clock (one capture per frame),
// so the motion is smooth however long each capture takes.  node tools/record_scroll.mjs <url> <outdir> <W> <H> <seconds> [fps]
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
const [,, url, out, Wa = '2560', Ha = '1600', secA = '38', fpsA = '30'] = process.argv
const W = +Wa, H = +Ha, SEC = +secA, FPS = +fpsA
mkdirSync(out, { recursive: true })
const port = 9800 + Math.floor(Math.random() * 100)
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--window-size=${W},${H}`, '--no-first-run', '--user-data-dir=/tmp/cdp-rs-' + port, '--use-angle=metal', '--enable-gpu-rasterization', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let wsUrl
for (let i = 0; i < 80; i++) { try { const t = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); if (t) { wsUrl = t.webSocketDebuggerUrl; break } } catch {} await sleep(250) }
const ws = new WebSocket(wsUrl); await new Promise((r) => (ws.onopen = r))
let id = 0; const pending = new Map()
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } }
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value
await send('Page.enable'); await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url })
for (let i = 0; i < 240; i++) { await sleep(500); if (await ev('!!window.__film && window.__film.loaded() >= window.__film.N() - 2')) break }
await sleep(2500) // let the name letters rise
// scroll plan: the walk at a steady pace, then the rest of the page a little faster, ending on the footer
const plan = JSON.parse(await ev(`(() => { const w = document.querySelector('.walk'); return JSON.stringify({ walkEnd: w.offsetTop + w.offsetHeight - innerHeight, pageEnd: document.body.scrollHeight - innerHeight }) })()`))
const total = SEC * FPS
const ease = (t) => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
const yAt = (i) => {
  const t = i / (total - 1)
  const hold = 0.04, walkT = 0.78, tail = 0.06 // seconds-fractions: hold at top, walk, after-walk, hold at end
  if (t < hold) return 0
  if (t < hold + walkT) return plan.walkEnd * ((t - hold) / walkT)
  if (t < 1 - tail) return plan.walkEnd + (plan.pageEnd - plan.walkEnd) * ease((t - hold - walkT) / (1 - hold - walkT - tail))
  return plan.pageEnd
}
for (let i = 0; i < total; i++) {
  const y = yAt(i)
  await ev(`window.__lenis ? window.__lenis.scrollTo(${y}, { immediate: true }) : window.scrollTo(0, ${y})`)
  await sleep(i === 0 ? 1500 : 90)
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 94 })
  writeFileSync(`${out}/f-${String(i).padStart(5, '0')}.jpg`, Buffer.from(r.result.data, 'base64'))
  if (i % 100 === 0) console.log('frame', i, '/', total)
}
console.log('done', total)
ws.close(); chrome.kill(); process.exit(0)
