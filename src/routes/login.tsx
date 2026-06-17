import { Link } from 'react-router-dom'
import { LoginForm } from '@/features/auth/components/login-form'

export default function LoginPage() {
  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">AV Time Tracking</h1>
        <p className="text-muted-foreground mt-1">Control de horarios laborales</p>
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
