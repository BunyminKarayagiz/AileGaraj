/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Loader2, Search } from "lucide-react";
import api from "../services/api";

const date = (v?: string | null) => v ? new Date(v).toLocaleString("tr-TR") : "-";

export default function AdminReservations() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(1);

    const list = useQuery({
        queryKey: ["admin-reservations", search, status, page],
        queryFn: async () => (await api.get("/admin/reservations", { params: { search: search || undefined, status: status === "all" ? undefined : status, page, pageSize: 20 } })).data,
        enabled: !id,
    });
    const detail = useQuery({
        queryKey: ["admin-reservation-detail", id],
        queryFn: async () => (await api.get(`/admin/reservations/${id}`)).data,
        enabled: Boolean(id),
    });

    if (id) {
        if (detail.isLoading) return <Loader2 className="mx-auto animate-spin text-[#974CE0]" />;
        if (detail.isError || !detail.data) return <div>Rezervasyon yüklenemedi.</div>;
        const r = detail.data.reservation;
        return (
            <div className="space-y-6">
                <button onClick={() => navigate("/admin/reservations")} className="flex items-center gap-2 text-sm font-semibold text-[#5A189A]"><ArrowLeft size={16} /> Rezervasyon listesine dön</button>
                <div className="rounded-2xl border bg-white p-6">
                    <p className="text-xs font-bold uppercase text-[#974CE0]">{r.familyName}</p><h1 className="mt-2 text-2xl font-bold text-[#240046]">{r.vehicleName} · {r.plateNumber}</h1>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Kullanıcı</p><p className="mt-1 font-semibold">{r.memberName}</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Başlangıç</p><p className="mt-1 font-semibold">{date(r.startDate)}</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Bitiş</p><p className="mt-1 font-semibold">{date(r.endDate)}</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Durum</p><p className="mt-1 font-semibold">{r.status}</p></div></div>
                    <div className="mt-4 rounded-xl border p-4"><p className="text-xs text-gray-400">Güzergah / açıklama</p><p className="mt-1 text-sm">{r.destination}{r.description ? ` — ${r.description}` : ""}</p></div>
                </div>
                <div className="rounded-2xl border bg-white p-5"><h2 className="font-bold text-[#240046]">İşlem geçmişi</h2><div className="mt-4 space-y-2">{detail.data.auditLogs.length ? detail.data.auditLogs.map((l: any) => <div key={l.id} className="rounded-xl border p-3"><p className="font-semibold">{l.action}</p><p className="text-xs text-gray-500">{l.description || "-"} · {date(l.createdAt)}</p></div>) : <p className="text-sm text-gray-400">Bu rezervasyon için denetim kaydı bulunmuyor.</p>}</div></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div><p className="text-xs font-bold uppercase text-[#974CE0]">SuperAdmin</p><h1 className="mt-2 text-3xl font-bold text-[#240046]">Rezervasyon İzleme</h1></div>
            <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 text-gray-400" size={18} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Aile, kullanıcı, araç veya plaka" className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm" /></div><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border px-3 text-sm"><option value="all">Tüm durumlar</option><option value="Reserved">Rezerve</option><option value="Completed">Tamamlandı</option><option value="Cancelled">İptal edildi</option></select></div>
            {list.isLoading ? <Loader2 className="mx-auto animate-spin text-[#974CE0]" /> : list.isError ? <div>Liste yüklenemedi.</div> : (
                <div className="overflow-hidden rounded-2xl border bg-white"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="p-4">Araç</th><th className="p-4">Aile / Kullanıcı</th><th className="p-4">Tarih</th><th className="p-4">Durum</th><th className="p-4">İşlem</th></tr></thead><tbody>{list.data.items.map((r: any) => (
                    <tr key={r.id} className="border-t"><td className="p-4"><p className="font-semibold">{r.vehicleName}</p><p className="text-xs text-gray-500">{r.plateNumber}</p></td><td className="p-4"><p>{r.familyName}</p><p className="text-xs text-gray-500">{r.memberName}</p></td><td className="p-4 text-xs">{date(r.startDate)}<br />{date(r.endDate)}</td><td className="p-4"><span className="flex items-center gap-1"><span className="text-xs">{r.status}</span>{r.hasConflict ? <AlertTriangle size={15} className="text-red-500" /> : null}</span></td><td className="p-4"><button onClick={() => navigate(`/admin/reservations/${r.id}`)} className="text-xs font-semibold text-[#5A189A]">Detay</button></td></tr>
                ))}</tbody></table></div></div>
            )}
        </div>
    );
}
