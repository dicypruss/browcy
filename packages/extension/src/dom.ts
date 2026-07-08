export function generateAriaSnapshot(): string {
  let snapshot = "";
  let counter = 1;
  const interactiveTags = new Set(['a', 'button', 'input', 'textarea', 'select']);
  const hiddenElements = new Set(['script', 'style', 'noscript', 'svg', 'canvas', 'video', 'audio', 'iframe']);

  function isVisible(el: Element): boolean {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  function traverse(node: Node, depth: number) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text && text.length > 0) {
        const parent = node.parentElement;
        if (parent && !interactiveTags.has(parent.tagName.toLowerCase()) && !parent.tagName.match(/^H[1-6]$/i) && parent.getAttribute('role') !== 'button' && parent.getAttribute('role') !== 'link') {
            const indent = "  ".repeat(depth);
            snapshot += `${indent}- text "${text.substring(0, 200).replace(/\n/g, ' ')}"\n`;
        }
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      
      if (hiddenElements.has(tag) || !isVisible(el)) return;

      const isInteractive = interactiveTags.has(tag) || el.getAttribute('role') === 'button' || el.getAttribute('role') === 'link';
      const isHeading = tag.match(/^h[1-6]$/i);
      
      let indent = "  ".repeat(depth);
      let incrementDepth = false;

      if (isInteractive) {
        const targetId = `browcy-${counter++}`;
        el.setAttribute('data-browcy-id', targetId);
        
        let role = tag;
        if (el.hasAttribute('role')) role = el.getAttribute('role')!;
        
        let name = (el.textContent || '').trim().replace(/\n/g, ' ').substring(0, 100);
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            name = el.placeholder || el.value || el.name || 'input';
        }
        if (!name && el.hasAttribute('aria-label')) name = el.getAttribute('aria-label')!;
        if (!name && el.hasAttribute('title')) name = el.getAttribute('title')!;
        
        snapshot += `${indent}- ${role} "${name}" (selector: [data-browcy-id="${targetId}"])\n`;
        return; 
      } else if (isHeading) {
        snapshot += `${indent}- heading[${tag.substring(1)}] "${(el.textContent || '').trim().replace(/\n/g, ' ').substring(0, 100)}"\n`;
        return;
      } else if (tag === 'p' || tag === 'li' || tag === 'article' || tag === 'main' || tag === 'section') {
         incrementDepth = true;
      }

      for (const child of Array.from(node.childNodes)) {
        traverse(child, incrementDepth ? depth + 1 : depth);
      }
    }
  }

  traverse(document.body, 0);
  return snapshot || 'No content found on page.';
}

export const actionHandlers: Record<string, (payload: any) => Promise<any> | any> = {
  snapshot: () => generateAriaSnapshot(),
  
  extract_text: () => document.body ? document.body.innerText : "",
  
  click: (payload) => {
    const el = document.querySelector(payload.selector) as HTMLElement;
    if (!el) throw new Error(`Element not found: ${payload.selector}`);
    el.click();
    return `Clicked ${payload.selector}`;
  },
  
  type: (payload) => {
    const el = document.querySelector(payload.selector) as HTMLElement;
    if (!el) throw new Error(`Element not found: ${payload.selector}`);
    el.focus();
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
       el.value = payload.text;
       el.dispatchEvent(new Event('input', { bubbles: true }));
       el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return `Typed into ${payload.selector}`;
  },
  
  press_key: (payload) => {
    const activeEl = document.activeElement;
    if (!activeEl) throw new Error("No active element focused");
    activeEl.dispatchEvent(new KeyboardEvent('keydown', { key: payload.key, bubbles: true }));
    activeEl.dispatchEvent(new KeyboardEvent('keyup', { key: payload.key, bubbles: true }));
    return `Pressed ${payload.key} on active element`;
  },
  
  scroll: (payload) => {
    if (payload.selector) {
      const el = document.querySelector(payload.selector) as HTMLElement;
      if (!el) throw new Error(`Element not found: ${payload.selector}`);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return `Scrolled to ${payload.selector}`;
    } else {
      const amount = payload.amount || 500;
      const dir = payload.direction || "down";
      if (dir === "down") window.scrollBy(0, amount);
      else if (dir === "up") window.scrollBy(0, -amount);
      else if (dir === "left") window.scrollBy(-amount, 0);
      else if (dir === "right") window.scrollBy(amount, 0);
      return `Scrolled ${dir} by ${amount}px`;
    }
  },
  
  wait_for: (payload) => {
    return new Promise((resolve, reject) => {
      const timeoutMs = payload.timeoutMs || 10000;
      
      const checkCondition = () => {
        if (payload.selector) {
          return !!document.querySelector(payload.selector);
        } else if (payload.text) {
          return document.body && document.body.innerText?.includes(payload.text);
        }
        return false;
      };

      if (checkCondition()) return resolve("Condition already met");

      let responded = false;
      const observer = new MutationObserver((mutations, obs) => {
        if (checkCondition() && !responded) {
          responded = true;
          obs.disconnect();
          resolve("Condition met after mutation");
        }
      });

      observer.observe(document, { childList: true, subtree: true, characterData: true });

      setTimeout(() => {
        if (!responded) {
          responded = true;
          observer.disconnect();
          if (checkCondition()) {
            resolve("Condition met at timeout");
          } else {
            reject(new Error(`Timeout of ${timeoutMs}ms exceeded waiting for condition`));
          }
        }
      }, timeoutMs);
    });
  },
  
  get_console_logs: () => {
    return new Promise((resolve) => {
      let responded = false;
      const listener = (event: MessageEvent) => {
        if (event.data && event.data.type === 'BROWCY_LOGS_RESULT') {
          window.removeEventListener('message', listener);
          responded = true;
          resolve(event.data.logs);
        }
      };
      window.addEventListener('message', listener);
      window.postMessage({ type: 'BROWCY_GET_LOGS' }, '*');
      
      setTimeout(() => {
        if (!responded) {
          window.removeEventListener('message', listener);
          resolve([]); // fallback
        }
      }, 1000);
    });
  }
};
