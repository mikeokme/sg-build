import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.huaigong.app',
  appName: '淮工集团',
  webDir: 'out',
  server: {
    url: 'http://192.168.1.100:14726',
    cleartext: true,
  },
};

export default config;