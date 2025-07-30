import { RouterProvider } from "react-router-dom";
import { router } from "./routes/routes";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { lazy, Suspense, useEffect, useState } from "react";
function App() {
      const ReactQueryDevtoolsProduction =lazy(() =>
      import('@tanstack/react-query-devtools/build/modern/production.js').then(
        (d) => ({
          default: d.ReactQueryDevtools,
        }),
      ),
    )
     const [showDevtools, setShowDevtools] = useState(true)
    
    useEffect(() => {
        // @ts-expect-error
        window.toggleDevtools = () => setShowDevtools((old) => !old)
      }, [])
    
  return (
    <QueryClientProvider client={new QueryClient()}>
    <ReactQueryDevtools initialIsOpen={false} />
          {showDevtools && (
            <Suspense fallback={null}>
              <ReactQueryDevtoolsProduction />
            </Suspense>
          )}
    <RouterProvider router={router} />
  </QueryClientProvider>
  )
}
export default App