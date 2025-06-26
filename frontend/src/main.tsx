import { scan } from "react-scan"; // must be imported before React and React DOM


scan({
  enabled: true,
});
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/routes";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={new QueryClient()}>
    <ReactQueryDevtools initialIsOpen={false} />
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
