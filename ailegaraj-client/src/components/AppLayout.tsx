
import { useState } from "react";
import {
    LayoutDashboard,
    Users,
    CarFront,
    CalendarDays,
    Receipt,
    ChartNoAxesCombined,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    House,
    ShieldCheck,
    Activity,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const userNavigation = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Aile Yönetimi", path: "/family", icon: Users },
    { name: "Araçlar", path: "/vehicles", icon: CarFront },
    { name: "Rezervasyonlar", path: "/reservations", icon: CalendarDays },
    { name: "Giderler", path: "/expenses", icon: Receipt },
    { name: "Raporlar", path: "/reports", icon: ChartNoAxesCombined },
];

const adminNavigation = [
    { name: "Genel Bakış", path: "/admin", icon: LayoutDashboard },
    { name: "Kullanıcılar", path: "/admin/users", icon: Users },
    { name: "Aileler", path: "/admin/families", icon: House },
    { name: "Araçlar", path: "/admin/vehicles", icon: CarFront },
    { name: "Rezervasyonlar", path: "/admin/reservations", icon: CalendarDays },
    { name: "Giderler ve Finans", path: "/admin/expenses", icon: Receipt },
    { name: "Sistem Kayıtları", path: "/admin/logs", icon: Activity },
];

export default function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const { user, logout } = useAuth();
    const location = useLocation();

    const isSuperAdmin =
        user?.roles?.includes("SuperAdmin") ?? false;

    const navigation = isSuperAdmin
        ? adminNavigation
        : userNavigation;

    const currentPage = navigation.find(
        (item) => item.path === location.pathname
    );

    const handleLogout = async () => {
        await logout();
    };

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className="h-20 flex items-center px-6 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-[#E1FF00] flex items-center justify-center shrink-0">
                    <CarFront className="text-[#240046]" size={25} />
                </div>

                {!collapsed && (
                    <div className="ml-3">
                        <h1 className="text-xl font-bold text-white tracking-tight">
                            AileGaraj
                        </h1>
                        <p className="text-xs text-purple-300">
                            {isSuperAdmin ? "Platform Management" : "Family Management"}
                        </p>
                    </div>
                )}
            </div>

            <div className="px-4 pt-8">
                {!collapsed && (
                    <p className="text-[11px] font-semibold text-purple-300/60 uppercase tracking-widest px-3 mb-4">
                        {isSuperAdmin ? "Yönetim" : "Menü"}
                    </p>
                )}

                <nav className="space-y-2">
                    {navigation.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === "/admin"}
                                onClick={() => setMobileOpen(false)}
                                title={collapsed ? item.name : undefined}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? "bg-[#E1FF00] text-[#240046] shadow-lg shadow-black/10"
                                        : "text-purple-100/70 hover:bg-white/10 hover:text-white"
                                    }`
                                }
                            >
                                <Icon size={21} className="shrink-0" />

                                {!collapsed && (
                                    <span className="text-sm font-medium">
                                        {item.name}
                                    </span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    title={collapsed ? "Çıkış Yap" : undefined}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-purple-100/70 hover:bg-red-500/15 hover:text-red-300 transition"
                >
                    <LogOut size={21} />
                    {!collapsed && (
                        <span className="text-sm font-medium">
                            Çıkış Yap
                        </span>
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F7F7FB] flex">
            {/* Desktop Sidebar */}
            <motion.aside
                animate={{ width: collapsed ? 88 : 260 }}
                transition={{ duration: 0.25 }}
                className="sticky top-0 z-40 hidden h-screen shrink-0 self-start overflow-visible bg-[#240046] lg:block relative"
            >
                {sidebarContent}

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute top-1/2 -right-4 z-50 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-purple-200 bg-[#E1FF00] text-[#240046] shadow-lg transition hover:scale-110 lg:flex"
                >
                    {collapsed ? (
                        <ChevronRight size={16} />
                    ) : (
                        <ChevronLeft size={16} />
                    )}
                </button>
            </motion.aside>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                        />

                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ duration: 0.25 }}
                            className="fixed left-0 top-0 bottom-0 w-[260px] bg-[#240046] z-50 lg:hidden"
                        >
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="absolute top-6 right-4 text-white"
                            >
                                <X size={22} />
                            </button>

                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-5 lg:px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                        >
                            <Menu size={23} />
                        </button>

                        <div>
                            <h2 className="text-lg font-bold text-[#240046]">
                                {currentPage?.name || "AileGaraj"}
                            </h2>
                            <p className="text-xs text-gray-400 hidden sm:block">
                                {isSuperAdmin
                                    ? "Platform yönetim paneli"
                                    : "Aile araç yönetim platformu"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isSuperAdmin && (
                            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-[#5A189A]">
                                <ShieldCheck size={15} />
                                <span className="text-xs font-semibold">
                                    Super Admin
                                </span>
                            </div>
                        )}

                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-[#5A189A] font-bold">
                            {user?.firstName?.charAt(0)}
                            {user?.lastName?.charAt(0)}
                        </div>

                        <div className="hidden sm:block">
                            <p className="text-sm font-semibold text-gray-800">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-xs text-gray-400">
                                {isSuperAdmin ? "Sistem Yöneticisi" : "Kullanıcı"}
                            </p>
                        </div>
                    </div>
                </header>

                <main className="p-5 lg:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
