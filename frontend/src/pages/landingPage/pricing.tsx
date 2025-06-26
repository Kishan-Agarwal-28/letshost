import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BorderBeam } from "@/components/magicui/border-beam";
import { NumberTicker } from "@/components/magicui/number-ticker";
import useUser from "@/hooks/useUser";
import { motion } from "motion/react";
function Pricing() {
  const [isMonthly, setIsMonthly] = useState(true);
  const [price, setPrice] = useState(20);
  const user = useUser();
  useEffect(() => {
    if (isMonthly) {
      setPrice(20);
    } else {
      setPrice(200);
    }
    return () => {};
  }, [isMonthly, price, setPrice, setIsMonthly]);

  return (
     <motion.div 
      className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col items-center justify-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.25, 0, 1] as const }}
      viewport={{ once: true, margin: "-50px" }}
    >
      {/* Heading */}
      <motion.div 
        className="text-center mb-12 px-4"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <motion.h2 
          className="text-3xl sm:text-4xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          Simple, transparent pricing
        </motion.h2>
        <motion.p 
          className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
        >
          Start with our generous free tier and upgrade only when you need to.
        </motion.p>
      </motion.div>

      {/* Toggle Switch */}
      <motion.div 
        className="mb-10 w-full flex justify-center"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        viewport={{ once: true }}
      >
        <div className="w-60 bg-zinc-800 rounded-xl h-12 flex items-center justify-center overflow-hidden">
          <motion.div
            className={`w-1/2 h-full p-3 flex items-center justify-center border-r-2 cursor-pointer transition-all ${
              isMonthly
                ? "scale-[105%] bg-zinc-900"
                : "hover:scale-[105%] hover:bg-zinc-900"
            }`}
            onClick={() => setIsMonthly(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Monthly
          </motion.div>
          <motion.div
            className={`w-1/2 h-full p-3 flex items-center justify-center cursor-pointer transition-all ${
              isMonthly
                ? "hover:scale-[105%] hover:bg-zinc-900"
                : "scale-[105%] bg-zinc-900"
            }`}
            onClick={() => setIsMonthly(false)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Annual
          </motion.div>
        </div>
      </motion.div>
      {/* Pricing Cards */}
       <motion.div 
        className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        viewport={{ once: true }}
      >
        {/* Free Tier Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="w-full max-w-sm  bg-background hover:scale-[102%] transition-transform duration-300">
            <div className="p-6">
              <motion.h3 
                className="text-xl font-medium mb-2"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                viewport={{ once: true }}
              >
                Free Tier
              </motion.h3>
              <motion.div 
                className="text-4xl font-bold mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                viewport={{ once: true }}
              >
                ₹0
                <span className="text-lg text-muted-foreground font-normal">
                  /{isMonthly ? "month" : "year"}
                </span>
              </motion.div>
              <motion.p 
                className="text-muted-foreground mb-6"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                viewport={{ once: true }}
              >
                Perfect for personal projects and testing.
              </motion.p>
              <motion.div 
                className="space-y-3 mb-6 text-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                viewport={{ once: true }}
              >
                {[
                  "10 website deployments",
                  "Drag & drop deployment",
                  "Free SSL certificates",
                  "Global CDN access",
                  "Basic image generation (10/month)"
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-start"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1.1 + (i * 0.1) }}
                    viewport={{ once: true }}
                  >
                    <Check
                      size={20}
                      className="mr-3 text-primary shrink-0 mt-0.5"
                    />
                    <span>{item}</span>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.6 }}
                viewport={{ once: true }}
              >
                <Button asChild variant="outline" className="w-full">
                  <Link
                    to={user ? `/dashboard?uid=${user?._id}` : "/auth?mode=signup"}
                  >
                    Get Started
                  </Link>
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* Pro Tier Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="w-full max-w-sm  bg-muted-foreground hover:scale-[102%] transition-transform duration-300">
            <div className="p-6 m-2">
              <motion.div 
                className="flex items-center justify-between mb-2"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-medium">Pro Tier</h3>
                <span className="bg-primary/20 text-primary text-xs font-medium px-3 py-1 rounded-full relative">
                  POPULAR
                  <BorderBeam
                    duration={6}
                    size={400}
                    className="from-transparent via-red-500 to-transparent"
                  />
                  <BorderBeam
                    duration={6}
                    delay={3}
                    size={400}
                    className="from-transparent via-blue-500 to-transparent"
                  />
                </span>
              </motion.div>
              <motion.div 
                className="text-4xl font-bold mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                viewport={{ once: true }}
              >
                ₹<NumberTicker value={price} startValue={20} />
                <span className="text-lg text-zinc-300 font-normal">
                  /site/{isMonthly ? "month" : "year"}
                </span>
              </motion.div>
              <motion.p 
                className="text-zinc-300 mb-6"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                viewport={{ once: true }}
              >
                For businesses and professional websites.
              </motion.p>
              <motion.div 
                className="space-y-3 mb-6 text-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                viewport={{ once: true }}
              >
                {[
                  "Unlimited website deployments",
                  "Custom domains with DNS",
                  "Unlimited CDN storage",
                  "Priority support",
                  "Unlimited AI image generation",
                  "UNlimited On fly image transformations",
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-start"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1.1 + (i * 0.1) }}
                    viewport={{ once: true }}
                  >
                    <Check
                      size={20}
                      className="mr-3 text-primary shrink-0 mt-0.5"
                    />
                    <span>{item}</span>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.7 }}
                viewport={{ once: true }}
              >
                <Button asChild className="w-full">
                  <Link
                    to={
                      user
                        ? `/payment?planType=${isMonthly ? "monthly" : "yearly"}`
                        : "/auth?mode=signup"
                    }
                    state={{ fromApp: true }}
                  >
                    Upgrade to Pro
                  </Link>
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default Pricing;
