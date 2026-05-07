import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import AppNav from "@/components/AppNav";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salary Management",
  description: "HR Salary Management Tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <AuthProvider>
          <ToastProvider>
            <AppNav />
            <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
