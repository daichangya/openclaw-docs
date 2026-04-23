---
read_when:
    - Sie möchten eine schnelle Diagnose des Kanalzustands und der letzten Sitzungsempfänger
    - Sie möchten einen einfügbaren „all“-Status zum Debuggen
summary: CLI-Referenz für `openclaw status` (Diagnose, Probes, Nutzungs-Snapshots)
title: status
x-i18n:
    generated_at: "2026-04-23T14:01:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 015614e329ec172a62c625581897fa64589f12dfe28edefe8a2764b5b5367b2a
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnose für Kanäle und Sitzungen.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Hinweise:

- `--deep` führt Live-Probes aus (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` gibt normalisierte Provider-Nutzungsfenster als `X% left` aus.
- Die Ausgabe des Sitzungsstatus trennt jetzt `Runtime:` von `Runner:`. `Runtime` ist der Ausführungspfad und der Sandbox-Status (`direct`, `docker/*`), während `Runner` angibt, ob die Sitzung eingebettetes Pi, einen CLI-basierten Provider oder ein ACP-Harness-Backend wie `codex (acp/acpx)` verwendet.
- Die rohen Felder `usage_percent` / `usagePercent` von MiniMax geben das verbleibende Kontingent an, daher invertiert OpenClaw sie vor der Anzeige; zählungsbasierte Felder haben Vorrang, wenn vorhanden. Antworten von `model_remains` bevorzugen den Chat-Modell-Eintrag, leiten das Fensterlabel bei Bedarf aus Zeitstempeln ab und schließen den Modellnamen in das Plan-Label ein.
- Wenn der aktuelle Sitzungssnapshot spärlich ist, kann `/status` Token- und Cache-Zähler aus dem neuesten Nutzungslog des Transkripts nachtragen. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang vor dem Transkript-Fallback.
- Der Transkript-Fallback kann auch das aktive Runtime-Modell-Label wiederherstellen, wenn es im Live-Sitzungseintrag fehlt. Wenn dieses Transkript-Modell vom ausgewählten Modell abweicht, löst Status das Kontextfenster anhand des wiederhergestellten Runtime-Modells statt des ausgewählten Modells auf.
- Für die Erfassung der Prompt-Größe bevorzugt der Transkript-Fallback die größere promptorientierte Gesamtsumme, wenn Sitzungsmetadaten fehlen oder kleiner sind, damit Sitzungen mit benutzerdefinierten Providern nicht zu einer Anzeige von `0` Tokens zusammenfallen.
- Die Ausgabe enthält Sitzungs-Stores pro Agent, wenn mehrere Agenten konfiguriert sind.
- Die Übersicht enthält Gateway- sowie Installations-/Runtime-Status des Node-Host-Dienstes, wenn verfügbar.
- Die Übersicht enthält Update-Kanal und Git-SHA (für Source-Checkouts).
- Update-Informationen werden in der Übersicht angezeigt; wenn ein Update verfügbar ist, gibt Status einen Hinweis aus, `openclaw update` auszuführen (siehe [Updating](/de/install/updating)).
- Schreibgeschützte Statusoberflächen (`status`, `status --json`, `status --all`) lösen unterstützte SecretRefs für ihre Ziel-Konfigurationspfade nach Möglichkeit auf.
- Wenn ein unterstützter Channel-SecretRef konfiguriert, im aktuellen Befehlspfad aber nicht verfügbar ist, bleibt Status schreibgeschützt und meldet eine degradierte Ausgabe, statt abzustürzen. Die menschenlesbare Ausgabe zeigt Warnungen wie „configured token unavailable in this command path“, und die JSON-Ausgabe enthält `secretDiagnostics`.
- Wenn die auf befehlslokaler Ebene erfolgende SecretRef-Auflösung erfolgreich ist, bevorzugt Status den aufgelösten Snapshot und entfernt temporäre Kanalmarkierungen wie „secret unavailable“ aus der endgültigen Ausgabe.
- `status --all` enthält eine Übersichtszeile zu Secrets und einen Diagnoseabschnitt, der Secret-Diagnosen (zur besseren Lesbarkeit gekürzt) zusammenfasst, ohne die Berichtserzeugung zu stoppen.
