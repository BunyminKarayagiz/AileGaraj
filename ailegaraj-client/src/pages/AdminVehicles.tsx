/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Car, Loader2, Search } from "lucide-react";
import api from "../services/api";

const money = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);
const date = (v?: string | null) => v ? new Date(v).toLocaleDateString("tr-TR") : "-";

export default function AdminVehicles() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(1);

    const list = useQuery({
        queryKey: ["admin-vehicles", search, status, page],
        queryFn: async () => (await api.get("/admin/vehicles", { params: { search: search || undefined, isActive: status === "all" ? undefined : status === "active", page, pageSize: 20 } })).data,
        enabled: !id,
    });
    const detail = useQuery({
        queryKey: ["admin-vehicle-detail", id],
        queryFn: async () => (await api.get(`/admin/vehicles/${id}`)).data,
        enabled: Boolean(id),
    });
    const setActive = useMutation({
        mutationFn: ({ vehicleId, active }: { vehicleId: number; active: boolean }) => api.post(`/admin/vehicles/${vehicleId}/active`, { isActive: active }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
            queryClient.invalidateQueries({ queryKey: ["admin-vehicle-detail"] });
        },
    });

    if (id) {
        if (detail.isLoading) return <Loader2 className="mx-auto animate-spin text-[#974CE0]" />;
        if (detail.isError || !detail.data) return <AlertCircle className="mx-auto text-red-400" />;
        const d = detail.data;
        const v = d.vehicle;
        return (
            <div className="space-y-6">
                <button onClick={() => navigate("/admin/vehicles")} className="flex items-center gap-2 text-sm font-semibold text-[#5A189A]"><ArrowLeft size={16} /> Araç listesine dön</button>
                <div className="rounded-2xl border bg-white p-6">
                    <div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-bold uppercase text-[#974CE0]">{v.familyName}</p><h1 className="mt-2 text-2xl font-bold text-[#240046]">{v.brand} {v.model}</h1><p className="mt-1 text-sm text-gray-500">{v.plateNumber}</p></div><button onClick={() => setActive.mutate({ vehicleId: v.id, active: !v.isActive })} className="h-fit rounded-xl border px-4 py-2 text-sm font-semibold">{v.isActive ? "Pasifleştir" : "Aktifleştir"}</button></div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Model yılı</p><p className="mt-1 font-semibold">{v.modelYear}</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Kilometre</p><p className="mt-1 font-semibold">{v.currentMileage.toLocaleString("tr-TR")} km</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Yakıt</p><p className="mt-1 font-semibold">{v.fuelType}</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Rezervasyon</p><p className="mt-1 font-semibold">{d.statistics.reservationCount}</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Aktif gider</p><p className="mt-1 font-semibold">{money(d.statistics.activeExpenseAmount)}</p></div></div>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border bg-white p-5"><h2 className="font-bold text-[#240046]">Rezervasyon geçmişi</h2><div className="mt-4 space-y-2">{d.reservations.map((r: any) => <div key={r.id} className="rounded-xl border p-3"><p className="font-semibold">{r.memberName}</p><p className="text-xs text-gray-500">{date(r.startDate)} - {date(r.endDate)} · {r.status}</p></div>)}</div></div>
                    <div className="rounded-2xl border bg-white p-5"><h2 className="font-bold text-[#240046]">Gider geçmişi</h2><div className="mt-4 space-y-2">{d.expenses.map((e: any) => <div key={e.id} className="flex justify-between rounded-xl border p-3"><div><p className="font-semibold">{e.categoryName}</p><p className="text-xs text-gray-500">{date(e.expenseDate)}</p></div><p className="font-bold">{money(e.amount)}</p></div>)}</div></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div><p className="text-xs font-bold uppercase text-[#974CE0]">SuperAdmin</p><h1 className="mt-2 text-3xl font-bold text-[#240046]">Araç Yönetimi</h1></div>
            <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 text-gray-400" size={18} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Marka, model, plaka veya aile" className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm" /></div><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border px-3 text-sm"><option value="all">Tüm araçlar</option><option value="active">Aktif</option><option value="inactive">Pasif</option></select></div>
            {list.isLoading ? <Loader2 className="mx-auto animate-spin text-[#974CE0]" /> : list.isError ? <AlertCircle className="mx-auto text-red-400" /> : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.data.items.map((v: any) => (
                    <button key={v.id} onClick={() => navigate(`/admin/vehicles/${v.id}`)} className="rounded-2xl border bg-white p-5 text-left hover:border-[#974CE0]/40">
                        <div className="flex justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3EAFE] text-[#5A189A]"><Car size={21} /></div><span className={`rounded-full px-2 py-1 text-xs ${v.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{v.isActive ? "Aktif" : "Pasif"}</span></div>
                        <h2 className="mt-4 font-bold text-[#240046]">{v.brand} {v.model}</h2><p className="text-sm text-gray-500">{v.plateNumber}</p><p className="mt-2 text-xs text-gray-400">{v.familyName}</p><div className="mt-4 flex justify-between border-t pt-3 text-xs"><span>{v.reservationCount} rezervasyon</span><span>{money(v.totalExpense)}</span></div>
                    </button>
                ))}</div>
            )}
        </div>
    );
}
