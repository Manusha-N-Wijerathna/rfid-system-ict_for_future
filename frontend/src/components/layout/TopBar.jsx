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
        <header className="bg-white border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shadow-sm">
            {/* Left side - Date and Time */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <div className="flex flex-col">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">{today}</p>
                    <p className="text-xs text-gray-400">{timeString}</p>
                </div>
                
                {/* System Status */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
                    {isOnline ? (
                        <>
                            <Wifi className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-xs text-gray-600">Connected</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-xs text-gray-600">Offline</span>
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
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 border border-transparent hover:border-gray-200 cursor-pointer"
                    >
                        {adminUser?.profile_picture ? (
                            <img
                                src={adminUser.profile_picture}
                                alt={displayName}
                                className="w-8 h-8 rounded-full object-cover border-2 border-emerald-200"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                                <span className="text-white text-sm font-semibold">{displayInitial}</span>
                            </div>
                        )}
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-medium text-gray-700">{displayName}</p>
                            <p className="text-xs text-gray-400">Administrator</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                    </button>

                    {/* Dropdown Menu */}
                    {showProfileMenu && (
                        <>
                            <div 
                                className="fixed inset-0 z-10"
                                onClick={() => setShowProfileMenu(false)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 animate-slideDown">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-gray-800">{displayName}</p>
                                    <p className="text-xs text-gray-400">{adminUser?.username || "admin"}</p>
                                </div>
                                <Link href="/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <Settings className="w-4 h-4" />
                                    Profile Settings
                                </Link>
                                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1 cursor-pointer">
                                    <LogOut className="w-4 h-4" />
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
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.2s ease-out;
                }
            `}</style>
        </header>
    )
}