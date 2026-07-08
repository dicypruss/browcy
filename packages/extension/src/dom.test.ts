/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { actionHandlers } from './dom.js';

describe('DOM Action Handlers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should click an element', async () => {
    document.body.innerHTML = '<button id="btn">Click me</button>';
    const btn = document.getElementById('btn')!;
    
    let clicked = false;
    btn.addEventListener('click', () => { clicked = true; });

    const result = await actionHandlers.click({ selector: '#btn' });
    expect(clicked).toBe(true);
    expect(result).toBe('Clicked #btn');
  });

  it('should throw if click element not found', () => {
    expect(() => actionHandlers.click({ selector: '#missing' })).toThrow('Element not found');
  });

  it('should type text into input', async () => {
    document.body.innerHTML = '<input id="input" />';
    const input = document.getElementById('input') as HTMLInputElement;

    const result = await actionHandlers.type({ selector: '#input', text: 'hello' });
    expect(input.value).toBe('hello');
    expect(result).toBe('Typed into #input');
  });
});
