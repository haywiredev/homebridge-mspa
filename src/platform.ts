import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
} from 'homebridge';
import {
  PLUGIN_NAME,
  PLATFORM_NAME,
  POLL_INTERVAL_MS,
  FAST_POLL_INTERVAL_MS,
  FAST_POLL_COUNT,
  MspaConfig,
  MspaDevice,
  MspaDeviceStatus,
} from './settings';
import { MspaApi } from './mspaApi';
import { ThermostatAccessory } from './accessories/thermostat';
import { FilterAccessory } from './accessories/filter';
import { BubblesAccessory } from './accessories/bubbles';
import { JetsAccessory } from './accessories/jets';


export class MspaStatusCache {
  private status: MspaDeviceStatus | null = null;
  private subscribers: Array<(s: MspaDeviceStatus) => void> = [];

  get(): MspaDeviceStatus | null { return this.status; }

  set(s: MspaDeviceStatus): void {
    this.status = s;
    for (const fn of this.subscribers) fn(s);
  }

  subscribe(fn: (s: MspaDeviceStatus) => void): void {
    this.subscribers.push(fn);
  }
}

export class MSpaPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly accessories: PlatformAccessory[] = [];

  private api!: MspaApi;
  private device!: MspaDevice;
  public readonly statusCache = new MspaStatusCache();

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly homebridgeApi: API,
  ) {
    this.Service = this.homebridgeApi.hap.Service;
    this.Characteristic = this.homebridgeApi.hap.Characteristic;

    this.homebridgeApi.on('didFinishLaunching', () => {
      this.initialize().catch(e => this.log.error(`Initialization failed: ${e}`));
    });
  }

  private async initialize(): Promise<void> {
    const cfg = this.config as unknown as MspaConfig;
    this.api = new MspaApi(cfg, this.log);
    await this.api.initialize();

    const devices = await this.api.getDevices();
    if (!devices.length) {
      this.log.error('Keine MSpa Geräte gefunden!');
      return;
    }
    this.device = devices[0];
    this.log.info(`Gerät gefunden: ${this.device.name} (${this.device.device_id})`);

    this.registerAccessories();
    this.startPolling();
  }

  private registerAccessories(): void {
    const configs = [
      { id: 'thermostat', name: `${this.config.name} Temperatur`, Class: ThermostatAccessory },
      { id: 'filter',     name: `${this.config.name} Filter`,     Class: FilterAccessory },
      { id: 'bubbles',    name: `${this.config.name} Blasen`,     Class: BubblesAccessory },
      { id: 'jets',       name: `${this.config.name} Jets`,       Class: JetsAccessory },
    ] as const;

    for (const { id, name, Class } of configs) {
      const uuid = this.homebridgeApi.hap.uuid.generate(`${this.device.device_id}-${id}`);
      const existing = this.accessories.find(a => a.UUID === uuid);
      const accessory = existing ?? new this.homebridgeApi.platformAccessory(name, uuid);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (Class as any)(this, accessory, this.device, this.api);
      if (!existing) {
        this.homebridgeApi.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }

  private startPolling(): void {
    setInterval(async () => {
      try {
        const status = await this.api.getStatus(this.device.device_id, this.device.product_id);
        this.statusCache.set(status);
      } catch (e) {
        this.log.warn(`Polling-Fehler: ${e}`);
      }
    }, POLL_INTERVAL_MS);
  }

  async sendCommandAndPoll(command: Partial<MspaDeviceStatus>): Promise<void> {
    // Optimistic update VOR dem API-Call — HomeKit fragt onGet sofort nach onSet ab
    const current = this.statusCache.get();
    if (current) {
      this.statusCache.set({ ...current, ...command });
    }
    await this.api.sendCommand(this.device.device_id, this.device.product_id, command);
    let count = 0;
    const interval = setInterval(async () => {
      try {
        const status = await this.api.getStatus(this.device.device_id, this.device.product_id);
        this.statusCache.set(status);
      } catch { /* ignore */ }
      if (++count >= FAST_POLL_COUNT) clearInterval(interval);
    }, FAST_POLL_INTERVAL_MS);
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.accessories.push(accessory);
  }
}
