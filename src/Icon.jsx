/**
 * Lightweight inline SVG icon set (stroke style, no external font dependency).
 * Usage: <Icon name="home" /> · size and className are configurable.
 */
const P = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></>,
  send: <><path d="M22 3 11 14" /><path d="M22 3 15 21l-4-7-7-4 18-7Z" /></>,
  download: <><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M4 21h16" /></>,
  mail: <><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3 6 9 7 9-7" /></>,
  phone: <><path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L20 13l-1 5a2 2 0 0 1-2 1.6A16 16 0 0 1 3.4 6 2 2 0 0 1 5 4Z" /></>,
  x: <><path d="m6 6 12 12M18 6 6 18" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5 4 4M20 20l-1-1M19 5l1-1M4 20l1-1" /></>,
  moon: <><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z" /></>,
  arrowUp: <><path d="M12 20V5" /><path d="m6 11 6-6 6 6" /></>,
  graduation: <><path d="m12 4 10 5-10 5L2 9l10-5Z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></>,
  penRuler: <><path d="M14 3.5 20.5 10 8 22.5 2 23l.5-6L14 3.5Z" /><path d="m11.5 6 6.5 6.5" /></>,
  code: <><path d="m9 8-5 4 5 4" /><path d="m15 8 5 4-5 4" /></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
  bot: <><rect x="4" y="8" width="16" height="11" rx="3" /><path d="M12 8V4" /><circle cx="9" cy="13" r="1" /><circle cx="15" cy="13" r="1" /><path d="M2 13h2M20 13h2" /></>,
  branch: <><circle cx="6" cy="5" r="2.5" /><circle cx="6" cy="19" r="2.5" /><circle cx="18" cy="7" r="2.5" /><path d="M6 7.5v9" /><path d="M18 9.5c0 4-6 2.5-6 6.5" /></>,
  gauge: <><path d="M12 14 16 9" /><path d="M4.5 18a9 9 0 1 1 15 0" /><circle cx="12" cy="14" r="1.4" /></>,
  utensils: <><path d="M4 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3" /><path d="M6 12v9" /><path d="M16 3c-1.7 0-3 2-3 5s1.3 4 3 4v9" /></>,
  workflow: <><rect x="3" y="3" width="7" height="6" rx="1.5" /><rect x="14" y="15" width="7" height="6" rx="1.5" /><path d="M10 6h4a3 3 0 0 1 3 3v6" /></>,
}

export default function Icon({ name, size = 18, className = '', strokeWidth = 1.8, ...rest }) {
  const path = P[name]
  if (!path) return null
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {path}
    </svg>
  )
}
