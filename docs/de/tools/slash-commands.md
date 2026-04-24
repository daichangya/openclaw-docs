---
read_when:
    - Chat-Befehle verwenden oder konfigurieren
    - Befehlsrouting oder Berechtigungen debuggen
summary: 'Slash-Befehle: textbasiert vs. nativ, Konfiguration und unterstützte Befehle'
title: Slash-Befehle
x-i18n:
    generated_at: "2026-04-24T07:05:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: f708cb3c4c22dc7a97b62ce5e2283b4ecfa5c44f72eb501934e80f80181953b7
    source_path: tools/slash-commands.md
    workflow: 15
---

Befehle werden vom Gateway verarbeitet. Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt.
Der nur auf dem Host verfügbare Bash-Chatbefehl verwendet `! <cmd>` (mit `/bash <cmd>` als Alias).

Es gibt zwei verwandte Systeme:

- **Befehle**: eigenständige `/...`-Nachrichten.
- **Direktiven**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
  - In normalen Chat-Nachrichten (nicht nur aus Direktiven bestehend) werden sie als „Inline-Hinweise“ behandelt und persistieren keine Sitzungseinstellungen.
  - In Nachrichten, die nur aus Direktiven bestehen (die Nachricht enthält nur Direktiven), werden sie in der Sitzung gespeichert und antworten mit einer Bestätigung.
  - Direktiven werden nur für **autorisierte Absender** angewendet. Wenn `commands.allowFrom` gesetzt ist, ist dies die einzige
    verwendete Allowlist; andernfalls stammt die Autorisierung aus Kanal-Allowlists/Pairing plus `commands.useAccessGroups`.
    Nicht autorisierte Absender sehen Direktiven als Klartext behandelt.

Es gibt auch einige **Inline-Kurzbefehle** (nur für Absender auf der Allowlist/autorisierte Absender): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
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
  - Auf Oberflächen ohne native Befehle (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) funktionieren Textbefehle weiterhin, selbst wenn Sie dies auf `false` setzen.
- `commands.native` (Standard `"auto"`) registriert native Befehle.
  - Auto: an für Discord/Telegram; aus für Slack (bis Sie Slash-Befehle hinzufügen); ignoriert für Provider ohne native Unterstützung.
  - Setzen Sie `channels.discord.commands.native`, `channels.telegram.commands.native` oder `channels.slack.commands.native`, um pro Provider zu überschreiben (bool oder `"auto"`).
  - `false` löscht beim Start zuvor registrierte Befehle auf Discord/Telegram. Slack-Befehle werden in der Slack-App verwaltet und nicht automatisch entfernt.
- `commands.nativeSkills` (Standard `"auto"`) registriert **Skill**-Befehle nativ, wenn unterstützt.
  - Auto: an für Discord/Telegram; aus für Slack (Slack erfordert die Erstellung eines Slash-Befehls pro Skill).
  - Setzen Sie `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` oder `channels.slack.commands.nativeSkills`, um pro Provider zu überschreiben (bool oder `"auto"`).
