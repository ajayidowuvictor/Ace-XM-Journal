export type StartRoute = '/onboarding' | '/home';

/** Where the app opens: the first-run screen until setup is done, then the Home tab. */
export function startRoute(onboardingCompleted: boolean): StartRoute {
  return onboardingCompleted ? '/home' : '/onboarding';
}
