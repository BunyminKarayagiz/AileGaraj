
import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Plus,
    Car,
    Loader2,
    Pencil,
    X,
    Trash2,
} from "lucide-react";

import api from "../services/api";

interface Vehicle {
    id: number;
    brand: string;
    model: string;
    plateNumber: string;
    modelYear: number;
    currentMileage: number;
    fuelType: string;
    description: string | null;
    createdAt: string;
}

interface UpdateVehicleRequest {
    brand: string;
    model: string;
    plateNumber: string;
    modelYear: number;
    fuelType: string;
    description: string;
}

interface VehicleForm {
    brand: string;
    model: string;
    plateNumber: string;
    modelYear: string;
    fuelType: string;
    description: string;
}

const emptyForm: VehicleForm = {
    brand: "",
    model: "",
    plateNumber: "",
    modelYear: "",
    fuelType: "",
    description: "",
};

export default function Vehicles() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [editForm, setEditForm] = useState<VehicleForm>(emptyForm);
    const [editError, setEditError] = useState("");
    const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
    const [deleteError, setDeleteError] = useState("");

    const {
        data: vehicles,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ["vehicles"],
        queryFn: async () => {
            const response = await api.get<Vehicle[]>("/vehicles");
            return response.data;
        },
    });

    const updateVehicleMutation = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: UpdateVehicleRequest;
        }) => {
            const response = await api.put(`/vehicles/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            closeEditModal();
        },
        onError: (err) => {
            const status = (
                err as { response?: { status?: number } }
            )?.response?.status;

            const message = (
                err as {
                    response?: {
                        data?: { message?: string; title?: string };
                    };
                }
            )?.response?.data;

            if (status === 403) {
                setEditError("Araç düzenlemek için gerekli izne sahip değilsin.");
            } else {
                setEditError(
                    message?.message ||
                    message?.title ||
                    "Araç güncellenirken bir hata oluştu."
                );
            }
        },
    });

    const deleteVehicleMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/vehicles/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            setDeletingVehicle(null);
            setDeleteError("");
        },
        onError: (err) => {
            const status = (
                err as { response?: { status?: number } }
            )?.response?.status;

            setDeleteError(
                status === 403
                    ? "Aracı pasife almak için gerekli izne sahip değilsin."
                    : "Araç pasife alınırken bir hata oluştu."
            );
        },
    });

    const status = (
        error as { response?: { status?: number } } | null
    )?.response?.status;

    const openEditModal = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle);

        setEditForm({
            brand: vehicle.brand,
            model: vehicle.model,
            plateNumber: vehicle.plateNumber,
            modelYear: String(vehicle.modelYear),
            fuelType: vehicle.fuelType,
            description: vehicle.description || "",
        });

        setEditError("");
    };

    const closeEditModal = () => {
        setEditingVehicle(null);
        setEditForm(emptyForm);
        setEditError("");
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!editingVehicle) return;

        setEditError("");

        updateVehicleMutation.mutate({
            id: editingVehicle.id,
            data: {
                brand: editForm.brand.trim(),
                model: editForm.model.trim(),
                plateNumber: editForm.plateNumber.trim().toUpperCase(),
                modelYear: Number(editForm.modelYear),
                fuelType: editForm.fuelType.trim(),
                description: editForm.description.trim(),
            },
        });
    };

    const updateFormField = (
        field: keyof VehicleForm,
        value: string
    ) => {
        setEditForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

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
                <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
                    <h2 className="text-xl font-bold text-[#240046] mb-3">
                        {status === 403 ? "Erişim Yetkin Yok" : "Bir Hata Oluştu"}
                    </h2>

                    <p className="text-gray-500 mb-6">
                        {status === 403
                            ? "Araçları görüntülemek için gerekli izne sahip değilsin."
                            : "Araç bilgileri alınırken bir hata oluştu."}
                    </p>

                    <button
                        onClick={() => refetch()}
                        className="px-5 py-3 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] transition"
                    >
                        Tekrar Dene
                    </button>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="block mx-auto mt-4 text-sm text-gray-500 hover:text-[#5A189A]"
                    >
                        Dashboard'a Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f7fa]">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#240046]">
                            AileGaraj
                        </h1>
                        <p className="text-sm text-gray-500">
                            Araç yönetimi
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

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-[#240046]">
                            Aile Araçları
                        </h2>
                        <p className="text-gray-500 mt-1">
                            Ailene ait araçları buradan görüntüleyebilirsin.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate("/vehicles/create")}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] transition"
                    >
                        <Plus size={19} />
                        Yeni Araç Ekle
                    </button>
                </div>

                {!vehicles || vehicles.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-5">
                            <Car className="text-[#5A189A]" size={32} />
                        </div>

                        <h3 className="text-xl font-bold text-[#240046] mb-2">
                            Henüz araç eklenmemiş
                        </h3>

                        <p className="text-gray-500 mb-6">
                            Ailene ait ilk aracı ekleyerek başlayabilirsin.
                        </p>

                        <button
                            onClick={() => navigate("/vehicles/create")}
                            className="px-5 py-3 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] transition"
                        >
                            İlk Aracı Ekle
                        </button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {vehicles.map((vehicle) => (
                            <div
                                key={vehicle.id}
                                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-5">
                                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                        <Car className="text-[#5A189A]" size={25} />
                                    </div>

                                    <span className="px-3 py-1 rounded-lg bg-purple-50 text-[#5A189A] text-sm font-semibold">
                                        {vehicle.modelYear}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-[#240046]">
                                    {vehicle.brand} {vehicle.model}
                                </h3>

                                <p className="text-sm font-semibold text-gray-500 mt-1">
                                    {vehicle.plateNumber}
                                </p>

                                <div className="grid grid-cols-2 gap-3 mt-6">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">
                                            Kilometre
                                        </p>
                                        <p className="font-semibold text-[#240046] mt-1">
                                            {vehicle.currentMileage.toLocaleString("tr-TR")} km
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">
                                            Yakıt Türü
                                        </p>
                                        <p className="font-semibold text-[#240046] mt-1">
                                            {vehicle.fuelType}
                                        </p>
                                    </div>
                                </div>

                                {vehicle.description && (
                                    <p className="text-sm text-gray-500 mt-4 border-t pt-4">
                                        {vehicle.description}
                                    </p>
                                )}

                                <button
                                    onClick={() => openEditModal(vehicle)}
                                    className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[#974CE0] text-[#5A189A] font-semibold hover:bg-purple-50 transition"
                                >
                                    <Pencil size={17} />
                                    Düzenle
                                </button>
                                <button
                                    onClick={() => {
                                        setDeletingVehicle(vehicle);
                                        setDeleteError("");
                                    }}
                                    className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition"
                                >
                                    <Trash2 size={17} />
                                    Aracı Pasife Al
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {editingVehicle && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            closeEditModal();
                        }
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h3 className="text-xl font-bold text-[#240046]">
                                    Aracı Düzenle
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {editingVehicle.plateNumber} plakalı aracın bilgileri
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6">
                            {editError && (
                                <div className="mb-5 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
                                    {editError}
                                </div>
                            )}

                            <div className="grid sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Marka
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.brand}
                                        onChange={(e) => updateFormField("brand", e.target.value)}
                                        maxLength={100}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-[#974CE0]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Model
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.model}
                                        onChange={(e) => updateFormField("model", e.target.value)}
                                        maxLength={100}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-[#974CE0]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Plaka
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.plateNumber}
                                        onChange={(e) => updateFormField("plateNumber", e.target.value.toUpperCase())}
                                        maxLength={20}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-[#974CE0] uppercase"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Model Yılı
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.modelYear}
                                        onChange={(e) => updateFormField("modelYear", e.target.value)}
                                        min="1900"
                                        max="2100"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-[#974CE0]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Yakıt Türü
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.fuelType}
                                        onChange={(e) => updateFormField("fuelType", e.target.value)}
                                        maxLength={50}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-[#974CE0]"
                                    />
                                </div>
                            </div>

                            <div className="mt-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Açıklama
                                </label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => updateFormField("description", e.target.value)}
                                    maxLength={500}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-[#974CE0] resize-none"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="flex-1 px-5 py-3 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition"
                                >
                                    İptal
                                </button>

                                <button
                                    type="submit"
                                    disabled={updateVehicleMutation.isPending}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] transition disabled:opacity-50"
                                >
                                    {updateVehicleMutation.isPending && (
                                        <Loader2 size={18} className="animate-spin" />
                                    )}
                                    Değişiklikleri Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deletingVehicle && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-xl font-bold text-[#240046]">
                                Aracı Pasife Al
                            </h3>

                            <button
                                onClick={() => {
                                    setDeletingVehicle(null);
                                    setDeleteError("");
                                }}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-3">
                            <strong>
                                {deletingVehicle.brand} {deletingVehicle.model}
                            </strong>{" "}
                            aracını pasife almak istediğine emin misin?
                        </p>

                        <p className="text-sm text-gray-500 mb-5">
                            Araç aktif araçlar listesinden kaldırılacak. Geçmiş kayıtları korunacaktır.
                        </p>

                        {deleteError && (
                            <div className="mb-5 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setDeletingVehicle(null);
                                    setDeleteError("");
                                }}
                                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50"
                            >
                                Vazgeç
                            </button>

                            <button
                                onClick={() => deleteVehicleMutation.mutate(deletingVehicle.id)}
                                disabled={deleteVehicleMutation.isPending}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleteVehicleMutation.isPending && (
                                    <Loader2 size={18} className="animate-spin" />
                                )}
                                Pasife Al
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
