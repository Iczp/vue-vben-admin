import { describe, expect, it } from 'vitest';

import { getRequestErrorMessage } from './request-error';

describe('request error messages', () => {
  it('retains the HTTP status when the server returns an empty error body', () => {
    expect(getRequestErrorMessage({ message: 'Request failed with status code 400', response: { status: 400, data: '' } })).toEqual({ message: '请求失败（HTTP 400）', details: '服务端没有返回错误正文，请查看服务端日志中的具体原因。' });
  });
  const body = {
    error: {
      message: '文章发送失败',
      details: '当前账号不允许发言',
      validationErrors: [{ message: '标题不能为空', members: ['Content.Items[0].Title'] }],
    },
  };
  it('preserves ABP details and member validation from both the rejected body and Axios errors', () => {
    const expected = { message: '文章发送失败', details: '当前账号不允许发言\nContent.Items[0].Title: 标题不能为空' };
    expect(getRequestErrorMessage(body)).toEqual(expected);
    expect(getRequestErrorMessage({ message: 'Request failed with status code 400', response: { status: 400, data: body } })).toEqual(expected);
    expect(getRequestErrorMessage({ response: { data: JSON.stringify(body) } })).toEqual(expected);
  });
  it('shows ASP.NET validation problem details instead of a generic 400 error', () => {
    expect(getRequestErrorMessage({ title: 'Validation failed', detail: 'Invalid request', errors: { Title: ['Required', 'Too long'] } })).toEqual({ message: 'Validation failed', details: 'Invalid request\nTitle: Required\nTitle: Too long' });
  });
  it('keeps OAuth, network and local error messages', () => {
    expect(getRequestErrorMessage({ error: 'invalid_grant', error_description: 'Token expired' })).toEqual({ message: 'invalid_grant', details: 'Token expired' });
    expect(getRequestErrorMessage(new Error('Network Error')).message).toBe('Network Error');
    expect(getRequestErrorMessage(null, '操作失败')).toEqual({ message: '操作失败', details: '' });
  });
});
