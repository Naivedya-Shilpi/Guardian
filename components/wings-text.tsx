"use client"

import { motion } from "framer-motion"

interface WingsTextProps {
  mainTitle: string
  subtitle: string
  tagline: string
}

export function WingsText({ mainTitle, subtitle, tagline }: WingsTextProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
      <div className="text-center px-4">
        {/* Tagline above */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-sm md:text-base tracking-[0.3em] text-primary/60 uppercase mb-6"
        >
          {tagline}
        </motion.p>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight glow-text text-primary"
        >
          {mainTitle}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg md:text-xl lg:text-2xl text-primary/70 mt-4 tracking-wide"
        >
          {subtitle}
        </motion.p>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="h-[1px] w-32 md:w-48 mx-auto mt-8 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        />
      </div>
    </div>
  )
}
