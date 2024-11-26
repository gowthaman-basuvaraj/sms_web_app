import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@coreui/coreui/dist/css/coreui.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import App from "./App.jsx";
import { Auth } from "./store/Auth.jsx";

createRoot(document.getElementById("root")).render(
  <Auth>
    <StrictMode>
      <App />
    </StrictMode>
  </Auth>
);