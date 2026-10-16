import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { OnboardingProvider, useOnboarding } from '@/features/onboarding/OnboardingContext';
import { GoalsProvider } from '@/features/goals/GoalsContext';
import { HabitsProvider } from '@/features/habits/HabitsContext';
import { JournalProvider } from '@/features/journal/JournalContext';
import { LockProvider } from '@/features/lock/LockContext';
import { LockScreen } from '@/features/lock/LockScreen';
import { NotesProvider } from '@/features/notes/NotesContext';
import { PlannerProvider } from '@/features/planner/PlannerContext';
import { TasksProvider } from '@/features/tasks/TasksContext';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useAppFonts } from '@/theme/useAppFonts';
import { useTheme } from '@/theme/context';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { scheme, colors } = useTheme();
  const { completed } = useOnboarding();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!completed}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={completed}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="entry" options={{ presentation: 'modal' }} />
          <Stack.Screen name="note" options={{ presentation: 'modal' }} />
          <Stack.Screen name="read" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="review" />
          <Stack.Screen name="privacy" />
        </Stack.Protected>
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const fontsReady = useAppFonts();

  // The splash screen stays up until the fonts are ready, so text never jumps from one font to another.
  if (!fontsReady) return null;

  return (
    <ThemeProvider>
      <OnboardingProvider>
        <TasksProvider>
          <HabitsProvider>
            <GoalsProvider>
              <PlannerProvider>
                <JournalProvider>
                  <NotesProvider>
                    <LockProvider>
                      <RootNavigator />
                      <LockScreen />
                    </LockProvider>
                  </NotesProvider>
                </JournalProvider>
              </PlannerProvider>
            </GoalsProvider>
          </HabitsProvider>
        </TasksProvider>
      </OnboardingProvider>
    </ThemeProvider>
  );
}
