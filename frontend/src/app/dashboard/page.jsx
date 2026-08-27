"use client"
import { useEffect, useState } from "react"
import { getStudents, getLiveAttendance, getPayments } from "@/lib/api"

export default function DashboardPage() {
    const now = new Date()
    const [students, setStudents] = useState([])
    const [attendance, setAttendance] = useState([])
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [studentsRes, attendanceRes, paymentsRes] = await Promise.all([
                    getStudents().catch(() => ({ data: [] })),
                    getLiveAttendance().catch(() => ({ data: [] })),
                    getPayments(now.getMonth() + 1, now.getFullYear()).catch(() => ({ data: [] }))
                ])
                setStudents(studentsRes.data || [])
                setAttendance(attendanceRes.data || [])
                setPayments(paymentsRes.data || [])
            } catch (error) {
                console.error("Error fetching dashboard data:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const paidCount = payments.filter(p => p.paid).length
    const unpaidCount = payments.length - paidCount
    const attendanceRate = students.length > 0 ? ((attendance.length / students.length) * 100).toFixed(1) : 0
    const paymentRate = payments.length > 0 ? ((paidCount / payments.length) * 100).toFixed(1) : 0

    const stats = [
        { 
            label: "Total Students", 
            value: students.length, 
            color: "from-blue-500 to-blue-600", 
            bgLight: "bg-blue-50",
            icon: "🎓",
            change: "+12%",
            trend: "up"
        },
        { 
            label: "Present Today", 
            value: attendance.length, 
            color: "from-green-500 to-green-600", 
            bgLight: "bg-green-50",
            icon: "📋",
            subtext: `${attendanceRate}% attendance rate`,
            trend: "up"
        },
        { 
            label: "Paid This Month", 
            value: paidCount, 
            color: "from-emerald-500 to-emerald-600", 
            bgLight: "bg-emerald-50",
            icon: "✅",
            subtext: `${paymentRate}% of ${payments.length} students`,
            trend: "up"
        },
        { 
            label: "Unpaid This Month", 
            value: unpaidCount, 
            color: "from-red-500 to-red-600", 
            bgLight: "bg-red-50",
            icon: "⚠️",
            subtext: "Action required",
            trend: "down"
        },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading dashboard data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
                    <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100">
                    <span className="text-green-600">📊</span>
                    <span className="text-sm text-gray-600">Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((s) => (
                    <div 
                        key={s.label} 
                        className={`${s.bgLight} rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer group`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all`}>
                                <span className="text-2xl">{s.icon}</span>
                            </div>
                            {s.change && (
                                <span className={`text-xs font-semibold flex items-center gap-1 ${
                                    s.trend === "up" ? "text-green-600" : "text-red-600"
                                }`}>
                                    {s.change}
                                    <span className="text-sm">{s.trend === "up" ? "▲" : "▼"}</span>
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{s.value}</p>
                            <p className="text-sm font-medium text-gray-600">{s.label}</p>
                            {s.subtext && (
                                <p className="text-xs text-gray-500 mt-1">{s.subtext}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts and Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Attendance */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <span className="text-green-600">⏰</span>
                                    Recent Scans Today
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Live attendance tracking</p>
                            </div>
                            <button className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                                View all
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                    <div className="p-6">
                        {attendance.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl">⏰</span>
                                </div>
                                <p className="text-gray-400 text-sm">No scans yet today.</p>
                                <p className="text-xs text-gray-300 mt-1">Check back later for updates</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {attendance.slice(0, 5).map((r, idx) => (
                                    <div 
                                        key={r.id} 
                                        className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                                                <span className="text-lg">🎓</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
                                                    {r.student_name}
                                                </p>
                                                <p className="text-xs text-gray-400">{r.grade}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-lg">
                                                {r.time}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {attendance.length > 5 && (
                                    <button className="w-full mt-3 text-center text-sm text-gray-500 hover:text-green-600 py-2 border-t border-gray-100 pt-4">
                                        +{attendance.length - 5} more scans
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Summary Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-2">
                            <span className="text-emerald-600 text-lg">💰</span>
                            <h3 className="text-lg font-semibold text-gray-800">Payment Summary</h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">This month's overview</p>
                    </div>
                    <div className="p-6">
                        {/* Progress Circle */}
                        <div className="relative mb-6">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center">
                                    <div className="relative w-32 h-32">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="56"
                                                stroke="#e5e7eb"
                                                strokeWidth="12"
                                                fill="none"
                                            />
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="56"
                                                stroke="#10b981"
                                                strokeWidth="12"
                                                fill="none"
                                                strokeDasharray={`${2 * Math.PI * 56}`}
                                                strokeDashoffset={`${2 * Math.PI * 56 * (1 - parseFloat(paymentRate) / 100)}`}
                                                className="transition-all duration-1000"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-bold text-gray-800">{paymentRate}%</span>
                                            <span className="text-xs text-gray-500">Paid</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Breakdown */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                                <span className="text-sm font-medium text-emerald-700">Paid Students</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-emerald-600">✅</span>
                                    <span className="text-lg font-bold text-emerald-700">{paidCount}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                                <span className="text-sm font-medium text-red-700">Unpaid Students</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-red-600">⚠️</span>
                                    <span className="text-lg font-bold text-red-700">{unpaidCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}