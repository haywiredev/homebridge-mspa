export const PLUGIN_NAME = 'homebridge-mspa';
export const PLATFORM_NAME = 'MSpaSpa';

export const APP_ID = 'e1c8e068f9ca11eba4dc0242ac120002';
export const APP_SECRET = '87025c9ecd18906d27225fe79cb68349';

export const API_REGIONS: Record<string, string> = {
  ROW: 'https://api.iot.the-mspa.com',
  US:  'https://api.usiot.the-mspa.com',
  CN:  'https://api.mspa.mxchip.com.cn',
};

export const POLL_INTERVAL_MS = 30_000;
export const FAST_POLL_INTERVAL_MS = 1_000;
export const FAST_POLL_COUNT = 3;
export const THROTTLE_MS = 400;

export interface MspaConfig {
  name: string;
  email: string;
  password: string;
  region: 'ROW' | 'US' | 'CN';
}

export interface MspaDeviceStatus {
  water_temperature: number;
  temperature_setting: number;
  heater_state: 0 | 1;
  filter_state: 0 | 1;
  bubble_state: 0 | 1;
  bubble_level: number;
  jet_state: 0 | 1;
  is_online: boolean;
}

export interface MspaDevice {
  device_id: string;
  product_id: string;
  name: string;
}
