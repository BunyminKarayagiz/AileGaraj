
import { useState, type FormEvent } from "react";
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import {
    Receipt,
    Loader2,
    Car,
    CalendarDays,
    User,
    Tag,
    Plus,
    Pencil,
    Trash2,
    X,
    Eye,
    Wallet,
    TrendingUp,
    Search,
} from "lucide-react";

import api from "../services/api";

interface Expense {
    id: number;
    vehicleId: number;
    vehicleBrand: string;
    vehicleModel: string;
    plateNumber: string;
    createdByFamilyMemberId: number;
    createdByName: string;
    paidByFamilyMemberId: number;
    paidByName: string;
    expenseCategoryId: number;
    categoryName: string;
    amount: number;
    expenseDate: string;
    description: string | null;
    createdAt: string;
    updatedAt: string | null;
}

interface MemberPermission {
    permissionCode: string;
    isAllowed: boolean;
}

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

interface ExpenseCategory {
    id: number;
    name: string;
    createdAt: string;
}

interface FamilyResponse {
    id: number;
    name: string;
    role: string;
    createdAt: string;
    memberCount: number;
}

interface FamilyMember {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
    joinedAt: string;
    isCurrentUser: boolean;
}

interface ExpenseFormData {
    vehicleId: string;
    paidByFamilyMemberId: string;
    expenseCategoryId: string;
    amount: string;
    expenseDate: string;
    description: string;
}

const getToday = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const initialFormData = (): ExpenseFormData => ({
    vehicleId: "",
    paidByFamilyMemberId: "",
    expenseCategoryId: "",
    amount: "",
    expenseDate: getToday(),
    description: "",
});

const formatAmount = (amount: number) =>
    new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
    }).format(amount);

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("tr-TR");

const getErrorMessage = (error: unknown) => {
    const apiError = error as {
        response?: {
            status?: number;
            data?: {
                message?: string;
            };
        };
    };

    if (apiError.response?.status === 403) {
        return "Bu işlem için yetkiniz bulunmuyor.";
    }

    return (
        apiError.response?.data?.message ??
        "Bir hata oluştu. Lütfen tekrar deneyin."
    );
};

