---
read_when:
    - Chat-Befehle verwenden oder konfigurieren
    - Befehlsrouting oder Berechtigungen debuggen
summary: 'Slash-Befehle: Text vs. nativ, Konfiguration und unterstützte Befehle'
title: Slash-Befehle
x-i18n:
    generated_at: "2026-04-21T17:45:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26923608329ba2aeece2d4bc8edfa40ae86e03719a9f590f26ff79f57d97521d
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
  - In normalen Chat-Nachrichten (nicht nur aus Direktiven bestehend) werden sie als „Inline-Hinweise“ behandelt und **persistieren** keine Sitzungseinstellungen.
  - In Nachrichten, die nur aus Direktiven bestehen (die Nachricht enthält nur Direktiven), werden sie in der Sitzung gespeichert und antworten mit einer Bestätigung.
  - Direktiven werden nur für **autorisierte Absender** angewendet. Wenn `commands.allowFrom` gesetzt ist, ist dies die einzige verwendete
    Allowlist; andernfalls kommt die Autorisierung aus Channel-Allowlists/Pairing plus `commands.useAccessGroups`.
    Nicht autorisierte Absender sehen Direktiven als normalen Text behandelt.

Es gibt außerdem einige **Inline-Kurzbefehle** (nur für Absender auf der Allowlist/autorisierte Absender): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
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
  - Auf Oberflächen ohne native Befehle (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) funktionieren Textbefehle weiterhin, auch wenn Sie dies auf `false` setzen.
- `commands.native` (Standard: `"auto"`) registriert native Befehle.
  - Auto: an für Discord/Telegram; aus für Slack (bis Sie Slash-Befehle hinzufügen); ignoriert für Anbieter ohne native Unterstützung.
  - Setzen Sie `channels.discord.commands.native`, `channels.telegram.commands.native` oder `channels.slack.commands.native`, um dies pro Anbieter zu überschreiben (bool oder `"auto"`).
  - `false` löscht zuvor registrierte Befehle auf Discord/Telegram beim Start. Slack-Befehle werden in der Slack-App verwaltet und nicht automatisch entfernt.
- `commands.nativeSkills` (Standard: `"auto"`) registriert **Skills**-Befehle nativ, wenn dies unterstützt wird.
  - Auto: an für Discord/Telegram; aus für Slack (Slack erfordert das Anlegen eines Slash-Befehls pro Skill).
  - Setzen Sie `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` oder `channels.slack.commands.nativeSkills`, um dies pro Anbieter zu überschreiben (bool oder `"auto"`).
