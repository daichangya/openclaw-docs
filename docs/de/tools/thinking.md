---
read_when:
    - Anpassen von Thinking, Schnellmodus oder der Verarbeitung bzw. Standardwerte von Direktiven für ausführliche Ausgabe
summary: Syntax für Direktiven für /think, /fast, /verbose, /trace und die Sichtbarkeit von Reasoning
title: Thinking-Stufen
x-i18n:
    generated_at: "2026-04-21T06:31:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: edee9420e1cc3eccfa18d87061c4a4d6873e70cb51fff85305fafbcd6a5d6a7d
    source_path: tools/thinking.md
    workflow: 15
---

# Thinking-Stufen (`/think`-Direktiven)

## Was es bewirkt

- Inline-Direktive in jedem eingehenden Text: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliasse): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „think“
  - low → „think hard“
  - medium → „think harder“
  - high → „ultrathink“ (maximales Budget)
  - xhigh → „ultrathink+“ (GPT-5.2 + Codex-Modelle und Anthropic Claude Opus 4.7 effort)
  - adaptive → vom Provider verwaltetes adaptives Thinking (unterstützt für Claude 4.6 auf Anthropic/Bedrock und Anthropic Claude Opus 4.7)
  - max → maximales Reasoning des Providers (derzeit Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden auf `xhigh` abgebildet.
  - `highest` wird auf `high` abgebildet.
- Hinweise zu Providern:
  - `adaptive` wird in nativen Befehlsmenüs und Auswahllisten nur für Provider/Modelle angezeigt, die Unterstützung für adaptives Thinking deklarieren. Es bleibt als getippte Direktive zur Kompatibilität mit vorhandenen Konfigurationen und Aliasen weiterhin akzeptiert.
  - `max` wird in nativen Befehlsmenüs und Auswahllisten nur für Provider/Modelle angezeigt, die Unterstützung für maximales Thinking deklarieren. Vorhandene gespeicherte Einstellungen `max` werden auf die größte unterstützte Stufe für das ausgewählte Modell umgebildet, wenn das Modell `max` nicht unterstützt.
  - Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Thinking-Stufe gesetzt ist.
  - Anthropic Claude Opus 4.7 verwendet standardmäßig kein adaptives Thinking. Der Standard für API-effort bleibt Eigentum des Providers, sofern Sie nicht explizit eine Thinking-Stufe setzen.
  - Anthropic Claude Opus 4.7 bildet `/think xhigh` auf adaptives Thinking plus `output_config.effort: "xhigh"` ab, weil `/think` eine Thinking-Direktive ist und `xhigh` die Opus-4.7-Einstellung für effort ist.
  - Anthropic Claude Opus 4.7 bietet auch `/think max`; es wird auf denselben vom Provider verwalteten Pfad für maximalen effort abgebildet.
  - OpenAI-GPT-Modelle bilden `/think` über die modellabhängige Unterstützung der Responses API für effort ab. `/think off` sendet `reasoning.effort: "none"` nur dann, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die Payload für deaktiviertes Reasoning weg, statt einen nicht unterstützten Wert zu senden.
  - MiniMax (`minimax/*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Thinking nicht explizit in Modellparametern oder Anfrageparametern setzen. Dies vermeidet durchgesickerte Deltas von `reasoning_content` aus dem nicht nativen Anthropic-Stream-Format von MiniMax.
  - Z.AI (`zai/*`) unterstützt nur binäres Thinking (`on`/`off`). Jede Stufe außer `off` wird als `on` behandelt (auf `low` abgebildet).
  - Moonshot (`moonshot/*`) bildet `/think off` auf `thinking: { type: "disabled" }` und jede Stufe außer `off` auf `thinking: { type: "enabled" }` ab. Wenn Thinking aktiviert ist, akzeptiert Moonshot für `tool_choice` nur `auto|none`; OpenClaw normalisiert inkompatible Werte auf `auto`.

## Reihenfolge der Auflösung

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungsüberschreibung (gesetzt durch das Senden einer Nachricht, die nur aus einer Direktive besteht).
3. Standard pro Agent (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standard (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: `adaptive` für Anthropic-Claude-4.6-Modelle, `off` für Anthropic Claude Opus 4.7, sofern nicht explizit konfiguriert, `low` für andere Reasoning-fähige Modelle, sonst `off`.

## Einen Sitzungsstandard setzen

- Senden Sie eine Nachricht, die **nur** aus der Direktive besteht (Leerraum ist erlaubt), z. B. `/think:medium` oder `/t high`.
- Das bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender); wird durch `/think:off` oder einen Leerlauf-Reset der Sitzung gelöscht.
- Es wird eine Bestätigungsantwort gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn die Stufe ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt, und der Sitzungsstatus bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Thinking-Stufe zu sehen.

## Anwendung nach Agent

- **Embedded Pi**: Die aufgelöste Stufe wird an die Laufzeit des In-Process-Pi-Agenten übergeben.

## Schnellmodus (`/fast`)

- Stufen: `on|off`.
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet eine Sitzungsüberschreibung für den Schnellmodus um und antwortet mit `Fast mode enabled.` / `Fast mode disabled.`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuellen effektiven Status des Schnellmodus zu sehen.
- OpenClaw löst den Schnellmodus in dieser Reihenfolge auf:
  1. Inline-/nur-Direktive `/fast on|off`
  2. Sitzungsüberschreibung
  3. Standard pro Agent (`agents.list[].fastModeDefault`)
  4. Konfiguration pro Modell: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Für `openai/*` wird der Schnellmodus auf die Prioritätsverarbeitung von OpenAI abgebildet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Für `openai-codex/*` sendet der Schnellmodus dasselbe Flag `service_tier=priority` bei Codex Responses. OpenClaw behält einen gemeinsamen Umschalter `/fast` für beide Authentifizierungspfade bei.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich per OAuth authentifiziertem Datenverkehr an `api.anthropic.com`, wird der Schnellmodus auf die Service-Tiers von Anthropic abgebildet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-Modellparameter `serviceTier` / `service_tier` überschreiben den Standard des Schnellmodus, wenn beide gesetzt sind. OpenClaw überspringt weiterhin das Einfügen des Anthropic-Service-Tiers für Base-URLs von Nicht-Anthropic-Proxys.

## Direktiven für ausführliche Ausgabe (`/verbose` oder `/v`)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet die ausführliche Ausgabe für die Sitzung um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen liefern einen Hinweis, ohne den Status zu ändern.
- `/verbose off` speichert eine explizite Sitzungsüberschreibung; löschen Sie sie über die Sitzungs-UI, indem Sie `inherit` wählen.
- Eine Inline-Direktive wirkt sich nur auf diese Nachricht aus; ansonsten gelten Standardwerte für Sitzung/global.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Stufe für ausführliche Ausgabe zu sehen.
- Wenn die ausführliche Ausgabe aktiviert ist, senden Agenten, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agenten), jeden Tool-Aufruf als eigene Nachricht nur mit Metadaten zurück, mit dem Präfix `<emoji> <tool-name>: <arg>`, sofern verfügbar (Pfad/Befehl). Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Blasen), nicht als Streaming-Deltas.
- Zusammenfassungen von Tool-Fehlern bleiben im normalen Modus sichtbar, aber rohe Fehlersuffixe werden verborgen, sofern `verbose` nicht `on` oder `full` ist.
- Wenn `verbose` `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Blase, auf eine sichere Länge gekürzt). Wenn Sie während eines laufenden Vorgangs `/verbose on|full|off` umschalten, berücksichtigen nachfolgende Tool-Blasen die neue Einstellung.

## Plugin-Trace-Direktiven (`/trace`)

- Stufen: `on` | `off` (Standard).
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet die Plugin-Trace-Ausgabe für die Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive wirkt sich nur auf diese Nachricht aus; ansonsten gelten Standardwerte für Sitzung/global.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe zu sehen.
- `/trace` ist enger gefasst als `/verbose`: Es zeigt nur Plugin-eigene Trace-/Debug-Zeilen wie Active-Memory-Debug-Zusammenfassungen an.
- Trace-Zeilen können in `/status` und als nachfolgende Diagnosenachricht nach der normalen Assistentenantwort erscheinen.

## Sichtbarkeit von Reasoning (`/reasoning`)

- Stufen: `on|off|stream`.
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet um, ob Thinking-Blöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** gesendet, mit dem Präfix `Reasoning:`.
- `stream` (nur Telegram): streamt Reasoning in die Telegram-Entwurfsblase, während die Antwort erzeugt wird, und sendet dann die endgültige Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Reasoning-Stufe zu sehen.
- Reihenfolge der Auflösung: Inline-Direktive, dann Sitzungsüberschreibung, dann Standard pro Agent (`agents.list[].reasoningDefault`), dann Fallback (`off`).

## Verwandt

- Dokumentation zum Elevated-Modus finden Sie unter [Elevated mode](/de/tools/elevated).

## Heartbeats

- Der Body des Heartbeat-Probes ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie üblich (vermeiden Sie jedoch, Sitzungsstandards über Heartbeats zu ändern).
- Die Zustellung von Heartbeat verwendet standardmäßig nur die endgültige Payload. Um auch die separate Nachricht `Reasoning:` zu senden (falls verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Webchat-UI

- Der Thinking-Selektor im Webchat spiegelt beim Laden der Seite die gespeicherte Stufe der Sitzung aus dem eingehenden Sitzungsspeicher bzw. der Konfiguration wider.
- Die Auswahl einer anderen Stufe schreibt die Sitzungsüberschreibung sofort über `sessions.patch`; sie wartet nicht auf das nächste Senden und ist keine einmalige Überschreibung `thinkingOnce`.
- Die erste Option ist immer `Default (<resolved level>)`, wobei der aufgelöste Standard vom aktiven Sitzungsmodell kommt: `adaptive` für Claude 4.6 auf Anthropic, `off` für Anthropic Claude Opus 4.7, sofern nicht konfiguriert, `low` für andere Reasoning-fähige Modelle, sonst `off`.
- Der Picker bleibt Provider-sensitiv:
  - die meisten Provider zeigen `off | minimal | low | medium | high`
  - Anthropic/Bedrock Claude 4.6 zeigt `off | minimal | low | medium | high | adaptive`
  - Anthropic Claude Opus 4.7 zeigt `off | minimal | low | medium | high | xhigh | adaptive | max`
  - Z.AI zeigt binär `off | on`
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Direktiven und der Picker synchron bleiben.
