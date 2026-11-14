export function getAuthRedirect({ token, section, profileChecked, profileLoaded, profile }) {
  if (!token) return section === '(auth)' ? null : '/(auth)/login';
  if (!profileChecked) return null;

  if (section === '(auth)') {
    if (!profileLoaded) return '/(tabs)';
    return profile?.preferences ? '/(tabs)' : '/onboarding';
  }
  if (profileLoaded && !profile?.preferences && section !== 'onboarding') return '/onboarding';
  if (profileLoaded && profile?.preferences && section === 'onboarding') return '/(tabs)';
  return null;
}
