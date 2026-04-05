---
read_when:
    - Verwenden oder Konfigurieren von Chat-Befehlen
    - Debuggen von Befehlsrouting oder Berechtigungen
summary: 'Slash-Befehle: Text vs. nativ, Konfiguration und unterstützte Befehle'
title: Slash-Befehle
x-i18n:
    generated_at: "2026-04-05T12:59:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c91437140732d9accca1094f07b9e05f861a75ac344531aa24cc2ffe000630f
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash-Befehle

Befehle werden vom Gateway verarbeitet. Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt.
Der nur für den Host verfügbare Bash-Chat-Befehl verwendet `! <cmd>` (mit `/bash <cmd>` als Alias).

Es gibt zwei verwandte Systeme:

- **Befehle**: eigenständige `/...`-Nachrichten.
- **Direktiven**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Direktiven werden aus der Nachricht entfernt, bevor das Modell sie sieht.
  - In normalen Chat-Nachrichten (nicht nur aus Direktiven bestehend) werden sie als „Inline-Hinweise“ behandelt und persistieren keine Sitzungseinstellungen.
  - In Nachrichten, die nur aus Direktiven bestehen (die Nachricht enthält nur Direktiven), werden sie in der Sitzung persistiert und antworten mit einer Bestätigung.
  - Direktiven werden nur für **autorisierte Absender** angewendet. Wenn `commands.allowFrom` gesetzt ist, ist dies die einzige verwendete
    Allowlist; andernfalls kommt die Autorisierung aus Kanal-Allowlists/Pairing plus `commands.useAccessGroups`.
    Nicht autorisierte Absender sehen Direktiven als Klartext behandelt.

Es gibt außerdem einige **Inline-Kurzbefehle** (nur für allowgelistete/autorisierte Absender): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
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
    restart: false,
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (Standard `true`) aktiviert das Parsen von `/...` in Chat-Nachrichten.
  - Auf Oberflächen ohne native Befehle (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) funktionieren Textbefehle weiterhin, auch wenn Sie dies auf `false` setzen.
- `commands.native` (Standard `"auto"`) registriert native Befehle.
  - Auto: an für Discord/Telegram; aus für Slack (bis Sie Slash-Befehle hinzufügen); ignoriert für Provider ohne native Unterstützung.
  - Setzen Sie `channels.discord.commands.native`, `channels.telegram.commands.native` oder `channels.slack.commands.native`, um pro Provider zu überschreiben (bool oder `"auto"`).
  - `false` löscht zuvor registrierte Befehle beim Start auf Discord/Telegram. Slack-Befehle werden in der Slack-App verwaltet und nicht automatisch entfernt.
- `commands.nativeSkills` (Standard `"auto"`) registriert **Skills** nativ, wenn unterstützt.
  - Auto: an für Discord/Telegram; aus für Slack (Slack erfordert das Erstellen eines Slash-Befehls pro Skill).
  - Setzen Sie `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` oder `channels.slack.commands.nativeSkills`, um pro Provider zu überschreiben (bool oder `"auto"`).
- `commands.bash` (Standard `false`) aktiviert `! <cmd>` zum Ausführen von Host-Shell-Befehlen (`/bash <cmd>` ist ein Alias; erfordert `tools.elevated`-Allowlists).
- `commands.bashForegroundMs` (Standard `2000`) steuert, wie lange Bash wartet, bevor in den Hintergrundmodus gewechselt wird (`0` stellt sofort in den Hintergrund).
- `commands.config` (Standard `false`) aktiviert `/config` (liest/schreibt `openclaw.json`).
- `commands.mcp` (Standard `false`) aktiviert `/mcp` (liest/schreibt von OpenClaw verwaltete MCP-Konfiguration unter `mcp.servers`).
- `commands.plugins` (Standard `false`) aktiviert `/plugins` (Plugin-Erkennung/-Status plus Installations- und Aktivierungs-/Deaktivierungssteuerung).
- `commands.debug` (Standard `false`) aktiviert `/debug` (nur Runtime-Overrides).
- `commands.allowFrom` (optional) setzt eine Allowlist pro Provider für die Befehlsautorisierung. Wenn konfiguriert, ist sie die
  einzige Autorisierungsquelle für Befehle und Direktiven (Kanal-Allowlists/Pairing und `commands.useAccessGroups`
  werden ignoriert). Verwenden Sie `"*"` für einen globalen Standard; providerspezifische Schlüssel überschreiben ihn.
- `commands.useAccessGroups` (Standard `true`) erzwingt Allowlists/Richtlinien für Befehle, wenn `commands.allowFrom` nicht gesetzt ist.

