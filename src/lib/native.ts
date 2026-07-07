import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

export async function initNativeShell() {
  if (!Capacitor.isNativePlatform()) return

  document.documentElement.classList.add('native-app')

  try {
    await StatusBar.setStyle({ style: Style.Light })
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#1e293b' })
    }
  } catch {
    // Status bar API unavailable in some webviews
  }

  try {
    await SplashScreen.hide()
  } catch {
    // Splash screen already hidden
  }
}
