import Hero from "./hero";
import Features from "./features";
import Pricing from "./pricing";
import { useMousePosition } from "@/hooks/use-mouse-position";
import { motion } from "motion/react";
import React, { useRef } from "react";
function LandingPage() {
    const containerRef = useRef<HTMLDivElement>(null)
  const mousePosition = useMousePosition(containerRef as React.RefObject<HTMLDivElement>)

  return (
    <>
    <div className="">
      <div 
        ref={containerRef}
        className=""
      >
        <motion.div
          className="w-full h-full absolute z-1"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.5), transparent 50%)`,
          }}
        />
         <div className="  relative">        
      <Hero />
      <Features />
      <Pricing />
      </div>
    </div>
    </div>
    </>
  );
}

export default LandingPage;
