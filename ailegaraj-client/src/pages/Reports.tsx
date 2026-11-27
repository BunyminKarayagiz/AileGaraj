
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    BarChart3,
    Receipt,
    CalendarDays,
    Car,
    Clock,
    Loader2,
    RotateCcw,
    Trophy,
    Wallet,
    TrendingUp,
    Users,
    Filter,
    CalendarRange,
    Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    LineChart,
    Line,
    PieChart,
    Pie,
    Legend,
} from "recharts";

import api from "../services/api";
import {
    getReportOverview,
    type ReportFilters,
} from "../services/reportService";

interface Vehicle {
    id: number;
    brand: string;
    model: string;
    plateNumber: string;
}

interface ExpenseCategory {
    id: number;
    name: string;
}

interface FamilyResponse {
    id: number;
    name: string;
}

interface FamilyMember {
    id: number;
    firstName: string;
    lastName: string;
}

const getLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const formatAmount = (amount: number) =>
    new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 2,
    }).format(amount);

const formatDuration = (hours: number) => {
    const totalMinutes = Math.round(hours * 60);
    const wholeHours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (wholeHours === 0) {
        return `${minutes} dakika`;
    }

    if (minutes === 0) {
        return `${wholeHours} saat`;
    }

    return `${wholeHours} saat ${minutes} dakika`;
};

const chartColors = [
    "#5A189A",
    "#974CE0",
    "#E1FF00",
    "#240046",
    "#C77DFF",
    "#7B2CBF",
    "#3C096C",
    "#9D4EDD",
];

const formatChartAmount = (value: number) =>
    new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 0,
    }).format(value);

const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 },
};

const quickDateRanges = [
    { label: "Bu ay", value: "thisMonth" },
    { label: "Geçen ay", value: "lastMonth" },
    { label: "Son 3 ay", value: "last3Months" },
    { label: "Bu yıl", value: "thisYear" },
] as const;

type QuickDateRange = typeof quickDateRanges[number]["value"];

function getDateRange(range: QuickDateRange) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    switch (range) {
        case "thisMonth":
            return {
                start: getLocalDate(new Date(year, month, 1)),
                end: getLocalDate(now),
            };

        case "lastMonth":
            return {
                start: getLocalDate(new Date(year, month - 1, 1)),
                end: getLocalDate(new Date(year, month, 0)),
            };

        case "last3Months":
            return {
                start: getLocalDate(new Date(year, month - 2, 1)),
                end: getLocalDate(now),
            };

        case "thisYear":
            return {
                start: getLocalDate(new Date(year, 0, 1)),
                end: getLocalDate(now),
            };
    }
}

const inputClassName =
    "w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-3 text-sm text-gray-700 outline-none transition duration-200 hover:border-purple-200 focus:border-[#974CE0] focus:bg-white focus:ring-4 focus:ring-purple-100";

