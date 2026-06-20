# homebridge-mspa

Homebridge plugin for controlling **MSpa hot tubs** via Apple HomeKit.

> **Recommendation:** Create a dedicated MSpa Link account just for Homebridge and share access to your hot tub with it. If you use your main account, the MSpa Link app on your phone will get signed out every time Homebridge polls the API.

Connects to the MSpa Cloud API (the same one used by the MSpa Link app) and exposes your hot tub as HomeKit accessories.

---

## Features

| Accessory | HomeKit Type | Function |
|---|---|---|
| **Hot Tub Temperature** | Thermostat | View current water temp, set target temp, toggle heating |
| **Hot Tub Filter** | Switch | Turn filter pump on/off (auto-disables heater if needed) |
| **Hot Tub Bubbles** | Switch | Turn massage bubbles on/off |

---

## Requirements

- [Homebridge](https://homebridge.io/) v1.6 or later
- MSpa hot tub with Wi-Fi support
- MSpa Link app account (email + password)

---

## Installation

### Option A — Homebridge UI (recommended)

1. Open Homebridge UI → **Plugins**
2. Search for `homebridge-mspa`
3. Click **Install**

### Option B — Terminal

```bash
npm install -g homebridge-mspa
```

---

## Configuration

In the Homebridge UI go to **Plugins → homebridge-mspa → Settings**:

| Field | Description |
|---|---|
| **Name** | Name shown in HomeKit (e.g. `Hot Tub`) |
| **Email** | Your MSpa Link app login email |
| **Password** | Your MSpa Link app password |
| **Region** | `ROW` for Europe/Rest of World, `US` for USA, `CN` for China |

Or add it manually to `config.json`:

```json
{
  "platforms": [
    {
      "platform": "MSpaSpa",
      "name": "Hot Tub",
      "email": "your@email.com",
      "password": "yourPassword",
      "region": "ROW"
    }
  ]
}
```

---

## Usage

After restarting Homebridge the accessories will appear automatically in the **Home app**.

### Setting the temperature

Tap the **Hot Tub Temperature** tile → use the slider to set your target temperature (20–42°C). The large number shows the current water temperature.

### Turning heating on/off

Tap the thermostat accessory and toggle between **Heat** and **Off**.

### Filter & Bubbles

Just tap the switches.

> **Note:** The filter cannot be turned off while the heater is running. The plugin will automatically turn the heater off first before stopping the filter.

---

## How it works

The plugin connects to the MSpa Cloud API on startup and polls the device status every **30 seconds**. Commands (e.g. turning heating on) are sent immediately and the HomeKit UI updates optimistically — the real device state is confirmed on the next poll.

---

## Supported Models

Tested with:
- MSpa Frame Series (F_DU062WE / FRAMEEUVC)

Should work with any MSpa model that supports the MSpa Link app.

---

## Development

```bash
git clone https://github.com/haywiredev/homebridge-mspa
cd homebridge-mspa
npm install
npm run build
npm test
```

---

## License

Apache 2.0 — API documentation sourced from [DTekNO/mspa-homeassistant](https://github.com/DTekNO/mspa-homeassistant).
