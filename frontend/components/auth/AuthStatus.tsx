
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthStatus() {
    const router = useRouter();
    const { isAuthenticated, email, logout } = useAuth();

    function handleLogout() {
        logout();
        router.push("/");
    }

    return (
        <div className="flex flex-wrap items-center justify-end gap-3 border-b bg-white px-6 py-3">
            {isAuthenticated ? (
                <>
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <span aria-hidden="true">👤</span>
                        </div>

                        <div className="min-w-0">
                            <p className="max-w-52 truncate text-sm font-semibold text-gray-800"
                                title={email ?? ""}>
                                {email}
                            </p>

                            <p className="text-xs text-emerald-700">
                                Đã đăng nhập
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                        Đăng xuất
                    </button>
                </>
            ) : (
                <>
                    <span className="text-sm text-gray-500">
                        Chưa đăng nhập
                    </span>

                    <Link
                        href="/login"
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                        Đăng nhập
                    </Link>

                    <Link
                        href="/register"
                        className="text-sm font-medium text-emerald-700 hover:underline"
                    >
                        Đăng ký
                    </Link>
                </>
            )}
        </div>
    );
}
