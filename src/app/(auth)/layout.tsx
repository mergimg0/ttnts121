import { AuthProvider } from "@/contexts/auth-context";
import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="TTNTS121"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/sessions"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Book a Session
              </Link>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-neutral-200 bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-neutral-500 sm:px-6 lg:px-8">
            <p>&copy; {new Date().getFullYear()} Take The Next Step 121. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