## Befehlsliste

Text + nativ (wenn aktiviert):

- `/help`
- `/commands`
- `/tools [compact|verbose]` (anzeigen, was der aktuelle Agent jetzt gerade verwenden kann; `verbose` fügt Beschreibungen hinzu)
- `/skill <name> [input]` (einen Skill nach Name ausführen)
- `/status` (aktuellen Status anzeigen; enthält Nutzungs-/Kontingentdaten des Providers für den aktuellen Modell-Provider, wenn verfügbar)
- `/tasks` (Hintergrundaufgaben für die aktuelle Sitzung auflisten; zeigt aktive und aktuelle Aufgabendetails mit agentlokalen Fallback-Zählungen)
- `/allowlist` (Allowlist-Einträge auflisten/hinzufügen/entfernen)
- `/approve <id> <decision>` (Exec-Genehmigungsaufforderungen auflösen; verwenden Sie die ausstehende Genehmigungsnachricht für die verfügbaren Entscheidungen)
- `/context [list|detail|json]` („Kontext“ erklären; `detail` zeigt pro Datei + pro Tool + pro Skill + Größe des System-Prompts)
- `/btw <question>` (eine vergängliche Nebenfrage zur aktuellen Sitzung stellen, ohne den zukünftigen Sitzungskontext zu ändern; siehe [/tools/btw](/tools/btw))
- `/export-session [path]` (Alias: `/export`) (aktuelle Sitzung mit vollständigem System-Prompt nach HTML exportieren)
- `/whoami` (Ihre Absender-ID anzeigen; Alias: `/id`)
- `/session idle <duration|off>` (automatisches Entfokussieren bei Inaktivität für fokussierte Thread-Bindungen verwalten)
- `/session max-age <duration|off>` (hartes automatisches Entfokussieren bei maximalem Alter für fokussierte Thread-Bindungen verwalten)
- `/subagents list|kill|log|info|send|steer|spawn` (Subagent-Läufe für die aktuelle Sitzung inspizieren, steuern oder starten)
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions` (ACP-Runtime-Sitzungen inspizieren und steuern)
- `/agents` (threadgebundene Agenten für diese Sitzung auflisten)
- `/focus <target>` (Discord: diesen Thread oder einen neuen Thread an ein Sitzungs-/Subagent-Ziel binden)
- `/unfocus` (Discord: die aktuelle Thread-Bindung entfernen)
- `/kill <id|#|all>` (einen oder alle laufenden Subagenten für diese Sitzung sofort abbrechen; keine Bestätigungsnachricht)
- `/steer <id|#> <message>` (einen laufenden Subagenten sofort steuern: wenn möglich im Lauf, andernfalls aktuelle Arbeit abbrechen und mit der Steuerungsnachricht neu starten)
- `/tell <id|#> <message>` (Alias für `/steer`)
- `/config show|get|set|unset` (Konfiguration auf Datenträger persistieren, nur Eigentümer; erfordert `commands.config: true`)
- `/mcp show|get|set|unset` (von OpenClaw verwaltete MCP-Server-Konfiguration verwalten, nur Eigentümer; erfordert `commands.mcp: true`)
- `/plugins list|show|get|install|enable|disable` (erkannte Plugins inspizieren, neue installieren und Aktivierung umschalten; Schreibvorgänge nur für Eigentümer; erfordert `commands.plugins: true`)
  - `/plugin` ist ein Alias für `/plugins`.
  - `/plugin install <spec>` akzeptiert dieselben Plugin-Spezifikationen wie `openclaw plugins install`: lokaler Pfad/Archiv, npm-Paket oder `clawhub:<pkg>`.
  - Schreibvorgänge für Aktivieren/Deaktivieren antworten weiterhin mit einem Neustarthinweis. Auf einem überwachten Gateway im Vordergrund kann OpenClaw diesen Neustart direkt nach dem Schreibvorgang automatisch ausführen.
