import { Workbox } from "workbox-window";
import App from "./App.svelte";

const app = new App({
  target: document.body,
  props: {
    device: "web",
  },
});

export default app;

// Register service worker
if ("serviceWorker" in navigator) {
  const wb = new Workbox("sw.js");
  wb.addEventListener("controlling", (evt) => {
    if (evt.isUpdate) {
      console.log("Reloading page for latest content");
      window.location.reload();
    }
  });
  wb.register();
}
