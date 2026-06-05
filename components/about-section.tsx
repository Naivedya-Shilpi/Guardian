"use client"

import { motion } from "framer-motion"

export function AboutSection() {
  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-8">
            About the Project
          </h2>
          
          <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
            <p>
              Guardian Protocol represents the next evolution in cyber security defense systems. 
              Built from the ground up with a focus on proactive threat mitigation, our platform 
              leverages cutting-edge artificial intelligence and machine learning to stay ahead 
              of emerging cyber threats.
            </p>
            
            <p>
              Our mission is to create an impenetrable digital shield that adapts and evolves, 
              protecting organizations of all sizes from the ever-changing landscape of cyber attacks. 
              With Guardian Protocol, security is not just a feature—it&apos;s a guarantee.
            </p>
          </div>

          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: true }}
            className="h-[1px] w-48 mx-auto mt-12 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          />
        </motion.div>
      </div>
    </section>
  )
}
