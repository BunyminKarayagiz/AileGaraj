
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    Building2,
    Users,
    Car,
    CalendarDays,
    Receipt,
    Tags,
    Search,
    Loader2,
    RefreshCw,
    MapPin,
    Clock,
    UserRound,
    Wallet,
    CheckCircle2,
    XCircle,
    AlertCircle,
} from "lucide-react";

import api from "../services/api";

type Tab =
    | "overview"
    | "members"
    | "vehicles"
    | "reservations"
    | "expenses"
    | "categories";

interface FamilyDetailResponse {
    family: {
        id: number;
        name: string;
        description: string | null;
        createdAt: string;
        updatedAt: string | null;
        isActive: boolean;
        deactivatedAt: string | null;
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
    };
    statistics: {
        members: { total: number; active: number; inactive: number };
        vehicles: { total: number; active: number; inactive: number };
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
        };
        categories: number;
    };
    members: {
        id: number;
        userId: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phoneNumber: string | null;
        role: string;
        joinedAt: string;
        isActive: boolean;
        leftAt: string | null;
    }[];
    vehicles: {
        id: number;
        brand: string;
        model: string;
        plateNumber: string;
        modelYear: number;
        currentMileage: number;
        fuelType: string;
        description: string | null;
        imageUrl: string | null;
        isActive: boolean;
        createdAt: string;
    }[];
    reservations: {
        id: number;
        vehicleId: number;
        vehicleName: string;
        plateNumber: string;
        familyMemberId: number;
        memberName: string;
        startDate: string;
        endDate: string;
        destination: string;
        description: string | null;
        status: string;
        createdAt: string;
        completedAt: string | null;
        cancelledAt: string | null;
    }[];
    expenses: {
        id: number;
        vehicleId: number;
        vehicleName: string;
        plateNumber: string;
        expenseCategoryId: number;
        categoryName: string;
        amount: number;
        expenseDate: string;
        description: string | null;
        createdBy: string;
        paidBy: string;
        isActive: boolean;
        createdAt: string;
    }[];
    categories: {
        id: number;
        name: string;
        createdAt: string;
        updatedAt: string | null;
        isActive: boolean;
        createdBy: string;
        expenseCount: number;
        totalAmount: number;
    }[];
}

const tabs: { id: Tab; label: string; icon: typeof Building2 }[] = [
    { id: "overview", label: "Genel Bakış", icon: Building2 },
    { id: "members", label: "Üyeler", icon: Users },
    { id: "vehicles", label: "Araçlar", icon: Car },
    { id: "reservations", label: "Rezervasyonlar", icon: CalendarDays },
    { id: "expenses", label: "Giderler", icon: Receipt },
    { id: "categories", label: "Kategoriler", icon: Tags },
];

const formatDate = (date?: string | null) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
};

const formatDateTime = (date?: string | null) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("tr-TR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatMoney = (amount: number) =>
    new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 2,
    }).format(amount);

