---
read_when:
    - Chat-Befehle verwenden oder konfigurieren
    - Befehlsrouting oder Berechtigungen debuggen
summary: 'Slash-Commands: Text vs. nativ, Konfiguration und unterstützte Befehle'
title: Slash-Commands
x-i18n:
    generated_at: "2026-04-23T14:08:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13290dcdf649ae66603a92a0aca68460bb63ff476179cc2dded796aaa841d66c
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash-Commands

Befehle werden vom Gateway verarbeitet. Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt.
Der nur für den Host verfügbare Bash-Chat-Befehl verwendet `! <cmd>` (mit `/bash <cmd>` als Alias).

Es gibt zwei verwandte Systeme:

- **Befehle**: eigenständige `/...`-Nachrichten.
- **Direktiven**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
  - In normalen Chat-Nachrichten (nicht nur aus Direktiven bestehend) werden sie als „Inline-Hinweise“ behandelt und **persistieren** keine Sitzungseinstellungen.
  - In Nachrichten, die nur aus Direktiven bestehen (die Nachricht enthält nur Direktiven), werden sie in der Sitzung persistiert und mit einer Bestätigung beantwortet.
  - Direktiven werden nur für **autorisierte Absender** angewendet. Wenn `commands.allowFrom` gesetzt ist, ist dies die einzige
    verwendete Allowlist; andernfalls kommt die Autorisierung aus Kanal-Allowlists/Pairing plus `commands.useAccessGroups`.
    Nicht autorisierte Absender sehen Direktiven als normalen Text behandelt.

Es gibt außerdem einige **Inline-Kurzbefehle** (nur für allowlistete/autorisierte Absender): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Sie werden sofort ausgeführt, werden entfernt, bevor das Modell die Nachricht sieht, und der verbleibende Text läuft durch den normalen Ablauf weiter.

## Konfiguration

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (Standard `true`) aktiviert das Parsen von `/...` in Chat-Nachrichten.
  - Auf Oberflächen ohne native Befehle (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) funktionieren Textbefehle auch dann weiterhin, wenn Sie dies auf `false` setzen.
- `commands.native` (Standard `"auto"`) registriert native Befehle.
  - Auto: an für Discord/Telegram; aus für Slack (bis Sie Slash-Commands hinzufügen); ignoriert für Provider ohne native Unterstützung.
  - Setzen Sie `channels.discord.commands.native`, `channels.telegram.commands.native` oder `channels.slack.commands.native`, um pro Provider zu überschreiben (bool oder `"auto"`).
  - `false` löscht beim Start zuvor registrierte Befehle auf Discord/Telegram. Slack-Befehle werden in der Slack-App verwaltet und nicht automatisch entfernt.
- `commands.nativeSkills` (Standard `"auto"`) registriert **Skills**-Befehle nativ, wenn dies unterstützt wird.
  - Auto: an für Discord/Telegram; aus für Slack (Slack erfordert das Erstellen eines Slash-Commands pro Skill).
  - Setzen Sie `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` oder `channels.slack.commands.nativeSkills`, um pro Provider zu überschreiben (bool oder `"auto"`).
