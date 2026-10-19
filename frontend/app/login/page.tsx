
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get("registered") === "1";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess(false);
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password,
                }),
            });

            if (response.status === 401) {
                setError("Email hoặc mật khẩu không chính xác.");
                return;
            }

            if (!response.ok) {
                setError("Đăng nhập thất bại. Vui lòng thử lại.");
                return;
            }

            const data: { access_token?: string } =
                await response.json();

            if (!data.access_token) {
                setError("Máy chủ không trả về access token.");
                return;
            }

            // Bước 2: Xác nhận JWT được cấp thành công.
            // Bước 3 sẽ quản lý token và phiên đăng nhập.
            setSuccess(true);
            setPassword("");

        } catch {
            setError("Không thể kết nối đến Backend.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
                <h1 className="text-3xl font-bold text-emerald-700 text-center">
                    BrewLite
                </h1>

                <h2 className="text-xl font-semibold text-gray-800 text-center mt-3">
                    Đăng nhập
                </h2>

                <p className="text-sm text-gray-500 text-center mt-2 mb-6">
                    Chào mừng bạn quay trở lại!
                </p>

                {registered && (
                    <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg mb-4">
                        Đăng ký thành công! Hãy đăng nhập để tiếp tục.
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="example@gmail.com"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Mật khẩu
                        </label>

                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Nhập mật khẩu"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    {error && (
                        <p role="alert" className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p role="status" className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                            Đăng nhập thành công! Backend đã cấp JWT.
                            Chức năng duy trì phiên sẽ được bổ sung ở bước tiếp theo.
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    Chưa có tài khoản?{" "}
                    <Link
                        href="/register"
                        className="text-emerald-700 font-semibold hover:underline"
                    >
                        Đăng ký
                    </Link>
                </p>

                <Link
                    href="/"
                    className="block text-center text-sm text-gray-500 mt-4 hover:underline"
                >
                    ← Quay về trang chủ
                </Link>
            </div>
        </main>
    );
}
