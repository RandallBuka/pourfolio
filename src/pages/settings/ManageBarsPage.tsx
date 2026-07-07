import { BarManagementSection } from '../../components/BarManagementSection'
import { SettingsSubPage } from '../../components/SettingsSubPage'

export function ManageBarsPage() {
  return (
    <SettingsSubPage title="Manage bars" subtitle="Photo, stats, rename, switch, or delete">
      <BarManagementSection />
    </SettingsSubPage>
  )
}
