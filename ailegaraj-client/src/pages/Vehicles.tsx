
import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Car,
    Loader2,
    Pencil,
    X,
    Trash2,
    Search,
    Gauge,
    Fuel,
    Sparkles,
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
    imageUrl: string | null;
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
    const [editImage, setEditImage] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

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
            data: FormData;
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

    const filteredVehicles = (vehicles ?? []).filter((vehicle) => {
        const search = searchTerm.toLocaleLowerCase("tr-TR");

        return (
            vehicle.brand.toLocaleLowerCase("tr-TR").includes(search) ||
            vehicle.model.toLocaleLowerCase("tr-TR").includes(search) ||
            vehicle.plateNumber.toLocaleLowerCase("tr-TR").includes(search)
        );
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
        setEditImage(null);
        setEditImagePreview(vehicle.imageUrl);
    };

    const closeEditModal = () => {
        if (editImagePreview?.startsWith("blob:")) {
            URL.revokeObjectURL(editImagePreview);
        }

        setEditingVehicle(null);
        setEditForm(emptyForm);
        setEditImage(null);
        setEditImagePreview(null);
        setEditError("");
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!editingVehicle) return;

        setEditError("");

        const formData = new FormData();

        formData.append("Brand", editForm.brand.trim());
        formData.append("Model", editForm.model.trim());
        formData.append(
            "PlateNumber",
            editForm.plateNumber.trim().toUpperCase()
        );
        formData.append("ModelYear", editForm.modelYear);
        formData.append("FuelType", editForm.fuelType.trim());
        formData.append("Description", editForm.description.trim());

        if (editImage) {
            formData.append("Image", editImage);
        }

        updateVehicleMutation.mutate({
            id: editingVehicle.id,
            data: formData,
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

    const handleEditImageChange = (file: File | undefined) => {
        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            setEditError("Sadece JPG, PNG ve WEBP formatları yüklenebilir.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setEditError("Görsel boyutu en fazla 10 MB olabilir.");
            return;
        }

        if (editImagePreview?.startsWith("blob:")) {
            URL.revokeObjectURL(editImagePreview);
        }

        setEditImage(file);
        setEditImagePreview(URL.createObjectURL(file));
        setEditError("");
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
            <main className="max-w-7xl mx-auto px-5 sm:px-6 py-8 lg:py-10">

                {/* Sayfa başlığı */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-9">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-[#974CE0] font-semibold mb-2">
                            <Car size={17} />
                            AİLE GARAJI
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-[#240046]">
                            Araçlar
                        </h1>

                        <p className="text-gray-500 mt-2">
                            Ailene ait araçları görüntüle ve yönet.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate("/vehicles/create")}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#5A189A] text-white font-semibold shadow-lg shadow-purple-200 hover:bg-[#240046] hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <Plus size={19} />
                        Yeni Araç Ekle
                    </button>
                </div>

                {/* İstatistikler */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Toplam Araç
                                </p>
                                <p className="text-3xl font-bold text-[#240046] mt-2">
                                    {vehicles?.length ?? 0}
                                </p>
                            </div>

                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Car className="text-[#5A189A]" size={23} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Farklı Marka
                                </p>
                                <p className="text-3xl font-bold text-[#240046] mt-2">
                                    {new Set(vehicles?.map((v) => v.brand)).size}
                                </p>
                            </div>

                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Sparkles className="text-[#5A189A]" size={23} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Toplam Kilometre
                                </p>
                                <p className="text-3xl font-bold text-[#240046] mt-2">
                                    {(vehicles ?? [])
                                        .reduce((total, vehicle) => total + vehicle.currentMileage, 0)
                                        .toLocaleString("tr-TR")}
                                    <span className="text-sm font-medium text-gray-400 ml-1">
                                        km
                                    </span>
                                </p>
                            </div>

                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Gauge className="text-[#5A189A]" size={23} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Arama alanı */}
                <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-7 shadow-sm">
                    <div className="relative">
                        <Search
                            size={19}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Marka, model veya plaka ile araç ara..."
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#974CE0] transition"
                        />
                    </div>
                </div>

                {/* Araç listesi */}
                {!vehicles || vehicles.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
                        <div className="w-20 h-20 rounded-3xl bg-purple-100 flex items-center justify-center mx-auto mb-5">
                            <Car className="text-[#5A189A]" size={36} />
                        </div>

                        <h3 className="text-xl font-bold text-[#240046] mb-2">
                            Henüz araç eklenmemiş
                        </h3>

                        <p className="text-gray-500 mb-7">
                            Ailene ait ilk aracı ekleyerek garajını oluşturmaya başlayabilirsin.
                        </p>

                        <button
                            onClick={() => navigate("/vehicles/create")}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#5A189A] text-white font-semibold hover:bg-[#240046] transition"
                        >
                            <Plus size={18} />
                            İlk Aracı Ekle
                        </button>
                    </div>
                ) : filteredVehicles.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <Search size={34} className="text-gray-300 mx-auto mb-4" />

                        <h3 className="font-bold text-gray-800">
                            Arama sonucu bulunamadı
                        </h3>

                        <p className="text-sm text-gray-500 mt-2">
                            Farklı bir marka, model veya plaka deneyebilirsin.
                        </p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredVehicles.map((vehicle) => (
                            <div
                                key={vehicle.id}
                                className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-purple-100/60 hover:-translate-y-1 transition-all duration-300"
                            >
                                {/* Görsel */}
                                <div className="relative h-52 bg-gradient-to-br from-[#f5efff] to-[#faf8ff] overflow-hidden">
                                    {vehicle.imageUrl ? (
                                        <img
                                            src={vehicle.imageUrl}
                                            alt={`${vehicle.brand} ${vehicle.model}`}
                                            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Car
                                                size={76}
                                                strokeWidth={1.2}
                                                className="text-[#974CE0]/50"
                                            />
                                        </div>
                                    )}

                                    <span className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur text-[#5A189A] text-sm font-bold shadow-sm">
                                        {vehicle.modelYear}
                                    </span>

                                    <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur text-[#240046] text-sm font-bold shadow-sm">
                                        {vehicle.plateNumber}
                                    </div>
                                </div>

                                {/* Araç bilgileri */}
                                <div className="p-5">
                                    <div className="mb-5">
                                        <h3 className="text-xl font-bold text-[#240046] group-hover:text-[#5A189A] transition-colors">
                                            {vehicle.brand} {vehicle.model}
                                        </h3>

                                        {vehicle.description && (
                                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                                {vehicle.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                                <Gauge size={15} />
                                                <span className="text-xs">
                                                    Kilometre
                                                </span>
                                            </div>

                                            <p className="font-bold text-[#240046]">
                                                {vehicle.currentMileage.toLocaleString("tr-TR")} km
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                                <Fuel size={15} />
                                                <span className="text-xs">
                                                    Yakıt Türü
                                                </span>
                                            </div>

                                            <p className="font-bold text-[#240046] truncate">
                                                {vehicle.fuelType}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-5">
                                        <button
                                            onClick={() => openEditModal(vehicle)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-purple-50 text-[#5A189A] font-semibold hover:bg-purple-100 transition-colors"
                                        >
                                            <Pencil size={16} />
                                            Düzenle
                                        </button>

                                        <button
                                            onClick={() => {
                                                setDeletingVehicle(vehicle);
                                                setDeleteError("");
                                            }}
                                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors"
                                            title="Aracı pasife al"
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="text-sm text-gray-400 mt-6 text-right">
                    {filteredVehicles.length} araç listeleniyor
                </div>
            </main>

            {/* Mevcut düzenleme ve silme modalı kodların burada aynen kalacak */}


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

                            {/* Araç Görseli */}
                            <div className="mt-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Araç Görseli
                                </label>

                                <div className="flex flex-col sm:flex-row gap-5 items-start">
                                    <div className="w-full sm:w-56 h-36 rounded-xl overflow-hidden bg-purple-50 border border-gray-200 flex items-center justify-center">
                                        {editImagePreview ? (
                                            <img
                                                src={editImagePreview}
                                                alt="Araç görseli"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Car size={42} className="text-[#5A189A]" />
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <label className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-purple-50 text-[#5A189A] font-semibold cursor-pointer hover:bg-purple-100 transition">
                                            <Pencil size={17} />
                                            Görseli Değiştir

                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                className="hidden"
                                                onChange={(e) =>
                                                    handleEditImageChange(e.target.files?.[0])
                                                }
                                            />
                                        </label>

                                        <p className="text-xs text-gray-500 mt-3">
                                            JPG, PNG veya WEBP. Maksimum dosya boyutu 10 MB.
                                        </p>

                                        {editImage && (
                                            <p className="text-sm text-green-600 mt-2">
                                                Yeni görsel seçildi.
                                            </p>
                                        )}
                                    </div>
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
