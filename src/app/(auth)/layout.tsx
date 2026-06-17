import { GuestGuard } from '@/components/guest-guard'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <GuestGuard>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </GuestGuard>
  )
}
