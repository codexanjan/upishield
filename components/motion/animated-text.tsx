'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'

interface MotionTextProps {
  children: ReactNode
  className?: string
  delay?: number
}

// Fade and smooth vertical slide
export function MotionFadeUp({ children, className = '', delay = 0 }: MotionTextProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Words stagger reveal for hero headlines
export function MotionWordReveal({
  text,
  highlightWord,
  className = '',
  highlightClassName = 'text-[#b8f55e]',
  delay = 0
}: {
  text: string
  highlightWord?: string
  className?: string
  highlightClassName?: string
  delay?: number
}) {
  const words = text.split(' ')

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: delay * i },
    }),
  }

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        damping: 18,
        stiffness: 120,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      filter: 'blur(4px)',
      transition: {
        type: 'spring',
        damping: 18,
        stiffness: 120,
      },
    },
  }

  return (
    <motion.span
      variants={container}
      initial="hidden"
      animate="visible"
      className={`inline-block ${className}`}
    >
      {words.map((word, index) => {
        const isHighlight = highlightWord && word.toLowerCase().includes(highlightWord.toLowerCase())
        return (
          <motion.span
            variants={child}
            key={index}
            className={`inline-block mr-[0.28em] last:mr-0 ${isHighlight ? highlightClassName : ''}`}
          >
            {word}
          </motion.span>
        )
      })}
    </motion.span>
  )
}

// Animated Pill Badge
export function MotionBadge({
  children,
  text,
  variant,
  className = ''
}: {
  children?: ReactNode
  text?: string
  variant?: string
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ scale: 1.03 }}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      {text ? <span>{text}</span> : children}
    </motion.div>
  )
}

// Viewport Scroll Reveal for Landing Page sections
export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up'
}: {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}) {
  const directions = {
    up: { y: 24, x: 0 },
    down: { y: -24, x: 0 },
    left: { x: 28, y: 0 },
    right: { x: -28, y: 0 },
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction], filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
