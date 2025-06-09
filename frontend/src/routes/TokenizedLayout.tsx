import { type ReactNode, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Lottie from "lottie-react";
import animation from "../../lottie/accessDenied.json";

interface ProtectedRouteProps {
  children: ReactNode;
}

function TokenizedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const redirectTime = 5;
  const [countdown, setCountdown] = useState(redirectTime);
  const [searchParams] = useSearchParams({ token: "" });
  const token = searchParams.get("token");
  useEffect(() => {
    if (token === "") {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(interval);
            navigate("/auth?mode=login");
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [navigate, token]);

  if (token !== "") {
    return <>{children}</>;
  }

  return (
    <div className="w-full h-dvh flex justify-center items-center bg-background flex-col overflow-hidden">
      <div className="w-[80%] h-[60%]">
        <Lottie
          animationData={animation}
          loop={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div className="w-full h-1/3 flex justify-center items-center flex-col">
        <h1 className="text-3xl p-4 font-extrabold">Access Denied</h1>
        <h2 className="text-2xl p-2 font-semibold text-muted-foreground">
          You are not authorized to access this page as this page requires a
          valid token.
        </h2>
        <span className="text-muted-foreground">
          Redirecting to login page in{" "}
          <span className="font-bold text-foreground">{countdown}</span> seconds
        </span>
      </div>
    </div>
  );
}

export default TokenizedRoute;
