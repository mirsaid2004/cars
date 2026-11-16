import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import Experience from './scene/Experience'
import { PAINTS, rig, useStore } from './store'

gsap.registerPlugin(ScrollTrigger)

const CHAPTERS = ['Intro', 'Form', 'Power', 'Craft', 'Colour', 'Reserve']

const STATS = [
  { value: 2.7, decimals: 1, unit: 's', label: '0 – 100 km/h' },
  { value: 342, decimals: 0, unit: 'km/h', label: 'Top speed' },
  { value: 780, decimals: 0, unit: 'hp', label: 'Peak output' },
  { value: 9200, decimals: 0, unit: 'rpm', label: 'Redline' },
]

const CRAFT = [
  { k: 'A', title: 'Carbon-ceramic brakes', text: '398 mm discs shed heat faster than the car can make it. 100 – 0 km/h in 29.5 metres.' },
  { k: 'B', title: 'Forged monoblock wheels', text: 'Milled from a single billet. 7.4 kg per corner, so the suspension answers only to the road.' },
  { k: 'C', title: 'Adaptive damping', text: 'Magnetic fluid re-reads the surface a thousand times a second and re-writes the ride.' },
]

function Loader({ pct }) {
  return (
    <div className="loader">
      <div className="loader__mark">M_DEV</div>
      <div className="loader__row">
        <span>Preparing the studio</span>
        <span className="loader__pct">{String(pct).padStart(3, '0')}</span>
      </div>
      <div className="loader__bar">
        <i style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    </div>
  )
}

