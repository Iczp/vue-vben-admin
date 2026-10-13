function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

// RequestClient rejects with the response body; interceptors receive the Axios error.
export function getRequestErrorMessage(cause: unknown, fallback = '请求失败') {
  const outer = record(cause);
  const response = record(outer.response);
  if (typeof response.status === 'number' && (response.data === undefined || response.data === null || response.data === '')) {
    return { message: `请求失败（HTTP ${response.status}）`, details: '服务端没有返回错误正文，请查看服务端日志中的具体原因。' };
  }
  let body = response.data ?? cause;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return { message: text(body) || fallback, details: '' };
    }
  }
  const data = record(body);
  const abpError = record(data.error);
  let message = text(abpError.message);
  const details: string[] = [];
  if (Object.keys(abpError).length > 0) {
    const detail = text(abpError.details);
    if (detail && detail !== message) details.push(detail);
    if (Array.isArray(abpError.validationErrors)) {
      for (const validation of abpError.validationErrors) {
        const value = record(validation);
        const validationMessage = text(value.message);
        const members = Array.isArray(value.members)
          ? value.members.filter((member): member is string => typeof member === 'string').join(', ')
          : '';
        if (validationMessage) details.push(members ? `${members}: ${validationMessage}` : validationMessage);
      }
    }
  } else if (text(data.error_description)) {
    message = text(data.error) || '认证失败';
    details.push(text(data.error_description));
  } else {
    message = text(data.error) || text(data.message) || text(data.title);
    const detail = text(data.detail);
    if (detail && detail !== message) details.push(detail);
    for (const [member, errors] of Object.entries(record(data.errors))) {
      if (Array.isArray(errors)) {
        for (const error of errors) {
          if (text(error)) details.push(`${member}: ${text(error)}`);
        }
      }
    }
  }
  return {
    message: message || text(outer.message) || fallback,
    details: [...new Set(details)].join('\n'),
  };
}
