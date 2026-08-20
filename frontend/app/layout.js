import "./globals.css";
import { Space_Grotesk, Inter } from "next/font/google";
import Sidebar from "@/components/layout/Sidebar";
import { AuthProvider } from "@/components/auth/AuthContext";
import AuthGuard from "@/components/auth/AuthGuard";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata = {
  title: "IDK — Calisthenics & Bodyweight Tracker",
  description: "Modern dark-mode Calisthenics & Bodyweight Training Performance Tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark h-full ${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="bg-(--bg) text-(--text) min-h-screen flex antialiased selection:bg-(--accent)/25 selection:text-(--accent)">
        <AuthProvider>
          <AuthGuard>
            {/* Persistent Left Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-(--bg)">
              <main className="flex-1 p-5 pt-16 md:p-8 md:pt-16 lg:pt-8 max-w-[1600px] w-full mx-auto">
                {children}
              </main>
            </div>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}