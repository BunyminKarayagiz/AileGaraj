/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../services/api";

const money = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);
const date = (v?: string | null) => v ? new Date(v).toLocaleDateString("tr-TR") : "-";
const colors = ["#974CE0", "#240046", "#16A34A", "#F59E0B", "#EF4444", "#0EA5E9"];

export default function AdminExpenses() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(1);

    const summary = useQuery({
        queryKey: ["admin-financial-summary"],
        queryFn: async () => (await api.get("/admin/financial-summary")).data,
    });
    const list = useQuery({
        queryKey: ["admin-expenses", search, status, page],
        queryFn: async () => (await api.get("/admin/expenses", { params: { search: search || undefined, isActive: status === "all" ? undefined : status === "active", page, pageSize: 20 } })).data,
    });

    const s = summary.data;
    return (
        <div className="space-y-6">
            <div><p className="text-xs font-bold uppercase text-[#974CE0]">SuperAdmin</p><h1 className="mt-2 text-3xl font-bold text-[#240046]">Gider ve Finansal Yönetim</h1></div>
            {summary.isLoading ? <Loader2 className="mx-auto animate-spin text-[#974CE0]" /> : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-gray-500">Aktif toplam gider</p><p className="mt-2 text-3xl font-bold text-[#240046]">{money(s?.totalAmount || 0)}</p></div>
                        <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-gray-500">Aktif gider kaydı</p><p className="mt-2 text-3xl font-bold text-[#240046]">{s?.totalCount || 0}</p></div>
                        <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-gray-500">Gider kategorisi</p><p className="mt-2 text-3xl font-bold text-[#240046]">{s?.categoryDistribution?.length || 0}</p></div>
                    </div>
                    <div className="grid gap-6 xl:grid-cols-2">
                        <div className="rounded-2xl border bg-white p-5"><h2 className="font-bold text-[#240046]">Kategori dağılımı</h2><div className="mt-4 h-72">{s?.categoryDistribution?.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={s.categoryDistribution} dataKey="totalAmount" nameKey="categoryName" cx="50%" cy="50%" outerRadius={90} label>{s.categoryDistribution.map((_: any, i: number) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} /></PieChart></ResponsiveContainer> : <p className="py-20 text-center text-sm text-gray-400">Veri yok</p>}</div></div>
                        <div className="rounded-2xl border bg-white p-5"><h2 className="font-bold text-[#240046]">Aylık giderler</h2><div className="mt-4 h-72">{s?.monthly?.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={s.monthly.map((m: any) => ({ name: `${m.month}/${m.year}`, total: m.totalAmount }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value) => money(Number(value))} /><Bar dataKey="total" fill="#974CE0" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="py-20 text-center text-sm text-gray-400">Veri yok</p>}</div></div>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl border bg-white p-5"><h2 className="font-bold text-[#240046]">En fazla harcama yapan aileler</h2><div className="mt-4 space-y-2">{s?.topFamilies?.map((f: any) => <div key={f.familyId} className="flex justify-between rounded-xl border p-3"><span>{f.familyName}</span><span className="font-bold">{money(f.totalAmount)}</span></div>)}</div></div>
                        <div className="rounded-2xl border bg-white p-5"><h2 className="font-bold text-[#240046]">En fazla gider oluşturulan araçlar</h2><div className="mt-4 space-y-2">{s?.topVehicles?.map((v: any) => <div key={v.vehicleId} className="flex justify-between rounded-xl border p-3"><span>{v.vehicleName} · {v.plateNumber}</span><span className="font-bold">{money(v.totalAmount)}</span></div>)}</div></div>
                    </div>
                </>
            )}

            <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 text-gray-400" size={18} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Aile, araç, plaka veya kategori" className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm" /></div><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border px-3 text-sm"><option value="all">Tüm giderler</option><option value="active">Aktif</option><option value="inactive">Pasif</option></select></div>
            {list.isLoading ? <Loader2 className="mx-auto animate-spin text-[#974CE0]" /> : list.isError ? <p>Giderler yüklenemedi.</p> : (
                <div className="overflow-hidden rounded-2xl border bg-white"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="p-4">Aile / Araç</th><th className="p-4">Kategori</th><th className="p-4">Tarih</th><th className="p-4">Tutar</th><th className="p-4">Durum</th></tr></thead><tbody>{list.data.items.map((e: any) => <tr key={e.id} className="border-t"><td className="p-4"><p className="font-semibold">{e.familyName}</p><p className="text-xs text-gray-500">{e.vehicleName} · {e.plateNumber}</p></td><td className="p-4">{e.categoryName}</td><td className="p-4">{date(e.expenseDate)}</td><td className="p-4 font-bold">{money(e.amount)}</td><td className="p-4">{e.isActive ? "Aktif" : "Pasif"}</td></tr>)}</tbody></table></div></div>
            )}
        </div>
    );
}
