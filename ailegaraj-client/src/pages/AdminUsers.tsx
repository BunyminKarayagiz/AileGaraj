/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
    AlertCircle, ArrowLeft, BadgeCheck, Loader2,
    Search, ShieldCheck, UserCheck, UserX,
} from "lucide-react";
import api from "../services/api";

interface PagedUsers {
    items: UserRow[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}
interface UserRow {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    emailConfirmed: boolean;
    isActive: boolean;
    isSuperAdmin: boolean;
    createdAt: string;
    lastActivityAt: string | null;
    familyCount: number;
    activeSessionCount: number;
}

const date = (value?: string | null) =>
    value ? new Date(value).toLocaleString("tr-TR") : "-";

export default function AdminUsers() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [verified, setVerified] = useState("all");
    const [page, setPage] = useState(1);

    const list = useQuery({
        queryKey: ["admin-users", search, status, verified, page],
        queryFn: async () => {
            const res = await api.get<PagedUsers>("/admin/users", {
                params: {
                    search: search || undefined,
                    isActive: status === "all" ? undefined : status === "active",
                    emailConfirmed: verified === "all" ? undefined : verified === "yes",
                    page,
                    pageSize: 20,
                },
            });
            return res.data;
        },
        enabled: !id,
    });

    const detail = useQuery({
        queryKey: ["admin-user-detail", id],
        queryFn: async () => (await api.get(`/admin/users/${id}`)).data,
        enabled: Boolean(id),
    });

