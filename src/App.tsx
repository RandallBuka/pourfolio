import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import { TabBar } from './components/TabBar'
import { InstallPrompt } from './components/InstallPrompt'
import { OfflineIndicator } from './components/OfflineIndicator'
import { MyBarPage } from './pages/MyBarPage'
import { CanMakePage } from './pages/CanMakePage'
import { NeedPage } from './pages/NeedPage'
import { MyIngredientsPage } from './pages/MyIngredientsPage'
import { AllIngredientsPage } from './pages/AllIngredientsPage'
import { IngredientDetailPage } from './pages/IngredientDetailPage'
import { DrinksPage } from './pages/DrinksPage'
import { DrinkDetailPage } from './pages/DrinkDetailPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { ShoppingListPage } from './pages/ShoppingListPage'
import { SharedShelfPage } from './pages/SharedShelfPage'
import { MorePage } from './pages/MorePage'
import { getRouterBasename, useHashRouter } from './lib/routerBase'

function AppShell() {
  return (
    <div className="app-shell">
      <OfflineIndicator />
      <InstallPrompt />
      <main className="page-content">
        <Routes>
          <Route path="/" element={<MyBarPage />} />
          <Route path="/can-make" element={<CanMakePage />} />
          <Route path="/need" element={<NeedPage />} />
          <Route path="/shopping" element={<ShoppingListPage />} />
          <Route path="/share/:token" element={<SharedShelfPage />} />
          <Route path="/my-ingredients" element={<MyIngredientsPage />} />
          <Route path="/ingredients" element={<AllIngredientsPage />} />
          <Route path="/ingredients/:id" element={<IngredientDetailPage />} />
          <Route path="/drinks" element={<DrinksPage />} />
          <Route path="/drinks/:id" element={<DrinkDetailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/more" element={<MorePage />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  )
}

export default function App() {
  const basename = getRouterBasename()

  return (
    <ThemeProvider>
      <AppProvider>
        {useHashRouter() ? (
          // Hash routes live in #/… — do not pass GitHub Pages basename here.
          <HashRouter>
            <AppShell />
          </HashRouter>
        ) : (
          <BrowserRouter basename={basename}>
            <AppShell />
          </BrowserRouter>
        )}
      </AppProvider>
    </ThemeProvider>
  )
}
