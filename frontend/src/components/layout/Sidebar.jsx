"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  CalendarCheck, 
  CreditCard, 
  GraduationCap,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  FileText,
    School,
    Menu,
    X
} from "lucide-react"
import { useState } from "react"

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-blue-500" },
    { label: "Attendance", href: "/attendance", icon: CalendarCheck, color: "text-green-500" },
    { label: "Payments", href: "/payments", icon: CreditCard, color: "text-purple-500" },
    { label: "Students", href: "/students", icon: GraduationCap, color: "text-orange-500" },
]

const bottomNavItems = [
    { label: "Settings", href: "/settings", icon: Settings, color: "text-gray-500" },
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    const toggleSidebar = () => {
        setCollapsed(!collapsed)
    }

    const handleLogout = () => {
        localStorage.removeItem("admin_token")
        localStorage.removeItem("admin_user")
        router.push("/login")
    }

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/30 backdrop-blur-[2px] z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside 
                className={`hidden lg:flex relative z-30 bg-white shadow-xl flex-col transition-all duration-300 ease-in-out
                    ${collapsed ? 'w-20' : 'w-64'} h-full`}
            >
                {/* Header with Icon */}
                <div className={`px-5 py-6 border-b border-gray-100 transition-all duration-300
                    ${collapsed ? 'px-3' : 'px-5'}`}>
                    {!collapsed ? (
                        <>
                            <div className="flex items-center gap-3">
                                {/* Icon Container - Removed "IF" text and added School icon */}
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-md">
                                    <School className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="font-bold text-gray-800 text-base">ICT For Future</h1>
                                    <p className="text-xs text-gray-400 mt-0.5">Teacher Dashboard</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-center">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-md">
                                <School className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
                    {/* Main Navigation */}
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const active = pathname === item.href || pathname.startsWith(item.href + "/")
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                        ${active 
                                            ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 shadow-sm" 
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }
                                        ${collapsed ? 'justify-center px-2' : ''}
                                        group relative
                                    `}
                                    title={collapsed ? item.label : ""}
                                >
                                    <Icon className={`w-5 h-5 transition-all duration-200 ${active ? "text-green-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                                    {!collapsed && <span>{item.label}</span>}
                                    
                                    {/* Tooltip for collapsed mode */}
                                    {collapsed && (
                                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                            {item.label}
                                        </div>
                                    )}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-4"></div>

                    {/* Bottom Navigation */}
                    <div className="space-y-1">
                        {bottomNavItems.map((item) => {
                            const active = pathname === item.href
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                        ${active 
                                            ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700" 
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }
                                        ${collapsed ? 'justify-center px-2' : ''}
                                        group relative
                                    `}
                                    title={collapsed ? item.label : ""}
                                >
                                    <Icon className={`w-5 h-5 transition-all duration-200 ${active ? "text-green-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                                    {!collapsed && <span>{item.label}</span>}
                                    
                                    {collapsed && (
                                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                            {item.label}
                                        </div>
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </nav>

                {/* Footer */}
                <div className={`border-t border-gray-100 pt-4 pb-6 ${collapsed ? 'px-3' : 'px-5'}`}>
                    {!collapsed ? (
                        <div className="space-y-3">
                            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 cursor-pointer">
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <button onClick={handleLogout} className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200 group relative cursor-pointer">
                                <LogOut className="w-5 h-5" />
                                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                    Logout
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                {/* Collapse Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:border-green-300 group"
                >
                    {collapsed ? (
                        <ChevronRight className="w-3 h-3 text-gray-500 group-hover:text-green-600" />
                    ) : (
                        <ChevronLeft className="w-3 h-3 text-gray-500 group-hover:text-green-600" />
                    )}
                </button>
            </aside>

            {/* Mobile floating navigation */}
            <div className="lg:hidden">
                {mobileOpen && (
                    <div className="fixed bottom-24 left-4 z-50 w-[min(18rem,calc(100vw-2rem))] rounded-3xl border border-white/80 bg-white/95 p-3 shadow-2xl shadow-gray-900/20 backdrop-blur animate-slideUp">
                        <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                            Navigation
                        </div>
                        <nav className="grid gap-1.5">
                            {[...navItems, ...bottomNavItems].map((item) => {
                                const active = pathname === item.href || pathname.startsWith(item.href + "/")
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                                            active
                                                ? "bg-green-50 text-green-700"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                    >
                                        <Icon className={`h-5 w-5 ${active ? "text-green-600" : item.color}`} />
                                        <span>{item.label}</span>
                                    </Link>
                                )
                            })}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                            >
                                <LogOut className="h-5 w-5" />
                                <span>Logout</span>
                            </button>
                        </nav>
                    </div>
                )}
                <button
                    type="button"
                    aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
                    aria-expanded={mobileOpen}
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="fixed bottom-5 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-xl shadow-green-900/25 transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                    {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            <style jsx>{`
                /* Custom scrollbar */
                nav::-webkit-scrollbar {
                    width: 4px;
                }
                nav::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                }
                nav::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 4px;
                }
                nav::-webkit-scrollbar-thumb:hover {
                    background: #a8a8a8;
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(12px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .animate-slideUp {
                    animation: slideUp 0.2s ease-out;
                }
            `}</style>
        </>
    )
}