    const setActive = useMutation({
        mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
            api.post(`/admin/users/${userId}/active`, { isActive: active }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            queryClient.invalidateQueries({ queryKey: ["admin-user-detail"] });
        },
    });
    const revoke = useMutation({
        mutationFn: (userId: string) => api.post(`/admin/users/${userId}/revoke-sessions`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-user-detail"] }),
    });
    const setAdmin = useMutation({
        mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
            api.post(`/admin/users/${userId}/super-admin`, { isSuperAdmin: active }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            queryClient.invalidateQueries({ queryKey: ["admin-user-detail"] });
        },
    });

    if (id) {
        if (detail.isLoading) return <Loader2 className="mx-auto animate-spin text-[#974CE0]" />;
        if (detail.isError || !detail.data) return <AlertCircle className="mx-auto text-red-400" />;
        const d = detail.data;
        const u = d.user;
        return (
            <div className="space-y-6">
                <button onClick={() => navigate("/admin/users")} className="flex items-center gap-2 text-sm font-semibold text-[#5A189A]">
                    <ArrowLeft size={16} /> Kullanıcı listesine dön
                </button>
                <div className="rounded-2xl border border-gray-100 bg-white p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-[#240046]">{u.firstName} {u.lastName}</h1>
                            <p className="mt-1 text-sm text-gray-500">{u.email}</p>
                            <p className="mt-1 text-xs text-gray-400">{u.phoneNumber || "Telefon yok"}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setActive.mutate({ userId: id, active: !u.isActive })} className="rounded-xl border px-4 py-2 text-sm font-semibold">
                                {u.isActive ? "Pasifleştir" : "Aktifleştir"}
                            </button>
                            <button onClick={() => revoke.mutate(id)} className="rounded-xl border px-4 py-2 text-sm font-semibold">
                                Oturumları sonlandır
                            </button>
                            <button onClick={() => setAdmin.mutate({ userId: id, active: !d.roles.includes("SuperAdmin") })} className="rounded-xl bg-[#5A189A] px-4 py-2 text-sm font-semibold text-white">
                                {d.roles.includes("SuperAdmin") ? "Super Admin kaldır" : "Super Admin yap"}
                            </button>
                        </div>
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">E-posta</p><p className="mt-1 text-sm font-semibold">{u.emailConfirmed ? "Doğrulandı" : "Doğrulanmadı"}</p></div>
                        <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Hesap</p><p className="mt-1 text-sm font-semibold">{u.isActive ? "Aktif" : "Pasif"}</p></div>
                        <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Kayıt</p><p className="mt-1 text-sm font-semibold">{date(u.createdAt)}</p></div>
                        <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Son aktivite</p><p className="mt-1 text-sm font-semibold">{date(u.lastActivityAt)}</p></div>
                    </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5">
                        <h2 className="font-bold text-[#240046]">Aile üyelikleri</h2>
                        <div className="mt-4 space-y-2">{d.memberships.map((m: any) => (
                            <div key={m.id} className="rounded-xl border p-3"><p className="font-semibold">{m.familyName}</p><p className="text-xs text-gray-500">{m.role} · {m.isActive ? "Aktif" : "Pasif"} · {date(m.joinedAt)}</p></div>
                        ))}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-5">
                        <h2 className="font-bold text-[#240046]">Oturumlar</h2>
                        <div className="mt-4 space-y-2">{d.sessions.map((s: any) => (
                            <div key={s.id} className="rounded-xl border p-3"><p className="font-semibold">{s.deviceInfo || "Bilinmeyen cihaz"}</p><p className="text-xs text-gray-500">{date(s.lastActivityAt)} · {s.isActive ? "Aktif" : "Sonlandırılmış"}</p></div>
                        ))}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div><p className="text-xs font-bold uppercase text-[#974CE0]">SuperAdmin</p><h1 className="mt-2 text-3xl font-bold text-[#240046]">Kullanıcı Yönetimi</h1></div>
            <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 md:flex-row">
                <div className="relative flex-1"><Search className="absolute left-3 top-3 text-gray-400" size={18} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Ad, soyad, e-posta veya telefon" className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm" /></div>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border px-3 text-sm"><option value="all">Tüm hesaplar</option><option value="active">Aktif</option><option value="inactive">Pasif</option></select>
                <select value={verified} onChange={(e) => setVerified(e.target.value)} className="rounded-xl border px-3 text-sm"><option value="all">Tüm doğrulamalar</option><option value="yes">Doğrulanmış</option><option value="no">Doğrulanmamış</option></select>
            </div>
            {list.isLoading ? <Loader2 className="mx-auto animate-spin text-[#974CE0]" /> : list.isError ? <AlertCircle className="mx-auto text-red-400" /> : (
                <div className="overflow-hidden rounded-2xl border bg-white">
                    <div className="overflow-x-auto"><table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="p-4">Kullanıcı</th><th className="p-4">Durum</th><th className="p-4">Aile</th><th className="p-4">Son aktivite</th><th className="p-4">İşlem</th></tr></thead>
                        <tbody>{list.data?.items.map((u) => (
                            <tr key={u.id} className="border-t">
                                <td className="p-4"><button onClick={() => navigate(`/admin/users/${u.id}`)} className="text-left"><p className="font-semibold text-[#240046]">{u.firstName} {u.lastName}</p><p className="text-xs text-gray-500">{u.email}</p></button></td>
                                <td className="p-4"><div className="flex gap-1">{u.isActive ? <UserCheck size={16} className="text-emerald-600" /> : <UserX size={16} className="text-red-500" />}{u.emailConfirmed ? <BadgeCheck size={16} className="text-[#974CE0]" /> : null}{u.isSuperAdmin ? <ShieldCheck size={16} className="text-[#974CE0]" /> : null}</div></td>
                                <td className="p-4">{u.familyCount}</td><td className="p-4 text-xs">{date(u.lastActivityAt)}</td>
                                <td className="p-4"><button onClick={() => navigate(`/admin/users/${u.id}`)} className="text-xs font-semibold text-[#5A189A]">Detay</button></td>
                            </tr>
                        ))}</tbody>
                    </table></div>
                    <div className="flex items-center justify-between border-t p-4 text-xs"><span>{list.data?.totalCount} kullanıcı</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Önceki</button><span className="px-2 py-2">{page}/{list.data?.totalPages || 1}</span><button disabled={page >= (list.data?.totalPages || 1)} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Sonraki</button></div></div>
                </div>
            )}
        </div>
    );
}
