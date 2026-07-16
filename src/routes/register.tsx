import { Link } from 'react-router-dom'
import { RegisterForm } from '@/features/auth/components/register-form'
import { BrandLogo } from '@/components/brand-logo'

export default function RegisterPage() {
  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="text-center">
        <BrandLogo size="lg" className="justify-center" />
        <p className="text-muted-foreground mt-2 text-sm tracking-wide uppercase">Creá tu cuenta</p>
      </div>
      <RegisterForm />
      <p className="text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="text-primary underline underline-offset-4">
          Iniciá sesión
        </Link>
      </p>
    </div>
  )
}
