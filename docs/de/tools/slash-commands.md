---
read_when:
    - Chat-Befehle verwenden oder konfigurieren
    - Befehlsrouting oder Berechtigungen debuggen
summary: 'Slash-Befehle: Text vs. nativ, Konfiguration und unterstützte Befehle'
title: Slash-Befehle
x-i18n:
    generated_at: "2026-04-12T23:34:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ef6f54500fa2ce3b873a8398d6179a0882b8bf6fba38f61146c64671055505e
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash-Befehle

Befehle werden vom Gateway verarbeitet. Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt.
Der nur auf dem Host verfügbare Bash-Chat-Befehl verwendet `! <cmd>` (mit `/bash <cmd>` als Alias).

Es gibt zwei verwandte Systeme:

- **Befehle**: eigenständige `/...`-Nachrichten.
- **Direktiven**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
  - In normalen Chat-Nachrichten (nicht nur Direktiven) werden sie als „Inline-Hinweise“ behandelt und **persistieren** keine Sitzungseinstellungen.
  - In Nachrichten, die nur aus Direktiven bestehen (die Nachricht enthält nur Direktiven), werden sie für die Sitzung persistent gespeichert und mit einer Bestätigung beantwortet.
  - Direktiven werden nur für **autorisierte Absender** angewendet. Wenn `commands.allowFrom` gesetzt ist, ist dies die einzige
    verwendete Allowlist; andernfalls ergibt sich die Autorisierung aus Channel-Allowlists/Pairing plus `commands.useAccessGroups`.
    Nicht autorisierte Absender sehen Direktiven als normalen Text.

Es gibt außerdem einige **Inline-Kurzbefehle** (nur für allowlistete/autorisierte Absender): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Sie werden sofort ausgeführt, werden entfernt, bevor das Modell die Nachricht sieht, und der verbleibende Text läuft normal weiter.

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

- `commands.text` (Standard: `true`) aktiviert das Parsen von `/...` in Chat-Nachrichten.
  - Auf Oberflächen ohne native Befehle (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) funktionieren Textbefehle auch dann noch, wenn Sie dies auf `false` setzen.
- `commands.native` (Standard: `"auto"`) registriert native Befehle.
  - Auto: an für Discord/Telegram; aus für Slack (bis Sie Slash-Befehle hinzufügen); ignoriert für Provider ohne native Unterstützung.
  - Setzen Sie `channels.discord.commands.native`, `channels.telegram.commands.native` oder `channels.slack.commands.native`, um pro Provider zu überschreiben (Bool oder `"auto"`).
  - `false` löscht beim Start zuvor registrierte Befehle auf Discord/Telegram. Slack-Befehle werden in der Slack-App verwaltet und nicht automatisch entfernt.
- `commands.nativeSkills` (Standard: `"auto"`) registriert **Skill**-Befehle nativ, wenn unterstützt.
  - Auto: an für Discord/Telegram; aus für Slack (Slack erfordert einen Slash-Befehl pro Skill).
  - Setzen Sie `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` oder `channels.slack.commands.nativeSkills`, um pro Provider zu überschreiben (Bool oder `"auto"`).
