/* ============================================================
   问问大师 · WorkBuddy 云服务公开配置
   ------------------------------------------------------------
   唯一来源：workbuddy_cloud_service 返回的 publicConfig（应用「问问大师」）。
   这些是面向终端用户的公开值，不包含任何长期密钥；服务端会校验
   publishableKey 与请求 Origin 是否匹配，因此不要在别处复制或改写。
   ============================================================ */

export const publicConfig = Object.freeze({
  resourceId: 'wbcs_RqNipXZHnr25J3YvXw8vSt',
  endpoint: 'https://wenwen-master-75489.app.workbuddy.host',
  oauthRelayBaseUrl: 'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
  publishableKey: 'wbpk_D9vUM7d3TAzAu2J0z65Ty9_MnVVBOWuhQuAyjaLc413vNZHZj62YMCc',
});
