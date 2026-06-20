import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { MSpaPlatform } from '../platform';
import { MspaDevice, MspaDeviceStatus } from '../settings';
import { MspaApi } from '../mspaApi';

export class FilterAccessory {
  private readonly service;
  private readonly C;

  constructor(
    private readonly platform: MSpaPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: MspaDevice,
    private readonly api: MspaApi,
  ) {
    this.C = platform.Characteristic;
    this.service = accessory.getService(platform.Service.Switch)
      ?? accessory.addService(platform.Service.Switch);

    this.service.getCharacteristic(this.C.On)
      .onGet(() => this.platform.statusCache.get()?.filter_state === 1)
      .onSet((v: CharacteristicValue) =>
        this.platform.sendCommandAndPoll({ filter_state: (v ? 1 : 0) as 0 | 1 }));

    platform.statusCache.subscribe((s: MspaDeviceStatus) =>
      this.service.updateCharacteristic(this.C.On, s.filter_state === 1));
  }
}
