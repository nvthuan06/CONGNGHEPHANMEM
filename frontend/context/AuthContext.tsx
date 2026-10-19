
"use client";

import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";

interface JwtPayload {
    sub: number;
    email: string;
    exp?: number;
}

interface AuthContextType {
    accessToken: string | null;
    email: string | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

function decodeJwtPayload(token: string): JwtPayload {
    const parts = token.split(".");

    if (parts.length !== 3) {
        throw new Error("JWT không hợp lệ");
    }

    const base64 = parts[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const payload = JSON.parse(atob(base64)) as JwtPayload;

    if (
        typeof payload.email !== "string" ||
        !payload.email ||
        typeof payload.sub !== "number"
    ) {
        throw new Error("JWT thiếu thông tin người dùng");
    }

    if (
        typeof payload.exp === "number" &&
        payload.exp * 1000 <= Date.now()
    ) {
        throw new Error("JWT đã hết hạn");
    }

    return payload;
}

export function AuthProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [accessToken, setAccessToken] = useState<string | null>(
        null
    );

    const [email, setEmail] = useState<string | null>(null);

    function login(token: string) {
        const payload = decodeJwtPayload(token);

        setAccessToken(token);
        setEmail(payload.email);
    }

    function logout() {
        setAccessToken(null);
        setEmail(null);
    }

    return (
        <AuthContext.Provider
            value={{
                accessToken,
                email,
                isAuthenticated: accessToken !== null,
                login,
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
        throw new Error(
            "useAuth phải được sử dụng bên trong AuthProvider"
        );
    }

    return context;
}
