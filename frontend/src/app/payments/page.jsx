"use client"
import { useEffect, useState } from "react"
import { getPayments, markPaid, unmarkPaid } from "@/lib/api"

export default function PaymentsPage() {
    const now = new Date()
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [year, setYear] = useState(now.getFullYear())
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [toggling, setToggling] = useState(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState("all")

    const load = async () => {
        setLoading(true)
        try {
            const res = await getPayments(month, year)
            setData(res.data)
        } catch { }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [month, year])

    const toggle = async (s) => {
        setToggling(s.student_id)
        try {
            if (s.paid) await unmarkPaid(s.student_id, month, year)
            else await markPaid(s.student_id, month, year)
            await load()
        } catch { alert("Something went wrong.") }
        finally { setToggling(null) }
    }

    // Filter data based on search and status
    const filteredData = data.filter(s => {
        const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             s.grade?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = filterStatus === "all" || 
                              (filterStatus === "paid" && s.paid) || 
                              (filterStatus === "unpaid" && !s.paid)
        return matchesSearch && matchesStatus
    })

    const paidCount = data.filter(s => s.paid).length
    const unpaidCount = data.length - paidCount
    
    // FIXED: Properly parse numeric values
    const parseAmount = (amount) => {
        if (!amount && amount !== 0) return 0
        if (typeof amount === 'number') return amount
        // Convert string to number, removing any non-numeric characters except decimal
        const numericString = String(amount).replace(/[^0-9.-]/g, '')
        const parsed = parseFloat(numericString)
        return isNaN(parsed) ? 0 : parsed
    }
    
    const totalFees = data.reduce((sum, s) => sum + parseAmount(s.fee_amount), 0)
    const collectedFees = data.reduce((sum, s) => sum + (s.paid ? parseAmount(s.fee_amount) : 0), 0)

    // Helper function to format currency correctly
    const formatCurrency = (amount) => {
        const numAmount = parseAmount(amount)
        if (numAmount === 0) return "0"
        return numAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Payment Management</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage student fee payments
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select 
                        value={month} 
                        onChange={e => setMonth(Number(e.target.value))}
                        className="text-sm border border-gray-200 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString("default", { month: "long" })}
                            </option>
                        ))}
                    </select>
                    <select 
                        value={year} 
                        onChange={e => setYear(Number(e.target.value))}
                        className="text-sm border border-gray-200 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-bold text-green-700">{paidCount}</p>
                            <p className="text-sm text-gray-600 mt-1">Paid Students</p>
                        </div>
                        <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                            <span className="text-2xl">✅</span>
                        </div>
                    </div>
                    <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                                className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${data.length ? (paidCount / data.length) * 100 : 0}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {data.length ? Math.round((paidCount / data.length) * 100) : 0}% of total
                        </p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-5 border border-red-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-bold text-red-600">{unpaidCount}</p>
                            <p className="text-sm text-gray-600 mt-1">Unpaid Students</p>
                        </div>
                        <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                            <span className="text-2xl">⚠️</span>
                        </div>
                    </div>
                    <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                                className="bg-red-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${data.length ? (unpaidCount / data.length) * 100 : 0}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {data.length ? Math.round((unpaidCount / data.length) * 100) : 0}% need payment
                        </p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-5 border border-blue-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-bold text-blue-700">
                                Rs. {formatCurrency(totalFees)}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">Total Fees</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-bold text-purple-700">
                                Rs. {formatCurrency(collectedFees)}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">Collected Amount</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💳</span>
                        </div>
                    </div>
                    <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                                className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${totalFees ? (collectedFees / totalFees) * 100 : 0}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {totalFees ? Math.round((collectedFees / totalFees) * 100) : 0}% collection rate
                        </p>
                    </div>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400">🔍</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by student name or grade..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterStatus("all")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                filterStatus === "all"
                                    ? "bg-green-600 text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterStatus("paid")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                filterStatus === "paid"
                                    ? "bg-green-600 text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            Paid
                        </button>
                        <button
                            onClick={() => setFilterStatus("unpaid")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                filterStatus === "unpaid"
                                    ? "bg-green-600 text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            Unpaid
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                    Showing {filteredData.length} of {data.length} students
                </p>
                {filterStatus !== "all" && (
                    <button
                        onClick={() => setFilterStatus("all")}
                        className="text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                        Clear filter
                    </button>
                )}
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-3"></div>
                        <p className="text-gray-400 text-sm">Loading payment data...</p>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-3xl">💰</span>
                        </div>
                        <p className="text-gray-400 text-sm">No payment records found.</p>
                        <p className="text-xs text-gray-300 mt-1">Try adjusting your search or filter</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid On</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredData.map((s, idx) => (
                                    <tr key={s.student_id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
                                                    {s.name?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{s.name || "Unknown"}</p>
                                                    <p className="text-xs text-gray-400">ID: {s.student_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {s.grade || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-green-700">
                                                Rs. {formatCurrency(s.fee_amount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                                                ${s.paid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.paid ? "bg-green-500" : "bg-red-500"}`}></span>
                                                {s.paid ? "Paid" : "Unpaid"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {s.paid_at ? (
                                                <div className="text-xs">
                                                    <p className="text-gray-700">{new Date(s.paid_at).toLocaleDateString("en-GB")}</p>
                                                    <p className="text-gray-400 text-xs">{new Date(s.paid_at).toLocaleTimeString()}</p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => toggle(s)} 
                                                disabled={toggling === s.student_id}
                                                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50
                                                    ${s.paid
                                                        ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                                        : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"}`}>
                                                {toggling === s.student_id ? (
                                                    <span className="flex items-center gap-1">
                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                                        Saving...
                                                    </span>
                                                ) : s.paid ? "Mark Unpaid" : "Mark Paid"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary Footer */}
            {filteredData.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex flex-wrap justify-between items-center gap-3 text-sm">
                        <div className="flex items-center gap-4">
                            <div>
                                <span className="text-gray-500">Showing:</span>
                                <span className="font-semibold text-gray-800 ml-1">{filteredData.length} students</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Total fees:</span>
                                <span className="font-semibold text-green-700 ml-1">
                                    Rs. {formatCurrency(filteredData.reduce((sum, s) => sum + parseAmount(s.fee_amount), 0))}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                Export Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}