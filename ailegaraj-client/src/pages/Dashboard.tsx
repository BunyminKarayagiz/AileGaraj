
import { useState, type FormEvent } from "react";
import {
    LogOut,
    Users,
    Plus,
    KeyRound,
    Loader2,
    Car,
    CalendarDays,
    Receipt,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

interface FamilyResponse {
    id: number;
    name: string;
    role: string;
    createdAt: string;
    memberCount: number;
}

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [familyName, setFamilyName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Kullanıcının aile bilgilerini getir
    const {
        data: family,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["my-family"],
        queryFn: async () => {
            const response = await api.get<FamilyResponse | null>(
                "/families/my-family"
            );

            return response.data;
        },
    });

    // Aile oluşturma
    const createFamilyMutation = useMutation({
        mutationFn: async (name: string) => {
            const response = await api.post<FamilyResponse>(
                "/families",
                { name }
            );

            return response.data;
        },
        onMutate: () => {
            setError("");
            setSuccess("");
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["my-family"], data);

            setFamilyName("");
            setSuccess("Ailen başarıyla oluşturuldu.");
        },
        onError: () => {
            setError("Aile oluşturulurken bir hata oluştu.");
        },
    });

    // Davet koduyla aileye katılma
    const joinFamilyMutation = useMutation({
        mutationFn: async (code: string) => {
            const response = await api.post<FamilyResponse>(
                "/families/join",
                { inviteCode: code }
            );

            return response.data;
        },
        onMutate: () => {
            setError("");
            setSuccess("");
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["my-family"], data);

            setInviteCode("");
            setSuccess("Aileye başarıyla katıldın.");
        },
        onError: () => {
            setError("Aileye katılınamadı. Davet kodunu kontrol et.");
        },
    });

    // Aile oluşturma formu
    const handleCreateFamily = (e: FormEvent) => {
        e.preventDefault();

        createFamilyMutation.mutate(familyName.trim());
    };

    // Aileye katılma formu
    const handleJoinFamily = (e: FormEvent) => {
        e.preventDefault();

        joinFamilyMutation.mutate(
            inviteCode.trim().toUpperCase()
        );
    };

    // Çıkış
    const handleLogout = async () => {
        await logout();
    };

    // Yükleniyor
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f7fa]">
                <Loader2 className="w-8 h-8 animate-spin text-[#5A189A]" />
            </div>
        );
    }

    // Aile bilgileri alınırken beklenmeyen hata
    if (isError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f7fa] p-6">
                <p className="text-gray-600 mb-4">
                    Aile bilgileri alınırken bir hata oluştu.
                </p>

                <button
                    onClick={() => refetch()}
                    className="text-[#5A189A] font-semibold"
                >
                    Tekrar Dene
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f7fa]">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#240046]">
                            AileGaraj
                        </h1>
                        <p className="text-sm text-gray-500">
                            Aile araç yönetim platformu
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="font-semibold text-gray-800">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                                {user?.email}
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                        >
                            <LogOut size={18} />
                            Çıkış
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-[#240046]">
                        Merhaba, {user?.firstName}!
                    </h2>
                    <p className="text-gray-500 mt-1">
                        AileGaraj hesabına hoş geldin.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 rounded-lg bg-green-50 text-green-700 border border-green-200">
                        {success}
                    </div>
                )}

                {family ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Users className="text-[#5A189A]" size={25} />
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">
                                    Ailen
                                </p>
                                <h3 className="text-xl font-bold text-[#240046]">
                                    {family.name}
                                </h3>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-gray-50">
                                <p className="text-sm text-gray-500">
                                    Rolün
                                </p>
                                <p className="font-semibold text-[#240046] mt-1">
                                    {family.role === "FamilyAdmin"
                                        ? "Aile Yöneticisi"
                                        : "Aile Üyesi"}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-gray-50">
                                <p className="text-sm text-gray-500">
                                    Üye Sayısı
                                </p>
                                <p className="font-semibold text-[#240046] mt-1">
                                    {family.memberCount}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-gray-50">
                                <p className="text-sm text-gray-500">
                                    Aile No
                                </p>
                                <p className="font-semibold text-[#240046] mt-1">
                                    #{family.id}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate("/family")}
                            className="mt-6 px-5 py-3 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] transition"
                        >
                            Aile Yönetimine Git
                        </button>

                        <div className="mt-8 border-t pt-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-semibold text-[#240046] mb-1">
                                        Araç Yönetimi
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                        Ailene ait araçları görüntüle ve yönet.
                                    </p>
                                </div>

                                <button
                                    onClick={() => navigate("/vehicles")}
                                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] transition"
                                >
                                    <Car size={18} />
                                    Araçları Görüntüle
                                </button>
                            </div>
                        </div>
                        <div className="mt-6 border-t pt-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-semibold text-[#240046] mb-1">
                                        Rezervasyon Yönetimi
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                        Aile araçlarının rezervasyonlarını görüntüle ve takip et.
                                    </p>
                                </div>

                                <button
                                    onClick={() => navigate("/reservations")}
                                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] transition"
                                >
                                    <CalendarDays size={18} />
                                    Rezervasyonları Görüntüle
                                </button>
                            </div>
                        </div>
                        <div className="mt-6 border-t pt-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-semibold text-[#240046] mb-1">
                                        Gider Yönetimi
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                        Aile araçlarına ait giderleri görüntüle ve takip et.
                                    </p>
                                </div>

                                <button
                                    onClick={() => navigate("/expenses")}
                                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] transition"
                                >
                                    <Receipt size={18} />
                                    Giderleri Görüntüle
                                </button>
                            </div>
                        </div>

                    </div>

                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-5">
                                <Plus className="text-[#5A189A]" size={26} />
                            </div>

                            <h3 className="text-xl font-bold text-[#240046]">
                                Aile Oluştur
                            </h3>

                            <p className="text-sm text-gray-500 mt-2 mb-6">
                                Kendi aileni oluştur ve aile üyelerini davet ederek araçlarını
                                birlikte yönet.
                            </p>

                            <form onSubmit={handleCreateFamily}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Aile Adı
                                </label>

                                <input
                                    type="text"
                                    value={familyName}
                                    onChange={(e) => setFamilyName(e.target.value)}
                                    placeholder="Örn. Karayağız Ailesi"
                                    minLength={2}
                                    maxLength={100}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-[#974CE0] mb-4"
                                />

                                <button
                                    type="submit"
                                    disabled={createFamilyMutation.isPending}
                                    className="w-full bg-[#5A189A] text-white py-3 rounded-lg font-semibold hover:bg-[#240046] transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {createFamilyMutation.isPending && (
                                        <Loader2 size={18} className="animate-spin" />
                                    )}
                                    Aile Oluştur
                                </button>
                            </form>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-5">
                                <KeyRound className="text-[#5A189A]" size={26} />
                            </div>

                            <h3 className="text-xl font-bold text-[#240046]">
                                Davet Koduyla Katıl
                            </h3>

                            <p className="text-sm text-gray-500 mt-2 mb-6">
                                Bir aile yöneticisinden aldığın davet kodunu kullanarak
                                mevcut bir aileye katıl.
                            </p>

                            <form onSubmit={handleJoinFamily}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Davet Kodu
                                </label>

                                <input
                                    type="text"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    placeholder="Davet kodunu gir"
                                    maxLength={20}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-[#974CE0] mb-4 uppercase"
                                />

                                <button
                                    type="submit"
                                    disabled={joinFamilyMutation.isPending}
                                    className="w-full bg-[#240046] text-white py-3 rounded-lg font-semibold hover:bg-[#5A189A] transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {joinFamilyMutation.isPending && (
                                        <Loader2 size={18} className="animate-spin" />
                                    )}
                                    Aileye Katıl
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
