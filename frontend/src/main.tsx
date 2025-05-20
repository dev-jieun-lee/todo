// main.tsx
import ReactDOM from "react-dom/client";
import App from "./App"; // App.tsx를 불러옴
import "./index.css"; // Tailwind 등 스타일 불러오기

ReactDOM.createRoot(document.getElementById("root")!).render(
  //<React.StrictMode>
  <App />
  // {/* // 여기서 App.tsx를 실행 */}
  //</React.StrictMode>
);
