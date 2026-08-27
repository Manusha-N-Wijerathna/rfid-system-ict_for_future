"use client"
import { useEffect, useState, useCallback } from "react"
import {
    getStudents, getLiveAttendance, getAttendance,
    manualMark, manualUnmark, getMonthlyReport,getTotalStudents
} from "@/lib/api"
import StudentReportModal from "@/components/StudentReportModal"


const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"]

const today = () => new Date().toISOString().split("T")[0]

export default function AttendancePage() {
    const now = new Date()
    const [activeTab, setActiveTab] = useState("live")

    // ── Live tab ───────────────────────────────────────────
    const [totalStudents, setTotalStudents] = useState(0)
    const [liveRecords, setLiveRecords] = useState([])
    const [liveLoading, setLiveLoading] = useState(true)
    const [liveError, setLiveError] = useState(null)

    const fetchLive = useCallback(async () => {
        try {
            const res = await getLiveAttendance()
            setLiveRecords(res.data)
            setLiveError(null)
        } catch { setLiveError("Cannot reach server") }
        finally { setLiveLoading(false) }
    }, [])

    useEffect(() => {
        if (activeTab !== "live") return
        fetchLive()
        const iv = setInterval(fetchLive, 5000)
        return () => clearInterval(iv)
    }, [activeTab, fetchLive])

    // ── Manual mark tab ────────────────────────────────────
    const [students, setStudents] = useState([])
    const [selDate, setSelDate] = useState(today())
    const [dateRecords, setDateRecords] = useState([])
    const [manLoading, setManLoading] = useState(false)
    const [marking, setMarking] = useState(null)

    const loadStudents = useCallback(async () => {
        try { const r = await getStudents(); setStudents(r.data) } catch { }
    }, [])

    const loadDateRecords = useCallback(async (d) => {
        setManLoading(true)
        try { const r = await getAttendance(d); setDateRecords(r.data) } catch { }
        finally { setManLoading(false) }
    }, [])

    useEffect(() => {
        if (activeTab !== "manual") return
        loadStudents()
        loadDateRecords(selDate)
    }, [activeTab, selDate])

    const isPresent = (studentId) => dateRecords.some(r => r.student_id === studentId)

    const toggleAttendance = async (student) => {
        setMarking(student.id)
        try {
            if (isPresent(student.id)) await manualUnmark(student.id, selDate)
            else await manualMark(student.id, selDate)
            await loadDateRecords(selDate)
        } catch { alert("Failed to update attendance.") }
        finally { setMarking(null) }
    }

    const presentCount = students.filter(s => isPresent(s.id)).length
    const absentCount = students.length - presentCount

    // ── Monthly report tab ─────────────────────────────────
    const [repMonth, setRepMonth] = useState(now.getMonth() + 1)
    const [repYear, setRepYear] = useState(now.getFullYear())
    const [report, setReport] = useState([])
    const [repLoading, setRepLoading] = useState(false)
    const [selectedReportStudent, setSelectedReportStudent] = useState(null)


    const loadReport = useCallback(async () => {
        setRepLoading(true)
        try { const r = await getMonthlyReport(repMonth, repYear); setReport(r.data) } catch { }
        finally { setRepLoading(false) }
    }, [repMonth, repYear])

    useEffect(() => {
        if (activeTab !== "report") return
        loadReport()
    }, [activeTab, repMonth, repYear])

    const daysInMonth = 4

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Attendance Management</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>
                {activeTab === "live" && (
                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-full border border-green-200 shadow-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Auto-refreshing
                    </div>
                )}
            </div>

            {/* Modern Tabs */}
            <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
                {[
                    ["live", "📡", "Live Feed"],
                    ["manual", "✏️", "Manual Mark"],
                    ["report", "📊", "Monthly Report"],
                ].map(([t, icon, label]) => (
                    <button key={t} onClick={() => setActiveTab(t)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                        ${activeTab === t 
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md" 
                            : "text-gray-600 hover:bg-gray-100"}`}>
                        <span>{icon}</span>
                        <span>{label}</span>
                    </button>
                ))}
            </div>

            {/* ── Live Feed Tab ── */}
            {activeTab === "live" && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-green-700">{liveRecords.length}</p>
                                    <p className="text-sm text-gray-600 mt-1">Present Today</p>
                                </div>
                                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">📋</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-5 border border-blue-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-blue-700">
                                        {liveRecords.length > 0 ? liveRecords[0].time : "—"}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">Last Scan</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">⏰</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-purple-700">
                                        {((liveRecords.length / 17) * 100).toFixed(1)}%
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">Attendance Rate</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">📊</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {liveError && (
                        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg px-4 py-3">
                            <p className="text-red-700 text-sm">{liveError}</p>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-semibold text-gray-800">Live Attendance Feed</h3>
                            <p className="text-xs text-gray-500 mt-1">Real-time student check-ins</p>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {liveLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-3"></div>
                                    <p className="text-gray-400 text-sm">Loading...</p>
                                </div>
                            ) : liveRecords.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-3xl">📡</span>
                                    </div>
                                    <p className="text-gray-400 text-sm">No scans recorded today yet.</p>
                                    <p className="text-xs text-gray-300 mt-1">Check back later</p>
                                </div>
                            ) : (
                                liveRecords.map((r, idx) => (
                                    <div key={r.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {r.student_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{r.student_name}</p>
                                                    <p className="text-xs text-gray-400">{r.grade}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-mono font-semibold text-green-600">{r.time}</p>
                                                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mt-1">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                    Present
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ── Manual Mark Tab ── */}
            {activeTab === "manual" && (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div className="w-full md:w-auto">
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Select Date</label>
                                <input 
                                    type="date" 
                                    value={selDate}
                                    onChange={e => setSelDate(e.target.value)}
                                    max={today()}
                                    className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white w-full md:w-auto" 
                                />
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <div className="flex-1 md:flex-none bg-green-50 rounded-xl px-4 py-3 text-center border border-green-100">
                                    <p className="text-2xl font-bold text-green-700">{presentCount}</p>
                                    <p className="text-xs text-green-600">Present</p>
                                </div>
                                <div className="flex-1 md:flex-none bg-red-50 rounded-xl px-4 py-3 text-center border border-red-100">
                                    <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                                    <p className="text-xs text-red-500">Absent</p>
                                </div>
                                <div className="flex-1 md:flex-none bg-gray-50 rounded-xl px-4 py-3 text-center border border-gray-100">
                                    <p className="text-2xl font-bold text-gray-700">{students.length}</p>
                                    <p className="text-xs text-gray-500">Total</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            {manLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-3"></div>
                                    <p className="text-gray-400 text-sm">Loading students...</p>
                                </div>
                            ) : students.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-3xl">👨‍🎓</span>
                                    </div>
                                    <p className="text-gray-400 text-sm">No students registered.</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {students.map((s, i) => {
                                            const present = isPresent(s.id)
                                            return (
                                                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 text-gray-400 text-sm">{i + 1}</td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-gray-800">{s.name}</p>
                                                        {s.parent_name && <p className="text-xs text-gray-400 mt-0.5">{s.parent_name}</p>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {s.grade}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                                            ${present ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                            {present ? "✓ Present" : "✗ Absent"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => toggleAttendance(s)}
                                                            disabled={marking === s.id}
                                                            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50
                                                                ${present
                                                                    ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                                                    : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"}`}>
                                                            {marking === s.id ? (
                                                                <span className="flex items-center gap-1">
                                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                                                    Saving...
                                                                </span>
                                                            ) : present ? "Mark Absent" : "Mark Present"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ── Monthly Report Tab ── */}
            {activeTab === "report" && (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="flex gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Month</label>
                                    <select 
                                        value={repMonth} 
                                        onChange={e => setRepMonth(Number(e.target.value))}
                                        className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                                        {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Year</label>
                                    <select 
                                        value={repYear} 
                                        onChange={e => setRepYear(Number(e.target.value))}
                                        className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="bg-blue-50 rounded-lg px-4 py-2">
                                <p className="text-sm text-blue-700">
                                    📅 {daysInMonth} school days this month
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800">
                                Attendance Report — {MONTHS[repMonth - 1]} {repYear}
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            {repLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-3"></div>
                                    <p className="text-gray-400 text-sm">Loading report...</p>
                                </div>
                            ) : report.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-3xl">📊</span>
                                    </div>
                                    <p className="text-gray-400 text-sm">No attendance data for this period.</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Present</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance %</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Printable Report</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {report.map((r, i) => {
                                            const pct = daysInMonth > 0 ? Math.round((r.present_days / daysInMonth) * 100) : 0
                                            const good = pct >= 75
                                            return (
                                                <tr key={r.student_id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 text-gray-400">{i + 1}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-800">{r.name}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {r.grade}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-semibold text-gray-800">{r.present_days}</span>
                                                        <span className="text-gray-400 text-xs"> / {daysInMonth}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                                                                <div
                                                                    className={`h-2 rounded-full transition-all duration-500 ${good ? "bg-green-500" : "bg-red-400"}`}
                                                                    style={{ width: `${Math.min(pct, 100)}%` }}>
                                                                </div>
                                                            </div>
                                                            <span className={`text-xs font-semibold ${good ? "text-green-700" : "text-red-600"}`}>
                                                                {pct}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                                            ${pct >= 75 ? "bg-green-100 text-green-800"
                                                                : pct >= 50 ? "bg-yellow-100 text-yellow-800"
                                                                    : "bg-red-100 text-red-800"}`}>
                                                            {pct >= 75 ? "Excellent" : pct >= 50 ? "Average" : "Needs Improvement"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => setSelectedReportStudent(r)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all shadow-xs cursor-pointer"
                                                        >
                                                            <span>📄</span> View Report
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Printable Student Monthly Report Modal */}
            {selectedReportStudent && (
                <StudentReportModal
                    student={selectedReportStudent}
                    month={repMonth}
                    year={repYear}
                    onClose={() => setSelectedReportStudent(null)}
                />
            )}
        </div>
    )
}