"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export default function AuthGuard({ children }) {
    const router = useRouter()
    const pathname = usePathname()
    const [authorized, setAuthorized] = useState(false)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        const check = () => {
            // Login page doesn't need auth
            if (pathname === "/login") {
                setAuthorized(true)
                setChecking(false)
                return
            }

            const token = localStorage.getItem("admin_token")
            if (!token) {
                router.replace("/login")
                return
            }

            setAuthorized(true)
            setChecking(false)
        }

        check()
    }, [pathname, router])

    if (checking && pathname !== "/login") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm">Verifying authentication...</p>
                </div>
            </div>
        )
    }

    if (!authorized && pathname !== "/login") return null

    return children
}
