
import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Car } from "lucide-react";

import api from "../services/api";

interface CreateVehicleRequest {
    brand: string;
    model: string;
    plateNumber: string;
    modelYear: number;
    currentMileage: number;
    fuelType: string;
    description: string;
}

export default function VehicleCreate() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [plateNumber, setPlateNumber] = useState("");
    const [modelYear, setModelYear] = useState("");
    const [currentMileage, setCurrentMileage] = useState("");
    const [fuelType, setFuelType] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

    const createVehicleMutation = useMutation({
        mutationFn: async (data: CreateVehicleRequest) => {
            const response = await api.post("/vehicles", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            navigate("/vehicles");
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
                setError("Araç eklemek için gerekli izne sahip değilsin.");
            } else {
                setError(
                    message?.message ||
                    message?.title ||
                    "Araç eklenirken bir hata oluştu."
                );
            }
        },
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError("");

        createVehicleMutation.mutate({
            brand: brand.trim(),
            model: model.trim(),
            plateNumber: plateNumber.trim().toUpperCase(),
            modelYear: Number(modelYear),
            currentMileage: Number(currentMileage),
            fuelType: fuelType.trim(),
            description: description.trim(),
        });
    };

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
                        onClick={() => navigate("/vehicles")}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                    >
                        <ArrowLeft size={18} />
                        Araçlara Dön
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                        <Car className="text-[#5A189A]" size={26} />
                    </div>

                    <h2 className="text-2xl font-bold text-[#240046]">
                        Yeni Araç Ekle
                    </h2>

                    <p className="text-gray-500 mt-1">
                        Ailene ait aracın bilgilerini gir.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
                >
                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Marka
                            </label>
                            <input
                                type="text"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                placeholder="Örn. Renault"
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
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                placeholder="Örn. Clio"
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
                                value={plateNumber}
                                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                                placeholder="Örn. 20 ABC 123"
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
                                value={modelYear}
                                onChange={(e) => setModelYear(e.target.value)}
                                min="1900"
                                max="2100"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-[#974CE0]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mevcut Kilometre
                            </label>
                            <input
                                type="number"
                                value={currentMileage}
                                onChange={(e) => setCurrentMileage(e.target.value)}
                                min="0"
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
                                value={fuelType}
                                onChange={(e) => setFuelType(e.target.value)}
                                placeholder="Örn. Benzin, Dizel, Hibrit"
                                maxLength={50}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-[#974CE0]"
                            />
                        </div>
                    </div>

                    <div className="mt-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Açıklama (İsteğe bağlı)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Araç hakkında eklemek istediğin bilgiler..."
                            maxLength={500}
                            rows={4}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-[#974CE0] resize-none"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-8">
                        <button
                            type="button"
                            onClick={() => navigate("/vehicles")}
                            className="flex-1 px-5 py-3 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition"
                        >
                            İptal
                        </button>

                        <button
                            type="submit"
                            disabled={createVehicleMutation.isPending}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] transition disabled:opacity-50"
                        >
                            {createVehicleMutation.isPending && (
                                <Loader2 size={18} className="animate-spin" />
                            )}
                            Aracı Kaydet
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
