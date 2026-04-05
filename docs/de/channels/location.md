---
read_when:
    - Beim Hinzufügen oder Ändern des Parsens von Kanalstandorten
    - Bei der Verwendung von Standort-Kontextfeldern in Agent-Prompts oder Tools
summary: Parsen eingehender Kanalstandorte (Telegram/WhatsApp/Matrix) und Kontextfelder
title: Parsen von Kanalstandorten
x-i18n:
    generated_at: "2026-04-05T12:35:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 10061f0c109240a9e0bcab649b17f03b674e8bdf410debf3669b7b6da8189d96
    source_path: channels/location.md
    workflow: 15
---

# Parsen von Kanalstandorten

OpenClaw normalisiert geteilte Standorte aus Chat-Kanälen zu:

- menschenlesbarem Text, der an den eingehenden Body angehängt wird, und
- strukturierten Feldern in der Auto-Reply-Kontext-Payload.

Derzeit unterstützt:

- **Telegram** (Standort-Pins + Orte + Live-Standorte)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` mit `geo_uri`)

## Textformatierung

Standorte werden als benutzerfreundliche Zeilen ohne Klammern dargestellt:

- Pin:
  - `📍 48.858844, 2.294351 ±12m`
- Benannter Ort:
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- Live-Freigabe:
  - `🛰 Live-Standort: 48.858844, 2.294351 ±12m`

Wenn der Kanal eine Beschriftung/einen Kommentar enthält, wird diese bzw. dieser in der nächsten Zeile angehängt:

```
📍 48.858844, 2.294351 ±12m
Hier treffen
```

## Kontextfelder

Wenn ein Standort vorhanden ist, werden diese Felder zu `ctx` hinzugefügt:

- `LocationLat` (Zahl)
- `LocationLon` (Zahl)
- `LocationAccuracy` (Zahl, Meter; optional)
- `LocationName` (String; optional)
- `LocationAddress` (String; optional)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (Boolesch)

## Kanalhinweise

- **Telegram**: Orte werden `LocationName/LocationAddress` zugeordnet; Live-Standorte verwenden `live_period`.
- **WhatsApp**: `locationMessage.comment` und `liveLocationMessage.caption` werden als Beschriftungszeile angehängt.
- **Matrix**: `geo_uri` wird als Pin-Standort geparst; die Höhe wird ignoriert und `LocationIsLive` ist immer false.
