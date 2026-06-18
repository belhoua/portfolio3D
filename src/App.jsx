import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ThreeHero from './ThreeHero.jsx'
import TiltCard from './TiltCard.jsx'
import Icon from './Icon.jsx'
import IntroGlobe, { shouldPlayIntro } from './IntroGlobe.jsx'

/* ============================================================
   Data — edit these to keep the portfolio up to date
   ============================================================ */
const ROLES = ['Full Stack Developer', 'Web Designer', 'API & Automation Builder']

// Adjust your real proficiency levels here (0–100).
const SKILLS = [
  { label: 'JavaScript', value: 78 },
  { label: 'PHP', value: 72 },
  { label: 'Python', value: 75 },
  { label: 'MySQL', value: 70 },
]

const STATS = [
  { value: '4+', label: 'Years coding' },
  { value: '10+', label: 'Projects built' },
  { value: '8+', label: 'Technologies' },
  { value: '100%', label: 'Commitment' },
]

const STACK = ['JavaScript', 'React', 'PHP', 'Python', 'MySQL', 'Node.js', 'Tailwind', 'Linux', 'Git', 'n8n']

const SERVICES = [
  ['penRuler', 'Web Design', 'Modern, responsive interfaces with a clean visual hierarchy and care for detail.'],
  ['code', 'Web Development', 'Robust, scalable full-stack apps from the UI down to the database layer.'],
  ['database', 'Database Design', 'Well-structured relational schemas, queries and data you can trust.'],
  ['bot', 'Automation & AI', 'Scrapers, pipelines and AI-assisted workflows that remove manual work.'],
  ['branch', 'API Development', 'Secure, documented REST APIs that other services can rely on.'],
  ['gauge', 'Performance', 'Faster load times through optimization, caching and clean architecture.'],
]

// type 'image' uses a screenshot; type 'cover' renders a designed gradient cover.
const PROJECTS = [
  { type: 'image', src: '/img/project1.png', title: 'IT Job Scraper', desc: 'Python pipeline collecting public IT job offers, translating them and generating tailored cover letters.', tags: ['Python', 'Scraping', 'n8n'] },
  { type: 'image', src: '/img/project2.png', title: 'ExpertDoctor Platform', desc: 'Medical appointment platform with patient management and a clean, responsive interface.', tags: ['PHP', 'MySQL', 'UI'] },
  { type: 'image', src: '/img/photo.png', title: 'Fitness Club Platform', desc: 'Membership and program management app for a fitness club, with backend integration.', tags: ['PHP', 'MySQL', 'JS'] },
  { type: 'cover', icon: 'utensils', a: '#1e40af', b: '#3b82f6', title: 'Recipe Content Engine', desc: 'Scrapes trending recipes via schema.org JSON-LD and builds ready-to-post social content with images.', tags: ['Python', 'JSON-LD', 'Content'] },
  { type: 'cover', icon: 'workflow', a: '#3b82f6', b: '#2dd4bf', title: 'Automation Workflows', desc: 'n8n workflows wiring APIs together for human-reviewed, automated job applications.', tags: ['n8n', 'APIs', 'Python'] },
  { type: 'cover', icon: 'database', a: '#2dd4bf', b: '#1e40af', title: 'PHP CRUD & Auth', desc: 'Full CRUD app with PDO, sessions, file uploads and security hardening (XSS, SQL injection).', tags: ['PHP', 'PDO', 'Security'] },
]

const ABOUT = [
  ['Name', 'Belhouari Othmane'],
  ['Age', '22'],
  ['Email', 'othmane.belhouari20@ump.ac.ma'],
  ['Phone', '+212 6 20 46 73 42'],
  ['Location', 'Oujda, Morocco'],
  ['Degree', 'Specialized Technician'],
  ['Freelance', 'Available'],
  ['Languages', 'Arabic · French · English'],
]

const EMAIL = 'othmane.belhouari20@ump.ac.ma'

