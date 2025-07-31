import { scan } from "react-scan"; // must be imported before React and React DOM

scan({
  enabled: true,
});
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app";

createRoot(document.getElementById("root")!).render(<App />);
