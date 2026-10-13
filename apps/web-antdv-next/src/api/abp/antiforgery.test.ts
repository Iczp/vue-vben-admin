import { describe, expect, it, vi } from 'vitest';

import { antiforgeryServices, createAbpAntiforgery } from './antiforgery';

describe('independent ABP service antiforgery', () => {
  function setup() {
    const cookies = new Map<string, string>();
    const loadConfiguration = vi.fn(async (service: typeof antiforgeryServices[keyof typeof antiforgeryServices]) => {
      cookies.set(service.cookieName, `${service.cookieName}:token`);
    });
    return { cookies, loadConfiguration, getToken: createAbpAntiforgery({ loadConfiguration, readCookie: (name) => cookies.get(name) }) };
  }
  it('initializes each service separately and shares only concurrent requests to the same service', async () => {
    const { getToken, loadConfiguration } = setup();
    const tokens = await Promise.all([
      getToken('/chat/message-sender/send', 'POST', 'user-a'),
      getToken('/chat/message-sender/rollback', 'POST', 'user-a'),
      getToken('/cms/admin/assets', 'PUT', 'user-a'),
      getToken('/app-statistic/admin/settings', 'DELETE', 'user-a'),
      getToken('/identity/users', 'POST', 'user-a'),
    ]);
    expect(loadConfiguration).toHaveBeenCalledTimes(4);
    expect(tokens).toEqual(['Chat.XSRF-TOKEN:token', 'Chat.XSRF-TOKEN:token', 'Cms.XSRF-TOKEN:token', 'AppStatistic.XSRF-TOKEN:token', 'IM.XSRF-TOKEN:token']);
    expect(await getToken('/api/chat/send', 'POST', 'user-a')).toBe(tokens[0]);
    expect(loadConfiguration).toHaveBeenCalledTimes(4);
  });
  it('refreshes the service token when identity/tenant changes or the cookie disappears', async () => {
    const { cookies, getToken, loadConfiguration } = setup();
    await getToken('/cms/assets', 'POST', 'user-a:tenant-a');
    await getToken('/cms/assets', 'POST', 'user-b:tenant-a');
    cookies.delete('Cms.XSRF-TOKEN');
    await getToken('/cms/assets', 'POST', 'user-b:tenant-a');
    expect(loadConfiguration).toHaveBeenCalledTimes(3);
  });
  it('does not preflight safe reads or AuthServer scan-login requests', async () => {
    const { getToken, loadConfiguration } = setup();
    expect(await getToken('/chat/history', 'GET', '')).toBeUndefined();
    expect(await getToken('/cms/assets', 'OPTIONS', '')).toBeUndefined();
    expect(await getToken('/chat/scan-login/token', 'POST', '')).toBeUndefined();
    expect(loadConfiguration).not.toHaveBeenCalled();
  });
  it('blocks writes if the correct service cookie is missing, rather than using another service token', async () => {
    const cookies = new Map([['IM.XSRF-TOKEN', 'wrong-service-token']]);
    const loadConfiguration = vi.fn().mockResolvedValue(undefined);
    const getToken = createAbpAntiforgery({ loadConfiguration, readCookie: (name) => cookies.get(name) });
    await expect(getToken('/chat/send', 'POST', 'user')).rejects.toThrow('Chat.XSRF-TOKEN');
    loadConfiguration.mockImplementation(async () => { cookies.set('Chat.XSRF-TOKEN', 'chat-token'); });
    expect(await getToken('/chat/send', 'POST', 'user')).toBe('chat-token');
  });
});
