# homebridge-mspa

Homebridge Plugin zur Steuerung von **MSpa Whirlpools** über Apple HomeKit.

Verbindet sich mit der MSpa Cloud-API (dieselbe wie die MSpa Link App) und stellt den Pool als HomeKit-Accessories bereit.

---

## Features

| Accessory | HomeKit | Funktion |
|---|---|---|
| **Whirlpool Temperatur** | Thermostat | Wassertemperatur anzeigen, Zieltemperatur setzen, Heizung an/aus |
| **Whirlpool Filter** | Schalter | Filterpumpe an/aus (schaltet Heizung automatisch aus falls nötig) |
| **Whirlpool Blasen** | Schalter | Massage-Blasen an/aus |

---

## Voraussetzungen

- [Homebridge](https://homebridge.io/) v1.6 oder neuer
- MSpa Whirlpool mit WLAN-Anbindung
- MSpa Link App Account (E-Mail + Passwort)

---

## Installation

### Option A — Homebridge UI (empfohlen)

1. Homebridge UI öffnen → **Plugins**
2. Nach `homebridge-mspa` suchen
3. **Install** klicken

### Option B — Terminal

```bash
npm install -g homebridge-mspa
```

---

## Konfiguration

In der Homebridge UI unter **Plugins → homebridge-mspa → Einstellungen**:

| Feld | Beschreibung |
|---|---|
| **Name** | Name des Accessories in HomeKit (z.B. `Whirlpool`) |
| **E-Mail** | Login-E-Mail der MSpa Link App |
| **Passwort** | Passwort der MSpa Link App |
| **Region** | `ROW` für Europa, `US` für USA, `CN` für China |

Oder manuell in der `config.json`:

```json
{
  "platforms": [
    {
      "platform": "MSpaSpa",
      "name": "Whirlpool",
      "email": "deine@email.de",
      "password": "deinPasswort",
      "region": "ROW"
    }
  ]
}
```

---

## Verwendung

Nach dem Neustart von Homebridge erscheinen die Accessories automatisch in der **Home-App**.

### Temperatur einstellen

Tippe auf **Whirlpool Temperatur** → Zieltemperatur mit dem Schieberegler einstellen (20–42°C). Der obere Wert zeigt die aktuelle Wassertemperatur.

### Heizung an/aus

Im Thermostat-Accessory oben rechts auf **Heizen** oder **Aus** tippen.

### Filter & Blasen

Einfach die Schalter antippen.

> **Hinweis:** Der Filter kann nicht ausgeschaltet werden solange die Heizung läuft. Das Plugin schaltet die Heizung in diesem Fall automatisch zuerst aus.

---

## Wie es funktioniert

Das Plugin verbindet sich beim Start mit der MSpa Cloud-API und fragt den Status alle **30 Sekunden** ab. Befehle (z.B. Heizung an) werden sofort an die API gesendet und optimistisch in HomeKit angezeigt — nach dem nächsten Poll wird der echte Status vom Pool übernommen.

---

## Unterstützte Modelle

Getestet mit:
- MSpa Frame Series (F_DU062WE / FRAMEEUVC)

Sollte mit allen MSpa Modellen funktionieren, die die MSpa Link App unterstützen.

---

## Entwicklung

```bash
git clone https://github.com/haywiredev/homebridge-mspa
cd homebridge-mspa
npm install
npm run build
npm test
```

---

## Lizenz

Apache 2.0 — basiert auf der API-Dokumentation von [DTekNO/mspa-homeassistant](https://github.com/DTekNO/mspa-homeassistant).