- `commands.bash` (Standard `false`) aktiviert `! <cmd>` zum Ausführen von Host-Shell-Befehlen (`/bash <cmd>` ist ein Alias; erfordert `tools.elevated`-Allowlists).
- `commands.bashForegroundMs` (Standard `2000`) steuert, wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` schiebt sofort in den Hintergrund).
- `commands.config` (Standard `false`) aktiviert `/config` (liest/schreibt `openclaw.json`).
- `commands.mcp` (Standard `false`) aktiviert `/mcp` (liest/schreibt die von OpenClaw verwaltete MCP-Konfiguration unter `mcp.servers`).
- `commands.plugins` (Standard `false`) aktiviert `/plugins` (Plugin-Discovery/Status plus Installation + Aktivieren/Deaktivieren).
- `commands.debug` (Standard `false`) aktiviert `/debug` (nur Laufzeit-Overrides).
- `commands.restart` (Standard `true`) aktiviert `/restart` plus Tool-Aktionen zum Neustart des Gateway.
- `commands.ownerAllowFrom` (optional) setzt die explizite Owner-Allowlist für Oberflächen von owner-only Befehlen/Tools. Dies ist getrennt von `commands.allowFrom`.
- Das kanalspezifische `channels.<channel>.commands.enforceOwnerForCommands` (optional, Standard `false`) erzwingt, dass owner-only Befehle auf dieser Oberfläche **Owner-Identität** benötigen. Wenn `true`, muss der Absender entweder zu einem aufgelösten Owner-Kandidaten passen (zum Beispiel ein Eintrag in `commands.ownerAllowFrom` oder providernative Owner-Metadaten) oder auf einem internen Nachrichtenkanal den internen Scope `operator.admin` besitzen. Ein Wildcard-Eintrag in `allowFrom` des Kanals oder eine leere/nicht auflösbare Liste von Owner-Kandidaten ist **nicht** ausreichend — owner-only Befehle schlagen auf diesem Kanal fail-closed fehl. Lassen Sie dies ausgeschaltet, wenn owner-only Befehle nur durch `ownerAllowFrom` und die Standard-Allowlists für Befehle begrenzt werden sollen.
- `commands.ownerDisplay` steuert, wie Owner-IDs im System-Prompt erscheinen: `raw` oder `hash`.
- `commands.ownerDisplaySecret` setzt optional das HMAC-Secret, das verwendet wird, wenn `commands.ownerDisplay="hash"` gesetzt ist.
- `commands.allowFrom` (optional) setzt eine Allowlist pro Provider für die Autorisierung von Befehlen. Wenn konfiguriert, ist dies die
  einzige Autorisierungsquelle für Befehle und Direktiven (Kanal-Allowlists/Pairing und `commands.useAccessGroups`
  werden ignoriert). Verwenden Sie `"*"` für einen globalen Standard; providerspezifische Schlüssel überschreiben diesen.
- `commands.useAccessGroups` (Standard `true`) erzwingt Allowlists/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.

## Befehlsliste

Aktuelle maßgebliche Quellen:

- Core-Built-ins kommen aus `src/auto-reply/commands-registry.shared.ts`
- generierte Dock-Befehle kommen aus `src/auto-reply/commands-registry.data.ts`
- Plugin-Befehle kommen aus `registerCommand()`-Aufrufen von Plugins
- die tatsächliche Verfügbarkeit auf Ihrem Gateway hängt weiterhin von Konfigurations-Flags, der Kanaloberfläche und installierten/aktivierten Plugins ab

### Core-Built-in-Befehle

Heute verfügbare integrierte Befehle:

- `/new [model]` startet eine neue Sitzung; `/reset` ist der Alias zum Zurücksetzen.
- `/reset soft [message]` behält das aktuelle Transkript, verwirft wiederverwendete Sitzungs-IDs des CLI-Backends und führt das Laden von Startup/System-Prompt an Ort und Stelle erneut aus.
- `/compact [instructions]` kompaktisiert den Sitzungskontext. Siehe [/concepts/compaction](/de/concepts/compaction).
- `/stop` bricht den aktuellen Lauf ab.
- `/session idle <duration|off>` und `/session max-age <duration|off>` verwalten den Ablauf der Thread-Bindung.
- `/think <level>` setzt die Thinking-Stufe. Optionen kommen aus dem Provider-Profil des aktiven Modells; gängige Stufen sind `off`, `minimal`, `low`, `medium` und `high`, mit benutzerdefinierten Stufen wie `xhigh`, `adaptive`, `max` oder nur binär `on`, wo unterstützt. Aliase: `/thinking`, `/t`.
- `/verbose on|off|full` schaltet ausführliche Ausgabe um. Alias: `/v`.
- `/trace on|off` schaltet Plugin-Trace-Ausgabe für die aktuelle Sitzung um.
- `/fast [status|on|off]` zeigt den Fast-Modus an oder setzt ihn.
- `/reasoning [on|off|stream]` schaltet die Sichtbarkeit von Reasoning um. Alias: `/reason`.
- `/elevated [on|off|ask|full]` schaltet den erhöhten Modus um. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` zeigt Exec-Standardeinstellungen an oder setzt sie.
- `/model [name|#|status]` zeigt das Modell an oder setzt es.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` listet Provider oder Modelle für einen Provider auf.
- `/queue <mode>` verwaltet das Verhalten der Warteschlange (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) plus Optionen wie `debounce:2s cap:25 drop:summarize`.
- `/help` zeigt die kurze Hilfezusammenfassung.
- `/commands` zeigt den generierten Befehlskatalog.
- `/tools [compact|verbose]` zeigt, was der aktuelle Agent gerade verwenden kann.
- `/status` zeigt den Laufzeitstatus an, einschließlich `Runtime`-/`Runner`-Labels sowie Provider-Nutzung/Quota, wenn verfügbar.
- `/tasks` listet aktive/aktuelle Hintergrundaufgaben für die aktuelle Sitzung auf.
- `/context [list|detail|json]` erklärt, wie Kontext zusammengestellt wird.
- `/export-session [path]` exportiert die aktuelle Sitzung nach HTML. Alias: `/export`.
- `/export-trajectory [path]` exportiert ein JSONL-[trajectory bundle](/de/tools/trajectory) für die aktuelle Sitzung. Alias: `/trajectory`.
- `/whoami` zeigt Ihre Absender-ID. Alias: `/id`.
- `/skill <name> [input]` führt einen Skill nach Namen aus.
- `/allowlist [list|add|remove] ...` verwaltet Allowlist-Einträge. Nur Text.
- `/approve <id> <decision>` löst Exec-Freigabeaufforderungen auf.
- `/btw <question>` stellt eine Nebenfrage, ohne den zukünftigen Sitzungskontext zu ändern. Siehe [/tools/btw](/de/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` verwaltet Subagent-Läufe für die aktuelle Sitzung.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` verwaltet ACP-Sitzungen und Laufzeitoptionen.
- `/focus <target>` bindet den aktuellen Discord-Thread oder das aktuelle Telegram-Thema/die aktuelle Konversation an ein Sitzungsziel.
- `/unfocus` entfernt die aktuelle Bindung.
- `/agents` listet threadgebundene Agenten für die aktuelle Sitzung auf.
- `/kill <id|#|all>` bricht einen oder alle laufenden Subagenten ab.
- `/steer <id|#> <message>` sendet Steuerung an einen laufenden Subagenten. Alias: `/tell`.
- `/config show|get|set|unset` liest oder schreibt `openclaw.json`. Nur für Owner. Erfordert `commands.config: true`.
- `/mcp show|get|set|unset` liest oder schreibt von OpenClaw verwaltete MCP-Server-Konfiguration unter `mcp.servers`. Nur für Owner. Erfordert `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` prüft oder verändert Plugin-Zustand. `/plugin` ist ein Alias. Schreibzugriffe nur für Owner. Erfordert `commands.plugins: true`.
- `/debug show|set|unset|reset` verwaltet reine Laufzeit-Overrides der Konfiguration. Nur für Owner. Erfordert `commands.debug: true`.
- `/usage off|tokens|full|cost` steuert den Nutzungs-Footer pro Antwort oder gibt eine lokale Kostenzusammenfassung aus.
- `/tts on|off|status|provider|limit|summary|audio|help` steuert TTS. Siehe [/tools/tts](/de/tools/tts).
- `/restart` startet OpenClaw neu, wenn aktiviert. Standard: aktiviert; setzen Sie `commands.restart: false`, um es zu deaktivieren.
- `/activation mention|always` setzt den Aktivierungsmodus für Gruppen.
- `/send on|off|inherit` setzt die Sende-Richtlinie. Nur für Owner.
- `/bash <command>` führt einen Host-Shell-Befehl aus. Nur Text. Alias: `! <command>`. Erfordert `commands.bash: true` plus `tools.elevated`-Allowlists.
- `!poll [sessionId]` prüft einen Bash-Job im Hintergrund.
- `!stop [sessionId]` stoppt einen Bash-Job im Hintergrund.

