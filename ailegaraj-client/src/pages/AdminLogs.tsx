/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import api from "../services/api";

export default function AdminLogs() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const { data, isLoading, isError } = useQuery({
        queryKey: ["admin-logs", search, page],
        queryFn: async () => (await api.get("/admin/logs", { params: { search: search || undefined, page, pageSize: 30 } })).data,
    });

    return (
        <div className="space-y-6">
            <div><p className="text-xs font-bold uppercase text-[#974CE0]">SuperAdmin</p><h1 className="mt-2 text-3xl font-bold text-[#240046]">Sistem Kayıtları</h1></div>
            <div className="relative rounded-2xl border bg-white p-4"><Search className="absolute left-7 top-7 text-gray-400" size={18} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="İşlem, varlık veya açıklama ara" className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm" /></div>
            {isLoading ? <Loader2 className="mx-auto animate-spin text-[#974CE0]" /> : isError ? <p>Kayıtlar yüklenemedi.</p> : (
                <div className="overflow-hidden rounded-2xl border bg-white"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="p-4">İşlem</th><th className="p-4">Varlık</th><th className="p-4">Açıklama</th><th className="p-4">Zaman</th></tr></thead><tbody>{data.items.map((l: any) => <tr key={l.id} className="border-t"><td className="p-4 font-semibold">{l.action}</td><td className="p-4"><p>{l.entityType}</p><p className="text-xs text-gray-400">{l.entityId || "-"}</p></td><td className="p-4 text-xs">{l.description || "-"}</td><td className="p-4 text-xs">{new Date(l.createdAt).toLocaleString("tr-TR")}</td></tr>)}</tbody></table></div><div className="flex justify-between border-t p-4 text-xs"><span>{data.totalCount} kayıt</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-1">Önceki</button><button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-1">Sonraki</button></div></div></div>
            )}
        </div>
    );
}
