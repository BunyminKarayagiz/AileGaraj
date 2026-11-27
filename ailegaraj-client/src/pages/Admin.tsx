
import { useQuery } from "@tanstack/react-query";
import {
    Users,
    Building2,
    Car,
    CalendarDays,
    Receipt,
    TrendingUp,
    UserCheck,
    UserX,
    Loader2,
    AlertCircle,
    Clock,
    CheckCircle2,
    XCircle,
} from "lucide-react";

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

import api from "../services/api";

interface AdminDashboardResponse {
    statistics: {
        users: {
            total: number;
            active: number;
            inactive: number;
        };
        families: {
            total: number;
            active: number;
            inactive: number;
        };
        vehicles: {
            total: number;
            active: number;
            inactive: number;
        };
        reservations: {
            total: number;
            reserved: number;
            completed: number;
            cancelled: number;
        };
        expenses: {
            total: number;
            active: number;
            inactive: number;
            activeAmount: number;
            inactiveAmount: number;
            categoryDistribution: {
                categoryName: string;
                count: number;
                totalAmount: number;
            }[];
        };
    };
    latestUsers: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        createdAt: string;
        isActive: boolean;
    }[];
    latestFamilies: {
        id: number;
        name: string;
        createdAt: string;
        isActive: boolean;
    }[];
}

const formatNumber = (value: number) =>
    new Intl.NumberFormat("tr-TR").format(value);

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 2,
    }).format(value);

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

function StatCard({
    title,
    total,
    active,
    inactive,
    icon: Icon,
}: {
    title: string;
    total: number;
    active: number;
    inactive: number;
    icon: typeof Users;
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3EAFE] text-[#5A189A]">
                    <Icon size={21} />
                </div>
                <span className="text-xs font-medium text-gray-400">
                    Genel Durum
                </span>
            </div>

            <p className="mt-5 text-sm font-medium text-gray-500">{title}</p>
            <h3 className="mt-1 text-3xl font-bold text-[#240046]">
                {formatNumber(total)}
            </h3>

            <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Aktif: {formatNumber(active)}
                </span>
                <span className="flex items-center gap-1.5 text-red-500">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    Pasif: {formatNumber(inactive)}
                </span>
            </div>
        </div>
    );
}

function SectionTitle({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div>
            <h2 className="text-lg font-bold text-[#240046]">{title}</h2>
            <p className="mt-1 text-sm text-gray-400">{description}</p>
        </div>
    );
}