- `commands.bash` (Standard: `false`) aktiviert `! <cmd>`, um Host-Shell-Befehle auszuführen (`/bash <cmd>` ist ein Alias; erfordert `tools.elevated`-Allowlists).
- `commands.bashForegroundMs` (Standard: `2000`) steuert, wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` legt sofort in den Hintergrund).
- `commands.config` (Standard: `false`) aktiviert `/config` (liest/schreibt `openclaw.json`).
- `commands.mcp` (Standard: `false`) aktiviert `/mcp` (liest/schreibt von OpenClaw verwaltete MCP-Konfiguration unter `mcp.servers`).
- `commands.plugins` (Standard: `false`) aktiviert `/plugins` (Plugin-Erkennung/-Status sowie Installation und Aktivieren/Deaktivieren).
- `commands.debug` (Standard: `false`) aktiviert `/debug` (nur Laufzeit-Overrides).
- `commands.restart` (Standard: `true`) aktiviert `/restart` sowie Gateway-Neustart-Tool-Aktionen.
- `commands.ownerAllowFrom` (optional) setzt die explizite Owner-Allowlist für nur für Owner verfügbare Befehls-/Tool-Oberflächen. Dies ist getrennt von `commands.allowFrom`.
- `commands.ownerDisplay` steuert, wie Owner-IDs im System-Prompt erscheinen: `raw` oder `hash`.
- `commands.ownerDisplaySecret` setzt optional das HMAC-Secret, das verwendet wird, wenn `commands.ownerDisplay="hash"` gesetzt ist.
- `commands.allowFrom` (optional) setzt eine anbieterspezifische Allowlist für die Befehlsautorisierung. Wenn konfiguriert, ist sie die
  einzige Autorisierungsquelle für Befehle und Direktiven (`commands.useAccessGroups`
  sowie Channel-Allowlists/Pairing werden ignoriert). Verwenden Sie `"*"` für einen globalen Standard; anbieterspezifische Schlüssel überschreiben ihn.
- `commands.useAccessGroups` (Standard: `true`) erzwingt Allowlists/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.

## Befehlsliste

Aktuelle Source of Truth:

- integrierte Kernbefehle kommen aus `src/auto-reply/commands-registry.shared.ts`
- generierte Dock-Befehle kommen aus `src/auto-reply/commands-registry.data.ts`
- Plugin-Befehle kommen aus Plugin-`registerCommand()`-Aufrufen
- die tatsächliche Verfügbarkeit auf Ihrem Gateway hängt weiterhin von Konfigurations-Flags, der Channel-Oberfläche und installierten/aktivierten Plugins ab

### Integrierte Kernbefehle

Heute verfügbare integrierte Befehle:

- `/new [model]` startet eine neue Sitzung; `/reset` ist der Alias zum Zurücksetzen.
- `/reset soft [message]` behält das aktuelle Transkript, verwirft wiederverwendete CLI-Backend-Sitzungs-IDs und führt das Laden von Start-/System-Prompts direkt erneut aus.
- `/compact [instructions]` kompaktiert den Sitzungskontext. Siehe [/concepts/compaction](/de/concepts/compaction).
- `/stop` bricht den aktuellen Lauf ab.
- `/session idle <duration|off>` und `/session max-age <duration|off>` verwalten den Ablauf der Thread-Bindung.
- `/think <level>` setzt das Denk-Level. Die Optionen stammen aus dem Anbieterprofil des aktiven Modells; gängige Level sind `off`, `minimal`, `low`, `medium` und `high`, mit benutzerdefinierten Leveln wie `xhigh`, `adaptive`, `max` oder binärem `on` nur dort, wo unterstützt. Aliase: `/thinking`, `/t`.
- `/verbose on|off|full` schaltet ausführliche Ausgabe um. Alias: `/v`.
- `/trace on|off` schaltet Plugin-Trace-Ausgabe für die aktuelle Sitzung um.
- `/fast [status|on|off]` zeigt den Schnellmodus an oder setzt ihn.
- `/reasoning [on|off|stream]` schaltet die Sichtbarkeit von Reasoning um. Alias: `/reason`.
- `/elevated [on|off|ask|full]` schaltet den erhöhten Modus um. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` zeigt Standardwerte für Ausführung an oder setzt sie.
- `/model [name|#|status]` zeigt das Modell an oder setzt es.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` listet Anbieter oder Modelle für einen Anbieter auf.
- `/queue <mode>` verwaltet das Queue-Verhalten (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) sowie Optionen wie `debounce:2s cap:25 drop:summarize`.
- `/help` zeigt die kurze Hilfezusammenfassung an.
- `/commands` zeigt den generierten Befehlskatalog an.
- `/tools [compact|verbose]` zeigt, was der aktuelle Agent gerade verwenden kann.
- `/status` zeigt den Laufzeitstatus an, einschließlich Anbieternutzung/-quota, wenn verfügbar.
- `/tasks` listet aktive/aktuelle Hintergrundaufgaben für die aktuelle Sitzung auf.
- `/context [list|detail|json]` erklärt, wie der Kontext zusammengestellt wird.
- `/export-session [path]` exportiert die aktuelle Sitzung nach HTML. Alias: `/export`.
- `/whoami` zeigt Ihre Absender-ID. Alias: `/id`.
- `/skill <name> [input]` führt einen Skill nach Namen aus.
- `/allowlist [list|add|remove] ...` verwaltet Allowlist-Einträge. Nur Text.
- `/approve <id> <decision>` verarbeitet Genehmigungsaufforderungen für `exec`.
- `/btw <question>` stellt eine Nebenfrage, ohne den zukünftigen Sitzungskontext zu ändern. Siehe [/tools/btw](/de/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` verwaltet Sub-Agent-Läufe für die aktuelle Sitzung.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` verwaltet ACP-Sitzungen und Laufzeitoptionen.
- `/focus <target>` bindet den aktuellen Discord-Thread oder das aktuelle Telegram-Thema/die aktuelle Unterhaltung an ein Sitzungsziel.
- `/unfocus` entfernt die aktuelle Bindung.
- `/agents` listet threadgebundene Agents für die aktuelle Sitzung auf.
- `/kill <id|#|all>` bricht einen oder alle laufenden Sub-Agents ab.
- `/steer <id|#> <message>` sendet Steuerung an einen laufenden Sub-Agent. Alias: `/tell`.
- `/config show|get|set|unset` liest oder schreibt `openclaw.json`. Nur für Owner. Erfordert `commands.config: true`.
- `/mcp show|get|set|unset` liest oder schreibt von OpenClaw verwaltete MCP-Server-Konfiguration unter `mcp.servers`. Nur für Owner. Erfordert `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` prüft Plugin-Status oder ändert ihn. `/plugin` ist ein Alias. Schreibzugriffe nur für Owner. Erfordert `commands.plugins: true`.
- `/debug show|set|unset|reset` verwaltet nur zur Laufzeit geltende Konfigurations-Overrides. Nur für Owner. Erfordert `commands.debug: true`.
- `/usage off|tokens|full|cost` steuert die Nutzungsfußzeile pro Antwort oder gibt eine lokale Kostenzusammenfassung aus.
- `/tts on|off|status|provider|limit|summary|audio|help` steuert TTS. Siehe [/tools/tts](/de/tools/tts).
- `/restart` startet OpenClaw neu, wenn aktiviert. Standard: aktiviert; setzen Sie `commands.restart: false`, um ihn zu deaktivieren.
- `/activation mention|always` setzt den Gruppenaktivierungsmodus.
- `/send on|off|inherit` setzt die Send-Richtlinie. Nur für Owner.
- `/bash <command>` führt einen Host-Shell-Befehl aus. Nur Text. Alias: `! <command>`. Erfordert `commands.bash: true` plus `tools.elevated`-Allowlists.
- `!poll [sessionId]` prüft einen Bash-Hintergrundjob.
- `!stop [sessionId]` stoppt einen Bash-Hintergrundjob.

