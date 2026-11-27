
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import axios from "axios";
import api from "../services/api";

type Status = "loading" | "success" | "error";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<Status>("loading");
    const [message, setMessage] = useState("E-posta adresiniz doğrulanıyor...");
    const verificationStarted = useRef<string | null>(null);
    const userId = searchParams.get("userId");
    const token = searchParams.get("token");
    const hasMissingParams = !userId || !token;

    useEffect(() => {
        if (!userId || !token) {
            return;
        }

        const requestKey = `${userId}:${token}`;
        if (verificationStarted.current === requestKey) {
            return;
        }
        verificationStarted.current = requestKey;

        const verifyEmail = async () => {
            try {
                const response = await api.post("/Auth/verify-email", {
                    userId,
                    token,
                });

                setStatus("success");
                setMessage(
                    response.data.message ||
                    "E-posta adresiniz başarıyla doğrulandı."
                );
            } catch (error: unknown) {
                setStatus("error");
                verificationStarted.current = null;
                setMessage(
                    (axios.isAxiosError<{ message?: string }>(error)
                        ? error.response?.data?.message
                        : undefined) ||
                    "E-posta doğrulaması başarısız oldu. Bağlantı geçersiz veya süresi dolmuş olabilir."
                );
            }
        };

        void verifyEmail();
    }, [userId, token]);

    const visibleStatus = hasMissingParams ? "error" : status;
    const visibleMessage = hasMissingParams
        ? "Doğrulama bağlantısı eksik veya hatalı."
        : message;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F7FC] px-4">
            <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl shadow-purple-900/5">

                <div className="mb-6 flex justify-center">
                    {visibleStatus === "loading" && (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-700" />
                        </div>
                    )}

                    {visibleStatus === "success" && (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
                            <CheckCircle2 className="h-9 w-9 text-green-600" />
                        </div>
                    )}

                    {visibleStatus === "error" && (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                            <XCircle className="h-9 w-9 text-red-500" />
                        </div>
                    )}
                </div>

                <div className="mb-2 text-2xl font-bold text-gray-900">
                    {visibleStatus === "loading"
                        ? "E-posta doğrulanıyor"
                        : visibleStatus === "success"
                            ? "Hesabın doğrulandı!"
                            : "Doğrulama başarısız"}
                </div>

                <p className="mb-8 text-sm leading-6 text-gray-500">
                    {visibleMessage}
                </p>

                {visibleStatus === "success" && (
                    <Link
                        to="/login"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5A189A] px-5 py-3 font-semibold text-white transition hover:bg-[#240046]"
                    >
                        <Mail size={18} />
                        Giriş Yap
                    </Link>
                )}

                {visibleStatus === "error" && (
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        Giriş Sayfasına Dön
                    </Link>
                )}
            </div>
        </div>
    );
}
