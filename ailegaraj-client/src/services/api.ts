import axios, {
    type AxiosError,
    type InternalAxiosRequestConfig,
} from "axios";

import type { AuthResponse } from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL;


const api = axios.create({
    baseURL: API_URL,
});

const refreshClient = axios.create({
    baseURL: API_URL,
});

type RetriableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};

function clearSession() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
}

function redirectToLogin() {
    clearSession();

    if (window.location.pathname !== "/login") {
        // Tam sayfa yönlendirme: AuthContext ve React Query önbelleği sıfırlanır.
        window.location.replace("/login");
    }
}

// Aynı anda birden fazla istek 401 alırsa refresh token yalnızca bir kez
// kullanılmalıdır. Sunucu refresh token'ı her kullanımda döndürdüğü
// (rotation) için ikinci bir paralel istek eski token ile reddedilirdi.
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
    if (refreshPromise) {
        return refreshPromise;
    }

    const refreshToken = sessionStorage.getItem("refreshToken");

    if (!refreshToken) {
        return Promise.reject(new Error("Refresh token bulunamadı."));
    }

    refreshPromise = refreshClient
        .post<AuthResponse>("/auth/refresh", { refreshToken })
        .then((response) => {
            const data = response.data;

            sessionStorage.setItem("accessToken", data.accessToken);
            sessionStorage.setItem("refreshToken", data.refreshToken);
            sessionStorage.setItem("user", JSON.stringify(data.user));

            return data.accessToken;
        })
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
}

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("accessToken");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
        config.headers.delete("Content-Type");
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as
            | RetriableRequestConfig
            | undefined;

        const isUnauthorized = error.response?.status === 401;
        const isAuthEndpoint = (originalRequest?.url ?? "").startsWith("/auth/");

        // Giriş, kayıt, çıkış ve refresh çağrılarındaki 401'ler normal
        // akışın parçasıdır (ör. hatalı şifre); yenileme denenmez.
        if (
            !isUnauthorized ||
            !originalRequest ||
            originalRequest._retry ||
            isAuthEndpoint
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            const newAccessToken = await refreshAccessToken();

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            return api(originalRequest);
        } catch {
            // Refresh token geçersiz, süresi dolmuş veya oturum başka bir
            // yerden kapatılmış: kullanıcıyı giriş ekranına gönder.
            redirectToLogin();

            return Promise.reject(error);
        }
    }
);

export default api;
