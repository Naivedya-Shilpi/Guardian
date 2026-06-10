"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { LogOut } from "lucide-react"

// Define the props so it accepts the operator state from page.tsx
interface NavbarProps {
  operator?: { name: string; email: string } | null
  setOperator?: (op: null) => void
}

export function Navbar({ operator, setOperator }: NavbarProps) {
  
  const handleLogout = () => {
    localStorage.removeItem('guardian_operator')
    if (setOperator) setOperator(null)
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-sm bg-background/50 border-b border-border/10"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <span className="text-primary font-bold text-sm">GP</span>
          </div>
          <span className="text-primary font-semibold hidden sm:block">Guardian Protocol</span>
        </Link>

        <div className="flex items-center gap-6">
          {!operator ? (
            // PUBLIC LINKS
            <>
              <Link href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</Link>
              <Link href="#about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About</Link>
              <Link href="/login" className="text-sm font-medium text-primary hover:text-white transition-colors border border-primary/30 px-4 py-2 rounded-lg bg-primary/10">System Access</Link>
            </>
          ) : (
            // AUTHENTICATED LINKS
            <div className="flex items-center gap-4">
              <span className="text-primary font-medium tracking-wide text-sm hidden sm:block">
                OP: {operator.name}
              </span>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-lg transition-all border border-red-500/20"
                title="Disconnect Operator"
              >
                <LogOut className="w-4 h-4" />
                <span className="uppercase text-xs font-bold tracking-wider hidden sm:block">Disconnect</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  )
}