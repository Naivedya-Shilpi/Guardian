"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation" // Added for redirecting
import { ArrowLeft, Shield, User, Mail, Lock, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [statusMsg, setStatusMsg] = useState("")

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMsg("Processing...")

    if (!isLogin) {
      // --- REGISTRATION LOGIC ---
      try {
        const response = await fetch("http://localhost:3000/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatusMsg("✅ Identity Established! You can now authenticate.")
          setName("")
          setPassword("")
          setIsLogin(true) 
        } else {
          setStatusMsg(`❌ Error: ${data.error}`)
        }
      } catch (error) {
        setStatusMsg("❌ Network Error: Connection to backend on port 3000 failed.")
      }
    } else {
      // --- LOGIN LOGIC ---
      try {
        const response = await fetch("http://localhost:3000/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatusMsg(`🔓 Access Granted. Welcome, ${data.operator.name}.`)
          
          // Wait 1.5 seconds so they can see the success message, then route them away
          setTimeout(() => {
            router.push('/') // Change this later when you build a real dashboard page
          }, 1500)
          
        } else {
          setStatusMsg(`❌ Access Denied: ${data.error}`)
        }
      } catch (error) {
        setStatusMsg("❌ Network Error: Connection to backend on port 3000 failed.")
      }
    }
  }

  return (
    <main className="min-h-screen bg-background cyber-grid flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="rounded-full bg-primary/5 animate-pulse" style={{ width: '600px', height: '600px', filter: 'blur(120px)' }} />
      </div>

      <div className="z-10 relative flex flex-col mx-auto" style={{ width: '330px' }}>
        
        <Link 
          href="/" 
          className="self-start flex items-center gap-2 group text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="group-hover:-translate-x-1 transition-transform" style={{ width: '18px', height: '18px' }} />
          <span className="text-sm tracking-wider uppercase font-medium">Abort Protocol</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="flex flex-col items-center mb-6">
            <div className="rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(255,0,0,0.1)]" style={{ width: '64px', height: '64px' }}>
              <Shield className="text-primary" style={{ width: '32px', height: '32px' }} />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
              {isLogin ? "System Access" : "Initiate Protocol"}
            </h1>
            <p className="text-muted-foreground text-center text-sm px-2">
              {isLogin ? "Authenticate to access the Guardian platform" : "Register a new operator identity"}
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-black/40 border border-white/5 backdrop-blur-xl shadow-2xl w-full">
            <form className="space-y-5" onSubmit={handleAuth}>
              
              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">Operator Name</label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" style={{ width: '18px', height: '18px' }} />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-base text-foreground focus:border-primary/50 focus:bg-white/10 outline-none transition-all placeholder:text-muted-foreground/40"
                        style={{ height: '48px' }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">Encrypted Comm</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" style={{ width: '18px', height: '18px' }} />
                  <input
                    type="email"
                    placeholder="operator@guardian.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-base text-foreground focus:border-primary/50 focus:bg-white/10 outline-none transition-all placeholder:text-muted-foreground/40"
                    style={{ height: '48px' }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">Security Key</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" style={{ width: '18px', height: '18px' }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 text-base text-foreground focus:border-primary/50 focus:bg-white/10 outline-none transition-all placeholder:text-muted-foreground/40"
                    style={{ height: '48px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                  </button>
                </div>
              </div>

              {statusMsg && (
                <div className="text-xs text-center font-medium mt-2 text-primary/80">
                  {statusMsg}
                </div>
              )}

              <Button 
                type="submit"
                className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-base font-semibold tracking-wide transition-all shadow-[0_0_20px_rgba(255,0,0,0.2)] hover:shadow-[0_0_30px_rgba(255,0,0,0.4)]"
                style={{ height: '48px' }}
              >
                {isLogin ? "Authenticate" : "Establish Identity"}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin)
                  setStatusMsg("")
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {isLogin ? "New user? " : "Already registered? "}
                <span className="text-primary hover:underline underline-offset-4">
                  {isLogin ? "Establish an identity here." : "Authenticate here."}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}