- `/debug show|set|unset|reset` (Runtime-Overrides, nur Eigentümer; erfordert `commands.debug: true`)
- `/usage off|tokens|full|cost` (Nutzungsfußzeile pro Antwort oder lokale Kostenzusammenfassung)
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio` (TTS steuern; siehe [/tts](/tools/tts))
  - Discord: der native Befehl ist `/voice` (Discord reserviert `/tts`); Text-`/tts` funktioniert weiterhin.
- `/stop`
- `/restart`
- `/dock-telegram` (Alias: `/dock_telegram`) (Antworten auf Telegram umschalten)
- `/dock-discord` (Alias: `/dock_discord`) (Antworten auf Discord umschalten)
- `/dock-slack` (Alias: `/dock_slack`) (Antworten auf Slack umschalten)
- `/activation mention|always` (nur Gruppen)
- `/send on|off|inherit` (nur Eigentümer)
- `/reset` oder `/new [model]` (optional Modellhinweis; Rest wird durchgereicht)
- `/think <off|minimal|low|medium|high|xhigh>` (dynamische Auswahl je nach Modell/Provider; Aliase: `/thinking`, `/t`)
- `/fast status|on|off` (ohne Argument wird der aktuelle effektive Fast-Mode-Status angezeigt)
- `/verbose on|full|off` (Alias: `/v`)
- `/reasoning on|off|stream` (Alias: `/reason`; wenn an, wird eine separate Nachricht mit Präfix `Reasoning:` gesendet; `stream` = nur Telegram-Entwurf)
- `/elevated on|off|ask|full` (Alias: `/elev`; `full` überspringt Exec-Genehmigungen)
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` (senden Sie `/exec`, um den aktuellen Wert anzuzeigen)
- `/model <name>` (Alias: `/models`; oder `/<alias>` aus `agents.defaults.models.*.alias`)
- `/queue <mode>` (plus Optionen wie `debounce:2s cap:25 drop:summarize`; senden Sie `/queue`, um die aktuellen Einstellungen zu sehen)
- `/bash <command>` (nur Host; Alias für `! <command>`; erfordert `commands.bash: true` + `tools.elevated`-Allowlists)
- `/dreaming [off|core|rem|deep|status|help]` (Dreaming-Modus umschalten oder Status anzeigen; siehe [Dreaming](/de/concepts/memory-dreaming))

Nur Text:

- `/compact [instructions]` (siehe [/concepts/compaction](/de/concepts/compaction))
- `! <command>` (nur Host; jeweils nur einer; verwenden Sie `!poll` + `!stop` für lang laufende Jobs)
- `!poll` (Ausgabe/Status prüfen; akzeptiert optional `sessionId`; `/bash poll` funktioniert ebenfalls)
- `!stop` (den laufenden Bash-Job stoppen; akzeptiert optional `sessionId`; `/bash stop` funktioniert ebenfalls)

Hinweise:

- Befehle akzeptieren optional ein `:` zwischen Befehl und Argumenten (z. B. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akzeptiert einen Modellalias, `provider/model` oder einen Providernamen (unscharfe Übereinstimmung); wenn es keine Übereinstimmung gibt, wird der Text als Nachrichtentext behandelt.
- Für die vollständige Aufschlüsselung der Providernutzung verwenden Sie `openclaw status --usage`.
- `/allowlist add|remove` erfordert `commands.config=true` und berücksichtigt kanalbezogene `configWrites`.
- In Kanälen mit mehreren Konten berücksichtigen konto-spezifische `/allowlist --account <id>` und `/config set channels.<provider>.accounts.<id>...` ebenfalls `configWrites` des Zielkontos.
- `/usage` steuert die Nutzungsfußzeile pro Antwort; `/usage cost` gibt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungslogs aus.
- `/restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um es zu deaktivieren.
- Nur auf Discord verfügbarer nativer Befehl: `/vc join|leave|status` steuert Sprachkanäle (erfordert `channels.discord.voice` und native Befehle; nicht als Text verfügbar).
- Discord-Befehle für Thread-Bindungen (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) erfordern, dass effektive Thread-Bindungen aktiviert sind (`session.threadBindings.enabled` und/oder `channels.discord.threadBindings.enabled`).
- ACP-Befehlsreferenz und Runtime-Verhalten: [ACP Agents](/tools/acp-agents).
- `/verbose` ist für Debugging und zusätzliche Sichtbarkeit gedacht; im normalen Gebrauch sollte es **aus** bleiben.
- `/fast on|off` persistiert einen Sitzungs-Override. Verwenden Sie in der Sessions-UI die Option `inherit`, um ihn zu löschen und auf Konfigurationsstandards zurückzufallen.
- `/fast` ist providerspezifisch: OpenAI/OpenAI Codex mappen es auf nativen Responses-Endpunkten auf `service_tier=priority`, während direkte öffentliche Anthropic-Anfragen, einschließlich OAuth-authentifiziertem Traffic an `api.anthropic.com`, es auf `service_tier=auto` oder `standard_only` mappen. Siehe [OpenAI](/providers/openai) und [Anthropic](/providers/anthropic).
- Zusammenfassungen von Tool-Fehlern werden weiterhin angezeigt, wenn relevant, aber detaillierter Fehlertext wird nur aufgenommen, wenn `/verbose` auf `on` oder `full` steht.
- `/reasoning` (und `/verbose`) sind in Gruppeneinstellungen riskant: Sie können internes Reasoning oder Tool-Ausgabe offenlegen, die Sie nicht beabsichtigt hatten. Lassen Sie sie bevorzugt aus, besonders in Gruppenchats.
- `/model` persistiert das neue Sitzungsmodell sofort.
- Wenn der Agent untätig ist, verwendet der nächste Lauf es sofort.
- Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Wiederholungszeitpunkt in das neue Modell neu.
- Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Wiederholungsmöglichkeit oder bis zum nächsten Benutzer-Turn in der Warteschlange bleiben.
- **Schneller Pfad:** Nur aus Befehlen bestehende Nachrichten von allowgelisteten Absendern werden sofort verarbeitet (umgehen Warteschlange + Modell).
- **Mention-Gating in Gruppen:** Nur aus Befehlen bestehende Nachrichten von allowgelisteten Absendern umgehen Mention-Anforderungen.
- **Inline-Kurzbefehle (nur allowgelistete Absender):** Bestimmte Befehle funktionieren auch, wenn sie in eine normale Nachricht eingebettet sind, und werden entfernt, bevor das Modell den restlichen Text sieht.
  - Beispiel: `hey /status` löst eine Statusantwort aus, und der verbleibende Text läuft durch den normalen Ablauf weiter.
- Derzeit: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nicht autorisierte Nachrichten, die nur aus Befehlen bestehen, werden stillschweigend ignoriert, und Inline-Token `/...` werden als Klartext behandelt.
- **Skill-Befehle:** `user-invocable`-Skills werden als Slash-Befehle bereitgestellt. Namen werden auf `a-z0-9_` bereinigt (maximal 32 Zeichen); bei Kollisionen werden numerische Suffixe angehängt (z. B. `_2`).
  - `/skill <name> [input]` führt einen Skill nach Namen aus (nützlich, wenn Grenzen nativer Befehle Befehle pro Skill verhindern).
  - Standardmäßig werden Skill-Befehle als normale Anfrage an das Modell weitergeleitet.
  - Skills können optional `command-dispatch: tool` deklarieren, um den Befehl direkt an ein Tool zu routen (deterministisch, ohne Modell).
  - Beispiel: `/prose` (OpenProse-Plugin) — siehe [OpenProse](/prose).
- **Argumente nativer Befehle:** Discord verwendet Autocomplete für dynamische Optionen (und Button-Menüs, wenn Sie erforderliche Argumente weglassen). Telegram und Slack zeigen ein Button-Menü an, wenn ein Befehl Auswahlmöglichkeiten unterstützt und Sie das Argument weglassen.

## `/tools`

`/tools` beantwortet eine Runtime-Frage, keine Konfigurationsfrage: **was dieser Agent jetzt gerade in
dieser Unterhaltung verwenden kann**.

- Standard-`/tools` ist kompakt und für schnelles Scannen optimiert.
- `/tools verbose` fügt kurze Beschreibungen hinzu.
- Oberflächen mit nativen Befehlen, die Argumente unterstützen, stellen denselben Moduswechsel `compact|verbose` bereit.
- Ergebnisse sind sitzungsbezogen, daher können Änderungen von Agent, Kanal, Thread, Absenderautorisierung oder Modell
  die Ausgabe ändern.
- `/tools` enthält Tools, die zur Laufzeit tatsächlich erreichbar sind, einschließlich Kern-Tools, verbundener
  Plugin-Tools und kanaleigener Tools.

Für das Bearbeiten von Profilen und Overrides verwenden Sie das Tools-Panel der Control UI oder Konfigurations-/Katalogoberflächen, anstatt
`/tools` als statischen Katalog zu behandeln.

## Nutzungsoberflächen (was wo angezeigt wird)

- **Providernutzung/-kontingent** (Beispiel: „Claude 80% left“) wird in `/status` für den aktuellen Modell-Provider angezeigt, wenn Nutzungstracking aktiviert ist. OpenClaw normalisiert Provider-Fenster auf `% left`; für MiniMax werden Felder mit verbleibendem Prozentsatz vor der Anzeige invertiert, und Antworten mit `model_remains` bevorzugen den Chat-Modell-Eintrag plus eine mit dem Modell gekennzeichnete Plan-Bezeichnung.
- **Token-/Cache-Zeilen** in `/status` können auf den neuesten Nutzungs-Eintrag im Transkript zurückfallen, wenn der Live-Sitzungs-Snapshot spärlich ist. Bestehende Live-Werte ungleich null behalten weiterhin Vorrang, und der Rückfall auf das Transkript kann auch das aktive Runtime-Modell-Label plus eine größere promptorientierte Gesamtsumme wiederherstellen, wenn gespeicherte Summen fehlen oder kleiner sind.
- **Tokens/Kosten pro Antwort** werden durch `/usage off|tokens|full` gesteuert (an normale Antworten angehängt).
- Bei `/model status` geht es um **Modelle/Auth/Endpunkte**, nicht um Nutzung.

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
- Auf Discord öffnen `/model` und `/models` einen interaktiven Picker mit Dropdowns für Provider und Modell plus einem Submit-Schritt.
- `/model <#>` wählt aus diesem Picker aus (und bevorzugt nach Möglichkeit den aktuellen Provider).
- `/model status` zeigt die Detailansicht, einschließlich konfiguriertem Provider-Endpunkt (`baseUrl`) und API-Modus (`api`), wenn verfügbar.

## Debug-Overrides

Mit `/debug` können Sie **nur Runtime-**Konfigurations-Overrides setzen (im Speicher, nicht auf Datenträger). Nur Eigentümer. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.debug: true`.

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
- Verwenden Sie `/debug reset`, um alle Overrides zu löschen und zur On-Disk-Konfiguration zurückzukehren.

## Konfigurationsaktualisierungen

Mit `/config` schreiben Sie in Ihre On-Disk-Konfiguration (`openclaw.json`). Nur Eigentümer. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.config: true`.

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

`/mcp` schreibt von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers`. Nur Eigentümer. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.mcp: true`.

Beispiele:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Hinweise:

- `/mcp` speichert Konfiguration in der OpenClaw-Konfiguration, nicht in Pi-eigenen Projekteinstellungen.
- Runtime-Adapter entscheiden, welche Transports tatsächlich ausführbar sind.

## Plugin-Aktualisierungen

Mit `/plugins` können Operatoren erkannte Plugins inspizieren und die Aktivierung in der Konfiguration umschalten. Schreibgeschützte Abläufe können `/plugin` als Alias verwenden. Standardmäßig deaktiviert; aktivieren Sie es mit `commands.plugins: true`.

Beispiele:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Hinweise:

- `/plugins list` und `/plugins show` verwenden echte Plugin-Erkennung für den aktuellen Workspace plus die On-Disk-Konfiguration.
- `/plugins enable|disable` aktualisiert nur die Plugin-Konfiguration; Plugins werden dadurch nicht installiert oder deinstalliert.
- Starten Sie nach Aktivierungs-/Deaktivierungsänderungen das Gateway neu, damit sie wirksam werden.

## Hinweise zu Oberflächen

- **Textbefehle** laufen in der normalen Chat-Sitzung (DMs teilen `main`, Gruppen haben ihre eigene Sitzung).
- **Native Befehle** verwenden isolierte Sitzungen:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (Präfix konfigurierbar über `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (zielt über `CommandTargetSessionKey` auf die Chat-Sitzung)
- **`/stop`** zielt auf die aktive Chat-Sitzung, damit der aktuelle Lauf abgebrochen werden kann.
- **Slack:** `channels.slack.slashCommand` wird weiterhin für einen einzelnen Befehl im Stil `/openclaw` unterstützt. Wenn Sie `commands.native` aktivieren, müssen Sie einen Slack-Slash-Befehl pro eingebautem Befehl erstellen (dieselben Namen wie `/help`). Menüs für Befehlsargumente in Slack werden als ephemere Block-Kit-Buttons zugestellt.
  - Native Ausnahme bei Slack: Registrieren Sie `/agentstatus` (nicht `/status`), weil Slack `/status` reserviert. Text-`/status` funktioniert in Slack-Nachrichten weiterhin.

## BTW-Nebenfragen

`/btw` ist eine schnelle **Nebenfrage** zur aktuellen Sitzung.

Im Unterschied zu normalem Chat:

- verwendet es die aktuelle Sitzung als Hintergrundkontext,
- läuft es als separater **toolloser** Einmalaufruf,
- ändert es nicht den zukünftigen Sitzungskontext,
- wird es nicht in den Transkriptverlauf geschrieben,
- wird es als Live-Nebenergebnis statt als normale Assistentennachricht zugestellt.

Dadurch ist `/btw` nützlich, wenn Sie eine temporäre Klarstellung möchten, während die Hauptaufgabe
weiterläuft.

Beispiel:

```text
/btw what are we doing right now?
```

Die vollständigen Details zum Verhalten und zur Client-UX finden Sie unter [BTW-Nebenfragen](/tools/btw).