### Generierte Dock-Befehle

Dock-Befehle werden aus Kanal-Plugins mit Unterstützung für native Befehle generiert. Aktueller gebündelter Satz:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

### Befehle gebündelter Plugins

Gebündelte Plugins können weitere Slash-Befehle hinzufügen. Aktuelle gebündelte Befehle in diesem Repo:

- `/dreaming [on|off|status|help]` schaltet Memory Dreaming um. Siehe [Dreaming](/de/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` verwaltet Device-Pairing/Setup-Abläufe. Siehe [Pairing](/de/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` aktiviert vorübergehend risikoreiche Phone-Node-Befehle.
- `/voice status|list [limit]|set <voiceId|name>` verwaltet die Talk-Voice-Konfiguration. Auf Discord ist der native Befehlsname `/talkvoice`.
- `/card ...` sendet Rich-Card-Voreinstellungen für LINE. Siehe [LINE](/de/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` prüft und steuert das gebündelte Codex-App-Server-Harness. Siehe [Codex Harness](/de/plugins/codex-harness).
- Nur für QQBot verfügbare Befehle:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamische Skill-Befehle

Vom Benutzer aufrufbare Skills werden ebenfalls als Slash-Befehle bereitgestellt:

- `/skill <name> [input]` funktioniert immer als generischer Einstiegspunkt.
- Skills können auch als direkte Befehle wie `/prose` erscheinen, wenn der Skill/das Plugin sie registriert.
- Die native Registrierung von Skill-Befehlen wird durch `commands.nativeSkills` und `channels.<provider>.commands.nativeSkills` gesteuert.

Hinweise:

- Befehle akzeptieren optional ein `:` zwischen Befehl und Argumenten (z. B. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akzeptiert einen Modell-Alias, `provider/model` oder einen Providernamen (unscharfe Übereinstimmung); wenn nichts passt, wird der Text als Nachrichteninhalt behandelt.
- Für die vollständige Aufschlüsselung der Provider-Nutzung verwenden Sie `openclaw status --usage`.
- `/allowlist add|remove` erfordert `commands.config=true` und beachtet das kanalspezifische `configWrites`.
- In Multi-Account-Kanälen beachten konfigurationsgerichtete `/allowlist --account <id>` und `/config set channels.<provider>.accounts.<id>...` ebenfalls `configWrites` des Zielkontos.
- `/usage` steuert den Nutzungs-Footer pro Antwort; `/usage cost` gibt eine lokale Kostenzusammenfassung aus den OpenClaw-Sitzungslogs aus.
- `/restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um es zu deaktivieren.
- `/plugins install <spec>` akzeptiert dieselben Plugin-Spezifikationen wie `openclaw plugins install`: lokaler Pfad/Archiv, npm-Paket oder `clawhub:<pkg>`.
- `/plugins enable|disable` aktualisiert die Plugin-Konfiguration und fordert möglicherweise zu einem Neustart auf.
- Nur für Discord verfügbarer nativer Befehl: `/vc join|leave|status` steuert Sprachkanäle (erfordert `channels.discord.voice` und native Befehle; nicht als Text verfügbar).
- Thread-Binding-Befehle von Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) erfordern, dass effektive Thread-Bindings aktiviert sind (`session.threadBindings.enabled` und/oder `channels.discord.threadBindings.enabled`).
- Befehlsreferenz und Laufzeitverhalten für ACP: [ACP Agents](/de/tools/acp-agents).
- `/verbose` ist für Debugging und zusätzliche Sichtbarkeit gedacht; lassen Sie es im normalen Gebrauch **ausgeschaltet**.
- `/trace` ist enger gefasst als `/verbose`: Es zeigt nur Plugin-eigene Trace-/Debug-Zeilen und lässt normalen ausführlichen Tool-Chat weiterhin aus.
- `/fast on|off` speichert eine sitzungsbezogene Überschreibung. Verwenden Sie in der Sessions-UI die Option `inherit`, um diese zu löschen und auf die Standardwerte der Konfiguration zurückzufallen.
- `/fast` ist providerspezifisch: OpenAI/OpenAI Codex bilden dies auf nativen Responses-Endpunkten auf `service_tier=priority` ab, während direkte öffentliche Anthropic-Anfragen, einschließlich OAuth-authentifiziertem Datenverkehr an `api.anthropic.com`, auf `service_tier=auto` oder `standard_only` abgebildet werden. Siehe [OpenAI](/de/providers/openai) und [Anthropic](/de/providers/anthropic).
- Zusammenfassungen zu Tool-Fehlern werden weiterhin angezeigt, wenn relevant, aber detaillierter Fehltext wird nur eingeblendet, wenn `/verbose` auf `on` oder `full` steht.
- `/reasoning`, `/verbose` und `/trace` sind in Gruppeneinstellungen riskant: Sie können internes Reasoning, Tool-Ausgaben oder Plugin-Diagnosen offenlegen, die Sie nicht preisgeben wollten. Lassen Sie sie vorzugsweise ausgeschaltet, insbesondere in Gruppenchats.
- `/model` speichert das neue Sitzungsmodell sofort.
- Wenn der Agent inaktiv ist, verwendet der nächste Lauf es sofort.
- Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Retry-Punkt mit dem neuen Modell neu.
- Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen haben, kann der ausstehende Wechsel bis zu einer späteren Retry-Gelegenheit oder dem nächsten Benutzer-Turnus in der Warteschlange bleiben.
- **Schneller Pfad:** Nachrichten nur mit Befehlen von Absendern auf der Allowlist werden sofort verarbeitet (Warteschlange + Modell werden umgangen).
- **Erwähnungs-Gating in Gruppen:** Nachrichten nur mit Befehlen von Absendern auf der Allowlist umgehen Erwähnungsanforderungen.
- **Inline-Kurzbefehle (nur für Absender auf der Allowlist):** Bestimmte Befehle funktionieren auch, wenn sie in eine normale Nachricht eingebettet sind, und werden entfernt, bevor das Modell den verbleibenden Text sieht.
  - Beispiel: `hey /status` löst eine Statusantwort aus, und der verbleibende Text läuft durch den normalen Ablauf weiter.
- Derzeit: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nicht autorisierte Nachrichten nur mit Befehlen werden stillschweigend ignoriert, und Inline-Tokens `/...` werden als Klartext behandelt.
- **Skill-Befehle:** Skills mit `user-invocable` werden als Slash-Befehle bereitgestellt. Namen werden auf `a-z0-9_` bereinigt (max. 32 Zeichen); Kollisionen erhalten numerische Suffixe (z. B. `_2`).
  - `/skill <name> [input]` führt einen Skill nach Namen aus (nützlich, wenn native Befehlslimits Befehle pro Skill verhindern).
  - Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.
  - Skills können optional `command-dispatch: tool` deklarieren, um den Befehl direkt an ein Tool zu routen (deterministisch, ohne Modell).
  - Beispiel: `/prose` (OpenProse-Plugin) — siehe [OpenProse](/de/prose).
- **Argumente nativer Befehle:** Discord verwendet Autovervollständigung für dynamische Optionen (und Button-Menüs, wenn Sie erforderliche Argumente auslassen). Telegram und Slack zeigen ein Button-Menü, wenn ein Befehl Auswahlmöglichkeiten unterstützt und Sie das Argument auslassen.

## `/tools`

`/tools` beantwortet eine Laufzeitfrage, keine Konfigurationsfrage: **was dieser Agent jetzt in
dieser Konversation verwenden kann**.

- Standard-`/tools` ist kompakt und für schnelles Scannen optimiert.
- `/tools verbose` fügt kurze Beschreibungen hinzu.
- Native Befehlsoberflächen, die Argumente unterstützen, stellen denselben Moduswechsel über `compact|verbose` bereit.
- Ergebnisse sind sitzungsbezogen, sodass Änderungen an Agent, Kanal, Thread, Autorisierung des Absenders oder Modell
  die Ausgabe verändern können.
- `/tools` enthält Tools, die zur Laufzeit tatsächlich erreichbar sind, einschließlich Core-Tools, verbundener
  Plugin-Tools und kanalgebundener Tools.

Für das Bearbeiten von Profilen und Overrides verwenden Sie das Tools-Panel der Control UI oder Oberflächen für Konfiguration/Katalog, statt `/tools` als statischen Katalog zu behandeln.

## Nutzungsoberflächen (was wo angezeigt wird)

- **Provider-Nutzung/Quota** (Beispiel: „Claude 80% left“) wird in `/status` für den aktuellen Modell-Provider angezeigt, wenn Nutzungsverfolgung aktiviert ist. OpenClaw normalisiert Provider-Fenster auf `% left`; bei MiniMax werden Prozentfelder, die nur verbleibende Quote angeben, vor der Anzeige invertiert, und Antworten mit `model_remains` bevorzugen den Eintrag des Chat-Modells plus ein modellmarkiertes Plan-Label.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Nutzungs-Eintrag des Transkripts zurückfallen, wenn der Live-Sitzungs-Snapshot spärlich ist. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang, und der Fallback aus dem Transkript kann außerdem das aktive Laufzeit-Modelllabel sowie eine größere promptorientierte Gesamtsumme wiederherstellen, wenn gespeicherte Gesamtsummen fehlen oder kleiner sind.
- **Runtime vs Runner:** `/status` meldet `Runtime` für den effektiven Ausführungspfad und den Sandbox-Zustand sowie `Runner` dafür, wer die Sitzung tatsächlich ausführt: eingebetteter Pi, ein CLI-gestützter Provider oder ein ACP-Harness/Backend.
- **Tokens/Kosten pro Antwort** werden durch `/usage off|tokens|full` gesteuert (an normale Antworten angehängt).
- `/model status` bezieht sich auf **Modelle/Auth/Endpunkte**, nicht auf Nutzung.

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

- `/model` und `/model list` zeigen einen kompakten, nummerierten Picker (Modellfamilie + verfügbare Provider).
- Auf Discord öffnen `/model` und `/models` einen interaktiven Picker mit Dropdowns für Provider und Modell sowie einem Schritt zum Absenden.
- `/model <#>` wählt aus diesem Picker aus (und bevorzugt nach Möglichkeit den aktuellen Provider).
- `/model status` zeigt die Detailansicht, einschließlich konfiguriertem Provider-Endpunkt (`baseUrl`) und API-Modus (`api`), wenn verfügbar.

## Debug-Overrides

Mit `/debug` können Sie **nur Laufzeit-Overrides** für die Konfiguration setzen (im Speicher, nicht auf Datenträger). Nur für Owner. Standardmäßig deaktiviert; aktivieren mit `commands.debug: true`.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Hinweise:

- Overrides gelten sofort für neue Konfigurationslesevorgänge, schreiben aber **nicht** in `openclaw.json`.
- Verwenden Sie `/debug reset`, um alle Overrides zu löschen und zur auf dem Datenträger gespeicherten Konfiguration zurückzukehren.

## Plugin-Trace-Ausgabe

Mit `/trace` können Sie **sitzungsbezogene Trace-/Debug-Zeilen von Plugins** umschalten, ohne den vollständigen Verbose-Modus zu aktivieren.

Beispiele:

```text
/trace
/trace on
/trace off
```

Hinweise:

- `/trace` ohne Argument zeigt den aktuellen Trace-Zustand der Sitzung.
- `/trace on` aktiviert Plugin-Trace-Zeilen für die aktuelle Sitzung.
- `/trace off` deaktiviert sie wieder.
- Plugin-Trace-Zeilen können in `/status` und als nachfolgende Diagnose-Nachricht nach der normalen Assistant-Antwort erscheinen.
- `/trace` ersetzt nicht `/debug`; `/debug` verwaltet weiterhin reine Laufzeit-Overrides der Konfiguration.
- `/trace` ersetzt nicht `/verbose`; normale ausführliche Tool-/Status-Ausgabe gehört weiterhin zu `/verbose`.

## Konfigurationsaktualisierungen

`/config` schreibt in Ihre Konfiguration auf dem Datenträger (`openclaw.json`). Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.config: true`.

Beispiele:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Hinweise:

- Die Konfiguration wird vor dem Schreiben validiert; ungültige Änderungen werden abgewiesen.
- `/config`-Aktualisierungen bleiben über Neustarts hinweg erhalten.

## MCP-Aktualisierungen

`/mcp` schreibt von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers`. Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.mcp: true`.

Beispiele:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Hinweise:

- `/mcp` speichert Konfiguration in der OpenClaw-Konfiguration, nicht in Pi-eigenen Projekteinstellungen.
- Laufzeit-Adapter entscheiden, welche Transporte tatsächlich ausführbar sind.

## Plugin-Aktualisierungen

`/plugins` erlaubt Operatoren, erkannte Plugins zu prüfen und ihre Aktivierung in der Konfiguration umzuschalten. Für schreibgeschützte Abläufe kann `/plugin` als Alias verwendet werden. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.plugins: true`.

Beispiele:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Hinweise:

- `/plugins list` und `/plugins show` verwenden echte Plugin-Discovery gegen den aktuellen Workspace plus Konfiguration auf dem Datenträger.
- `/plugins enable|disable` aktualisiert nur die Plugin-Konfiguration; Plugins werden dadurch nicht installiert oder deinstalliert.
- Nach Änderungen durch Aktivieren/Deaktivieren starten Sie das Gateway neu, damit sie wirksam werden.

## Hinweise zu Oberflächen

- **Textbefehle** laufen in der normalen Chat-Sitzung (DMs teilen `main`, Gruppen haben ihre eigene Sitzung).
- **Native Befehle** verwenden isolierte Sitzungen:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (Präfix konfigurierbar über `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chat-Sitzung)
- **`/stop`** zielt auf die aktive Chat-Sitzung, damit der aktuelle Lauf abgebrochen werden kann.
- **Slack:** `channels.slack.slashCommand` wird weiterhin für einen einzelnen Befehl im Stil von `/openclaw` unterstützt. Wenn Sie `commands.native` aktivieren, müssen Sie einen Slack-Slash-Befehl pro integriertem Befehl erstellen (mit denselben Namen wie `/help`). Menüs für Befehlsargumente in Slack werden als ephemere Block-Kit-Buttons zugestellt.
  - Ausnahme für native Slack-Befehle: registrieren Sie `/agentstatus` (nicht `/status`), weil Slack `/status` reserviert. Text-`/status` funktioniert in Slack-Nachrichten weiterhin.

## BTW-Nebenfragen

`/btw` ist eine schnelle **Nebenfrage** zur aktuellen Sitzung.

Anders als normaler Chat:

- verwendet es die aktuelle Sitzung als Hintergrundkontext,
- läuft es als separater **toolloser** Einmalaufruf,
- verändert es den zukünftigen Sitzungskontext nicht,
- wird es nicht in die Transkripthistorie geschrieben,
- wird es als Live-Seitenergebnis statt als normale Assistant-Nachricht zugestellt.

Dadurch ist `/btw` nützlich, wenn Sie eine vorübergehende Klärung möchten, während die Haupt-
aufgabe weiterläuft.

Beispiel:

```text
/btw what are we doing right now?
```

Siehe [BTW Side Questions](/de/tools/btw) für das vollständige Verhalten und
Details zur Client-UX.

## Verwandt

- [Skills](/de/tools/skills)
- [Skills config](/de/tools/skills-config)
- [Creating skills](/de/tools/creating-skills)
