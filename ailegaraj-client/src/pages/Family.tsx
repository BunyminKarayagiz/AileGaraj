
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Users,
    Copy,
    RefreshCw,
    Trash2,
    Loader2,
    Shield,
    User,
    Settings,
    Save,
    X,
    Mail,
    Phone,
    CalendarDays,
    Crown,
    UserRound,
    LogOut,
} from "lucide-react";

import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import api from "../services/api";

// Types

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
    email: string;
    phoneNumber: string | null;
    role: string;
    joinedAt: string;
    isCurrentUser: boolean;
}

interface InvitationResponse {
    inviteCode: string;
    createdAt: string;
    expiresAt: string;
}

interface MemberPermission {
    permissionCode: string;
    isAllowed: boolean;
}

interface UpdatePermissionsRequest {
    permissions: MemberPermission[];
}

// İzin grupları

const permissionGroups = [
    {
        title: "Araç İşlemleri",
        permissions: [
            {
                code: "Vehicle.View",
                label: "Araçları görüntüleyebilir",
            },
            {
                code: "Vehicle.Edit",
                label: "Araç bilgilerini düzenleyebilir",
            },
        ],
    },
    {
        title: "Rezervasyon İşlemleri",
        permissions: [
            {
                code: "Reservation.Create",
                label: "Rezervasyon oluşturabilir",
            },
            {
                code: "Reservation.ViewOwn",
                label: "Kendi rezervasyonlarını görüntüleyebilir",
            },
            {
                code: "Reservation.ViewOthers",
                label: "Diğer üyelerin rezervasyonlarını görüntüleyebilir",
            },
            {
                code: "Reservation.EditOwn",
                label: "Kendi rezervasyonlarını düzenleyebilir",
            },
            {
                code: "Reservation.EditOthers",
                label: "Diğer üyelerin rezervasyonlarını düzenleyebilir",
            },
            {
                code: "Reservation.CancelOwn",
                label: "Kendi rezervasyonlarını iptal edebilir",
            },
        ],
    },
    {
        title: "Masraf İşlemleri",
        permissions: [
            {
                code: "Expense.Create",
                label: "Masraf kaydı oluşturabilir",
            },
            {
                code: "Expense.ViewOwn",
                label: "Kendi masraflarını görüntüleyebilir",
            },
            {
                code: "Expense.ViewOthers",
                label: "Diğer üyelerin masraflarını görüntüleyebilir",
            },
            {
                code: "Expense.EditOwn",
                label: "Kendi masraflarını düzenleyebilir",
            },
            {
                code: "Expense.EditOthers",
                label: "Diğer üyelerin masraflarını düzenleyebilir",
            },
        ],
    },

    {
        title: "Masraf Kategorisi İşlemleri",
        permissions: [
            {
                code: "ExpenseCategory.View",
                label: "Masraf kategorilerini görüntüleyebilir",
            },
            {
                code: "ExpenseCategory.Create",
                label: "Masraf kategorisi oluşturabilir",
            },
            {
                code: "ExpenseCategory.Edit",
                label: "Masraf kategorilerini düzenleyebilir ve pasifleştirebilir",
            },
        ],
    },
];

