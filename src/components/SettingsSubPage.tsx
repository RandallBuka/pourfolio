import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar } from './NavBar'

interface SettingsSubPageProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export function SettingsSubPage({ title, subtitle, children }: SettingsSubPageProps) {
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="page settings-subpage">
      <NavBar title={title} onBack={() => navigate('/more')} />
      {subtitle ? <p className="settings-subpage-sub">{subtitle}</p> : null}
      {children}
    </div>
  )
}
