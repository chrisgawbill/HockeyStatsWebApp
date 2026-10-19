import { describe, expect, it } from 'vitest';
import {
  derivePushStatus,
  urlBase64ToUint8Array,
  type PushEnvironment,
} from '@/features/after-action-reports/utils/pushNotifications';

const base: PushEnvironment = {
  serverEnabled: true,
  supported: true,
  ios: false,
  standalone: false,
  permission: 'default',
  subscribed: false,
};

describe('urlBase64ToUint8Array', () => {
  it('decodes base64url with and without padding', () => {
    expect(Array.from(urlBase64ToUint8Array('AQID'))).toEqual([1, 2, 3]);
    expect(Array.from(urlBase64ToUint8Array('AQI'))).toEqual([1, 2]);
  });

  it('maps - and _ to + and /', () => {
    // 0xfb 0xff 0xbf is "-_-_" in base64url ("+/+/" in base64).
    expect(Array.from(urlBase64ToUint8Array('-_-_'))).toEqual(
      Array.from(Uint8Array.from(atob('+/+/'), (c) => c.charCodeAt(0))),
    );
  });
});

describe('derivePushStatus', () => {
  it('hides the UI when the server has push off', () => {
    expect(derivePushStatus({ ...base, serverEnabled: false })).toBe('hidden');
    expect(derivePushStatus({ ...base, serverEnabled: false, ios: true })).toBe(
      'hidden',
    );
  });

  it('hides it when the browser cannot do push', () => {
    expect(derivePushStatus({ ...base, supported: false })).toBe('hidden');
  });

  it('shows the install hint on iOS outside the installed app', () => {
    expect(derivePushStatus({ ...base, ios: true, supported: false })).toBe(
      'ios-install',
    );
    expect(derivePushStatus({ ...base, ios: true, standalone: true })).toBe(
      'off',
    );
  });

  it('reports denied, on, and off', () => {
    expect(derivePushStatus({ ...base, permission: 'denied' })).toBe('denied');
    expect(
      derivePushStatus({ ...base, permission: 'granted', subscribed: true }),
    ).toBe('on');
    expect(derivePushStatus({ ...base, subscribed: true })).toBe('off');
    expect(derivePushStatus(base)).toBe('off');
  });
});
