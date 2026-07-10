import { describe, it, expect } from 'vitest';
import { 
  NavigateSchema, 
  ClickSchema, 
  TypeSchema, 
  CreateTabSchema,
  ScreenshotSchema
} from './schemas.js';

describe('Zod Schemas', () => {
  
  describe('NavigateSchema', () => {
    it('should validate a correct URL', () => {
      const result = NavigateSchema.safeParse({ url: 'https://example.com' });
      expect(result.success).toBe(true);
    });

    it('should fail on an invalid URL', () => {
      const result = NavigateSchema.safeParse({ url: 'not-a-url' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Must be a valid URL');
      }
    });

    it('should allow optional tabId', () => {
      const result = NavigateSchema.safeParse({ url: 'https://example.com', tabId: 123 });
      expect(result.success).toBe(true);
    });
  });

  describe('ClickSchema', () => {
    it('should validate a valid selector', () => {
      const result = ClickSchema.safeParse({ selector: '#submit-btn' });
      expect(result.success).toBe(true);
    });

    it('should fail if selector is missing', () => {
      const result = ClickSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('TypeSchema', () => {
    it('should validate with selector and text', () => {
      const result = TypeSchema.safeParse({ selector: '#username', text: 'admin' });
      expect(result.success).toBe(true);
    });

    it('should fail if text is missing', () => {
      const result = TypeSchema.safeParse({ selector: '#username' });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateTabSchema', () => {
    it('should default active to not present if omitted, but allow true/false', () => {
      const result = CreateTabSchema.safeParse({ url: 'https://example.com', active: false });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });
  });

  describe('ScreenshotSchema', () => {
    it('should validate with no arguments', () => {
      const result = ScreenshotSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should allow optional fullPage flag', () => {
      const result = ScreenshotSchema.safeParse({ fullPage: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullPage).toBe(true);
      }
    });
  });

});
