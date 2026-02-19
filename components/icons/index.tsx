'use client'

/**
 * Momentu AI — Custom Animated Icon Set
 * 10 icons, 100% original, Framer Motion powered
 * Brand: Rose #C9607A · Cream #FAF7F5 · Gold #C9A84C · Dark #2C1810
 * Style: thin stroke, elegant, artisanal warmth
 */

import { motion, useAnimation, Variants } from 'framer-motion'
import { useEffect } from 'react'

// ─────────────────────────────────────────
// Shared SVG wrapper
// ─────────────────────────────────────────
interface SvgProps {
  size?: number
  color?: string
  className?: string
}

const svgBase = {
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

// ─────────────────────────────────────────
// 1. SparkleIcon
// 4 stars in diamond pattern, staggered scale animation
// ─────────────────────────────────────────
export function SparkleIcon({
  size = 24,
  color = '#C9607A',
  animate = true,
}: SvgProps & { animate?: boolean }) {
  const stars = [
    // center-top big star
    {
      d: 'M12,3 L12.9,9.1 L19,10 L12.9,10.9 L12,17 L11.1,10.9 L5,10 L11.1,9.1 Z',
      scale: 1,
      delay: 0,
      cx: 12,
      cy: 10,
    },
    // top-right small
    {
      d: 'M19,3 L19.5,5.5 L22,6 L19.5,6.5 L19,9 L18.5,6.5 L16,6 L18.5,5.5 Z',
      scale: 0.8,
      delay: 0.2,
      cx: 19,
      cy: 6,
    },
    // bottom-left small
    {
      d: 'M5,15 L5.5,17.5 L8,18 L5.5,18.5 L5,21 L4.5,18.5 L2,18 L4.5,17.5 Z',
      scale: 0.7,
      delay: 0.35,
      cx: 5,
      cy: 18,
    },
    // right small
    {
      d: 'M20,13 L20.4,14.6 L22,15 L20.4,15.4 L20,17 L19.6,15.4 L18,15 L19.6,14.6 Z',
      scale: 0.65,
      delay: 0.5,
      cx: 20,
      cy: 15,
    },
  ]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...svgBase}
    >
      {stars.map((star, i) => (
        <motion.path
          key={i}
          d={star.d}
          fill={color}
          stroke="none"
          initial={{ scale: 0.6, opacity: 0.4 }}
          animate={
            animate
              ? {
                  scale: [0.6, 1, 0.85, 1],
                  opacity: [0.4, 1, 0.7, 1],
                }
              : { scale: 1, opacity: 1 }
          }
          transition={
            animate
              ? {
                  duration: 1.8,
                  delay: star.delay,
                  repeat: Infinity,
                  repeatDelay: 0.4,
                  ease: 'easeOut',
                }
              : {}
          }
          style={{ transformOrigin: `${star.cx}px ${star.cy}px` }}
        />
      ))}
    </svg>
  )
}

// ─────────────────────────────────────────
// 2. CameraIcon
// Shutter blink animation on lens inner circle
// ─────────────────────────────────────────
export function CameraIcon({
  size = 24,
  color = '#C9607A',
  animate = false,
}: SvgProps & { animate?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svgBase}>
      {/* Camera body */}
      <rect
        x="2" y="7" width="20" height="14" rx="3"
        stroke={color} strokeWidth="1.75"
      />
      {/* Flash bump */}
      <path
        d="M8,7 L8,5 Q8,4 9,4 L11,4 Q12,4 12,5 L12,7"
        stroke={color} strokeWidth="1.75"
      />
      {/* Lens outer */}
      <circle cx="12" cy="14" r="4" stroke={color} strokeWidth="1.75" />
      {/* Lens inner — this animates */}
      <motion.circle
        cx="12" cy="14" r="2.5"
        stroke={color} strokeWidth="1.5"
        animate={
          animate
            ? { scale: [1, 0.55, 1], opacity: [1, 0.3, 1] }
            : { scale: 1, opacity: 1 }
        }
        transition={
          animate
            ? {
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 2.5,
                ease: 'easeOut',
              }
            : {}
        }
        style={{ transformOrigin: '12px 14px' }}
      />
      {/* Lens shine — filled dot */}
      <circle cx="13.5" cy="12.5" r="0.8" fill={color} stroke="none" />
    </svg>
  )
}

