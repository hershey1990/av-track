import { Link } from 'react-router-dom'
import { LoginForm } from '@/features/auth/components/login-form'
import { BrandLogo } from '@/components/brand-logo'

export default function LoginPage() {
  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="text-center">
        <BrandLogo size="lg" className="justify-center" />
        <p className="text-muted-foreground mt-2 text-sm tracking-wide uppercase">Control de horarios laborales</p>
      </div>
      <LoginForm />
      <p className="text-sm text-muted-foreground">
        ¿No tenés cuenta?{' '}
        <Link to="/register" className="text-primary underline underline-offset-4">
          Registrate
        </Link>
      </p>
    </div>
  )
}
