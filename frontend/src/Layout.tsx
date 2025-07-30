// import { ModeToggle } from './components/mode-toggle'
import { ThemeProvider } from "./components/ui/theme-provider";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Header from "./pages/landingPage/header";
import { lazy, useEffect, useState, Suspense } from "react";
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
  const ReactQueryDevtoolsProduction =lazy(() =>
  import('@tanstack/react-query-devtools/build/modern/production.js').then(
    (d) => ({
      default: d.ReactQueryDevtools,
    }),
  ),
)
 const [showDevtools, setShowDevtools] = useState(false)

useEffect(() => {
    // @ts-expect-error
    window.toggleDevtools = () => setShowDevtools((old) => !old)
  }, [])

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
      {showDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtoolsProduction />
        </Suspense>
      )}
    </ThemeProvider>
  );
}

export default Layout;
