import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Prevent overscroll/bounce behavior by clamping scroll position
let ticking = false;

function clampScroll() {
  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  
  if (scrollTop < 0) {
    window.scrollTo(0, 0);
  } else if (scrollTop > maxScroll) {
    window.scrollTo(0, maxScroll);
  }
  ticking = false;
}

window.addEventListener("scroll", () => {
  if (!ticking) {
    window.requestAnimationFrame(clampScroll);
    ticking = true;
  }
}, { passive: true });

// Prevent overscroll with wheel event
document.addEventListener("wheel", (e) => {
  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  
  if ((scrollTop === 0 && e.deltaY < 0) || (scrollTop >= maxScroll && e.deltaY > 0)) {
    e.preventDefault();
  }
}, { passive: false });

// Prevent overscroll with touch
document.addEventListener("touchmove", (e) => {
  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  
  if (scrollTop === 0 && e.touches[0].clientY > (e.touches[0] as any).prevY) {
    e.preventDefault();
  } else if (scrollTop >= maxScroll && e.touches[0].clientY < (e.touches[0] as any).prevY) {
    e.preventDefault();
  }
  (e.touches[0] as any).prevY = e.touches[0].clientY;
}, { passive: false });

createRoot(document.getElementById("root")!).render(<App />);