function StatusBadge({
    active,
    activeText = "Aktif",
    inactiveText = "Pasif",
}: {
    active: boolean;
    activeText?: string;
    inactiveText?: string;
}) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-100 text-gray-500"
                }`}
        >
            {active ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            {active ? activeText : inactiveText}
        </span>
    );
}

function StatCard({
    title,
    value,
    detail,
    icon: Icon,
}: {
    title: string;
    value: string | number;
    detail: string;
    icon: typeof Building2;
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="mt-2 text-2xl font-bold text-[#240046]">
                        {value}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{detail}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3EAFE] text-[#5A189A]">
                    <Icon size={21} />
                </div>
            </div>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
            <Search className="mx-auto text-gray-300" size={30} />
            <p className="mt-3 text-sm font-medium text-gray-500">{text}</p>
        </div>
    );
}

export default function AdminFamilyDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [search, setSearch] = useState("");

    const {
        data,
        isLoading,
        isError,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ["admin-family-detail", id],
        queryFn: async () => {
            const response = await api.get<FamilyDetailResponse>(
                `/admin/families/${id}`
            );
            return response.data;
        },
        enabled: Boolean(id),
    });

    const filteredMembers = useMemo(
        () =>
            data?.members.filter((member) =>
                `${member.firstName} ${member.lastName} ${member.email ?? ""} ${member.role}`
                    .toLocaleLowerCase("tr-TR")
                    .includes(search.toLocaleLowerCase("tr-TR"))
            ) ?? [],
        [data, search]
    );

    const filteredVehicles = useMemo(
        () =>
            data?.vehicles.filter((vehicle) =>
                `${vehicle.brand} ${vehicle.model} ${vehicle.plateNumber}`
                    .toLocaleLowerCase("tr-TR")
                    .includes(search.toLocaleLowerCase("tr-TR"))
            ) ?? [],
        [data, search]
    );

    const filteredReservations = useMemo(
        () =>
            data?.reservations.filter((reservation) =>
                `${reservation.vehicleName} ${reservation.plateNumber} ${reservation.memberName} ${reservation.destination} ${reservation.status}`
                    .toLocaleLowerCase("tr-TR")
                    .includes(search.toLocaleLowerCase("tr-TR"))
            ) ?? [],
        [data, search]
    );

    const filteredExpenses = useMemo(
        () =>
            data?.expenses.filter((expense) =>
                `${expense.vehicleName} ${expense.plateNumber} ${expense.categoryName} ${expense.createdBy} ${expense.paidBy} ${expense.description ?? ""}`
                    .toLocaleLowerCase("tr-TR")
                    .includes(search.toLocaleLowerCase("tr-TR"))
            ) ?? [],
        [data, search]
    );

    const filteredCategories = useMemo(
        () =>
            data?.categories.filter((category) =>
                `${category.name} ${category.createdBy}`
                    .toLocaleLowerCase("tr-TR")
                    .includes(search.toLocaleLowerCase("tr-TR"))
            ) ?? [],
        [data, search]
    );

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto animate-spin text-[#5A189A]" size={34} />
                    <p className="mt-3 text-sm text-gray-500">
                        Aile bilgileri yükleniyor...
                    </p>
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="space-y-5">
                <button
                    onClick={() => navigate("/admin/families")}
                    className="flex items-center gap-2 text-sm font-semibold text-[#5A189A]"
                >
                    <ArrowLeft size={17} />
                    Aile listesine dön
                </button>

                <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
                    <AlertCircle className="mx-auto text-red-500" size={32} />
                    <h2 className="mt-3 font-bold text-red-800">
                        Aile bilgileri alınamadı
                    </h2>
                    <p className="mt-1 text-sm text-red-600">
                        Bir bağlantı hatası oluştu veya aile bulunamadı.
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="mt-5 rounded-xl bg-[#5A189A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#240046]"
                    >
                        Tekrar dene
                    </button>
                </div>
            </div>
        );
    }

    const { family, statistics } = data;

    const showSearch = activeTab !== "overview";

    return (
        <div className="space-y-6">
            {/* Geri dönüş */}
            <button
                onClick={() => navigate("/admin/families")}
                className="flex items-center gap-2 text-sm font-semibold text-[#5A189A] transition hover:text-[#974CE0]"
            >
                <ArrowLeft size={17} />
                Aile listesine dön
            </button>

            {/* Aile başlığı */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-[#240046] to-[#5A189A] p-6 text-white sm:p-8">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                                <Building2 size={28} />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-2xl font-bold">
                                        {family.name}
                                    </h1>
                                    <StatusBadge active={family.isActive} />
                                </div>
                                <p className="mt-1 text-sm text-purple-100">
                                    Aile ID: {family.id}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="flex items-center justify-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50 sm:self-auto"
                        >
                            <RefreshCw
                                size={16}
                                className={isFetching ? "animate-spin" : ""}
                            />
                            Yenile
                        </button>
                    </div>

                    {family.description && (
                        <p className="mt-5 max-w-3xl text-sm leading-6 text-purple-100">
                            {family.description}
                        </p>
                    )}
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-center gap-3">
                        <CalendarDays className="text-[#974CE0]" size={19} />
                        <div>
                            <p className="text-xs text-gray-400">Oluşturulma tarihi</p>
                            <p className="text-sm font-semibold text-gray-700">
                                {formatDate(family.createdAt)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <UserRound className="text-[#974CE0]" size={19} />
                        <div>
                            <p className="text-xs text-gray-400">Aileyi oluşturan</p>
                            <p className="text-sm font-semibold text-gray-700">
                                {family.createdBy
                                    ? `${family.createdBy.firstName} ${family.createdBy.lastName}`
                                    : "Bilinmiyor"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Wallet className="text-[#974CE0]" size={19} />
                        <div>
                            <p className="text-xs text-gray-400">Aktif gider toplamı</p>
                            <p className="text-sm font-semibold text-gray-700">
                                {formatMoney(statistics.expenses.activeAmount)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sekmeler */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
                <div className="flex min-w-max gap-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const selected = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setSearch("");
                                }}
                                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${selected
                                        ? "bg-[#5A189A] text-white shadow-sm"
                                        : "text-gray-500 hover:bg-[#F7F1FD] hover:text-[#5A189A]"
                                    }`}
                            >
                                <Icon size={17} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Arama */}
            {showSearch && (
                <div className="relative">
                    <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Bu bölümde ara..."
                        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#974CE0] focus:ring-2 focus:ring-[#974CE0]/10"
                    />
                </div>
            )}

            {/* Genel Bakış */}
            {activeTab === "overview" && (
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            title="Aile üyeleri"
                            value={statistics.members.total}
                            detail={`${statistics.members.active} aktif · ${statistics.members.inactive} ayrılmış`}
                            icon={Users}
                        />
                        <StatCard
                            title="Araçlar"
                            value={statistics.vehicles.total}
                            detail={`${statistics.vehicles.active} aktif · ${statistics.vehicles.inactive} pasif`}
                            icon={Car}
                        />
                        <StatCard
                            title="Rezervasyonlar"
                            value={statistics.reservations.total}
                            detail={`${statistics.reservations.reserved} devam eden`}
                            icon={CalendarDays}
                        />
                        <StatCard
                            title="Gider kayıtları"
                            value={statistics.expenses.total}
                            detail={`${statistics.expenses.active} aktif kayıt`}
                            icon={Receipt}
                        />
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <h2 className="font-bold text-[#240046]">
                                Rezervasyon durumu
                            </h2>
                            <div className="mt-5 space-y-4">
                                {[
                                    {
                                        label: "Rezerve",
                                        value: statistics.reservations.reserved,
                                        color: "bg-blue-500",
                                    },
                                    {
                                        label: "Tamamlandı",
                                        value: statistics.reservations.completed,
                                        color: "bg-emerald-500",
                                    },
                                    {
                                        label: "İptal edildi",
                                        value: statistics.reservations.cancelled,
                                        color: "bg-red-400",
                                    },
                                ].map((item) => {
                                    const total = statistics.reservations.total;
                                    const percent = total
                                        ? (item.value / total) * 100
                                        : 0;

                                    return (
                                        <div key={item.label}>
                                            <div className="mb-2 flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    {item.label}
                                                </span>
                                                <span className="font-bold text-[#240046]">
                                                    {item.value}
                                                </span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                                <div
                                                    className={`h-full rounded-full ${item.color}`}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <h2 className="font-bold text-[#240046]">
                                Gider özeti
                            </h2>
                            <div className="mt-5 space-y-4">
                                <div className="rounded-xl bg-[#F7F1FD] p-4">
                                    <p className="text-sm text-gray-500">
                                        Aktif gider tutarı
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-[#5A189A]">
                                        {formatMoney(statistics.expenses.activeAmount)}
                                    </p>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-3 text-sm">
                                    <span className="text-gray-500">Aktif gider</span>
                                    <span className="font-semibold text-emerald-600">
                                        {statistics.expenses.active}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-3 text-sm">
                                    <span className="text-gray-500">Pasif gider</span>
                                    <span className="font-semibold text-gray-600">
                                        {statistics.expenses.inactive}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Kategori sayısı</span>
                                    <span className="font-semibold text-[#240046]">
                                        {statistics.categories}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Üyeler */}
            {activeTab === "members" && (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 p-5">
                        <h2 className="font-bold text-[#240046]">Aile üyeleri</h2>
                        <p className="mt-1 text-xs text-gray-400">
                            Aktif üyeler ve aileden ayrılmış kullanıcılar
                        </p>
                    </div>
                    {filteredMembers.length === 0 ? (
                        <EmptyState text="Aramanızla eşleşen üye bulunamadı." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[750px] text-left text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-500">
                                    <tr>
                                        <th className="px-5 py-4">Üye</th>
                                        <th className="px-5 py-4">İletişim</th>
                                        <th className="px-5 py-4">Rol</th>
                                        <th className="px-5 py-4">Katılma tarihi</th>
                                        <th className="px-5 py-4">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50/70">
                                            <td className="px-5 py-4 font-semibold text-gray-800">
                                                {member.firstName} {member.lastName}
                                            </td>
                                            <td className="px-5 py-4 text-gray-500">
                                                <div>{member.email || "-"}</div>
                                                <div className="mt-1 text-xs">
                                                    {member.phoneNumber || "-"}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                {member.role}
                                            </td>
                                            <td className="px-5 py-4 text-gray-500">
                                                {formatDate(member.joinedAt)}
                                                {member.leftAt && (
                                                    <div className="mt-1 text-xs text-red-500">
                                                        Ayrıldı: {formatDate(member.leftAt)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge active={member.isActive} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Araçlar */}
            {activeTab === "vehicles" && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredVehicles.map((vehicle) => (
                        <div
                            key={vehicle.id}
                            className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
                        >
                            {vehicle.imageUrl ? (
                                <img
                                    src={vehicle.imageUrl}
                                    alt={`${vehicle.brand} ${vehicle.model}`}
                                    className="h-40 w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-40 items-center justify-center bg-[#F7F1FD] text-[#974CE0]">
                                    <Car size={45} />
                                </div>
                            )}
                            <div className="space-y-3 p-5">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-bold text-[#240046]">
                                            {vehicle.brand} {vehicle.model}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {vehicle.modelYear}
                                        </p>
                                    </div>
                                    <StatusBadge active={vehicle.isActive} />
                                </div>
                                <div className="rounded-lg bg-gray-50 px-3 py-2 text-center font-bold tracking-wider text-[#5A189A]">
                                    {vehicle.plateNumber}
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                                    <div>
                                        <p>Yakıt tipi</p>
                                        <p className="mt-1 font-semibold text-gray-700">
                                            {vehicle.fuelType}
                                        </p>
                                    </div>
                                    <div>
                                        <p>Kilometre</p>
                                        <p className="mt-1 font-semibold text-gray-700">
                                            {vehicle.currentMileage.toLocaleString("tr-TR")} km
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredVehicles.length === 0 && (
                        <div className="md:col-span-2 xl:col-span-3">
                            <EmptyState text="Aramanızla eşleşen araç bulunamadı." />
                        </div>
                    )}
                </div>
            )}

            {/* Rezervasyonlar */}
            {activeTab === "reservations" && (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 p-5">
                        <h2 className="font-bold text-[#240046]">Rezervasyon geçmişi</h2>
                    </div>
                    {filteredReservations.length === 0 ? (
                        <EmptyState text="Aramanızla eşleşen rezervasyon bulunamadı." />
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredReservations.map((reservation) => (
                                <div
                                    key={reservation.id}
                                    className="flex flex-col justify-between gap-4 p-5 transition hover:bg-gray-50/70 lg:flex-row lg:items-center"
                                >
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-bold text-[#240046]">
                                                {reservation.vehicleName}
                                            </h3>
                                            <span className="rounded-md bg-[#F3EAFE] px-2 py-1 text-xs font-semibold text-[#5A189A]">
                                                {reservation.plateNumber}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            <UserRound className="mr-1 inline" size={14} />
                                            {reservation.memberName}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            <MapPin className="mr-1 inline" size={14} />
                                            {reservation.destination}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-5">
                                        <div className="text-sm text-gray-500">
                                            <p>
                                                <Clock className="mr-1 inline" size={14} />
                                                {formatDateTime(reservation.startDate)}
                                            </p>
                                            <p className="mt-1">
                                                Bitiş: {formatDateTime(reservation.endDate)}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${reservation.status === "Reserved"
                                                    ? "bg-blue-50 text-blue-700"
                                                    : reservation.status === "Completed"
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-red-50 text-red-600"
                                                }`}
                                        >
                                            {reservation.status === "Reserved"
                                                ? "Rezerve"
                                                : reservation.status === "Completed"
                                                    ? "Tamamlandı"
                                                    : "İptal"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Giderler */}
            {activeTab === "expenses" && (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 p-5">
                        <h2 className="font-bold text-[#240046]">Gider kayıtları</h2>
                    </div>
                    {filteredExpenses.length === 0 ? (
                        <EmptyState text="Aramanızla eşleşen gider bulunamadı." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-500">
                                    <tr>
                                        <th className="px-5 py-4">Gider</th>
                                        <th className="px-5 py-4">Araç</th>
                                        <th className="px-5 py-4">Oluşturan / Ödeyen</th>
                                        <th className="px-5 py-4">Tarih</th>
                                        <th className="px-5 py-4">Tutar</th>
                                        <th className="px-5 py-4">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredExpenses.map((expense) => (
                                        <tr key={expense.id} className="hover:bg-gray-50/70">
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-gray-800">
                                                    {expense.categoryName}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    {expense.description || "Açıklama yok"}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                {expense.vehicleName}
                                                <p className="mt-1 text-xs text-gray-400">
                                                    {expense.plateNumber}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                <p>{expense.createdBy}</p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Ödeyen: {expense.paidBy}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-gray-500">
                                                {formatDate(expense.expenseDate)}
                                            </td>
                                            <td className="px-5 py-4 font-bold text-[#5A189A]">
                                                {formatMoney(expense.amount)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge active={expense.isActive} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Kategoriler */}
            {activeTab === "categories" && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredCategories.map((category) => (
                        <div
                            key={category.id}
                            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3EAFE] text-[#5A189A]">
                                    <Tags size={21} />
                                </div>
                                <StatusBadge active={category.isActive} />
                            </div>
                            <h3 className="mt-4 font-bold text-[#240046]">
                                {category.name}
                            </h3>
                            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Aktif gider sayısı</span>
                                    <span className="font-semibold text-gray-700">
                                        {category.expenseCount}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Toplam tutar</span>
                                    <span className="font-bold text-[#5A189A]">
                                        {formatMoney(category.totalAmount)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Oluşturan: {category.createdBy}</span>
                                    <span>{formatDate(category.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredCategories.length === 0 && (
                        <div className="sm:col-span-2 xl:col-span-3">
                            <EmptyState text="Aramanızla eşleşen kategori bulunamadı." />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
