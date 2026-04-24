---
read_when:
    - Verhalten des Menüleisten-Symbols ändern.
summary: Status und Animationen des Menüleisten-Symbols für OpenClaw auf macOS
title: Menüleisten-Symbol
x-i18n:
    generated_at: "2026-04-24T06:47:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6900d702358afcf0481f713ea334236e1abf973d0eeff60eaf0afcf88f9327b2
    source_path: platforms/mac/icon.md
    workflow: 15
---

# Zustände des Menüleisten-Symbols

Autor: steipete · Aktualisiert: 2025-12-06 · Geltungsbereich: macOS-App (`apps/macos`)

- **Idle:** Normale Symbolanimation (Blinzeln, gelegentliches Wackeln).
- **Paused:** Das Status-Element verwendet `appearsDisabled`; keine Bewegung.
- **Sprachtrigger (große Ohren):** Der Voice-Wake-Detektor ruft `AppState.triggerVoiceEars(ttl: nil)` auf, wenn das Wake-Word erkannt wird, und hält `earBoostActive=true`, während die Äußerung erfasst wird. Die Ohren werden größer skaliert (1,9x), erhalten zur besseren Lesbarkeit kreisförmige Ohrlöcher und fallen dann über `stopVoiceEars()` nach 1 Sekunde Stille wieder zurück. Wird nur aus der In-App-Voice-Pipeline ausgelöst.
- **Working (Agent läuft):** `AppState.isWorking=true` steuert eine Mikrobewegung „Schwanz-/Bein-Gerenne“: schnelleres Beinwackeln und leichte Verschiebung, solange Arbeit läuft. Derzeit wird dies um WebChat-Agent-Läufe herum umgeschaltet; fügen Sie dasselbe Umschalten um andere lange Aufgaben hinzu, wenn Sie diese verdrahten.

Verdrahtungspunkte

- Voice Wake: Runtime/Tester rufen bei Auslösung `AppState.triggerVoiceEars(ttl: nil)` auf und `stopVoiceEars()` nach 1 Sekunde Stille, um dem Erfassungsfenster zu entsprechen.
- Agent-Aktivität: Setzen Sie `AppStateStore.shared.setWorking(true/false)` um Arbeitsabschnitte herum (bereits im WebChat-Agent-Aufruf umgesetzt). Halten Sie Abschnitte kurz und setzen Sie in `defer`-Blöcken zurück, um festhängende Animationen zu vermeiden.

Formen & Größen

- Das Basissymbol wird in `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)` gezeichnet.
- Die Ohrskalierung ist standardmäßig `1.0`; Voice-Boost setzt `earScale=1.9` und schaltet `earHoles=true`, ohne den Gesamtrahmen zu verändern (18×18-pt-Template-Image, gerendert in einen 36×36-px-Retina-Backing-Store).
- Das Gerenne verwendet Beinwackeln bis etwa `1.0` mit einem kleinen horizontalen Zittern; es addiert sich zu vorhandenem Idle-Wackeln.

Hinweise zum Verhalten

- Kein externer CLI-/Broker-Schalter für Ohren/Working; halten Sie dies intern an die eigenen Signale der App gebunden, um versehentliches Flattern zu vermeiden.
- Halten Sie TTLs kurz (&lt;10s), damit das Symbol schnell zum Ausgangszustand zurückkehrt, wenn ein Job hängt.

## Verwandt

- [Menu bar](/de/platforms/mac/menu-bar)
- [macOS app](/de/platforms/macos)
