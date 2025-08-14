import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App.tsx";
import Today from "./pages/Today.tsx";
import Habits from "./pages/Habits.tsx";
import Tasks from "./pages/Tasks.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Today /> },
      { path: "habits", element: <Habits /> },
      { path: "tasks", element: <Tasks /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
