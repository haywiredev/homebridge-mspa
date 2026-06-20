import { MspaStatusCache } from '../src/platform';
import { MspaDeviceStatus } from '../src/settings';

const fakeStatus: MspaDeviceStatus = {
  water_temperature: 76,
  temperature_setting: 80,
  heater_state: 1,
  filter_state: 0,
  bubble_state: 0,
  bubble_level: 1,
  jet_state: 0,
  is_online: true,
};

describe('MspaStatusCache', () => {
  it('returns null before first update', () => {
    const cache = new MspaStatusCache();
    expect(cache.get()).toBeNull();
  });

  it('returns status after update', () => {
    const cache = new MspaStatusCache();
    cache.set(fakeStatus);
    expect(cache.get()?.water_temperature).toBe(76);
  });

  it('subscribers are called on update', () => {
    const cache = new MspaStatusCache();
    const fn = jest.fn();
    cache.subscribe(fn);
    cache.set(fakeStatus);
    expect(fn).toHaveBeenCalledWith(fakeStatus);
  });
});
