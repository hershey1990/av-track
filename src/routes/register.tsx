import { Link } from 'react-router-dom'
import { RegisterForm } from '@/features/auth/components/register-form'

export default function RegisterPage() {
  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">AV Time Tracking</h1>
        <p className="text-muted-foreground mt-1">Creá tu cuenta</p>
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
