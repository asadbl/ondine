// The walk: one continuous runway film scrubbed by the scroll. Shot 0 is the entrance, shots 1..6 are the
// chapters; in each one her outfit changes and the chapter's colour rises over the screen with a curved edge.
// The camera never stops: while a chapter is read the film runs in slow motion, and the product on the right
// turns and changes with the same scroll.
import { CHAPTERS } from './content.js'

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const smooth = (t) => t * t * (3 - 2 * t)
const lerp = (a, b, t) => a + (b - a) * t
const COLORS = { hero: '#141010', outerwear: '#a8794a', dresses: '#15121a', tailoring: '#ded4c3', swim: '#2a9aa6', knitwear: '#cdbda4', evening: '#171c3c' }
const LIGHT = new Set(['tailoring', 'knitwear'])

export function initFilm(opts) {
  let api = null
  const pending = { tick() { api?.tick(...arguments) }, chapterY: (i) => api?.chapterY(i) ?? 0 }
  fetch(`${import.meta.env.BASE_URL}frames/manifest.json`).then((r) => r.json()).then((m) => { api = setup(opts, m) })
    .catch((e) => { console.error(e); document.querySelector('.loader')?.classList.add('is-done') })
  return pending
}

function setup({ scrollToY }, manifest) {
  const root = document.documentElement
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const walk = document.querySelector('.walk')
  const canvas = document.querySelector('.film__canvas')
  const ctx = canvas.getContext('2d')
  const fx = document.querySelector('.film__fx')
  const fctx = fx.getContext('2d')
  const loader = document.querySelector('.loader')
  const rail = document.querySelector('.rail')
  const nav = document.querySelector('.nav')
  const navLinks = document.querySelector('.nav__links')
  const wavesEl = document.querySelector('.waves')
  const sweepsEl = document.querySelector('.sweeps')
  const chaptersEl = document.querySelector('.chapters')
  const after = document.querySelector('.maison')
  const tc = document.querySelector('.timecode')
  const hero = document.querySelector('[data-panel="hero"]')

  const N = manifest.count
  const fps = manifest.fps
  const clips = manifest.clips
  const nShots = clips.length
  const shotStart = (k) => clips[Math.min(k, nShots - 1)][0]
  const shotLen = (k) => clips[Math.min(k, nShots - 1)][1] - clips[Math.min(k, nShots - 1)][0]
  const T = (k, frac) => shotStart(k) + shotLen(k) * frac   // frame at a fraction of shot k
  const last = N - 1
  const SPEED = 62 // frames per screen of scroll at walking pace

  // which chapters exist yet: a chapter needs its shot
  const live = CHAPTERS.slice(0, Math.max(0, nShots - 1))

  // ---------- timing ----------
  // where, in each shot, the new outfit is complete: the chapter is read from there on, in slow motion
  const REVEAL = { outerwear: 0.72, dresses: 0.45, tailoring: 0.68, swim: 0.7, knitwear: 0.5, evening: 0.72 }
  const rv = (c) => REVEAL[c.key] ?? 0.6
  const zones = live.map((c, i) => ({ from: T(i + 1, rv(c) - 0.06), to: T(i + 1, 1), slow: 2.2 + 3.2 * (1 - rv(c)) * 2, ramp: 14 }))
  if (zones.length) { zones[zones.length - 1].to = last; zones[zones.length - 1].slow = 6 }
  zones.unshift({ from: 0, to: T(0, 0.35), slow: 3 })
  const panels = live.map((c, i) => ({ key: c.key, from: T(i + 1, rv(c) - 0.12), to: i + 2 < nShots ? T(i + 2, 0.1) : last + 9999 }))
  const waves = live.map((c, i) => ({ key: c.key, color: COLORS[c.key], from: T(i + 1, 0) - fps * 1.0, to: T(i + 1, 0) + fps * 2.2 }))
  const sweeps = live.map((c, i) => ({ word: c.word, from: T(i + 1, 0.05), to: T(i + 1, rv(c)) }))
  const chapters = [{ name: 'Entrée', frame: 0 }, ...live.map((c, i) => ({ name: c.name, frame: T(i + 1, rv(c) + 0.05) }))]

  // ---------- weights: slow zones ----------
  const W = new Float64Array(N)
  const weightAt = (f) => {
    let w = 1
    for (const z of zones) {
      const ramp = z.ramp ?? 14
      const k = clamp((f - (z.from - ramp)) / ramp) * clamp((z.to + ramp - f) / ramp)
      w = Math.max(w, 1 + (z.slow - 1) * smooth(k))
    }
    return w
  }
  for (let f = 1; f < N; f++) W[f] = W[f - 1] + weightAt(f - 0.5)
  const total = W[N - 1] / SPEED
  const wOf = (f) => { if (f > last) return W[last] + (f - last) * SPEED; const i = clamp(Math.floor(f), 0, last); const j = Math.min(last, i + 1); return lerp(W[i], W[j], f - i) }
  const frameOfW = (w) => { let lo = 0, hi = last; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (W[m] <= w) lo = m; else hi = m } const span = W[hi] - W[lo] || 1; return clamp(lo + (w - W[lo]) / span, 0, last) }

  // ---------- layout ----------
  let vh = innerHeight, vw = innerWidth
  function layout() {
    vh = innerHeight; vw = innerWidth
    walk.style.height = `${(total + 1) * vh}px`
    const dpr = Math.min(devicePixelRatio || 1, 2)
    for (const c of [canvas, fx]) { c.width = Math.round(vw * dpr); c.height = Math.round(vh * dpr) }
  }
  layout()
  addEventListener('resize', layout)
  const walkTop = () => walk.offsetTop
  const yForFrame = (f) => walkTop() + (wOf(f) / (total * SPEED)) * (walk.offsetHeight - vh)

  // ---------- build the DOM for chapters, waves, sweeps, rail, nav ----------
  hero.querySelector('.hero__name').innerHTML = [...'Ondine'].map((c, i) => `<span class="ch" style="transition-delay:${i * 0.05}s">${c}</span>`).join('')
  const panelEls = {}
  const stages = {}
  for (const c of live) {
    const el = document.createElement('article')
    el.className = 'chapter panel'
    el.dataset.panel = c.key
    if (LIGHT.has(c.key)) el.dataset.light = ''
    const words = c.title.split(/\s+/).map((w) => `<span class="w"><span data-r>${w}</span></span>`).join(' ')
    el.innerHTML = `
      <div class="chapter__text">
        <span class="chapter__no" data-r>${c.no} · ${c.name}</span>
        <h2>${words}</h2>
        <p data-r>${c.text}</p>
        <a class="chapter__cta" href="#visit" data-r>See the ${c.name.toLowerCase()} in the salon</a>
      </div>
      <div class="stage" data-r>
        <div class="stage__card">
          <div class="stage__floor"></div>
          <div class="stage__flip">
            <div class="stage__face stage__face--front"><img alt="" /></div>
            <div class="stage__face stage__face--back"><img alt="" /></div>
          </div>
          <span class="stage__view">Front</span>
        </div>
        <div class="stage__info"><div><span class="stage__name"></span><span class="stage__detail"></span></div><span class="stage__price"></span></div>
        <div class="stage__ctrls">
          <button type="button" data-turn>Turn</button>
          <button type="button" data-next>Next piece</button>
          <div class="stage__dots">${c.products.map(() => '<i></i>').join('')}</div>
        </div>
      </div>`
    chaptersEl.append(el)
    panelEls[c.key] = el
    const st = { el, products: c.products, idx: -1, flip: 0, manualIdx: 0, manualFlip: 0, scrollIdx: 0, scrollFlip: 0,
      front: el.querySelector('.stage__face--front img'), back: el.querySelector('.stage__face--back img'), flipEl: el.querySelector('.stage__flip'),
      view: el.querySelector('.stage__view'), name: el.querySelector('.stage__name'), detail: el.querySelector('.stage__detail'), price: el.querySelector('.stage__price'), dots: [...el.querySelectorAll('.stage__dots i')] }
    stages[c.key] = st
    el.querySelector('[data-turn]').addEventListener('click', () => { st.manualFlip ^= 1; renderStage(st) })
    el.querySelector('[data-next]').addEventListener('click', () => { st.manualIdx++; st.manualFlip = 0; renderStage(st) })
    renderStage(st)
  }
  function renderStage(st) {
    const idx = (st.scrollIdx + st.manualIdx) % st.products.length
    const flip = (st.scrollFlip + st.manualFlip) % 2
    if (idx !== st.idx) {
      const p = st.products[idx]
      st.idx = idx
      st.front.src = `${import.meta.env.BASE_URL}products/${p.front}.png`
      st.back.src = `${import.meta.env.BASE_URL}products/${p.back}.png`
      st.name.textContent = p.name; st.detail.textContent = p.detail; st.price.textContent = p.price
      st.dots.forEach((d, i) => d.classList.toggle('is-on', i === idx))
      st.turns = (st.turns || 0) // keep the rotation direction continuous
    }
    const target = flip ? 180 : 0
    // rotate forward only, so the card never spins back the wrong way
    while (st.flip % 360 !== target) st.flip += 180
    st.flipEl.style.transform = `rotateY(${st.flip}deg)`
    st.view.textContent = flip ? 'Back' : 'Front'
  }

  const waveEls = waves.map((w) => { const d = document.createElement('div'); d.className = 'wave'; d.style.background = w.color; wavesEl.append(d); return { ...w, el: d } })
  const sweepEls = sweeps.map((s) => { const el = document.createElement('span'); el.className = 'sweep'; el.textContent = s.word; sweepsEl.append(el); return { ...s, el } })
  chapters.forEach((c, i) => {
    const li = document.createElement('li')
    li.innerHTML = `<button type="button" aria-label="Go to ${c.name}"><span>${c.name}</span></button>`
    li.querySelector('button').addEventListener('click', () => scrollToY(i === 0 ? 0 : yForFrame(c.frame)))
    rail.append(li)
  })
  const railItems = [...rail.children]
  live.forEach((c, i) => {
    const a = document.createElement('a'); a.href = `#${c.key}`; a.textContent = c.name
    a.addEventListener('click', (e) => { e.preventDefault(); scrollToY(yForFrame(chapters[i + 1].frame)) })
    navLinks.append(a)
  })
  const navAs = [...navLinks.children]

  // ---------- frames ----------
  // The compressed frames stay in memory; only a window around the current frame is decoded to bitmaps,
  // so the 2880px set never fills the browser's memory.
  const frames = Array.from({ length: N }, () => ({ ok: false, blob: null }))
  const px = innerWidth * Math.min(devicePixelRatio || 1, 2)
  const set = innerWidth <= 760 ? 'm' : px > 2200 ? 'x' : 'd'
  const bm = new Map(), decoding = new Set()
  const AHEAD = 72, BEHIND = 36, KEEP = 160
  function ensureWindow(c) {
    for (let i = Math.max(0, c - BEHIND); i <= Math.min(last, c + AHEAD); i++) {
      if (bm.has(i) || decoding.has(i) || !frames[i].ok) continue
      decoding.add(i)
      createImageBitmap(frames[i].blob).then((b) => { bm.set(i, b); decoding.delete(i) }).catch(() => decoding.delete(i))
    }
    for (const [i, b] of bm) if (i < c - KEEP || i > c + KEEP) { b.close(); bm.delete(i) }
  }
  const nearest = (i) => { for (let d = 0; d < N; d++) { if (bm.has(i - d)) return i - d; if (bm.has(i + d)) return i + d } return -1 }
  let pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  addEventListener('pointermove', (e) => { pointer.tx = e.clientX / vw - 0.5; pointer.ty = e.clientY / vh - 0.5 }, { passive: true })
  function draw(f, t) {
    const i0 = Math.floor(f)
    ensureWindow(i0)
    const a = nearest(i0); if (a < 0) return
    const img = bm.get(a), cw = canvas.width, ch = canvas.height
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
    const zoom = 1.0 + (reduce ? 0 : Math.sin(t / 6000) * 0.004)
    const s = Math.max(cw / img.width, ch / img.height) * zoom
    const w = img.width * s, h = img.height * s
    const ox = (cw - w) / 2 - (reduce ? 0 : pointer.x * cw * 0.004), oy = (ch - h) / 2 - (reduce ? 0 : pointer.y * ch * 0.004)
    ctx.globalAlpha = 1; ctx.drawImage(img, ox, oy, w, h)
    const frac = f - i0
    if (a === i0 && frac > 0.02 && bm.has(i0 + 1)) { ctx.globalAlpha = frac; ctx.drawImage(bm.get(i0 + 1), ox, oy, w, h); ctx.globalAlpha = 1 }
  }
  async function load() {
    const order = [0]; const seen = new Set(order)
    for (const step of [12, 6, 3, 1]) for (let i = 0; i < N; i += step) if (!seen.has(i)) { seen.add(i); order.push(i) }
    const gate = Math.ceil(N / 12) + 1
    let done = 0, next = 0
    const worker = async () => {
      while (next < order.length) {
        const i = order[next++]
        try {
          const r = await fetch(`${import.meta.env.BASE_URL}frames/${set}/${String(i).padStart(4, '0')}.webp`)
          if (!r.ok) continue
          frames[i] = { ok: true, blob: await r.blob() }
        } catch { continue }
        if (++done <= gate) {
          loader.style.setProperty('--p', done / gate)
          loader.querySelector('.loader__pct').textContent = `${Math.round((done / gate) * 100)}%`
          if (done === gate) { ensureWindow(0); loader.classList.add('is-done'); root.classList.add('is-ready') }
        }
      }
    }
    await Promise.all(Array.from({ length: 8 }, worker))
  }
  load().catch((e) => { console.error(e); loader.classList.add('is-done') })

  // ---------- gold dust ----------
  const motes = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), r: 0.5 + Math.random() * 1.6, v: 0.2 + Math.random() * 0.8, p: Math.random() * 6.28 }))
  function drawFx(t, amount) {
    const cw = fx.width, ch = fx.height
    fctx.clearRect(0, 0, cw, ch)
    if (amount < 0.01 || reduce) return
    const dpr = cw / vw
    fctx.globalCompositeOperation = 'lighter'
    for (const m of motes) {
      m.y -= 0.00005 * m.v * 16; m.x += Math.sin(t / 2600 + m.p) * 0.0001
      if (m.y < -0.05) { m.y = 1.05; m.x = Math.random() }
      const tw = 0.5 + 0.5 * Math.sin(t / 700 + m.p * 3)
      const a = amount * (0.25 + 0.45 * tw), r = m.r * dpr
      const g = fctx.createRadialGradient(m.x * cw, m.y * ch, 0, m.x * cw, m.y * ch, r * 4)
      g.addColorStop(0, `rgba(230, 200, 140, ${a})`); g.addColorStop(1, 'rgba(230, 200, 140, 0)')
      fctx.fillStyle = g; fctx.fillRect(m.x * cw - r * 4, m.y * ch - r * 4, r * 8, r * 8)
    }
    fctx.globalCompositeOperation = 'source-over'
  }

  // ---------- wave clip path ----------
  function wavePath(p) {
    // p: 0 = nothing, 1 = whole screen. The edge is a curve that rises on the left first, then the right.
    const y = vh * (1 - p) * 1.04
    const amp = Math.sin(p * Math.PI) * vh * 0.14
    const y1 = y + amp * 0.3, y2 = y - amp * 0.4
    return `path("M0,${y1.toFixed(1)} C${(vw * 0.28).toFixed(1)},${(y1 - amp).toFixed(1)} ${(vw * 0.62).toFixed(1)},${(y2 + amp).toFixed(1)} ${vw},${y2.toFixed(1)} L${vw},${vh + 10} L0,${vh + 10} Z")`
  }

  // ---------- per frame ----------
  let current = 0, lastActive = -1
  function tick(t = performance.now()) {
    const range = walk.offsetHeight - vh
    const p = clamp((scrollY - walkTop()) / range)
    const target = frameOfW(p * total * SPEED)
    current += (target - current) * 0.16
    if (Math.abs(target - current) < 0.004) current = target
    pointer.x += (pointer.tx - pointer.x) * 0.05; pointer.y += (pointer.ty - pointer.y) * 0.05
    const f = current, fw = wOf(f)
    draw(f, t)

    // hero
    const heroA = clamp((T(0, 0.55) - f) / (fps * 1.2))
    hero.classList.toggle('is-on', heroA > 0.001)
    hero.style.opacity = heroA.toFixed(3)
    hero.querySelectorAll('[data-r]').forEach((el) => el.style.setProperty('--r', root.classList.contains('is-ready') ? 1 : 0))

    // chapters
    let fxAmount = 0.5
    for (const pn of panels) {
      const el = panelEls[pn.key]
      const inK = clamp((fw - wOf(pn.from)) / (SPEED * 0.6)), outK = clamp((wOf(pn.to) - fw) / (SPEED * 0.3))
      const a = Math.min(1, inK * 4) * outK
      el.classList.toggle('is-on', a > 0.001)
      el.style.opacity = a.toFixed(3)
      el.style.translate = `0 ${((1 - outK) * -24).toFixed(1)}px`
      const items = el.querySelectorAll('[data-r]'); const n = items.length
      items.forEach((it, k) => it.style.setProperty('--r', smooth(clamp((inK - (k / n) * 0.65) / 0.35)).toFixed(3)))
      // product play, driven by the slow zone of this chapter
      const ci = live.findIndex((c) => c.key === pn.key)
      const z = zones[ci + 1]
      if (z && a > 0) {
        const q = clamp((f - z.from) / (z.to - z.from))
        const st = stages[pn.key]
        const s = Math.min(3.999, q * 4.4)
        const si = Math.floor(s / 2), sf = Math.floor(s) % 2
        if (si !== st.scrollIdx || sf !== st.scrollFlip) { st.scrollIdx = si; st.scrollFlip = sf; st.manualIdx = 0; st.manualFlip = 0; renderStage(st) }
      }
    }

    // colour waves
    // only the chapter's own wave and the one rising over it are shown, so colours replace each other
    const ks = waveEls.map((w) => smooth(clamp((f - w.from) / (w.to - w.from))))
    waveEls.forEach((w, i) => {
      const k = ks[i], covered = i + 1 < ks.length && ks[i + 1] >= 1
      // light colours and the already-bright poolside need less wash than the dark ones
      const strength = { tailoring: 0.4, knitwear: 0.4, swim: 0.32 }[w.key] ?? 0.5
      w.el.style.opacity = k > 0 && !covered ? strength : 0
      w.el.style.clipPath = k >= 1 ? 'none' : wavePath(k)
    })
    // sweeps
    for (const s of sweepEls) {
      const a = wOf(s.from), b = wOf(s.to), k = clamp((fw - a) / (b - a)), on = k > 0 && k < 1
      s.el.style.opacity = on ? (Math.sin(k * Math.PI) * 0.8).toFixed(3) : 0
      s.el.style.transform = `translate3d(${lerp(50, -50, k).toFixed(2)}vw, -50%, 0)`
    }
    drawFx(t, fxAmount)

    // after the walk
    const bt = after.getBoundingClientRect().top
    const dark = clamp((vh - bt) / (vh * 0.7))
    root.style.setProperty('--dark', (dark * 0.86).toFixed(3))

    // rail, nav, timecode
    let active = 0
    chapters.forEach((c, i) => { if (f >= c.frame - fps * 1.5) active = i })
    if (active !== lastActive) {
      railItems.forEach((li, i) => li.classList.toggle('is-active', i === active))
      navAs.forEach((a, i) => a.classList.toggle('is-active', i === active - 1))
      tc.querySelector('.timecode__name').textContent = chapters[active].name
      lastActive = active
    }
    const secs = f / fps
    tc.querySelector('.timecode__t').textContent = `00:${String(Math.floor(secs)).padStart(2, '0')}`
    tc.style.setProperty('--p', (f / last).toFixed(4))
    tc.classList.toggle('is-hidden', dark > 0.2)
    rail.classList.toggle('is-hidden', dark > 0.3)
    nav.classList.toggle('is-solid', dark > 0.6)
  }

  window.__film = { yForFrame, frameOf: () => current, N: () => N, loaded: () => frames.filter((x) => x.ok).length, chapters }
  return { tick, chapterY: (i) => yForFrame(chapters[Math.min(i, chapters.length - 1)].frame) }
}
