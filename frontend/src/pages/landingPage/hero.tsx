import { TextAnimate } from "@/components/magicui/text-animate";
import { TypingAnimation } from "@/components/magicui/typing-animation";
import { Button } from "@/components/ui/button";
import useUser from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";
import { BackgroundPaths } from "@/components/magicui/backgroundPaths";
function Hero() {
  const navigate = useNavigate();
  const user = useUser();
  const handleCtaClick = () => {
    if (user === null) {
      navigate("/auth?mode=login");
    } else {
      navigate(`/dashboard?uid=${user?._id}`);
    }
  };

  return (
    <>
     

      <BackgroundPaths title="Letshost" >
           <div className="w-full">
          <h1>
            <TextAnimate
              animation="blurInUp"
              by="line"
              duration={0.5}
              className="leading-snug text-white text-2xl sm:text-3xl md:text-[1.8rem] font-bold text-center text-nowrap"
            >
             Your All-in-One Platform for Hosting, Media, and AI Tools
            </TextAnimate>
          </h1>

          <TypingAnimation className="text-zinc-400 text-base sm:text-lg md:text-xl px-4 sm:px-10 py-4 text-center md:text-left text-balance w-dvw">
          Host any site. Optimize with AI. Deliver lightning-fast performance with our global CDN and creative tools.
          </TypingAnimation>
          </div>
            <Button
                            variant="ghost"
                            className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md 
                            bg-white/95 hover:bg-white/100 dark:bg-black/95 dark:hover:bg-black/100 
                            text-black dark:text-white transition-all duration-300 
                            group-hover:-translate-y-0.5 border border-black/10 dark:border-white/10
                            hover:shadow-md dark:hover:shadow-neutral-800/50 cursor-pointer z-220"
                            onClick={handleCtaClick}
                        >
                            <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                                Get Started
                            </span>
                            <span
                                className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 
                                transition-all duration-300"
                            >
                                → 
                            </span>
                        </Button>
        </BackgroundPaths>
    </>
  );
}

export default Hero;