- `commands.bash` (Standard `false`) aktiviert `! <cmd>`, um Shell-Befehle auf dem Host auszuführen (`/bash <cmd>` ist ein Alias; erfordert Allowlists für `tools.elevated`).
- `commands.bashForegroundMs` (Standard `2000`) steuert, wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` startet sofort im Hintergrund).
- `commands.config` (Standard `false`) aktiviert `/config` (liest/schreibt `openclaw.json`).
- `commands.mcp` (Standard `false`) aktiviert `/mcp` (liest/schreibt von OpenClaw verwaltete MCP-Konfiguration unter `mcp.servers`).
- `commands.plugins` (Standard `false`) aktiviert `/plugins` (Plugin-Erkennung/-Status plus Steuerelemente für Installation + Aktivierung/Deaktivierung).
- `commands.debug` (Standard `false`) aktiviert `/debug` (nur Laufzeit-Overrides).
- `commands.restart` (Standard `true`) aktiviert `/restart` plus Tool-Aktionen zum Neustart des Gateways.
- `commands.ownerAllowFrom` (optional) setzt die explizite Owner-Allowlist für nur dem Owner vorbehaltene Befehls-/Tool-Oberflächen. Dies ist getrennt von `commands.allowFrom`.
- Pro Kanal sorgt `channels.<channel>.commands.enforceOwnerForCommands` (optional, Standard `false`) dafür, dass nur dem Owner vorbehaltene Befehle auf dieser Oberfläche die **Owner-Identität** zum Ausführen erfordern. Wenn `true`, muss der Absender entweder einem aufgelösten Owner-Kandidaten entsprechen (zum Beispiel einem Eintrag in `commands.ownerAllowFrom` oder nativen Owner-Metadaten des Providers) oder auf einem internen Nachrichtenkanal den internen Scope `operator.admin` besitzen. Ein Wildcard-Eintrag in `allowFrom` des Kanals oder eine leere/nicht auflösbare Owner-Kandidatenliste ist **nicht** ausreichend — nur dem Owner vorbehaltene Befehle werden auf diesem Kanal fail-closed behandelt. Lassen Sie dies deaktiviert, wenn nur dem Owner vorbehaltene Befehle nur durch `ownerAllowFrom` und die Standard-Allowlists für Befehle geschützt sein sollen.
- `commands.ownerDisplay` steuert, wie Owner-IDs im System-Prompt erscheinen: `raw` oder `hash`.
- `commands.ownerDisplaySecret` setzt optional das HMAC-Secret, das verwendet wird, wenn `commands.ownerDisplay="hash"` gesetzt ist.
- `commands.allowFrom` (optional) setzt eine providerbezogene Allowlist für die Befehlsautorisierung. Wenn konfiguriert, ist dies die
  einzige Autorisierungsquelle für Befehle und Direktiven (Kanal-Allowlists/Pairing und `commands.useAccessGroups`
  werden ignoriert). Verwenden Sie `"*"` als globalen Standard; providerspezifische Schlüssel überschreiben diesen.
- `commands.useAccessGroups` (Standard `true`) erzwingt Allowlists/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.

## Befehlsliste

Aktuelle Quelle der Wahrheit:

- Core-Built-ins kommen aus `src/auto-reply/commands-registry.shared.ts`
- generierte Dock-Befehle kommen aus `src/auto-reply/commands-registry.data.ts`
- Plugin-Befehle kommen aus Plugin-Aufrufen von `registerCommand()`
- die tatsächliche Verfügbarkeit auf Ihrem Gateway hängt weiterhin von Konfigurations-Flags, der Kanaloberfläche und installierten/aktivierten Plugins ab

### Integrierte Core-Befehle

Heute verfügbare integrierte Befehle:

- `/new [model]` startet eine neue Sitzung; `/reset` ist der Alias zum Zurücksetzen.
- `/reset soft [message]` behält das aktuelle Transkript, verwirft wiederverwendete CLI-Backend-Sitzungs-IDs und führt das Laden von Startup-/System-Prompt direkt erneut aus.
- `/compact [instructions]` verdichtet den Sitzungskontext. Siehe [/concepts/compaction](/de/concepts/compaction).
- `/stop` bricht den aktuellen Lauf ab.
- `/session idle <duration|off>` und `/session max-age <duration|off>` verwalten das Ablaufverhalten von Thread-Bindings.
- `/think <level>` setzt die Thinking-Stufe. Die Optionen stammen aus dem Provider-Profil des aktiven Modells; übliche Stufen sind `off`, `minimal`, `low`, `medium` und `high`, mit benutzerdefinierten Stufen wie `xhigh`, `adaptive`, `max` oder binär `on` nur dort, wo unterstützt. Aliasse: `/thinking`, `/t`.
- `/verbose on|off|full` schaltet ausführliche Ausgabe um. Alias: `/v`.
- `/trace on|off` schaltet Plugin-Trace-Ausgabe für die aktuelle Sitzung um.
- `/fast [status|on|off]` zeigt den Schnellmodus an oder setzt ihn.
- `/reasoning [on|off|stream]` schaltet die Sichtbarkeit von Reasoning um. Alias: `/reason`.
- `/elevated [on|off|ask|full]` schaltet den Elevated-Modus um. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` zeigt Exec-Standardeinstellungen an oder setzt sie.
- `/model [name|#|status]` zeigt das Modell an oder setzt es.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` listet Provider oder Modelle für einen Provider auf.
- `/queue <mode>` verwaltet das Queue-Verhalten (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) plus Optionen wie `debounce:2s cap:25 drop:summarize`.
- `/help` zeigt die kurze Hilfeübersicht.
- `/commands` zeigt den generierten Befehlskatalog.
- `/tools [compact|verbose]` zeigt, was der aktuelle Agent im Moment verwenden kann.
- `/status` zeigt den Laufzeitstatus, einschließlich Labels `Runtime`/`Runner` und Provider-Nutzung/Kontingent, wenn verfügbar.
- `/tasks` listet aktive/aktuelle Hintergrundaufgaben für die aktuelle Sitzung auf.
- `/context [list|detail|json]` erklärt, wie Kontext zusammengestellt wird.
- `/export-session [path]` exportiert die aktuelle Sitzung nach HTML. Alias: `/export`.
- `/export-trajectory [path]` exportiert ein JSONL-[Trajectory-Bundle](/de/tools/trajectory) für die aktuelle Sitzung. Alias: `/trajectory`.
- `/whoami` zeigt Ihre Absender-ID. Alias: `/id`.
- `/skill <name> [input]` führt einen Skill nach Namen aus.
- `/allowlist [list|add|remove] ...` verwaltet Allowlist-Einträge. Nur Text.
- `/approve <id> <decision>` bearbeitet Exec-Genehmigungsaufforderungen.
- `/btw <question>` stellt eine Nebenfrage, ohne den zukünftigen Sitzungskontext zu ändern. Siehe [/tools/btw](/de/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` verwaltet Sub-Agent-Läufe für die aktuelle Sitzung.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` verwaltet ACP-Sitzungen und Laufzeitoptionen.
- `/focus <target>` bindet den aktuellen Discord-Thread oder das aktuelle Telegram-Topic/Gespräch an ein Sitzungsziel.
- `/unfocus` entfernt die aktuelle Bindung.
- `/agents` listet threadgebundene Agents für die aktuelle Sitzung auf.
- `/kill <id|#|all>` bricht einen oder alle laufenden Sub-Agents ab.
- `/steer <id|#> <message>` sendet Steuerung an einen laufenden Sub-Agent. Alias: `/tell`.
- `/config show|get|set|unset` liest oder schreibt `openclaw.json`. Nur Owner. Erfordert `commands.config: true`.
- `/mcp show|get|set|unset` liest oder schreibt von OpenClaw verwaltete MCP-Server-Konfiguration unter `mcp.servers`. Nur Owner. Erfordert `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` prüft oder verändert den Plugin-Status. `/plugin` ist ein Alias. Schreibzugriffe nur für Owner. Erfordert `commands.plugins: true`.
- `/debug show|set|unset|reset` verwaltet nur zur Laufzeit geltende Konfigurations-Overrides. Nur Owner. Erfordert `commands.debug: true`.
- `/usage off|tokens|full|cost` steuert die Nutzungs-Fußzeile pro Antwort oder gibt eine lokale Kostenzusammenfassung aus.
- `/tts on|off|status|provider|limit|summary|audio|help` steuert TTS. Siehe [/tools/tts](/de/tools/tts).
- `/restart` startet OpenClaw neu, wenn aktiviert. Standard: aktiviert; setzen Sie `commands.restart: false`, um ihn zu deaktivieren.
- `/activation mention|always` setzt den Gruppenaktivierungsmodus.
- `/send on|off|inherit` setzt die Senderichtlinie. Nur Owner.
- `/bash <command>` führt einen Shell-Befehl auf dem Host aus. Nur Text. Alias: `! <command>`. Erfordert `commands.bash: true` plus Allowlists für `tools.elevated`.
- `!poll [sessionId]` prüft einen Bash-Hintergrundjob.
- `!stop [sessionId]` stoppt einen Bash-Hintergrundjob.

