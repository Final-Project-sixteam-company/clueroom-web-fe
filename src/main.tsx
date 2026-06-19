import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./theme/tokens.css";
import "./index.css";
import App from "./App.tsx";

// #gallery 해시일 때만 컴포넌트 킷 갤러리를 lazy 로드(별도 청크 → 앱 번들 무영향).
// 평소 URL = 앱, http://localhost:5173/#gallery = 갤러리.
const Gallery = lazy(() => import("./components/gallery/Gallery.tsx"));
const isGallery = window.location.hash.replace(/^#/, "") === "gallery";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isGallery ? (
      <Suspense fallback={null}>
        <Gallery />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
