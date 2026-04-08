import { BrowserRouter } from "react-router-dom";
import App from "./App";

export default function AppBootstrap() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