export default function Reports() {
    const today = getLocalDate(new Date());

    const firstDayOfMonth = getLocalDate(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );

    const [activeDateRange, setActiveDateRange] =
        useState<QuickDateRange | "custom">("thisMonth");

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);
    const [vehicleId, setVehicleId] = useState("");
    const [familyMemberId, setFamilyMemberId] = useState("");
    const [categoryId, setCategoryId] = useState("");

    // Araçlar
    const { data: vehicles = [] } = useQuery({
        queryKey: ["vehicles"],
        queryFn: async () => {
            const response = await api.get<Vehicle[]>("/vehicles");
            return response.data;
        },
    });

    // Aile bilgisi
    const { data: family } = useQuery({
        queryKey: ["my-family"],
        queryFn: async () => {
            const response = await api.get<FamilyResponse>(
                "/families/my-family"
            );
            return response.data;
        },
    });

    // Aile üyeleri
    const { data: members = [] } = useQuery({
        queryKey: ["family-members", family?.id],
        queryFn: async () => {
            const response = await api.get<FamilyMember[]>(
                `/families/${family!.id}/members`
            );
            return response.data;
        },
        enabled: !!family?.id,
    });

    // Gider kategorileri
    const { data: categories = [] } = useQuery({
        queryKey: ["expense-categories"],
        queryFn: async () => {
            const response = await api.get<ExpenseCategory[]>(
                "/expensecategories"
            );
            return response.data;
        },
    });

    // Rapor filtreleri
    const filters: ReportFilters = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        vehicleId: vehicleId ? Number(vehicleId) : undefined,
        familyMemberId: familyMemberId
            ? Number(familyMemberId)
            : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
    };

    // Rapor verileri
    const {
        data: report,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["report-overview", filters],
        queryFn: () => getReportOverview(filters),
    });

    const resetFilters = () => {
        setStartDate(firstDayOfMonth);
        setEndDate(today);
        setVehicleId("");
        setFamilyMemberId("");
        setCategoryId("");
        setActiveDateRange("thisMonth");
    };

    const applyQuickDateRange = (range: QuickDateRange) => {
        const dates = getDateRange(range);

        setStartDate(dates.start);
        setEndDate(dates.end);
        setActiveDateRange(range);
    };

    const sortedMembers = [...(report?.memberReservations ?? [])].sort(
        (a, b) => b.usageHours - a.usageHours
    );

    const rankedMembers = sortedMembers.map((member) => ({
        ...member,
        rank:
            sortedMembers.findIndex(
                (item) => item.usageHours === member.usageHours
            ) + 1,
    }));

    const apiError = error as {
        response?: {
            status?: number;
        };
    };

    const errorMessage =
        apiError?.response?.status === 403
            ? "Raporları görüntülemek için gerekli yetkiniz bulunmuyor."
            : "Rapor verileri yüklenirken bir hata oluştu.";

    return (
        <div className="min-h-full">
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#240046] via-[#5A189A] to-[#974CE0] p-7 text-white shadow-xl shadow-purple-900/10 sm:p-9"
                >
                    <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-24 right-1/3 h-52 w-52 rounded-full bg-[#E1FF00]/10 blur-2xl" />

                    <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-purple-100">
                                <span className="h-2 w-2 rounded-full bg-[#E1FF00]" />
                                AİLE GARAJI / ANALİZ MERKEZİ
                            </div>

                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Raporlar ve Analizler
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-purple-100 sm:text-base">
                                Araç kullanımını, aile giderlerini ve üyelerin
                                performansını tek ekrandan keşfet.
                            </p>
                        </div>

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-[#E1FF00] backdrop-blur">
                            <BarChart3 size={28} />
                        </div>
                    </div>

                    <div className="relative mt-7 flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm text-purple-100">
                            <CalendarRange size={16} />
                            {startDate} – {endDate}
                        </div>

                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm text-purple-100">
                            <Filter size={16} />
                            {[vehicleId, familyMemberId, categoryId].filter(Boolean).length} aktif ek filtre
                        </div>
                    </div>
                </motion.div>

                {/* Filters */}
                <motion.section
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.08 }}
                    className="mb-8 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6"
                >
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#5A189A]">
                                    <CalendarDays size={18} />
                                </div>

                                <h2 className="font-bold text-[#240046]">
                                    Rapor filtreleri
                                </h2>
                            </div>

                            <p className="mt-2 text-sm text-gray-500">
                                Sonuçları tarih, araç, üye veya gider kategorisine göre daralt.
                            </p>
                        </div>

                        <button
                            onClick={resetFilters}
                            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-purple-100 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-[#5A189A] transition hover:bg-purple-100 sm:self-auto"
                        >
                            <RotateCcw size={16} />
                            Filtreleri sıfırla
                        </button>
                    </div>

                    {/* Quick Date Filters */}
                    <div className="mb-5 flex flex-wrap gap-2">
                        {quickDateRanges.map((preset) => {
                            const active = activeDateRange === preset.value;

                            return (
                                <button
                                    key={preset.value}
                                    onClick={() => applyQuickDateRange(preset.value)}
                                    className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition duration-200 ${active
                                            ? "bg-[#5A189A] text-white shadow-sm shadow-purple-900/20"
                                            : "border border-gray-200 bg-white text-gray-600 hover:border-purple-200 hover:bg-purple-50 hover:text-[#5A189A]"
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        {/* Start Date */}
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Başlangıç tarihi
                            </label>

                            <input
                                type="date"
                                value={startDate}
                                max={endDate || undefined}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setActiveDateRange("custom");
                                }}
                                className={inputClassName}
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Bitiş tarihi
                            </label>

                            <input
                                type="date"
                                value={endDate}
                                min={startDate || undefined}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setActiveDateRange("custom");
                                }}
                                className={inputClassName}
                            />
                        </div>

                        {/* Vehicle */}
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Araç
                            </label>

                            <select
                                value={vehicleId}
                                onChange={(e) => setVehicleId(e.target.value)}
                                className={inputClassName}
                            >
                                <option value="">Tüm araçlar</option>

                                {vehicles.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.brand} {vehicle.model}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Family Member */}
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Aile üyesi
                            </label>

                            <select
                                value={familyMemberId}
                                onChange={(e) => setFamilyMemberId(e.target.value)}
                                className={inputClassName}
                            >
                                <option value="">Tüm üyeler</option>

                                {members.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.firstName} {member.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Gider kategorisi
                            </label>

                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className={inputClassName}
                            >
                                <option value="">Tüm kategoriler</option>

                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </motion.section>

                {/* Loading */}
                <AnimatePresence mode="wait">
                    {isLoading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-20 shadow-sm"
                        >
                            <Loader2
                                size={36}
                                className="animate-spin text-[#5A189A]"
                            />

                            <p className="mt-4 text-sm font-medium text-gray-500">
                                Raporlar hazırlanıyor...
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error */}
                {isError && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700"
                    >
                        {errorMessage}
                    </motion.div>
                )}

                {/* Report Content */}
                {report && !isLoading && !isError && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: {
                                transition: {
                                    staggerChildren: 0.07,
                                },
                            },
                        }}
                    >
                        {/* Section Heading */}
                        <motion.div
                            variants={cardVariants}
                            className="mb-5 flex items-center justify-between gap-3"
                        >
                            <div>
                                <h2 className="text-lg font-bold text-[#240046]">
                                    Genel bakış
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Seçilen tarih aralığının özeti
                                </p>
                            </div>

                            <div className="hidden items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-xs font-semibold text-[#5A189A] sm:flex">
                                <Sparkles size={15} />
                                Canlı rapor verileri
                            </div>
                        </motion.div>

                        {/* Summary Cards */}
                        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <SummaryCard
                                title="Toplam gider"
                                value={formatAmount(report.totalExpenseAmount)}
                                description={`${report.totalExpenseCount} gider kaydı`}
                                icon={<Wallet size={22} />}
                                accent="purple"
                            />

                            <SummaryCard
                                title="Rezervasyon"
                                value={String(report.totalReservationCount)}
                                description="İptal edilmeyen rezervasyon"
                                icon={<CalendarDays size={22} />}
                                accent="blue"
                            />

                            <SummaryCard
                                title="Aktif araç"
                                value={String(report.activeVehicleCount)}
                                description="Aileye ait aktif araç"
                                icon={<Car size={22} />}
                                accent="yellow"
                            />

                            <SummaryCard
                                title="Kullanım süresi"
                                value={formatDuration(report.totalUsageHours)}
                                description="Tamamlanan rezervasyonlar"
                                icon={<Clock size={22} />}
                                accent="pink"
                            />
                        </div>

                        {/* Member Usage Ranking */}
                        <motion.section
                            variants={cardVariants}
                            className="mb-8 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6"
                        >
                            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
                                            <Trophy size={21} />
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-[#240046]">
                                                Kullanım sıralaması
                                            </h3>
                                            <p className="mt-0.5 text-xs text-gray-500">
                                                Aile üyelerinin araç kullanım performansı
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <span className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-semibold text-[#5A189A]">
                                    {rankedMembers.length} üye
                                </span>
                            </div>

                            {rankedMembers.length > 0 ? (
                                <div className="space-y-3">
                                    {rankedMembers.map((member) => (
                                        <motion.div
                                            key={member.familyMemberId}
                                            variants={cardVariants}
                                            whileHover={{ x: 4 }}
                                            transition={{ duration: 0.2 }}
                                            className={`flex items-center gap-3 rounded-xl border p-4 transition sm:gap-4 ${member.rank === 1
                                                    ? "border-purple-200 bg-purple-50/80"
                                                    : "border-gray-100 bg-gray-50/70 hover:border-purple-100 hover:bg-purple-50/40"
                                                }`}
                                        >
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${member.rank === 1
                                                        ? "bg-[#E1FF00] text-[#240046]"
                                                        : member.rank === 2
                                                            ? "bg-gray-200 text-gray-700"
                                                            : member.rank === 3
                                                                ? "bg-orange-100 text-orange-700"
                                                                : "border border-gray-200 bg-white text-gray-500"
                                                    }`}
                                            >
                                                {member.rank === 1 ? (
                                                    <Trophy size={19} />
                                                ) : (
                                                    member.rank
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold text-[#240046]">
                                                    {member.memberName}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-500">
                                                    {member.completedReservationCount} tamamlanan rezervasyon
                                                </p>
                                            </div>

                                            <div className="shrink-0 text-right">
                                                <p className="text-sm font-bold text-[#5A189A] sm:text-base">
                                                    {formatDuration(member.usageHours)}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-400">
                                                    Kullanım süresi
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <ChartEmptyState />
                            )}
                        </motion.section>

                        {/* Expense Charts */}
                        <motion.div
                            variants={cardVariants}
                            className="mb-4 flex items-center gap-2"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#5A189A]">
                                <TrendingUp size={18} />
                            </div>

                            <div>
                                <h2 className="font-bold text-[#240046]">
                                    Gider analizleri
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Harcamaların detaylı dağılımı
                                </p>
                            </div>
                        </motion.div>

                        <div className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-2">

                            {/* Member Expenses */}
                            <ChartCard
                                title="Aile üyelerine göre giderler"
                                description="Her aile üyesinin ödediği toplam gider"
                                icon={<Users size={18} />}
                            >
                                {report.memberExpenses.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart
                                            data={report.memberExpenses}
                                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee8f5" />
                                            <XAxis dataKey="memberName" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} interval={0} />
                                            <YAxis
                                                tickFormatter={(value) => `${Number(value).toLocaleString("tr-TR")} ₺`}
                                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                formatter={(value) => formatChartAmount(Number(value))}
                                                contentStyle={{ borderRadius: 12, border: "1px solid #eee8f5" }}
                                            />
                                            <Bar dataKey="totalAmount" name="Toplam gider" radius={[7, 7, 0, 0]}>
                                                {report.memberExpenses.map((_, index) => (
                                                    <Cell key={`member-${index}`} fill={chartColors[index % chartColors.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmptyState />
                                )}
                            </ChartCard>

                            {/* Monthly Expenses */}
                            <ChartCard
                                title="Aylık gider trendi"
                                description="Aylara göre toplam gider değişimi"
                                icon={<TrendingUp size={18} />}
                            >
                                {report.monthlyExpenses.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <LineChart
                                            data={[...report.monthlyExpenses].sort(
                                                (a, b) => a.year - b.year || a.month - b.month
                                            )}
                                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee8f5" />
                                            <XAxis dataKey="monthName" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                                            <YAxis
                                                tickFormatter={(value) => `${Number(value).toLocaleString("tr-TR")} ₺`}
                                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                formatter={(value) => formatChartAmount(Number(value))}
                                                contentStyle={{ borderRadius: 12, border: "1px solid #eee8f5" }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="totalAmount"
                                                name="Toplam gider"
                                                stroke="#5A189A"
                                                strokeWidth={3}
                                                dot={{ r: 5, fill: "#974CE0", strokeWidth: 2, stroke: "#fff" }}
                                                activeDot={{ r: 7 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmptyState />
                                )}
                            </ChartCard>

                            {/* Category Expenses */}
                            <ChartCard
                                title="Gider kategorileri"
                                description="Giderlerin kategorilere göre dağılımı"
                                icon={<Receipt size={18} />}
                            >
                                {report.categoryExpenses.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <PieChart>
                                            <Pie
                                                data={report.categoryExpenses}
                                                dataKey="totalAmount"
                                                nameKey="categoryName"
                                                cx="50%"
                                                cy="45%"
                                                outerRadius={105}
                                                innerRadius={58}
                                                paddingAngle={3}
                                            >
                                                {report.categoryExpenses.map((_, index) => (
                                                    <Cell
                                                        key={`category-${index}`}
                                                        fill={chartColors[index % chartColors.length]}
                                                        stroke="white"
                                                        strokeWidth={2}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => formatChartAmount(Number(value))}
                                                contentStyle={{ borderRadius: 12, border: "1px solid #eee8f5" }}
                                            />
                                            <Legend verticalAlign="bottom" height={45} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmptyState />
                                )}
                            </ChartCard>

                            {/* Vehicle Expenses */}
                            <ChartCard
                                title="Araçlara göre giderler"
                                description="Araçların toplam gider karşılaştırması"
                                icon={<Car size={18} />}
                            >
                                {report.vehicleExpenses.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart
                                            data={report.vehicleExpenses}
                                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee8f5" />
                                            <XAxis dataKey="plateNumber" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                                            <YAxis
                                                tickFormatter={(value) => `${Number(value).toLocaleString("tr-TR")} ₺`}
                                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                formatter={(value) => formatChartAmount(Number(value))}
                                                labelFormatter={(label) => `Plaka: ${label}`}
                                                contentStyle={{ borderRadius: 12, border: "1px solid #eee8f5" }}
                                            />
                                            <Bar
                                                dataKey="totalAmount"
                                                name="Toplam gider"
                                                fill="#974CE0"
                                                radius={[7, 7, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmptyState />
                                )}
                            </ChartCard>
                        </div>

                        {/* Usage Section */}
                        <motion.div
                            variants={cardVariants}
                            className="mb-4 flex items-center gap-2"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#5A189A]">
                                <Clock size={18} />
                            </div>

                            <div>
                                <h2 className="font-bold text-[#240046]">
                                    Kullanım ve rezervasyon analizleri
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Aile üyelerinin araç kullanım istatistikleri
                                </p>
                            </div>
                        </motion.div>

                        <div className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-2">

                            {/* Member Usage */}
                            <ChartCard
                                title="Aile üyelerine göre araç kullanımı"
                                description="Üyelerin toplam araç kullanım süreleri"
                                icon={<Clock size={18} />}
                            >
                                {report.memberReservations.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart
                                            data={report.memberReservations}
                                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee8f5" />
                                            <XAxis dataKey="memberName" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} interval={0} />
                                            <YAxis
                                                tickFormatter={(value) => `${value} saat`}
                                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                formatter={(value) => `${Number(value).toFixed(2)} saat`}
                                                contentStyle={{ borderRadius: 12, border: "1px solid #eee8f5" }}
                                            />
                                            <Bar dataKey="usageHours" name="Kullanım süresi" radius={[7, 7, 0, 0]}>
                                                {report.memberReservations.map((_, index) => (
                                                    <Cell key={`usage-${index}`} fill={chartColors[index % chartColors.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmptyState />
                                )}
                            </ChartCard>


                            {/* Member Reservations */}
                            <ChartCard
                                title="Aile üyelerine göre rezervasyonlar"
                                description="Toplam, tamamlanan ve iptal edilen rezervasyon karşılaştırması"
                                icon={<CalendarDays size={18} />}
                            >
                                {report.memberReservations.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart
                                            data={report.memberReservations}
                                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                                            barGap={5}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="#eee8f5"
                                            />

                                            <XAxis
                                                dataKey="memberName"
                                                tick={{ fontSize: 12, fill: "#6b7280" }}
                                                axisLine={false}
                                                tickLine={false}
                                                interval={0}
                                            />

                                            <YAxis
                                                allowDecimals={false}
                                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />

                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: 12,
                                                    border: "1px solid #eee8f5",
                                                }}
                                            />

                                            <Legend />

                                            <Bar
                                                dataKey="reservationCount"
                                                name="Toplam rezervasyon"
                                                fill="#974CE0"
                                                radius={[5, 5, 0, 0]}
                                            />

                                            <Bar
                                                dataKey="completedReservationCount"
                                                name="Tamamlanan rezervasyon"
                                                fill="#0B6623"
                                                radius={[5, 5, 0, 0]}
                                            />

                                            <Bar
                                                dataKey="cancelledReservationCount"
                                                name="İptal edilen rezervasyon"
                                                fill="#EF4444"
                                                radius={[5, 5, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmptyState />
                                )}
                            </ChartCard>

                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}

function ChartCard({
    title,
    description,
    icon,
    children,
}: {
    title: string;
    description: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <motion.section
            variants={cardVariants}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg hover:shadow-purple-900/5 sm:p-6"
        >
            <div className="mb-5 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5A189A]">
                    {icon}
                </div>

                <div className="min-w-0">
                    <h3 className="font-bold text-[#240046]">
                        {title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                        {description}
                    </p>
                </div>
            </div>

            {children}
        </motion.section>
    );
}

function ChartEmptyState() {
    return (
        <div className="flex h-[320px] flex-col items-center justify-center rounded-xl bg-gray-50/70 text-gray-400">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                <BarChart3 size={28} className="opacity-50" />
            </div>

            <p className="text-sm font-medium text-gray-500">
                Henüz görüntülenecek veri yok
            </p>

            <p className="mt-1 text-xs text-gray-400">
                Farklı filtreler deneyebilirsiniz.
            </p>
        </div>
    );
}

function SummaryCard({
    title,
    value,
    description,
    icon,
    accent,
}: {
    title: string;
    value: string;
    description: string;
    icon: React.ReactNode;
    accent: "purple" | "blue" | "yellow" | "pink";
}) {
    const accentClasses = {
        purple: "bg-purple-50 text-[#5A189A]",
        blue: "bg-blue-50 text-blue-600",
        yellow: "bg-yellow-50 text-yellow-600",
        pink: "bg-pink-50 text-pink-600",
    };

    return (
        <motion.div
            variants={cardVariants}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg hover:shadow-purple-900/5"
        >
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-purple-50/60 blur-2xl" />

            <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500">
                        {title}
                    </p>

                    <h3 className="mt-3 break-words text-2xl font-bold tracking-tight text-[#240046]">
                        {value}
                    </h3>

                    <p className="mt-2 text-xs text-gray-400">
                        {description}
                    </p>
                </div>

                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentClasses[accent]}`}>
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}
