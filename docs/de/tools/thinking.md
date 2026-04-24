---
read_when:
    - Parsing oder Standardwerte von Thinking, Fast-Mode oder Verbose-Direktiven anpassen.
summary: Direktiv-Syntax für /think, /fast, /verbose, /trace und Sichtbarkeit von Reasoning
title: Thinking-Levels
x-i18n:
    generated_at: "2026-04-24T07:05:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc251ffa601646bf8672200b416661ae91fb21ff84525eedf6d6c538ff0e36cf
    source_path: tools/thinking.md
    workflow: 15
---

## Was es macht

- Inline-Direktive in jedem eingehenden Body: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Levels (Aliase): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „think“
  - low → „think hard“
  - medium → „think harder“
  - high → „ultrathink“ (maximales Budget)
  - xhigh → „ultrathink+“ (GPT-5.2+- und Codex-Modelle sowie Anthropic Claude Opus 4.7 effort)
  - adaptive → vom Provider verwaltetes adaptives Thinking (unterstützt für Claude 4.6 auf Anthropic/Bedrock und Anthropic Claude Opus 4.7)
  - max → maximales Reasoning des Providers (derzeit Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden auf `xhigh` gemappt.
  - `highest` wird auf `high` gemappt.
- Provider-Hinweise:
  - Menüs und Picker für Thinking werden von Provider-Profilen gesteuert. Provider-Plugins deklarieren das exakte Set an Levels für das ausgewählte Modell, einschließlich Labels wie binäres `on`.
  - `adaptive`, `xhigh` und `max` werden nur für Provider-/Modell-Profile beworben, die sie unterstützen. Getypte Direktiven für nicht unterstützte Levels werden mit den für dieses Modell gültigen Optionen abgelehnt.
  - Bereits gespeicherte, nicht unterstützte Levels werden nach Rang des Provider-Profils remappt. `adaptive` fällt bei nicht-adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf das größte unterstützte Nicht-`off`-Level für das ausgewählte Modell zurückfallen.
  - Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn kein explizites Thinking-Level gesetzt ist.
  - Anthropic Claude Opus 4.7 verwendet standardmäßig kein adaptives Thinking. Sein API-Standard für effort bleibt Provider-eigen, sofern Sie kein Thinking-Level explizit setzen.
  - Anthropic Claude Opus 4.7 mappt `/think xhigh` auf adaptives Thinking plus `output_config.effort: "xhigh"`, weil `/think` eine Thinking-Direktive ist und `xhigh` die Effort-Einstellung von Opus 4.7 ist.
  - Anthropic Claude Opus 4.7 stellt auch `/think max` bereit; es mappt auf denselben providerverwalteten Max-Effort-Pfad.
  - OpenAI-GPT-Modelle mappen `/think` über modellspezifische Effort-Unterstützung der Responses API. `/think off` sendet `reasoning.effort: "none"` nur dann, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Reasoning-Payload weg, statt einen nicht unterstützten Wert zu senden.
  - MiniMax (`minimax/*`) verwendet auf dem Anthropic-kompatiblen Streaming-Pfad standardmäßig `thinking: { type: "disabled" }`, sofern Sie Thinking nicht explizit in Modell- oder Request-Parametern setzen. Dadurch werden geleakte `reasoning_content`-Deltas aus dem nicht nativen Anthropic-Streamformat von MiniMax vermieden.
  - Z.AI (`zai/*`) unterstützt nur binäres Thinking (`on`/`off`). Jedes Nicht-`off`-Level wird als `on` behandelt (auf `low` gemappt).
  - Moonshot (`moonshot/*`) mappt `/think off` auf `thinking: { type: "disabled" }` und jedes Nicht-`off`-Level auf `thinking: { type: "enabled" }`. Wenn Thinking aktiviert ist, akzeptiert Moonshot für `tool_choice` nur `auto|none`; OpenClaw normalisiert inkompatible Werte auf `auto`.

## Reihenfolge der Auflösung

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungsüberschreibung (gesetzt durch das Senden einer Nachricht, die nur aus der Direktive besteht).
3. Standardwert pro Agent (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standardwert (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: vom Provider deklarierter Standard, wenn verfügbar; andernfalls lösen reasoning-fähige Modelle zu `medium` oder zum nächstgelegenen unterstützten Nicht-`off`-Level für dieses Modell auf, und nicht reasoning-fähige Modelle bleiben bei `off`.

## Einen Sitzungsstandard setzen

- Senden Sie eine Nachricht, die **nur** aus der Direktive besteht (Whitespace ist erlaubt), z. B. `/think:medium` oder `/t high`.
- Das bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender); wird durch `/think:off` oder Sitzungs-Idle-Reset gelöscht.
- Es wird eine Bestätigungsantwort gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn das Level ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungszustand bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um das aktuelle Thinking-Level zu sehen.

## Anwendung durch den Agenten

- **Embedded Pi**: Das aufgelöste Level wird an die In-Process-Pi-Agent-Runtime übergeben.

## Fast mode (/fast)

- Levels: `on|off`.
- Eine Nachricht nur mit der Direktive schaltet eine Sitzungsüberschreibung für Fast-Mode um und antwortet mit `Fast mode enabled.` / `Fast mode disabled.`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuell effektiven Fast-Mode-Zustand zu sehen.
- OpenClaw löst Fast-Mode in dieser Reihenfolge auf:
  1. Inline-/Direktive-only `/fast on|off`
  2. Sitzungsüberschreibung
  3. Standardwert pro Agent (`agents.list[].fastModeDefault`)
  4. Konfiguration pro Modell: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Für `openai/*` mappt Fast-Mode auf OpenAI-Priority-Processing, indem bei unterstützten Responses-Requests `service_tier=priority` gesendet wird.
- Für `openai-codex/*` sendet Fast-Mode dieselbe Kennzeichnung `service_tier=priority` auf Codex Responses. OpenClaw behält einen gemeinsamen Schalter `/fast` für beide Auth-Pfade.
- Für direkte öffentliche Requests `anthropic/*`, einschließlich OAuth-authentifizierten Traffics an `api.anthropic.com`, mappt Fast-Mode auf Anthropic-Service-Tiers: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` auf `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-Modellparameter `serviceTier` / `service_tier` überschreiben den Standard von Fast-Mode, wenn beides gesetzt ist. OpenClaw überspringt weiterhin die Anthropic-Service-Tier-Injektion für nicht-Anthropic-Proxy-Base-URLs.
- `/status` zeigt `Fast` nur, wenn Fast-Mode aktiviert ist.

## Verbose-Direktiven (/verbose oder /v)

- Levels: `on` (minimal) | `full` | `off` (Standard).
- Eine Nachricht nur mit der Direktive schaltet Verbose für die Sitzung um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Levels geben einen Hinweis zurück, ohne den Zustand zu ändern.
- `/verbose off` speichert eine explizite Sitzungsüberschreibung; löschen Sie sie in der Sessions UI über `inherit`.
- Eine Inline-Direktive gilt nur für diese Nachricht; Sitzungs-/globale Standardwerte gelten sonst.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um das aktuelle Verbose-Level zu sehen.
- Wenn Verbose eingeschaltet ist, senden Agents, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agents), jeden Tool-Call als eigene Nachricht nur mit Metadaten zurück, sofern verfügbar mit dem Präfix `<emoji> <tool-name>: <arg>` (Pfad/Befehl). Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Bubbles), nicht als Streaming-Deltas.
- Zusammenfassungen von Tool-Fehlern bleiben im normalen Modus sichtbar, aber rohe Suffixe mit Fehlerdetails sind verborgen, sofern Verbose nicht `on` oder `full` ist.
- Wenn Verbose `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Bubble, auf eine sichere Länge gekürzt). Wenn Sie `/verbose on|full|off` während eines laufenden Laufs umschalten, beachten nachfolgende Tool-Bubbles die neue Einstellung.

## Plugin-Trace-Direktiven (/trace)

- Levels: `on` | `off` (Standard).
- Eine Nachricht nur mit der Direktive schaltet Plugin-Trace-Ausgabe für die Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive gilt nur für diese Nachricht; Sitzungs-/globale Standardwerte gelten sonst.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um das aktuelle Trace-Level zu sehen.
- `/trace` ist enger als `/verbose`: Es legt nur plugin-eigene Trace-/Debug-Zeilen offen, wie etwa Debug-Zusammenfassungen von Active Memory.
- Trace-Zeilen können in `/status` und als diagnostische Folgemeldung nach der normalen Assistant-Antwort erscheinen.

## Sichtbarkeit von Reasoning (/reasoning)

- Levels: `on|off|stream`.
- Eine Nachricht nur mit der Direktive schaltet um, ob Thinking-Blöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** mit dem Präfix `Reasoning:` gesendet.
- `stream` (nur Telegram): streamt Reasoning in die Telegram-Entwurfsblase, während die Antwort erzeugt wird, und sendet dann die finale Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um das aktuelle Reasoning-Level zu sehen.
- Reihenfolge der Auflösung: Inline-Direktive, dann Sitzungsüberschreibung, dann Standard pro Agent (`agents.list[].reasoningDefault`), dann Fallback (`off`).

## Verwandt

- Dokumentation zu erhöhten Rechten finden Sie unter [Elevated mode](/de/tools/elevated).

## Heartbeats

- Der Body des Heartbeat-Probes ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie üblich (vermeiden Sie aber, Sitzungsstandards durch Heartbeats zu ändern).
- Heartbeat-Zustellung verwendet standardmäßig nur die finale Payload. Um zusätzlich die separate Nachricht `Reasoning:` zu senden (wenn verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Web-Chat-UI

- Der Thinking-Selector im Web-Chat spiegelt beim Laden der Seite das gespeicherte Level der Sitzung aus Inbound-Session-Store/Config.
- Das Auswählen eines anderen Levels schreibt die Sitzungsüberschreibung sofort per `sessions.patch`; es wartet nicht auf das nächste Senden und ist keine einmalige Überschreibung `thinkingOnce`.
- Die erste Option ist immer `Default (<resolved level>)`, wobei der aufgelöste Standard aus dem Provider-Thinking-Profil des aktiven Sitzungsmodells plus derselben Fallback-Logik kommt, die auch `/status` und `session_status` verwenden.
- Der Picker verwendet `thinkingOptions`, die von der Gateway-Sitzungszeile zurückgegeben werden. Die Browser-UI hält keine eigene Regex-Liste für Provider vor; Plugins besitzen die modellspezifischen Level-Sets.
- `/think:<level>` funktioniert weiterhin und aktualisiert dasselbe gespeicherte Sitzungs-Level, sodass Chat-Direktiven und Picker synchron bleiben.

## Provider-Profile

- Provider-Plugins können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Levels und den Standard des Modells zu definieren.
- Jedes Level im Profil hat eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` oder `max`) und kann ein Anzeige-`label` enthalten. Binäre Provider verwenden `{ id: "low", label: "on" }`.
- Veröffentliche Legacy-Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter erhalten, aber neue benutzerdefinierte Level-Sets sollten `resolveThinkingProfile` verwenden.
- Gateway-Zeilen stellen `thinkingOptions` und `thinkingDefault` bereit, sodass ACP-/Chat-Clients dasselbe Profil rendern, das die Runtime-Validierung verwendet.
