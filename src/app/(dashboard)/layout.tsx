import { NavBar } from '@/components/nav-bar'
import { AuthGuard } from '@/components/auth-guard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <NavBar />
      <main className="flex-1 w-full max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </AuthGuard>
  )
}
