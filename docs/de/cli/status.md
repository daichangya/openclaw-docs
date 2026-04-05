---
read_when:
    - Sie möchten eine schnelle Diagnose der Kanalintegrität + der letzten Sitzungsempfänger
    - Sie möchten einen einfügbaren „all“-Status zum Debuggen
summary: CLI-Referenz für `openclaw status` (Diagnose, Probes, Nutzungs-Snapshots)
title: status
x-i18n:
    generated_at: "2026-04-05T12:39:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbe9d94fbe9938cd946ee6f293b5bd3b464b75e1ade2eacdd851788c3bffe94e
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnose für Kanäle + Sitzungen.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Hinweise:

- `--deep` führt Live-Probes aus (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` gibt normalisierte Provider-Nutzungsfenster als `X% left` aus.
- Die rohen Felder `usage_percent` / `usagePercent` von MiniMax stehen für das verbleibende Kontingent, daher invertiert OpenClaw sie vor der Anzeige; anzahlbasierte Felder haben Vorrang, wenn sie vorhanden sind. Antworten von `model_remains` bevorzugen den Chat-Modell-Eintrag, leiten die Fensterbezeichnung bei Bedarf aus Zeitstempeln ab und enthalten den Modellnamen in der Plan-Bezeichnung.
- Wenn der aktuelle Sitzungs-Snapshot spärlich ist, kann `/status` Token- und Cache-Zähler aus dem neuesten Nutzungsprotokoll des Transkripts ergänzen. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang vor Fallback-Werten aus dem Transkript.
- Der Transkript-Fallback kann auch das aktive Laufzeit-Modell-Label wiederherstellen, wenn es im Live-Sitzungseintrag fehlt. Wenn sich dieses Transkript-Modell vom ausgewählten Modell unterscheidet, löst status das Kontextfenster gegen das wiederhergestellte Laufzeit-Modell statt gegen das ausgewählte auf.
- Für die Abrechnung der Prompt-Größe bevorzugt der Transkript-Fallback die größere promptorientierte Gesamtsumme, wenn Sitzungsmetadaten fehlen oder kleiner sind, damit Sitzungen mit benutzerdefiniertem Provider nicht auf eine Anzeige von `0` Tokens zusammenfallen.
- Die Ausgabe enthält Sitzungsspeicher pro Agent, wenn mehrere Agenten konfiguriert sind.
- Die Übersicht enthält Gateway + Installations-/Laufzeitstatus des Knoten-Host-Dienstes, wenn verfügbar.
- Die Übersicht enthält Update-Kanal + Git-SHA (für Source-Checkouts).
- Update-Informationen erscheinen in der Übersicht; wenn ein Update verfügbar ist, gibt status einen Hinweis aus, `openclaw update` auszuführen (siehe [Updating](/install/updating)).
- Schreibgeschützte Status-Oberflächen (`status`, `status --json`, `status --all`) lösen unterstützte SecretRefs für ihre Ziel-Konfigurationspfade nach Möglichkeit auf.
- Wenn ein unterstützter Kanal-SecretRef konfiguriert, im aktuellen Befehlsausführungspfad aber nicht verfügbar ist, bleibt status schreibgeschützt und meldet degradierte Ausgabe, statt abzustürzen. Die menschenlesbare Ausgabe zeigt Warnungen wie „configured token unavailable in this command path“, und die JSON-Ausgabe enthält `secretDiagnostics`.
- Wenn die auflösung von SecretRefs im lokalen Befehlskontext erfolgreich ist, bevorzugt status den aufgelösten Snapshot und entfernt vorübergehende Kanalmarkierungen „secret unavailable“ aus der endgültigen Ausgabe.
- `status --all` enthält eine Übersichtszeile für Secrets und einen Diagnoseabschnitt, der Secret-Diagnosen (zur besseren Lesbarkeit gekürzt) zusammenfasst, ohne die Berichtserstellung zu stoppen.
