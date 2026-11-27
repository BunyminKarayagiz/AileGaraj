
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Building2,
    Users,
    Car,
    Receipt,
    Loader2,
    AlertCircle,
    ChevronRight,
    RefreshCw,
} from "lucide-react";

import api from "../services/api";

interface AdminFamily {
    id: number;
    name: string;
    description: string | null;
    createdAt: string;
    isActive: boolean;
    memberCount: number;
    vehicleCount: number;
    expenseCount: number;
}

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

export default function AdminFamilies() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-families", search, status],
        queryFn: async () => {
            const response = await api.get<AdminFamily[]>("/admin/families", {
                params: {
                    search: search.trim() || undefined,
                    isActive:
                        status === "all" ? undefined : status === "active",
                },
            });

            return response.data;
        },
    });

    return (
        <div className="space-y-7 pb-8">
            <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#974CE0]">
                    <Building2 size={16} />
                    SuperAdmin
                </div>
                <h1 className="mt-3 text-2xl font-bold text-[#240046] sm:text-3xl">
                    Aile Yönetimi
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Platformdaki aileleri görüntüle ve yönet.
                </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-3 md:flex-row">
                    <div className="relative flex-1">
                        <Search
                            size={19}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Aile adına göre ara..."
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#974CE0] focus:bg-white focus:ring-2 focus:ring-[#974CE0]/10"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#974CE0]"
                    >
                        <option value="all">Tüm aileler</option>
                        <option value="active">Aktif aileler</option>
                        <option value="inactive">Pasif aileler</option>
                    </select>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-500">
                        {data ? `${data.length} aile listeleniyor` : "Aileler yükleniyor..."}
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 text-xs font-semibold text-[#5A189A] transition hover:text-[#974CE0]"
                    >
                        <RefreshCw size={14} />
                        Yenile
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-[#974CE0]" />
                </div>
            ) : isError ? (
                <div className="rounded-2xl border border-red-100 bg-white p-10 text-center">
                    <AlertCircle className="mx-auto text-red-400" size={34} />
                    <h3 className="mt-3 font-semibold text-gray-800">
                        Aileler yüklenemedi
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Liste alınırken bir hata oluştu.
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="mt-4 rounded-xl bg-[#5A189A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#240046]"
                    >
                        Tekrar Dene
                    </button>
                </div>
            ) : data?.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-16 text-center">
                    <Building2 className="mx-auto text-gray-300" size={38} />
                    <h3 className="mt-4 font-semibold text-[#240046]">
                        Aile bulunamadı
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                        Arama veya filtre kriterlerini değiştirebilirsin.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {data?.map((family) => (
                        <button
                            key={family.id}
                            onClick={() => navigate(`/admin/families/${family.id}`)}
                            className="group rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#974CE0]/30 hover:shadow-lg"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3EAFE] text-[#5A189A] transition group-hover:bg-[#5A189A] group-hover:text-white">
                                        <Building2 size={22} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="truncate font-bold text-[#240046]">
                                            {family.name}
                                        </h3>
                                        <p className="mt-1 text-xs text-gray-400">
                                            Oluşturulma: {formatDate(family.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                <span
                                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${family.isActive
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-red-50 text-red-500"
                                        }`}
                                >
                                    {family.isActive ? "Aktif" : "Pasif"}
                                </span>
                            </div>

                            {family.description && (
                                <p className="mt-4 line-clamp-2 text-sm text-gray-500">
                                    {family.description}
                                </p>
                            )}

                            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="shrink-0 text-[#974CE0]" />
                                    <div>
                                        <p className="text-base font-bold text-[#240046]">
                                            {family.memberCount}
                                        </p>
                                        <p className="text-[10px] text-gray-400">Üye</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Car size={16} className="shrink-0 text-[#974CE0]" />
                                    <div>
                                        <p className="text-base font-bold text-[#240046]">
                                            {family.vehicleCount}
                                        </p>
                                        <p className="text-[10px] text-gray-400">Araç</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Receipt size={16} className="shrink-0 text-[#974CE0]" />
                                    <div>
                                        <p className="text-base font-bold text-[#240046]">
                                            {family.expenseCount}
                                        </p>
                                        <p className="text-[10px] text-gray-400">Gider</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-end gap-1 text-xs font-semibold text-[#5A189A]">
                                Aile detaylarını görüntüle
                                <ChevronRight
                                    size={15}
                                    className="transition-transform group-hover:translate-x-1"
                                />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
