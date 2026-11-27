import { useMemo, useState } from "react";
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    Clock,
    Car,
    Loader2,
    X,
    ChartGantt,
    Plus,
    Pencil,
    Trash2,
    Save,
    CheckCircle2,
    Ban,
    ArrowUpRight,
    MapPin,
    UserRound,
    CalendarClock,
    FileText,
} from "lucide-react";
import axios from "axios";

import api from "../services/api";

interface Vehicle {
    id: number;
    brand: string;
    model: string;
    plateNumber: string;
}

interface Reservation {
    id: number;
    vehicleId: number;
    vehicleBrand: string;
    vehicleModel: string;
    plateNumber: string;
    familyMemberId: number;
    memberName: string;
    startDate: string;
    endDate: string;
    destination: string;
    description: string | null;
    status: number;
    createdAt: string;
    completedAt: string | null;
    cancelledAt: string | null;
    cancelledByFamilyMemberId: number | null;
    cancelledByName: string | null;
}

type ViewMode = "day" | "week" | "month";
type StatusFilter = "all" | "active" | "completed" | "cancelled";

interface ReservationFormData {
    vehicleId: number;
    startDate: string;
    endDate: string;
    destination: string;
    description: string;
}

type FormMode = "create" | "edit";

const emptyForm: ReservationFormData = {
    vehicleId: 0,
    startDate: "",
    endDate: "",
    destination: "",
    description: "",
};

// UTC tarihini Türkiye saatine göre datetime-local formatına çevirir.
function toDateTimeLocal(value: string) {
    const date = new Date(value);

    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Istanbul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);

    const get = (type: string) =>
        parts.find((x) => x.type === type)?.value ?? "";

    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

// Türkiye yerel saatini UTC'ye çevirir.
function toUtcIso(value: string) {
    return new Date(`${value}:00+03:00`).toISOString();
}

function getApiErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as {
            message?: string;
            title?: string;
            errors?: Record<string, string[]>;
        } | undefined;

        const validationErrors = data?.errors
            ? Object.values(data.errors).flat().join(" ")
            : "";

        return validationErrors ||
            data?.message ||
            data?.title ||
            "İşlem sırasında bir hata oluştu.";
    }

    return "Beklenmeyen bir hata oluştu.";
}

const statusLabels: Record<number, string> = {
    1: "Aktif",
    2: "Tamamlandı",
    3: "İptal edildi",
};

const statusColors: Record<number, string> = {
    1: "bg-[#5A189A]",
    2: "bg-emerald-600",
    3: "bg-red-500",
};