- `commands.bash` (Standard: `false`) aktiviert `! <cmd>`, um Host-Shell-Befehle auszuführen (`/bash <cmd>` ist ein Alias; erfordert `tools.elevated`-Allowlists).
- `commands.bashForegroundMs` (Standard: `2000`) steuert, wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` verschiebt sofort in den Hintergrund).
- `commands.config` (Standard: `false`) aktiviert `/config` (liest/schreibt `openclaw.json`).
- `commands.mcp` (Standard: `false`) aktiviert `/mcp` (liest/schreibt OpenClaw-verwaltete MCP-Konfiguration unter `mcp.servers`).
- `commands.plugins` (Standard: `false`) aktiviert `/plugins` (Plugin-Erkennung/-Status plus Installations- und Aktivierungs-/Deaktivierungssteuerung).
- `commands.debug` (Standard: `false`) aktiviert `/debug` (nur Laufzeit-Überschreibungen).
- `commands.restart` (Standard: `true`) aktiviert `/restart` plus Tool-Aktionen zum Neustart des Gateways.
- `commands.ownerAllowFrom` (optional) setzt die explizite Owner-Allowlist für nur für Owner verfügbare Befehls-/Tool-Oberflächen. Dies ist getrennt von `commands.allowFrom`.
- `commands.ownerDisplay` steuert, wie Owner-IDs im System-Prompt erscheinen: `raw` oder `hash`.
- `commands.ownerDisplaySecret` setzt optional das HMAC-Secret, das verwendet wird, wenn `commands.ownerDisplay="hash"` gesetzt ist.
- `commands.allowFrom` (optional) setzt eine Provider-spezifische Allowlist für die Befehlsautorisierung. Wenn konfiguriert, ist dies die
  einzige Autorisierungsquelle für Befehle und Direktiven (Channel-Allowlists/Pairing und `commands.useAccessGroups`
  werden ignoriert). Verwenden Sie `"*"` als globalen Standard; Provider-spezifische Schlüssel überschreiben ihn.
- `commands.useAccessGroups` (Standard: `true`) erzwingt Allowlists/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.

## Befehlsliste

Aktuelle Source of Truth:

- Core-Built-ins stammen aus `src/auto-reply/commands-registry.shared.ts`
- generierte Dock-Befehle stammen aus `src/auto-reply/commands-registry.data.ts`
- Plugin-Befehle stammen aus Plugin-`registerCommand()`-Aufrufen
- die tatsächliche Verfügbarkeit auf Ihrem Gateway hängt weiterhin von Konfigurationsflags, der Channel-Oberfläche und installierten/aktivierten Plugins ab

### Core-Built-in-Befehle

Heute verfügbare integrierte Befehle:

- `/new [model]` startet eine neue Sitzung; `/reset` ist der Alias zum Zurücksetzen.
- `/compact [instructions]` verdichtet den Sitzungskontext. Siehe [/concepts/compaction](/de/concepts/compaction).
- `/stop` bricht den aktuellen Durchlauf ab.
- `/session idle <duration|off>` und `/session max-age <duration|off>` verwalten den Ablauf der Thread-Bindung.
- `/think <off|minimal|low|medium|high|xhigh>` setzt die Thinking-Stufe. Aliasse: `/thinking`, `/t`.
- `/verbose on|off|full` schaltet ausführliche Ausgabe um. Alias: `/v`.
- `/trace on|off` schaltet Plugin-Trace-Ausgabe für die aktuelle Sitzung um.
- `/fast [status|on|off]` zeigt den Schnellmodus an oder setzt ihn.
- `/reasoning [on|off|stream]` schaltet die Sichtbarkeit von Reasoning um. Alias: `/reason`.
- `/elevated [on|off|ask|full]` schaltet den Elevated-Modus um. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` zeigt Exec-Standardwerte an oder setzt sie.
- `/model [name|#|status]` zeigt das Modell an oder setzt es.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` listet Provider oder Modelle für einen Provider auf.
- `/queue <mode>` verwaltet das Queue-Verhalten (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) plus Optionen wie `debounce:2s cap:25 drop:summarize`.
- `/help` zeigt die kurze Hilfezusammenfassung.
- `/commands` zeigt den generierten Befehlskatalog.
- `/tools [compact|verbose]` zeigt, was der aktuelle Agent gerade verwenden kann.
- `/status` zeigt den Laufzeitstatus, einschließlich Provider-Nutzung/Kontingent, sofern verfügbar.
- `/tasks` listet aktive/aktuelle Hintergrundaufgaben für die aktuelle Sitzung auf.
- `/context [list|detail|json]` erklärt, wie Kontext zusammengesetzt wird.
- `/export-session [path]` exportiert die aktuelle Sitzung nach HTML. Alias: `/export`.
- `/whoami` zeigt Ihre Absender-ID an. Alias: `/id`.
- `/skill <name> [input]` führt einen Skill anhand seines Namens aus.
- `/allowlist [list|add|remove] ...` verwaltet Allowlist-Einträge. Nur Text.
- `/approve <id> <decision>` löst Exec-Genehmigungsaufforderungen auf.
- `/btw <question>` stellt eine Nebenfrage, ohne den zukünftigen Sitzungskontext zu ändern. Siehe [/tools/btw](/de/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` verwaltet Sub-Agent-Durchläufe für die aktuelle Sitzung.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` verwaltet ACP-Sitzungen und Laufzeitoptionen.
- `/focus <target>` bindet den aktuellen Discord-Thread oder das aktuelle Telegram-Thema/die aktuelle Unterhaltung an ein Sitzungsziel.
- `/unfocus` entfernt die aktuelle Bindung.
- `/agents` listet threadgebundene Agenten für die aktuelle Sitzung auf.
- `/kill <id|#|all>` bricht einen oder alle laufenden Sub-Agenten ab.
- `/steer <id|#> <message>` sendet Steuerung an einen laufenden Sub-Agenten. Alias: `/tell`.
- `/config show|get|set|unset` liest oder schreibt `openclaw.json`. Nur Owner. Erfordert `commands.config: true`.
- `/mcp show|get|set|unset` liest oder schreibt OpenClaw-verwaltete MCP-Server-Konfiguration unter `mcp.servers`. Nur Owner. Erfordert `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` prüft oder verändert den Plugin-Status. `/plugin` ist ein Alias. Schreibzugriffe nur für Owner. Erfordert `commands.plugins: true`.
- `/debug show|set|unset|reset` verwaltet nur zur Laufzeit geltende Konfigurationsüberschreibungen. Nur Owner. Erfordert `commands.debug: true`.
- `/usage off|tokens|full|cost` steuert den Nutzungs-Footer pro Antwort oder gibt eine lokale Kostenzusammenfassung aus.
- `/tts on|off|status|provider|limit|summary|audio|help` steuert TTS. Siehe [/tools/tts](/de/tools/tts).
- `/restart` startet OpenClaw neu, wenn aktiviert. Standard: aktiviert; setzen Sie `commands.restart: false`, um ihn zu deaktivieren.
- `/activation mention|always` setzt den Gruppenaktivierungsmodus.
- `/send on|off|inherit` setzt die Send-Richtlinie. Nur Owner.
- `/bash <command>` führt einen Host-Shell-Befehl aus. Nur Text. Alias: `! <command>`. Erfordert `commands.bash: true` plus `tools.elevated`-Allowlists.
- `!poll [sessionId]` prüft einen Bash-Hintergrundjob.
- `!stop [sessionId]` stoppt einen Bash-Hintergrundjob.

