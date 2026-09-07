"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { clearRfidLoginResult, getRfidLoginResult, loginAdmin } from "@/lib/api"

export default function LoginPage() {
    const router = useRouter()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [rfidMessage, setRfidMessage] = useState("")

    useEffect(() => {
        localStorage.removeItem("admin_token")
        localStorage.removeItem("admin_user")

        let active = true
        const checkRfidLogin = async () => {
            try {
                const res = await getRfidLoginResult()
                if (!active || !res.data?.token) return
                setUsername(res.data.admin?.username || "")
                setRfidMessage(`RFID detected for ${res.data.admin?.full_name || "admin"}`)
                localStorage.setItem("admin_token", res.data.token)
                localStorage.setItem("admin_user", JSON.stringify(res.data.admin))
                await clearRfidLoginResult().catch(() => {})
                window.dispatchEvent(new Event("adminAuthChanged"))
                window.location.assign("/dashboard")
            } catch { }
        }
        let interval
        clearRfidLoginResult()
            .catch(() => {})
            .finally(() => {
                if (!active) return
                checkRfidLogin()
                interval = setInterval(checkRfidLogin, 1000)
            })
        return () => {
            active = false
            if (interval) clearInterval(interval)
        }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!username.trim() || !password.trim()) {
            setError("Please enter both username and password.")
            return
        }

        setLoading(true)
        setError("")

        try {
            const res = await loginAdmin({ username: username.trim(), password: password.trim() })
            const { token, admin } = res.data

            localStorage.setItem("admin_token", token)
            localStorage.setItem("admin_user", JSON.stringify(admin))

            // Notify auth state listeners
            window.dispatchEvent(new Event("adminAuthChanged"))

            router.push("/dashboard")
        } catch (err) {
            console.error("Login failed:", err)
            setError(err.response?.data?.detail || "Invalid username or password.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl text-white space-y-6">
                
                {/* Header Logo & Title */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-green-400 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30">
                        🛡️
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mt-4">
                        ADMIN LOGIN
                    </h1>
                    <p className="text-xs text-gray-300">
                        Class Management & RFID Attendance System
                    </p>
                    <div className="inline-block bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-400/30 mt-1">
                        #ict_for_future
                    </div>
                </div>

                {/* Error Notification */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-xs flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {rfidMessage && (
                    <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-center text-xs text-emerald-100">
                        {rfidMessage}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-300 block mb-1">
                            Username
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter admin username"
                                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-300 block mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter admin password"
                                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-300 hover:text-white"
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Authenticating...
                            </>
                        ) : (
                            "Sign In to Dashboard →"
                        )}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400">
                    Scan the assigned admin RFID card while this page is open to sign in automatically.
                </p>

                {/* Default Credentials Setup Note */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center text-xs text-gray-300 space-y-1">
                    <p className="font-semibold text-emerald-300">Default Credentials:</p>
                    <p>Username: <code className="bg-black/30 px-1.5 py-0.5 rounded text-white font-mono">admin</code> | Password: <code className="bg-black/30 px-1.5 py-0.5 rounded text-white font-mono">admin123</code></p>
                </div>
            </div>
        </div>
    )
}
