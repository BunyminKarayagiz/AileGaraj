
import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";

import api from "../services/api";
import type {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserInfo,
} from "../types/auth";

interface AuthContextType {
    user: UserInfo | null;
    isAuthenticated: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserInfo | null>(() => {
        const storedUser = sessionStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const isAuthenticated = !!user;

    const saveSession = (response: AuthResponse) => {
        sessionStorage.setItem("accessToken", response.accessToken);
        sessionStorage.setItem("refreshToken", response.refreshToken);
        sessionStorage.setItem("user", JSON.stringify(response.user));

        setUser(response.user);
    };

    const login = async (data: LoginRequest) => {
        const response = await api.post<AuthResponse>("/auth/login", data);
        saveSession(response.data);
    };

    const register = async (data: RegisterRequest) => {
        await api.post("/auth/register", data);
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            sessionStorage.removeItem("accessToken");
            sessionStorage.removeItem("refreshToken");
            sessionStorage.removeItem("user");
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth, AuthProvider içerisinde kullanılmalıdır.");
    }

    return context;
}
