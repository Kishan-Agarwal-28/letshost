// import { ModeToggle } from './components/mode-toggle'
import { ThemeProvider } from "./components/ui/theme-provider";
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Header from "./pages/landingPage/header";
import Footer from "./pages/landingPage/footer";
import { useEffect } from "react";
import { useUserStore } from "./store/store";
import { useApiGet } from "./hooks/apiHooks";
import ApiRoutes from "./connectors/api-routes";

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

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {/* <ModeToggle /> */}

      <Header />
      <Outlet />
      <Toaster />
      <Footer />
    </ThemeProvider>
  );
}

export default Layout;
