
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function RegisterPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (password.length < 8) {
            setError("Mật khẩu phải có ít nhất 8 ký tự.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password,
                }),
            });

            if (response.status === 409) {
                setError("Email này đã được đăng ký.");
                return;
            }

            if (!response.ok) {
                setError("Đăng ký không thành công. Vui lòng kiểm tra thông tin.");
                return;
            }

            router.push("/login?registered=1");
        } catch {
            setError("Không thể kết nối đến máy chủ. Hãy kiểm tra Backend.");
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
                    Đăng ký tài khoản
                </h2>

                <p className="text-sm text-gray-500 text-center mt-2 mb-6">
                    Tạo tài khoản để trải nghiệm dịch vụ đặt đồ uống.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Mật khẩu
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            minLength={8}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Ít nhất 8 ký tự"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Xác nhận mật khẩu
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            placeholder="Nhập lại mật khẩu"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    {error && (
                        <p role="alert" className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {loading ? "Đang đăng ký..." : "Đăng ký"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    Đã có tài khoản?{" "}
                    <Link href="/login" className="text-emerald-700 font-semibold hover:underline">
                        Đăng nhập
                    </Link>
                </p>

                <Link href="/" className="block text-center text-sm text-gray-500 mt-4 hover:underline">
                    ← Quay về trang chủ
                </Link>
            </div>
        </main>
    );
}
