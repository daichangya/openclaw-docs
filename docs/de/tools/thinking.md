---
read_when:
    - Anpassen der Direktivenverarbeitung oder Standardeinstellungen für Denkstufen, Fast-Mode oder Verbose
summary: Direktiven-Syntax für `/think`, `/fast`, `/verbose`, `/trace` und Sichtbarkeit der Begründung
title: Denkstufen
x-i18n:
    generated_at: "2026-04-17T06:22:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1cb44a7bf75546e5a8c3204e12f3297221449b881161d173dea4983da3921649
    source_path: tools/thinking.md
    workflow: 15
---

# Denkstufen (`/think`-Direktiven)

## Was sie bewirken

- Inline-Direktive in jedem eingehenden Nachrichtentext: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliasse): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → „denken“
  - low → „gründlich nachdenken“
  - medium → „noch gründlicher nachdenken“
  - high → „ultrathink“ (maximales Budget)
  - xhigh → „ultrathink+“ (GPT-5.2- und Codex-Modelle sowie Anthropic Claude Opus 4.7 effort)
  - adaptive → anbieterverwaltetes adaptives Denken (unterstützt für Anthropic Claude 4.6 und Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden auf `xhigh` abgebildet.
  - `highest`, `max` werden auf `high` abgebildet.
- Hinweise zu Anbietern:
  - Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Denkstufe festgelegt ist.
  - Anthropic Claude Opus 4.7 verwendet nicht standardmäßig adaptives Denken. Der Standardwert für API-effort bleibt anbieterabhängig, sofern Sie nicht ausdrücklich eine Denkstufe festlegen.
  - Anthropic Claude Opus 4.7 bildet `/think xhigh` auf adaptives Denken plus `output_config.effort: "xhigh"` ab, da `/think` eine Denk-Direktive ist und `xhigh` die Opus-4.7-effort-Einstellung ist.
  - MiniMax (`minimax/*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Denken nicht ausdrücklich in Modellparametern oder Anfrageparametern festlegen. Dadurch werden geleakte `reasoning_content`-Deltas aus dem nicht nativen Anthropic-Stream-Format von MiniMax vermieden.
  - Z.AI (`zai/*`) unterstützt nur binäres Denken (`on`/`off`). Jede Stufe außer `off` wird als `on` behandelt (auf `low` abgebildet).
  - Moonshot (`moonshot/*`) bildet `/think off` auf `thinking: { type: "disabled" }` und jede andere Stufe auf `thinking: { type: "enabled" }` ab. Wenn Denken aktiviert ist, akzeptiert Moonshot für `tool_choice` nur `auto|none`; OpenClaw normalisiert inkompatible Werte zu `auto`.

## Reihenfolge der Auflösung

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungsüberschreibung (gesetzt durch Senden einer Nachricht, die nur aus einer Direktive besteht).
3. Standard pro Agent (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standard (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: `adaptive` für Anthropic-Claude-4.6-Modelle, `off` für Anthropic Claude Opus 4.7, sofern nicht ausdrücklich konfiguriert, `low` für andere reasoning-fähige Modelle, sonst `off`.

## Einen Sitzungsstandard festlegen

- Senden Sie eine Nachricht, die **nur** aus der Direktive besteht (Leerraum ist erlaubt), z. B. `/think:medium` oder `/t high`.
- Dies bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender); zurückgesetzt durch `/think:off` oder Zurücksetzung bei Sitzungsinaktivität.
- Es wird eine Bestätigungsantwort gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn die Stufe ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungszustand bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Denkstufe anzuzeigen.

## Anwendung pro Agent

- **Embedded Pi**: Die aufgelöste Stufe wird an die prozessinterne Pi-Agent-Laufzeit übergeben.

## Fast-Mode (`/fast`)

- Stufen: `on|off`.
- Eine Nachricht, die nur aus der Direktive besteht, schaltet eine Sitzungsüberschreibung für den Fast-Mode um und antwortet mit `Fast mode enabled.` / `Fast mode disabled.`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuell wirksamen Fast-Mode-Status anzuzeigen.
- OpenClaw löst den Fast-Mode in dieser Reihenfolge auf:
  1. Inline-/Direktive-only `/fast on|off`
  2. Sitzungsüberschreibung
  3. Standard pro Agent (`agents.list[].fastModeDefault`)
  4. Konfiguration pro Modell: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Für `openai/*` wird der Fast-Mode auf OpenAI-Prioritätsverarbeitung abgebildet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Für `openai-codex/*` sendet der Fast-Mode dasselbe Flag `service_tier=priority` bei Codex-Responses. OpenClaw verwendet einen gemeinsamen `/fast`-Schalter über beide Auth-Pfade hinweg.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich OAuth-authentifiziertem Datenverkehr an `api.anthropic.com`, wird der Fast-Mode auf Anthropic-Service-Tiers abgebildet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` zu `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-Modellparameter `serviceTier` / `service_tier` überschreiben den Fast-Mode-Standard, wenn beide gesetzt sind. OpenClaw überspringt weiterhin die Anthropic-Service-Tier-Injektion für Nicht-Anthropic-Proxy-Basis-URLs.

## Verbose-Direktiven (`/verbose` oder `/v`)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine Nachricht, die nur aus der Direktive besteht, schaltet Verbose auf Sitzungsebene um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Zustand zu ändern.
- `/verbose off` speichert eine explizite Sitzungsüberschreibung; löschen Sie sie in der Sitzungs-UI, indem Sie `inherit` auswählen.
- Eine Inline-Direktive gilt nur für diese Nachricht; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Verbose-Stufe anzuzeigen.
- Wenn Verbose aktiviert ist, senden Agenten, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agenten), jeden Tool-Aufruf als eigene Nachricht nur mit Metadaten zurück, mit dem Präfix `<emoji> <tool-name>: <arg>`, wenn verfügbar (Pfad/Befehl). Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Blasen), nicht als Streaming-Deltas.
- Zusammenfassungen von Tool-Fehlern bleiben im normalen Modus sichtbar, aber rohe Fehlerdetailsuffixe werden ausgeblendet, außer wenn Verbose auf `on` oder `full` steht.
- Wenn Verbose auf `full` steht, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Blase, auf eine sichere Länge gekürzt). Wenn Sie `/verbose on|full|off` ändern, während ein Lauf noch läuft, beachten nachfolgende Tool-Blasen die neue Einstellung.

## Plugin-Trace-Direktiven (`/trace`)

- Stufen: `on` | `off` (Standard).
- Eine Nachricht, die nur aus der Direktive besteht, schaltet die Plugin-Trace-Ausgabe der Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive gilt nur für diese Nachricht; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es zeigt nur Plugin-eigene Trace-/Debug-Zeilen an, etwa Active-Memory-Debug-Zusammenfassungen.
- Trace-Zeilen können in `/status` und als nachfolgende Diagnose-Nachricht nach der normalen Assistentenantwort erscheinen.

## Sichtbarkeit der Begründung (`/reasoning`)

- Stufen: `on|off|stream`.
- Eine Nachricht, die nur aus der Direktive besteht, schaltet um, ob Denkblöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird die Begründung als **separate Nachricht** mit dem Präfix `Reasoning:` gesendet.
- `stream` (nur Telegram): streamt die Begründung in die Telegram-Entwurfsblase, während die Antwort erzeugt wird, und sendet dann die endgültige Antwort ohne Begründung.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Begründungsstufe anzuzeigen.
- Reihenfolge der Auflösung: Inline-Direktive, dann Sitzungsüberschreibung, dann Standard pro Agent (`agents.list[].reasoningDefault`), dann Fallback (`off`).

## Verwandt

- Die Dokumentation zum Elevated-Mode finden Sie unter [Elevated mode](/de/tools/elevated).

## Heartbeats

- Der Heartbeat-Prüftext ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht werden wie üblich angewendet (vermeiden Sie jedoch, Sitzungsstandards durch Heartbeats zu ändern).
- Die Heartbeat-Zustellung verwendet standardmäßig nur die endgültige Nutzlast. Um zusätzlich die separate `Reasoning:`-Nachricht zu senden (falls verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Web-Chat-UI

- Der Thinking-Selektor der Web-Chat-UI spiegelt beim Laden der Seite die gespeicherte Stufe der Sitzung aus dem eingehenden Sitzungsspeicher bzw. der Konfiguration wider.
- Wenn eine andere Stufe ausgewählt wird, wird die Sitzungsüberschreibung sofort über `sessions.patch` geschrieben; es wird nicht auf das nächste Senden gewartet, und es handelt sich nicht um eine einmalige `thinkingOnce`-Überschreibung.
- Die erste Option ist immer `Default (<resolved level>)`, wobei der aufgelöste Standard vom aktiven Sitzungsmodell stammt: `adaptive` für Claude 4.6 auf Anthropic, `off` für Anthropic Claude Opus 4.7, sofern nicht konfiguriert, `low` für andere reasoning-fähige Modelle, sonst `off`.
- Die Auswahl bleibt anbieterbewusst:
  - die meisten Anbieter zeigen `off | minimal | low | medium | high | adaptive`
  - Anthropic Claude Opus 4.7 zeigt `off | minimal | low | medium | high | xhigh | adaptive`
  - Z.AI zeigt binär `off | on`
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Direktiven und der Selektor synchron bleiben.
