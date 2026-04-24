---
read_when:
    - Sie möchten das Kontextwachstum durch Tool-Ausgaben reduzieren.
    - Sie möchten die Optimierung des Anthropic-Prompt-Caches verstehen.
summary: Alte Tool-Ergebnisse kürzen, um den Kontext schlank und das Caching effizient zu halten
title: Session-Bereinigung
x-i18n:
    generated_at: "2026-04-24T06:35:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: af47997b83cd478dac0e2ebb6d277a948713f28651751bec6cff4ef4b70a16c6
    source_path: concepts/session-pruning.md
    workflow: 15
---

Die Session-Bereinigung kürzt **alte Tool-Ergebnisse** aus dem Kontext vor jedem LLM-
Aufruf. Sie reduziert das Aufblähen des Kontexts durch angesammelte Tool-Ausgaben (Exec-Ergebnisse, Datei-
Lesevorgänge, Suchergebnisse), ohne normalen Konversationstext umzuschreiben.

<Info>
Die Bereinigung erfolgt nur im Speicher -- sie verändert das Sitzungs-Transkript auf der Festplatte nicht.
Ihr vollständiger Verlauf bleibt immer erhalten.
</Info>

## Warum das wichtig ist

Lange Sitzungen sammeln Tool-Ausgaben an, die das Kontextfenster vergrößern. Das
erhöht die Kosten und kann [Compaction](/de/concepts/compaction) früher als
nötig erzwingen.

Die Bereinigung ist besonders wertvoll für **Anthropic-Prompt-Caching**. Nachdem die Cache-
TTL abläuft, cached die nächste Anfrage den vollständigen Prompt erneut. Die Bereinigung reduziert die
Größe des Cache-Schreibvorgangs und senkt damit direkt die Kosten.

## So funktioniert es

1. Warten, bis die Cache-TTL abgelaufen ist (Standard 5 Minuten).
2. Alte Tool-Ergebnisse für die normale Bereinigung finden (Konversationstext bleibt unberührt).
3. **Soft-Trim** für übergroße Ergebnisse -- Anfang und Ende behalten, `...` einfügen.
4. **Hard-Clear** für den Rest -- durch einen Platzhalter ersetzen.
5. Die TTL zurücksetzen, damit Folgeanfragen den frischen Cache wiederverwenden.

## Legacy-Bildbereinigung

OpenClaw führt außerdem eine separate idempotente Bereinigung für ältere Legacy-Sitzungen aus, die
rohe Bildblöcke im Verlauf persistiert haben.

- Die **3 neuesten abgeschlossenen Turns** werden Byte für Byte beibehalten, damit Prompt-
  Cache-Präfixe für aktuelle Folgeanfragen stabil bleiben.
- Ältere, bereits verarbeitete Bildblöcke im Verlauf von `user` oder `toolResult` können
  durch `[image data removed - already processed by model]` ersetzt werden.
- Dies ist getrennt von der normalen Cache-TTL-Bereinigung. Es dient dazu, wiederholte
  Bild-Payloads daran zu hindern, Prompt-Caches bei späteren Turns zu zerstören.

## Intelligente Standardwerte

OpenClaw aktiviert die Bereinigung automatisch für Anthropic-Profile:

| Profiltyp                                               | Bereinigung aktiviert | Heartbeat |
| ------------------------------------------------------- | --------------------- | --------- |
| Anthropic OAuth/Token-Authentifizierung (einschließlich Wiederverwendung von Claude CLI) | Ja | 1 Stunde |
| API key                                                 | Ja                    | 30 Min    |

Wenn Sie explizite Werte setzen, überschreibt OpenClaw diese nicht.

## Aktivieren oder deaktivieren

Für Nicht-Anthropic-Provider ist die Bereinigung standardmäßig deaktiviert. Zum Aktivieren:

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

## Bereinigung vs. Compaction

|            | Bereinigung         | Compaction              |
| ---------- | ------------------- | ----------------------- |
| **Was**    | Kürzt Tool-Ergebnisse | Fasst die Konversation zusammen |
| **Gespeichert?** | Nein (pro Anfrage) | Ja (im Transkript)     |
| **Umfang** | Nur Tool-Ergebnisse | Ganze Konversation      |

Sie ergänzen sich gegenseitig -- die Bereinigung hält Tool-Ausgaben schlank zwischen
Compaction-Zyklen.

## Weiterführende Informationen

- [Compaction](/de/concepts/compaction) -- kontextreduzierende Zusammenfassung
- [Gateway Configuration](/de/gateway/configuration) -- alle Konfigurationsoptionen zur Bereinigung
  (`contextPruning.*`)

## Verwandt

- [Session management](/de/concepts/session)
- [Session tools](/de/concepts/session-tool)
- [Context engine](/de/concepts/context-engine)
