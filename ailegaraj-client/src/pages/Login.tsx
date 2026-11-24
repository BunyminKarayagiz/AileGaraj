
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CarFront, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login({ email, password });
            navigate("/dashboard");
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.title ||
                "Giriş başarısız. E-posta veya şifrenizi kontrol edin."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-white">
            <div className="hidden lg:flex flex-col justify-between bg-[#240046] p-12 text-white">
                <div className="flex items-center gap-3">
                    <div className="bg-[#E1FF00] text-[#240046] p-2 rounded-xl">
                        <CarFront size={28} />
                    </div>
                    <span className="text-2xl font-bold">AileGaraj</span>
                </div>

                <div className="max-w-lg">
                    <div className="text-[#E1FF00] font-semibold mb-4">
                        Aileniz için akıllı araç yönetimi
                    </div>
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        Ailenizin tüm yolculukları tek yerde.
                    </h1>
                    <p className="text-purple-200 text-lg leading-relaxed">
                        Araçlarınızı yönetin, rezervasyonlarınızı planlayın
                        ve aile harcamalarınızı kolayca takip edin.
                    </p>
                </div>

                <p className="text-purple-300 text-sm">
                    © 2026 AileGaraj. Tüm hakları saklıdır.
                </p>
            </div>

            <div className="flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-2 mb-12">
                        <CarFront className="text-[#5A189A]" size={32} />
                        <span className="text-2xl font-bold text-[#240046]">
                            AileGaraj
                        </span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-[#240046] mb-3">
                            Tekrar hoş geldin!
                        </h2>
                        <p className="text-gray-500">
                            Hesabına giriş yaparak devam et.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700">
                                E-posta adresi
                            </label>
                            <div className="flex items-center border border-gray-200 rounded-xl px-4 focus-within:border-[#974CE0] transition">
                                <Mail size={19} className="text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ornek@mail.com"
                                    className="w-full p-4 outline-none bg-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700">
                                Şifre
                            </label>
                            <div className="flex items-center border border-gray-200 rounded-xl px-4 focus-within:border-[#974CE0] transition">
                                <Lock size={19} className="text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Şifrenizi girin"
                                    className="w-full p-4 outline-none bg-transparent"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-[#5A189A] hover:bg-[#240046] disabled:opacity-60 text-white font-semibold p-4 rounded-xl transition"
                        >
                            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                            {!loading && <ArrowRight size={19} />}
                        </button>
                    </form>

                    <p className="text-center text-gray-500 mt-8">
                        Henüz hesabın yok mu?{" "}
                        <Link
                            to="/register"
                            className="text-[#7B2CBF] font-semibold hover:underline"
                        >
                            Kayıt Ol
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