export default function Admin() {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-dashboard"],
        queryFn: async () => {
            const response = await api.get<AdminDashboardResponse>(
                "/admin/dashboard"
            );
            return response.data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto animate-spin text-[#5A189A]" size={36} />
                    <p className="mt-3 text-sm text-gray-500">
                        Yönetim paneli yükleniyor...
                    </p>
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                <AlertCircle size={40} className="text-red-400" />
                <h2 className="mt-4 text-lg font-semibold text-gray-800">
                    Veriler yüklenemedi
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Dashboard bilgileri alınırken bir hata oluştu.
                </p>
                <button
                    onClick={() => refetch()}
                    className="mt-4 rounded-xl bg-[#5A189A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#240046]"
                >
                    Tekrar Dene
                </button>
            </div>
        );
    }

    const stats = data.statistics;

    const reservationData = [
        { name: "Rezerve", value: stats.reservations.reserved, color: "#974CE0" },
        { name: "Tamamlandı", value: stats.reservations.completed, color: "#16A34A" },
        { name: "İptal", value: stats.reservations.cancelled, color: "#EF4444" },
    ];

    const expenseStatusData = [
        { name: "Aktif", value: stats.expenses.active, color: "#974CE0" },
        { name: "Pasif", value: stats.expenses.inactive, color: "#D1D5DB" },
    ];

    const expenseCategoryData = stats.expenses.categoryDistribution.map((item) => ({
        name: item.categoryName,
        tutar: item.totalAmount,
    }));

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-[#F3EAFE] p-2 text-[#5A189A]">
                            <TrendingUp size={20} />
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#974CE0]">
                            SuperAdmin
                        </span>
                    </div>
                    <h1 className="mt-3 text-2xl font-bold text-[#240046] sm:text-3xl">
                        Yönetim Paneli
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        AileGaraj platformunun genel durumunu buradan takip edebilirsin.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-xs text-gray-500 shadow-sm sm:self-auto">
                    <Clock size={15} className="text-[#974CE0]" />
                    Güncel platform istatistikleri
                </div>
            </div>

            {/* User statistics */}
            <section className="space-y-4">
                <SectionTitle
                    title="Kullanıcılar"
                    description="Platforma kayıtlı kullanıcıların genel durumu"
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <StatCard
                        title="Toplam Kullanıcı"
                        total={stats.users.total}
                        active={stats.users.active}
                        inactive={stats.users.inactive}
                        icon={Users}
                    />
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <UserCheck size={21} />
                        </div>
                        <p className="mt-5 text-sm text-gray-500">Aktif Kullanıcı</p>
                        <h3 className="mt-1 text-3xl font-bold text-[#240046]">
                            {formatNumber(stats.users.active)}
                        </h3>
                        <p className="mt-2 text-xs text-emerald-600">
                            Platformu kullanabilen hesaplar
                        </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
                            <UserX size={21} />
                        </div>
                        <p className="mt-5 text-sm text-gray-500">Pasif Kullanıcı</p>
                        <h3 className="mt-1 text-3xl font-bold text-[#240046]">
                            {formatNumber(stats.users.inactive)}
                        </h3>
                        <p className="mt-2 text-xs text-red-500">
                            Devre dışı bırakılmış hesaplar
                        </p>
                    </div>
                </div>
            </section>

            {/* Family and vehicle statistics */}
            <section className="space-y-4">
                <SectionTitle
                    title="Aile ve Araç Yönetimi"
                    description="Platformdaki aile ve araç kayıtlarının durumu"
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <StatCard
                        title="Aileler"
                        total={stats.families.total}
                        active={stats.families.active}
                        inactive={stats.families.inactive}
                        icon={Building2}
                    />
                    <StatCard
                        title="Araçlar"
                        total={stats.vehicles.total}
                        active={stats.vehicles.active}
                        inactive={stats.vehicles.inactive}
                        icon={Car}
                    />
                </div>
            </section>

            {/* Reservation statistics */}
            <section className="space-y-4">
                <SectionTitle
                    title="Rezervasyon İstatistikleri"
                    description="Rezervasyonların durumlarına göre dağılımı"
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-1">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-[#F3EAFE] p-3 text-[#5A189A]">
                                <CalendarDays size={22} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Toplam Rezervasyon</p>
                                <h3 className="text-3xl font-bold text-[#240046]">
                                    {formatNumber(stats.reservations.total)}
                                </h3>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            {reservationData.map((item) => (
                                <div key={item.name}>
                                    <div className="mb-1.5 flex justify-between text-sm">
                                        <span className="text-gray-500">{item.name}</span>
                                        <span className="font-semibold text-[#240046]">
                                            {formatNumber(item.value)}
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${stats.reservations.total > 0
                                                    ? (item.value / stats.reservations.total) * 100
                                                    : 0}%`,
                                                backgroundColor: item.color,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
                        <h3 className="font-semibold text-[#240046]">
                            Rezervasyon Durum Dağılımı
                        </h3>

                        <div className="mt-2 h-64">
                            {stats.reservations.total === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                    Henüz rezervasyon kaydı bulunmuyor.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={reservationData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={95}
                                            paddingAngle={4}
                                        >
                                            {reservationData.map((entry) => (
                                                <Cell key={entry.name} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => formatNumber(Number(value))}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="flex flex-wrap justify-center gap-5 text-xs">
                            {reservationData.map((item) => (
                                <span key={item.name} className="flex items-center gap-2 text-gray-500">
                                    <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    {item.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Expense statistics */}
            <section className="space-y-4">
                <SectionTitle
                    title="Gider İstatistikleri"
                    description="Gider kayıtları, tutarları ve kategori dağılımları"
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3EAFE] text-[#5A189A]">
                            <Receipt size={21} />
                        </div>
                        <p className="mt-5 text-sm text-gray-500">Toplam Gider Kaydı</p>
                        <h3 className="mt-1 text-3xl font-bold text-[#240046]">
                            {formatNumber(stats.expenses.total)}
                        </h3>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <CheckCircle2 size={21} />
                        </div>
                        <p className="mt-5 text-sm text-gray-500">Aktif Gider</p>
                        <h3 className="mt-1 text-2xl font-bold text-[#240046]">
                            {formatNumber(stats.expenses.active)}
                        </h3>
                        <p className="mt-2 text-xs text-emerald-600">
                            {formatCurrency(stats.expenses.activeAmount)}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
                            <XCircle size={21} />
                        </div>
                        <p className="mt-5 text-sm text-gray-500">Pasif Gider</p>
                        <h3 className="mt-1 text-2xl font-bold text-[#240046]">
                            {formatNumber(stats.expenses.inactive)}
                        </h3>
                        <p className="mt-2 text-xs text-red-500">
                            {formatCurrency(stats.expenses.inactiveAmount)}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700">
                            <TrendingUp size={21} />
                        </div>
                        <p className="mt-5 text-sm text-gray-500">Aktif Gider Tutarı</p>
                        <h3 className="mt-1 text-xl font-bold text-[#240046]">
                            {formatCurrency(stats.expenses.activeAmount)}
                        </h3>
                        <p className="mt-2 text-xs text-gray-400">
                            Yalnızca aktif giderler
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 className="font-semibold text-[#240046]">
                            Aktif / Pasif Gider Dağılımı
                        </h3>

                        <div className="mt-3 h-64">
                            {stats.expenses.total === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                    Henüz gider kaydı bulunmuyor.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expenseStatusData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={4}
                                        >
                                            {expenseStatusData.map((entry) => (
                                                <Cell key={entry.name} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => formatNumber(Number(value))}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div className="flex justify-center gap-6 text-xs text-gray-500">
                            {expenseStatusData.map((item) => (
                                <span key={item.name} className="flex items-center gap-2">
                                    <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    {item.name}: {formatNumber(item.value)}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 className="font-semibold text-[#240046]">
                            Kategorilere Göre Gider Tutarı
                        </h3>

                        <div className="mt-3 h-64">
                            {expenseCategoryData.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                    Kategori verisi bulunmuyor.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={expenseCategoryData}
                                        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            formatter={(value) => formatCurrency(Number(value))}
                                        />
                                        <Bar
                                            dataKey="tutar"
                                            name="Gider Tutarı"
                                            fill="#974CE0"
                                            radius={[6, 6, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Latest records */}
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-[#240046]">Son Kayıt Olan Kullanıcılar</h3>
                            <p className="mt-1 text-xs text-gray-400">
                                Platforma en son katılan hesaplar
                            </p>
                        </div>
                        <Users className="text-[#974CE0]" size={21} />
                    </div>

                    {data.latestUsers.length === 0 ? (
                        <p className="py-8 text-center text-sm text-gray-400">
                            Henüz kullanıcı bulunmuyor.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {data.latestUsers.map((user) => (
                                <div key={user.id} className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3EAFE] text-sm font-bold text-[#5A189A]">
                                        {user.firstName?.charAt(0)}
                                        {user.lastName?.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-gray-800">
                                            {user.firstName} {user.lastName}
                                        </p>
                                        <p className="truncate text-xs text-gray-400">
                                            {user.email}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${user.isActive
                                                ? "bg-emerald-50 text-emerald-600"
                                                : "bg-red-50 text-red-500"
                                            }`}>
                                            {user.isActive ? "Aktif" : "Pasif"}
                                        </span>
                                        <p className="mt-1 text-[10px] text-gray-400">
                                            {formatDate(user.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-[#240046]">Son Oluşturulan Aileler</h3>
                            <p className="mt-1 text-xs text-gray-400">
                                Platformdaki son aile kayıtları
                            </p>
                        </div>
                        <Building2 className="text-[#974CE0]" size={21} />
                    </div>

                    {data.latestFamilies.length === 0 ? (
                        <p className="py-8 text-center text-sm text-gray-400">
                            Henüz aile bulunmuyor.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {data.latestFamilies.map((family) => (
                                <div key={family.id} className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3EAFE] text-[#5A189A]">
                                        <Building2 size={19} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-gray-800">
                                            {family.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {formatDate(family.createdAt)}
                                        </p>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${family.isActive
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-red-50 text-red-500"
                                        }`}>
                                        {family.isActive ? "Aktif" : "Pasif"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
