---
read_when:
    - Sie möchten das Kontextwachstum durch Tool-Ausgaben reduzieren
    - Sie möchten die Optimierung des Anthropic-Prompt-Caches verstehen
summary: Alte Tool-Ergebnisse kürzen, um den Kontext schlank zu halten und Caching effizienter zu machen
title: Sitzungs-Pruning
x-i18n:
    generated_at: "2026-04-05T12:40:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1569a50e0018cca3e3ceefbdddaf093843df50cdf2f7bf62fe925299875cb487
    source_path: concepts/session-pruning.md
    workflow: 15
---

# Sitzungs-Pruning

Sitzungs-Pruning kürzt vor jedem LLM-Aufruf **alte Tool-Ergebnisse** aus dem Kontext.
Es reduziert die Aufblähung des Kontexts durch angesammelte Tool-Ausgaben (Exec-Ergebnisse, Datei-
Lesevorgänge, Suchergebnisse), ohne normalen Konversationstext umzuschreiben.

<Info>
Pruning erfolgt nur im Speicher -- es verändert nicht das Sitzungsprotokoll auf dem Datenträger.
Ihr vollständiger Verlauf bleibt immer erhalten.
</Info>

## Warum das wichtig ist

Lange Sitzungen sammeln Tool-Ausgaben an, die das Kontextfenster aufblähen. Das
erhöht die Kosten und kann [Kompaktierung](/concepts/compaction) früher als
nötig erzwingen.

Pruning ist besonders wertvoll für **Anthropic-Prompt-Caching**. Nachdem die Cache-
TTL abgelaufen ist, cached die nächste Anfrage den vollständigen Prompt erneut. Pruning reduziert die
Größe des Cache-Schreibvorgangs und senkt dadurch direkt die Kosten.

## So funktioniert es

1. Warten, bis die Cache-TTL abläuft (Standard 5 Minuten).
2. Alte Tool-Ergebnisse für normales Pruning finden (Konversationstext bleibt unberührt).
3. **Soft-Trim** für übergroße Ergebnisse -- Anfang und Ende behalten, `...` einfügen.
4. **Hard-Clear** für den Rest -- durch einen Platzhalter ersetzen.
5. TTL zurücksetzen, damit Folgeanfragen den frischen Cache wiederverwenden.

## Legacy-Bildbereinigung

OpenClaw führt außerdem eine separate idempotente Bereinigung für ältere Legacy-Sitzungen aus, die
rohe Bildblöcke im Verlauf gespeichert haben.

- Dabei bleiben die **3 zuletzt abgeschlossenen Turns** Byte für Byte erhalten, damit Prompt-
  Cache-Präfixe für aktuelle Folgeanfragen stabil bleiben.
- Ältere bereits verarbeitete Bildblöcke im Verlauf von `user` oder `toolResult` können durch
  `[image data removed - already processed by model]` ersetzt werden.
- Dies ist getrennt vom normalen Cache-TTL-Pruning. Es dient dazu, zu verhindern, dass wiederholte
  Bildnutzlasten bei späteren Turns Prompt-Caches ungültig machen.

## Intelligente Standardwerte

OpenClaw aktiviert Pruning automatisch für Anthropic-Profile:

| Profiltyp                                              | Pruning aktiviert | Heartbeat |
| ------------------------------------------------------ | ----------------- | --------- |
| Anthropic OAuth-/Token-Authentifizierung (einschließlich Wiederverwendung der Claude CLI) | Ja | 1 Stunde |
| API-Key                                                | Ja                | 30 Min    |

Wenn Sie explizite Werte setzen, überschreibt OpenClaw diese nicht.

## Aktivieren oder deaktivieren

Für Nicht-Anthropic-Provider ist Pruning standardmäßig deaktiviert. Zum Aktivieren:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Zum Deaktivieren: `mode: "off"` setzen.

## Pruning vs. Kompaktierung

|            | Pruning             | Kompaktierung            |
| ---------- | ------------------- | ------------------------ |
| **Was**    | Kürzt Tool-Ergebnisse | Fasst Unterhaltung zusammen |
| **Gespeichert?** | Nein (pro Anfrage) | Ja (im Protokoll)     |
| **Umfang** | Nur Tool-Ergebnisse | Gesamte Unterhaltung     |

Sie ergänzen sich gegenseitig -- Pruning hält Tool-Ausgaben zwischen
Kompaktierungszyklen schlank.

## Weiterführende Informationen

- [Kompaktierung](/concepts/compaction) -- kontextreduzierung durch Zusammenfassung
- [Gateway-Konfiguration](/gateway/configuration) -- alle Pruning-Konfigurationsoptionen
  (`contextPruning.*`)
