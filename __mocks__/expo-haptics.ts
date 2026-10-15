import { jest } from '@jest/globals';

/** Test stand-in for expo-haptics, so tests can check which vibration a touch asks for. */
export const ImpactFeedbackStyle = {
  Light: 'light',
  Medium: 'medium',
  Heavy: 'heavy',
  Rigid: 'rigid',
  Soft: 'soft',
} as const;

export const NotificationFeedbackType = {
  Success: 'success',
  Warning: 'warning',
  Error: 'error',
} as const;

export const impactAsync = jest.fn(async () => {});
export const selectionAsync = jest.fn(async () => {});
export const notificationAsync = jest.fn(async () => {});
