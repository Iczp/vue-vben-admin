import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'antdv-next';
import { defineStore } from 'pinia';

import {
  exchangeScanTokenLoginApi,
  getUserInfoApi,
  loginApi,
  logoutApi,
} from '#/api';
import { $t } from '#/locales';

import { useAbpStore } from './abp';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const abpStore = useAbpStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 登录成功后的统一处理：设置 Token、加载 ABP 配置、获取用户信息、路由跳转与通知
   */
  async function handleLoginSuccess(
    accessToken: string,
    onSuccess?: () => Promise<void> | void,
  ) {
    accessStore.setAccessToken(accessToken);

    // 加载 ABP 全局应用配置与权限
    try {
      await abpStore.fetchApplicationConfiguration();
    } catch (e) {
      console.warn('Fetch ABP application configuration error:', e);
    }

    // 获取用户信息
    let userInfo: null | UserInfo = null;
    try {
      userInfo = await fetchUserInfo();
    } catch {
      userInfo = {
        avatar: '',
        desc: '',
        homePath: preferences.app.defaultHomePath || '/dashboard',
        realName:
          abpStore.currentUser?.name ||
          abpStore.currentUser?.userName ||
          '',
        roles: abpStore.currentUser?.roles || [],
        token: accessToken,
        userId: abpStore.currentUser?.id || '',
        username: abpStore.currentUser?.userName || '',
      };
      userStore.setUserInfo(userInfo);
    }

    if (accessStore.loginExpired) {
      accessStore.setLoginExpired(false);
    } else {
      onSuccess
        ? await onSuccess?.()
        : await router.push(
            userInfo?.homePath || preferences.app.defaultHomePath,
          );
    }

    if (userInfo?.realName || abpStore.currentUser?.name) {
      notification.success({
        description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName || abpStore.currentUser?.name || ''}`,
        duration: 3,
        title: $t('authentication.loginSuccess'),
      });
    }

    return { userInfo };
  }

  /**
   * 异步处理账号密码/常规登录操作
   * @param params 登录表单数据
   * @param onSuccess 成功回调
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const res = await loginApi(params);
      const accessToken =
        (res as any)?.accessToken || (res as any)?.access_token;

      if (accessToken) {
        const result = await handleLoginSuccess(accessToken, onSuccess);
        userInfo = result.userInfo;
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  /**
   * 异步处理扫码登录操作（通过 scanToken 兑换正式用户 OAuth 会话）
   * @param scanToken 扫码授权一次性凭据
   * @param onSuccess 成功回调
   */
  async function authLoginWithScanToken(
    scanToken: string,
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const res = await exchangeScanTokenLoginApi(scanToken);
      const accessToken =
        (res as any)?.accessToken || (res as any)?.access_token;

      if (accessToken) {
        const result = await handleLoginSuccess(accessToken, onSuccess);
        userInfo = result.userInfo;
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    abpStore.$reset();
    accessStore.setLoginExpired(false);

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    let userInfo: UserInfo;
    try {
      userInfo = await getUserInfoApi();
    } catch {
      userInfo = {
        avatar: '',
        desc: '',
        homePath: preferences.app.defaultHomePath || '/dashboard',
        realName:
          abpStore.currentUser?.name ||
          abpStore.currentUser?.userName ||
          '',
        roles: abpStore.currentUser?.roles || [],
        token: accessStore.accessToken || '',
        userId: abpStore.currentUser?.id || '',
        username: abpStore.currentUser?.userName || '',
      };
    }
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    authLoginWithScanToken,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
