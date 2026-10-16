function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * 清理后端异常详细信息，去除堆栈追踪和重复类名前缀，保留真正有意义的业务解释
 */
function sanitizeErrorDetail(detail: string, mainMessage: string): string {
  if (!detail) return '';
  let clean = detail;

  // 1. 截断 STACK TRACE 及其后的所有 C# CLR 堆栈
  const stackTraceIndex = clean.indexOf('STACK TRACE:');
  if (stackTraceIndex !== -1) {
    clean = clean.substring(0, stackTraceIndex).trim();
  }

  // 2. 移除常见的 C# 异常类名前缀（如 "UserFriendlyException: ", "BusinessException: "）
  clean = clean.replace(/^[a-zA-Z0-9.]+Exception:\s*/, '').trim();

  // 3. 如果处理后的 detail 与主消息相同，则无需重复展示
  if (clean === mainMessage.trim()) {
    return '';
  }

  return clean;
}

// RequestClient rejects with the response body; interceptors receive the Axios error.
export function getRequestErrorMessage(cause: unknown, fallback = '请求失败') {
  const outer = record(cause);
  const response = record(outer.response);
  if (
    typeof response.status === 'number' &&
    (response.data === undefined ||
      response.data === null ||
      response.data === '')
  ) {
    return {
      message: `请求失败（HTTP ${response.status}）`,
      details: '服务端没有返回错误正文，请查看服务端日志中的具体原因。',
    };
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
    const detail = sanitizeErrorDetail(text(abpError.details), message);
    if (detail && detail !== message) details.push(detail);
    if (Array.isArray(abpError.validationErrors)) {
      for (const validation of abpError.validationErrors) {
        const value = record(validation);
        const validationMessage = text(value.message);
        const members = Array.isArray(value.members)
          ? value.members
              .filter((member): member is string => typeof member === 'string')
              .join(', ')
          : '';
        if (validationMessage)
          details.push(
            members ? `${members}: ${validationMessage}` : validationMessage,
          );
      }
    }
  } else if (text(data.error_description)) {
    message = text(data.error) || '认证失败';
    details.push(text(data.error_description));
  } else {
    message = text(data.error) || text(data.message) || text(data.title);
    const detail = sanitizeErrorDetail(text(data.detail), message);
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
