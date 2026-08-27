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
  School
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
    const [hovered, setHovered] = useState(false)

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
            {!collapsed && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={() => setCollapsed(true)}
                />
            )}

            {/* Sidebar */}
            <aside 
                className={`fixed lg:relative z-30 bg-white shadow-xl flex flex-col transition-all duration-300 ease-in-out
                    ${collapsed ? 'w-20' : 'w-64'} 
                    ${collapsed ? 'translate-x-0' : 'translate-x-0'}
                    lg:translate-x-0 h-full`}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
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
            `}</style>
        </>
    )
}