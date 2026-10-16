import { jest } from '@jest/globals';

/** Test stand-in for expo-local-authentication: no sensor, nothing matches. */
export const hasHardwareAsync = jest.fn(async () => false);
export const isEnrolledAsync = jest.fn(async () => false);
export const authenticateAsync = jest.fn(async () => ({ success: false, error: 'not_available' }));
