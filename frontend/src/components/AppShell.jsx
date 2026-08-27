"use client"
import { usePathname } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"
import AuthGuard from "@/components/AuthGuard"

export default function AppShell({ children }) {
    const pathname = usePathname()
    const isLoginPage = pathname === "/login"

    return (
        <AuthGuard>
            {isLoginPage ? (
                // Login page: no sidebar/topbar, full-screen
                <>{children}</>
            ) : (
                // Authenticated pages: sidebar + topbar layout
                <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <TopBar />
                        <main className="flex-1 overflow-y-auto p-6">
                            {children}
                        </main>
                    </div>
                </div>
            )}
        </AuthGuard>
    )
}
