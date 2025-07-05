/**
 * @jest-environment node
 */
import { isFacebookAuthEnabled, getFacebookAppId } from '../facebook';

describe('Facebook utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('isFacebookAuthEnabled', () => {
    it('should return true when NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED is true', () => {
      process.env.NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED = 'true';
      expect(isFacebookAuthEnabled()).toBe(true);
    });

    it('should return false when NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED is false', () => {
      process.env.NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED = 'false';
      expect(isFacebookAuthEnabled()).toBe(false);
    });

    it('should return false when NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED is undefined', () => {
      delete process.env.NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED;
      expect(isFacebookAuthEnabled()).toBe(false);
    });

    it('should return false when NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED is empty string', () => {
      process.env.NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED = '';
      expect(isFacebookAuthEnabled()).toBe(false);
    });
  });

  describe('getFacebookAppId', () => {
    it('should return the app ID when NEXT_PUBLIC_FACEBOOK_APP_ID is set', () => {
      process.env.NEXT_PUBLIC_FACEBOOK_APP_ID = 'test-app-id';
      expect(getFacebookAppId()).toBe('test-app-id');
    });

    it('should return undefined when NEXT_PUBLIC_FACEBOOK_APP_ID is not set', () => {
      delete process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      expect(getFacebookAppId()).toBeUndefined();
    });
  });
});
