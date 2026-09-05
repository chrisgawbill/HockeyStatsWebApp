import { axiosExpressHandler } from '@/lib/axiosInstance';

export async function InterfaceWithChatBot(message: object, triCode?: string) {
  try {
    const serializedMessage = JSON.stringify({
      ...message,
      ...(triCode ? { cacheKey: triCode, triCode } : {}),
    });
    const response = await axiosExpressHandler.post(
      '/python-service',
      serializedMessage,
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
    const raw = response.data;
    if (typeof raw === 'object' && raw !== null) return raw;
    const str = String(raw);
    const start = str.indexOf('{');
    const end = str.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(str.slice(start, end + 1));
    }
    throw new Error('No JSON object found in AI response');
  } catch (error) {
    console.error('Error fetching data: ', error);
    throw error;
  }
}
