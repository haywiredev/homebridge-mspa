import axios, { AxiosInstance } from 'axios';
import md5 from 'md5';
import { APP_ID, APP_SECRET, API_REGIONS, THROTTLE_MS, MspaConfig, MspaDevice, MspaDeviceStatus } from './settings';

export class MspaApi {
  private token: string | null = null;
  private lastRequestTime = 0;
  private readonly baseUrl: string;
  private readonly http: AxiosInstance;

  constructor(
    private readonly config: MspaConfig,
    private readonly log: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void; debug: (m: string) => void },
  ) {
    this.baseUrl = API_REGIONS[config.region] ?? API_REGIONS['ROW'];
    this.http = axios.create({ baseURL: this.baseUrl, timeout: 10_000 });
  }

  private buildSignature(nonce: string, ts: string): string {
    return md5(`${APP_ID},${APP_SECRET},${nonce},${ts}`).toUpperCase();
  }

  private buildNonce(): string {
    return Math.random().toString(36).substring(2).padEnd(32, '0').substring(0, 32);
  }

  private buildHeaders(): Record<string, string> {
    const nonce = this.buildNonce();
    const ts = Math.floor(Date.now() / 1000).toString();
    return {
      'push_type': 'Android',
      'authorization': `token ${this.token ?? ''}`,
      'appid': APP_ID,
      'nonce': nonce,
      'ts': ts,
      'lan_code': 'de',
      'sign': this.buildSignature(nonce, ts),
      'content-type': 'application/json; charset=UTF-8',
      'accept-encoding': 'gzip',
      'user-agent': 'okhttp/4.9.0',
    };
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < THROTTLE_MS) {
      await new Promise(r => setTimeout(r, THROTTLE_MS - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  private async login(): Promise<void> {
    await this.throttle();
    const res = await axios.post(`${this.baseUrl}/api/enduser/get_token/`, {
      account: this.config.email,
      app_id: APP_ID,
      password: this.config.password,
      brand: '',
      registration_id: '',
      push_type: 'android',
      lan_code: 'EN',
      country: '',
    }, { headers: this.buildHeaders() });
    this.token = res.data.data.token;
    this.log.info('MSpa: Login erfolgreich');
  }

  async initialize(): Promise<void> {
    await this.login();
  }

  async getDevices(): Promise<MspaDevice[]> {
    await this.throttle();
    try {
      const res = await this.http.get('/api/enduser/devices/', { headers: this.buildHeaders() });
      return res.data.data as MspaDevice[];
    } catch (e: any) {
      if (e?.response?.status === 401) {
        await this.login();
        return this.getDevices();
      }
      throw e;
    }
  }

  async getStatus(deviceId: string, productId: string): Promise<MspaDeviceStatus> {
    await this.throttle();
    try {
      const res = await this.http.post('/api/device/thing_shadow/', {
        device_id: deviceId,
        product_id: productId,
      }, { headers: this.buildHeaders() });
      return res.data.data.state.reported as MspaDeviceStatus;
    } catch (e: any) {
      if (e?.response?.status === 401) {
        await this.login();
        return this.getStatus(deviceId, productId);
      }
      throw e;
    }
  }

  async sendCommand(deviceId: string, productId: string, command: Partial<MspaDeviceStatus>): Promise<void> {
    await this.throttle();
    const payload = {
      device_id: deviceId,
      product_id: productId,
      desired: JSON.stringify({ state: { desired: command } }),
    };
    try {
      await this.http.post('/api/device/command', payload, { headers: this.buildHeaders() });
    } catch (e: any) {
      if (e?.response?.status === 401) {
        await this.login();
        await this.sendCommand(deviceId, productId, command);
        return;
      }
      throw e;
    }
  }
}
