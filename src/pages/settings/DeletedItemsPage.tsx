import { DeletedItemsSection } from '../../components/DeletedItemsSection'
import { SettingsSubPage } from '../../components/SettingsSubPage'

export function DeletedItemsPage() {
  return (
    <SettingsSubPage title="Deleted items" subtitle="Restore ingredients and recipes you removed from your catalog.">
      <DeletedItemsSection />
    </SettingsSubPage>
  )
}
