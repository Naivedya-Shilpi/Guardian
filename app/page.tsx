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
import { ChevronDown, MonitorSmartphone, Globe, Download, RefreshCw, Activity, ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, Server, Lock, Wifi, Info, XCircle, Terminal } from "lucide-react"
import { getApiBaseUrl } from "@/lib/api-config"

const AngelWings3D = dynamic(
  () => import("@/components/angel-wings-3d").then(mod => ({ default: mod.AngelWings3D })),
  { ssr: false }
)

export default function Home() {
  const [operator, setOperator] = useState<{name: string, email: string} | null>(null)
  
  const [scanData, setScanData] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [targetUrl, setTargetUrl] = useState("")
  const [isScanningUrl, setIsScanningUrl] = useState(false)
  const [urlScanResult, setUrlScanResult] = useState<any>(null)

  const handleUrlScan = async () => {
    if (!targetUrl) return;
    setIsScanningUrl(true);
    setUrlScanResult(null);
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/scan-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await res.json();
      setUrlScanResult(data);
    } catch (error) {
      setUrlScanResult({ error: "Failed to connect to scanner backend." });
    }
    setIsScanningUrl(false);
  }

  const fetchReports = async () => {
    setIsRefreshing(true)
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/reports`)
      const json = await res.json()
      if (json.data) setScanData(json.data)
    } catch (error) {
      console.error("Error fetching intelligence:", error)
    }
    setTimeout(() => setIsRefreshing(false), 500) 
  }

  useEffect(() => {
    const savedOperator = localStorage.getItem('guardian_operator')
    if (savedOperator) {
      setOperator(JSON.parse(savedOperator))
    }
    // Automatically load telemetry report on page load
    fetchReports()

    // Periodically poll for newly submitted telemetry from the agent
    const baseUrl = getApiBaseUrl();
    const interval = setInterval(() => {
      fetch(`${baseUrl}/api/reports`)
        .then(res => res.json())
        .then(json => {
          if (json.data) setScanData(json.data)
        })
        .catch(() => {})
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen bg-background cyber-grid">
      <Navbar operator={operator} setOperator={setOperator} />
      <ParticleField />

      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-primary/5 blur-[100px] animate-pulse" />
        </div>
        <AngelWings3D />
        <WingsText 
          mainTitle="GUARDIAN"
          subtitle="PROTOCOL"
          tagline="Cyber Security Evolved"
        />
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

      {!operator ? (
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
        <div className="relative z-20 max-w-6xl mx-auto px-6 py-24 pb-32">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="group relative p-8 rounded-3xl bg-black/60 border border-primary/20 backdrop-blur-xl overflow-hidden hover:border-primary/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex flex-col h-full">
                <MonitorSmartphone className="w-12 h-12 text-primary mb-6" />
                <h2 className="text-2xl font-bold text-white mb-3">Scan Local Device</h2>
                <p className="text-muted-foreground text-sm mb-8 flex-grow">
                  Deploy the Guardian executable to your local hardware. It will hook into the kernel to map open ports and flag suspicious processes directly to this command center.
                </p>
                <a 
                  href="/guardian-agent-v1.0.exe" 
                  download="guardian-agent-v1.0.exe"
                  className="flex items-center justify-center gap-3 w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold tracking-wide hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(255,0,0,0.2)] group-hover:shadow-[0_0_30px_rgba(255,0,0,0.4)]"
                >
                  <Download className="w-5 h-5" />
                  Download Agent (v1.0.exe)
                </a>
                <div className="mt-3 p-3 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-muted-foreground">
                  <span className="text-white font-medium">⚡ Remote Device Support:</span> Run executable on any Windows laptop. If run remotely, the agent prompts for this dashboard URL or automatically syncs via <code className="text-primary bg-black/40 px-1 py-0.5 rounded font-mono">guardian_config.json</code>.
                </div>
              </div>
            </div>

            <div className="group relative p-8 rounded-3xl bg-black/60 border border-primary/20 backdrop-blur-xl overflow-hidden hover:border-primary/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex flex-col h-full">
                <Globe className="w-12 h-12 text-primary mb-6" />
                <h2 className="text-2xl font-bold text-white mb-3">Scan Target URL</h2>
                <p className="text-muted-foreground text-sm mb-6 flex-grow">
                  Initiate a remote reconnaissance scan against a target domain. Analyzes headers, open ports, and surface-level vulnerabilities.
                </p>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="e.g., example.com"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/40"
                  />
                  <button 
                    onClick={handleUrlScan}
                    disabled={isScanningUrl || !targetUrl}
                    className="flex items-center justify-center gap-3 w-full bg-primary/20 text-primary hover:bg-primary/30 py-4 rounded-xl font-semibold tracking-wide border border-primary/30 transition-all disabled:opacity-50"
                  >
                    {isScanningUrl ? "Running Recon..." : "Initiate Remote Scan"}
                  </button>
                </div>
                {urlScanResult && (
                  <div className="mt-6 pt-5 border-t border-white/10 space-y-4">
                    {urlScanResult.error ? (
                      <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-400">Reconnaissance Blocked / Failed</p>
                          <p className="text-xs text-muted-foreground mt-1">{urlScanResult.error}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Recon Summary Header */}
                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                              Target Security Profile
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                              urlScanResult.security_grade === "A+" || urlScanResult.security_grade === "A"
                                ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : urlScanResult.security_grade === "B"
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                : "bg-red-500/10 text-red-400 border-red-500/30"
                            }`}>
                              GRADE {urlScanResult.security_grade || "B"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-white/80">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Server className="w-3.5 h-3.5 text-primary" />
                              Infrastructure:
                            </span>
                            <span className="font-mono text-white font-medium">
                              {urlScanResult.server || "Masked / Protected"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs mt-1.5 text-white/80">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Lock className="w-3.5 h-3.5 text-primary" />
                              Posture:
                            </span>
                            <span className={`font-semibold ${
                              urlScanResult.security_grade === "A+" || urlScanResult.security_grade === "A"
                                ? "text-green-400"
                                : urlScanResult.security_grade === "B"
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}>
                              {urlScanResult.posture || "ANALYSIS COMPLETE"}
                            </span>
                          </div>
                        </div>

                        {/* Security Headers & Controls Audit */}
                        {urlScanResult.passed_checks && urlScanResult.passed_checks.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                              Verified Defenses ({urlScanResult.passed_checks.length})
                            </p>
                            <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                              {urlScanResult.passed_checks.map((chk: any, cidx: number) => (
                                <div key={cidx} className="flex items-center gap-2 bg-green-500/[0.04] border border-green-500/15 p-2 rounded-lg text-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                  <span className="text-white/90 font-medium truncate">{chk.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Flagged Configuration Issues */}
                        {urlScanResult.issues && urlScanResult.issues.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider">
                              Detected Weaknesses ({urlScanResult.issues.length})
                            </p>
                            <div className="space-y-1.5">
                              {urlScanResult.issues.map((issue: string, iidx: number) => (
                                <div key={iidx} className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 p-2.5 rounded-lg text-xs text-yellow-200/90">
                                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                                  <span>{issue}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Known CVE Exploits (NVD) */}
                        {urlScanResult.cves && urlScanResult.cves.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
                              Critical Exploits (NVD)
                            </p>
                            <div className="space-y-2.5">
                              {urlScanResult.cves.map((tech: any, idx: number) => (
                                <div key={idx} className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg">
                                  <p className="text-white text-xs font-semibold mb-2">
                                    {tech.technology} <span className="text-red-400 font-normal">({tech.cve_count} Known CVEs)</span>
                                  </p>
                                  <ul className="space-y-2">
                                    {tech.top_cves.map((cve: any, cidx: number) => (
                                      <li key={cidx} className="text-xs flex flex-col gap-1 bg-black/40 p-2 rounded border border-white/5">
                                        <div className="flex items-center justify-between">
                                          <span className="text-red-400 font-mono font-bold">{cve.id}</span>
                                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                                            CVSS {cve.score ? `${cve.score} - ` : ""}{cve.severity}
                                          </span>
                                        </div>
                                        <span className="text-muted-foreground line-clamp-2 text-[11px]">{cve.description}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 bg-green-500/5 border border-green-500/20 p-3 rounded-xl text-xs text-green-300">
                            <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
                            <span>Zero Known CVE Exploits. Target edge surface is clean &amp; version obfuscated.</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* --- UPGRADED: EDR TELEMETRY LIVE FEED --- */}
          <div className="mt-16 relative z-20">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                  Endpoint Telemetry &amp; Vulnerability Report
                </h2>
                <p className="text-muted-foreground text-xs mt-1">
                  Live detection of open listening ports, network interface exposures, and operating system hardening status.
                </p>
              </div>
              <button 
                onClick={fetchReports} 
                disabled={isRefreshing}
                className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50 text-xs font-semibold self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Synchronizing..." : "Refresh Live Report"}
              </button>
            </div>
            
            {scanData ? (
              <div className="bg-black/60 border border-primary/20 p-6 md:p-8 rounded-3xl backdrop-blur-xl space-y-8">
                
                {/* EDR Status Header & Health Score */}
                {(() => {
                  const riskLevel = scanData.risk_level || "UNKNOWN";
                  const score = scanData.report.security_score ?? (riskLevel === "LOW" ? 95 : riskLevel === "ELEVATED" ? 75 : 45);
                  let riskColor = "text-green-400";
                  let riskBg = "bg-green-500/10 border-green-500/30";
                  if (riskLevel === "CRITICAL") {
                    riskColor = "text-red-500";
                    riskBg = "bg-red-500/10 border-red-500/30";
                  } else if (riskLevel === "ELEVATED") {
                    riskColor = "text-yellow-400";
                    riskBg = "bg-yellow-500/10 border-yellow-500/30";
                  }

                  return (
                    <div>
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/5 pb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-bold tracking-widest text-primary uppercase font-mono">
                              Local Host Security Audit
                            </span>
                            <span className="text-[10px] bg-white/5 border border-white/10 text-white/70 px-2 py-0.5 rounded font-mono">
                              LIVE EDR
                            </span>
                          </div>
                          <h3 className="text-2xl text-white font-bold flex items-center gap-2.5">
                            <MonitorSmartphone className="w-6 h-6 text-primary" />
                            {scanData.device}
                          </h3>
                          <p className="text-muted-foreground text-xs mt-1">
                            Last telemetry sweep: {new Date(scanData.timestamp).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl text-center">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Security Score</p>
                            <p className={`text-2xl font-black ${riskColor} font-mono`}>
                              {score}<span className="text-xs text-muted-foreground font-normal">/100</span>
                            </p>
                          </div>
                          <div className={`border px-4 py-2.5 rounded-2xl text-center ${riskBg}`}>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Threat Level</p>
                            <p className={`text-xl font-black ${riskColor} tracking-widest`}>
                              {riskLevel}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Summary Metrics Chips */}
                      {scanData.report.summary && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                            <span className="text-xs text-muted-foreground block">Open Ports</span>
                            <span className="text-xl font-bold text-white font-mono">{scanData.report.summary.total_open_ports}</span>
                          </div>
                          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                            <span className="text-xs text-muted-foreground block">Exposed over Wi-Fi (0.0.0.0)</span>
                            <span className={`text-xl font-bold font-mono ${scanData.report.summary.public_ports_count > 0 ? "text-yellow-400" : "text-green-400"}`}>
                              {scanData.report.summary.public_ports_count}
                            </span>
                          </div>
                          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                            <span className="text-xs text-muted-foreground block">OS Hardening Checks</span>
                            <span className="text-xl font-bold text-green-400 font-mono">
                              {scanData.report.summary.checks_passed} Passed
                            </span>
                          </div>
                          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                            <span className="text-xs text-muted-foreground block">Process Anomalies</span>
                            <span className={`text-xl font-bold font-mono ${scanData.report.suspicious_processes?.length > 0 ? "text-red-400" : "text-green-400"}`}>
                              {scanData.report.suspicious_processes?.length || 0}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Section 1: Detailed Open Ports with Plain-English Explanations */}
                <div className="border border-white/10 bg-white/[0.02] p-6 rounded-2xl">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                      <Activity className="w-5 h-5 text-yellow-400" />
                      <div>
                        <h4 className="font-bold text-white text-base">Listening Ports &amp; Network Exposure</h4>
                        <p className="text-muted-foreground text-xs">
                          Identifies which network doors are listening and whether anyone on your local Wi-Fi can connect to them.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 self-start sm:self-auto">
                      {scanData.report.open_ports_detailed?.length || scanData.report.open_ports?.length || 0} Ports Total
                    </span>
                  </div>

                  {scanData.report.open_ports_detailed && scanData.report.open_ports_detailed.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                      {scanData.report.open_ports_detailed.map((p: any, idx: number) => {
                        const isCritical = p.risk === "CRITICAL";
                        const isHigh = p.risk === "HIGH";
                        const isMedium = p.risk === "MEDIUM";
                        let badgeColor = "bg-white/5 text-muted-foreground border-white/10";
                        if (isCritical) badgeColor = "bg-red-500/20 text-red-300 border-red-500/50";
                        else if (isHigh) badgeColor = "bg-orange-500/20 text-orange-300 border-orange-500/50";
                        else if (isMedium) badgeColor = "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";

                        return (
                          <div 
                            key={idx} 
                            className={`p-3.5 rounded-xl border transition-all ${
                              isCritical ? "bg-red-500/[0.04] border-red-500/20" : isHigh ? "bg-orange-500/[0.03] border-orange-500/20" : "bg-black/40 border-white/5"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div>
                                <span className="font-mono text-white text-sm font-bold">
                                  Port {p.port}
                                </span>
                                <span className="text-xs text-white/80 font-medium ml-2">
                                  {p.service}
                                </span>
                              </div>
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                                {p.risk} RISK
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Terminal className="w-3 h-3 text-primary" />
                                {p.process_name || "Unknown"}
                              </span>
                              <span className={`flex items-center gap-1 font-mono ${p.exposed_to_network ? "text-yellow-400" : "text-green-400"}`}>
                                <Wifi className="w-3 h-3" />
                                {p.exposed_to_network ? "0.0.0.0 (Exposed to Wi-Fi)" : "127.0.0.1 (Local Only)"}
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground/90 leading-relaxed border-t border-white/5 pt-2">
                              {p.explanation}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : scanData.report.open_ports?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {scanData.report.open_ports.map((port: number) => {
                        const isDangerous = [21, 23, 3389, 445].includes(port);
                        return (
                          <span key={port} className={`border px-3 py-1 rounded text-sm font-mono ${isDangerous ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-black/50 border-white/10 text-muted-foreground'}`}>
                            {port} {isDangerous && "⚠️"}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-green-400 text-sm font-semibold">No exposed network ports detected.</p>
                  )}
                </div>

                {/* Section 2: Operating System Hardening & Configuration Vulnerabilities */}
                {scanData.report.system_vulnerabilities && scanData.report.system_vulnerabilities.length > 0 && (
                  <div className="border border-white/10 bg-white/[0.02] p-6 rounded-2xl">
                    <div className="flex items-center gap-2.5 mb-4">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      <div>
                        <h4 className="font-bold text-white text-base">Operating System Hardening Audit</h4>
                        <p className="text-muted-foreground text-xs">
                          Checks critical Windows protections that defend your hardware against remote intrusion and silent privilege escalation.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {scanData.report.system_vulnerabilities.map((v: any, vidx: number) => {
                        const isPassed = v.status === "PASSED";
                        const isWarn = v.status === "WARNING";
                        return (
                          <div 
                            key={vidx} 
                            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                              isPassed 
                                ? "bg-green-500/[0.03] border-green-500/20" 
                                : isWarn 
                                ? "bg-yellow-500/[0.05] border-yellow-500/30" 
                                : "bg-red-500/[0.08] border-red-500/30"
                            }`}
                          >
                            {isPassed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                            ) : isWarn ? (
                              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-grow">
                              <div className="flex items-center justify-between">
                                <span className="text-white text-xs font-bold">{v.check}</span>
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  isPassed ? "text-green-400 bg-green-500/10" : isWarn ? "text-yellow-400 bg-yellow-500/10" : "text-red-400 bg-red-500/10"
                                }`}>
                                  {v.status}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                {v.detail}
                              </p>
                              {v.recommendation && (
                                <p className="text-xs text-yellow-300/90 font-medium mt-1.5 bg-yellow-500/10 p-1.5 rounded border border-yellow-500/20">
                                  💡 {v.recommendation}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 3: Suspicious Processes */}
                <div className={`border p-6 rounded-2xl transition-all ${
                  scanData.report.suspicious_processes?.length > 0 ? 'border-red-500/20 bg-red-500/[0.05]' : 'border-white/10 bg-white/[0.02]'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                    <div>
                      <h4 className="font-bold text-white text-base">Memory &amp; Process Anomalies</h4>
                      <p className="text-muted-foreground text-xs">
                        Scans active background tasks for known hacker tools, keyloggers, and illicit cryptominers.
                      </p>
                    </div>
                  </div>
                  {scanData.report.suspicious_processes?.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {scanData.report.suspicious_processes.map((proc: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          <span className="text-red-400 text-xs font-bold font-mono">{proc}</span>
                          <span className="text-xs text-red-300 ml-auto">Malicious dual-use tool detected</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-400 text-xs font-semibold bg-green-500/[0.04] border border-green-500/20 p-3 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      Zero rogue tools or known malware processes detected in active memory.
                    </div>
                  )}
                </div>

                {/* Section 4: Plain-English Actionable Remediation Guide */}
                {scanData.report.recommendations && scanData.report.recommendations.length > 0 && (
                  <div className="border border-primary/20 bg-primary/[0.03] p-6 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider font-mono">
                      <Info className="w-4 h-4" />
                      Security Recommendations for Non-Technical Users
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {scanData.report.recommendations.slice(0, 4).map((rec: any, ridx: number) => (
                        <div key={ridx} className="bg-black/40 border border-white/10 p-3.5 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{rec.title}</span>
                            <span className="text-[10px] font-mono font-bold text-primary">{rec.severity}</span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{rec.advice}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            ) : (
              <div className="text-center p-12 border border-white/5 rounded-3xl bg-black/40 backdrop-blur-md">
                <MonitorSmartphone className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-white text-lg mb-2">Awaiting Endpoint Telemetry</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Download and launch the Guardian EDR agent on your local machine. Once run, your device vulnerabilities and open ports will automatically stream to this dashboard.
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