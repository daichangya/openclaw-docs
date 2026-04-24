---
read_when:
    - Sie möchten eine schnelle Diagnose der Channel-Integrität und der letzten Sitzungsempfänger
    - Sie möchten einen einfügbaren „all“-Status für das Debugging
summary: CLI-Referenz für `openclaw status` (Diagnose, Prüfungen, Nutzungssnapshots)
title: Status
x-i18n:
    generated_at: "2026-04-24T06:32:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 369de48e283766ec23ef87f79df39893957101954c4a351e46ef24104d78ec1d
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnose für Channel + Sitzungen.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Hinweise:

- `--deep` führt Live-Prüfungen aus (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` gibt normalisierte Nutzungsfenster als `X% left` aus.
- Die Statusausgabe für Sitzungen trennt jetzt `Runtime:` von `Runner:`. `Runtime` ist der Ausführungspfad und der Sandbox-Zustand (`direct`, `docker/*`), während `Runner` angibt, ob die Sitzung eingebettetes Pi, einen CLI-gestützten Anbieter oder ein ACP-Harness-Backend wie `codex (acp/acpx)` verwendet.
- Die Rohfelder `usage_percent` / `usagePercent` von MiniMax sind verbleibende Quote, daher invertiert OpenClaw sie vor der Anzeige; zählungsbasierte Felder haben Vorrang, wenn sie vorhanden sind. `model_remains`-Antworten bevorzugen den Eintrag des Chat-Modells, leiten bei Bedarf die Fensterbezeichnung aus Zeitstempeln ab und enthalten den Modellnamen in der Tarifbezeichnung.
- Wenn der aktuelle Sitzungssnapshot spärlich ist, kann `/status` Token- und Cache-Zähler aus dem aktuellsten Transcript-Nutzungslog ergänzen. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang vor Fallback-Werten aus dem Transcript.
- Das Transcript-Fallback kann auch die aktive Runtime-Modellbezeichnung wiederherstellen, wenn sie im Live-Sitzungseintrag fehlt. Wenn dieses Transcript-Modell vom ausgewählten Modell abweicht, löst status das Kontextfenster anhand des wiederhergestellten Runtime-Modells statt des ausgewählten auf.
- Für die Prompt-Größenberechnung bevorzugt das Transcript-Fallback die größere promptorientierte Gesamtsumme, wenn Sitzungsmetadaten fehlen oder kleiner sind, damit Sitzungen mit benutzerdefinierten Anbietern nicht auf Token-Anzeigen von `0` zusammenfallen.
- Die Ausgabe enthält Session Stores pro Agent, wenn mehrere Agenten konfiguriert sind.
- Der Überblick enthält Installations-/Laufzeitstatus des Gateway- + Node-Host-Service, wenn verfügbar.
- Der Überblick enthält Update-Kanal + Git-SHA (für Source-Checkouts).
- Update-Informationen erscheinen im Überblick; wenn ein Update verfügbar ist, gibt status einen Hinweis aus, `openclaw update` auszuführen (siehe [Aktualisieren](/de/install/updating)).
- Schreibgeschützte Statusoberflächen (`status`, `status --json`, `status --all`) lösen unterstützte SecretRefs für ihre Zielkonfigurationspfade nach Möglichkeit auf.
- Wenn ein unterstützter Channel-SecretRef konfiguriert, aber in diesem Befehlsablauf nicht verfügbar ist, bleibt status schreibgeschützt und meldet eine degradierte Ausgabe, statt abzustürzen. Die menschenlesbare Ausgabe zeigt Warnungen wie „configured token unavailable in this command path“, und die JSON-Ausgabe enthält `secretDiagnostics`.
- Wenn die befehlslokale SecretRef-Auflösung erfolgreich ist, bevorzugt status den aufgelösten Snapshot und entfernt vorübergehende Channel-Markierungen wie „secret unavailable“ aus der endgültigen Ausgabe.
- `status --all` enthält eine Übersichtszeile für Secrets und einen Diagnoseabschnitt, der Secret-Diagnosen (zur besseren Lesbarkeit gekürzt) zusammenfasst, ohne die Berichtserstellung zu stoppen.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Doctor](/de/gateway/doctor)
