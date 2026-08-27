"use client"
import { useEffect, useState, useCallback } from "react"
import { getStudentHistory, getPayments } from "@/lib/api"

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

export default function StudentReportModal({ student, month, year, onClose }) {
    const [loading, setLoading] = useState(true)
    const [historyData, setHistoryData] = useState(null)
    const [paymentData, setPaymentData] = useState(null)
    const [error, setError] = useState(null)

    const loadData = useCallback(async () => {
        if (!student?.student_id) return
        setLoading(true)
        setError(null)
        try {
            const [histRes, payRes] = await Promise.all([
                getStudentHistory(student.student_id, month, year).catch(() => ({ data: null })),
                getPayments(month, year).catch(() => ({ data: [] })),
            ])

            if (histRes?.data) {
                setHistoryData(histRes.data)
            } else {
                setHistoryData({
                    student: {
                        name: student.name,
                        grade: student.grade,
                    },
                    records: [],
                    total: student.present_days || 0
                })
            }

            if (payRes?.data) {
                const sPay = payRes.data.find(p => p.student_id === student.student_id)
                setPaymentData(sPay || null)
            }
        } catch (err) {
            console.error("Failed to load report data:", err)
            setError("Failed to load full student report.")
        } finally {
            setLoading(false)
        }
    }, [student, month, year])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handlePrint = () => {
        window.print()
    }

    const totalSchoolDays = 4
    const records = historyData?.records || []
    const presentCount = records.length > 0 ? records.length : (student?.present_days || 0)
    const attendancePct = Math.round((presentCount / totalSchoolDays) * 100)
    const studentInfo = historyData?.student || { name: student?.name, grade: student?.grade }

    const isPaid = paymentData?.paid
    const paidAt = paymentData?.paid_at ? new Date(paymentData.paid_at).toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    }) : null
    const feeAmount = paymentData?.fee_amount

    return (
        <div className="report-modal-overlay fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:overflow-visible">

            {/* Print CSS styles */}
            <style jsx global>{`
                @media print {
                    /* Hide navigation chrome & modal close/print buttons */
                    .no-print, aside, header, nav {
                        display: none !important;
                    }
                    
                    /* Unclip html & body layout so print engine prints all content pages */
                    html, body, body > div, main {
                        height: auto !important;
                        min-height: 0 !important;
                        max-height: none !important;
                        overflow: visible !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                    }

                    .report-modal-overlay {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        min-height: 100% !important;
                        background: #ffffff !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                        display: block !important;
                        backdrop-filter: none !important;
                    }

                    .report-modal-card {
                        position: static !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        height: auto !important;
                        max-height: none !important;
                        box-shadow: none !important;
                        border: none !important;
                        overflow: visible !important;
                        border-radius: 0 !important;
                        display: block !important;
                    }

                    #printable-report {
                        position: static !important;
                        width: 100% !important;
                        height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        display: block !important;
                    }

                    .print-avoid-break {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    @page {
                        size: A4 portrait;
                        margin: 12mm;
                    }
                }
            `}</style>

            <div className="report-modal-card bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none print:overflow-visible">
                
                {/* Modal Action Header (Screen only) */}
                <div className="no-print px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                            📄
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Student Monthly Report</h3>
                            <p className="text-xs text-gray-500">{studentInfo.name} — {MONTHS[month - 1]} {year}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <span>🖨️</span> Print Report (A4)
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                            ✕ Close
                        </button>
                    </div>
                </div>

                {/* Printable Report Content (A4 Printable Area) */}
                <div id="printable-report" className="p-8 sm:p-10 overflow-y-auto print:overflow-visible print:p-0 print:max-h-none space-y-6 text-gray-800 bg-white">
                    
                    {/* Header Banner */}
                    <div className="border-b-2 border-emerald-600 pb-5 print-avoid-break">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🎓</span>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">CLASS MANAGEMENT SYSTEM</h1>
                                </div>
                                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mt-1">
                                    Official Student Attendance & Fee Payment Report
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="inline-block bg-emerald-100 text-emerald-900 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-400 shadow-xs">
                                    #ict_for_future
                                </div>
                                <p className="text-xs text-gray-600 mt-1 font-semibold">
                                    Period: <span className="font-bold text-gray-900">{MONTHS[month - 1]} {year}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-16 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3"></div>
                            <p className="text-sm text-gray-600">Generating student report...</p>
                        </div>
                    ) : error ? (
                        <div className="py-12 text-center text-red-600 text-sm">
                            {error}
                        </div>
                    ) : (
                        <>
                            {/* Student Info Card */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-300 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs print-avoid-break">
                                <div>
                                    <p className="text-gray-500 font-semibold uppercase tracking-wide">Student Name</p>
                                    <p className="font-bold text-sm text-gray-900 mt-0.5">{studentInfo.name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-semibold uppercase tracking-wide">Grade / Class</p>
                                    <p className="font-bold text-sm text-emerald-800 mt-0.5">{studentInfo.grade}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-semibold uppercase tracking-wide">Parent / Guardian</p>
                                    <p className="font-bold text-sm text-gray-900 mt-0.5">{studentInfo.parent_name || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-semibold uppercase tracking-wide">Contact Number</p>
                                    <p className="font-bold text-sm text-gray-900 mt-0.5">{studentInfo.phone || "N/A"}</p>
                                </div>
                            </div>

                            {/* Key Performance Indicators */}
                            <div className="grid grid-cols-4 gap-3 text-center print-avoid-break">
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-blue-900">{totalSchoolDays}</p>
                                    <p className="text-[11px] font-bold text-blue-800 uppercase mt-0.5">Total School Days</p>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-emerald-900">{presentCount} / {totalSchoolDays}</p>
                                    <p className="text-[11px] font-bold text-emerald-800 uppercase mt-0.5">Days Present</p>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-purple-900">{attendancePct}%</p>
                                    <p className="text-[11px] font-bold text-purple-800 uppercase mt-0.5">Attendance Rate</p>
                                </div>
                                <div className={`border rounded-xl p-3 ${isPaid ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
                                    <p className={`text-xl font-bold uppercase mt-1 ${isPaid ? "text-green-900" : "text-red-900"}`}>
                                        {isPaid ? "✓ PAID" : "✗ UNPAID"}
                                    </p>
                                    <p className={`text-[11px] font-bold uppercase mt-0.5 ${isPaid ? "text-green-800" : "text-red-800"}`}>
                                        Payment Status
                                    </p>
                                </div>
                            </div>

                            {/* Section 1: Detailed Attendance Log with Dates */}
                            <div className="space-y-3 print-avoid-break">
                                <div className="flex items-center justify-between border-b border-gray-300 pb-2">
                                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                        <span>📅</span> Detailed Attendance Log ({MONTHS[month - 1]} {year})
                                    </h3>
                                    <span className="text-xs text-gray-600 font-semibold">
                                        Total Recorded Days: <strong className="text-emerald-800">{records.length}</strong>
                                    </span>
                                </div>

                                {records.length === 0 ? (
                                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-xs text-gray-500">
                                        No attendance scans recorded for this student in {MONTHS[month - 1]} {year}.
                                    </div>
                                ) : (
                                    <table className="w-full text-xs text-left border-collapse border border-gray-200">
                                        <thead>
                                            <tr className="bg-gray-100 border-b border-gray-300 text-gray-800 uppercase font-bold">
                                                <th className="py-2.5 px-3 w-12 text-center border-r border-gray-200">#</th>
                                                <th className="py-2.5 px-4 border-r border-gray-200">Date</th>
                                                <th className="py-2.5 px-4 border-r border-gray-200">Time Scanned</th>
                                                <th className="py-2.5 px-4 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {records.map((r, idx) => (
                                                <tr key={r.id || idx} className="hover:bg-gray-50">
                                                    <td className="py-2 px-3 text-center text-gray-500 font-mono border-r border-gray-200">{idx + 1}</td>
                                                    <td className="py-2 px-4 font-bold text-gray-900 border-r border-gray-200">{r.date}</td>
                                                    <td className="py-2 px-4 text-gray-800 font-mono border-r border-gray-200">{r.time}</td>
                                                    <td className="py-2 px-4 text-right">
                                                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-900 px-2.5 py-0.5 rounded-full font-bold border border-green-300">
                                                            <span>✓</span> Present
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Section 2: Payment Status & Dates */}
                            <div className="space-y-3 pt-2 print-avoid-break">
                                <div className="flex items-center justify-between border-b border-gray-300 pb-2">
                                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                        <span>💳</span> Fee Payment Details ({MONTHS[month - 1]} {year})
                                    </h3>
                                </div>

                                <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                    <div>
                                        <p className="text-gray-500 font-semibold uppercase">Class Monthly Fee</p>
                                        <p className="font-bold text-sm text-gray-900 mt-1">
                                            {feeAmount ? `Rs. ${Number(feeAmount).toLocaleString()}` : "Standard Fee"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 font-semibold uppercase">Payment Status</p>
                                        <p className="mt-1">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-extrabold text-xs ${
                                                isPaid ? "bg-green-100 text-green-900 border border-green-400" : "bg-red-100 text-red-900 border border-red-400"
                                            }`}>
                                                {isPaid ? "✓ Paid" : "✗ Unpaid"}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 font-semibold uppercase">Date Paid</p>
                                        <p className="font-bold text-xs text-gray-900 mt-1">
                                            {paidAt ? paidAt : (isPaid ? "Recorded" : "Not Paid Yet")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Report Sign-off & Footer Branding */}
                            <div className="pt-8 border-t border-gray-300 mt-8 space-y-6 print-avoid-break">
                                <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4">
                                    <div>
                                        <div className="border-b border-gray-600 w-3/4 mx-auto mb-2"></div>
                                        <p className="font-bold text-gray-800">Class Teacher Signature</p>
                                    </div>
                                    <div>
                                        <div className="border-b border-gray-600 w-3/4 mx-auto mb-2"></div>
                                        <p className="font-bold text-gray-800">Principal / Director Stamp</p>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 rounded-xl p-3 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                                    <div className="flex items-center gap-2 font-extrabold text-emerald-900">
                                        <span>🚀</span>
                                        <span>#ict_for_future</span>
                                    </div>
                                    <p className="text-emerald-800 text-[11px] font-semibold">
                                        Generated on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