// ─────────────────────────────────────────
// 3. AlbumIcon
// 3 pages fan out on animate
// ─────────────────────────────────────────
export function AlbumIcon({
  size = 24,
  color = '#C9607A',
  animate = false,
}: SvgProps & { animate?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svgBase}>
      {/* Back page */}
      <motion.rect
        x="5" y="4" width="14" height="17" rx="1.5"
        stroke={color} strokeWidth="1.5" fill="none"
        animate={
          animate
            ? { rotate: [0, 6, 0], x: [0, 1, 0], y: [0, -1, 0] }
            : { rotate: 4 }
        }
        initial={{ rotate: 4 }}
        transition={
          animate
            ? { duration: 1.4, repeat: Infinity, repeatDelay: 0.8, ease: 'easeOut' }
            : { duration: 0 }
        }
        style={{ transformOrigin: '12px 12px' }}
        opacity={0.45}
      />
      {/* Middle page */}
      <motion.rect
        x="5" y="4" width="14" height="17" rx="1.5"
        stroke={color} strokeWidth="1.5" fill="none"
        animate={
          animate
            ? { rotate: [0, 3, 0], x: [0, 0.5, 0], y: [0, -0.5, 0] }
            : { rotate: 2 }
        }
        initial={{ rotate: 2 }}
        transition={
          animate
            ? { duration: 1.4, delay: 0.08, repeat: Infinity, repeatDelay: 0.8, ease: 'easeOut' }
            : { duration: 0 }
        }
        style={{ transformOrigin: '12px 12px' }}
        opacity={0.7}
      />
      {/* Front page */}
      <rect
        x="5" y="4" width="14" height="17" rx="1.5"
        stroke={color} strokeWidth="1.75" fill="none"
      />
      {/* Photo line decorations */}
      <line x1="8" y1="9" x2="16" y2="9" stroke={color} strokeWidth="1.25" opacity={0.5} />
      <line x1="8" y1="12" x2="14" y2="12" stroke={color} strokeWidth="1.25" opacity={0.35} />
      <line x1="8" y1="15" x2="13" y2="15" stroke={color} strokeWidth="1.25" opacity={0.25} />
    </svg>
  )
}

// ─────────────────────────────────────────
// 4. HeartIcon
// Heartbeat: double-pulse scale animation
// ─────────────────────────────────────────
export function HeartIcon({
  size = 24,
  color = '#C9607A',
  filled = false,
  animate = false,
}: SvgProps & { filled?: boolean; animate?: boolean }) {
  const heartPath =
    'M12,20.5 L4.5,13 C2.5,11 2.5,7.8 4.5,5.8 C5.5,4.8 6.8,4.3 8.1,4.3 C9.4,4.3 10.7,4.8 11.7,5.8 L12,6.1 L12.3,5.8 C13.3,4.8 14.6,4.3 15.9,4.3 C17.2,4.3 18.5,4.8 19.5,5.8 C21.5,7.8 21.5,11 19.5,13 Z'

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svgBase}>
      <motion.path
        d={heartPath}
        stroke={color}
        strokeWidth="1.75"
        fill={filled ? color : 'none'}
        fillOpacity={filled ? 0.15 : 0}
        animate={
          animate
            ? {
                scale: [1, 1.15, 1, 1.1, 1],
              }
            : { scale: 1 }
        }
        transition={
          animate
            ? {
                duration: 0.9,
                times: [0, 0.2, 0.35, 0.55, 0.75],
                repeat: Infinity,
                repeatDelay: 0.9,
                ease: 'easeOut',
              }
            : {}
        }
        style={{ transformOrigin: '12px 12px' }}
      />
    </svg>
  )
}

// ─────────────────────────────────────────
// 5. UploadIcon
// Arrow floats upward in a loop
// ─────────────────────────────────────────
export function UploadIcon({
  size = 24,
  color = '#C9607A',
  animate = false,
}: SvgProps & { animate?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svgBase}>
      {/* Cloud */}
      <path
        d="M6,15 Q3,15 3,12 Q3,9 6,9 Q6.5,6.5 9,6 Q10,3 13,3 Q17,3 18,6 Q21,6.5 21,9 Q21,12 18,12 Q18,15 15,15"
        stroke={color}
        strokeWidth="1.75"
        fill="none"
      />
      {/* Arrow + base — animates */}
      <motion.g
        animate={
          animate
            ? { y: [0, -3.5, 0] }
            : { y: 0 }
        }
        transition={
          animate
            ? {
                duration: 1.2,
                repeat: Infinity,
                repeatDelay: 0.3,
                ease: 'easeInOut',
              }
            : {}
        }
      >
        {/* Vertical line */}
        <line x1="12" y1="20" x2="12" y2="13" stroke={color} strokeWidth="1.75" />
        {/* Arrowhead */}
        <path d="M9,16 L12,13 L15,16" stroke={color} strokeWidth="1.75" />
        {/* Base line */}
        <line x1="8" y1="21" x2="16" y2="21" stroke={color} strokeWidth="1.75" />
      </motion.g>
    </svg>
  )
}

