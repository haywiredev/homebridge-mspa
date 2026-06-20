import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { MSpaPlatform } from '../platform';
import { MspaDevice, MspaDeviceStatus } from '../settings';
import { MspaApi } from '../mspaApi';

export class ThermostatAccessory {
  private readonly service;
  private readonly C;

  constructor(
    private readonly platform: MSpaPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: MspaDevice,
    private readonly api: MspaApi,
  ) {
    this.C = platform.Characteristic;

    accessory.getService(platform.Service.AccessoryInformation)!
      .setCharacteristic(this.C.Manufacturer, 'MSpa')
      .setCharacteristic(this.C.Model, 'Hot Tub')
      .setCharacteristic(this.C.SerialNumber, device.device_id);

    this.service = accessory.getService(platform.Service.Thermostat)
      ?? accessory.addService(platform.Service.Thermostat);

    this.service.getCharacteristic(this.C.CurrentTemperature)
      .onGet(() => this.getCurrentTemperature());

    this.service.getCharacteristic(this.C.TargetTemperature)
      .setProps({ minValue: 20, maxValue: 42, minStep: 1 })
      .onGet(() => this.getTargetTemperature())
      .onSet((v) => this.setTargetTemperature(v));

    this.service.getCharacteristic(this.C.CurrentHeatingCoolingState)
      .onGet(() => this.getCurrentHeatingState());

    this.service.getCharacteristic(this.C.TargetHeatingCoolingState)
      .setProps({ validValues: [0, 1] })
      .onGet(() => this.getTargetHeatingState())
      .onSet((v) => this.setHeatingState(v));

    this.service.getCharacteristic(this.C.TemperatureDisplayUnits)
      .setValue(this.C.TemperatureDisplayUnits.CELSIUS);

    platform.statusCache.subscribe((s) => this.updateFromStatus(s));
  }

  private status(): MspaDeviceStatus | null {
    return this.platform.statusCache.get();
  }

  private getCurrentTemperature(): CharacteristicValue {
    const s = this.status();
    return s ? s.water_temperature / 2 : 20;
  }

  private getTargetTemperature(): CharacteristicValue {
    const s = this.status();
    return s ? s.temperature_setting / 2 : 38;
  }

  private async setTargetTemperature(value: CharacteristicValue): Promise<void> {
    const temp = value as number;
    await this.platform.sendCommandAndPoll({ temperature_setting: temp * 2 });
  }

  private getCurrentHeatingState(): CharacteristicValue {
    const s = this.status();
    return s?.heater_state === 1
      ? this.C.CurrentHeatingCoolingState.HEAT
      : this.C.CurrentHeatingCoolingState.OFF;
  }

  private getTargetHeatingState(): CharacteristicValue {
    const s = this.status();
    return s?.heater_state === 1
      ? this.C.TargetHeatingCoolingState.HEAT
      : this.C.TargetHeatingCoolingState.OFF;
  }

  private async setHeatingState(value: CharacteristicValue): Promise<void> {
    const on = value === this.C.TargetHeatingCoolingState.HEAT ? 1 : 0;
    await this.platform.sendCommandAndPoll({ heater_state: on as 0 | 1 });
  }

  private updateFromStatus(s: MspaDeviceStatus): void {
    this.service.updateCharacteristic(this.C.CurrentTemperature, s.water_temperature / 2);
    this.service.updateCharacteristic(this.C.TargetTemperature, s.temperature_setting / 2);
    const heatState = s.heater_state === 1
      ? this.C.CurrentHeatingCoolingState.HEAT
      : this.C.CurrentHeatingCoolingState.OFF;
    this.service.updateCharacteristic(this.C.CurrentHeatingCoolingState, heatState);
    this.service.updateCharacteristic(this.C.TargetHeatingCoolingState, heatState);
  }
}
