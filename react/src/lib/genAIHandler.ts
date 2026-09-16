import { post } from '@/lib/apiClient';

export async function InterfaceWithChatBot(
  message: object,
  triCode?: string,
): Promise<object> {
  const serializedMessage = JSON.stringify({
    ...message,
    ...(triCode ? { cacheKey: triCode, triCode } : {}),
  });
  const raw = await post<unknown>('/python-service', serializedMessage, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (typeof raw === 'object' && raw !== null) return raw;
  const str = String(raw);
  const start = str.indexOf('{');
  const end = str.lastIndexOf('}');
  if (start !== -1 && end > start) {
    return JSON.parse(str.slice(start, end + 1));
  }
  throw new Error('No JSON object found in AI response');
}
