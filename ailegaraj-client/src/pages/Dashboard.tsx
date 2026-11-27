
import { useState, type FormEvent } from "react";
import {
    Users,
    Plus,
    KeyRound,
    Loader2,
    CarFront,
    CalendarDays,
    Receipt,
    ChartNoAxesCombined,
    ArrowUpRight,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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

const quickActions = [
    {
        title: "Araçlar",
        description: "Aile araçlarını yönet",
        path: "/vehicles",
        icon: CarFront,
    },
    {
        title: "Rezervasyonlar",
        description: "Kullanım planını görüntüle",
        path: "/reservations",
        icon: CalendarDays,
    },
    {
        title: "Giderler",
        description: "Araç giderlerini takip et",
        path: "/expenses",
        icon: Receipt,
    },
    {
        title: "Raporlar",
        description: "Kullanım analizlerini incele",
        path: "/reports",
        icon: ChartNoAxesCombined,
    },
];

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [familyName, setFamilyName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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

    const handleCreateFamily = (e: FormEvent) => {
        e.preventDefault();
        createFamilyMutation.mutate(familyName.trim());
    };

    const handleJoinFamily = (e: FormEvent) => {
        e.preventDefault();
        joinFamilyMutation.mutate(inviteCode.trim().toUpperCase());
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#5A189A]" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <p className="text-gray-600">
                    Aile bilgileri alınırken bir hata oluştu.
                </p>
                <button
                    onClick={() => refetch()}
                    className="rounded-xl bg-[#5A189A] px-5 py-2.5 font-semibold text-white"
                >
                    Tekrar Dene
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8 pb-10">

            {/* Welcome */}
            <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-[#240046] p-7 text-white shadow-xl shadow-purple-950/10 md:p-10"
            >
                <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#5A189A]/60 blur-3xl" />
                <div className="absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-[#974CE0]/30 blur-3xl" />

                <div className="relative z-10 max-w-2xl">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-purple-100">
                        <Sparkles size={14} />
                        AileGaraj'a hoş geldin
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                        Merhaba, {user?.firstName}!
                    </h1>

                    <p className="mt-3 max-w-lg text-sm leading-6 text-purple-100/80 md:text-base">
                        Ailenin araçlarını, rezervasyonlarını ve giderlerini
                        tek bir yerden kolayca yönet.
                    </p>

                    {family && (
                        <button
                            onClick={() => navigate("/family")}
                            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#E1FF00] px-5 py-3 text-sm font-bold text-[#240046] transition hover:-translate-y-0.5 hover:bg-[#d4f000]"
                        >
                            Aile Yönetimine Git
                            <ArrowUpRight size={17} />
                        </button>
                    )}
                </div>

                <div className="absolute bottom-0 right-8 hidden opacity-20 md:block">
                    <CarFront size={190} strokeWidth={0.8} />
                </div>
            </motion.section>

            {/* Notifications */}
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    {success}
                </div>
            )}

            {family ? (
                <>
                    {/* Family Overview */}
                    <motion.section
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid gap-5 md:grid-cols-3"
                    >
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:col-span-2">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-[#5A189A]">
                                        <Users size={27} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Aile Bilgileri
                                        </p>
                                        <h2 className="mt-1 text-xl font-bold text-[#240046]">
                                            {family.name}
                                        </h2>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate("/family")}
                                    className="rounded-xl p-2 text-gray-400 transition hover:bg-purple-50 hover:text-[#5A189A]"
                                >
                                    <ArrowUpRight size={21} />
                                </button>
                            </div>

                            <div className="mt-7 grid grid-cols-2 gap-4">
                                <div className="rounded-xl bg-[#F8F5FC] p-4">
                                    <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                                        <ShieldCheck size={16} />
                                        Rolün
                                    </div>
                                    <p className="font-semibold text-[#240046]">
                                        {family.role === "FamilyAdmin"
                                            ? "Aile Yöneticisi"
                                            : "Aile Üyesi"}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-[#F8F5FC] p-4">
                                    <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                                        <Users size={16} />
                                        Üye Sayısı
                                    </div>
                                    <p className="font-semibold text-[#240046]">
                                        {family.memberCount} kişi
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Aile Numarası
                                </p>
                                <h3 className="mt-2 text-3xl font-bold text-[#240046]">
                                    #{family.id}
                                </h3>
                            </div>

                            <div className="mt-6 border-t border-gray-100 pt-4">
                                <p className="text-xs text-gray-400">
                                    AileGaraj üyeliğin
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[#5A189A]">
                                    {family.role === "FamilyAdmin"
                                        ? "Yönetici hesabı"
                                        : "Standart üyelik"}
                                </p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Quick Actions */}
                    <section>
                        <div className="mb-5 flex items-end justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-[#240046]">
                                    Hızlı İşlemler
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    İhtiyacın olan bölüme hızlıca ulaş.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {quickActions.map((action, index) => {
                                const Icon = action.icon;

                                return (
                                    <motion.button
                                        key={action.path}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 + index * 0.06 }}
                                        onClick={() => navigate(action.path)}
                                        className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-950/5"
                                    >
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5A189A] transition group-hover:bg-[#5A189A] group-hover:text-white">
                                            <Icon size={23} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-[#240046]">
                                                {action.title}
                                            </h3>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {action.description}
                                            </p>
                                        </div>

                                        <ArrowUpRight
                                            size={18}
                                            className="shrink-0 text-gray-300 transition group-hover:text-[#5A189A]"
                                        />
                                    </motion.button>
                                );
                            })}
                        </div>
                    </section>
                </>
            ) : (
                /* No Family */
                <section className="grid gap-6 lg:grid-cols-2">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm md:p-8"
                    >
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-[#5A189A]">
                            <Plus size={27} />
                        </div>

                        <h2 className="text-xl font-bold text-[#240046]">
                            Aile Oluştur
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            Kendi aileni oluştur ve aile üyelerini davet ederek
                            araçlarınızı birlikte yönetin.
                        </p>

                        <form onSubmit={handleCreateFamily} className="mt-7">
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
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
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#974CE0] focus:bg-white focus:ring-4 focus:ring-purple-100"
                            />

                            <button
                                type="submit"
                                disabled={createFamilyMutation.isPending}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5A189A] py-3 font-semibold text-white transition hover:bg-[#240046] disabled:opacity-50"
                            >
                                {createFamilyMutation.isPending && (
                                    <Loader2 size={18} className="animate-spin" />
                                )}
                                Aile Oluştur
                            </button>
                        </form>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm md:p-8"
                    >
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-[#5A189A]">
                            <KeyRound size={27} />
                        </div>

                        <h2 className="text-xl font-bold text-[#240046]">
                            Davet Koduyla Katıl
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            Bir aile yöneticisinden aldığın davet kodunu
                            kullanarak mevcut bir aileye katıl.
                        </p>

                        <form onSubmit={handleJoinFamily} className="mt-7">
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Davet Kodu
                            </label>

                            <input
                                type="text"
                                value={inviteCode}
                                onChange={(e) =>
                                    setInviteCode(e.target.value.toUpperCase())
                                }
                                placeholder="Davet kodunu gir"
                                maxLength={20}
                                required
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm uppercase outline-none transition focus:border-[#974CE0] focus:bg-white focus:ring-4 focus:ring-purple-100"
                            />

                            <button
                                type="submit"
                                disabled={joinFamilyMutation.isPending}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#240046] py-3 font-semibold text-white transition hover:bg-[#5A189A] disabled:opacity-50"
                            >
                                {joinFamilyMutation.isPending && (
                                    <Loader2 size={18} className="animate-spin" />
                                )}
                                Aileye Katıl
                            </button>
                        </form>
                    </motion.div>
                </section>
            )}
        </div>
    );
}
