import { RecipeManagementSection } from '../../components/RecipeManagementSection'
import { SettingsSubPage } from '../../components/SettingsSubPage'

export function ManageRecipesPage() {
  return (
    <SettingsSubPage title="Manage recipes" subtitle="Custom and cloned recipes you can edit or delete">
      <RecipeManagementSection />
    </SettingsSubPage>
  )
}
