import { type ReactNode, useEffect, useState } from "react";
import useUser from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import animation from "../../lottie/accessDenied.json";

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const user = useUser();
  const navigate = useNavigate();
  const redirectTime = 5;
  const [countdown, setCountdown] = useState(redirectTime);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    // Only start countdown if we're not loading and user is null

    if (!isLoading && user === null) {
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
  }, [navigate, user, isLoading]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="w-full h-dvh flex justify-center items-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show children if user is authenticated
  if (user !== null) {
    return <>{children}</>;
  }

  // Show access denied screen if user is not authenticated
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
          You are not authorized to access this page
        </h2>
        <span className="text-muted-foreground">
          Redirecting to login page in{" "}
          <span className="font-bold text-foreground">{countdown}</span> seconds
        </span>
      </div>
    </div>
  );
}

export default ProtectedRoute;
