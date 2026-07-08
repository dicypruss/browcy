import { describe, it, expect } from 'vitest';
import { verifyWebSocketOrigin, verifyIpcHeader } from './security.js';

describe('Security Validations', () => {
  describe('verifyWebSocketOrigin', () => {
    it('should allow valid chrome-extension origin', () => {
      expect(verifyWebSocketOrigin('chrome-extension://abcdefghijklmnop')).toBe(true);
    });

    it('should block http origins', () => {
      expect(verifyWebSocketOrigin('http://localhost:3000')).toBe(false);
    });

    it('should block empty origins', () => {
      expect(verifyWebSocketOrigin(undefined)).toBe(false);
      expect(verifyWebSocketOrigin('')).toBe(false);
    });
  });

  describe('verifyIpcHeader', () => {
    it('should allow exactly "true"', () => {
      expect(verifyIpcHeader('true')).toBe(true);
    });

    it('should block missing header', () => {
      expect(verifyIpcHeader(undefined)).toBe(false);
    });

    it('should block invalid header value', () => {
      expect(verifyIpcHeader('false')).toBe(false);
      expect(verifyIpcHeader('1')).toBe(false);
    });
    
    it('should block array of headers', () => {
      expect(verifyIpcHeader(['true'])).toBe(false);
    });
  });
});
