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
            color: "from-blue-600 to-indigo-600", 
            bgLight: "bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-100/70",
            icon: "🎓",
            change: "+12%",
            trend: "up"
        },
        { 
            label: "Present Today", 
            value: attendance.length, 
            color: "from-emerald-600 to-teal-600", 
            bgLight: "bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-100/70",
            icon: "📋",
            subtext: `${attendanceRate}% attendance rate`,
            trend: "up"
        },
        { 
            label: "Paid This Month", 
            value: paidCount, 
            color: "from-teal-600 to-emerald-600", 
            bgLight: "bg-gradient-to-br from-teal-50/70 to-emerald-50/40 border border-teal-100/70",
            icon: "💳",
            subtext: `${paymentRate}% of ${payments.length} students`,
            trend: "up"
        },
        { 
            label: "Unpaid This Month", 
            value: unpaidCount, 
            color: "from-rose-500 to-red-600", 
            bgLight: "bg-gradient-to-br from-rose-50/70 to-red-50/40 border border-rose-100/70",
            icon: "⚠️",
            subtext: "Action required",
            trend: "down"
        },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-slate-500 text-sm font-medium">Loading dashboard data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Dashboard Overview</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Welcome back! Real-time attendance & payment metrics at a glance</p>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-xl shadow-xs border border-slate-200/80 text-xs font-semibold text-slate-600 self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live Tracking</span>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {stats.map((s) => (
                    <div 
                        key={s.label} 
                        className={`${s.bgLight} rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg shadow-xs cursor-pointer group backdrop-blur-xs`}
                    >
                        <div className="flex items-start justify-between mb-3.5">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200`}>
                                <span className="text-xl">{s.icon}</span>
                            </div>
                            {s.change && (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                    s.trend === "up" ? "bg-emerald-100/80 text-emerald-700" : "bg-rose-100/80 text-rose-700"
                                }`}>
                                    {s.change}
                                    <span>{s.trend === "up" ? "↑" : "↓"}</span>
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mb-0.5">{s.value}</p>
                            <p className="text-xs font-semibold text-slate-600">{s.label}</p>
                            {s.subtext && (
                                <p className="text-[11px] font-medium text-slate-500 mt-1">{s.subtext}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts and Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Attendance */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                                    <span className="text-emerald-600">⏱️</span>
                                    Recent Scans Today
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">Live RFID attendance verification</p>
                            </div>
                            <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                                View all
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                    <div className="p-5">
                        {attendance.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
                                    <span className="text-2xl">⏰</span>
                                </div>
                                <p className="text-slate-500 text-xs font-semibold">No scans yet today.</p>
                                <p className="text-slate-400 text-[11px] mt-0.5">Students tapping their RFID cards will show up here</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {attendance.slice(0, 5).map((r, idx) => (
                                    <div 
                                        key={r.id || idx} 
                                        className="flex items-center justify-between py-2.5 px-3.5 rounded-xl hover:bg-slate-50/80 transition-all duration-150 group border border-transparent hover:border-slate-100"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100/80 to-teal-100/80 flex items-center justify-center text-sm shadow-xs">
                                                🎓
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                                    {r.student_name}
                                                </p>
                                                <p className="text-[11px] font-medium text-slate-400">{r.grade}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100/60">
                                                {r.time}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {attendance.length > 5 && (
                                    <button className="w-full mt-2 text-center text-xs font-semibold text-slate-500 hover:text-emerald-600 py-2 border-t border-slate-100 pt-3">
                                        +{attendance.length - 5} more scans recorded
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Summary Card */}
                <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
                        <div className="flex items-center gap-2">
                            <span className="text-base">💳</span>
                            <h3 className="text-sm sm:text-base font-bold text-slate-800">Payment Summary</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Current month collection status</p>
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
                                                r="54"
                                                stroke="#f1f5f9"
                                                strokeWidth="10"
                                                fill="none"
                                            />
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="54"
                                                stroke="#10b981"
                                                strokeWidth="10"
                                                strokeLinecap="round"
                                                fill="none"
                                                strokeDasharray={`${2 * Math.PI * 54}`}
                                                strokeDashoffset={`${2 * Math.PI * 54 * (1 - parseFloat(paymentRate) / 100)}`}
                                                className="transition-all duration-1000"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-black text-slate-800 tracking-tight">{paymentRate}%</span>
                                            <span className="text-[11px] font-semibold text-slate-400">Paid Ratio</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Breakdown */}
                        <div className="space-y-2.5">
                            <div className="flex justify-between items-center p-3 bg-emerald-50/70 border border-emerald-100/60 rounded-xl">
                                <span className="text-xs font-semibold text-emerald-800">Paid Students</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs">✅</span>
                                    <span className="text-sm font-bold text-emerald-800">{paidCount}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-rose-50/70 border border-rose-100/60 rounded-xl">
                                <span className="text-xs font-semibold text-rose-800">Unpaid Students</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs">⚠️</span>
                                    <span className="text-sm font-bold text-rose-800">{unpaidCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}