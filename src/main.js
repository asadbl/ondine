import Lenis from 'lenis'
import './style.css'
import { initFilm } from './film.js'

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const lenis = reduce ? null : new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 })
window.__lenis = lenis
const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.6 }) : window.scrollTo({ top: y }))
const film = initFilm({ scrollToY })

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]')
  if (!a || a.closest('.nav__links')) return
  const id = a.getAttribute('href').slice(1)
  const el = id === 'top' ? document.body : document.getElementById(id)
  if (!el) return
  e.preventDefault()
  scrollToY(id === 'top' ? 0 : id === 'walk' ? film.chapterY(1) : el.getBoundingClientRect().top + window.scrollY)
})

function frame(t) { lenis?.raf(t); film.tick(t); requestAnimationFrame(frame) }
requestAnimationFrame(frame)

// sections after the walk rise in
const rise = document.querySelectorAll('.maison__text, .maison__services article, .visit__text, .visit__map, .letter > *')
rise.forEach((el, i) => { el.classList.add('rise'); el.style.transitionDelay = `${(i % 3) * 0.08}s` })
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -10% 0px' })
rise.forEach((el) => io.observe(el))

// forms: confirm in place (no backend yet)
for (const form of document.querySelectorAll('form')) {
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const email = form.querySelector('input[type=email]')
    const done = form.querySelector('[hidden], .book__done, .letter__done') || form.nextElementSibling
    if (!email.value || !email.checkValidity()) { email.focus(); return }
    done.hidden = false
    done.textContent = form.classList.contains('book') ? `Thank you. The salon will write to ${email.value} within the day to fix a time.` : `Thank you. The next letter will reach ${email.value}.`
  })
}
