import { describe, it, expect, vi } from 'vitest';
import { handleToolCall } from './handlers.js';
import type { BrowserRequest } from '@browcy/shared';

describe('handleToolCall', () => {
  it('should handle browser_navigate correctly', async () => {
    const sendToBrowser = vi.fn().mockResolvedValue('success');
    
    const result = await handleToolCall(
      'browser_navigate', 
      { url: 'https://example.com' }, 
      sendToBrowser
    );
    
    expect(sendToBrowser).toHaveBeenCalledWith({
      action: 'navigate',
      payload: { url: 'https://example.com' }
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Navigated to https://example.com');
  });

  it('should handle browser_create_tab correctly', async () => {
    const sendToBrowser = vi.fn().mockResolvedValue({ id: 123 });
    
    const result = await handleToolCall(
      'browser_create_tab', 
      { url: 'https://example.com', active: false }, 
      sendToBrowser
    );
    
    expect(sendToBrowser).toHaveBeenCalledWith({
      action: 'create_tab',
      payload: { url: 'https://example.com', active: false }
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Tab created:');
  });

  it('should return error for unknown tool', async () => {
    const sendToBrowser = vi.fn();
    const result = await handleToolCall('unknown_tool', {}, sendToBrowser);
    
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown tool');
  });

  it('should return error on Zod validation failure', async () => {
    const sendToBrowser = vi.fn();
    const result = await handleToolCall('browser_navigate', { url: 'not-a-url' }, sendToBrowser);
    
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error');
  });
});