### Generierte Dock-Befehle

Dock-Befehle werden aus Channel-Plugins mit Unterstützung für native Befehle generiert. Aktueller gebündelter Satz:

- `/dock-discord` (Alias: `/dock_discord`)
- `/dock-mattermost` (Alias: `/dock_mattermost`)
- `/dock-slack` (Alias: `/dock_slack`)
- `/dock-telegram` (Alias: `/dock_telegram`)

### Befehle gebündelter Plugins

Gebündelte Plugins können weitere Slash-Befehle hinzufügen. Aktuelle gebündelte Befehle in diesem Repo:

- `/dreaming [on|off|status|help]` schaltet Memory Dreaming um. Siehe [Dreaming](/de/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` verwaltet den Geräte-Pairing-/Einrichtungsablauf. Siehe [Pairing](/de/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` aktiviert vorübergehend risikoreiche Phone-Node-Befehle.
- `/voice status|list [limit]|set <voiceId|name>` verwaltet die Talk-Sprachkonfiguration. Auf Discord lautet der Name des nativen Befehls `/talkvoice`.
- `/card ...` sendet LINE-Rich-Card-Voreinstellungen. Siehe [LINE](/de/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` prüft und steuert das gebündelte Codex-App-Server-Harness. Siehe [Codex Harness](/de/plugins/codex-harness).
- Nur QQBot-Befehle:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamische Skill-Befehle

Von Nutzern aufrufbare Skills werden ebenfalls als Slash-Befehle bereitgestellt:

- `/skill <name> [input]` funktioniert immer als generischer Einstiegspunkt.
- Skills können auch als direkte Befehle wie `/prose` erscheinen, wenn der Skill/das Plugin sie registriert.
- Die Registrierung nativer Skill-Befehle wird durch `commands.nativeSkills` und `channels.<provider>.commands.nativeSkills` gesteuert.

Hinweise:

- Befehle akzeptieren optional ein `:` zwischen dem Befehl und den Argumenten (z. B. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Anbieternamen (fuzzy match); wenn es keine Übereinstimmung gibt, wird der Text als Nachrichtentext behandelt.
- Für die vollständige Aufschlüsselung der Anbieternutzung verwenden Sie `openclaw status --usage`.
- `/allowlist add|remove` erfordert `commands.config=true` und beachtet Channel-`configWrites`.
- In Channels mit mehreren Konten beachten das auf Konfiguration zielende `/allowlist --account <id>` und `/config set channels.<provider>.accounts.<id>...` auch die `configWrites` des Zielkontos.
- `/usage` steuert die Nutzungsfußzeile pro Antwort; `/usage cost` gibt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungsprotokollen aus.
- `/restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um es zu deaktivieren.
- `/plugins install <spec>` akzeptiert dieselben Plugin-Spezifikationen wie `openclaw plugins install`: lokaler Pfad/Archiv, npm-Paket oder `clawhub:<pkg>`.
- `/plugins enable|disable` aktualisiert die Plugin-Konfiguration und fordert möglicherweise zu einem Neustart auf.
- Nur auf Discord verfügbarer nativer Befehl: `/vc join|leave|status` steuert Sprachkanäle (erfordert `channels.discord.voice` und native Befehle; nicht als Text verfügbar).
- Discord-Thread-Bindungsbefehle (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) erfordern, dass effektive Thread-Bindungen aktiviert sind (`session.threadBindings.enabled` und/oder `channels.discord.threadBindings.enabled`).
- ACP-Befehlsreferenz und Laufzeitverhalten: [ACP Agents](/de/tools/acp-agents).
- `/verbose` ist für Debugging und zusätzliche Sichtbarkeit gedacht; lassen Sie es im normalen Gebrauch **aus**.
- `/trace` ist enger gefasst als `/verbose`: Es zeigt nur Plugin-eigene Trace-/Debug-Zeilen und lässt normale ausführliche Tool-Ausgaben deaktiviert.
- `/fast on|off` speichert ein Sitzungs-Override. Verwenden Sie in der Sitzungs-UI die Option `inherit`, um es zu löschen und auf die Standardwerte aus der Konfiguration zurückzufallen.
- `/fast` ist anbieterspezifisch: OpenAI/OpenAI Codex ordnen es auf nativen Responses-Endpunkten `service_tier=priority` zu, während direkte öffentliche Anthropic-Anfragen, einschließlich OAuth-authentifiziertem Datenverkehr an `api.anthropic.com`, es `service_tier=auto` oder `standard_only` zuordnen. Siehe [OpenAI](/de/providers/openai) und [Anthropic](/de/providers/anthropic).
- Zusammenfassungen von Tool-Fehlern werden weiterhin angezeigt, wenn relevant, aber detaillierter Fehlertext wird nur aufgenommen, wenn `/verbose` auf `on` oder `full` steht.
- `/reasoning`, `/verbose` und `/trace` sind in Gruppeneinstellungen riskant: Sie können internes Reasoning, Tool-Ausgaben oder Plugin-Diagnosen offenlegen, die Sie nicht beabsichtigt hatten preiszugeben. Lassen Sie sie vorzugsweise deaktiviert, besonders in Gruppenchats.
- `/model` speichert das neue Sitzungsmodell sofort.
- Wenn der Agent inaktiv ist, verwendet der nächste Lauf es sofort.
- Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Wiederholungszeitpunkt mit dem neuen Modell neu.
- Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Wiederholungsmöglichkeit oder bis zur nächsten Nutzerinteraktion in der Warteschlange bleiben.
- **Schnellpfad:** Nur-Befehl-Nachrichten von Absendern auf der Allowlist werden sofort verarbeitet (umgehen Queue + Modell).
- **Gruppen-Erwähnungs-Gating:** Nur-Befehl-Nachrichten von Absendern auf der Allowlist umgehen Erwähnungsanforderungen.
- **Inline-Kurzbefehle (nur für Absender auf der Allowlist):** Bestimmte Befehle funktionieren auch, wenn sie in eine normale Nachricht eingebettet sind, und werden entfernt, bevor das Modell den verbleibenden Text sieht.
  - Beispiel: `hey /status` löst eine Statusantwort aus, und der verbleibende Text läuft normal weiter.
- Aktuell: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nicht autorisierte Nur-Befehl-Nachrichten werden stillschweigend ignoriert, und Inline-`/...`-Token werden als normaler Text behandelt.
- **Skill-Befehle:** `user-invocable` Skills werden als Slash-Befehle bereitgestellt. Namen werden zu `a-z0-9_` bereinigt (max. 32 Zeichen); bei Kollisionen werden numerische Suffixe angehängt (z. B. `_2`).
  - `/skill <name> [input]` führt einen Skill nach Namen aus (nützlich, wenn native Befehlslimits Befehle pro Skill verhindern).
  - Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.
  - Skills können optional `command-dispatch: tool` deklarieren, um den Befehl direkt an ein Tool zu routen (deterministisch, kein Modell).
  - Beispiel: `/prose` (OpenProse-Plugin) — siehe [OpenProse](/de/prose).
- **Argumente nativer Befehle:** Discord verwendet Autovervollständigung für dynamische Optionen (und Schaltflächenmenüs, wenn Sie erforderliche Argumente weglassen). Telegram und Slack zeigen ein Schaltflächenmenü an, wenn ein Befehl Auswahlmöglichkeiten unterstützt und Sie das Argument weglassen.

## `/tools`

`/tools` beantwortet eine Laufzeitfrage, keine Konfigurationsfrage: **was dieser Agent jetzt gerade in
dieser Unterhaltung verwenden kann**.

- Das Standard-`/tools` ist kompakt und für schnelles Überfliegen optimiert.
- `/tools verbose` fügt kurze Beschreibungen hinzu.
- Oberflächen mit nativen Befehlen, die Argumente unterstützen, bieten denselben Moduswechsel als `compact|verbose`.
- Ergebnisse sind sitzungsbezogen, daher können Änderungen an Agent, Channel, Thread, Absenderautorisierung oder Modell
  die Ausgabe verändern.
- `/tools` enthält Tools, die zur Laufzeit tatsächlich erreichbar sind, einschließlich Kern-Tools, verbundener
  Plugin-Tools und Channel-eigener Tools.

Für die Bearbeitung von Profilen und Overrides verwenden Sie das Tools-Panel der Control-UI oder Konfigurations-/Katalogoberflächen,
anstatt `/tools` als statischen Katalog zu behandeln.

## Nutzungsoberflächen (was wo angezeigt wird)

- **Anbieternutzung/-quota** (Beispiel: „Claude 80 % übrig“) wird in `/status` für den aktuellen Modellanbieter angezeigt, wenn Nutzungsverfolgung aktiviert ist. OpenClaw normalisiert Anbieterfenster auf `% übrig`; bei MiniMax werden Prozentfelder mit nur Restwert vor der Anzeige invertiert, und `model_remains`-Antworten bevorzugen den Chat-Modell-Eintrag plus ein planbezogenes Label mit Modell-Tag.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Nutzungeintrag im Transkript zurückfallen, wenn der Live-Sitzungs-Snapshot lückenhaft ist. Vorhandene von null verschiedene Live-Werte haben weiterhin Vorrang, und der Transkript-Fallback kann auch das aktive Laufzeitmodell-Label sowie einen größeren promptorientierten Gesamtwert wiederherstellen, wenn gespeicherte Summen fehlen oder kleiner sind.
- **Token/Kosten pro Antwort** wird durch `/usage off|tokens|full` gesteuert (an normale Antworten angehängt).
- `/model status` betrifft **Modelle/Auth/Endpunkte**, nicht die Nutzung.

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

- `/model` und `/model list` zeigen eine kompakte nummerierte Auswahl (Modellfamilie + verfügbare Anbieter).
- Auf Discord öffnen `/model` und `/models` eine interaktive Auswahl mit Dropdowns für Anbieter und Modell sowie einem Schritt zum Absenden.
- `/model <#>` wählt aus dieser Auswahl aus (und bevorzugt nach Möglichkeit den aktuellen Anbieter).
- `/model status` zeigt die Detailansicht an, einschließlich konfiguriertem Anbieter-Endpunkt (`baseUrl`) und API-Modus (`api`), wenn verfügbar.

## Debug-Overrides

`/debug` ermöglicht es Ihnen, **nur zur Laufzeit geltende** Konfigurations-Overrides zu setzen (im Speicher, nicht auf Datenträger). Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.debug: true`.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Hinweise:

- Overrides werden sofort auf neue Konfigurationslesevorgänge angewendet, schreiben jedoch **nicht** in `openclaw.json`.
- Verwenden Sie `/debug reset`, um alle Overrides zu löschen und zur Konfiguration auf Datenträger zurückzukehren.

## Plugin-Trace-Ausgabe

`/trace` erlaubt es Ihnen, **sitzungsbezogene Plugin-Trace-/Debug-Zeilen** umzuschalten, ohne den vollständigen ausführlichen Modus zu aktivieren.

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
- Plugin-Trace-Zeilen können in `/status` und als nachfolgende Diagnosenachricht nach der normalen Assistentenantwort erscheinen.
- `/trace` ersetzt nicht `/debug`; `/debug` verwaltet weiterhin nur zur Laufzeit geltende Konfigurations-Overrides.
- `/trace` ersetzt nicht `/verbose`; normale ausführliche Tool-/Statusausgabe gehört weiterhin zu `/verbose`.

## Konfigurationsaktualisierungen

`/config` schreibt in Ihre Konfiguration auf Datenträger (`openclaw.json`). Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.config: true`.

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

`/mcp` schreibt von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers`. Nur für Owner. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.mcp: true`.

Beispiele:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Hinweise:

- `/mcp` speichert die Konfiguration in der OpenClaw-Konfiguration, nicht in Pi-eigenen Projekteinstellungen.
- Laufzeitadapter entscheiden, welche Transporte tatsächlich ausführbar sind.

## Plugin-Aktualisierungen

`/plugins` ermöglicht es Betreibern, erkannte Plugins zu prüfen und deren Aktivierung in der Konfiguration umzuschalten. Schreibgeschützte Abläufe können `/plugin` als Alias verwenden. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.plugins: true`.

Beispiele:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Hinweise:

- `/plugins list` und `/plugins show` verwenden echte Plugin-Erkennung für den aktuellen Workspace plus die Konfiguration auf Datenträger.
- `/plugins enable|disable` aktualisiert nur die Plugin-Konfiguration; Plugins werden dadurch nicht installiert oder deinstalliert.
- Starten Sie das Gateway nach Änderungen durch Aktivieren/Deaktivieren neu, um sie anzuwenden.

## Hinweise zu Oberflächen

- **Textbefehle** laufen in der normalen Chat-Sitzung (Direktnachrichten teilen `main`, Gruppen haben ihre eigene Sitzung).
- **Native Befehle** verwenden isolierte Sitzungen:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (Präfix konfigurierbar über `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chat-Sitzung)
- **`/stop`** zielt auf die aktive Chat-Sitzung, damit der aktuelle Lauf abgebrochen werden kann.
- **Slack:** `channels.slack.slashCommand` wird weiterhin für einen einzelnen Befehl im Stil von `/openclaw` unterstützt. Wenn Sie `commands.native` aktivieren, müssen Sie einen Slack-Slash-Befehl pro integriertem Befehl erstellen (mit denselben Namen wie `/help`). Befehlsargumentmenüs für Slack werden als ephemere Block-Kit-Schaltflächen bereitgestellt.
  - Native Slack-Ausnahme: Registrieren Sie `/agentstatus` (nicht `/status`), weil Slack `/status` reserviert. Text-`/status` funktioniert weiterhin in Slack-Nachrichten.

## BTW-Nebenfragen

`/btw` ist eine schnelle **Nebenfrage** zur aktuellen Sitzung.

Im Unterschied zu normalem Chat:

- verwendet es die aktuelle Sitzung als Hintergrundkontext,
- läuft es als separater **Tool-loser** Einmalaufruf,
- verändert es den zukünftigen Sitzungskontext nicht,
- wird es nicht in den Transkriptverlauf geschrieben,
- wird es als Live-Nebenergebnis statt als normale Assistentennachricht zugestellt.

Dadurch ist `/btw` nützlich, wenn Sie eine vorübergehende Klärung möchten, während die Haupt-
aufgabe weiterläuft.

Beispiel:

```text
/btw was machen wir gerade?
```

Siehe [BTW Side Questions](/de/tools/btw) für das vollständige Verhalten und die UX-Details
des Clients.