function startOfDay(date: Date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

function addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function startOfWeek(date: Date) {
    const result = startOfDay(date);
    const day = result.getDay();
    const difference = day === 0 ? -6 : 1 - day;

    result.setDate(result.getDate() + difference);
    return result;
}

function formatDate(date: Date) {
    return date.toLocaleDateString("tr-TR", {
        timeZone: "Europe/Istanbul",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function formatTime(date: Date) {
    return date.toLocaleTimeString("tr-TR", {
        timeZone: "Europe/Istanbul",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    });
}

function formatShortDate(date: Date) {
    return date.toLocaleDateString("tr-TR", {
        timeZone: "Europe/Istanbul",
        day: "2-digit",
        month: "short",
    });
}

export default function Reservations() {
    const navigate = useNavigate();

    const queryClient = useQueryClient();

    const [showFormModal, setShowFormModal] = useState(false);
    const [formMode, setFormMode] = useState<FormMode>("create");
    const [formData, setFormData] =
        useState<ReservationFormData>(emptyForm);
    const [formError, setFormError] = useState("");


    const [view, setView] = useState<ViewMode>("day");
    const [selectedDate, setSelectedDate] = useState(
        startOfDay(new Date())
    );
    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("all");
    const [selectedReservation, setSelectedReservation] =
        useState<Reservation | null>(null);

    const {
        data: vehicles = [],
        isLoading: vehiclesLoading,
        isError: vehiclesError,
    } = useQuery({
        queryKey: ["vehicles"],
        queryFn: async () => {
            const response = await api.get<Vehicle[]>("/vehicles");
            return response.data;
        },
    });

    // Rezervasyon oluşturma
    const createMutation = useMutation({
        mutationFn: async (data: ReservationFormData) => {
            return api.post("/reservations", {
                vehicleId: data.vehicleId,
                startDate: toUtcIso(data.startDate),
                endDate: toUtcIso(data.endDate),
                destination: data.destination,
                description: data.description || null,
            });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["reservations"],
            });

            setShowFormModal(false);
            setFormError("");
            setFormData(emptyForm);
        },
        onError: (error: unknown) => {
            setFormError(getApiErrorMessage(error));
        },
    });

    // Rezervasyon güncelleme
    const updateMutation = useMutation({
        mutationFn: async (data: ReservationFormData) => {
            if (!selectedReservation) {
                throw new Error("Rezervasyon seçilmedi.");
            }

            return api.put(`/reservations/${selectedReservation.id}`, {
                startDate: toUtcIso(data.startDate),
                endDate: toUtcIso(data.endDate),
                destination: data.destination,
                description: data.description || null,
            });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["reservations"],
            });

            setShowFormModal(false);
            setSelectedReservation(null);
            setFormError("");
            setFormData(emptyForm);
        },
        onError: (error: unknown) => {
            setFormError(getApiErrorMessage(error));
        },
    });

    // Rezervasyon iptal etme
    const cancelMutation = useMutation({
        mutationFn: async (id: number) => {
            return api.delete(`/reservations/${id}`);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["reservations"],
            });

            setSelectedReservation(null);
        },
        onError: (error: unknown) => {
            window.alert(getApiErrorMessage(error));
        },
    });

    const openCreateModal = () => {
        setFormMode("create");
        setFormData({
            ...emptyForm,
            vehicleId: vehicles[0]?.id ?? 0,
        });
        setFormError("");
        setShowFormModal(true);
    };

    const openEditModal = () => {
        if (!selectedReservation) return;

        setFormMode("edit");

        setFormData({
            vehicleId: selectedReservation.vehicleId,
            startDate: toDateTimeLocal(selectedReservation.startDate),
            endDate: toDateTimeLocal(selectedReservation.endDate),
            destination: selectedReservation.destination,
            description: selectedReservation.description ?? "",
        });

        setFormError("");
        setShowFormModal(true);
    };

    const handleReservationSubmit = (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();
        setFormError("");

        if (
            !formData.startDate ||
            !formData.endDate ||
            new Date(formData.endDate) <= new Date(formData.startDate)
        ) {
            setFormError(
                "Bitiş tarihi başlangıç tarihinden sonra olmalıdır."
            );
            return;
        }

        if (!formData.destination.trim()) {
            setFormError("Gidilecek yer alanı zorunludur.");
            return;
        }

        if (formMode === "create") {
            if (!formData.vehicleId) {
                setFormError("Lütfen bir araç seçin.");
                return;
            }

            createMutation.mutate(formData);
        } else {
            updateMutation.mutate(formData);
        }
    };

    const isSaving =
        createMutation.isPending || updateMutation.isPending;

    const {
        data: reservations = [],
        isLoading: reservationsLoading,
        isError: reservationsError,
        refetch,
    } = useQuery({
        queryKey: ["reservations"],
        queryFn: async () => {
            const response = await api.get<Reservation[]>("/reservations");
            return response.data;
        },
    });

    const isLoading = vehiclesLoading || reservationsLoading;
    const isError = vehiclesError || reservationsError;

    const range = useMemo(() => {
        if (view === "day") {
            return {
                start: startOfDay(selectedDate),
                end: addDays(startOfDay(selectedDate), 1),
                unitMinutes: 30,
                unitWidth: 30,
                count: 48,
            };
        }

        if (view === "week") {
            const start = startOfWeek(selectedDate);

            return {
                start,
                end: addDays(start, 7),
                unitMinutes: 60,
                unitWidth: 24,
                count: 168,
            };
        }

        const start = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            1
        );

        const end = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            1
        );

        const count = Math.round(
            (end.getTime() - start.getTime()) / 86400000
        );

        return {
            start,
            end,
            unitMinutes: 1440,
            unitWidth: 44,
            count,
        };
    }, [view, selectedDate]);

    const timelineWidth = range.count * range.unitWidth;

    const visibleReservations = useMemo(() => {
        return reservations.filter((reservation) => {
            if (statusFilter === "active") {
                return reservation.status === 1;
            }

            if (statusFilter === "completed") {
                return reservation.status === 2;
            }

            if (statusFilter === "cancelled") {
                return reservation.status === 3;
            }

            return true;
        });
    }, [reservations, statusFilter]);

    const getReservationsForVehicle = (vehicleId: number) => {
        return visibleReservations.filter(
            (reservation) =>
                reservation.vehicleId === vehicleId &&
                new Date(reservation.startDate) < range.end &&
                new Date(reservation.endDate) > range.start
        );
    };

    const getReservationPosition = (reservation: Reservation) => {
        const start = new Date(reservation.startDate);
        const end = new Date(reservation.endDate);

        const visibleStart = Math.max(
            start.getTime(),
            range.start.getTime()
        );

        const visibleEnd = Math.min(
            end.getTime(),
            range.end.getTime()
        );

        const totalMinutes =
            (range.end.getTime() - range.start.getTime()) / 60000;

        const startMinutes =
            (visibleStart - range.start.getTime()) / 60000;

        const durationMinutes =
            (visibleEnd - visibleStart) / 60000;

        return {
            left: (startMinutes / totalMinutes) * 100,
            width: (durationMinutes / totalMinutes) * 100,
        };
    };

    const getTimelineLabels = () => {
        if (view === "day") {
            return Array.from({ length: 24 }, (_, index) => ({
                label: `${String(index).padStart(2, "0")}:00`,
                left: (index / 24) * 100,
            }));
        }

        if (view === "week") {
            return Array.from({ length: 7 }, (_, index) => ({
                label: formatShortDate(addDays(range.start, index)),
                left: (index / 7) * 100,
            }));
        }

        return Array.from({ length: range.count }, (_, index) => ({
            label: String(index + 1),
            left: (index / range.count) * 100,
        }));
    };

    const navigateDate = (direction: number) => {
        const next = new Date(selectedDate);

        if (view === "day") {
            next.setDate(next.getDate() + direction);
        } else if (view === "week") {
            next.setDate(next.getDate() + direction * 7);
        } else {
            next.setMonth(next.getMonth() + direction);
        }

        setSelectedDate(next);
    };

    const rangeTitle = () => {
        if (view === "day") {
            return formatDate(selectedDate);
        }

        if (view === "week") {
            return `${formatShortDate(range.start)} – ${formatDate(
                addDays(range.end, -1)
            )}`;
        }

        return selectedDate.toLocaleDateString("tr-TR", {
            month: "long",
            year: "numeric",
        });
    };

    const activeCount = reservations.filter(
        (x) => x.status === 1
    ).length;

    const completedCount = reservations.filter(
        (x) => x.status === 2
    ).length;

    const cancelledCount = reservations.filter(
        (x) => x.status === 3
    ).length;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f7fa]">
                <Loader2 className="w-8 h-8 animate-spin text-[#5A189A]" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-[#f8f7fa] flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center">
                    <h2 className="text-xl font-bold text-[#240046] mb-3">
                        Rezervasyonlar yüklenemedi
                    </h2>
                    <p className="text-gray-500 mb-6">
                        Veriler alınırken bir hata oluştu.
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="px-5 py-3 rounded-lg bg-[#5A189A] text-white font-semibold"
                    >
                        Tekrar Dene
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-full bg-[#f7f5fa]">
            <main className="mx-auto max-w-[1700px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

                {/* Page heading */}
                <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#974CE0]">
                            <span className="h-2 w-2 rounded-full bg-[#E1FF00]" />
                            AİLE GARAJI
                            <ArrowUpRight size={15} />
                            REZERVASYON MERKEZİ
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-[#240046] sm:text-4xl">
                            Araç Rezervasyonları
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
                            Aile araçlarının kullanım planını takip et, rezervasyonlarını
                            kolayca yönet ve takvimdeki uygun zamanları görüntüle.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => navigate("/vehicles")}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#974CE0]/40 hover:bg-purple-50"
                        >
                            <Car size={18} />
                            Araçlarım
                        </button>

                        <button
                            onClick={openCreateModal}
                            disabled={vehicles.length === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5A189A] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/15 transition hover:-translate-y-0.5 hover:bg-[#240046] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={19} />
                            Yeni Rezervasyon
                        </button>
                    </div>
                </div>

                {/* Statistics */}
                <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="group rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Aktif rezervasyon
                                </p>
                                <p className="mt-3 text-3xl font-bold text-[#5A189A]">
                                    {activeCount}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    Devam eden ve planlanan
                                </p>
                            </div>
                            <div className="rounded-xl bg-purple-50 p-3 text-[#5A189A] transition group-hover:bg-[#5A189A] group-hover:text-white">
                                <CalendarDays size={22} />
                            </div>
                        </div>
                    </div>

                    <div className="group rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Tamamlanan
                                </p>
                                <p className="mt-3 text-3xl font-bold text-emerald-600">
                                    {completedCount}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    Başarıyla tamamlanan kullanımlar
                                </p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                                <CheckCircle2 size={22} />
                            </div>
                        </div>
                    </div>

                    <div className="group rounded-2xl border border-red-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    İptal edilen
                                </p>
                                <p className="mt-3 text-3xl font-bold text-red-500">
                                    {cancelledCount}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    İptal edilmiş rezervasyonlar
                                </p>
                            </div>
                            <div className="rounded-xl bg-red-50 p-3 text-red-500 transition group-hover:bg-red-500 group-hover:text-white">
                                <Ban size={22} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calendar */}
                <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
                    {/* Calendar header */}
                    <div className="border-b border-gray-100 p-5 sm:p-6">
                        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5A189A]/10 text-[#5A189A]">
                                    <ChartGantt size={23} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-[#240046]">
                                        Araç doluluk takvimi
                                    </h2>
                                    <p className="mt-1 text-xs text-gray-400">
                                        {vehicles.length} araç · Zaman çizelgesi
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex rounded-xl bg-gray-100 p-1">
                                    {(
                                        [
                                            ["day", "Gün"],
                                            ["week", "Hafta"],
                                            ["month", "Ay"],
                                        ] as const
                                    ).map(([value, label]) => (
                                        <button
                                            key={value}
                                            onClick={() => setView(value)}
                                            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${view === value
                                                    ? "bg-white text-[#5A189A] shadow-sm"
                                                    : "text-gray-500 hover:text-[#240046]"
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Date navigation and filters */}
                        <div className="mt-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => navigateDate(-1)}
                                    className="rounded-xl border border-gray-200 p-2.5 text-gray-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-[#5A189A]"
                                    aria-label="Önceki dönem"
                                >
                                    <ChevronLeft size={19} />
                                </button>

                                <div className="flex min-w-[190px] items-center gap-2 px-2">
                                    <CalendarDays size={18} className="shrink-0 text-[#974CE0]" />
                                    <span className="font-semibold capitalize text-[#240046]">
                                        {rangeTitle()}
                                    </span>
                                </div>

                                <button
                                    onClick={() => navigateDate(1)}
                                    className="rounded-xl border border-gray-200 p-2.5 text-gray-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-[#5A189A]"
                                    aria-label="Sonraki dönem"
                                >
                                    <ChevronRight size={19} />
                                </button>

                                <button
                                    onClick={() => setSelectedDate(startOfDay(new Date()))}
                                    className="rounded-xl border border-purple-100 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-[#5A189A] transition hover:bg-purple-100"
                                >
                                    Bugün
                                </button>
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value as StatusFilter)
                                }
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-[#974CE0] focus:ring-4 focus:ring-purple-100 lg:w-auto"
                            >
                                <option value="all">Tüm rezervasyonlar</option>
                                <option value="active">Aktif rezervasyonlar</option>
                                <option value="completed">Tamamlananlar</option>
                                <option value="cancelled">İptal edilenler</option>
                            </select>
                        </div>

                        {/* Legend */}
                        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-gray-100 pt-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Durumlar
                            </span>
                            <span className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#5A189A]" />
                                Aktif
                            </span>
                            <span className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                Tamamlandı
                            </span>
                            <span className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                İptal edildi
                            </span>
                        </div>
                    </div>

                    {/* Timeline */}
                    {vehicles.length === 0 ? (
                        <div className="px-6 py-20 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-[#974CE0]">
                                <Car size={30} />
                            </div>
                            <h3 className="font-bold text-[#240046]">
                                Henüz araç eklenmemiş
                            </h3>
                            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                                Rezervasyon oluşturabilmek ve doluluk takvimini
                                kullanabilmek için önce aile garajına araç eklemelisin.
                            </p>
                            <button
                                onClick={() => navigate("/vehicles")}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#5A189A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#240046]"
                            >
                                <Plus size={17} />
                                Araç Ekle
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div
                                className="min-w-full"
                                style={{ minWidth: `${240 + timelineWidth}px` }}
                            >
                                {/* Timeline labels */}
                                <div className="flex border-b border-gray-100 bg-gray-50/80">
                                    <div className="sticky left-0 z-20 flex w-[240px] shrink-0 items-center border-r border-gray-100 bg-gray-50/95 px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                                        Araçlar
                                    </div>

                                    <div
                                        className="relative h-14"
                                        style={{ width: timelineWidth }}
                                    >
                                        {getTimelineLabels().map((item, index) => (
                                            <div
                                                key={index}
                                                className="absolute inset-y-0 flex items-center border-l border-gray-200 pl-2 text-xs font-semibold text-gray-500"
                                                style={{ left: `${item.left}%` }}
                                            >
                                                {item.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Vehicle rows */}
                                {vehicles.map((vehicle) => {
                                    const vehicleReservations =
                                        getReservationsForVehicle(vehicle.id);

                                    return (
                                        <div
                                            key={vehicle.id}
                                            className="group flex border-b border-gray-100 transition last:border-b-0 hover:bg-purple-50/20"
                                        >
                                            <div className="sticky left-0 z-10 flex w-[240px] shrink-0 flex-col justify-center border-r border-gray-100 bg-white px-5 py-4 transition group-hover:bg-[#fcfaff]">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5A189A]">
                                                        <Car size={19} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-bold text-[#240046]">
                                                            {vehicle.brand} {vehicle.model}
                                                        </p>
                                                        <p className="mt-1 text-xs font-medium tracking-wide text-gray-400">
                                                            {vehicle.plateNumber}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400">
                                                    <CalendarDays size={12} />
                                                    {vehicleReservations.length} rezervasyon
                                                </div>
                                            </div>

                                            <div
                                                className="relative h-[88px] shrink-0"
                                                style={{
                                                    width: timelineWidth,
                                                    backgroundImage:
                                                        view === "day"
                                                            ? "repeating-linear-gradient(to right, transparent 0, transparent 29px, #f0edf4 29px, #f0edf4 30px)"
                                                            : view === "week"
                                                                ? "repeating-linear-gradient(to right, transparent 0, transparent 23px, #f0edf4 23px, #f0edf4 24px)"
                                                                : "repeating-linear-gradient(to right, transparent 0, transparent 43px, #f0edf4 43px, #f0edf4 44px)",
                                                }}
                                            >
                                                {vehicleReservations.map((reservation) => {
                                                    const position =
                                                        getReservationPosition(reservation);

                                                    return (
                                                        <button
                                                            key={reservation.id}
                                                            onClick={() =>
                                                                setSelectedReservation(reservation)
                                                            }
                                                            title={`${reservation.memberName} · ${reservation.destination}`}
                                                            className={`absolute top-4 flex h-[56px] min-w-1 flex-col justify-center overflow-hidden rounded-xl border border-white/20 px-3 text-left text-white shadow-sm transition hover:z-10 hover:brightness-110 hover:shadow-md ${reservation.status === 1
                                                                    ? "bg-gradient-to-r from-[#5A189A] to-[#974CE0]"
                                                                    : reservation.status === 2
                                                                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
                                                                        : "bg-gradient-to-r from-red-500 to-rose-400"
                                                                }`}
                                                            style={{
                                                                left: `${position.left}%`,
                                                                width: `${position.width}%`,
                                                            }}
                                                        >
                                                            {position.width > 5 && (
                                                                <>
                                                                    <span className="truncate text-xs font-bold">
                                                                        {reservation.memberName}
                                                                    </span>
                                                                    {position.width > 10 && (
                                                                        <span className="mt-0.5 truncate text-[10px] text-white/80">
                                                                            {reservation.destination}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock size={14} className="text-[#974CE0]" />
                            {view === "day"
                                ? "Günlük görünüm · 30 dakikalık aralıklar"
                                : view === "week"
                                    ? "Haftalık görünüm · 1 saatlik aralıklar"
                                    : "Aylık görünüm · Günlük doluluk"}
                        </div>
                        <p className="text-xs text-gray-400">
                            Detayları görüntülemek için bir rezervasyona tıkla.
                        </p>
                    </div>
                </section>
            </main>


            {showFormModal && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#160b20]/60 p-3 backdrop-blur-sm sm:p-6"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !isSaving) {
                            setShowFormModal(false);
                        }
                    }}
                >
                    <div className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/50 bg-white shadow-2xl shadow-purple-950/20">
                        {/* Header */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-[#240046] via-[#5A189A] to-[#974CE0] px-6 py-7 text-white sm:px-8">
                            <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-20 right-28 h-40 w-40 rounded-full bg-[#E1FF00]/10 blur-2xl" />

                            <div className="relative flex items-start justify-between gap-4">
                                <div>
                                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-purple-100">
                                        <CalendarDays size={14} />
                                        REZERVASYON YÖNETİMİ
                                    </div>

                                    <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                        {formMode === "create"
                                            ? "Yeni Rezervasyon"
                                            : "Rezervasyonu Düzenle"}
                                    </h3>

                                    <p className="mt-2 max-w-md text-sm leading-6 text-purple-100/80">
                                        {formMode === "create"
                                            ? "Aracını seç, kullanım zamanını belirle ve planını oluştur."
                                            : "Rezervasyon bilgilerini güncelleyebilirsin."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => !isSaving && setShowFormModal(false)}
                                    disabled={isSaving}
                                    className="rounded-xl border border-white/20 bg-white/10 p-2.5 text-white transition hover:bg-white/20 disabled:opacity-50"
                                    aria-label="Pencereyi kapat"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleReservationSubmit}>
                            <div className="max-h-[65vh] space-y-6 overflow-y-auto p-6 sm:p-8">
                                {/* Vehicle */}
                                <div>
                                    <div className="mb-3 flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#5A189A]">
                                            <Car size={17} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[#240046]">
                                                Araç bilgileri
                                            </h4>
                                            <p className="text-xs text-gray-400">
                                                Kullanmak istediğin aracı seç.
                                            </p>
                                        </div>
                                    </div>

                                    <select
                                        required
                                        value={formData.vehicleId}
                                        disabled={formMode === "edit"}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                vehicleId: Number(e.target.value),
                                            })
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3.5 text-sm font-medium text-gray-700 outline-none transition focus:border-[#974CE0] focus:bg-white focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                                    >
                                        <option value={0} disabled>
                                            Araç seçin
                                        </option>

                                        {vehicles.map((vehicle) => (
                                            <option key={vehicle.id} value={vehicle.id}>
                                                {vehicle.brand} {vehicle.model} — {vehicle.plateNumber}
                                            </option>
                                        ))}
                                    </select>

                                    {formMode === "edit" && (
                                        <p className="mt-2 text-xs text-gray-400">
                                            Düzenleme sırasında araç değiştirilemez.
                                        </p>
                                    )}
                                </div>

                                {/* Date and time */}
                                <div>
                                    <div className="mb-3 flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#5A189A]">
                                            <CalendarClock size={17} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[#240046]">
                                                Kullanım zamanı
                                            </h4>
                                            <p className="text-xs text-gray-400">
                                                Başlangıç ve bitiş tarihlerini belirle.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-gray-600">
                                                Başlangıç tarihi
                                            </label>
                                            <input
                                                type="datetime-local"
                                                required
                                                value={formData.startDate}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        startDate: e.target.value,
                                                    })
                                                }
                                                className="w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-3 text-sm text-gray-700 outline-none transition focus:border-[#974CE0] focus:bg-white focus:ring-4 focus:ring-purple-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-gray-600">
                                                Bitiş tarihi
                                            </label>
                                            <input
                                                type="datetime-local"
                                                required
                                                min={formData.startDate || undefined}
                                                value={formData.endDate}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        endDate: e.target.value,
                                                    })
                                                }
                                                className="w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-3 text-sm text-gray-700 outline-none transition focus:border-[#974CE0] focus:bg-white focus:ring-4 focus:ring-purple-100"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Destination */}
                                <div>
                                    <div className="mb-3 flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#5A189A]">
                                            <MapPin size={17} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[#240046]">
                                                Varış noktası
                                            </h4>
                                            <p className="text-xs text-gray-400">
                                                Yolculuğun nereye olacak?
                                            </p>
                                        </div>
                                    </div>

                                    <input
                                        type="text"
                                        required
                                        maxLength={200}
                                        value={formData.destination}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                destination: e.target.value,
                                            })
                                        }
                                        placeholder="Örn. İstanbul, Ankara, İzmir..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#974CE0] focus:bg-white focus:ring-4 focus:ring-purple-100"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <div className="mb-3 flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#5A189A]">
                                            <FileText size={17} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[#240046]">
                                                Açıklama
                                            </h4>
                                            <p className="text-xs text-gray-400">
                                                Rezervasyonuna isteğe bağlı not ekle.
                                            </p>
                                        </div>
                                    </div>

                                    <textarea
                                        rows={3}
                                        maxLength={500}
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                        placeholder="Yolculuk hakkında eklemek istediğin bir not var mı?"
                                        className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#974CE0] focus:bg-white focus:ring-4 focus:ring-purple-100"
                                    />

                                    <p className="mt-1.5 text-right text-xs text-gray-400">
                                        {formData.description.length}/500
                                    </p>
                                </div>

                                {formError && (
                                    <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                                        <Ban size={18} className="mt-0.5 shrink-0" />
                                        <p>{formError}</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/70 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
                                <button
                                    type="button"
                                    onClick={() => setShowFormModal(false)}
                                    disabled={isSaving}
                                    className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                                >
                                    Vazgeç
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5A189A] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/15 transition hover:-translate-y-0.5 hover:bg-[#240046] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSaving ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Save size={18} />
                                    )}

                                    {formMode === "create"
                                        ? "Rezervasyon Oluştur"
                                        : "Değişiklikleri Kaydet"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}



            {selectedReservation && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#160b20]/60 p-3 backdrop-blur-sm sm:p-6"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            setSelectedReservation(null);
                        }
                    }}
                >
                    <div className="my-auto w-full max-w-xl overflow-hidden rounded-3xl border border-white/50 bg-white shadow-2xl shadow-purple-950/20">
                        {/* Header */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-[#240046] via-[#5A189A] to-[#974CE0] px-6 py-7 text-white sm:px-8">
                            <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

                            <div className="relative flex items-start justify-between gap-4">
                                <div>
                                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-purple-100">
                                        <CalendarDays size={14} />
                                        REZERVASYON DETAYI
                                    </div>

                                    <h3 className="text-2xl font-bold tracking-tight">
                                        Rezervasyon #{selectedReservation.id}
                                    </h3>

                                    <p className="mt-2 text-sm text-purple-100/80">
                                        Araç kullanım planının tüm detayları
                                    </p>
                                </div>

                                <button
                                    onClick={() => setSelectedReservation(null)}
                                    className="rounded-xl border border-white/20 bg-white/10 p-2.5 text-white transition hover:bg-white/20"
                                    aria-label="Pencereyi kapat"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[65vh] space-y-5 overflow-y-auto p-6 sm:p-8">
                            {/* Vehicle card */}
                            <div className="flex items-center gap-4 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 to-white p-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#5A189A] text-white shadow-lg shadow-purple-900/15">
                                    <Car size={27} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                        Rezervasyon yapılan araç
                                    </p>
                                    <h4 className="mt-1 truncate text-lg font-bold text-[#240046]">
                                        {selectedReservation.vehicleBrand}{" "}
                                        {selectedReservation.vehicleModel}
                                    </h4>
                                    <span className="mt-1 inline-flex rounded-md border border-purple-100 bg-white px-2 py-1 text-xs font-bold tracking-wider text-[#5A189A]">
                                        {selectedReservation.plateNumber}
                                    </span>
                                </div>

                                <span
                                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-white ${statusColors[selectedReservation.status] ?? "bg-gray-500"}`}
                                >
                                    {statusLabels[selectedReservation.status] ?? "Bilinmiyor"}
                                </span>
                            </div>

                            {/* Reservation owner */}
                            <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5A189A]">
                                    <UserRound size={19} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-400">
                                        Rezervasyon sahibi
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-[#240046]">
                                        {selectedReservation.memberName}
                                    </p>
                                </div>
                            </div>

                            {/* Date timeline */}
                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <CalendarClock size={17} className="text-[#974CE0]" />
                                    <h4 className="text-sm font-bold text-[#240046]">
                                        Kullanım zamanı
                                    </h4>
                                </div>

                                <div className="relative grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            <span className="text-xs font-bold text-emerald-700">
                                                BAŞLANGIÇ
                                            </span>
                                        </div>

                                        <p className="text-sm font-bold text-[#240046]">
                                            {formatDate(
                                                new Date(selectedReservation.startDate)
                                            )}
                                        </p>
                                        <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700">
                                            {formatTime(
                                                new Date(selectedReservation.startDate)
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-red-500" />
                                            <span className="text-xs font-bold text-red-600">
                                                BİTİŞ
                                            </span>
                                        </div>

                                        <p className="text-sm font-bold text-[#240046]">
                                            {formatDate(
                                                new Date(selectedReservation.endDate)
                                            )}
                                        </p>
                                        <p className="mt-1 text-xl font-bold tabular-nums text-red-600">
                                            {formatTime(
                                                new Date(selectedReservation.endDate)
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Destination */}
                            <div className="rounded-2xl border border-gray-100 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                        <MapPin size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-gray-400">
                                            Varış noktası
                                        </p>
                                        <p className="mt-1 break-words text-base font-bold text-[#240046]">
                                            {selectedReservation.destination}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedReservation.description && (
                                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <FileText size={17} className="text-[#974CE0]" />
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                            Açıklama
                                        </p>
                                    </div>
                                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                                        {selectedReservation.description}
                                    </p>
                                </div>
                            )}

                            {/* Cancellation info */}
                            {selectedReservation.cancelledAt && (
                                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                                    <div className="flex items-center gap-2 text-red-600">
                                        <Ban size={17} />
                                        <p className="text-sm font-bold">
                                            Rezervasyon iptal edildi
                                        </p>
                                    </div>
                                    <p className="mt-2 text-sm text-red-700">
                                        İptal eden:{" "}
                                        <span className="font-semibold">
                                            {selectedReservation.cancelledByName || "Bilinmiyor"}
                                        </span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-3 border-t border-gray-100 bg-gray-50/70 p-6 sm:px-8">
                            {selectedReservation.status === 1 && (
                                <>
                                    <button
                                        onClick={openEditModal}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5A189A] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/15 transition hover:-translate-y-0.5 hover:bg-[#240046]"
                                    >
                                        <Pencil size={17} />
                                        Rezervasyonu Düzenle
                                    </button>

                                    <button
                                        onClick={() => {
                                            const confirmed = window.confirm(
                                                "Bu rezervasyonu iptal etmek istediğinize emin misiniz?"
                                            );

                                            if (confirmed) {
                                                cancelMutation.mutate(selectedReservation.id);
                                            }
                                        }}
                                        disabled={cancelMutation.isPending}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {cancelMutation.isPending ? (
                                            <Loader2 size={17} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={17} />
                                        )}
                                        Rezervasyonu İptal Et
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => setSelectedReservation(null)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
