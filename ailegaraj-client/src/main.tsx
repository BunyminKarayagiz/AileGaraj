
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";

// React Query yapılandırması
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 10, // 10 saniye
            gcTime: 1000 * 60 * 10, // 10 dakika
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: true,
        }
    },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <App />
            </AuthProvider>
        </QueryClientProvider>
    </React.StrictMode>
);
