import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "bootstrap/dist/css/bootstrap.min.css";

const setTheme = (dark) => {
  document.documentElement.setAttribute(
    "data-bs-theme",
    dark ? "dark" : "light"
  );
};

const media = window.matchMedia("(prefers-color-scheme: dark)");
setTheme(media.matches);

media.addEventListener("change", (e) => setTheme(e.matches));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
