import { type ReactNode } from "react";

import { useLocation, Navigate } from "react-router-dom";

interface VerifiedRouteProps {
  children: ReactNode;
}

function ProgramaticRoutesLayout({ children }: VerifiedRouteProps) {
  const location = useLocation();
  const fromApp = location.state?.fromApp;

  if (!fromApp) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default ProgramaticRoutesLayout;
