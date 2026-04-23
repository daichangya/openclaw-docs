---
read_when:
    - Parsing oder Standardwerte für Direktiven zu Thinking, Schnellmodus oder Verbose anpassen.
summary: Direktiv-Syntax für /think, /fast, /verbose, /trace und Sichtbarkeit von Reasoning
title: Thinking-Level
x-i18n:
    generated_at: "2026-04-23T14:08:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4efe899f7b47244745a105583b3239effa7975fadd06bd7bcad6327afcc91207
    source_path: tools/thinking.md
    workflow: 15
---

# Thinking-Level (/think-Direktiven)

## Was es tut

- Inline-Direktive in jedem eingehenden Nachrichtentext: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Level (Aliasse): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „think“
  - low → „think hard“
  - medium → „think harder“
  - high → „ultrathink“ (maximales Budget)
  - xhigh → „ultrathink+“ (GPT-5.2- und Codex-Modelle sowie Anthropic Claude Opus 4.7 effort)
  - adaptive → vom Provider verwaltetes adaptives Thinking (unterstützt für Claude 4.6 auf Anthropic/Bedrock und Anthropic Claude Opus 4.7)
  - max → maximales Reasoning des Providers (derzeit Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden auf `xhigh` abgebildet.
  - `highest` wird auf `high` abgebildet.
- Hinweise zu Providern:
  - Menüs und Auswahllisten für Thinking sind providerprofilgesteuert. Provider-Plugin deklarieren die exakte Level-Menge für das ausgewählte Modell, einschließlich Beschriftungen wie dem binären `on`.
  - `adaptive`, `xhigh` und `max` werden nur für Provider-/Modellprofile beworben, die sie unterstützen. Eingegebene Direktiven für nicht unterstützte Level werden mit den gültigen Optionen dieses Modells abgelehnt.
  - Bereits gespeicherte nicht unterstützte Level werden nach dem Rang des Provider-Profils neu abgebildet. `adaptive` fällt bei nicht adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf das größte unterstützte Nicht-`off`-Level des ausgewählten Modells zurückfallen.
  - Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn kein explizites Thinking-Level gesetzt ist.
  - Anthropic Claude Opus 4.7 verwendet standardmäßig kein adaptives Thinking. Sein Standardwert für API-effort bleibt im Besitz des Providers, sofern Sie nicht explizit ein Thinking-Level setzen.
  - Anthropic Claude Opus 4.7 bildet `/think xhigh` auf adaptives Thinking plus `output_config.effort: "xhigh"` ab, weil `/think` eine Thinking-Direktive ist und `xhigh` die Opus-4.7-Einstellung für effort ist.
  - Anthropic Claude Opus 4.7 stellt auch `/think max` bereit; dies wird auf denselben providerverwalteten Max-effort-Pfad abgebildet.
  - OpenAI-GPT-Modelle bilden `/think` über die modellspezifische Unterstützung für effort in der Responses API ab. `/think off` sendet `reasoning.effort: "none"` nur dann, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Reasoning-Payload weg, statt einen nicht unterstützten Wert zu senden.
  - MiniMax (`minimax/*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Thinking nicht explizit in Modellparametern oder Anfrageparametern setzen. Dadurch werden geleakte Deltas von `reasoning_content` aus dem nicht nativen Anthropic-Stream-Format von MiniMax vermieden.
  - Z.AI (`zai/*`) unterstützt nur binäres Thinking (`on`/`off`). Jedes Nicht-`off`-Level wird als `on` behandelt (abgebildet auf `low`).
  - Moonshot (`moonshot/*`) bildet `/think off` auf `thinking: { type: "disabled" }` und jedes Nicht-`off`-Level auf `thinking: { type: "enabled" }` ab. Wenn Thinking aktiviert ist, akzeptiert Moonshot für `tool_choice` nur `auto|none`; OpenClaw normalisiert inkompatible Werte auf `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungsüberschreibung (gesetzt durch Senden einer Nachricht, die nur aus einer Direktive besteht).
3. Standard pro Agent (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standard (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: vom Provider deklarierter Standard, wenn verfügbar; andernfalls werden Reasoning-fähige Modelle auf `medium` oder das nächstunterstützte Nicht-`off`-Level für dieses Modell aufgelöst, und Modelle ohne Reasoning bleiben bei `off`.

## Einen Sitzungsstandard festlegen

- Senden Sie eine Nachricht, die **nur** aus der Direktive besteht (Leerraum ist erlaubt), z. B. `/think:medium` oder `/t high`.
- Das bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender); wird durch `/think:off` oder den Idle-Reset der Sitzung gelöscht.
- Es wird eine Bestätigungsantwort gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn das Level ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungsstatus bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um das aktuelle Thinking-Level zu sehen.

## Anwendung durch den Agenten

- **Embedded Pi**: Das aufgelöste Level wird an die Pi-Agent-Runtime im Prozess weitergegeben.

## Schnellmodus (/fast)

- Level: `on|off`.
- Eine Nachricht nur mit Direktive setzt eine Sitzungsüberschreibung für den Schnellmodus und antwortet mit `Fast mode enabled.` / `Fast mode disabled.`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuellen effektiven Status des Schnellmodus zu sehen.
- OpenClaw löst den Schnellmodus in dieser Reihenfolge auf:
  1. Inline-/nur-Direktive `/fast on|off`
  2. Sitzungsüberschreibung
  3. Standard pro Agent (`agents.list[].fastModeDefault`)
  4. Konfiguration pro Modell: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Für `openai/*` wird der Schnellmodus auf OpenAI-Priority-Processing abgebildet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Für `openai-codex/*` sendet der Schnellmodus dasselbe Flag `service_tier=priority` bei Codex Responses. OpenClaw behält einen gemeinsamen Schalter `/fast` über beide Authentifizierungspfade hinweg.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich per OAuth authentifiziertem Datenverkehr an `api.anthropic.com`, wird der Schnellmodus auf Anthropic-Service-Tiers abgebildet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` zu `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-Modellparameter `serviceTier` / `service_tier` überschreiben den Standardwert des Schnellmodus, wenn beides gesetzt ist. OpenClaw überspringt weiterhin die Einfügung von Anthropic-Service-Tiers für nicht-Anthropic-Proxy-Base-URLs.
- `/status` zeigt `Fast` nur an, wenn der Schnellmodus aktiviert ist.

## Verbose-Direktiven (/verbose oder /v)

- Level: `on` (minimal) | `full` | `off` (Standard).
- Eine Nachricht nur mit Direktive schaltet Verbose für die Sitzung um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Level geben einen Hinweis zurück, ohne den Status zu ändern.
- `/verbose off` speichert eine explizite Sitzungsüberschreibung; löschen Sie sie über die Sessions-UI, indem Sie `inherit` wählen.
- Eine Inline-Direktive gilt nur für diese Nachricht; ansonsten gelten Sitzungs-/globale Standards.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um das aktuelle Verbose-Level zu sehen.
- Wenn Verbose aktiviert ist, senden Agenten, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agenten), jeden Tool-Aufruf als eigene reine Metadaten-Nachricht zurück, wenn möglich mit dem Präfix `<emoji> <tool-name>: <arg>` (Pfad/Befehl). Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Sprechblasen), nicht als Streaming-Deltas.
- Zusammenfassungen von Tool-Fehlern bleiben im normalen Modus sichtbar, aber rohe Suffixe mit Fehlerdetails sind verborgen, sofern Verbose nicht `on` oder `full` ist.
- Wenn Verbose `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Sprechblase, auf eine sichere Länge gekürzt). Wenn Sie `/verbose on|full|off` umschalten, während ein Lauf noch aktiv ist, berücksichtigen nachfolgende Tool-Sprechblasen die neue Einstellung.

## Plugin-Trace-Direktiven (/trace)

- Level: `on` | `off` (Standard).
- Eine Nachricht nur mit Direktive schaltet die Ausgabe von Plugin-Trace für die Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive gilt nur für diese Nachricht; ansonsten gelten Sitzungs-/globale Standards.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um das aktuelle Trace-Level zu sehen.
- `/trace` ist enger gefasst als `/verbose`: Es zeigt nur Trace-/Debug-Zeilen im Besitz von Plugin an, wie Debug-Zusammenfassungen von Active Memory.
- Trace-Zeilen können in `/status` und als nachfolgende Diagnose-Nachricht nach der normalen Assistenten-Antwort erscheinen.

## Sichtbarkeit von Reasoning (/reasoning)

- Level: `on|off|stream`.
- Eine Nachricht nur mit Direktive schaltet um, ob Thinking-Blöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** mit dem Präfix `Reasoning:` gesendet.
- `stream` (nur Telegram): streamt Reasoning in die Telegram-Entwurfsblase, während die Antwort generiert wird, und sendet dann die endgültige Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um das aktuelle Reasoning-Level zu sehen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungsüberschreibung, dann Standard pro Agent (`agents.list[].reasoningDefault`), dann Fallback (`off`).

## Verwandt

- Dokumentation zum Elevated mode finden Sie unter [Elevated mode](/de/tools/elevated).

## Heartbeats

- Der Heartbeat-Probe-Body ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie üblich (vermeiden Sie es jedoch, Sitzungsstandards durch Heartbeats zu ändern).
- Die Heartbeat-Zustellung verwendet standardmäßig nur die finale Payload. Um zusätzlich die separate Nachricht `Reasoning:` zu senden (wenn verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Web-Chat-UI

- Der Thinking-Selektor im Web-Chat spiegelt beim Laden der Seite das gespeicherte Level der Sitzung aus dem Inbound-Session-Store/der Konfiguration wider.
- Wenn ein anderes Level ausgewählt wird, schreibt dies die Sitzungsüberschreibung sofort über `sessions.patch`; es wartet nicht auf das nächste Senden und ist keine einmalige Überschreibung `thinkingOnce`.
- Die erste Option ist immer `Default (<resolved level>)`, wobei der aufgelöste Standard aus dem Provider-Thinking-Profil des aktiven Sitzungsmodells plus derselben Fallback-Logik stammt, die `/status` und `session_status` verwenden.
- Der Picker verwendet `thinkingOptions`, die von der Gateway-Sitzungszeile zurückgegeben werden. Die Browser-UI führt keine eigene Regex-Liste für Provider; modellbezogene Level-Mengen gehören den Plugin.
- `/think:<level>` funktioniert weiterhin und aktualisiert dasselbe gespeicherte Sitzungslevel, sodass Chat-Direktiven und der Picker synchron bleiben.

## Provider-Profile

- Provider-Plugin können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Level und den Standard des Modells zu definieren.
- Jedes Profil-Level hat eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` oder `max`) und kann eine Anzeige-`label` enthalten. Binäre Provider verwenden `{ id: "low", label: "on" }`.
- Veröffentliche Legacy-Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitäts-Adapter erhalten, aber neue benutzerdefinierte Level-Mengen sollten `resolveThinkingProfile` verwenden.
- Gateway-Zeilen stellen `thinkingOptions` und `thinkingDefault` bereit, sodass ACP-/Chat-Clients dasselbe Profil rendern, das die Laufzeitvalidierung verwendet.
