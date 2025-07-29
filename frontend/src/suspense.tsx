import { Suspense } from "react";
import Lottie from "lottie-react";
import { useEffect, useState } from "react";

const LottieLoader = ({ loaderAnimation }: { loaderAnimation: any }) => (
  <Lottie
    animationData={loaderAnimation}
    loop
    autoPlay
    style={{ width: "100px", height: "100px" }}
  />
);

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  const [animationData, setAnimationData] = useState<any>(null);
  useEffect(() => {
    fetch("/lottie/loader.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Failed to load animation", err));
  }, []);

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <LottieLoader loaderAnimation={animationData} />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export default SuspenseWrapper;
