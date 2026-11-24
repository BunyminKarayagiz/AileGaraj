
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    BarChart3,
    Receipt,
    CalendarDays,
    Car,
    Clock,
    Loader2,
    RotateCcw,
    Trophy,
} from "lucide-react";

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

export default function Reports() {
    const navigate = useNavigate();

    const today = getLocalDate(new Date());

    const firstDayOfMonth = getLocalDate(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );

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
    };

    const rankedMembers = [...(report?.memberReservations ?? [])]
        .sort((a, b) => b.usageHours - a.usageHours)
        .reduce(
            (result, member, index) => {
                const previous = result[index - 1];

                const rank =
                    previous && previous.usageHours === member.usageHours
                        ? previous.rank
                        : index + 1;

                result.push({
                    ...member,
                    rank,
                });

                return result;
            },
            [] as Array<
                (typeof report.memberReservations)[number] & {
                    rank: number;
                }
            >
        );

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
        <div className="min-h-screen bg-[#f8f7fa]">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="p-2 rounded-lg hover:bg-gray-100 transition"
                        >
                            <ArrowLeft size={21} />
                        </button>

                        <div>
                            <h1 className="text-xl font-bold text-[#240046]">
                                AileGaraj
                            </h1>
                            <p className="text-sm text-gray-500">
                                Raporlama ve Analiz
                            </p>
                        </div>
                    </div>

                    <BarChart3 size={25} className="text-[#5A189A]" />
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Page Title */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-[#240046]">
                        Raporlar
                    </h2>
                    <p className="text-gray-500 mt-1">
                        Ailenizin araç giderlerini ve kullanım istatistiklerini
                        inceleyin.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-8">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-semibold text-[#240046]">
                            Rapor Filtreleri
                        </h3>

                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-2 text-sm text-[#5A189A] hover:underline"
                        >
                            <RotateCcw size={16} />
                            Filtreleri Sıfırla
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Başlangıç Tarihi
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                max={endDate || undefined}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-[#5A189A]"
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bitiş Tarihi
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                min={startDate || undefined}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-[#5A189A]"
                            />
                        </div>

                        {/* Vehicle */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Araç
                            </label>
                            <select
                                value={vehicleId}
                                onChange={(e) => setVehicleId(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-[#5A189A]"
                            >
                                <option value="">Tüm Araçlar</option>
                                {vehicles.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.brand} {vehicle.model}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Family Member */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Aile Üyesi
                            </label>
                            <select
                                value={familyMemberId}
                                onChange={(e) =>
                                    setFamilyMemberId(e.target.value)
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-[#5A189A]"
                            >
                                <option value="">Tüm Üyeler</option>
                                {members.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.firstName} {member.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gider Kategorisi
                            </label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-[#5A189A]"
                            >
                                <option value="">Tüm Kategoriler</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex justify-center py-20">
                        <Loader2
                            size={34}
                            className="animate-spin text-[#5A189A]"
                        />
                    </div>
                )}

                {/* Error */}
                {isError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700">
                        {errorMessage}
                    </div>
                )}

                {/* Report Content */}
                {report && !isLoading && !isError && (
                    <>

                        {/* Member Usage Ranking */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
                            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Trophy className="text-[#974CE0]" size={22} />
                                        <h3 className="font-semibold text-[#240046]">
                                            Aile Üyeleri Kullanım Sıralaması
                                        </h3>
                                    </div>

                                    <p className="text-sm text-gray-500 mt-1">
                                        Seçilen tarih aralığındaki araç kullanım sürelerine göre
                                        sıralama
                                    </p>
                                </div>

                                <span className="text-xs bg-purple-50 text-[#5A189A] px-3 py-2 rounded-lg">
                                    {rankedMembers.length} Üye
                                </span>
                            </div>

                            {rankedMembers.length > 0 ? (
                                <div className="space-y-3">
                                    {rankedMembers.map((member) => (
                                        <div
                                            key={member.familyMemberId}
                                            className={`flex items-center gap-4 p-4 rounded-xl border transition ${member.rank === 1
                                                    ? "bg-purple-50 border-purple-200"
                                                    : "bg-gray-50 border-gray-100"
                                                }`}
                                        >
                                            {/* Rank */}
                                            <div
                                                className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center font-bold text-lg ${member.rank === 1
                                                        ? "bg-[#E1FF00] text-[#240046]"
                                                        : member.rank === 2
                                                            ? "bg-gray-200 text-gray-700"
                                                            : member.rank === 3
                                                                ? "bg-orange-100 text-orange-700"
                                                                : "bg-white text-gray-500 border border-gray-200"
                                                    }`}
                                            >
                                                {member.rank}
                                            </div>

                                            {/* Member Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-[#240046] truncate">
                                                    {member.memberName}
                                                </p>

                                                <p className="text-xs text-gray-500 mt-1">
                                                    {member.completedReservationCount} tamamlanan
                                                    rezervasyon
                                                </p>
                                            </div>

                                            {/* Usage Duration */}
                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-[#5A189A]">
                                                    {formatDuration(member.usageHours)}
                                                </p>

                                                <p className="text-xs text-gray-400 mt-1">
                                                    Kullanım süresi
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <ChartEmptyState />
                            )}
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                            <SummaryCard
                                title="Toplam Gider"
                                value={formatAmount(report.totalExpenseAmount)}
                                description={`${report.totalExpenseCount} gider kaydı`}
                                icon={<Receipt size={23} />}
                            />

                            <SummaryCard
                                title="Rezervasyon"
                                value={String(report.totalReservationCount)}
                                description="İptal edilmeyen rezervasyon"
                                icon={<CalendarDays size={23} />}
                            />

                            <SummaryCard
                                title="Aktif Araç"
                                value={String(report.activeVehicleCount)}
                                description="Aileye ait aktif araç"
                                icon={<Car size={23} />}
                            />

                            <SummaryCard
                                title="Kullanım Süresi"
                                value={formatDuration(report.totalUsageHours)}
                                description="Tamamlanan rezervasyonlar"
                                icon={<Clock size={23} />}
                            />
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

                            {/* 1. Aile Üyelerine Göre Giderler */}
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <div className="mb-6">
                                    <h3 className="font-semibold text-[#240046]">
                                        Aile Üyelerine Göre Giderler
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Her aile üyesinin ödediği toplam gider
                                    </p>
                                </div>

                                {report.memberExpenses.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart
                                            data={report.memberExpenses}
                                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="memberName"
                                                tick={{ fontSize: 12 }}
                                                interval={0}
                                            />
                                            <YAxis
                                                tickFormatter={(value) =>
                                                    `${Number(value).toLocaleString("tr-TR")} ₺`
                                                }
                                                tick={{ fontSize: 11 }}
                                            />
                                            <Tooltip
                                                formatter={(value) =>
                                                    formatChartAmount(Number(value))
                                                }
                                            />
                                            <Bar
                                                dataKey="totalAmount"
                                                name="Toplam Gider"
                                                radius={[6, 6, 0, 0]}
                                            >
                                                {report.memberExpenses.map((_, index) => (
                                                    <Cell
                                                        key={`member-${index}`}
                                                        fill={chartColors[index % chartColors.length]}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmptyState />
                                )}
                            </div>

                            {/* 2. Aylık Gider Grafiği */}
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <div className="mb-6">
                                    <h3 className="font-semibold text-[#240046]">
                                        Aylık Gider Trendi
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Aylara göre toplam gider değişimi
                                    </p>
                                </div>

                                {report.monthlyExpenses.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <LineChart
                                            data={[...report.monthlyExpenses].sort(
                                                (a, b) =>
                                                    a.year - b.year || a.month - b.month
                                            )}
                                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="monthName"
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis
                                                tickFormatter={(value) =>
                                                    `${Number(value).toLocaleString("tr-TR")} ₺`
                                                }
                                                tick={{ fontSize: 11 }}
                                            />
                                            <Tooltip
                                                formatter={(value) =>
                                                    formatChartAmount(Number(value))
                                                }
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="totalAmount"
                                                name="Toplam Gider"
                                                stroke="#5A189A"
                                                strokeWidth={3}
                                                dot={{ r: 5, fill: "#974CE0" }}
                                                activeDot={{ r: 7 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmptyState />
                                )}
                            </div>

                            {/* 3. Kategori Dağılımı */}
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <div className="mb-6">
                                    <h3 className="font-semibold text-[#240046]">
                                        Gider Kategorileri
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Giderlerin kategorilere göre dağılımı
                                    </p>
                                </div>

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
                                                paddingAngle={3}
                                            >
                                                {report.categoryExpenses.map((_, index) => (
                                                    <Cell
                                                        key={`category-${index}`}
                                                        fill={chartColors[index % chartColors.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) =>
                                                    formatChartAmount(Number(value))
                                                }
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={45}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmptyState />
                                )}
                            </div>

                            {/* 4. Araçlara Göre Giderler */}
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <div className="mb-6">
                                    <h3 className="font-semibold text-[#240046]">
                                        Araçlara Göre Giderler
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Araçların toplam gider karşılaştırması
                                    </p>
                                </div>

                                {report.vehicleExpenses.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart
                                            data={report.vehicleExpenses}
                                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="plateNumber"
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis
                                                tickFormatter={(value) =>
                                                    `${Number(value).toLocaleString("tr-TR")} ₺`
                                                }
                                                tick={{ fontSize: 11 }}
                                            />
                                            <Tooltip
                                                formatter={(value) =>
                                                    formatChartAmount(Number(value))
                                                }
                                                labelFormatter={(label) => `Plaka: ${label}`}
                                            />
                                            <Bar
                                                dataKey="totalAmount"
                                                name="Toplam Gider"
                                                fill="#974CE0"
                                                radius={[6, 6, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmptyState />
                                )}
                            </div>
                        </div>

                        {/* Usage and Reservation Charts */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

                            {/* Aile Üyelerine Göre Kullanım Süresi */}
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <div className="mb-6">
                                    <h3 className="font-semibold text-[#240046]">
                                        Aile Üyelerine Göre Araç Kullanımı
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Üyelerin toplam araç kullanım süreleri
                                    </p>
                                </div>

                                {report.memberReservations.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart
                                            data={report.memberReservations}
                                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="memberName"
                                                tick={{ fontSize: 12 }}
                                                interval={0}
                                            />
                                            <YAxis
                                                tickFormatter={(value) => `${value} saat`}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <Tooltip
                                                formatter={(value) =>
                                                    `${Number(value).toFixed(2)} saat`
                                                }
                                            />
                                            <Bar
                                                dataKey="usageHours"
                                                name="Kullanım Süresi"
                                                radius={[6, 6, 0, 0]}
                                            >
                                                {report.memberReservations.map((_, index) => (
                                                    <Cell
                                                        key={`usage-${index}`}
                                                        fill={chartColors[index % chartColors.length]}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmptyState />
                                )}
                            </div>

                            {/* Aile Üyelerine Göre Rezervasyon Sayıları */}
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <div className="mb-6">
                                    <h3 className="font-semibold text-[#240046]">
                                        Aile Üyelerine Göre Rezervasyonlar
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Toplam ve tamamlanan rezervasyon karşılaştırması
                                    </p>
                                </div>

                                {report.memberReservations.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart
                                            data={report.memberReservations}
                                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="memberName"
                                                tick={{ fontSize: 12 }}
                                                interval={0}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <Tooltip />
                                            <Legend />

                                            <Bar
                                                dataKey="reservationCount"
                                                name="Toplam Rezervasyon"
                                                fill="#974CE0"
                                                radius={[5, 5, 0, 0]}
                                            />

                                            <Bar
                                                dataKey="completedReservationCount"
                                                name="Tamamlanan Rezervasyon"
                                                fill="#5A189A"
                                                radius={[5, 5, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmptyState />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

function ChartEmptyState() {
    return (
        <div className="h-[320px] flex flex-col items-center justify-center text-gray-400">
            <BarChart3 size={36} className="mb-3 opacity-50" />
            <p className="text-sm">
                Bu filtrelere uygun veri bulunamadı.
            </p>
        </div>
    );
}

function SummaryCard({
    title,
    value,
    description,
    icon,
}: {
    title: string;
    value: string;
    description: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-500">{title}</p>

                <div className="p-3 rounded-xl bg-purple-50 text-[#5A189A]">
                    {icon}
                </div>
            </div>

            <h3 className="text-2xl font-bold text-[#240046] break-words">
                {value}
            </h3>

            <p className="text-xs text-gray-400 mt-2">{description}</p>
        </div>
    );
}
