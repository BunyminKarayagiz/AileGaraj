
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    CarFront,
    Mail,
    Phone,
    Lock,
    ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await register({
                firstName,
                lastName,
                email,
                phoneNumber,
                password,
            });

            navigate("/check-email", {
                state: { email },
            });
        } catch (err: unknown) {
            const data = axios.isAxiosError(err)
                ? err.response?.data as {
                    errors?: Record<string, string[]>;
                    message?: string;
                    title?: string;
                } | undefined
                : undefined;

            const validationErrors = data?.errors
                ? Object.values(data.errors).flat().join(" ")
                : null;

            setError(
                validationErrors ||
                data?.message ||
                data?.title ||
                "Kayıt işlemi başarısız oldu. Bilgilerinizi kontrol edin."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F7FA] p-6">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10">
                <Link to="/login" className="flex items-center gap-2 mb-8">
                    <CarFront className="text-[#5A189A]" size={32} />
                    <span className="text-2xl font-bold text-[#240046]">
                        AileGaraj
                    </span>
                </Link>

                <h1 className="text-3xl font-bold text-[#240046] mb-2">
                    Aramıza katıl!
                </h1>
                <p className="text-gray-500 mb-8">
                    Hesabını oluştur ve aile garajını yönetmeye başla.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Ad
                            </label>
                            <input
                                type="text"
                                required
                                maxLength={100}
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Adınız"
                                className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:border-[#974CE0]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Soyad
                            </label>
                            <input
                                type="text"
                                required
                                maxLength={100}
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Soyadınız"
                                className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:border-[#974CE0]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            E-posta
                        </label>
                        <div className="flex items-center border border-gray-200 rounded-xl px-3">
                            <Mail size={18} className="text-gray-400" />
                            <input
                                type="email"
                                required
                                maxLength={256}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ornek@mail.com"
                                className="w-full p-3.5 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Telefon
                        </label>
                        <div className="flex items-center border border-gray-200 rounded-xl px-3">
                            <Phone size={18} className="text-gray-400" />
                            <input
                                type="tel"
                                required
                                maxLength={20}
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="05XX XXX XX XX"
                                className="w-full p-3.5 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Şifre
                        </label>
                        <div className="flex items-center border border-gray-200 rounded-xl px-3">
                            <Lock size={18} className="text-gray-400" />
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="En az 8 karakter"
                                className="w-full p-3.5 outline-none"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            En az 8 karakter, bir büyük harf ve bir rakam içermelidir.
                        </p>
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
                        {loading ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
                        {!loading && <ArrowRight size={19} />}
                    </button>
                </form>

                <p className="text-center text-gray-500 mt-7">
                    Zaten hesabın var mı?{" "}
                    <Link
                        to="/login"
                        className="text-[#7B2CBF] font-semibold hover:underline"
                    >
                        Giriş Yap
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
