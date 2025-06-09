import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BorderBeam } from "@/components/magicui/border-beam";
import { NumberTicker } from "@/components/magicui/number-ticker";
import useUser from "@/hooks/useUser";
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
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col items-center justify-center">
      {/* Heading */}
      <div className="text-center mb-12 px-4">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
          Start with our generous free tier and upgrade only when you need to.
        </p>
      </div>

      {/* Toggle Switch */}
      <div className="mb-10 w-full flex justify-center">
        <div className="w-60 bg-zinc-800 rounded-xl h-12 flex items-center justify-center overflow-hidden">
          <div
            className={`w-1/2 h-full p-3 flex items-center justify-center border-r-2 cursor-pointer transition-all ${
              isMonthly
                ? "scale-[105%] bg-zinc-900"
                : "hover:scale-[105%] hover:bg-zinc-900"
            }`}
            onClick={() => setIsMonthly(true)}
          >
            Monthly
          </div>
          <div
            className={`w-1/2 h-full p-3 flex items-center justify-center cursor-pointer transition-all ${
              isMonthly
                ? "hover:scale-[105%] hover:bg-zinc-900"
                : "scale-[105%] bg-zinc-900"
            }`}
            onClick={() => setIsMonthly(false)}
          >
            Annual
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full">
        {/* Free Tier Card */}
        <Card className="w-full max-w-sm lg:w-1/2 bg-background hover:scale-[102%] transition-transform duration-300">
          <div className="p-6">
            <h3 className="text-xl font-medium mb-2">Free Tier</h3>
            <div className="text-4xl font-bold mb-4">
              ₹0
              <span className="text-lg text-muted-foreground font-normal">
                /{isMonthly ? "month" : "year"}
              </span>
            </div>
            <p className="text-muted-foreground mb-6">
              Perfect for personal projects and small websites.
            </p>
            <div className="space-y-3 mb-6 text-sm">
              {[
                "10 static websites",
                "Custom domains",
                "SSL certificates",
                "Global CDN",
              ].map((item, i) => (
                <div key={i} className="flex items-start">
                  <Check
                    size={20}
                    className="mr-3 text-primary shrink-0 mt-0.5"
                  />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link
                to={user ? `/dashboard?uid=${user?._id}` : "/auth?mode=signup"}
              >
                Get Started
              </Link>
            </Button>
          </div>
        </Card>

        {/* Pro Tier Card */}
        <Card className="w-full max-w-sm lg:w-1/2 bg-muted-foreground hover:scale-[102%] transition-transform duration-300">
          <div className="p-6 m-2">
            <div className="flex items-center justify-between mb-2">
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
            </div>
            <div className="text-4xl font-bold mb-4">
              ₹<NumberTicker value={price} startValue={20} />
              <span className="text-lg text-zinc-300 font-normal">
                /site/{isMonthly ? "month" : "year"}
              </span>
            </div>
            <p className="text-zinc-300 mb-6">
              For businesses and professional websites.
            </p>
            <div className="space-y-3 mb-6 text-sm">
              {[
                "Unlimited static websites",
                "Custom domains with advanced DNS",
                "CI/CD integrations",
                "Priority support",
                "Advanced analytics",
              ].map((item, i) => (
                <div key={i} className="flex items-start">
                  <Check
                    size={20}
                    className="mr-3 text-primary shrink-0 mt-0.5"
                  />
                  <span>{item}</span>
                </div>
              ))}
            </div>
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
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Pricing;
