"use client"

import { motion } from "framer-motion"

const stats = [
  { value: "99.9%", label: "Threat Detection Rate" },
  { value: "< 1ms", label: "Response Time" },
  { value: "500K+", label: "Threats Blocked Daily" },
  { value: "Zero", label: "Data Breaches" }
]

export function StatsSection() {
  return (
    <section className="py-16 px-4 border-y border-border/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary glow-text mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
