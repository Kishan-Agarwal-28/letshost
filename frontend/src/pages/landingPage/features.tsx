import { HoverEffect } from "@/components/ui/card-hover-effect";
import { motion } from "motion/react";

function Features() {
  const projects = [
    {
      title: "Universal Website Hosting",
      description:
        "Host any website - vanilla HTML/CSS/JS or modern frameworks like React, Next.js, Vue. Deploy instantly with our intelligent build system.",
    },
    {
      title: "Global CDN & Asset Storage",
      description:
        "Lightning-fast global CDN for your CSS, JS, and media files. Upload assets directly and serve them worldwide with optimal performance.",
    },
    {
      title: "AI Image Generation Studio",
      description:
        "Built-in AI image generator with professional editor and gallery. Create, edit, and download high-quality images - open source attribution only.",
    },
    {
      title: "Simple Drag & Drop Deployment",
      description:
        "Just drag and drop your build folder to deploy instantly. Upload your compiled HTML, CSS, and JS files - no complex configuration required.",
    },
    {
      title: "Affordable Pricing",
      description:
        "Transparent and affordable pricing with no hidden costs. Scale as you grow with flexible plans that fit your budget and needs.",
    },
    {
      title: "Free SSL Certificates",
      description:
        "Get free SSL certificates for all your hosted sites. We handle the SSL certificate setup and renewal process automatically for you.",
    },
  ];

  return (
    <motion.div 
      className="max-w-5xl mx-auto px-8 flex flex-col items-center justify-center py-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.25, 0, 1] as const }}
      viewport={{ once: true, margin: "-50px" }}
    >
      <motion.div 
        className="text-center mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.25, 0, 1] as const }}
        viewport={{ once: true }}
      >
        <motion.h2 
          className="text-4xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          Why choose letshost?
        </motion.h2>
        <motion.p 
          className="text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
        >
          Our platform is built with developers in mind. We make it simple to deploy your sites with all the features you need.
        </motion.p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.25, 0, 1] as const }}
        viewport={{ once: true }}
      >
        <HoverEffect items={projects} />
      </motion.div>
    </motion.div>
  );
}

export default Features;