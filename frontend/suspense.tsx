import { Suspense } from "react";
import Lottie from "lottie-react";
import loaderAnimation from "./lottie/loader.json";

const LottieLoader = () => (
  <Lottie
    animationData={loaderAnimation}
    loop
    autoPlay
    style={{ width: "100px", height: "100px" }}
  />
);

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <LottieLoader />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export default SuspenseWrapper;
