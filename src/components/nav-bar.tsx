'use client'

import { Link, useLocation } from 'react-router-dom'
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 max-w-lg mx-auto">
        <Link to="/" className="flex items-center">
          <span className="flex items-center justify-center h-7 w-7 rounded-md bg-primary text-primary-foreground font-bold text-xs">AV</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link to="/">
            <Button variant={isActive('/') ? 'default' : 'ghost'} size="sm" className="gap-1.5">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Hoy</span>
            </Button>
          </Link>

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger className="ml-1 cursor-pointer">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <div className="flex items-center gap-2 px-2 py-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground truncate">
                  {profile?.full_name ?? 'Usuario'}
                </span>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem>
                <Link to="/history" className="flex items-center gap-2 w-full">
                  <History className="h-4 w-4" />
                  Historial
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/report" className="flex items-center gap-2 w-full">
                  <FileText className="h-4 w-4" />
                  Reportes
                </Link>
              </DropdownMenuItem>

              {profile?.role === 'admin' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link to="/admin" className="flex items-center gap-2 w-full">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

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
