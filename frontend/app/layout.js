import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata = {
  title: "IDK — Calisthenics & Bodyweight Tracker",
  description: "Modern dark-mode Calisthenics & Bodyweight Training Performance Tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="bg-[#09090b] text-[#f4f4f5] min-h-screen flex antialiased selection:bg-cyan-400/20 selection:text-cyan-400">
        {/* Persistent Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-[#0a0a0c]">
          <main className="flex-1 p-5 pt-16 md:p-8 md:pt-16 lg:pt-8 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
