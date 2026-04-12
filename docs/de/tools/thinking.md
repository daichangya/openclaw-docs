---
read_when:
    - Parsing oder Standardwerte für Direktiven zu Thinking, Fast-Mode oder Verbose anpassen
summary: Direktivsyntax für `/think`, `/fast`, `/verbose`, `/trace` und die Sichtbarkeit von Reasoning
title: Thinking-Stufen
x-i18n:
    generated_at: "2026-04-12T23:34:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3b1341281f07ba4e9061e3355845dca234be04cc0d358594312beeb7676e68
    source_path: tools/thinking.md
    workflow: 15
---

# Thinking-Stufen (`/think`-Direktiven)

## Funktion

- Inline-Direktive in jedem eingehenden Nachrichtentext: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliasse): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → „think“
  - low → „think hard“
  - medium → „think harder“
  - high → „ultrathink“ (maximales Budget)
  - xhigh → „ultrathink+“ (nur GPT-5.2- und Codex-Modelle)
  - adaptive → providerverwaltetes adaptives Reasoning-Budget (unterstützt für die Modellfamilie Anthropic Claude 4.6)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden auf `xhigh` abgebildet.
  - `highest`, `max` werden auf `high` abgebildet.
- Hinweise zu Providern:
  - Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Thinking-Stufe festgelegt ist.
  - MiniMax (`minimax/*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Thinking nicht explizit in den Modellparametern oder Anfrageparametern festlegen. Dadurch werden geleakte Deltas von `reasoning_content` aus dem nicht nativen Anthropic-Stream-Format von MiniMax vermieden.
  - Z.AI (`zai/*`) unterstützt nur binäres Thinking (`on`/`off`). Jede Stufe ungleich `off` wird als `on` behandelt (auf `low` abgebildet).
  - Moonshot (`moonshot/*`) bildet `/think off` auf `thinking: { type: "disabled" }` und jede Stufe ungleich `off` auf `thinking: { type: "enabled" }` ab. Wenn Thinking aktiviert ist, akzeptiert Moonshot nur `tool_choice` `auto|none`; OpenClaw normalisiert inkompatible Werte auf `auto`.

## Reihenfolge der Auflösung

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungsüberschreibung (gesetzt durch das Senden einer Nachricht, die nur aus einer Direktive besteht).
3. Standardwert pro Agent (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standardwert (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: `adaptive` für Anthropic-Claude-4.6-Modelle, `low` für andere reasoning-fähige Modelle, sonst `off`.

## Einen Sitzungsstandard festlegen

- Senden Sie eine Nachricht, die **nur** aus der Direktive besteht (Leerraum erlaubt), z. B. `/think:medium` oder `/t high`.
- Das bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Sender); zurückgesetzt durch `/think:off` oder einen Leerlauf-Reset der Sitzung.
- Eine Bestätigungsantwort wird gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn die Stufe ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungsstatus bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Thinking-Stufe anzuzeigen.

## Anwendung nach Agent

- **Embedded Pi**: Die aufgelöste Stufe wird an die prozessinterne Pi-Agent-Runtime übergeben.

## Fast-Mode (`/fast`)

- Stufen: `on|off`.
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet eine Sitzungsüberschreibung für den Fast-Mode um und antwortet mit `Fast mode enabled.` / `Fast mode disabled.`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuellen effektiven Status des Fast-Mode anzuzeigen.
- OpenClaw löst den Fast-Mode in dieser Reihenfolge auf:
  1. Inline-/nur-Direktive `/fast on|off`
  2. Sitzungsüberschreibung
  3. Standardwert pro Agent (`agents.list[].fastModeDefault`)
  4. Konfiguration pro Modell: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Für `openai/*` wird der Fast-Mode auf priorisierte OpenAI-Verarbeitung abgebildet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Für `openai-codex/*` sendet der Fast-Mode dasselbe Flag `service_tier=priority` bei Codex-Responses. OpenClaw verwendet einen gemeinsamen Schalter `/fast` für beide Auth-Pfade.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich OAuth-authentifiziertem Datenverkehr an `api.anthropic.com`, wird der Fast-Mode auf Anthropic-Service-Tiers abgebildet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` zu `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-Modellparameter `serviceTier` / `service_tier` überschreiben den Standardwert des Fast-Mode, wenn beides gesetzt ist. OpenClaw überspringt weiterhin das Einfügen von Anthropic-Service-Tiers bei nicht-Anthropic-Proxy-`baseUrl`.

## Verbose-Direktiven (`/verbose` oder `/v`)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet Verbose für die Sitzung um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Status zu ändern.
- `/verbose off` speichert eine explizite Sitzungsüberschreibung; löschen Sie sie in der Sessions-UI, indem Sie `inherit` auswählen.
- Eine Inline-Direktive gilt nur für diese Nachricht; ansonsten gelten Sitzungs-/globale Standardwerte.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Verbose-Stufe anzuzeigen.
- Wenn Verbose aktiviert ist, senden Agenten, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agenten), jeden Tool-Aufruf als eigene Nachricht nur mit Metadaten zurück, sofern verfügbar mit dem Präfix `<emoji> <tool-name>: <arg>` (Pfad/Befehl). Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Blasen), nicht als Streaming-Deltas.
- Zusammenfassungen von Tool-Fehlern bleiben im normalen Modus sichtbar, aber rohe Fehlerdetail-Suffixe werden ausgeblendet, sofern Verbose nicht `on` oder `full` ist.
- Wenn Verbose `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Blase, auf eine sichere Länge gekürzt). Wenn Sie `/verbose on|full|off` ändern, während eine Ausführung noch läuft, berücksichtigen nachfolgende Tool-Blasen die neue Einstellung.

## Plugin-Trace-Direktiven (`/trace`)

- Stufen: `on` | `off` (Standard).
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet die Ausgabe von Plugin-Trace für die Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive gilt nur für diese Nachricht; ansonsten gelten Sitzungs-/globale Standardwerte.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es legt nur plugin-eigene Trace-/Debug-Zeilen offen, z. B. Debug-Zusammenfassungen von Active Memory.
- Trace-Zeilen können in `/status` und als diagnostische Folgenachricht nach der normalen Assistentenantwort erscheinen.

## Sichtbarkeit von Reasoning (`/reasoning`)

- Stufen: `on|off|stream`.
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet um, ob Thinking-Blöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** mit dem Präfix `Reasoning:` gesendet.
- `stream` (nur Telegram): streamt Reasoning in die Telegram-Entwurfsblase, während die Antwort erzeugt wird, und sendet dann die endgültige Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Reasoning-Stufe anzuzeigen.
- Reihenfolge der Auflösung: Inline-Direktive, dann Sitzungsüberschreibung, dann Standardwert pro Agent (`agents.list[].reasoningDefault`), dann Fallback (`off`).

## Verwandt

- Die Dokumentation zum Elevated Mode finden Sie unter [Elevated mode](/de/tools/elevated).

## Heartbeats

- Der Text der Heartbeat-Prüfung ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie üblich (vermeiden Sie jedoch, Sitzungsstandardwerte durch Heartbeats zu ändern).
- Die Heartbeat-Zustellung beschränkt sich standardmäßig auf die endgültige Payload. Um zusätzlich die separate Nachricht `Reasoning:` zu senden (wenn verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Web-Chat-UI

- Der Thinking-Selektor im Web-Chat spiegelt beim Laden der Seite die gespeicherte Stufe der Sitzung aus dem eingehenden Sitzungsspeicher bzw. der Konfiguration wider.
- Wenn eine andere Stufe ausgewählt wird, wird die Sitzungsüberschreibung sofort über `sessions.patch` geschrieben; es wird nicht auf das nächste Senden gewartet, und es ist keine einmalige Überschreibung `thinkingOnce`.
- Die erste Option ist immer `Default (<resolved level>)`, wobei der aufgelöste Standardwert aus dem aktiven Sitzungsmodell stammt: `adaptive` für Claude 4.6 auf Anthropic/Bedrock, `low` für andere reasoning-fähige Modelle, sonst `off`.
- Der Picker bleibt providerbewusst:
  - die meisten Provider zeigen `off | minimal | low | medium | high | adaptive`
  - Z.AI zeigt binär `off | on`
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Direktiven und der Picker synchron bleiben.
