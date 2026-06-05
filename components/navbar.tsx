"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <span className="text-primary font-bold text-sm">GP</span>
          </div>
          <span className="text-primary font-semibold hidden sm:block">Guardian Protocol</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link 
            href="#features" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link 
            href="#about" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            About
          </Link>
          <Link 
            href="#contact" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}
