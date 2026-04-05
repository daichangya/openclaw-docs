---
read_when:
    - Ändern des Verhaltens des Menüleistensymbols
summary: Status und Animationen des Menüleistensymbols für OpenClaw auf macOS
title: Menüleistensymbol
x-i18n:
    generated_at: "2026-04-05T12:49:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: a67a6e6bbdc2b611ba365d3be3dd83f9e24025d02366bc35ffcce9f0b121872b
    source_path: platforms/mac/icon.md
    workflow: 15
---

# Zustände des Menüleistensymbols

Autor: steipete · Aktualisiert: 2025-12-06 · Geltungsbereich: macOS-App (`apps/macos`)

- **Leerlauf:** Normale Symbolanimation (Blinzeln, gelegentliches Wackeln).
- **Pausiert:** Das Status-Element verwendet `appearsDisabled`; keine Bewegung.
- **Voice trigger (große Ohren):** Der Voice-Wake-Detektor ruft `AppState.triggerVoiceEars(ttl: nil)` auf, wenn das Wake-Word gehört wird, und hält `earBoostActive=true`, während die Äußerung erfasst wird. Die Ohren skalieren hoch (1,9x), erhalten zur besseren Lesbarkeit kreisförmige Ohrlöcher und werden dann über `stopVoiceEars()` nach 1 Sekunde Stille zurückgesetzt. Wird nur von der In-App-Voice-Pipeline ausgelöst.
- **Aktiv (Agent läuft):** `AppState.isWorking=true` steuert eine Mikrobewegung vom Typ „Schwanz-/Bein-Geschäftigkeit“: schnellere Beinbewegungen und eine leichte Verschiebung, während Arbeit in Bearbeitung ist. Derzeit wird dies bei Agent-Läufen in WebChat umgeschaltet; fügen Sie dieselbe Umschaltung auch um andere lange Aufgaben herum hinzu, wenn Sie diese verdrahten.

Verdrahtungspunkte

- Voice Wake: Runtime/Tester rufen `AppState.triggerVoiceEars(ttl: nil)` beim Trigger und `stopVoiceEars()` nach 1 Sekunde Stille auf, um dem Erfassungsfenster zu entsprechen.
- Agent-Aktivität: Setzen Sie `AppStateStore.shared.setWorking(true/false)` um Arbeitsphasen herum (bereits beim WebChat-Agent-Aufruf umgesetzt). Halten Sie die Phasen kurz und setzen Sie sie in `defer`-Blöcken zurück, um hängen bleibende Animationen zu vermeiden.

Formen und Größen

- Das Basissymbol wird in `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)` gezeichnet.
- Die Ohr-Skalierung ist standardmäßig `1.0`; der Voice-Boost setzt `earScale=1.9` und schaltet `earHoles=true`, ohne den Gesamtrahmen zu ändern (18×18-pt-Template-Bild, gerendert in einen 36×36-px-Retina-Backing-Store).
- Die Geschäftigkeit verwendet Beinbewegungen bis etwa ~1.0 mit einem kleinen horizontalen Zucken; sie kommt zu bestehendem Wackeln im Leerlauf additiv hinzu.

Verhaltenshinweise

- Kein externer CLI-/Broker-Schalter für Ohren/Aktivität; belassen Sie dies intern bei den eigenen Signalen der App, um unbeabsichtigtes Hin- und Herflattern zu vermeiden.
- Halten Sie TTLs kurz (&lt;10s), damit das Symbol schnell zum Grundzustand zurückkehrt, falls ein Job hängt.