// Replace href values with your real profile URLs.
const SOCIALS = [
  {
    label: 'GitHub',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M12 .5C5.73.5.6 5.63.6 11.9c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55v-1.93c-3.17.69-3.84-1.53-3.84-1.53-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.33.95.1-.74.4-1.25.72-1.54-2.53-.29-5.19-1.27-5.19-5.62 0-1.24.44-2.25 1.17-3.05-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.9 10.9 0 0 1 5.73 0c2.18-1.48 3.14-1.17 3.14-1.17.62 1.58.23 2.75.12 3.04.73.8 1.16 1.81 1.16 3.05 0 4.36-2.67 5.32-5.21 5.61.41.36.78 1.06.78 2.14v3.17c0 .31.2.66.79.55a11.41 11.41 0 0 0 7.77-10.78C23.4 5.63 18.27.5 12 .5Z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.74v20.52C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.74C24 .78 23.2 0 22.22 0Z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: `mailto:${EMAIL}`,
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3 6 9 7 9-7" />
      </svg>
    ),
  },
]

/* ============================================================
   Hooks
   ============================================================ */
function useTypingCycle(list) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const current = useMemo(() => list[index], [index, list])

  useEffect(() => {
    const tick = () => {
      if (isDeleting) {
        setText(prev => prev.slice(0, Math.max(prev.length - 1, 0)))
        if (text.length === 0) {
          setIsDeleting(false)
          setIndex((index + 1) % list.length)
        }
      } else {
        setText(current.slice(0, text.length + 1))
        if (text.length + 1 === current.length) setTimeout(() => setIsDeleting(true), 1600)
      }
    }
    const id = setTimeout(tick, isDeleting ? 55 : 95)
    return () => clearTimeout(id)
  }, [text, isDeleting, current, index, list])

  return text
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('reveal-visible') })
    }, { threshold: 0.12 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ============================================================
   App
   ============================================================ */
export default function App() {
  const [showIntro, setShowIntro] = useState(() => shouldPlayIntro())
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem('theme')
      if (stored) return stored === 'dark'
    } catch (_) {}
    return true // dark-first: the 3D scene shines in dark mode
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState('home')
  const [skillsOn, setSkillsOn] = useState(false)
  const typing = useTypingCycle(ROLES)
  const skillsRef = useRef(null)
  useReveal()

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false)
  }, [])

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('theme', dark ? 'dark' : 'light') } catch (_) {}
  }, [dark])

  // Scroll progress
  useEffect(() => {
    const bar = document.getElementById('scroll-progress')
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      const pct = h > 0 ? (window.scrollY / h) * 100 : 0
      if (bar) bar.style.width = `${pct}%`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Active section
  useEffect(() => {
    const ids = ['home', 'about', 'services', 'portfolio', 'contact']
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
    }, { rootMargin: '-45% 0px -50% 0px' })
    ids.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [])

  // Trigger skill bars
  useEffect(() => {
    if (!skillsRef.current) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setSkillsOn(true) }, { threshold: 0.3 })
    io.observe(skillsRef.current)
    return () => io.disconnect()
  }, [])

  const NAV = [
    ['home', 'home', 'Home'],
    ['about', 'user', 'About'],
    ['services', 'layers', 'Services'],
    ['portfolio', 'briefcase', 'Work'],
    ['contact', 'send', 'Contact'],
  ]

  const navLink = ([id, icon, label]) => (
    <a
      key={id}
      href={`#${id}`}
      onClick={() => setMenuOpen(false)}
      className={`nav-link flex items-center gap-3 pl-5 pr-4 py-2.5 rounded-xl font-medium transition-colors ${active === id ? 'active text-[var(--text)]' : 'text-[var(--text-soft)] hover:text-[var(--text)]'}`}
      style={active === id ? { background: 'color-mix(in srgb, var(--bleu-dark) 12%, transparent)' } : undefined}
    >
      <span className="nav-dot" />
      <Icon name={icon} size={18} />
      {label}
    </a>
  )

  return (
    <div className="min-h-screen">
      {showIntro && <IntroGlobe onComplete={handleIntroComplete} />}
      {/* Scroll progress */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-50 md:pl-72">
        <div id="scroll-progress" className="h-full w-0" style={{ background: 'linear-gradient(90deg,var(--bleu-dark),var(--bleu-dark),var(--cyan))' }} />
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-72 z-40 p-5 transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="glass h-full rounded-3xl flex flex-col p-5">
          <div className="flex items-center justify-between mb-8">
            <a href="#home" className="flex items-center gap-3">
              <span className="grid place-items-center h-11 w-11 rounded-2xl font-display font-bold text-white text-lg" style={{ background: 'linear-gradient(135deg,var(--bleu-dark),var(--bleu-dark))', boxShadow: '0 10px 24px -8px var(--glow)' }}>OB</span>
              <span className="leading-tight">
                <span className="font-display font-semibold block">Othmane</span>
                <span className="eyebrow text-[.6rem]">Full Stack Dev</span>
              </span>
            </a>
            <button className="md:hidden text-xl text-[var(--text-soft)]" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <Icon name="x" size={20} />
            </button>
          </div>

          <nav className="flex flex-col gap-1.5">{NAV.map(navLink)}</nav>

          <div className="mt-auto pt-6 space-y-4">
            <div className="flex items-center gap-3">
              {SOCIALS.map(({ label, href, icon }) => (
                <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="grid place-items-center h-9 w-9 rounded-xl border text-[var(--text-soft)] hover:text-[var(--text)] hover:border-[var(--bleu-dark)] transition-colors" style={{ borderColor: 'var(--border)' }} aria-label={label}>
                  {icon}
                </a>
              ))}
            </div>
            <button
              onClick={() => setDark(d => !d)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:text-[var(--text)] text-[var(--text-soft)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <Icon name={dark ? 'sun' : 'moon'} size={18} />
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-3 left-3 right-3 z-50 flex items-center justify-between glass rounded-2xl px-4 py-3">
        <span className="font-display font-semibold">Othmane<span className="gradient-text">.</span></span>
        <div className="flex items-center gap-2">
          <button onClick={() => setDark(d => !d)} className="h-9 w-9 grid place-items-center rounded-xl border" style={{ borderColor: 'var(--border)' }} aria-label="Toggle theme">
            <Icon name={dark ? 'sun' : 'moon'} size={18} />
          </button>
          <button onClick={() => setMenuOpen(true)} className="h-9 w-9 grid place-items-center rounded-xl border" style={{ borderColor: 'var(--border)' }} aria-label="Open menu">
            <Icon name="menu" size={18} />
          </button>
        </div>
      </div>
      {menuOpen && <div onClick={() => setMenuOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden" />}

      {/* Main */}
      <main className="md:pl-72 px-4 md:px-8 pb-10 pt-20 md:pt-8 space-y-6 max-w-[1400px]">

        {/* HERO */}
        <section id="home" className="relative overflow-hidden rounded-[28px] min-h-[88vh] flex items-center panel">
          <div className="absolute inset-0 -z-20" style={{ background: 'radial-gradient(700px 400px at 75% 15%, color-mix(in srgb, var(--bleu-dark) 22%, transparent), transparent 60%), radial-gradient(600px 380px at 15% 80%, color-mix(in srgb, var(--bleu-dark) 18%, transparent), transparent 60%)' }} aria-hidden="true" />
          <ThreeHero dark={dark} />
          <div className="relative z-10 w-full grid lg:grid-cols-5 gap-10 items-center p-7 md:p-14">
            <div className="lg:col-span-3">
              <p className="eyebrow mb-5 flex items-center gap-3">
                <span className="inline-block h-px w-8" style={{ background: 'var(--bleu-dark)' }} />
                Based in Oujda · Morocco
              </p>
              <h1 className="font-display font-bold leading-[1.04] tracking-tight text-[2.7rem] sm:text-6xl xl:text-7xl">
                Belhouari<br /><span className="gradient-text">Othmane</span>
              </h1>
              <p className="mt-5 text-lg md:text-xl font-mono-ui text-[var(--text-soft)]">
                I build <span className="text-[var(--text)] border-r-2 pr-1" style={{ borderColor: 'var(--bleu-dark)' }}>{typing}</span>
              </p>
              <p className="mt-5 max-w-xl text-[var(--text-soft)] leading-relaxed">
                Full stack developer crafting complete web applications — from polished interfaces down to the database. I like solving hard problems, exploring new tools, and shipping fast, well-structured solutions.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#contact" className="btn-primary"><Icon name="send" size={16} /> Hire me</a>
                <a href="/cv.pdf" download="Belhouari_Othmane_CV.pdf" className="btn-ghost"><Icon name="download" size={16} /> Download CV</a>
              </div>
            </div>

            <div className="lg:col-span-2 flex justify-center">
              <div className="relative float-media">
                <span className="ring-orbit" />
                <span className="absolute -inset-3 rounded-[30px] blur-2xl" style={{ background: 'radial-gradient(circle at 50% 30%, var(--glow), transparent 70%)' }} />
                <div className="relative h-72 w-72 md:h-80 md:w-80 rounded-[28px] overflow-hidden border" style={{ borderColor: 'var(--border)', boxShadow: '0 40px 80px -30px rgba(0,0,0,.6)' }}>
                  <img src="/img/PROFIL.png" alt="Belhouari Othmane" className="h-full w-full object-cover object-top" />
                </div>
                <div className="absolute -bottom-4 -left-4 glass rounded-2xl px-4 py-2.5 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
                  <span className="text-sm font-medium">Available for work</span>
                </div>
              </div>
            </div>
          </div>

          {/* scroll cue */}
          <a href="#about" className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-2 text-[var(--text-soft)]">
            <span className="eyebrow text-[.6rem]">Scroll</span>
            <span className="h-9 w-5 rounded-full border flex justify-center pt-1.5" style={{ borderColor: 'var(--border)' }}>
              <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: 'var(--bleu-dark)' }} />
            </span>
          </a>
        </section>

        {/* TECH MARQUEE */}
        <section className="panel py-5 overflow-hidden reveal">
          <div className="marquee-mask">
            <div className="marquee">
              {[...STACK, ...STACK].map((t, i) => (
                <span key={i} className="font-mono-ui text-sm md:text-base text-[var(--text-soft)] flex items-center gap-2 whitespace-nowrap">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: i % 2 ? 'var(--bleu-dark)' : 'var(--bleu-dark)' }} /> {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 reveal">
          {STATS.map(({ value, label }) => (
            <div key={label} className="panel p-6 text-center dot-grid">
              <div className="font-display font-bold text-3xl md:text-4xl gradient-text">{value}</div>
              <div className="eyebrow mt-2">{label}</div>
            </div>
          ))}
        </section>

        {/* ABOUT */}
        <section id="about" className="panel p-7 md:p-10 reveal">
          <p className="eyebrow mb-2">Get to know me</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-8">About <span className="gradient-text">me</span></h2>

          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <p className="text-[var(--text-soft)] leading-relaxed mb-6">
                I'm a dedicated full stack developer comfortable across the frontend and backend. I enjoy building dynamic, responsive applications with seamless user experiences, and I'm currently focused on automation, scraping and AI-assisted tooling.
              </p>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {ABOUT.map(([k, v]) => (
                  <div key={k} className="flex flex-col border-b pb-2.5" style={{ borderColor: 'var(--border)' }}>
                    <span className="eyebrow text-[.6rem]">{k}</span>
                    <span className="text-sm font-medium break-words">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-7">
                <a href="/cv.pdf" download="Belhouari_Othmane_CV.pdf" className="btn-primary"><Icon name="download" size={16} /> Download CV</a>
                <a href={`mailto:${EMAIL}`} className="btn-ghost"><Icon name="mail" size={16} /> Email me</a>
              </div>
            </div>

            <div ref={skillsRef} className="space-y-6">
              <h3 className="font-display font-semibold text-lg">Skills</h3>
              {SKILLS.map(({ label, value }) => (
                <div key={label}>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="font-medium">{label}</span>
                    <span className="font-mono-ui text-[var(--text-soft)]">{skillsOn ? value : 0}%</span>
                  </div>
                  <div className="bar-track h-2.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--text) 10%, transparent)' }}>
                    <div className="bar-fill h-full rounded-full" style={{ width: skillsOn ? `${value}%` : '0%', background: 'linear-gradient(90deg,var(--bleu-dark),var(--bleu-dark))' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="grid md:grid-cols-2 gap-10 mt-12">
            {[
              ['Education', 'graduation', [
                ['2023 — 2025', 'Specialized Technician, Full Stack Development', 'Front-end and back-end software development with hands-on projects.'],
                ['2020 — 2022', 'Bachelor in Computer Science', 'Algorithms, data structures and programming fundamentals.'],
              ]],
              ['Experience', 'briefcase', [
                ['2024 — Present', 'Full Stack Developer Intern', 'Built and maintained web applications with modern technologies.'],
                ['2023 — 2024', 'Web Development Trainee', 'Delivered projects with HTML, CSS, JavaScript and PHP.'],
              ]],
            ].map(([title, icon, items]) => (
              <div key={title}>
                <h3 className="font-display font-semibold text-lg mb-6 flex items-center gap-2">
                  <Icon name={icon} className="text-[var(--bleu-dark)]" size={20} /> {title}
                </h3>
                <div className="space-y-6 border-l pl-6" style={{ borderColor: 'var(--border)' }}>
                  {items.map(([date, role, desc]) => (
                    <div key={role} className="relative">
                      <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full" style={{ background: 'linear-gradient(var(--bleu-dark),var(--bleu-dark))', boxShadow: '0 0 0 4px var(--bg)' }} />
                      <div className="eyebrow text-[.6rem] mb-1">{date}</div>
                      <div className="font-semibold">{role}</div>
                      <p className="text-sm text-[var(--text-soft)] mt-1">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" className="panel p-7 md:p-10 reveal">
          <p className="eyebrow mb-2">What I do</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-8">Services</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map(([icon, title, desc]) => (
              <TiltCard key={title} className="relative rounded-2xl p-6 overflow-hidden" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="tilt-layer">
                  <div className="mb-4 grid place-items-center h-12 w-12 rounded-2xl text-white" style={{ background: 'linear-gradient(135deg,var(--bleu-dark),var(--bleu-dark))', boxShadow: '0 12px 26px -10px var(--glow)' }}>
                    <Icon name={icon} size={22} />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-sm text-[var(--text-soft)] leading-relaxed">{desc}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* PORTFOLIO */}
        <section id="portfolio" className="panel p-7 md:p-10 reveal">
          <p className="eyebrow mb-2">Selected work</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-8">Portfolio</h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {PROJECTS.map((p) => (
              <TiltCard key={p.title} max={8} className="relative rounded-2xl overflow-hidden group" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                {p.type === 'image' ? (
                  <div className="relative overflow-hidden">
                    <img src={p.src} alt={p.title} className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(4,4,6,.78), transparent 55%)' }} />
                  </div>
                ) : (
                  <div className="cover" style={{ '--cv-a': p.a, '--cv-b': p.b }}>
                    <span className="cover-mark"><Icon name={p.icon} size={26} strokeWidth={2} /></span>
                  </div>
                )}
                <div className="tilt-layer p-5">
                  <h3 className="font-display font-semibold text-lg">{p.title}</h3>
                  <p className="text-sm text-[var(--text-soft)] mt-1.5 leading-relaxed">{p.desc}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {p.tags.map(t => (
                      <span key={t} className="font-mono-ui text-[.7rem] px-2.5 py-1 rounded-full" style={{ background: 'color-mix(in srgb, var(--bleu-dark) 16%, transparent)', color: 'var(--text-soft)' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="panel relative overflow-hidden p-7 md:p-12 text-center reveal">
          <span className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, var(--glow), transparent 70%)' }} />
          <div className="relative">
            <p className="eyebrow mb-2">Let's talk</p>
            <h2 className="font-display font-bold text-3xl md:text-5xl mb-4">Have a project in <span className="gradient-text">mind?</span></h2>
            <p className="text-[var(--text-soft)] max-w-md mx-auto mb-8">I'm open to internships, freelance work and collaborations. Drop me a line — I usually reply within a day.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
              <a href={`mailto:${EMAIL}`} className="btn-primary"><Icon name="mail" size={16} /> {EMAIL}</a>
              <a href="tel:+212620467342" className="btn-ghost"><Icon name="phone" size={16} /> +212 6 20 46 73 42</a>
            </div>
            <p className="eyebrow text-[.6rem]">Oujda, Morocco</p>
          </div>
        </section>

        <footer className="text-center text-sm text-[var(--text-soft)] py-6">
          <span className="font-mono-ui">© {new Date().getFullYear()} Belhouari Othmane — built with React, Three.js & Tailwind</span>
        </footer>
      </main>

      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full text-white grid place-items-center transition-transform hover:-translate-y-1"
        style={{ background: 'linear-gradient(135deg,var(--bleu-dark),var(--bleu-dark))', boxShadow: '0 14px 30px -10px var(--glow)' }}
        aria-label="Back to top"
      >
        <Icon name="arrowUp" size={18} />
      </button>
    </div>
  )
}