// ─────────────────────────────────────────
// 6. LoadingDotsIcon
// 3 dots wave-pulsing
// ─────────────────────────────────────────
export function LoadingDotsIcon({
  size = 24,
  color = '#C9607A',
}: SvgProps) {
  const dots = [
    { cx: 6, delay: 0 },
    { cx: 12, delay: 0.15 },
    { cx: 18, delay: 0.3 },
  ]

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svgBase}>
      {dots.map((dot, i) => (
        <motion.circle
          key={i}
          cx={dot.cx}
          cy="12"
          r="2"
          fill={color}
          stroke="none"
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.5, 1, 0.5],
            y: [0, -2.5, 0],
          }}
          transition={{
            duration: 0.9,
            delay: dot.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: `${dot.cx}px 12px` }}
        />
      ))}
    </svg>
  )
}

// ─────────────────────────────────────────
// 7. CheckIcon
// Circle scales in, then path draws itself
// ─────────────────────────────────────────
export function CheckIcon({
  size = 24,
  color = '#C9607A',
  animate = true,
}: SvgProps & { animate?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svgBase}>
      {/* Background circle */}
      <motion.circle
        cx="12" cy="12" r="10"
        stroke={color}
        strokeWidth="1.75"
        fill={color}
        fillOpacity={0.08}
        initial={animate ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={
          animate
            ? { type: 'spring', stiffness: 260, damping: 20, duration: 0.5 }
            : {}
        }
        style={{ transformOrigin: '12px 12px' }}
      />
      {/* Checkmark draws itself */}
      <motion.path
        d="M7,12 L10.5,15.5 L17,8.5"
        stroke={color}
        strokeWidth="2"
        fill="none"
        initial={animate ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={
          animate
            ? { duration: 0.45, delay: 0.25, ease: 'easeOut' }
            : {}
        }
      />
    </svg>
  )
}

// ─────────────────────────────────────────
// 8. PhotoStackIcon
// 3 photo rects that fan/stack on animate
// ─────────────────────────────────────────
export function PhotoStackIcon({
  size = 24,
  color = '#C9607A',
  grouped = false,
  animate = false,
}: SvgProps & { grouped?: boolean; animate?: boolean }) {
  const isGrouped = grouped || animate

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svgBase}>
      {/* Left photo */}
      <motion.rect
        x="2" y="7" width="9" height="11" rx="1.5"
        stroke={color} strokeWidth="1.5" fill="none"
        animate={{ x: isGrouped ? 3 : 0, rotate: isGrouped ? -5 : -8 }}
        initial={{ x: 0, rotate: -8 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ transformOrigin: '6.5px 12.5px' }}
        opacity={0.6}
      />
      {/* Right photo */}
      <motion.rect
        x="13" y="7" width="9" height="11" rx="1.5"
        stroke={color} strokeWidth="1.5" fill="none"
        animate={{ x: isGrouped ? -3 : 0, rotate: isGrouped ? 5 : 8 }}
        initial={{ x: 0, rotate: 8 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ transformOrigin: '17.5px 12.5px' }}
        opacity={0.6}
      />
      {/* Center photo — always on top */}
      <rect
        x="7" y="5" width="10" height="13" rx="1.5"
        stroke={color} strokeWidth="1.75" fill="none"
      />
      {/* Small landscape line inside center */}
      <path
        d="M9,14 Q10.5,12 12,13.5 Q13.5,15 15,13"
        stroke={color} strokeWidth="1.25" opacity={0.4}
      />
    </svg>
  )
}

// ─────────────────────────────────────────
// 9. MagicWandIcon
// Wand rotates gently + sparkles appear around it
// ─────────────────────────────────────────
export function MagicWandIcon({
  size = 24,
  color = '#C9607A',
  animate = false,
}: SvgProps & { animate?: boolean }) {
  const sparkles = [
    { cx: 16, cy: 5, r: 1.2, delay: 0 },
    { cx: 19, cy: 10, r: 0.9, delay: 0.3 },
    { cx: 13, cy: 3, r: 0.7, delay: 0.55 },
  ]

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svgBase}>
      {/* Wand body — rotates */}
      <motion.g
        animate={animate ? { rotate: [-2, 5, -2] } : { rotate: 0 }}
        transition={
          animate
            ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            : {}
        }
        style={{ transformOrigin: '12px 12px' }}
      >
        {/* Wand stick */}
        <line x1="4" y1="20" x2="16" y2="8" stroke={color} strokeWidth="2" />
        {/* Wand handle grip */}
        <line x1="4" y1="20" x2="7" y2="17" stroke={color} strokeWidth="3" strokeLinecap="round" opacity={0.4} />
        {/* Star at tip */}
        <path
          d="M16,5 L16.6,7.4 L19,8 L16.6,8.6 L16,11 L15.4,8.6 L13,8 L15.4,7.4 Z"
          fill={color}
          stroke="none"
        />
      </motion.g>

      {/* Floating sparkles */}
      {sparkles.map((s, i) => (
        <motion.circle
          key={i}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill={color}
          stroke="none"
          animate={
            animate
              ? {
                  scale: [0, 1.2, 0],
                  opacity: [0, 1, 0],
                }
              : { scale: 1, opacity: 0.6 }
          }
          transition={
            animate
              ? {
                  duration: 1.2,
                  delay: s.delay,
                  repeat: Infinity,
                  repeatDelay: 0.8,
                  ease: 'easeOut',
                }
              : {}
          }
          style={{ transformOrigin: `${s.cx}px ${s.cy}px` }}
        />
      ))}
    </svg>
  )
}

