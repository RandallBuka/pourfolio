const ONBOARDING_KEY = 'pourfolio-onboarding-done-v1'

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === '1'
}

export function markOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_KEY, '1')
}
