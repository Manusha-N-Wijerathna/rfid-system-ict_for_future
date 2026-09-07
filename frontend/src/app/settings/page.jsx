"use client"
import { useEffect, useState } from "react"
import { getAdminProfile, updateAdminProfile, assignAdminRfid, startRegisterMode, stopRegisterMode, getRegisterResult } from "@/lib/api"
import { User, Key, Camera, Check, AlertCircle, CreditCard } from "lucide-react"

export default function SettingsPage() {
    const [fullName, setFullName] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [profilePicture, setProfilePicture] = useState("")
    const [rfidUid, setRfidUid] = useState("")
    const [registeringRfid, setRegisteringRfid] = useState(false)
    
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true)
            try {
                const res = await getAdminProfile()
                const data = res.data
                setFullName(data.full_name || "")
                setUsername(data.username || "")
                setProfilePicture(data.profile_picture || "")
                setRfidUid(data.rfid_uid || "")
            } catch (err) {
                console.error("Failed to load admin profile:", err)
                setError("Failed to load admin profile data.")
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    useEffect(() => {
        if (!registeringRfid) return
        const interval = setInterval(async () => {
            try {
                const res = await getRegisterResult()
                if (!res.data.scanned_uid) return
                const uid = res.data.scanned_uid
                await assignAdminRfid(uid)
                setRfidUid(uid)
                setRegisteringRfid(false)
                setMessage("Admin RFID card assigned successfully!")
            } catch (err) {
                setRegisteringRfid(false)
                setError(err.response?.data?.detail || "Failed to assign RFID card.")
            }
        }, 700)
        return () => clearInterval(interval)
    }, [registeringRfid])

    const registerAdminRfid = async () => {
        setError(null)
        setMessage(null)
        try {
            await startRegisterMode()
            setRegisteringRfid(true)
        } catch {
            setError("Could not start RFID registration mode.")
        }
    }

    const cancelRfidRegistration = async () => {
        await stopRegisterMode()
        setRegisteringRfid(false)
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            setError("Image size should be less than 2MB.")
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            setProfilePicture(reader.result)
        }
        reader.readAsDataURL(file)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setError(null)
        setMessage(null)

        if (!fullName.trim()) {
            setError("Full name is required.")
            return
        }

        if (!username.trim()) {
            setError("Username is required.")
            return
        }

        if (password && password !== confirmPassword) {
            setError("New password and confirm password do not match.")
            return
        }

        setSaving(true)
        try {
            const updatePayload = {
                full_name: fullName.trim(),
                username: username.trim(),
                profile_picture: profilePicture || null,
            }

            if (password.trim()) {
                updatePayload.password = password.trim()
            }

            const res = await updateAdminProfile(updatePayload)
            const updatedAdmin = res.data

            // Update stored user profile in localStorage
            localStorage.setItem("admin_user", JSON.stringify(updatedAdmin))

            // Trigger global auth event to update header/sidebar immediately
            window.dispatchEvent(new Event("adminAuthChanged"))

            setMessage("Admin profile updated successfully!")
            setPassword("")
            setConfirmPassword("")
        } catch (err) {
            console.error("Failed to update admin profile:", err)
            setError(err.response?.data?.detail || "Failed to update profile.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm">Loading admin profile settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Admin Profile Settings</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your full name, login username, password, and profile picture</p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold">
                    #ict_for_future
                </div>
            </div>

            {/* Notifications */}
            {message && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-xl flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800 font-medium">{message}</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                
                {/* 1. Profile Picture Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <Camera className="w-5 h-5 text-emerald-600" />
                        Profile Picture
                    </h3>

                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            {profilePicture ? (
                                <img
                                    src={profilePicture}
                                    alt="Admin Profile"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-emerald-100 shadow-md"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-emerald-100 shadow-md">
                                    {fullName ? fullName.charAt(0).toUpperCase() : "A"}
                                </div>
                            )}

                            <label className="absolute bottom-0 right-0 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full shadow-lg cursor-pointer transition-all">
                                <Camera className="w-4 h-4" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-gray-700">Upload New Photo</p>
                            <p className="text-xs text-gray-400">JPG, PNG or GIF. Max size 2MB.</p>
                            <div className="flex gap-2">
                                <label className="cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-4 py-2 rounded-xl border border-emerald-200 transition-all">
                                    Browse Image
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                                {profilePicture && (
                                    <button
                                        type="button"
                                        onClick={() => setProfilePicture("")}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                                    >
                                        Remove Photo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Admin Personal Details */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <User className="w-5 h-5 text-emerald-600" />
                        Admin Credentials & Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="e.g., System Administrator"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">
                                Username <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="e.g., admin"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Admin RFID Login */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                        Admin RFID Login
                    </h3>
                    <p className="text-xs text-gray-500">Assign an RFID card so the admin can sign in without a password.</p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Assigned card</p>
                            <p className="mt-1 font-mono text-sm text-gray-700">{rfidUid || "No card assigned"}</p>
                        </div>
                        {registeringRfid ? (
                            <button type="button" onClick={cancelRfidRegistration} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">
                                Cancel and wait for card
                            </button>
                        ) : (
                            <button type="button" onClick={registerAdminRfid} className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 border border-emerald-200">
                                Scan new admin card
                            </button>
                        )}
                    </div>
                    {registeringRfid && <p className="text-xs font-medium text-emerald-700">Registration mode active. Scan the admin card now.</p>}
                </div>

                {/* 4. Password Security */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <Key className="w-5 h-5 text-emerald-600" />
                        Change Password
                    </h3>
                    <p className="text-xs text-gray-400">Leave blank if you do not want to change your password.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Action */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Saving Changes...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" /> Save Profile Settings
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