### Generierte Dock-Befehle

Dock-Befehle werden aus Kanal-Plugins mit nativer Befehlsunterstützung generiert. Aktuelles gebündeltes Set:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

### Befehle gebündelter Plugins

Gebündelte Plugins können weitere Slash-Commands hinzufügen. Aktuelle gebündelte Befehle in diesem Repo:

- `/dreaming [on|off|status|help]` schaltet Memory-Dreaming um. Siehe [Dreaming](/de/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` verwaltet Device-Pairing-/Setup-Flows. Siehe [Pairing](/de/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` aktiviert vorübergehend risikoreiche Phone-Node-Befehle.
- `/voice status|list [limit]|set <voiceId|name>` verwaltet die Talk-Stimmenkonfiguration. Auf Discord lautet der native Befehlsname `/talkvoice`.
- `/card ...` sendet LINE-Rich-Card-Presets. Siehe [LINE](/de/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` prüft und steuert den gebündelten Codex-App-Server-Harness. Siehe [Codex Harness](/de/plugins/codex-harness).
- Nur für QQBot verfügbare Befehle:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamische Skill-Befehle

Vom Benutzer aufrufbare Skills werden ebenfalls als Slash-Commands bereitgestellt:

- `/skill <name> [input]` funktioniert immer als generischer Einstiegspunkt.
- Skills können auch als direkte Befehle wie `/prose` erscheinen, wenn der Skill/das Plugin sie registriert.
- Die Registrierung nativer Skill-Befehle wird durch `commands.nativeSkills` und `channels.<provider>.commands.nativeSkills` gesteuert.

Hinweise:

- Befehle akzeptieren optional ein `:` zwischen Befehl und Argumenten (z. B. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Providernamen (fuzzy match); wenn es keine Übereinstimmung gibt, wird der Text als Nachrichtentext behandelt.
- Für die vollständige Aufschlüsselung der Providernutzung verwenden Sie `openclaw status --usage`.
- `/allowlist add|remove` erfordert `commands.config=true` und berücksichtigt `configWrites` des Kanals.
- In Kanälen mit mehreren Konten berücksichtigen konfigurationsbezogene Befehle wie `/allowlist --account <id>` und `/config set channels.<provider>.accounts.<id>...` ebenfalls `configWrites` des Zielkontos.
- `/usage` steuert die Nutzungs-Fußzeile pro Antwort; `/usage cost` gibt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungslogs aus.
- `/restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um ihn zu deaktivieren.
- `/plugins install <spec>` akzeptiert dieselben Plugin-Spezifikationen wie `openclaw plugins install`: lokaler Pfad/Archiv, npm-Paket oder `clawhub:<pkg>`.
- `/plugins enable|disable` aktualisiert die Plugin-Konfiguration und fordert möglicherweise zu einem Neustart auf.
- Nur auf Discord verfügbarer nativer Befehl: `/vc join|leave|status` steuert Sprachkanäle (erfordert `channels.discord.voice` und native Befehle; nicht als Text verfügbar).
- Discord-Befehle für Thread-Bindings (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) erfordern, dass effektive Thread-Bindings aktiviert sind (`session.threadBindings.enabled` und/oder `channels.discord.threadBindings.enabled`).
- ACP-Befehlsreferenz und Laufzeitverhalten: [ACP Agents](/de/tools/acp-agents).
- `/verbose` ist für Debugging und zusätzliche Sichtbarkeit gedacht; lassen Sie es im normalen Gebrauch **aus**.
- `/trace` ist enger gefasst als `/verbose`: Es zeigt nur Plugin-eigene Trace-/Debug-Zeilen und lässt normale ausführliche Tool-Ausgaben ausgeschaltet.
- `/fast on|off` persistiert einen Sitzungs-Override. Verwenden Sie in der Sessions UI die Option `inherit`, um ihn zu löschen und auf die Standardwerte der Konfiguration zurückzufallen.
- `/fast` ist providerspezifisch: OpenAI/OpenAI Codex ordnen dies auf nativen Responses-Endpunkten `service_tier=priority` zu, während direkte öffentliche Anthropic-Anfragen, einschließlich OAuth-authentifiziertem Datenverkehr an `api.anthropic.com`, auf `service_tier=auto` oder `standard_only` abgebildet werden. Siehe [OpenAI](/de/providers/openai) und [Anthropic](/de/providers/anthropic).
- Zusammenfassungen von Tool-Fehlern werden weiterhin angezeigt, wenn relevant, aber detaillierter Fehlertext wird nur aufgenommen, wenn `/verbose` auf `on` oder `full` steht.
- `/reasoning`, `/verbose` und `/trace` sind in Gruppensettings riskant: Sie können internes Reasoning, Tool-Ausgaben oder Plugin-Diagnosen offenlegen, die Sie nicht sichtbar machen wollten. Lassen Sie sie bevorzugt ausgeschaltet, besonders in Gruppenchats.
- `/model` persistiert das neue Sitzungsmodell sofort.
- Wenn der Agent untätig ist, verwendet der nächste Lauf es sofort.
- Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Retry-Punkt mit dem neuen Modell neu.
- Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Retry-Gelegenheit oder dem nächsten Benutzerzug in der Warteschlange bleiben.
- **Schneller Pfad:** Nur-Befehl-Nachrichten von allowlisteten Absendern werden sofort verarbeitet (Bypass von Queue + Modell).
- **Steuerung über Gruppenerwähnungen:** Nur-Befehl-Nachrichten von allowlisteten Absendern umgehen Erwähnungsanforderungen.
- **Inline-Kurzbefehle (nur allowlistete Absender):** Bestimmte Befehle funktionieren auch eingebettet in einer normalen Nachricht und werden entfernt, bevor das Modell den restlichen Text sieht.
  - Beispiel: `hey /status` löst eine Statusantwort aus, und der restliche Text läuft durch den normalen Ablauf weiter.
- Aktuell: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nicht autorisierte Nur-Befehl-Nachrichten werden stillschweigend ignoriert, und Inline-Tokens `/...` werden als normaler Text behandelt.
- **Skill-Befehle:** `user-invocable` Skills werden als Slash-Commands bereitgestellt. Namen werden auf `a-z0-9_` bereinigt (max. 32 Zeichen); bei Kollisionen werden numerische Suffixe angehängt (z. B. `_2`).
  - `/skill <name> [input]` führt einen Skill nach Namen aus (nützlich, wenn native Befehlslimits Befehle pro Skill verhindern).
  - Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.
  - Skills können optional `command-dispatch: tool` deklarieren, um den Befehl direkt an ein Tool zu routen (deterministisch, ohne Modell).
  - Beispiel: `/prose` (OpenProse-Plugin) — siehe [OpenProse](/de/prose).
- **Argumente nativer Befehle:** Discord verwendet Autovervollständigung für dynamische Optionen (und Button-Menüs, wenn Sie erforderliche Argumente weglassen). Telegram und Slack zeigen ein Button-Menü, wenn ein Befehl Optionen unterstützt und Sie das Argument weglassen.

## `/tools`

`/tools` beantwortet eine Laufzeitfrage, keine Konfigurationsfrage: **was dieser Agent genau jetzt in
dieser Unterhaltung verwenden kann**.

- Standardmäßig ist `/tools` kompakt und für schnelles Scannen optimiert.
- `/tools verbose` fügt kurze Beschreibungen hinzu.
- Oberflächen mit nativen Befehlen, die Argumente unterstützen, bieten denselben Moduswechsel `compact|verbose`.
- Ergebnisse sind sitzungsbezogen, daher können Änderungen bei Agent, Kanal, Thread, Absenderautorisierung oder Modell
  die Ausgabe verändern.
- `/tools` enthält Tools, die zur Laufzeit tatsächlich erreichbar sind, einschließlich Core-Tools, verbundener
  Plugin-Tools und kanalbezogener Tools.

Für das Bearbeiten von Profilen und Overrides verwenden Sie das Tools-Panel der Control UI oder Konfigurations-/Katalogoberflächen, statt
`/tools` als statischen Katalog zu behandeln.

## Nutzungsoberflächen (was wo angezeigt wird)

- **Provider-Nutzung/Kontingent** (Beispiel: „Claude 80 % übrig“) erscheint in `/status` für den aktuellen Modell-Provider, wenn Nutzungsverfolgung aktiviert ist. OpenClaw normalisiert Provider-Fenster auf `% übrig`; bei MiniMax werden Prozentfelder, die nur den verbleibenden Anteil zeigen, vor der Anzeige invertiert, und Antworten mit `model_remains` bevorzugen den Eintrag des Chat-Modells plus ein mit dem Modell markiertes Plan-Label.
- **Token-/Cache-Zeilen** in `/status` können auf den letzten Nutzungseintrag im Transkript zurückfallen, wenn der Live-Sitzungssnapshot spärlich ist. Bestehende von null verschiedene Live-Werte haben weiterhin Vorrang, und der Transkript-Fallback kann auch das aktive Laufzeitmodell-Label plus eine größere promptorientierte Gesamtsumme wiederherstellen, wenn gespeicherte Summen fehlen oder kleiner sind.
- **Laufzeit vs. Runner:** `/status` meldet `Runtime` für den effektiven Ausführungspfad und den Sandbox-Status und `Runner` dafür, wer die Sitzung tatsächlich ausführt: eingebettetes Pi, ein CLI-gestützter Provider oder ein ACP-Harness/Backend.
- **Tokens/Kosten pro Antwort** werden über `/usage off|tokens|full` gesteuert (an normale Antworten angehängt).
- `/model status` betrifft **models/Auth/Endpunkte**, nicht die Nutzung.

## Modellauswahl (`/model`)

`/model` ist als Direktive implementiert.

Beispiele:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Hinweise:

- `/model` und `/model list` zeigen eine kompakte, nummerierte Auswahl an (Modellfamilie + verfügbare Provider).
- Auf Discord öffnen `/model` und `/models` eine interaktive Auswahl mit Dropdowns für Provider und Modell plus einem Submit-Schritt.
- `/model <#>` wählt aus dieser Auswahl aus (und bevorzugt wenn möglich den aktuellen Provider).
- `/model status` zeigt die Detailansicht, einschließlich des konfigurierten Provider-Endpunkts (`baseUrl`) und des API-Modus (`api`), sofern verfügbar.

## Debug-Overrides

Mit `/debug` können Sie **nur zur Laufzeit geltende** Konfigurations-Overrides setzen (im Speicher, nicht auf Platte). Nur Owner. Standardmäßig deaktiviert; aktivieren Sie mit `commands.debug: true`.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Hinweise:

- Overrides werden sofort auf neue Konfigurationslesevorgänge angewendet, schreiben aber **nicht** in `openclaw.json`.
- Verwenden Sie `/debug reset`, um alle Overrides zu löschen und zur Konfiguration auf der Festplatte zurückzukehren.

## Plugin-Trace-Ausgabe

Mit `/trace` können Sie **sitzungsbezogene Plugin-Trace-/Debug-Zeilen** umschalten, ohne den vollständigen ausführlichen Modus zu aktivieren.

Beispiele:

```text
/trace
/trace on
/trace off
```

Hinweise:

- `/trace` ohne Argument zeigt den aktuellen Trace-Status der Sitzung.
- `/trace on` aktiviert Plugin-Trace-Zeilen für die aktuelle Sitzung.
- `/trace off` deaktiviert sie wieder.
- Plugin-Trace-Zeilen können in `/status` und als diagnostische Folgenachricht nach der normalen Assistentenantwort erscheinen.
- `/trace` ersetzt `/debug` nicht; `/debug` verwaltet weiterhin nur zur Laufzeit geltende Konfigurations-Overrides.
- `/trace` ersetzt `/verbose` nicht; normale ausführliche Tool-/Statusausgaben gehören weiterhin zu `/verbose`.

## Konfigurationsupdates

`/config` schreibt in Ihre Konfiguration auf der Festplatte (`openclaw.json`). Nur Owner. Standardmäßig deaktiviert; aktivieren Sie mit `commands.config: true`.

Beispiele:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Hinweise:

- Die Konfiguration wird vor dem Schreiben validiert; ungültige Änderungen werden abgelehnt.
- `/config`-Updates bleiben über Neustarts hinweg erhalten.

## MCP-Updates

`/mcp` schreibt von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers`. Nur Owner. Standardmäßig deaktiviert; aktivieren Sie mit `commands.mcp: true`.

Beispiele:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Hinweise:

- `/mcp` speichert Konfiguration in der OpenClaw-Konfiguration, nicht in den projektbezogenen Einstellungen von Pi.
- Laufzeitadapter entscheiden, welche Transporte tatsächlich ausführbar sind.

## Plugin-Updates

Mit `/plugins` können Operatoren erkannte Plugins prüfen und die Aktivierung in der Konfiguration umschalten. Schreibgeschützte Abläufe können `/plugin` als Alias verwenden. Standardmäßig deaktiviert; aktivieren Sie mit `commands.plugins: true`.

Beispiele:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Hinweise:

- `/plugins list` und `/plugins show` verwenden echte Plugin-Erkennung gegen den aktuellen Workspace plus die Konfiguration auf der Festplatte.
- `/plugins enable|disable` aktualisiert nur die Plugin-Konfiguration; Plugins werden dadurch nicht installiert oder deinstalliert.
- Starten Sie nach Änderungen durch Aktivieren/Deaktivieren das Gateway neu, damit sie wirksam werden.

## Hinweise zu Oberflächen

- **Textbefehle** laufen in der normalen Chatsitzung (DMs teilen `main`, Gruppen haben ihre eigene Sitzung).
- **Native Befehle** verwenden isolierte Sitzungen:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (Präfix konfigurierbar über `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chatsitzung)
- **`/stop`** zielt auf die aktive Chatsitzung, damit der aktuelle Lauf abgebrochen werden kann.
- **Slack:** `channels.slack.slashCommand` wird weiterhin für einen einzelnen Befehl im Stil von `/openclaw` unterstützt. Wenn Sie `commands.native` aktivieren, müssen Sie pro integriertem Befehl einen Slack-Slash-Command erstellen (mit denselben Namen wie `/help`). Menüs für Befehlsargumente werden bei Slack als ephemere Block-Kit-Buttons ausgeliefert.
  - Native Ausnahme bei Slack: Registrieren Sie `/agentstatus` (nicht `/status`), weil Slack `/status` reserviert. Textbasiertes `/status` funktioniert in Slack-Nachrichten weiterhin.

## BTW-Nebenfragen

`/btw` ist eine schnelle **Nebenfrage** zur aktuellen Sitzung.

Im Unterschied zum normalen Chat:

- verwendet sie die aktuelle Sitzung als Hintergrundkontext,
- läuft sie als separater **tool-loser** One-shot-Aufruf,
- verändert sie nicht den zukünftigen Sitzungskontext,
- wird sie nicht in den Transkriptverlauf geschrieben,
- wird sie als Live-Nebenergebnis statt als normale Assistentennachricht ausgeliefert.

Dadurch ist `/btw` nützlich, wenn Sie eine temporäre Klärung möchten, während die Haupt-
aufgabe weiterläuft.

Beispiel:

```text
/btw was machen wir gerade?
```

Siehe [BTW-Nebenfragen](/de/tools/btw) für das vollständige Verhalten und Details zur
Client-UX.