export default function Expenses() {
    const queryClient = useQueryClient();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [expenseToDeactivate, setExpenseToDeactivate] =
        useState<Expense | null>(null);

    const [formData, setFormData] =
        useState<ExpenseFormData>(initialFormData());

    const [editingExpenseId, setEditingExpenseId] =
        useState<number | null>(null);

    const [formError, setFormError] = useState("");
    const [actionError, setActionError] = useState("");
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categoryName, setCategoryName] = useState("");
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
    const [showInactiveCategories, setShowInactiveCategories] = useState(false);
    const [categoryError, setCategoryError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // Giderler
    const { data: expenses = [], isLoading: expensesLoading, error: expensesError } =
        useQuery({
            queryKey: ["expenses"],
            queryFn: async () => {
                const response = await api.get<Expense[]>("/expenses");
                return response.data;
            },
        });

    // Araçlar
    const { data: vehicles = [] } = useQuery({
        queryKey: ["vehicles"],
        queryFn: async () => {
            const response = await api.get<Vehicle[]>("/vehicles");
            return response.data;
        },
    });

    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: async () => {
            const response = await api.get<MemberPermission[]>(
                "/families/my-permissions"
            );

            return response.data;
        },
    });

    const hasPermission = (permissionCode: string) => {
        return permissions.some(
            (permission) =>
                permission.permissionCode === permissionCode &&
                permission.isAllowed
        );
    };

    const canViewCategories = hasPermission("ExpenseCategory.View");
    const canCreateCategories = hasPermission("ExpenseCategory.Create");
    const canEditCategories = hasPermission("ExpenseCategory.Edit");

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

    const { data: allCategories = [] } = useQuery({
        queryKey: ["all-expense-categories"],
        queryFn: async () => {
            const response = await api.get<ExpenseCategory[]>(
                "/expensecategories?includeInactive=true"
            );
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

    // Gider oluşturma / düzenleme
    const saveMutation = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number | null;
            data: ExpenseFormData;
        }) => {
            const payload = {
                vehicleId: Number(data.vehicleId),
                paidByFamilyMemberId: Number(data.paidByFamilyMemberId),
                expenseCategoryId: Number(data.expenseCategoryId),
                amount: Number(data.amount),
                expenseDate: data.expenseDate,
                description: data.description.trim() || null,
            };

            if (id) {
                return api.put(`/expenses/${id}`, payload);
            }

            return api.post("/expenses", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            closeForm();
        },
        onError: (error) => {
            setFormError(getErrorMessage(error));
        },
    });

    // Gider pasifleştirme
    const deactivateMutation = useMutation({
        mutationFn: async (id: number) => {
            return api.delete(`/expenses/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            setExpenseToDeactivate(null);
            setSelectedExpense(null);
            setActionError("");
        },
        onError: (error) => {
            setActionError(getErrorMessage(error));
            setExpenseToDeactivate(null);
        },
    });

    // Kategori oluşturma / düzenleme
    const saveCategoryMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                name: categoryName.trim(),
            };

            if (editingCategoryId) {
                return api.put(
                    `/expensecategories/${editingCategoryId}`,
                    payload
                );
            }

            return api.post("/expensecategories", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["expense-categories"],
            });

            queryClient.invalidateQueries({
                queryKey: ["all-expense-categories"],
            });

            setCategoryName("");
            setEditingCategoryId(null);
            setCategoryError("");
        },
        onError: (error) => {
            setCategoryError(getErrorMessage(error));
        },
    });

    // Kategori pasifleştirme
    const deactivateCategoryMutation = useMutation({
        mutationFn: async (id: number) => {
            return api.delete(`/expensecategories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["expense-categories"],
            });

            queryClient.invalidateQueries({
                queryKey: ["all-expense-categories"],
            });
        },
        onError: (error) => {
            setCategoryError(getErrorMessage(error));
        },
    });

    // Kategori yeniden aktifleştirme
    const activateCategoryMutation = useMutation({
        mutationFn: async (id: number) => {
            return api.patch(`/expensecategories/${id}/activate`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["expense-categories"],
            });

            queryClient.invalidateQueries({
                queryKey: ["all-expense-categories"],
            });
        },
        onError: (error) => {
            setCategoryError(getErrorMessage(error));
        },
    });



    function closeForm() {
        setIsFormOpen(false);
        setEditingExpenseId(null);
        setFormData(initialFormData());
        setFormError("");
    }

    function openCreateForm() {
        setEditingExpenseId(null);
        setFormData(initialFormData());
        setFormError("");
        setIsFormOpen(true);
    }

    function openEditForm(expense: Expense) {
        setEditingExpenseId(expense.id);

        setFormData({
            vehicleId: String(expense.vehicleId),
            paidByFamilyMemberId: String(expense.paidByFamilyMemberId),
            expenseCategoryId: String(expense.expenseCategoryId),
            amount: String(expense.amount),
            expenseDate: expense.expenseDate.slice(0, 10),
            description: expense.description ?? "",
        });

        setFormError("");
        setSelectedExpense(null);
        setIsFormOpen(true);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError("");

        saveMutation.mutate({
            id: editingExpenseId,
            data: formData,
        });
    }

    function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!categoryName.trim()) {
            setCategoryError("Kategori adı boş bırakılamaz.");
            return;
        }

        setCategoryError("");
        saveCategoryMutation.mutate();
    }

    function openCategoryEdit(category: ExpenseCategory) {
        setEditingCategoryId(category.id);
        setCategoryName(category.name);
        setCategoryError("");
    }

    function resetCategoryForm() {
        setEditingCategoryId(null);
        setCategoryName("");
        setCategoryError("");
    }

    const isSaving = saveMutation.isPending;

    const totalExpense = expenses.reduce(
        (total, expense) => total + expense.amount,
        0
    );

    const currentMonthExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.expenseDate);
        const now = new Date();

        return (
            expenseDate.getMonth() === now.getMonth() &&
            expenseDate.getFullYear() === now.getFullYear()
        );
    });

    const monthlyExpense = currentMonthExpenses.reduce(
        (total, expense) => total + expense.amount,
        0
    );

    const filteredExpenses = expenses.filter((expense) => {
        const search = searchTerm.toLocaleLowerCase("tr-TR").trim();

        if (!search) return true;

        return [
            expense.categoryName,
            expense.vehicleBrand,
            expense.vehicleModel,
            expense.plateNumber,
            expense.paidByName,
            expense.createdByName,
            expense.description ?? "",
        ].some((value) =>
            value.toLocaleLowerCase("tr-TR").includes(search)
        );
    });

    return (
        <div className="min-h-full bg-[#f7f5fa]">
            <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

                {/* Page heading */}
                <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#974CE0]">
                            <span className="h-2 w-2 rounded-full bg-[#E1FF00]" />
                            AİLE GARAJI
                            <span className="text-gray-300">/</span>
                            FİNANSAL TAKİP
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-[#240046] sm:text-4xl">
                            Gider Yönetimi
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
                            Aile araçlarına ait harcamaları takip et, giderleri
                            kategorilere ayır ve tüm ödemeleri tek yerden yönet.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {canViewCategories && (
                            <button
                                onClick={() => {
                                    setIsCategoryModalOpen(true);
                                    resetCategoryForm();
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#974CE0]/40 hover:bg-purple-50 hover:text-[#5A189A]"
                            >
                                <Tag size={18} />
                                Kategoriler
                            </button>
                        )}

                        <button
                            onClick={openCreateForm}
                            disabled={vehicles.length === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5A189A] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/15 transition hover:-translate-y-0.5 hover:bg-[#240046] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={19} />
                            Gider Ekle
                        </button>
                    </div>
                </div>

                {/* Action error */}
                {actionError && (
                    <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <span>{actionError}</span>
                        <button
                            onClick={() => setActionError("")}
                            className="rounded-lg p-1 transition hover:bg-red-100"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Statistics */}
                <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="group rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Toplam gider
                                </p>
                                <p className="mt-3 text-2xl font-bold tracking-tight text-[#5A189A] sm:text-3xl">
                                    {formatAmount(totalExpense)}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    Tüm gider kayıtlarının toplamı
                                </p>
                            </div>
                            <div className="rounded-xl bg-purple-50 p-3 text-[#5A189A] transition group-hover:bg-[#5A189A] group-hover:text-white">
                                <Wallet size={23} />
                            </div>
                        </div>
                    </div>

                    <div className="group rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Bu ayki gider
                                </p>
                                <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
                                    {formatAmount(monthlyExpense)}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    {currentMonthExpenses.length} gider kaydı
                                </p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                                <TrendingUp size={23} />
                            </div>
                        </div>
                    </div>

                    <div className="group rounded-2xl border border-amber-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:col-span-2 xl:col-span-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Gider kayıtları
                                </p>
                                <p className="mt-3 text-3xl font-bold text-amber-600">
                                    {expenses.length}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    Sistemdeki toplam kayıt sayısı
                                </p>
                            </div>
                            <div className="rounded-xl bg-amber-50 p-3 text-amber-600 transition group-hover:bg-amber-500 group-hover:text-white">
                                <Receipt size={23} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expense list */}
                <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
                    <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 sm:p-6 lg:flex-row lg:items-center">
                        <div>
                            <h2 className="font-bold text-[#240046]">
                                Gider kayıtları
                            </h2>
                            <p className="mt-1 text-sm text-gray-400">
                                Aile araçlarına ait tüm harcamalar
                            </p>
                        </div>

                        <div className="relative w-full lg:max-w-sm">
                            <Search
                                size={18}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Kategori, araç, plaka veya kişi ara..."
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#974CE0] focus:bg-white focus:ring-4 focus:ring-purple-100"
                            />
                        </div>
                    </div>

                    {/* Loading */}
                    {expensesLoading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2
                                size={32}
                                className="animate-spin text-[#5A189A]"
                            />
                            <p className="mt-3 text-sm text-gray-400">
                                Giderler yükleniyor...
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {expensesError && (
                        <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                            Giderler yüklenirken bir hata oluştu.
                        </div>
                    )}

                    {/* Empty state */}
                    {!expensesLoading &&
                        !expensesError &&
                        expenses.length === 0 && (
                            <div className="px-6 py-20 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-[#974CE0]">
                                    <Receipt size={30} />
                                </div>

                                <h3 className="font-bold text-[#240046]">
                                    Henüz gider kaydı bulunmuyor
                                </h3>

                                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                                    İlk gider kaydını oluşturarak araç harcamalarını
                                    takip etmeye başlayabilirsin.
                                </p>

                                <button
                                    onClick={openCreateForm}
                                    disabled={vehicles.length === 0}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#5A189A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#240046] disabled:opacity-50"
                                >
                                    <Plus size={17} />
                                    İlk Gideri Ekle
                                </button>
                            </div>
                        )}

                    {/* Search empty state */}
                    {!expensesLoading &&
                        !expensesError &&
                        expenses.length > 0 &&
                        filteredExpenses.length === 0 && (
                            <div className="px-6 py-16 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                                    <Search size={25} />
                                </div>
                                <h3 className="font-semibold text-[#240046]">
                                    Sonuç bulunamadı
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Arama kriterlerine uygun bir gider kaydı bulunamadı.
                                </p>
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="mt-4 text-sm font-semibold text-[#5A189A] hover:underline"
                                >
                                    Aramayı temizle
                                </button>
                            </div>
                        )}

                    {/* Expense cards */}
                    {!expensesLoading &&
                        !expensesError &&
                        filteredExpenses.length > 0 && (
                            <div className="grid grid-cols-1 gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
                                {filteredExpenses.map((expense) => (
                                    <article
                                        key={expense.id}
                                        onClick={() => setSelectedExpense(expense)}
                                        className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-900/5"
                                    >
                                        {/* Card top */}
                                        <div className="flex items-start justify-between gap-3 p-5">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5A189A] transition group-hover:bg-[#5A189A] group-hover:text-white">
                                                    <Receipt size={21} />
                                                </div>

                                                <div className="min-w-0">
                                                    <h3 className="truncate font-bold text-[#240046]">
                                                        {expense.categoryName}
                                                    </h3>
                                                    <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                                                        <CalendarDays size={12} />
                                                        {formatDate(expense.expenseDate)}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="shrink-0 rounded-xl bg-purple-50 px-3 py-2 text-sm font-bold text-[#5A189A]">
                                                {formatAmount(expense.amount)}
                                            </span>
                                        </div>

                                        {/* Vehicle */}
                                        <div className="mx-5 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#974CE0] shadow-sm">
                                                <Car size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-gray-700">
                                                    {expense.vehicleBrand} {expense.vehicleModel}
                                                </p>
                                                <p className="mt-0.5 text-xs font-medium tracking-wide text-gray-400">
                                                    {expense.plateNumber}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Expense information */}
                                        <div className="space-y-3 px-5 py-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="flex items-center gap-2 text-xs text-gray-400">
                                                    <User size={15} />
                                                    Ödemeyi yapan
                                                </span>
                                                <span className="truncate text-sm font-medium text-gray-700">
                                                    {expense.paidByName}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-3">
                                                <span className="flex items-center gap-2 text-xs text-gray-400">
                                                    <Tag size={15} />
                                                    Kaydı oluşturan
                                                </span>
                                                <span className="truncate text-sm font-medium text-gray-700">
                                                    {expense.createdByName}
                                                </span>
                                            </div>

                                            {expense.description && (
                                                <p className="line-clamp-2 border-t border-gray-100 pt-3 text-xs leading-5 text-gray-500">
                                                    {expense.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/70 px-5 py-3">
                                            <button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setSelectedExpense(expense);
                                                }}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-[#5A189A]"
                                            >
                                                <Eye size={16} />
                                                Detaylar
                                            </button>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        openEditForm(expense);
                                                    }}
                                                    className="rounded-lg p-2 text-gray-400 transition hover:bg-purple-100 hover:text-[#5A189A]"
                                                    title="Düzenle"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setExpenseToDeactivate(expense);
                                                    }}
                                                    className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                                    title="Pasifleştir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}

                    {/* Footer */}
                    {!expensesLoading &&
                        !expensesError &&
                        expenses.length > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/70 px-5 py-4">
                                <p className="text-xs text-gray-500">
                                    {filteredExpenses.length} / {expenses.length} gider gösteriliyor
                                </p>
                                <p className="text-xs font-medium text-gray-400">
                                    Toplam: {formatAmount(
                                        filteredExpenses.reduce(
                                            (total, expense) => total + expense.amount,
                                            0
                                        )
                                    )}
                                </p>
                            </div>
                        )}
                </section>
            </main>

            {/* Category Management Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">

                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-[#240046]">
                                Kategori Yönetimi
                            </h3>

                            <button
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="p-2 rounded-lg hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">

                            {/* Category Form */}

                            {canCreateCategories && (
                                <form
                                    onSubmit={handleCategorySubmit}
                                    className="bg-purple-50 rounded-xl p-4 space-y-3"
                                >
                                    <h4 className="font-semibold text-[#240046]">
                                        {editingCategoryId
                                            ? "Kategori Düzenle"
                                            : "Yeni Kategori"}
                                    </h4>

                                    <input
                                        type="text"
                                        maxLength={100}
                                        required
                                        value={categoryName}
                                        onChange={(e) => setCategoryName(e.target.value)}
                                        placeholder="Kategori adı"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#5A189A] bg-white"
                                    />

                                    {categoryError && (
                                        <div className="text-sm text-red-600">
                                            {categoryError}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={saveCategoryMutation.isPending}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] disabled:opacity-60 transition"
                                        >
                                            {saveCategoryMutation.isPending && (
                                                <Loader2 size={17} className="animate-spin" />
                                            )}

                                            {editingCategoryId
                                                ? "Değişiklikleri Kaydet"
                                                : "Kategori Ekle"}
                                        </button>

                                        {editingCategoryId && (
                                            <button
                                                type="button"
                                                onClick={resetCategoryForm}
                                                className="px-4 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                                            >
                                                İptal
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}
                            

                            {/* Active / Inactive Toggle */}
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-gray-800">
                                    Kategoriler
                                </h4>

                                <button
                                    onClick={() =>
                                        setShowInactiveCategories(!showInactiveCategories)
                                    }
                                    className="text-sm text-[#5A189A] font-medium hover:underline"
                                >
                                    {showInactiveCategories
                                        ? "Sadece Aktifler"
                                        : "Pasifleri Göster"}
                                </button>
                            </div>

                            {/* Category List */}
                            <div className="space-y-2">
                                {allCategories
                                    .filter((category) => {
                                        const isActive = categories.some(
                                            (activeCategory) =>
                                                activeCategory.id === category.id
                                        );

                                        return showInactiveCategories
                                            ? !isActive
                                            : isActive;
                                    })
                                    .map((category) => {
                                        const isActive = categories.some(
                                            (activeCategory) =>
                                                activeCategory.id === category.id
                                        );

                                        return (
                                            <div
                                                key={category.id}
                                                className="flex items-center justify-between gap-3 p-4 border border-gray-200 rounded-xl"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-purple-50 text-[#5A189A]">
                                                        <Tag size={18} />
                                                    </div>

                                                    <div>
                                                        <p className={`font-medium ${isActive
                                                                ? "text-gray-800"
                                                                : "text-gray-400"
                                                            }`}>
                                                            {category.name}
                                                        </p>

                                                        <p className="text-xs text-gray-400">
                                                            {isActive ? "Aktif" : "Pasif"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {isActive ? (
                                                        <>
                                                            {canEditCategories && (
                                                                <>
                                                                    <button
                                                                        onClick={() =>
                                                                            openCategoryEdit(category)
                                                                        }
                                                                        className="p-2 rounded-lg text-gray-500 hover:bg-purple-50 hover:text-[#5A189A]"
                                                                        title="Düzenle"
                                                                    >
                                                                        <Pencil size={17} />
                                                                    </button>

                                                                    <button
                                                                        onClick={() => {
                                                                            if (
                                                                                window.confirm(
                                                                                    "Bu kategoriyi pasifleştirmek istiyor musunuz?"
                                                                                )
                                                                            ) {
                                                                                deactivateCategoryMutation.mutate(
                                                                                    category.id
                                                                                );
                                                                            }
                                                                        }}
                                                                        disabled={
                                                                            deactivateCategoryMutation.isPending
                                                                        }
                                                                        className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"
                                                                        title="Pasifleştir"
                                                                    >
                                                                        <Trash2 size={17} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </>
                                                    ) : (
                                                            canEditCategories && (
                                                                <button
                                                                    onClick={() =>
                                                                        activateCategoryMutation.mutate(
                                                                            category.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        activateCategoryMutation.isPending
                                                                    }
                                                                    className="px-3 py-2 rounded-lg text-sm font-medium bg-purple-50 text-[#5A189A] hover:bg-purple-100"
                                                                >
                                                                    Aktifleştir
                                                                </button>
                                                            )
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                {allCategories.filter((category) => {
                                    const isActive = categories.some(
                                        (activeCategory) =>
                                            activeCategory.id === category.id
                                    );

                                    return showInactiveCategories
                                        ? !isActive
                                        : isActive;
                                }).length === 0 && (
                                        <div className="text-center py-8 text-sm text-gray-400">
                                            {showInactiveCategories
                                                ? "Pasif kategori bulunmuyor."
                                                : "Henüz kategori oluşturulmamış."}
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create / Edit Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-[#240046]">
                                {editingExpenseId
                                    ? "Gideri Düzenle"
                                    : "Yeni Gider Oluştur"}
                            </h3>

                            <button
                                onClick={closeForm}
                                className="p-2 rounded-lg hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Vehicle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Araç
                                </label>

                                <select
                                    required
                                    value={formData.vehicleId}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            vehicleId: e.target.value,
                                        })
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#5A189A]"
                                >
                                    <option value="">Araç seçin</option>
                                    {vehicles.map((vehicle) => (
                                        <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.brand} {vehicle.model} - {vehicle.plateNumber}
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
                                    required
                                    value={formData.expenseCategoryId}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            expenseCategoryId: e.target.value,
                                        })
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#5A189A]"
                                >
                                    <option value="">Kategori seçin</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Payer */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ödemeyi Yapan Kişi
                                </label>

                                <select
                                    required
                                    value={formData.paidByFamilyMemberId}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            paidByFamilyMemberId: e.target.value,
                                        })
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#5A189A]"
                                >
                                    <option value="">Aile üyesi seçin</option>
                                    {members.map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {member.firstName} {member.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tutar (₺)
                                </label>

                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    value={formData.amount}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            amount: e.target.value,
                                        })
                                    }
                                    placeholder="Örn. 1500.50"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#5A189A]"
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Gider Tarihi
                                </label>

                                <input
                                    type="date"
                                    required
                                    value={formData.expenseDate}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            expenseDate: e.target.value,
                                        })
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#5A189A]"
                                />
                            </div>

                            {/* Description */}
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
                                    placeholder="Gider hakkında açıklama..."
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#5A189A] resize-none"
                                />
                            </div>

                            {formError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                                    {formError}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="px-5 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                                >
                                    İptal
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-5 py-3 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] disabled:opacity-60 transition"
                                >
                                    {isSaving && (
                                        <Loader2 size={18} className="animate-spin" />
                                    )}
                                    {editingExpenseId ? "Değişiklikleri Kaydet" : "Gider Oluştur"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedExpense && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-[#240046]">
                                Gider Detayı
                            </h3>

                            <button
                                onClick={() => setSelectedExpense(null)}
                                className="p-2 rounded-lg hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="text-center py-4">
                                <p className="text-sm text-gray-500">
                                    {selectedExpense.categoryName}
                                </p>
                                <h2 className="text-3xl font-bold text-[#5A189A] mt-2">
                                    {formatAmount(selectedExpense.amount)}
                                </h2>
                            </div>

                            <div className="space-y-4 border-t border-gray-100 pt-5">
                                <DetailRow
                                    icon={<Car size={18} />}
                                    label="Araç"
                                    value={`${selectedExpense.vehicleBrand} ${selectedExpense.vehicleModel} (${selectedExpense.plateNumber})`}
                                />

                                <DetailRow
                                    icon={<Tag size={18} />}
                                    label="Kategori"
                                    value={selectedExpense.categoryName}
                                />

                                <DetailRow
                                    icon={<User size={18} />}
                                    label="Ödemeyi Yapan"
                                    value={selectedExpense.paidByName}
                                />

                                <DetailRow
                                    icon={<User size={18} />}
                                    label="Kaydı Oluşturan"
                                    value={selectedExpense.createdByName}
                                />

                                <DetailRow
                                    icon={<CalendarDays size={18} />}
                                    label="Gider Tarihi"
                                    value={formatDate(selectedExpense.expenseDate)}
                                />

                                <DetailRow
                                    icon={<CalendarDays size={18} />}
                                    label="Kayıt Tarihi"
                                    value={formatDate(selectedExpense.createdAt)}
                                />
                            </div>

                            {selectedExpense.description && (
                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                        Açıklama
                                    </p>
                                    <p className="text-sm text-gray-500 whitespace-pre-wrap">
                                        {selectedExpense.description}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-3">
                                <button
                                    onClick={() => openEditForm(selectedExpense)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#5A189A] text-white hover:bg-[#240046] transition"
                                >
                                    <Pencil size={17} />
                                    Düzenle
                                </button>

                                <button
                                    onClick={() => setSelectedExpense(null)}
                                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Deactivation Confirmation Modal */}
            {expenseToDeactivate && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-xl bg-red-50 text-red-600">
                                <Trash2 size={22} />
                            </div>

                            <h3 className="text-lg font-bold text-[#240046]">
                                Gideri Pasifleştir
                            </h3>
                        </div>

                        <p className="text-gray-600 text-sm leading-6">
                            <strong>{expenseToDeactivate.categoryName}</strong>{" "}
                            kategorisindeki{" "}
                            <strong>
                                {formatAmount(expenseToDeactivate.amount)}
                            </strong>{" "}
                            tutarındaki gideri pasifleştirmek istediğinize emin misiniz?
                        </p>

                        <p className="text-xs text-gray-400 mt-3">
                            Bu işlem gideri kalıcı olarak silmez.
                        </p>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setExpenseToDeactivate(null)}
                                disabled={deactivateMutation.isPending}
                                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                            >
                                Vazgeç
                            </button>

                            <button
                                onClick={() =>
                                    deactivateMutation.mutate(expenseToDeactivate.id)
                                }
                                disabled={deactivateMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition"
                            >
                                {deactivateMutation.isPending && (
                                    <Loader2 size={17} className="animate-spin" />
                                )}
                                Pasifleştir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="text-[#974CE0] mt-0.5">{icon}</div>
            <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-700">{value}</p>
            </div>
        </div>
    );
}
