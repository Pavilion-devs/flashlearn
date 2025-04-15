import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Import RemixIcon CSS for icons
import "remixicon/fonts/remixicon.css";

// Import Google Fonts
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Poppins:wght@500;600;700&display=swap";
document.head.appendChild(fontLink);

// Add document title
const titleElement = document.createElement("title");
titleElement.textContent = "FlashLearn - Smart Flashcard Learning";
document.head.appendChild(titleElement);

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
