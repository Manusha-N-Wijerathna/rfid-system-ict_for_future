"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import {
    getStudents, addStudent, updateStudent, deleteStudent,
    getGradeFees, updateGradeFee,
    getStudentHistory, getStudentPayments,
} from "@/lib/api"

const GRADES = ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "A/L Bio", "A/L Maths", "A/L Arts", "A/L IT"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const EMPTY = { name: "", grade: "", phone: "", parent_name: "", address: "", dob: "" }
const fmt = (n) => n != null ? `Rs. ${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"

function Modal({ open, children }) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slideUp">
                {children}
            </div>
        </div>
    )
}

function Field({ label, value }) {
    return (
        <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-sm text-gray-800 font-medium">{value || <span className="text-gray-300">—</span>}</p>
        </div>
    )
}

function Inp({ label, required, error, children }) {
    return (
        <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
            {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1">⚠️ {error}</p>}
        </div>
    )
}

const cls = (err) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${err ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"}`

export default function StudentsPage() {
    const [students, setStudents] = useState([])
    const [fees, setFees] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(null)
    const [pageError, setPageError] = useState(null)
    const [search, setSearch] = useState("")
    const [gradeFilter, setGradeFilter] = useState("All")
    const [activeTab, setActiveTab] = useState("students")
    const [showReg, setShowReg] = useState(false)
    const [regForm, setRegForm] = useState(EMPTY)
    const [regErrors, setRegErrors] = useState({})
    const [regLastSaved, setRegLastSaved] = useState(null)

    // View modal
    const [viewStudent, setViewStudent] = useState(null)
    const [viewTab, setViewTab] = useState("details")
    const [editMode, setEditMode] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [editErrors, setEditErrors] = useState({})
    const [editSaving, setEditSaving] = useState(false)

    // Attendance history
    const [attHistory, setAttHistory] = useState(null)
    const [attMonth, setAttMonth] = useState(new Date().getMonth() + 1)
    const [attYear, setAttYear] = useState(new Date().getFullYear())
    const [attLoading, setAttLoading] = useState(false)

    // Payment history
    const [payHistory, setPayHistory] = useState(null)
    const [payLoading, setPayLoading] = useState(false)

    // Fee editing
    const [editingFeeId, setEditingFeeId] = useState(null)
    const [feeInput, setFeeInput] = useState("")
    const [feeSaving, setFeeSaving] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [s, f] = await Promise.all([getStudents(), getGradeFees()])
            setStudents(s.data); setFees(f.data); setPageError(null)
        } catch { setPageError("Failed to load. Is the backend running?") }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { load() }, [load])

    const feeFor = (grade) => { const f = fees.find(f => f.grade === grade); return f ? Number(f.fee_amount) : null }

    useEffect(() => {
        if (!viewStudent || viewTab !== "attendance") return
        setAttLoading(true)
        getStudentHistory(viewStudent.id, attMonth, attYear)
            .then(r => setAttHistory(r.data))
            .catch(() => setAttHistory(null))
            .finally(() => setAttLoading(false))
    }, [viewStudent, viewTab, attMonth, attYear])

    useEffect(() => {
        if (!viewStudent || viewTab !== "payments") return
        setPayLoading(true)
        getStudentPayments(viewStudent.id)
            .then(r => setPayHistory(r.data))
            .catch(() => setPayHistory(null))
            .finally(() => setPayLoading(false))
    }, [viewStudent, viewTab])

    const openReg = () => { setRegForm(EMPTY); setRegErrors({}); setRegLastSaved(null); setShowReg(true) }
    const closeReg = () => { setRegForm(EMPTY); setRegErrors({}); setRegLastSaved(null); setShowReg(false) }

    const handleRegister = async () => {
        const e = {}
        if (!regForm.name.trim()) e.name = "Full name is required"
        if (!regForm.grade) e.grade = "Please select a grade"
        if (Object.keys(e).length) { setRegErrors(e); return }
        setSaving(true)
        try {
            await addStudent({
                name: regForm.name.trim(), grade: regForm.grade, phone: regForm.phone || null,
                parent_name: regForm.parent_name || null, address: regForm.address || null, dob: regForm.dob || null
            })
            const saved = regForm.name.trim()
            await load()
            setRegForm(EMPTY); setRegErrors({}); setRegLastSaved(saved)
        } catch (err) { setRegErrors({ api: err.response?.data?.detail || "Failed to register." }) }
        finally { setSaving(false) }
    }

    const openView = (s) => {
        setViewStudent(s); setViewTab("details")
        setEditMode(false); setEditForm({}); setEditErrors({})
        setAttHistory(null); setPayHistory(null)
    }
    const closeView = () => {
        setViewStudent(null); setEditMode(false)
        setEditForm({}); setEditErrors({})
    }
    const startEdit = (s) => {
        const t = s || viewStudent
        setViewStudent(t)
        setEditForm({
            name: t.name, grade: t.grade, phone: t.phone || "",
            parent_name: t.parent_name || "", address: t.address || "", dob: t.dob || ""
        })
        setEditErrors({}); setEditMode(true)
    }

    const handleEditSave = async () => {
        if (!editForm.name?.trim()) { setEditErrors({ name: "Name is required" }); return }
        if (!editForm.grade) { setEditErrors({ grade: "Grade is required" }); return }
        setEditSaving(true)
        try {
            const res = await updateStudent(viewStudent.id, {
                name: editForm.name.trim(), grade: editForm.grade,
                phone: editForm.phone || null, parent_name: editForm.parent_name || null,
                address: editForm.address || null, dob: editForm.dob || null
            })
            await load(); setViewStudent(res.data); setEditMode(false)
        } catch (err) { setEditErrors({ api: err.response?.data?.detail || "Failed to update." }) }
        finally { setEditSaving(false) }
    }

    const handleDelete = async (id, name) => {
        if (!confirm(`Remove ${name}?\nThis also deletes their attendance and payment records.`)) return
        setDeleting(id)
        try { await deleteStudent(id); if (viewStudent?.id === id) closeView(); await load() }
        catch { alert("Failed to remove student.") }
        finally { setDeleting(null) }
    }

    const saveFee = async (id) => {
        const val = parseFloat(feeInput)
        if (isNaN(val) || val < 0) return
        setFeeSaving(true)
        try { await updateGradeFee(id, val); await load(); setEditingFeeId(null) }
        catch { alert("Failed to update fee.") }
        finally { setFeeSaving(false) }
    }

    const filtered = students.filter(s => {
        const mg = gradeFilter === "All" || s.grade === gradeFilter
        const ms = s.name.toLowerCase().includes(search.toLowerCase()) ||
            (s.phone || "").includes(search) ||
            (s.parent_name || "").toLowerCase().includes(search.toLowerCase())
        return mg && ms
    })

    const gradeCounts = students.reduce((a, s) => { a[s.grade] = (a[s.grade] || 0) + 1; return a }, {})
    const usedGrades = [...new Set(students.map(s => s.grade))]
    const totalFees = fees.reduce((a, f) => a + (gradeCounts[f.grade] || 0) * Number(f.fee_amount), 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Student Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage students, grades, and fee structures</p>
                </div>
                <button onClick={openReg}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2">
                    <span className="text-lg">+</span> Register Student
                </button>
            </div>

            {pageError && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-xl px-4 py-3">
                    <p className="text-red-700 text-sm">{pageError}</p>
                </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-bold text-blue-700">{students.length}</p>
                            <p className="text-sm text-gray-600 mt-1">Total Students</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                            <span className="text-2xl">👥</span>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-bold text-purple-700">{usedGrades.length}</p>
                            <p className="text-sm text-gray-600 mt-1">Active Grades</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📚</span>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xl font-bold text-green-700">{fmt(totalFees)}</p>
                            <p className="text-sm text-gray-600 mt-1">Expected Monthly Revenue</p>
                        </div>
                        <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
                {[
                    ["students", "👥", "Students"],
                    ["fees", "💰", "Grade Fees"]
                ].map(([t, icon, label]) => (
                    <button key={t} onClick={() => setActiveTab(t)}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${activeTab === t 
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md" 
                            : "text-gray-600 hover:bg-gray-100"}`}>
                        <span>{icon}</span>
                        <span>{label}</span>
                    </button>
                ))}
            </div>

            {/* Students Tab */}
            {activeTab === "students" && (
                <>
                    {/* Grade Filters */}
                    {usedGrades.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {["All", ...usedGrades].map(g => (
                                <button key={g} onClick={() => setGradeFilter(g)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                                    ${gradeFilter === g 
                                        ? "bg-green-600 text-white shadow-md" 
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                                    {g} ({g === "All" ? students.length : gradeCounts[g] || 0})
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</div>
                        <input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, phone number, or parent name..."
                            className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white" 
                        />
                        {search && (
                            <button 
                                onClick={() => setSearch("")} 
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Students Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-3"></div>
                                <p className="text-gray-400 text-sm">Loading students...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-3xl">👨‍🎓</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-3">{students.length === 0 ? "No students registered yet." : "No matches found."}</p>
                                {students.length === 0 && (
                                    <button onClick={openReg} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-semibold">
                                        + Register First Student
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Fee</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filtered.map((s, i) => (
                                            <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4 text-gray-400 text-sm">{i + 1}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                                                            {s.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{s.name}</p>
                                                            {s.parent_name && <p className="text-xs text-gray-400">Parent: {s.parent_name}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {s.grade}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 text-xs">{s.phone || "—"}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-green-700 font-semibold text-xs">{fmt(feeFor(s.grade))}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => openView(s)} 
                                                            className="text-green-600 hover:text-green-800 text-xs font-medium transition-colors">
                                                            View
                                                        </button>
                                                        <button 
                                                            onClick={() => startEdit(s)} 
                                                            className="text-gray-500 hover:text-gray-700 text-xs font-medium transition-colors">
                                                            Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(s.id, s.name)} 
                                                            disabled={deleting === s.id}
                                                            className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-40 transition-colors">
                                                            {deleting === s.id ? "..." : "Remove"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Fees Tab */}
            {activeTab === "fees" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <div className="flex flex-wrap justify-between items-center gap-3">
                            <div>
                                <h3 className="font-semibold text-gray-800">Monthly Fee by Grade</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Configure fees for each grade level</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Expected monthly total</p>
                                <p className="text-lg font-bold text-green-700">{fmt(totalFees)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Students</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Fee</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade Revenue</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {fees.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">No fees configured.</td>
                                    </tr>
                                ) : fees.map(f => {
                                    const count = gradeCounts[f.grade] || 0
                                    const revenue = count * Number(f.fee_amount)
                                    return (
                                        <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {f.grade}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 font-medium">{count}</td>
                                            <td className="px-6 py-4">
                                                {editingFeeId === f.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-400">Rs.</span>
                                                        <input 
                                                            type="number" 
                                                            value={feeInput} 
                                                            onChange={e => setFeeInput(e.target.value)} 
                                                            autoFocus
                                                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-green-500" 
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-green-700 font-semibold">{fmt(f.fee_amount)}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 font-semibold">{fmt(revenue)}</td>
                                            <td className="px-6 py-4">
                                                {editingFeeId === f.id ? (
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => saveFee(f.id)} 
                                                            disabled={feeSaving}
                                                            className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors">
                                                            {feeSaving ? "Saving..." : "Save"}
                                                        </button>
                                                        <button 
                                                            onClick={() => setEditingFeeId(null)} 
                                                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => { setEditingFeeId(f.id); setFeeInput(String(Number(f.fee_amount))) }}
                                                        className="text-xs font-medium text-green-600 hover:text-green-800 transition-colors">
                                                        Edit Fee
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Register Modal */}
            <Modal open={showReg}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Register New Student</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Fill in the student details below</p>
                    </div>
                    <button onClick={closeReg} className="text-gray-400 hover:text-gray-600 text-xl transition-colors">✕</button>
                </div>
                <div className="px-6 py-5 space-y-4 overflow-y-auto">
                    {regLastSaved && (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-green-600 text-lg">✓</span>
                                <span className="text-green-700 text-sm font-medium">{regLastSaved} registered successfully!</span>
                            </div>
                            <button 
                                onClick={() => { setRegForm(EMPTY); setRegLastSaved(null) }} 
                                className="text-xs text-green-700 underline hover:text-green-800">
                                Register another
                            </button>
                        </div>
                    )}
                    {regErrors.api && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                            <p className="text-red-600 text-sm">{regErrors.api}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Inp label="Full Name" required error={regErrors.name}>
                                <input 
                                    value={regForm.name} 
                                    onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} 
                                    placeholder="e.g., Amal Perera" 
                                    className={cls(regErrors.name)} 
                                />
                            </Inp>
                        </div>
                        <Inp label="Grade" required error={regErrors.grade}>
                            <select 
                                value={regForm.grade} 
                                onChange={e => setRegForm(f => ({ ...f, grade: e.target.value }))} 
                                className={cls(regErrors.grade) + " bg-white"}>
                                <option value="">Select grade...</option>
                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </Inp>
                        <Inp label="Date of Birth">
                            <input 
                                type="date" 
                                value={regForm.dob} 
                                onChange={e => setRegForm(f => ({ ...f, dob: e.target.value }))} 
                                className={cls(false)} 
                            />
                        </Inp>
                        <Inp label="Phone Number">
                            <input 
                                value={regForm.phone} 
                                onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} 
                                placeholder="e.g., 077 123 4567" 
                                className={cls(false)} 
                            />
                        </Inp>
                        <Inp label="Parent / Guardian">
                            <input 
                                value={regForm.parent_name} 
                                onChange={e => setRegForm(f => ({ ...f, parent_name: e.target.value }))} 
                                placeholder="e.g., Sunil Perera" 
                                className={cls(false)} 
                            />
                        </Inp>
                        <div className="col-span-2">
                            <Inp label="Address">
                                <input 
                                    value={regForm.address} 
                                    onChange={e => setRegForm(f => ({ ...f, address: e.target.value }))} 
                                    placeholder="e.g., 123 Main St, Kandy" 
                                    className={cls(false)} 
                                />
                            </Inp>
                        </div>
                    </div>
                    {regForm.grade && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl px-4 py-3 flex items-center justify-between border border-green-200">
                            <span className="text-sm text-green-700">Monthly fee for <strong>{regForm.grade}</strong></span>
                            <span className="text-lg font-bold text-green-700">{fmt(feeFor(regForm.grade))}</span>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <button onClick={closeReg} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
                    <button 
                        onClick={handleRegister} 
                        disabled={saving}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg">
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Registering...
                            </>
                        ) : (
                            "Register Student"
                        )}
                    </button>
                </div>
            </Modal>

            {/* View/Edit Modal */}
            <Modal open={!!viewStudent}>
                {viewStudent && (
                    <>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                                    {viewStudent.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{viewStudent.name}</h3>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {viewStudent.grade}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!editMode && (
                                    <button 
                                        onClick={() => startEdit(viewStudent)}
                                        className="text-xs font-medium text-green-600 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-all duration-200">
                                        ✏️ Edit
                                    </button>
                                )}
                                <button onClick={closeView} className="text-gray-400 hover:text-gray-600 text-xl transition-colors">✕</button>
                            </div>
                        </div>

                        {/* Inner tabs */}
                        {!editMode && (
                            <div className="flex gap-1 mx-6 mt-4 bg-gray-100 rounded-lg p-1 w-fit">
                                {[
                                    ["details", "📋", "Details"],
                                    ["attendance", "📅", "Attendance"],
                                    ["payments", "💳", "Payments"]
                                ].map(([t, icon, label]) => (
                                    <button key={t} onClick={() => setViewTab(t)}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                                        ${viewTab === t 
                                            ? "bg-white text-gray-800 shadow-sm" 
                                            : "text-gray-500 hover:text-gray-700"}`}>
                                        <span>{icon}</span>
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="px-6 py-5 overflow-y-auto flex-1 max-h-[60vh]">
                            {editMode ? (
                                <div className="space-y-4">
                                    {editErrors.api && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                            <p className="text-red-600 text-sm">{editErrors.api}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <Inp label="Full Name" required error={editErrors.name}>
                                                <input 
                                                    value={editForm.name || ""} 
                                                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} 
                                                    className={cls(editErrors.name)} 
                                                />
                                            </Inp>
                                        </div>
                                        <Inp label="Grade" required error={editErrors.grade}>
                                            <select 
                                                value={editForm.grade || ""} 
                                                onChange={e => setEditForm(f => ({ ...f, grade: e.target.value }))} 
                                                className={cls(editErrors.grade) + " bg-white"}>
                                                <option value="">Select grade...</option>
                                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                        </Inp>
                                        <Inp label="Date of Birth">
                                            <input 
                                                type="date" 
                                                value={editForm.dob || ""} 
                                                onChange={e => setEditForm(f => ({ ...f, dob: e.target.value }))} 
                                                className={cls(false)} 
                                            />
                                        </Inp>
                                        <Inp label="Phone">
                                            <input 
                                                value={editForm.phone || ""} 
                                                onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} 
                                                className={cls(false)} 
                                            />
                                        </Inp>
                                        <Inp label="Parent / Guardian">
                                            <input 
                                                value={editForm.parent_name || ""} 
                                                onChange={e => setEditForm(f => ({ ...f, parent_name: e.target.value }))} 
                                                className={cls(false)} 
                                            />
                                        </Inp>
                                        <div className="col-span-2">
                                            <Inp label="Address">
                                                <input 
                                                    value={editForm.address || ""} 
                                                    onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} 
                                                    className={cls(false)} 
                                                />
                                            </Inp>
                                        </div>
                                    </div>
                                </div>
                            ) : viewTab === "details" ? (
                                <div className="space-y-4">
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl px-4 py-3 flex items-center justify-between border border-green-200">
                                        <div>
                                            <p className="text-xs text-green-600">Monthly Fee</p>
                                            <p className="text-sm font-medium text-green-700">{viewStudent.grade}</p>
                                        </div>
                                        <span className="text-xl font-bold text-green-700">{fmt(feeFor(viewStudent.grade))}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Full Name" value={viewStudent.name} />
                                        <Field label="Grade" value={viewStudent.grade} />
                                        <Field label="Date of Birth" value={viewStudent.dob} />
                                        <Field label="Phone" value={viewStudent.phone} />
                                        <Field label="Parent/Guardian" value={viewStudent.parent_name} />
                                        <Field label="RFID UID" value={viewStudent.rfid_uid} />
                                        <div className="col-span-2"><Field label="Address" value={viewStudent.address} /></div>
                                    </div>
                                </div>
                            ) : viewTab === "attendance" ? (
                                <div>
                                    <div className="flex gap-3 mb-4">
                                        <select 
                                            value={attMonth} 
                                            onChange={e => setAttMonth(Number(e.target.value))}
                                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                                            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                                        </select>
                                        <select 
                                            value={attYear} 
                                            onChange={e => setAttYear(Number(e.target.value))}
                                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    {attLoading ? (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                                        </div>
                                    ) : !attHistory ? (
                                        <p className="text-gray-400 text-sm text-center py-8">No attendance data available.</p>
                                    ) : (
                                        <>
                                            <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl px-4 py-3 mb-4 flex items-center justify-between border border-blue-200">
                                                <span className="text-sm text-blue-700">Days present in {MONTHS[attMonth - 1]} {attYear}</span>
                                                <span className="text-2xl font-bold text-blue-700">{attHistory.total}</span>
                                            </div>
                                            <div className="space-y-2 max-h-52 overflow-y-auto">
                                                {attHistory.records.length === 0 ? (
                                                    <p className="text-gray-400 text-sm text-center py-4">No attendance records for this month.</p>
                                                ) : attHistory.records.map(r => (
                                                    <div key={r.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                                        <span className="text-sm text-gray-700">{r.date}</span>
                                                        <span className="text-xs text-green-600 font-medium">{r.time}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : viewTab === "payments" ? (
                                <div>
                                    {payLoading ? (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                                        </div>
                                    ) : !payHistory ? (
                                        <p className="text-gray-400 text-sm text-center py-8">No payment data available.</p>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center border border-green-200">
                                                    <p className="text-2xl font-bold text-green-700">{payHistory.total_paid}</p>
                                                    <p className="text-xs text-green-600 mt-1">Months Paid</p>
                                                </div>
                                                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 text-center border border-red-200">
                                                    <p className="text-2xl font-bold text-red-600">{payHistory.total_unpaid}</p>
                                                    <p className="text-xs text-red-500 mt-1">Months Unpaid</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 max-h-52 overflow-y-auto">
                                                {payHistory.payments.length === 0 ? (
                                                    <p className="text-gray-400 text-sm text-center py-4">No payment records yet.</p>
                                                ) : payHistory.payments.map(p => (
                                                    <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                                        <span className="text-sm font-medium text-gray-700">{MONTHS[p.month - 1]} {p.year}</span>
                                                        <div className="flex items-center gap-2">
                                                            {p.paid_at && <span className="text-xs text-gray-400">{new Date(p.paid_at).toLocaleDateString("en-GB")}</span>}
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                                                ${p.paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                                                {p.paid ? "✓ Paid" : "✗ Unpaid"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
                            <button 
                                onClick={() => handleDelete(viewStudent.id, viewStudent.name)} 
                                disabled={deleting === viewStudent.id}
                                className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-40 transition-colors flex items-center gap-1">
                                🗑 {deleting === viewStudent.id ? "Removing..." : "Remove Student"}
                            </button>
                            <div className="flex gap-2">
                                {editMode ? (
                                    <>
                                        <button 
                                            onClick={() => { setEditMode(false); setEditErrors({}) }} 
                                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleEditSave} 
                                            disabled={editSaving}
                                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2 transition-all duration-200">
                                            {editSaving ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                "Save Changes"
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={closeView} 
                                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                                        Close
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </Modal>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </div>
    )
}