### Generierte Dock-Befehle

Dock-Befehle werden aus Channel-Plugins mit Unterstützung für native Befehle generiert. Aktuell gebündelter Satz:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

### Gebündelte Plugin-Befehle

Gebündelte Plugins können weitere Slash-Befehle hinzufügen. Aktuelle gebündelte Befehle in diesem Repo:

- `/dreaming [on|off|status|help]` schaltet Memory Dreaming um. Siehe [Dreaming](/de/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` verwaltet den Geräte-Pairing-/Einrichtungsablauf. Siehe [Pairing](/de/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` aktiviert vorübergehend risikoreiche Telefon-Node-Befehle.
- `/voice status|list [limit]|set <voiceId|name>` verwaltet die Talk-Sprachkonfiguration. Auf Discord lautet der native Befehlsname `/talkvoice`.
- `/card ...` sendet LINE-Rich-Card-Voreinstellungen. Siehe [LINE](/de/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` prüft und steuert das gebündelte Codex-App-Server-Harness. Siehe [Codex Harness](/de/plugins/codex-harness).
- Nur QQBot-Befehle:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamische Skill-Befehle

Vom Nutzer aufrufbare Skills werden ebenfalls als Slash-Befehle bereitgestellt:

- `/skill <name> [input]` funktioniert immer als generischer Einstiegspunkt.
- Skills können auch als direkte Befehle wie `/prose` erscheinen, wenn der Skill/das Plugin sie registriert.
- die Registrierung nativer Skill-Befehle wird durch `commands.nativeSkills` und `channels.<provider>.commands.nativeSkills` gesteuert.

Hinweise:

- Befehle akzeptieren optional ein `:` zwischen Befehl und Argumenten (z. B. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Providernamen (unscharfe Übereinstimmung); wenn es keine Übereinstimmung gibt, wird der Text als Nachrichtentext behandelt.
- Für die vollständige Aufschlüsselung der Provider-Nutzung verwenden Sie `openclaw status --usage`.
- `/allowlist add|remove` erfordert `commands.config=true` und berücksichtigt Channel-`configWrites`.
- In Multi-Account-Channels berücksichtigen das konfigurationsbezogene `/allowlist --account <id>` und `/config set channels.<provider>.accounts.<id>...` ebenfalls die `configWrites` des Zielkontos.
- `/usage` steuert den Nutzungs-Footer pro Antwort; `/usage cost` gibt eine lokale Kostenzusammenfassung aus den OpenClaw-Sitzungslogs aus.
- `/restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um ihn zu deaktivieren.
- `/plugins install <spec>` akzeptiert dieselben Plugin-Spezifikationen wie `openclaw plugins install`: lokaler Pfad/Archiv, npm-Paket oder `clawhub:<pkg>`.
- `/plugins enable|disable` aktualisiert die Plugin-Konfiguration und kann zu einem Neustart auffordern.
- Nur nativer Discord-Befehl: `/vc join|leave|status` steuert Sprachkanäle (erfordert `channels.discord.voice` und native Befehle; nicht als Text verfügbar).
- Discord-Thread-Bindungsbefehle (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) erfordern, dass effektive Thread-Bindungen aktiviert sind (`session.threadBindings.enabled` und/oder `channels.discord.threadBindings.enabled`).
- ACP-Befehlsreferenz und Laufzeitverhalten: [ACP Agents](/de/tools/acp-agents).
- `/verbose` ist für Debugging und zusätzliche Sichtbarkeit gedacht; lassen Sie es im normalen Gebrauch **aus**.
- `/trace` ist enger gefasst als `/verbose`: Es zeigt nur Plugin-eigene Trace-/Debug-Zeilen und lässt normale ausführliche Tool-Ausgaben ausgeschaltet.
- `/fast on|off` speichert eine sitzungsbezogene Überschreibung. Verwenden Sie in der Sitzungs-UI die Option `inherit`, um sie zu löschen und auf die Standardwerte der Konfiguration zurückzufallen.
- `/fast` ist provider-spezifisch: OpenAI/OpenAI Codex ordnen es auf nativen Responses-Endpunkten `service_tier=priority` zu, während direkte öffentliche Anthropic-Anfragen, einschließlich per OAuth authentifiziertem Datenverkehr an `api.anthropic.com`, es `service_tier=auto` oder `standard_only` zuordnen. Siehe [OpenAI](/de/providers/openai) und [Anthropic](/de/providers/anthropic).
- Zusammenfassungen von Tool-Fehlern werden weiterhin angezeigt, wenn relevant, aber detaillierter Fehlertext wird nur aufgenommen, wenn `/verbose` auf `on` oder `full` steht.
- `/reasoning`, `/verbose` und `/trace` sind in Gruppeneinstellungen riskant: Sie können internes Reasoning, Tool-Ausgabe oder Plugin-Diagnosen offenlegen, die Sie nicht beabsichtigt hatten offenzulegen. Lassen Sie sie vorzugsweise ausgeschaltet, besonders in Gruppenchats.
- `/model` speichert das neue Sitzungsmodell sofort persistent.
- Wenn der Agent inaktiv ist, verwendet der nächste Durchlauf es sofort.
- Wenn bereits ein Durchlauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Wiederholungszeitpunkt in das neue Modell neu.
- Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Wiederholungsmöglichkeit oder dem nächsten Nutzerzug in der Warteschlange bleiben.
- **Schnellpfad:** Nur-Befehl-Nachrichten von allowlisteten Absendern werden sofort verarbeitet (umgehen Queue + Modell).
- **Gruppen-Erwähnungs-Schranke:** Nur-Befehl-Nachrichten von allowlisteten Absendern umgehen Erwähnungsanforderungen.
- **Inline-Kurzbefehle (nur allowlistete Absender):** bestimmte Befehle funktionieren auch eingebettet in eine normale Nachricht und werden entfernt, bevor das Modell den verbleibenden Text sieht.
  - Beispiel: `hey /status` löst eine Statusantwort aus, und der verbleibende Text läuft normal weiter.
- Derzeit: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nicht autorisierte Nur-Befehl-Nachrichten werden stillschweigend ignoriert, und Inline-`/...`-Token werden als normaler Text behandelt.
- **Skill-Befehle:** `user-invocable` Skills werden als Slash-Befehle bereitgestellt. Namen werden auf `a-z0-9_` bereinigt (max. 32 Zeichen); bei Kollisionen werden numerische Suffixe angehängt (z. B. `_2`).
  - `/skill <name> [input]` führt einen Skill anhand des Namens aus (nützlich, wenn native Befehlsgrenzen Befehle pro Skill verhindern).
  - Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.
  - Skills können optional `command-dispatch: tool` deklarieren, um den Befehl direkt an ein Tool zu leiten (deterministisch, ohne Modell).
  - Beispiel: `/prose` (OpenProse-Plugin) — siehe [OpenProse](/de/prose).
- **Argumente nativer Befehle:** Discord verwendet Autocomplete für dynamische Optionen (und Button-Menüs, wenn Sie erforderliche Argumente weglassen). Telegram und Slack zeigen ein Button-Menü an, wenn ein Befehl Auswahlmöglichkeiten unterstützt und Sie das Argument weglassen.

## `/tools`

`/tools` beantwortet eine Laufzeitfrage, keine Konfigurationsfrage: **was dieser Agent in
dieser Unterhaltung gerade verwenden kann**.

- Standard-`/tools` ist kompakt und für schnelles Überfliegen optimiert.
- `/tools verbose` fügt kurze Beschreibungen hinzu.
- Oberflächen mit nativen Befehlen, die Argumente unterstützen, stellen denselben Moduswechsel als `compact|verbose` bereit.
- Ergebnisse sind sitzungsbezogen, daher können Änderungen an Agent, Channel, Thread, Absenderautorisierung oder Modell
  die Ausgabe ändern.
- `/tools` enthält Tools, die zur Laufzeit tatsächlich erreichbar sind, einschließlich Core-Tools, verbundener
  Plugin-Tools und Channel-eigener Tools.

Für Profil- und Override-Bearbeitung verwenden Sie das Tools-Panel in der Control UI oder Konfigurations-/Katalogoberflächen,
anstatt `/tools` als statischen Katalog zu behandeln.

## Nutzungsoberflächen (was wo angezeigt wird)

- **Provider-Nutzung/Kontingent** (Beispiel: „Claude 80% left“) wird in `/status` für den aktuellen Modell-Provider angezeigt, wenn Nutzungsverfolgung aktiviert ist. OpenClaw normalisiert Provider-Fenster auf `% left`; bei MiniMax werden Prozentfelder, die nur den verbleibenden Anteil enthalten, vor der Anzeige invertiert, und Antworten mit `model_remains` bevorzugen den Chat-Modell-Eintrag plus ein modellmarkiertes Tariflabel.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Usage-Eintrag im Transcript zurückfallen, wenn der Live-Sitzungs-Snapshot unvollständig ist. Bereits vorhandene Live-Werte ungleich null haben weiterhin Vorrang, und der Transcript-Fallback kann auch das aktive Laufzeit-Modelllabel plus eine größere promptorientierte Gesamtsumme wiederherstellen, wenn gespeicherte Summen fehlen oder kleiner sind.
- **Tokens/Kosten pro Antwort** werden mit `/usage off|tokens|full` gesteuert (an normale Antworten angehängt).
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

- `/model` und `/model list` zeigen einen kompakten nummerierten Auswahlbereich (Modellfamilie + verfügbare Provider).
- Auf Discord öffnen `/model` und `/models` einen interaktiven Auswahlbereich mit Provider- und Modell-Dropdowns plus einem Schritt zum Absenden.
- `/model <#>` wählt aus diesem Auswahlbereich aus (und bevorzugt nach Möglichkeit den aktuellen Provider).
- `/model status` zeigt die Detailansicht, einschließlich konfiguriertem Provider-Endpunkt (`baseUrl`) und API-Modus (`api`), sofern verfügbar.

## Debug-Overrides

`/debug` ermöglicht das Setzen von **nur zur Laufzeit geltenden** Konfigurations-Overrides (Memory, nicht Festplatte). Nur Owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.debug: true`.

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
- Verwenden Sie `/debug reset`, um alle Overrides zu löschen und zur Konfiguration auf der Festplatte zurückzukehren.

## Plugin-Trace-Ausgabe

`/trace` ermöglicht das Umschalten von **sitzungsbezogenen Plugin-Trace-/Debug-Zeilen**, ohne den vollständigen Verbose-Modus einzuschalten.

Beispiele:

```text
/trace
/trace on
/trace off
```

Hinweise:

- `/trace` ohne Argument zeigt den aktuellen Trace-Status der Sitzung an.
- `/trace on` aktiviert Plugin-Trace-Zeilen für die aktuelle Sitzung.
- `/trace off` deaktiviert sie wieder.
- Plugin-Trace-Zeilen können in `/status` und als diagnostische Folgemeldung nach der normalen Assistentenantwort erscheinen.
- `/trace` ersetzt `/debug` nicht; `/debug` verwaltet weiterhin nur Laufzeit-Konfigurations-Overrides.
- `/trace` ersetzt `/verbose` nicht; normale ausführliche Tool-/Statusausgabe gehört weiterhin zu `/verbose`.

## Konfigurationsaktualisierungen

`/config` schreibt in Ihre Konfiguration auf der Festplatte (`openclaw.json`). Nur Owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.config: true`.

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
- `/config`-Aktualisierungen bleiben über Neustarts hinweg erhalten.

## MCP-Aktualisierungen

`/mcp` schreibt von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers`. Nur Owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.mcp: true`.

Beispiele:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Hinweise:

- `/mcp` speichert die Konfiguration in der OpenClaw-Konfiguration, nicht in Pi-eigenen Projekteinstellungen.
- Laufzeit-Adapter entscheiden, welche Transporte tatsächlich ausführbar sind.

## Plugin-Aktualisierungen

`/plugins` ermöglicht es Operatoren, erkannte Plugins zu prüfen und deren Aktivierung in der Konfiguration umzuschalten. Schreibgeschützte Abläufe können `/plugin` als Alias verwenden. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.plugins: true`.

Beispiele:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Hinweise:

- `/plugins list` und `/plugins show` verwenden echte Plugin-Erkennung anhand des aktuellen Workspace plus der Konfiguration auf der Festplatte.
- `/plugins enable|disable` aktualisiert nur die Plugin-Konfiguration; Plugins werden dadurch nicht installiert oder deinstalliert.
- Starten Sie das Gateway nach Änderungen an enable/disable neu, damit sie wirksam werden.

## Hinweise zu Oberflächen

- **Textbefehle** laufen in der normalen Chat-Sitzung (DMs teilen sich `main`, Gruppen haben ihre eigene Sitzung).
- **Native Befehle** verwenden isolierte Sitzungen:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (Präfix über `channels.slack.slashCommand.sessionPrefix` konfigurierbar)
  - Telegram: `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chat-Sitzung)
- **`/stop`** zielt auf die aktive Chat-Sitzung, damit der aktuelle Durchlauf abgebrochen werden kann.
- **Slack:** `channels.slack.slashCommand` wird weiterhin für einen einzelnen Befehl im Stil von `/openclaw` unterstützt. Wenn Sie `commands.native` aktivieren, müssen Sie einen Slack-Slash-Befehl pro integrierten Befehl erstellen (mit denselben Namen wie `/help`). Menüs für Befehlsargumente werden bei Slack als ephemere Block-Kit-Buttons bereitgestellt.
  - Native Slack-Ausnahme: Registrieren Sie `/agentstatus` (nicht `/status`), weil Slack `/status` reserviert. Text-`/status` funktioniert in Slack-Nachrichten weiterhin.

## BTW-Nebenfragen

`/btw` ist eine schnelle **Nebenfrage** zur aktuellen Sitzung.

Im Gegensatz zu normalem Chat:

- verwendet sie die aktuelle Sitzung als Hintergrundkontext,
- läuft sie als separater **tool-loser** Einmalaufruf,
- ändert sie den zukünftigen Sitzungskontext nicht,
- wird sie nicht in den Transcript-Verlauf geschrieben,
- wird sie als Live-Seitenergebnis statt als normale Assistentennachricht zugestellt.

Dadurch ist `/btw` nützlich, wenn Sie eine vorübergehende Klärung möchten, während die Haupt-
aufgabe weiterläuft.

Beispiel:

```text
/btw what are we doing right now?
```

Siehe [BTW Side Questions](/de/tools/btw) für das vollständige Verhalten und die
Details der Client-UX.
