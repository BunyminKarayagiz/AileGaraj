
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

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-[#240046]">
                        {family.name}
                    </h2>

                    <p className="text-gray-500 mt-1">
                        Aile üyelerini ve davet işlemlerini buradan yönetebilirsin.
                    </p>
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

                <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-[#240046]">
                            Aile Üyeleri
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                            Ailene kayıtlı aktif üyeler.
                        </p>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                            >
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        {member.firstName}{" "}
                                        {member.lastName}

                                        {member.isCurrentUser && (
                                            <span className="ml-2 text-xs text-[#5A189A]">
                                                (Sen)
                                            </span>
                                        )}
                                    </p>

                                    <p className="text-sm text-gray-500 mt-1">
                                        Katılım:{" "}
                                        {new Date(
                                            member.joinedAt
                                        ).toLocaleDateString("tr-TR")}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    {isAdmin && !member.isCurrentUser ? (
                                        <select
                                            value={member.role}
                                            disabled={changeRoleMutation.isPending}
                                            onChange={(e) =>
                                                handleChangeRole(
                                                    member.id,
                                                    e.target.value
                                                )
                                            }
                                            className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#974CE0] disabled:opacity-50"
                                        >
                                            <option value="FamilyMember">
                                                Aile Üyesi
                                            </option>

                                            <option value="FamilyAdmin">
                                                Aile Yöneticisi
                                            </option>
                                        </select>
                                    ) : (
                                        <span className="px-3 py-2 rounded-lg bg-purple-50 text-[#5A189A] text-sm font-medium">
                                            {member.role === "FamilyAdmin"
                                                ? "Aile Yöneticisi"
                                                : "Aile Üyesi"}
                                        </span>
                                    )}

                                    {/* Üye izinlerini yönetme */}

                                    {isAdmin &&
                                        member.role === "FamilyMember" &&
                                        !member.isCurrentUser && (
                                            <button
                                                onClick={() =>
                                                    handleOpenPermissions(member)
                                                }
                                                title="Üye izinlerini yönet"
                                                className="p-2 rounded-lg text-[#5A189A] hover:bg-purple-50"
                                            >
                                                <Settings size={18} />
                                            </button>
                                        )}

                                    {/* Üyeyi çıkarma */}

                                    {isAdmin && !member.isCurrentUser && (
                                        <button
                                            onClick={() =>
                                                handleRemoveMember(member)
                                            }
                                            disabled={removeMemberMutation.isPending}
                                            title="Üyeyi aileden çıkar"
                                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {members.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                Henüz aile üyesi bulunmuyor.
                            </div>
                        )}
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