export default function App() {
  const root = useRef()
  const lenisRef = useRef()
  const [active, setActive] = useState(0)
  const { progress, active: loading } = useProgress()
  const [ready, setReady] = useState(false)
  const paint = useStore((s) => s.paint)
  const setPaint = useStore((s) => s.setPaint)

  // accent follows the chosen paint
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', PAINTS[paint].accent)
  }, [paint])

  // smooth scroll + scroll → camera timeline
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 })
    lenisRef.current = lenis
    lenis.stop()
    window.scrollTo(0, 0)

    const sections = gsap.utils.toArray('.chapter')
    let tops = []
    const measure = () => {
      tops = sections.map((s) => s.offsetTop)
    }
    const update = () => {
      const y = window.scrollY
      let i = 0
      while (i < tops.length - 2 && y >= tops[i + 1]) i++
      const k = Math.min(Math.max((y - tops[i]) / (tops[i + 1] - tops[i]), 0), 1)
      rig.scroll = i + k
      setActive(Math.round(rig.scroll))
    }
    measure()
    update()

    lenis.on('scroll', () => {
      ScrollTrigger.update()
      update()
    })
    const tick = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const onResize = () => {
      measure()
      update()
    }
    const onPointer = (e) => {
      rig.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      rig.pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointer)

    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointer)
      lenis.destroy()
    }
  }, [])

  // chapter reveals
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.chapter:not(.hero)').forEach((section) => {
        const lines = section.querySelectorAll('.line > span')
        const fades = section.querySelectorAll('[data-fade]')
        const tl = gsap.timeline({
          defaults: { ease: 'expo.out' },
          scrollTrigger: { trigger: section, start: 'top 62%', end: 'bottom 30%', toggleActions: 'play reverse play reverse' },
        })
        tl.from(lines, { yPercent: 115, duration: 1.3, stagger: 0.09 }, 0)
        tl.from(fades, { opacity: 0, y: 28, duration: 1.1, stagger: 0.07 }, 0.15)

        section.querySelectorAll('[data-count]').forEach((el) => {
          const end = parseFloat(el.dataset.count)
          const dec = parseInt(el.dataset.dec || '0', 10)
          const o = { v: 0 }
          tl.to(
            o,
            {
              v: end,
              duration: 2,
              ease: 'power3.out',
              onUpdate: () => {
                el.textContent = dec ? o.v.toFixed(dec) : Math.round(o.v).toLocaleString('en-US')
              },
            },
            0.2
          )
        })
      })

      // hero copy drifts away as the camera leaves
      gsap.to('.hero__inner', {
        opacity: 0,
        y: -80,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '60% top', scrub: true },
      })
      gsap.to('.progress i', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  // opening sequence once the model is in
  useEffect(() => {
    if (ready || loading || progress < 100) return
    setReady(true)
    const tl = gsap.timeline({ delay: 0.35 })
    tl.to('.loader > *', { opacity: 0, y: -16, duration: 0.6, stagger: 0.06, ease: 'power2.in' })
      .to('.loader', { autoAlpha: 0, duration: 1.4, ease: 'power2.inOut' }, '>-0.1')
      .to(rig, { intro: 1, duration: 5.2, ease: 'power3.inOut' }, '<')
      .to('.bars i', { scaleY: 0, duration: 1.8, ease: 'expo.inOut' }, '<3.1')
      .from('.hero .line > span', { yPercent: 115, duration: 1.4, stagger: 0.1, ease: 'expo.out' }, '<0.5')
      .from('.hero [data-fade], .nav, .rail, .progress', { opacity: 0, y: 20, duration: 1.2, stagger: 0.07, ease: 'expo.out' }, '<0.25')
      .add(() => lenisRef.current?.start(), '<0.3')
    return () => {}
  }, [ready, loading, progress])

  const go = (i) => lenisRef.current?.scrollTo(document.querySelectorAll('.chapter')[i], { duration: 2.2 })

  // drag to spin the car in the colour chapter
  const drag = useRef(null)
  const onDown = (e) => {
    if (e.target.closest('button')) return
    drag.current = e.clientX
  }
  const onMove = (e) => {
    if (drag.current == null) return
    rig.drag += (e.clientX - drag.current) * 0.006
    drag.current = e.clientX
  }
  const onUp = () => (drag.current = null)

  return (
    <div ref={root} className="app">
      <div className="stage">
        <Experience />
      </div>
      <div className="grade" />
      <div className="bars">
        <i />
        <i />
      </div>
      <Loader pct={Math.round(progress)} />

      <header className="nav">
        <button className="nav__logo" onClick={() => go(0)}>
          M_DEV<sup>CARS</sup>
        </button>
        <nav className="nav__links">
          {CHAPTERS.slice(1, 5).map((c, i) => (
            <button key={c} className={active === i + 1 ? 'is-active' : ''} onClick={() => go(i + 1)}>
              {c}
            </button>
          ))}
        </nav>
        <button className="btn btn--sm" onClick={() => go(5)}>
          Reserve
        </button>
      </header>

      <aside className="rail">
        <span className="rail__num">0{active + 1}</span>
        <div className="rail__dots">
          {CHAPTERS.map((c, i) => (
            <button key={c} aria-label={c} className={active === i ? 'is-active' : ''} onClick={() => go(i)} />
          ))}
        </div>
        <span className="rail__num rail__num--dim">0{CHAPTERS.length}</span>
      </aside>
      <div className="progress">
        <i />
      </div>

      <main>
        {/* 01 — HERO */}
        <section className="chapter hero">
          <div className="hero__inner">
            <p className="eyebrow" data-fade>
              <b /> The 2027 grand tourer
            </p>
            <h1 className="hero__title">
              <span className="line"><span>Sculpted by wind.</span></span>
              <span className="line"><span>Driven by <em>obsession.</em></span></span>
            </h1>
            <div className="hero__foot">
              <p className="lede" data-fade>
                A naturally aspirated V8, a body drawn in a single stroke, and nothing between you and the horizon.
              </p>
              <ul className="hero__specs" data-fade>
                <li><strong>780</strong><span>hp</span></li>
                <li><strong>2.7</strong><span>sec 0–100</span></li>
                <li><strong>342</strong><span>km/h</span></li>
              </ul>
            </div>
          </div>
          <div className="scrollcue" data-fade>
            <i /> Scroll to begin
          </div>
        </section>

        {/* 02 — FORM */}
        <section className="chapter chapter--left">
          <div className="copy">
            <p className="eyebrow" data-fade><b /> 01 — Form</p>
            <h2>
              <span className="line"><span>One line.</span></span>
              <span className="line"><span>Nose to <em>tail.</em></span></span>
            </h2>
            <p className="lede" data-fade>
              Every surface begins at the front splitter and ends at the diffuser without a single interruption. Air
              doesn’t fight this shape — it follows it.
            </p>
            <dl className="facts" data-fade>
              <div><dt>Drag coefficient</dt><dd>0.29</dd></div>
              <div><dt>Downforce @ 250</dt><dd>360 kg</dd></div>
              <div><dt>Kerb weight</dt><dd>1,385 kg</dd></div>
            </dl>
          </div>
        </section>

        {/* 03 — POWER */}
        <section className="chapter chapter--right">
          <div className="copy">
            <p className="eyebrow" data-fade><b /> 02 — Power</p>
            <h2>
              <span className="line"><span>Nine thousand</span></span>
              <span className="line"><span>reasons to <em>rev.</em></span></span>
            </h2>
            <p className="lede" data-fade>
              A flat-plane 4.5-litre V8 mounted behind your shoulders. No turbos. No lag. Just an unbroken climb to 9,200
              rpm.
            </p>
            <div className="stats">
              {STATS.map((s) => (
                <div className="stat" key={s.label} data-fade>
                  <div className="stat__num">
                    <span data-count={s.value} data-dec={s.decimals}>0</span>
                    <small>{s.unit}</small>
                  </div>
                  <div className="stat__label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 04 — CRAFT */}
        <section className="chapter chapter--right">
          <div className="copy">
            <p className="eyebrow" data-fade><b /> 03 — Craft</p>
            <h2>
              <span className="line"><span>Obsessed with</span></span>
              <span className="line"><span>the <em>unseen.</em></span></span>
            </h2>
            <div className="cards">
              {CRAFT.map((c) => (
                <article className="card" key={c.k} data-fade>
                  <span className="card__k">{c.k}</span>
                  <div>
                    <h3>{c.title}</h3>
                    <p>{c.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 05 — COLOUR */}
        <section
          className="chapter chapter--studio"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        >
          <div className="studio__head">
            <p className="eyebrow" data-fade><b /> 04 — Colour</p>
            <h2>
              <span className="line"><span>Make it <em>yours.</em></span></span>
            </h2>
          </div>
          <div className="studio__panel" data-fade>
            <div className="studio__name">
              <small>{PAINTS[paint].finish}</small>
              <strong key={paint}>{PAINTS[paint].name}</strong>
            </div>
            <div className="swatches">
              {PAINTS.map((p, i) => (
                <button
                  key={p.id}
                  aria-label={p.name}
                  className={i === paint ? 'is-active' : ''}
                  style={{ '--sw': p.color }}
                  onClick={() => setPaint(i)}
                />
              ))}
            </div>
            <span className="studio__hint">Drag to rotate</span>
          </div>
        </section>

        {/* 06 — RESERVE */}
        <section className="chapter chapter--end">
          <div className="end">
            <p className="eyebrow" data-fade><b /> Limited to 499 cars</p>
            <h2 className="end__title">
              <span className="line"><span>The road is <em>waiting.</em></span></span>
            </h2>
            <div className="end__actions" data-fade>
              <button className="btn">Reserve your build <span>→</span></button>
              <button className="btn btn--ghost">Book a private viewing</button>
            </div>
          </div>
          <footer className="footer" data-fade>
            <span>© 2026 M_DEV Cars — concept showcase</span>
            <span>
              3D model: “Ferrari 458 Italia” by vicent091036, CC BY 4.0
            </span>
            <button onClick={() => go(0)}>Back to top ↑</button>
          </footer>
        </section>
      </main>
    </div>
  )
}
