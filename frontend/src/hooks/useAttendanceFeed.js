"use client"
import { useEffect, useState } from "react"
import { getLiveAttendance } from "@/lib/api"

export default function useAttendanceFeed() {
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getLiveAttendance()
                setRecords(res.data)
                setError(null)
            } catch (e) {
                setError("Cannot reach server")
            } finally {
                setLoading(false)
            }
        }

        fetch()
        const interval = setInterval(fetch, 5000) // poll every 5s
        return () => clearInterval(interval)
    }, [])

    return { records, loading, error }
}