"use client"
import { useState, useEffect } from "react"
import { User, Settings, LogOut, ChevronDown, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function TopBar() {
    const router = useRouter()
    const [currentTime, setCurrentTime] = useState(new Date())
    const [isOnline, setIsOnline] = useState(true)
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [adminUser, setAdminUser] = useState(null)

    useEffect(() => {
        // Load admin profile from localStorage
        const loadAdmin = () => {
            try {
                const stored = localStorage.getItem("admin_user")
                if (stored) setAdminUser(JSON.parse(stored))
            } catch {}
        }
        loadAdmin()

        // Listen for auth changes (login, profile update)
        window.addEventListener("adminAuthChanged", loadAdmin)

        // Update time every minute
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 60000)

        // Monitor online status
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)
        
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        
        return () => {
            clearInterval(timer)
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
            window.removeEventListener("adminAuthChanged", loadAdmin)
        }
    }, [])

    const today = currentTime.toLocaleDateString("en-US", {
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric",
    })

    const timeString = currentTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    })

    const handleLogout = () => {
        localStorage.removeItem("admin_token")
        localStorage.removeItem("admin_user")
        router.push("/login")
    }

    const displayName = adminUser?.full_name || "Admin User"
    const displayInitial = displayName.charAt(0).toUpperCase()

    return (
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
            {/* Left side - Date and Time */}
            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                <div className="flex flex-col">
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 tracking-tight whitespace-nowrap">{today}</p>
                    <p className="text-xs font-medium text-slate-400">{timeString}</p>
                </div>
                
                {/* System Status */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50/80 border border-emerald-100/80 rounded-full">
                    {isOnline ? (
                        <>
                            <div className="relative flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute"></div>
                            </div>
                            <span className="text-xs font-semibold text-emerald-700">Online & Synced</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-xs font-medium text-rose-600">Offline Mode</span>
                        </>
                    )}
                </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
                {/* User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100/80 transition-all duration-200 border border-transparent hover:border-slate-200/60 cursor-pointer"
                    >
                        {adminUser?.profile_picture ? (
                            <img
                                src={adminUser.profile_picture}
                                alt={displayName}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">{displayInitial}</span>
                            </div>
                        )}
                        <div className="hidden sm:block text-left">
                            <p className="text-xs font-semibold text-slate-800 leading-tight">{displayName}</p>
                            <p className="text-[11px] font-medium text-slate-400 leading-tight">Administrator</p>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                    </button>

                    {/* Dropdown Menu */}
                    {showProfileMenu && (
                        <>
                            <div 
                                className="fixed inset-0 z-10"
                                onClick={() => setShowProfileMenu(false)}
                            />
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-20 animate-slideDown ring-1 ring-black/5">
                                <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                                    <p className="text-xs font-bold text-slate-800">{displayName}</p>
                                    <p className="text-[11px] text-slate-400 truncate">{adminUser?.username || "admin"}</p>
                                </div>
                                <Link 
                                    href="/settings" 
                                    onClick={() => setShowProfileMenu(false)} 
                                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-xl transition-colors"
                                >
                                    <Settings className="w-4 h-4 text-slate-400" />
                                    Profile Settings
                                </Link>
                                <button 
                                    onClick={handleLogout} 
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border-t border-slate-100 mt-1 cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4 text-rose-500" />
                                    Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-8px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </header>
    )
}