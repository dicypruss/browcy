export function verifyWebSocketOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return origin.startsWith('chrome-extension://');
}

export function verifyIpcHeader(header: string | string[] | undefined): boolean {
  if (Array.isArray(header)) return false;
  return header === 'true';
}
