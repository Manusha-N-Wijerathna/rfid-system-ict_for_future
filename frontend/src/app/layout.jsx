import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import AppShell from "@/components/AppShell"

const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-sans",
    display: "swap",
})

export const metadata = {
    title: "ICT For Future - Smart RFID School Dashboard",
    description: "Real-time Attendance, RFID Student Card & Payment Management System",
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={plusJakartaSans.variable}>
            <body className="bg-slate-50 text-slate-800 font-sans min-h-screen antialiased selection:bg-emerald-500 selection:text-white">
                <AppShell>{children}</AppShell>
            </body>
        </html>
    )
}