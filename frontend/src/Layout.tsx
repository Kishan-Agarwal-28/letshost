// import { ModeToggle } from './components/mode-toggle'
import { ThemeProvider } from "./components/ui/theme-provider";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Header from "./pages/landingPage/header";
import { lazy, useEffect } from "react";
import { useUserStore } from "./store/store";
const Footer = lazy(() => import("@/pages/landingPage/footer"));
import { useApiGet } from "./hooks/apiHooks";
import ApiRoutes from "./connectors/api-routes";
const CookieConsent = lazy(() => import("@/pages/cookie/consent"));
import OfflinePage from "@/pages/offlinePage/offline";
import { useOffline } from "./hooks/use-offline";

function Layout() {
  const userStore = useUserStore();
  const user = useApiGet({
    key: ["getUser"],
    path: ApiRoutes.getUserDetails,
    enabled: false,
  });
  useEffect(() => {
    user.refetch();

    return () => {};
  }, []);
  useEffect(() => {
    (async () => {
      if (user.isSuccess) {
        await userStore.updateUser(user.data?.data?.data);
      }
    })();

    return () => {};
  }, [user.isSuccess]);

  const location = useLocation();
  const isOffline = useOffline();
  if (isOffline && location.pathname !== "/offline/game") {
    return <OfflinePage />;
  }
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {/* <ModeToggle /> */}
      <CookieConsent />
      <Header />
      <Outlet />
      <Toaster />
      <Footer />
    </ThemeProvider>
  );
}

export default Layout;
