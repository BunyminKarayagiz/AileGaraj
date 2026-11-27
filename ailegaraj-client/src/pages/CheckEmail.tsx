
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    MailCheck,
    ArrowLeft,
    ShieldCheck,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

import api from "../services/api";

function CheckEmail() {
    const location = useLocation();
    const email = location.state?.email as string | undefined;

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleResend = async () => {
        if (!email || loading) return;

        setLoading(true);
        setMessage("");
        setError("");

        try {
            const response = await api.post(
                "/auth/resend-verification",
                { email }
            );

            setMessage(
                response.data?.message ||
                "İşleminiz tamamlandı. E-posta adresinizi kontrol edin."
            );
        } catch {
            setError(
                "İstek gönderilemedi. Lütfen biraz sonra tekrar deneyin."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F7FA] p-6">
            <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-10 text-center">

                <div className="flex justify-center mb-7">
                    <div className="w-20 h-20 rounded-3xl bg-purple-50 flex items-center justify-center">
                        <MailCheck size={42} className="text-[#7B2CBF]" />
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold mb-5">
                    <ShieldCheck size={15} />
                    Hesabın oluşturuldu
                </div>

                <h1 className="text-3xl font-bold text-[#240046] mb-3">
                    E-postanı kontrol et!
                </h1>

                <p className="text-gray-500 leading-7 mb-5">
                    AileGaraj hesabını aktifleştirmek için e-posta adresine
                    bir doğrulama bağlantısı gönderdik.
                </p>

                {email && (
                    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 mb-7">
                        <p className="text-xs text-purple-500 mb-1">
                            Doğrulama e-postası gönderilen adres
                        </p>
                        <p className="font-semibold text-[#5A189A] break-all">
                            {email}
                        </p>
                    </div>
                )}

                <div className="text-left bg-gray-50 rounded-2xl p-5 mb-7">
                    <h2 className="font-semibold text-gray-800 mb-4">
                        Şimdi ne yapmalısın?
                    </h2>

                    <div className="space-y-4">
                        {[
                            "E-posta gelen kutunu kontrol et.",
                            "AileGaraj tarafından gönderilen mesajı aç.",
                            "E-postadaki doğrulama butonuna tıkla.",
                        ].map((step, index) => (
                            <div key={step} className="flex gap-3">
                                <div className="w-7 h-7 shrink-0 rounded-full bg-purple-100 text-[#5A189A] flex items-center justify-center text-sm font-bold">
                                    {index + 1}
                                </div>
                                <p className="text-sm text-gray-600 pt-1">
                                    {step}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-5">
                    <RefreshCw size={14} />
                    E-posta birkaç dakika içinde ulaşabilir.
                </div>

                {message && (
                    <div className="flex items-start gap-2 text-left bg-green-50 border border-green-100 text-green-700 text-sm p-3 rounded-xl mb-5">
                        <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                        <span>{message}</span>
                    </div>
                )}

                {error && (
                    <div className="flex items-start gap-2 text-left bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl mb-5">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {email && (
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 border border-[#7B2CBF] text-[#5A189A] hover:bg-purple-50 disabled:opacity-50 font-semibold p-4 rounded-xl transition mb-3"
                    >
                        <RefreshCw
                            size={18}
                            className={loading ? "animate-spin" : ""}
                        />
                        {loading
                            ? "Gönderiliyor..."
                            : "Doğrulama E-postasını Tekrar Gönder"}
                    </button>
                )}

                <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-2 bg-[#5A189A] hover:bg-[#240046] text-white font-semibold p-4 rounded-xl transition"
                >
                    <ArrowLeft size={18} />
                    Giriş Sayfasına Dön
                </Link>

                <p className="text-xs text-gray-400 mt-6">
                    E-postayı göremiyorsan spam veya gereksiz klasörünü de kontrol et.
                </p>
            </div>
        </div>
    );
}

export default CheckEmail;
