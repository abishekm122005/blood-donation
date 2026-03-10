import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BloodConnect - Blood Donation Platform",
  description: "Connect blood donors with those in need. Save lives through efficient blood donation management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <Navigation />
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </AuthProvider>
        <footer className="bg-gray-800 text-white py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-4">BloodConnect</h3>
                <p className="text-gray-400">Connecting donors with those in need</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="/search" className="hover:text-white">Find Donors</a></li>
                  <li><a href="/request-blood" className="hover:text-white">Request Blood</a></li>
                  <li><a href="/camps" className="hover:text-white">Donation Camps</a></li>
                  <li><a href="/blood-banks" className="hover:text-white">Blood Banks</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Account</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="/auth/login" className="hover:text-white">Login</a></li>
                  <li><a href="/auth/register" className="hover:text-white">Register</a></li>
                  <li><a href="/dashboard" className="hover:text-white">Dashboard</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Information</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><span className="text-gray-500">Emergency: 102</span></li>
                  <li><span className="text-gray-500">Red Cross: 1800-11-7263</span></li>
                  <li><a href="mailto:support@bloodconnect.com" className="hover:text-white">support@bloodconnect.com</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} BloodConnect. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
