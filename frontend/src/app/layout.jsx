import "./globals.css"
import AppShell from "@/components/AppShell"

export const metadata = {
    title: "RFID School Dashboard",
    description: "Attendance & Payment Management",
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="bg-gray-100 min-h-screen">
                <AppShell>{children}</AppShell>
            </body>
        </html>
    )
}