"use client"

import { motion } from "framer-motion"
import { Shield, Lock, Eye, Cpu, Server, Zap } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Threat Detection",
    description: "Advanced AI-powered threat detection systems that identify and neutralize cyber attacks in real-time."
  },
  {
    icon: Lock,
    title: "Encryption Protocol",
    description: "Military-grade encryption protecting your sensitive data with zero-knowledge architecture."
  },
  {
    icon: Eye,
    title: "Monitoring Suite",
    description: "24/7 network surveillance with intelligent anomaly detection and instant alerting."
  },
  {
    icon: Cpu,
    title: "Neural Defense",
    description: "Machine learning algorithms that evolve and adapt to emerging threat landscapes."
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "Hardened server architecture with multi-layer security protocols and redundant backups."
  },
  {
    icon: Zap,
    title: "Rapid Response",
    description: "Automated incident response with sub-second reaction times to potential breaches."
  }
]

export function FeaturesSection() {
  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
            Defense Capabilities
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Comprehensive security solutions engineered to protect your digital assets
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group relative p-6 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 glow-box"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                
                <h3 className="text-xl font-semibold text-primary mb-2">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
