import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import "@/styles/globals.css";

window.addEventListener("error", (e) => {
  fetch("/api/client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: e.message,
      stack: e.error?.stack,
      url: location.href,
    }),
    keepalive: true,
  });
});

window.addEventListener("unhandledrejection", (e) => {
  fetch("/api/client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: e.reason?.message || String(e.reason),
      stack: e.reason?.stack,
      url: location.href,
    }),
    keepalive: true,
  });
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Provider>
      <App />
    </Provider>
  </BrowserRouter>,
);
