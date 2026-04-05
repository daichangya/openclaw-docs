---
read_when:
    - Parsing oder Standardwerte für Thinking, Fast-Mode oder Verbose-Direktiven anpassen
summary: Direktivsyntax für /think, /fast, /verbose und die Sichtbarkeit von Reasoning
title: Thinking Levels
x-i18n:
    generated_at: "2026-04-05T12:58:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: f60aeb6ab4c7ce858f725f589f54184b29d8c91994d18c8deafa75179b9a62cb
    source_path: tools/thinking.md
    workflow: 15
---

# Thinking Levels (/think-Direktiven)

## Was das bewirkt

- Inline-Direktive in jedem eingehenden Nachrichtentext: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Levels (Aliasse): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → „think“
  - low → „think hard“
  - medium → „think harder“
  - high → „ultrathink“ (maximales Budget)
  - xhigh → „ultrathink+“ (nur GPT-5.2- und Codex-Modelle)
  - adaptive → vom Provider verwaltetes adaptives Reasoning-Budget (unterstützt für die Modellfamilie Anthropic Claude 4.6)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden auf `xhigh` abgebildet.
  - `highest`, `max` werden auf `high` abgebildet.
- Hinweise zu Providern:
  - Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn kein explizites Thinking Level gesetzt ist.
  - MiniMax (`minimax/*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Thinking nicht explizit in Modellparametern oder Request-Parametern setzen. Dadurch werden durchgesickerte Deltas von `reasoning_content` aus dem nicht nativen Anthropic-Stream-Format von MiniMax vermieden.
  - Z.AI (`zai/*`) unterstützt nur binäres Thinking (`on`/`off`). Jedes Level außer `off` wird als `on` behandelt (auf `low` abgebildet).
  - Moonshot (`moonshot/*`) bildet `/think off` auf `thinking: { type: "disabled" }` und jedes Level außer `off` auf `thinking: { type: "enabled" }` ab. Wenn Thinking aktiviert ist, akzeptiert Moonshot für `tool_choice` nur `auto|none`; OpenClaw normalisiert inkompatible Werte auf `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungsüberschreibung (gesetzt durch das Senden einer Nachricht, die nur aus einer Direktive besteht).
3. Standardwert pro Agent (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standardwert (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: `adaptive` für Anthropic-Claude-4.6-Modelle, `low` für andere reasoning-fähige Modelle, sonst `off`.

## Einen Sitzungsstandard festlegen

- Senden Sie eine Nachricht, die **nur** aus der Direktive besteht (Whitespace ist erlaubt), zum Beispiel `/think:medium` oder `/t high`.
- Das gilt dann für die aktuelle Sitzung (standardmäßig pro Absender); zurückgesetzt durch `/think:off` oder durch den Leerlauf-Reset der Sitzung.
- Es wird eine Bestätigungsantwort gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn das Level ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungsstatus bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um das aktuelle Thinking Level anzuzeigen.

## Anwendung pro Agent

- **Embedded Pi**: Das aufgelöste Level wird an die In-Process-Runtime des Pi-Agenten übergeben.

## Fast mode (/fast)

- Levels: `on|off`.
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet eine Sitzungsüberschreibung für den Fast-Mode um und antwortet mit `Fast mode enabled.` / `Fast mode disabled.`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuellen effektiven Status des Fast-Mode anzuzeigen.
- OpenClaw löst den Fast-Mode in dieser Reihenfolge auf:
  1. Inline-/direktivenbasiertes `/fast on|off`
  2. Sitzungsüberschreibung
  3. Standardwert pro Agent (`agents.list[].fastModeDefault`)
  4. Konfiguration pro Modell: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Für `openai/*` wird der Fast-Mode auf OpenAI-Prioritätsverarbeitung abgebildet, indem bei unterstützten Responses-Requests `service_tier=priority` gesendet wird.
- Für `openai-codex/*` sendet der Fast-Mode dasselbe Flag `service_tier=priority` bei Codex-Responses. OpenClaw behält einen gemeinsamen Schalter `/fast` über beide Auth-Pfade hinweg bei.
- Für direkte öffentliche `anthropic/*`-Requests, einschließlich per OAuth authentifiziertem Traffic an `api.anthropic.com`, wird der Fast-Mode auf Anthropic-Service-Tiers abgebildet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-Modellparameter `serviceTier` / `service_tier` überschreiben den Standardwert des Fast-Mode, wenn beides gesetzt ist. OpenClaw überspringt weiterhin das Einfügen von Anthropic-Service-Tiers für nicht-Anthropic-Proxy-Base-URLs.

## Verbose-Direktiven (/verbose oder /v)

- Levels: `on` (minimal) | `full` | `off` (Standard).
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet Verbose auf Sitzungsebene um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Levels geben einen Hinweis zurück, ohne den Status zu ändern.
- `/verbose off` speichert eine explizite Sitzungsüberschreibung; löschen Sie sie in der Sessions-UI, indem Sie `inherit` wählen.
- Eine Inline-Direktive wirkt sich nur auf diese Nachricht aus; ansonsten gelten Sitzungs-/globale Standardwerte.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um das aktuelle Verbose-Level anzuzeigen.
- Wenn Verbose aktiviert ist, senden Agents, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agents), jeden Tool-Aufruf als eigene Nachricht nur mit Metadaten zurück, sofern verfügbar mit dem Präfix `<emoji> <tool-name>: <arg>` (Pfad/Befehl). Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Bubbles), nicht als Streaming-Deltas.
- Zusammenfassungen von Tool-Fehlern bleiben im normalen Modus sichtbar, aber rohe Fehlerdetails am Ende werden ausgeblendet, sofern Verbose nicht `on` oder `full` ist.
- Wenn Verbose `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Bubble, auf eine sichere Länge gekürzt). Wenn Sie `/verbose on|full|off` ändern, während eine Ausführung noch läuft, berücksichtigen nachfolgende Tool-Bubbles die neue Einstellung.

## Sichtbarkeit von Reasoning (/reasoning)

- Levels: `on|off|stream`.
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet um, ob Thinking-Blöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** mit dem Präfix `Reasoning:` gesendet.
- `stream` (nur Telegram): streamt Reasoning in die Telegram-Entwurfs-Bubble, während die Antwort generiert wird, und sendet dann die endgültige Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um das aktuelle Reasoning-Level anzuzeigen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungsüberschreibung, dann Standardwert pro Agent (`agents.list[].reasoningDefault`), dann Fallback (`off`).

## Verwandt

- Docs zum Elevated mode finden Sie unter [Elevated mode](/tools/elevated).

## Heartbeats

- Der Nachrichtentext des Heartbeat-Probes ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie üblich (ändern Sie jedoch möglichst keine Sitzungsstandardwerte durch Heartbeats).
- Die Zustellung von Heartbeats verwendet standardmäßig nur das endgültige Payload. Um auch die separate Nachricht `Reasoning:` zu senden (wenn verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Web-Chat-UI

- Der Thinking-Selektor im Web-Chat spiegelt beim Laden der Seite das gespeicherte Level der Sitzung aus dem eingehenden Sitzungs-Store/der Konfiguration wider.
- Wenn ein anderes Level ausgewählt wird, schreibt dies die Sitzungsüberschreibung sofort über `sessions.patch`; es wartet nicht auf das nächste Senden und ist keine einmalige Überschreibung `thinkingOnce`.
- Die erste Option ist immer `Default (<resolved level>)`, wobei der aufgelöste Standardwert vom aktiven Sitzungsmodell kommt: `adaptive` für Claude 4.6 auf Anthropic/Bedrock, `low` für andere reasoning-fähige Modelle, sonst `off`.
- Der Auswahlbereich bleibt providerbewusst:
  - die meisten Provider zeigen `off | minimal | low | medium | high | adaptive`
  - Z.AI zeigt binär `off | on`
- `/think:<level>` funktioniert weiterhin und aktualisiert dasselbe gespeicherte Sitzungslevel, sodass Chat-Direktiven und Auswahlfeld synchron bleiben.
