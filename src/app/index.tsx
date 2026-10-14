import { Redirect } from 'expo-router';

import { useOnboarding } from '@/features/onboarding/OnboardingContext';
import { startRoute } from '@/features/onboarding/startRoute';

/** The app's entry address ("/"). It only forwards to the first-run screen or the Home tab. */
export default function Index() {
  const { completed } = useOnboarding();

  return <Redirect href={startRoute(completed)} />;
}
