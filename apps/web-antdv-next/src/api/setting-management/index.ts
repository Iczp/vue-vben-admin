import { requestClient } from '#/api/request';

export interface EmailSettingsDto {
  defaultFromAddress?: string;
  defaultFromDisplayName?: string;
  enableSsl?: boolean;
  smtpDomain?: string;
  smtpHost?: string;
  smtpPassword?: string;
  smtpPort?: number;
  smtpUseDefaultCredentials?: boolean;
  smtpUserName?: string;
}

export interface UpdateEmailSettingsDto extends EmailSettingsDto {}

export interface SendTestEmailInput {
  body?: string;
  senderEmailAddress?: string;
  subject: string;
  targetEmailAddress: string;
}

export interface NameValueDto<T = string> {
  name?: string;
  value?: T;
}

/**
 * 获取邮件配置
 */
export async function getEmailSettingsApi() {
  return requestClient.get<EmailSettingsDto>('/setting-management/emailing');
}

/**
 * 更新邮件配置
 */
export async function updateEmailSettingsApi(data: UpdateEmailSettingsDto) {
  return requestClient.post<void>('/setting-management/emailing', data);
}

/**
 * 发送测试邮件
 */
export async function sendTestEmailApi(data: SendTestEmailInput) {
  return requestClient.post<void>(
    '/setting-management/emailing/send-test-email',
    data,
  );
}

/**
 * 获取当前系统配置的时区
 */
export async function getTimezoneApi() {
  return requestClient.get<string>('/setting-management/timezone');
}

/**
 * 设置系统时区
 */
export async function setTimezoneApi(timezone: string) {
  return requestClient.post<void>(
    `/setting-management/timezone?timezone=${encodeURIComponent(timezone)}`,
  );
}

/**
 * 获取支持的所有时区列表
 */
export async function getTimezonesApi() {
  return requestClient.get<NameValueDto[]>('/setting-management/timezone/timezones');
}
