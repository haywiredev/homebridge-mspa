import { MspaApi } from '../src/mspaApi';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const fakeConfig = {
  name: 'Test',
  email: 'test@example.com',
  password: 'secret',
  region: 'ROW' as const,
};

describe('MspaApi', () => {
  let api: MspaApi;
  const mockLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    // make axios.create() return the same mocked instance so this.http uses it
    (mockedAxios.create as jest.Mock) = jest.fn().mockReturnValue(mockedAxios);
    api = new MspaApi(fakeConfig, mockLog as any);
  });

  it('buildSignature returns uppercase MD5 string', () => {
    const sig = (api as any).buildSignature('abc123', '1234567890');
    expect(typeof sig).toBe('string');
    expect(sig).toBe(sig.toUpperCase());
    expect(sig).toHaveLength(32);
  });

  it('login stores token on success', async () => {
    mockedAxios.post = jest.fn().mockResolvedValue({
      data: { data: { token: 'tok123' } },
      status: 200,
    });
    await (api as any).login();
    expect((api as any).token).toBe('tok123');
  });

  it('getDevices returns device list', async () => {
    (api as any).token = 'tok123';
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: { data: [{ device_id: 'd1', product_id: 'p1', name: 'Spa' }] },
      status: 200,
    });
    const devices = await api.getDevices();
    expect(devices).toHaveLength(1);
    expect(devices[0].device_id).toBe('d1');
  });

  it('getStatus returns parsed device status', async () => {
    (api as any).token = 'tok123';
    mockedAxios.post = jest.fn().mockResolvedValue({
      data: {
        data: {
          state: {
            reported: {
              water_temperature: 76,
              temperature_setting: 80,
              heater_state: 1,
              filter_state: 0,
              bubble_state: 0,
              bubble_level: 1,
              jet_state: 0,
              is_online: true,
            },
          },
        },
      },
      status: 200,
    });
    const status = await api.getStatus('d1', 'p1');
    expect(status.water_temperature).toBe(76);
    expect(status.heater_state).toBe(1);
  });

  it('sendCommand posts correct payload', async () => {
    (api as any).token = 'tok123';
    mockedAxios.post = jest.fn().mockResolvedValue({ data: { code: 0 }, status: 200 });
    await api.sendCommand('d1', 'p1', { heater_state: 1 });
    const call = (mockedAxios.post as jest.Mock).mock.calls[0];
    const body = call[1];
    const desired = JSON.parse(body.desired);
    expect(desired.state.desired.heater_state).toBe(1);
  });
});