// ─────────────────────────────────────────
// 10. GeneratingAnimation
// Full-screen composition: album building + orbiting sparkles
// ─────────────────────────────────────────
interface GeneratingAnimationProps {
  label?: string
  size?: number
}

export function GeneratingAnimation({
  label = 'Criando seu álbum...',
  size = 200,
}: GeneratingAnimationProps) {
  // 4 orbiting sparkles at 0°, 90°, 180°, 270°
  const orbitRadius = 70
  const orbitSparkles = [0, 90, 180, 270].map((deg, i) => ({
    deg,
    delay: i * 0.2,
  }))

  // Page build-up lines (simulate content appearing)
  const pageLines = [
    { y: 72, width: 80, delay: 0.6 },
    { y: 82, width: 60, delay: 0.9 },
    { y: 92, width: 70, delay: 1.2 },
    { y: 102, width: 50, delay: 1.5 },
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        width: size,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Orbiting sparkles */}
        {orbitSparkles.map((s, i) => (
          <motion.g
            key={i}
            style={{ transformOrigin: '100px 100px' }}
            animate={{ rotate: [s.deg, s.deg + 360] }}
            transition={{
              duration: 6,
              delay: s.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <motion.circle
              cx={100 + orbitRadius}
              cy={100}
              r="5"
              fill="#C9607A"
              stroke="none"
              animate={{
                scale: [0.6, 1.3, 0.6],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.5,
                delay: s.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ transformOrigin: `${100 + orbitRadius}px 100px` }}
            />
          </motion.g>
        ))}

        {/* Album back page */}
        <motion.rect
          x="48" y="46" width="104" height="122" rx="6"
          stroke="#C9607A" strokeWidth="2" fill="none"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3, rotate: 4 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22, delay: 0.1 }}
          style={{ transformOrigin: '100px 107px' }}
        />

        {/* Album mid page */}
        <motion.rect
          x="48" y="46" width="104" height="122" rx="6"
          stroke="#C9607A" strokeWidth="2" fill="none"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.55, rotate: 2 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22, delay: 0.2 }}
          style={{ transformOrigin: '100px 107px' }}
        />

        {/* Album front page */}
        <motion.rect
          x="48" y="46" width="104" height="122" rx="6"
          stroke="#C9607A" strokeWidth="2"
          fill="#C9607A" fillOpacity={0.04}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }}
          style={{ transformOrigin: '100px 107px' }}
        />

        {/* Photo placeholder inside album */}
        <motion.rect
          x="62" y="58" width="76" height="54" rx="3"
          stroke="#C9607A" strokeWidth="1.5"
          fill="#C9607A" fillOpacity={0.06}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        />

        {/* "Photo" landscape line inside */}
        <motion.path
          d="M68,95 Q76,84 85,90 Q93,96 100,88 Q108,80 115,88 Q120,94 130,90"
          stroke="#C9607A" strokeWidth="1.5" fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ delay: 0.9, duration: 0.8, ease: 'easeOut' }}
        />

        {/* Text lines building up */}
        {pageLines.map((line, i) => (
          <motion.rect
            key={i}
            x={(200 - line.width) / 2}
            y={line.y + 50}
            width={line.width}
            height="4"
            rx="2"
            fill="#C9607A"
            fillOpacity={0.25}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: line.delay, duration: 0.4, ease: 'easeOut' }}
            style={{ transformOrigin: `${(200 - line.width) / 2}px ${line.y + 52}px` }}
          />
        ))}

        {/* Center sparkle on album cover */}
        <motion.g
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ transformOrigin: '100px 100px' }}
        >
          <path
            d="M100,82 L101.8,93 L113,95 L101.8,97 L100,108 L98.2,97 L87,95 L98.2,93 Z"
            fill="#C9A84C"
            stroke="none"
            opacity={0.8}
          />
        </motion.g>
      </svg>

      {/* Label */}
      <motion.p
        style={{
          color: '#2C1810',
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: '0.02em',
          margin: 0,
          opacity: 0.8,
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {label}
      </motion.p>
    </div>
  )
}
