import { TextAnimate } from "@/components/magicui/text-animate";
import { TypingAnimation } from "@/components/magicui/typing-animation";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimationTerminal,
} from "@/components/magicui/terminal";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { ScriptCopyBtn } from "@/components/magicui/script-copy-btn";
import useUser from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";
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
  const handleDocsClick = () => {
    window.open("https://npmjs.com/package/letshost", "_blank");
  };
  const customCommandMap = {
    npm: "npx lh init",
    yarn: "yarn dlx lh init",
    pnpm: "pnpm dlx lh init",
    bun: "bun x lh init",
  };
  return (
    <>
      <div className="min-h-screen bg-conic-150 from-zinc-900 to-zinc-950 backdrop-blur-sm text-white/90 p-4 flex flex-col md:flex-row justify-center items-center gap-8">
        {/* Left Section */}
        <div className="w-full md:w-1/2 max-w-2xl">
          <h1>
            <TextAnimate
              animation="blurInUp"
              by="line"
              duration={0.5}
              className="leading-snug text-white text-3xl sm:text-4xl md:text-[2.8rem] font-bold text-center md:text-left"
            >
              {`Simple and Fast \n\t\t\t Web Hosting for Developers`}
            </TextAnimate>
          </h1>

          <TypingAnimation className="text-zinc-400 text-base sm:text-lg md:text-xl px-4 sm:px-10 py-4 text-center md:text-left">
            Deploy your static sites with a single command. Fast, secure, and
            scalable hosting for your projects.
          </TypingAnimation>

          <div className="w-full flex flex-col sm:flex-row justify-center md:justify-start items-center gap-4 sm:gap-10 py-6 px-4">
            <InteractiveHoverButton
              className="py-3 px-6 text-white bg-zinc-700 hover:bg-zinc-800 rounded-xl w-full sm:w-auto text-center"
              onClick={handleCtaClick}
            >
              Get Started
            </InteractiveHoverButton>

            <InteractiveHoverButton
              className="py-3 px-6 text-white bg-transparent border border-white/20 hover:bg-zinc-800 rounded-xl w-full sm:w-auto text-center"
              onClick={handleDocsClick}
            >
              Visit npm registry
            </InteractiveHoverButton>
          </div>
        </div>

        {/* Right Section */}
        <div className="w-full md:w-1/2 max-w-2xl flex flex-col justify-center items-center gap-4 px-4">
          <Terminal className="text-sm sm:text-base text-slate-400 w-full">
            <TypingAnimationTerminal>&gt; npx lh init</TypingAnimationTerminal>
            <AnimatedSpan delay={2000} className="text-green-500">
              ✔ Deploy a project using Local
            </AnimatedSpan>
            <AnimatedSpan delay={2500} className="text-green-500">
              ✔ Are the files in the current folder? Yes
            </AnimatedSpan>
            <AnimatedSpan delay={3000} className="text-green-500">
              ✔ Do you need a custom subdomain? No
            </AnimatedSpan>
            <AnimatedSpan delay={3500} className="text-green-500">
              ✔ Do you want to deploy? Yes
            </AnimatedSpan>
            <AnimatedSpan delay={4000} className="text-green-500">
              ✔ Project deployed to https://example.letshost.dpdns.org
            </AnimatedSpan>
          </Terminal>

          <ScriptCopyBtn
            showMultiplePackageOptions={true}
            codeLanguage="shell"
            lightTheme="monokai"
            darkTheme="monokai"
            commandMap={customCommandMap}
            className="py-2 w-full text-white"
          />
        </div>
      </div>
    </>
  );
}

export default Hero;
