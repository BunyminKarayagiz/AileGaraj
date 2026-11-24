import { useMemo, useState } from "react";
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
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
        <div className="min-h-screen bg-[#f8f7fa]">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#240046]">
                            AileGaraj
                        </h1>
                        <p className="text-sm text-gray-500">
                            Rezervasyon yönetimi
                        </p>
                    </div>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                    >
                        <ArrowLeft size={18} />
                        Dashboard
                    </button>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-6 py-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-7">
                    <div>
                        <h2 className="text-2xl font-bold text-[#240046]">
                            Araç Doluluk Takvimi
                        </h2>
                        <p className="text-gray-500 mt-1">
                            Aile araçlarının rezervasyon durumlarını zaman çizelgesinde görüntüle.
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        disabled={vehicles.length === 0}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] transition disabled:opacity-50"
                    >
                        <Plus size={18} />
                        Yeni Rezervasyon
                    </button>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] transition"
                    >
                        <Car size={18} />
                        Araçları Görüntüle
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <p className="text-sm text-gray-500">
                            Aktif rezervasyon
                        </p>
                        <p className="text-3xl font-bold text-[#5A189A] mt-2">
                            {activeCount}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <p className="text-sm text-gray-500">
                            Tamamlanan
                        </p>
                        <p className="text-3xl font-bold text-emerald-600 mt-2">
                            {completedCount}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <p className="text-sm text-gray-500">
                            İptal edilen
                        </p>
                        <p className="text-3xl font-bold text-red-500 mt-2">
                            {cancelledCount}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="p-5 border-b border-gray-200">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <ChartGantt
                                        className="text-[#5A189A]"
                                        size={22}
                                    />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#240046]">
                                        Doluluk çizelgesi
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {vehicles.length} aktif araç
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    {(
                                        [
                                            ["day", "Günlük"],
                                            ["week", "Haftalık"],
                                            ["month", "Aylık"],
                                        ] as const
                                    ).map(([value, label]) => (
                                        <button
                                            key={value}
                                            onClick={() => setView(value)}
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition ${view === value
                                                    ? "bg-white text-[#5A189A] shadow-sm"
                                                    : "text-gray-500 hover:text-[#5A189A]"
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigateDate(-1)}
                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                                >
                                    <ChevronLeft size={19} />
                                </button>

                                <div className="flex items-center gap-2 min-w-[180px]">
                                    <CalendarDays
                                        size={18}
                                        className="text-[#5A189A]"
                                    />
                                    <span className="font-semibold text-[#240046] capitalize">
                                        {rangeTitle()}
                                    </span>
                                </div>

                                <button
                                    onClick={() => navigateDate(1)}
                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                                >
                                    <ChevronRight size={19} />
                                </button>

                                <button
                                    onClick={() =>
                                        setSelectedDate(startOfDay(new Date()))
                                    }
                                    className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                                >
                                    Bugün
                                </button>
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value as StatusFilter
                                    )
                                }
                                className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#974CE0]"
                            >
                                <option value="all">Tüm rezervasyonlar</option>
                                <option value="active">Aktif</option>
                                <option value="completed">Tamamlanan</option>
                                <option value="cancelled">İptal edilen</option>
                            </select>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-gray-500">
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded bg-[#5A189A]" />
                                Aktif
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded bg-emerald-600" />
                                Tamamlandı
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded bg-red-500" />
                                İptal edildi
                            </span>
                        </div>
                    </div>

                    {vehicles.length === 0 ? (
                        <div className="p-12 text-center">
                            <Car
                                size={40}
                                className="mx-auto text-gray-300 mb-4"
                            />
                            <h3 className="font-bold text-[#240046]">
                                Henüz aktif araç yok
                            </h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Doluluk çizelgesini görmek için önce araç eklemelisin.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div
                                className="min-w-full"
                                style={{
                                    minWidth: `${220 + timelineWidth}px`,
                                }}
                            >
                                <div className="flex border-b border-gray-200 bg-gray-50">
                                    <div className="w-[220px] shrink-0 px-5 py-4 text-xs font-bold text-gray-500 uppercase">
                                        Araç
                                    </div>

                                    <div
                                        className="relative h-14 border-l border-gray-200"
                                        style={{ width: timelineWidth }}
                                    >
                                        {getTimelineLabels().map(
                                            (item, index) => (
                                                <div
                                                    key={index}
                                                    className="absolute top-0 bottom-0 flex items-center pl-2 border-l border-gray-200 text-xs font-medium text-gray-500"
                                                    style={{
                                                        left: `${item.left}%`,
                                                    }}
                                                >
                                                    {item.label}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                {vehicles.map((vehicle) => {
                                    const vehicleReservations =
                                        getReservationsForVehicle(vehicle.id);

                                    return (
                                        <div
                                            key={vehicle.id}
                                            className="flex border-b border-gray-100 hover:bg-gray-50/50"
                                        >
                                            <div className="w-[220px] shrink-0 px-5 py-4 flex flex-col justify-center">
                                                <div className="flex items-center gap-2">
                                                    <Car
                                                        size={17}
                                                        className="text-[#5A189A] shrink-0"
                                                    />
                                                    <span className="font-semibold text-sm text-[#240046]">
                                                        {vehicle.brand}{" "}
                                                        {vehicle.model}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500 ml-6 mt-1">
                                                    {vehicle.plateNumber}
                                                </span>
                                            </div>

                                            <div
                                                className="relative border-l border-gray-100 h-[76px]"
                                                style={{
                                                    width: timelineWidth,
                                                    backgroundImage:
                                                        view === "day"
                                                            ? "repeating-linear-gradient(to right, transparent 0, transparent 29px, #e5e7eb 29px, #e5e7eb 30px)"
                                                            : view === "week"
                                                                ? "repeating-linear-gradient(to right, transparent 0, transparent 23px, #e5e7eb 23px, #e5e7eb 24px)"
                                                                : "repeating-linear-gradient(to right, transparent 0, transparent 43px, #e5e7eb 43px, #e5e7eb 44px)",
                                                }}
                                            >
                                                {vehicleReservations.map(
                                                    (reservation) => {
                                                        const position =
                                                            getReservationPosition(
                                                                reservation
                                                            );

                                                        return (
                                                            <button
                                                                key={reservation.id}
                                                                onClick={() =>
                                                                    setSelectedReservation(
                                                                        reservation
                                                                    )
                                                                }
                                                                title={`${reservation.memberName} - ${reservation.destination}`}
                                                                className={`absolute top-3 h-12 rounded-lg px-2 text-white text-xs font-medium overflow-hidden whitespace-nowrap text-left shadow-sm hover:brightness-110 transition ${statusColors[reservation.status]}`}
                                                                style={{
                                                                    left: `${position.left}%`,
                                                                    width: `${position.width}%`,
                                                                    minWidth: "4px",
                                                                }}
                                                            >
                                                                {position.width > 5 && (
                                                                    <span>
                                                                        {reservation.memberName}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="px-5 py-4 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-2">
                        <Clock size={14} />
                        {view === "day"
                            ? "Günlük görünüm: 30 dakikalık zaman aralıkları"
                            : view === "week"
                                ? "Haftalık görünüm: 1 saatlik zaman aralıkları"
                                : "Aylık görünüm: Günlük doluluk"}
                    </div>
                </div>
            </main>
            {showFormModal && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b">
                            <div>
                                <h3 className="text-xl font-bold text-[#240046]">
                                    {formMode === "create"
                                        ? "Yeni Rezervasyon"
                                        : "Rezervasyonu Düzenle"}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Rezervasyon bilgilerini doldur.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowFormModal(false)}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleReservationSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Araç
                                </label>

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
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-[#974CE0] disabled:bg-gray-100"
                                >
                                    <option value={0} disabled>
                                        Araç seçin
                                    </option>

                                    {vehicles.map((vehicle) => (
                                        <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.brand} {vehicle.model} - {vehicle.plateNumber}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Başlangıç tarihi ve saati
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
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-[#974CE0]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bitiş tarihi ve saati
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.endDate}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            endDate: e.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-[#974CE0]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Gidilecek yer
                                </label>
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
                                    placeholder="Örn. İstanbul, Ankara..."
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-[#974CE0]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Açıklama
                                </label>
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
                                    placeholder="İsteğe bağlı açıklama..."
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-[#974CE0] resize-none"
                                />
                            </div>

                            {formError && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                                    {formError}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowFormModal(false)}
                                    className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50"
                                >
                                    Vazgeç
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Save size={18} />
                                    )}

                                    {formMode === "create" ? "Rezervasyon Oluştur" : "Değişiklikleri Kaydet"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedReservation && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            setSelectedReservation(null);
                        }
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h3 className="text-xl font-bold text-[#240046]">
                                    Rezervasyon Detayı
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    #{selectedReservation.id}
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    setSelectedReservation(null)
                                }
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-xs text-gray-500">
                                    Araç
                                </p>
                                <p className="font-semibold text-[#240046]">
                                    {selectedReservation.vehicleBrand}{" "}
                                    {selectedReservation.vehicleModel}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {selectedReservation.plateNumber}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">
                                    Rezervasyon sahibi
                                </p>
                                <p className="font-medium text-gray-800">
                                    {selectedReservation.memberName}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">
                                        Başlangıç
                                    </p>
                                    <p className="font-medium text-sm">
                                        {formatDate(
                                            new Date(
                                                selectedReservation.startDate
                                            )
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatTime(
                                            new Date(
                                                selectedReservation.startDate
                                            )
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500">
                                        Bitiş
                                    </p>
                                    <p className="font-medium text-sm">
                                        {formatDate(
                                            new Date(
                                                selectedReservation.endDate
                                            )
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatTime(
                                            new Date(
                                                selectedReservation.endDate
                                            )
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">
                                    Varış noktası
                                </p>
                                <p className="font-medium text-gray-800">
                                    {selectedReservation.destination}
                                </p>
                            </div>

                            {selectedReservation.description && (
                                <div>
                                    <p className="text-xs text-gray-500">
                                        Açıklama
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        {selectedReservation.description}
                                    </p>
                                </div>
                            )}

                            <div>
                                <p className="text-xs text-gray-500 mb-1">
                                    Durum
                                </p>
                                <span
                                    className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold text-white ${statusColors[selectedReservation.status]}`}
                                >
                                    {statusLabels[selectedReservation.status]}
                                </span>
                            </div>

                            {selectedReservation.cancelledAt && (
                                <div className="border-t pt-4">
                                    <p className="text-xs text-gray-500">
                                        İptal eden
                                    </p>
                                    <p className="text-sm font-medium">
                                        {selectedReservation.cancelledByName ||
                                            "Bilinmiyor"}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 pt-0">
                            <div className="p-6 pt-0 space-y-3">
                                {selectedReservation.status === 1 && (
                                    <>
                                        <button
                                            onClick={openEditModal}
                                            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] transition"
                                        >
                                            <Pencil size={18} />
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
                                            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition disabled:opacity-50"
                                        >
                                            {cancelMutation.isPending ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={18} />
                                            )}
                                            Rezervasyonu İptal Et
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => setSelectedReservation(null)}
                                    className="w-full px-5 py-3 rounded-lg border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
