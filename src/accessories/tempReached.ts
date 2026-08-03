import { PlatformAccessory } from 'homebridge';
import { MSpaPlatform } from '../platform';
import { MspaDevice, MspaDeviceStatus } from '../settings';
import { MspaApi } from '../mspaApi';

export class TempReachedAccessory {
  private readonly service;
  private readonly C;
  private wasHeating = false;

  constructor(
    private readonly platform: MSpaPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: MspaDevice,
    private readonly api: MspaApi,
  ) {
    this.C = platform.Characteristic;

    this.service = accessory.getService(platform.Service.OccupancySensor)
      ?? accessory.addService(platform.Service.OccupancySensor);

    this.service.getCharacteristic(this.C.OccupancyDetected)
      .onGet(() => this.isReached() ? this.C.OccupancyDetected.OCCUPANCY_DETECTED : this.C.OccupancyDetected.OCCUPANCY_NOT_DETECTED);

    platform.statusCache.subscribe((s: MspaDeviceStatus) => this.updateFromStatus(s));
  }

  private isReached(): boolean {
    const s = this.platform.statusCache.get();
    if (!s || s.heater_state !== 1) return false;
    return s.water_temperature >= s.temperature_setting;
  }

  private updateFromStatus(s: MspaDeviceStatus): void {
    const heating = s.heater_state === 1;
    const reached = heating && s.water_temperature >= s.temperature_setting;

    // Benachrichtigung nur wenn Heizung aktiv war und Temperatur jetzt erreicht
    if (reached && this.wasHeating) {
      this.platform.log.info(`Whirlpool hat Zieltemperatur ${s.temperature_setting / 2}°C erreicht!`);
    }
    this.wasHeating = heating;

    this.service.updateCharacteristic(
      this.C.OccupancyDetected,
      reached ? this.C.OccupancyDetected.OCCUPANCY_DETECTED : this.C.OccupancyDetected.OCCUPANCY_NOT_DETECTED,
    );
  }
}