export default function Family() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Arayüz durumları

    const [invitation, setInvitation] =
        useState<InvitationResponse | null>(null);

    const [selectedMemberId, setSelectedMemberId] =
        useState<number | null>(null);

    const [permissionOverrides, setPermissionOverrides] =
        useState<Record<string, boolean>>({});

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Aile bilgilerini getir

    const {
        data: family,
        isLoading: isFamilyLoading,
        isError: isFamilyError,
    } = useQuery({
        queryKey: ["my-family"],
        queryFn: async () => {
            const response = await api.get<FamilyResponse>(
                "/families/my-family"
            );

            return response.data;
        },
    });

    // Aile üyelerini getir

    const {
        data: members = [],
        isLoading: isMembersLoading,
        isError: isMembersError,
    } = useQuery({
        queryKey: ["family-members", family?.id],
        queryFn: async () => {
            const response = await api.get<FamilyMember[]>(
                `/families/${family!.id}/members`
            );

            return response.data;
        },
        enabled: !!family?.id,
    });

    const isAdmin = family?.role === "FamilyAdmin";

    // Seçilen üyenin izinlerini getir

    const {
        data: memberPermissions = [],
        isLoading: isPermissionsLoading,
        isError: isPermissionsError,
    } = useQuery({
        queryKey: [
            "member-permissions",
            family?.id,
            selectedMemberId,
        ],
        queryFn: async () => {
            const response = await api.get<MemberPermission[]>(
                `/families/${family!.id}/members/${selectedMemberId}/permissions`
            );

            return response.data;
        },
        enabled: !!family?.id && selectedMemberId !== null,
    });

    // Davetiye oluşturma

    const createInvitationMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post<InvitationResponse>(
                `/families/${family!.id}/invitations`
            );

            return response.data;
        },

        onMutate: () => {
            setError("");
            setSuccess("");
            setInvitation(null);
        },

        onSuccess: (data) => {
            setInvitation(data);
            setSuccess("Davet kodu başarıyla oluşturuldu.");
        },

        onError: () => {
            setError("Davet kodu oluşturulamadı.");
        },
    });

    // Üye izinlerini güncelleme

    const updatePermissionsMutation = useMutation({
        mutationFn: async ({
            memberId,
            permissions,
        }: {
            memberId: number;
            permissions: MemberPermission[];
        }) => {
            const request: UpdatePermissionsRequest = {
                permissions,
            };

            await api.put(
                `/families/${family!.id}/members/${memberId}/permissions`,
                request
            );
        },

        onMutate: () => {
            setError("");
            setSuccess("");
        },

        onSuccess: async () => {
            setSuccess("Üye izinleri başarıyla güncellendi.");

            await queryClient.invalidateQueries({
                queryKey: [
                    "member-permissions",
                    family!.id,
                    selectedMemberId,
                ],
            });

            setPermissionOverrides({});
        },

        onError: () => {
            setError("Üye izinleri güncellenirken bir hata oluştu.");
        },
    });

    // Üye rolünü değiştirme

    const changeRoleMutation = useMutation({
        mutationFn: async ({
            memberId,
            newRole,
        }: {
            memberId: number;
            newRole: string;
        }) => {
            await api.put(
                `/families/${family!.id}/members/${memberId}/role`,
                { role: newRole }
            );
        },

        onMutate: () => {
            setError("");
            setSuccess("");
        },

        onSuccess: async () => {
            setSuccess("Üye rolü güncellendi.");

            await queryClient.invalidateQueries({
                queryKey: ["family-members", family!.id],
            });
        },

        onError: () => {
            setError("Üye rolü değiştirilirken bir hata oluştu.");
        },
    });

    // Üyeyi aileden çıkarma

    const removeMemberMutation = useMutation({
        mutationFn: async (memberId: number) => {
            await api.delete(
                `/families/${family!.id}/members/${memberId}`
            );
        },

        onMutate: () => {
            setError("");
            setSuccess("");
        },

        onSuccess: async () => {
            setSuccess("Üye aileden çıkarıldı.");

            await queryClient.invalidateQueries({
                queryKey: ["family-members", family!.id],
            });
        },

        onError: () => {
            setError("Üye aileden çıkarılırken bir hata oluştu.");
        },
    });

    // Aileden ayrılma

    const leaveFamilyMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/families/${family!.id}/leave`);
        },
        onSuccess: async () => {
            queryClient.setQueryData(["my-family"], null);

            queryClient.removeQueries({
                queryKey: ["family-members", family!.id],
            });

            await queryClient.invalidateQueries({
                queryKey: ["my-family"],
            });

            navigate("/dashboard", { replace: true });
        },
        onError: (err) => {
            const message = (
                err as {
                    response?: {
                        data?: { message?: string };
                    };
                }
            )?.response?.data?.message;

            setError(
                message || "Aileden ayrılırken bir hata oluştu."
            );
        },
    });

    // Davetiye oluşturma

    const handleCreateInvitation = () => {
        if (!family) return;

        createInvitationMutation.mutate();
    };

    // Davet kodunu kopyalama

    const handleCopyInvitation = async () => {
        if (!invitation) return;

        try {
            await navigator.clipboard.writeText(
                invitation.inviteCode
            );

            setSuccess("Davet kodu panoya kopyalandı.");
            setError("");
        } catch {
            setError("Davet kodu kopyalanamadı.");
        }
    };

    // Üye rolünü değiştirme

    const handleChangeRole = (
        memberId: number,
        newRole: string
    ) => {
        changeRoleMutation.mutate({
            memberId,
            newRole,
        });
    };

    // Üyeyi aileden çıkarma

    const handleRemoveMember = (member: FamilyMember) => {
        const confirmed = window.confirm(
            `${member.firstName} ${member.lastName} adlı üyeyi aileden çıkarmak istediğine emin misin?`
        );

        if (!confirmed) return;

        removeMemberMutation.mutate(member.id);
    };

    const handleLeaveFamily = () => {
        const confirmed = window.confirm(
            "Bu aileden ayrılmak istediğine emin misin? Ayrıldıktan sonra aile bilgilerine ve araçlara erişimin olmayacak."
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        leaveFamilyMutation.mutate();
    };

    // İzin modalını açma

    const handleOpenPermissions = (member: FamilyMember) => {
        setError("");
        setSuccess("");
        setPermissionOverrides({});
        setSelectedMemberId(member.id);
    };

    // İzin modalını kapatma

    const handleClosePermissions = () => {
        setSelectedMemberId(null);
        setPermissionOverrides({});
    };

    // İzin değiştirme

    const handleTogglePermission = (
        permissionCode: string,
        isAllowed: boolean
    ) => {
        setPermissionOverrides((previous) => ({
            ...previous,
            [permissionCode]: isAllowed,
        }));
    };

    // İzinleri kaydetme

    const handleSavePermissions = () => {
        if (
            selectedMemberId === null ||
            isPermissionsLoading ||
            updatePermissionsMutation.isPending
        ) {
            return;
        }

        const updatedPermissions = memberPermissions.map(
            (permission) => ({
                ...permission,
                isAllowed:
                    permissionOverrides[permission.permissionCode] ??
                    permission.isAllowed,
            })
        );

        updatePermissionsMutation.mutate({
            memberId: selectedMemberId,
            permissions: updatedPermissions,
        });
    };

    // Sayfa yükleniyor

    if (isFamilyLoading || (family && isMembersLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f7fa]">
                <Loader2 className="w-8 h-8 animate-spin text-[#5A189A]" />
            </div>
        );
    }

    // Aile bilgisi alınamadı

    if (isFamilyError || !family) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f7fa] p-6">
                <p className="text-gray-600 mb-4">
                    Aile bilgilerine ulaşılamadı.
                </p>

                <button
                    onClick={() => navigate("/dashboard")}
                    className="text-[#5A189A] font-semibold"
                >
                    Dashboard'a dön
                </button>
            </div>
        );
    }

    // Sayfa

    return (
        <div className="min-h-screen bg-[#f8f7fa]">
            {/* Header */}

            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#240046]">
                            AileGaraj
                        </h1>

                        <p className="text-sm text-gray-500">
                            Aile yönetimi
                        </p>
                    </div>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2 text-gray-600 hover:text-[#5A189A]"
                    >
                        <ArrowLeft size={18} />
                        Dashboard
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Aile başlığı */}

                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-[#240046]">
                            {family.name}
                        </h2>

                        <p className="text-gray-500 mt-1">
                            Aile üyelerini ve davet işlemlerini buradan yönetebilirsin.
                        </p>
                    </div>

                    <button
                        onClick={handleLeaveFamily}
                        disabled={leaveFamilyMutation.isPending}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition disabled:opacity-50"
                    >
                        {leaveFamilyMutation.isPending ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <LogOut size={18} />
                        )}

                        Aileden Ayrıl
                    </button>
                </div>

                {/* Bildirimler */}

                {error && (
                    <div className="mb-5 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-5 p-4 rounded-lg bg-green-50 text-green-700 border border-green-200">
                        {success}
                    </div>
                )}

                {isMembersError && (
                    <div className="mb-5 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
                        Aile üyeleri alınırken bir hata oluştu.
                    </div>
                )}

                {/* Aile bilgileri kartları */}

                <div className="grid md:grid-cols-3 gap-5 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Users className="text-[#5A189A]" />

                            <p className="text-sm text-gray-500">
                                Toplam Üye
                            </p>
                        </div>

                        <p className="text-3xl font-bold text-[#240046]">
                            {members.length}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Shield className="text-[#5A189A]" />

                            <p className="text-sm text-gray-500">
                                Senin Rolün
                            </p>
                        </div>

                        <p className="text-xl font-bold text-[#240046]">
                            {isAdmin
                                ? "Aile Yöneticisi"
                                : "Aile Üyesi"}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <User className="text-[#5A189A]" />

                            <p className="text-sm text-gray-500">
                                Aile Numarası
                            </p>
                        </div>

                        <p className="text-3xl font-bold text-[#240046]">
                            #{family.id}
                        </p>
                    </div>
                </div>

                {/* Davetiye alanı */}

                {isAdmin && (
                    <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-[#240046]">
                                    Aileye Üye Davet Et
                                </h3>

                                <p className="text-sm text-gray-500 mt-1">
                                    Yeni bir davet kodu oluştur. Kod bir saat geçerlidir.
                                </p>
                            </div>

                            <button
                                onClick={handleCreateInvitation}
                                disabled={createInvitationMutation.isPending}
                                className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] disabled:opacity-50"
                            >
                                {createInvitationMutation.isPending ? (
                                    <Loader2
                                        size={18}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <RefreshCw size={18} />
                                )}

                                Davet Kodu Oluştur
                            </button>
                        </div>

                        {invitation && (
                            <div className="mt-6 p-5 rounded-lg bg-purple-50 border border-purple-100">
                                <p className="text-sm text-gray-600 mb-2">
                                    Oluşturulan davet kodu
                                </p>

                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-2xl font-bold tracking-widest text-[#5A189A]">
                                        {invitation.inviteCode}
                                    </span>

                                    <button
                                        onClick={handleCopyInvitation}
                                        className="flex items-center gap-2 px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm text-[#5A189A] hover:bg-purple-100"
                                    >
                                        <Copy size={16} />
                                        Kopyala
                                    </button>
                                </div>

                                <p className="text-xs text-gray-500 mt-3">
                                    Son kullanma:{" "}
                                    {new Date(
                                        invitation.expiresAt
                                    ).toLocaleString("tr-TR")}
                                </p>
                            </div>
                        )}
                    </section>
                )}

                {/* Aile üyeleri */}


                {/* Aile Üyeleri */}
                <section className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Aile Üyeleri
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Aile hesabına bağlı üyeleri buradan yönetebilirsin.
                            </p>
                        </div>

                        <span className="w-fit rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-sm font-semibold">
                            {members?.length ?? 0} Üye
                        </span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        {members?.map((member) => {
                            const fullName =
                                `${member.firstName} ${member.lastName}`.trim();

                            const initials =
                                `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`
                                    .toUpperCase();

                            return (
                                <div
                                    key={member.id}
                                    className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#5A189A] to-[#974CE0] flex items-center justify-center text-white text-lg font-bold shadow-md shadow-purple-200">
                                                {initials || "?"}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-bold text-gray-900 truncate">
                                                        {fullName || "İsimsiz Üye"}
                                                    </h3>

                                                    {member.isCurrentUser && (
                                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                                                            Sen
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5 mt-1">
                                                    {member.role === "FamilyAdmin" ? (
                                                        <Crown size={14} className="text-amber-500" />
                                                    ) : (
                                                        <UserRound size={14} className="text-gray-400" />
                                                    )}

                                                    <span className="text-xs font-medium text-gray-500">
                                                        {member.role === "FamilyAdmin"
                                                            ? "Aile Yöneticisi"
                                                            : "Aile Üyesi"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <Mail size={16} className="text-purple-500 shrink-0" />
                                            <span className="truncate">
                                                {member.email || "E-posta bilgisi yok"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <Phone size={16} className="text-purple-500 shrink-0" />
                                            <span>
                                                {member.phoneNumber || "Telefon eklenmemiş"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <CalendarDays size={16} className="text-purple-500 shrink-0" />
                                            <span>
                                                Katılım: {new Date(member.joinedAt).toLocaleDateString("tr-TR")}
                                            </span>
                                        </div>
                                    </div>

                                    {isAdmin && !member.isCurrentUser && (
                                        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <Shield size={16} className="text-gray-400" />

                                                <select
                                                    value={member.role}
                                                    onChange={(e) =>
                                                        handleChangeRole(member.id, e.target.value)
                                                    }
                                                    className="text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                                                >
                                                    <option value="FamilyMember">
                                                        Aile Üyesi
                                                    </option>
                                                    <option value="FamilyAdmin">
                                                        Yönetici
                                                    </option>
                                                </select>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {member.role === "FamilyMember" && (
                                                    <button
                                                        onClick={() => handleOpenPermissions(member)}
                                                        className="p-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                                                        title="Yetkileri düzenle"
                                                    >
                                                        <Settings size={18} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleRemoveMember(member)}
                                                    className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                    title="Üyeyi aileden çıkar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

            </main>

            {/* İzin yönetimi modalı */}

            {selectedMemberId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col">
                        {/* Modal başlığı */}

                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h3 className="text-xl font-bold text-[#240046]">
                                    Üye İzinlerini Yönet
                                </h3>

                                <p className="text-sm text-gray-500 mt-1">
                                    Üyenin erişebileceği işlemleri belirle.
                                </p>
                            </div>

                            <button
                                onClick={handleClosePermissions}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                                title="Kapat"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal içeriği */}

                        <div className="p-6 overflow-y-auto">
                            {isPermissionsLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#5A189A]" />
                                </div>
                            ) : isPermissionsError ? (
                                <div className="p-4 rounded-lg bg-red-50 text-red-700">
                                    Üye izinleri alınırken bir hata oluştu.
                                </div>
                            ) : (
                                <div className="space-y-7">
                                    {permissionGroups.map((group) => (
                                        <div key={group.title}>
                                            <h4 className="font-semibold text-[#240046] mb-3">
                                                {group.title}
                                            </h4>

                                            <div className="space-y-3">
                                                {group.permissions.map((item) => {
                                                    const currentPermission =
                                                        memberPermissions.find(
                                                            (permission) =>
                                                                permission.permissionCode ===
                                                                item.code
                                                        );

                                                    const isAllowed =
                                                        permissionOverrides[item.code] ??
                                                        currentPermission?.isAllowed ??
                                                        false;

                                                    return (
                                                        <label
                                                            key={item.code}
                                                            className="flex items-center justify-between gap-4 p-3 rounded-lg border border-gray-100 hover:bg-purple-50 cursor-pointer"
                                                        >
                                                            <span className="text-sm text-gray-700">
                                                                {item.label}
                                                            </span>

                                                            <input
                                                                type="checkbox"
                                                                checked={isAllowed}
                                                                onChange={(e) =>
                                                                    handleTogglePermission(
                                                                        item.code,
                                                                        e.target.checked
                                                                    )
                                                                }
                                                                className="w-5 h-5 accent-[#5A189A] cursor-pointer"
                                                            />
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal alt bölümü */}

                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                            <button
                                onClick={handleClosePermissions}
                                disabled={updatePermissionsMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <X size={17} />
                                İptal
                            </button>

                            <button
                                onClick={handleSavePermissions}
                                disabled={
                                    isPermissionsLoading ||
                                    isPermissionsError ||
                                    updatePermissionsMutation.isPending
                                }
                                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#5A189A] text-white font-semibold hover:bg-[#240046] disabled:opacity-50"
                            >
                                {updatePermissionsMutation.isPending ? (
                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Save size={17} />
                                )}

                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
