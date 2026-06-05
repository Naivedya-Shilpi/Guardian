"use client"

import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { ParticleField } from "@/components/particle-field"
import { WingsText } from "@/components/wings-text"
import { FeaturesSection } from "@/components/features-section"
import { StatsSection } from "@/components/stats-section"
import { AboutSection } from "@/components/about-section"
import { CTASection } from "@/components/cta-section"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ChevronDown } from "lucide-react"

const AngelWings3D = dynamic(
  () => import("@/components/angel-wings-3d").then(mod => ({ default: mod.AngelWings3D })),
  { ssr: false }
)

export default function Home() {
  return (
    <main className="min-h-screen bg-background cyber-grid">
      <Navbar />
      <ParticleField />

      {/* Hero Section with 3D Wings */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-primary/5 blur-[100px] animate-pulse" />
        </div>

        {/* 3D Angel Wings */}
        <AngelWings3D />

        {/* Text overlay on wings */}
        <WingsText 
          mainTitle="GUARDIAN"
          subtitle="PROTOCOL"
          tagline="Cyber Security Evolved"
        />

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 text-muted-foreground"
          >
            <span className="text-xs tracking-wider uppercase">Scroll to explore</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* Content Sections */}
      <div id="features">
        <StatsSection />
        <FeaturesSection />
      </div>
      
      <div id="about">
        <AboutSection />
      </div>
      
      <div id="contact">
        <CTASection />
      </div>

      <Footer />
    </main>
  )
}
