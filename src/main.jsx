import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Auth } from "./store/Auth.jsx";
import { Provider } from "react-redux";
import store from "./store/Store.js";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <Auth>
      <StrictMode>
        <App />
      </StrictMode>
    </Auth>
  </Provider>
);
