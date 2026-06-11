"use client"

import { useEffect, useState } from "react"
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
import { ChevronDown, MonitorSmartphone, Globe, Download, RefreshCw } from "lucide-react"

const AngelWings3D = dynamic(
  () => import("@/components/angel-wings-3d").then(mod => ({ default: mod.AngelWings3D })),
  { ssr: false }
)

export default function Home() {
  const [operator, setOperator] = useState<{name: string, email: string} | null>(null)
  
  // NEW STATES FOR SCAN DATA
  const [scanData, setScanData] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // FUNCTION TO FETCH FROM BACKEND
  const fetchReports = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('http://localhost:3000/api/reports')
      const json = await res.json()
      if (json.data) setScanData(json.data)
    } catch (error) {
      console.error("Error fetching intelligence:", error)
    }
    setTimeout(() => setIsRefreshing(false), 500) // little delay for visual feedback
  }

  // On mount, check if the user is logged in
  useEffect(() => {
    const savedOperator = localStorage.getItem('guardian_operator')
    if (savedOperator) {
      setOperator(JSON.parse(savedOperator))
    }
  }, [])

  return (
    <main className="min-h-screen bg-background cyber-grid">
      {/* Pass the operator state to the Navbar so it can switch to Logout mode */}
      <Navbar operator={operator} setOperator={setOperator} />
      
      <ParticleField />

      {/* --- HERO SECTION WITH 3D WINGS (Always Visible) --- */}
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

      {/* --- CONDITIONAL BOTTOM CONTENT --- */}
      {!operator ? (
        
        // PUBLIC VIEW: The standard landing page sections
        <>
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
        </>

      ) : (

        // AUTHENTICATED VIEW: The Dashboard Compartments
        <div className="relative z-20 max-w-6xl mx-auto px-6 py-24 pb-32">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* COMPARTMENT 1: Device Scanner */}
            <div className="group relative p-8 rounded-3xl bg-black/60 border border-primary/20 backdrop-blur-xl overflow-hidden hover:border-primary/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 flex flex-col h-full">
                <MonitorSmartphone className="w-12 h-12 text-primary mb-6" />
                <h2 className="text-2xl font-bold text-white mb-3">Scan Local Device</h2>
                <p className="text-muted-foreground text-sm mb-8 flex-grow">
                  Deploy the Guardian executable to your local hardware. It will scrape installed software, cross-reference the NVD, and report deep-level CVEs directly back to this command center.
                </p>
                
                <a 
  href="/agent.exe" 
  download="Guardian-Agent-v1.0.exe"
  className="flex items-center justify-center gap-3 w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold tracking-wide hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(255,0,0,0.2)] group-hover:shadow-[0_0_30px_rgba(255,0,0,0.4)]"
>
  <Download className="w-5 h-5" />
  Download Agent (v1.0.exe)
</a>
              </div>
            </div>

            {/* COMPARTMENT 2: Website Scanner */}
            <div className="group relative p-8 rounded-3xl bg-black/40 border border-white/5 backdrop-blur-xl overflow-hidden opacity-70 hover:opacity-100 transition-all duration-500">
              <div className="relative z-10 flex flex-col h-full">
                <Globe className="w-12 h-12 text-muted-foreground group-hover:text-white transition-colors mb-6" />
                <h2 className="text-2xl font-bold text-white mb-3">Scan Target URL</h2>
                <p className="text-muted-foreground text-sm mb-8 flex-grow">
                  Initiate a remote reconnaissance scan against a target domain. Analyzes headers, open ports, and surface-level vulnerabilities.
                </p>
                
                <button 
                  disabled
                  className="flex items-center justify-center gap-3 w-full bg-white/5 text-muted-foreground py-4 rounded-xl font-semibold tracking-wide border border-white/10 cursor-not-allowed"
                >
                  Module Locked (Coming Soon)
                </button>
              </div>
            </div>
          </motion.div>
          {/* --- LIVE INTELLIGENCE FEED --- */}
          <div className="mt-16 relative z-20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Live Intelligence Feed
              </h2>
              <button 
                onClick={fetchReports} 
                disabled={isRefreshing}
                className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Syncing..." : "Sync Database"}
              </button>
            </div>
            
            {scanData ? (
              <div className="bg-black/60 border border-primary/20 p-6 md:p-8 rounded-3xl backdrop-blur-xl">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-xl text-white font-mono tracking-tight">TARGET: {scanData.device}</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Scanned at: {new Date(scanData.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                    <span className="text-primary font-bold">
                      {scanData.report.reduce((acc: any, app: any) => acc + app.vulnerabilities_found, 0)} Total CVEs
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {scanData.report.map((app: any, i: number) => (
                    <div key={i} className="border border-white/5 p-5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-white text-lg">
                          {app.app_name} <span className="text-muted-foreground text-sm font-normal ml-2">v{app.version}</span>
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${app.vulnerabilities_found > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-green-500/20 text-green-400 border border-green-500/20'}`}>
                          {app.vulnerabilities_found} CVEs Found
                        </span>
                      </div>
                      
                      {app.vulnerabilities_found > 0 ? (
                        <div className="mt-4 space-y-3">
                          {app.cves.map((cve: any, j: number) => (
                            <div key={j} className="text-sm border-l-2 border-primary/50 pl-4 py-1">
                              <strong className="text-primary">{cve.id}</strong> 
                              <span className="text-muted-foreground ml-2 text-xs border border-white/10 px-2 py-0.5 rounded">CVSS: {cve.severity}</span>
                              <p className="text-gray-400 mt-1 line-clamp-2">{cve.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-green-400/70 mt-2">No known vulnerabilities detected in current version.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-12 border border-white/5 rounded-3xl bg-black/40 backdrop-blur-md">
                <MonitorSmartphone className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-white text-lg mb-2">No Target Data Available</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Deploy the agent to a local machine to intercept vulnerability data. Click 'Sync Database' to pull the latest reports.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}