'use client'

import { Link, useLocation } from 'react-router-dom'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Home, History, FileText, Settings, Shield, LogOut } from 'lucide-react'
import { signOut } from '@/features/auth/api'
import { useProfile } from '@/hooks/use-profile'
import { useUser } from '@/hooks/use-user'
import { NotificationBell } from '@/features/notifications/components/notification-bell'

export function NavBar() {
  const { pathname } = useLocation()
  const { user } = useUser()
  const { data: profile } = useProfile(user?.id)

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  if (!user) return null

  const isActive = (path: string) => pathname === path

  const initials = profile?.full_name?.substring(0, 2).toUpperCase() ?? 'U'

  const navItems = [
    { path: '/', label: 'Hoy', icon: Home },
    { path: '/history', label: 'Historial', icon: History },
    { path: '/report', label: 'Reportes', icon: FileText },
    ...(profile?.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: Shield }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center">
          <BrandLogo size="md" showWordmark />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={active ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-1.5"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            )
          })}

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger className="ml-1 cursor-pointer">
              <Avatar className="h-8 w-8 border border-border/60">
                <AvatarFallback className="text-xs font-heading font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <div className="flex items-center gap-3 px-2 py-3">
                <Avatar className="h-8 w-8 border border-border/60">
                  <AvatarFallback className="text-[10px] font-heading font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-foreground truncate">
                    {profile?.full_name ?? 'Usuario'}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {profile?.role ?? 'usuario'}
                  </span>
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem>
                <Link to="/settings" className="flex items-center gap-2 w-full">
                  <Settings className="h-4 w-4" />
                  Ajustes
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
