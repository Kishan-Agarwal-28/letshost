// import { ModeToggle } from './components/mode-toggle'
import { ThemeProvider } from "./components/ui/theme-provider";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Header from "./pages/landingPage/header";
import Footer from "./pages/landingPage/footer";
import { useEffect, useState } from "react";
import { useUserStore } from "./store/store";
import { useApiGet } from "./hooks/apiHooks";
import ApiRoutes from "./connectors/api-routes";
import CookieConsent from "./pages/cookie/consent";
import OfflinePage from "./pages/offlinePage/offline";

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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const location=useLocation();
  // Listen for online and offline events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up the event listeners on component unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
if(isOffline&&location.pathname!=="/offline/game"){
  return <OfflinePage/>
}
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {/* <ModeToggle /> */}
      <CookieConsent/>
      <Header />
      <Outlet />
      <Toaster />
      <Footer />
    </ThemeProvider>
  );
}

export default Layout;
