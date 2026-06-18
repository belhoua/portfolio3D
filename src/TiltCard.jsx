import { useRef } from 'react'

/**
 * 3D tilt card: rotates in perspective toward the cursor and moves a glare highlight.
 * Children can use `.tilt-layer` to pop forward in Z for parallax depth.
 */
export default function TiltCard({ as: Tag = 'div', className = '', max = 10, children, ...rest }) {
  const ref = useRef(null)
  const raf = useRef(0)

  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const rotX = (0.5 - py) * max
    const rotY = (px - 0.5) * max
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`
      el.style.setProperty('--mx', `${px * 100}%`)
      el.style.setProperty('--my', `${py * 100}%`)
    })
  }

  const reset = () => {
    const el = ref.current
    if (!el) return
    cancelAnimationFrame(raf.current)
    el.style.transform = 'perspective(900px) rotateX(0) rotateY(0)'
  }

  return (
    <Tag
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={`tilt ${className}`}
      {...rest}
    >
      <span className="tilt-glare" />
      {children}
    </Tag>
  )
}
