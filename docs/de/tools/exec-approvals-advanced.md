---
read_when:
    - Sichere Bins oder benutzerdefinierte Safe-Bin-Profile konfigurieren
    - Genehmigungen an Slack/Discord/Telegram oder andere Chat-Kanäle weiterleiten
    - Einen nativen Approval-Client für einen Kanal implementieren
summary: 'Erweiterte Exec-Genehmigungen: sichere Bins, Interpreter-Bindung, Weiterleitung von Genehmigungen, native Zustellung'
title: Exec-Genehmigungen — erweitert
x-i18n:
    generated_at: "2026-04-24T07:02:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7834a8ebfb623b38e4c2676f0e24285d5b44e2dce45c55a33db842d1bbf81be
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

Erweiterte Themen zu Exec-Genehmigungen: der Fast-Path `safeBins`, Interpreter-/Runtime-
Bindung und Weiterleitung von Genehmigungen an Chat-Kanäle (einschließlich nativer Zustellung).
Für die Kernrichtlinie und den Genehmigungsablauf siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

## Sichere Bins (nur stdin)

`tools.exec.safeBins` definiert eine kleine Liste von **nur-stdin**-Binärdateien (zum
Beispiel `cut`), die im Allowlist-Modus **ohne** explizite Allowlist-Einträge ausgeführt werden können. Sichere Bins lehnen positionale Dateiarugmente und pfadähnliche Tokens ab, sodass sie
nur auf dem eingehenden Stream arbeiten können. Behandeln Sie dies als einen engen Fast-Path für
Stream-Filter, nicht als allgemeine Vertrauensliste.

<Warning>
Fügen Sie **keine** Interpreter- oder Runtime-Binärdateien (zum Beispiel `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) zu `safeBins` hinzu. Wenn ein Befehl Code auswerten,
Unterbefehle ausführen oder designbedingt Dateien lesen kann, bevorzugen Sie explizite Allowlist-Einträge
und lassen Sie Genehmigungs-Prompts aktiviert. Benutzerdefinierte sichere Bins müssen ein explizites
Profil in `tools.exec.safeBinProfiles.<bin>` definieren.
</Warning>

Standardmäßig sichere Bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` und `sort` sind nicht in der Standardliste. Wenn Sie sich bewusst dafür entscheiden, behalten Sie explizite
Allowlist-Einträge für deren Nicht-stdin-Workflows bei. Für `grep` im Safe-Bin-Modus
geben Sie das Muster mit `-e`/`--regexp` an; die positionale Musterform wird abgelehnt,
damit Dateiparameter nicht als mehrdeutige Positionsargumente eingeschmuggelt werden können.

### Argv-Validierung und verweigerte Flags

Die Validierung ist nur anhand der Form von argv deterministisch (keine Prüfungen auf Existenz im Host-Dateisystem),
was Oracle-Verhalten über Dateiexistenz durch Unterschiede zwischen Zulassen/Verweigern verhindert. Datei-
orientierte Optionen werden für Standard-Safe-Bins verweigert; Long-Options werden fail-closed validiert (unbekannte Flags und mehrdeutige Abkürzungen werden
abgelehnt).

Verweigerte Flags nach Safe-Bin-Profil:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Sichere Bins erzwingen außerdem, dass argv-Tokens zur Ausführungszeit als **wörtlicher Text** behandelt werden
(kein Globbing und keine Erweiterung von `$VARS`) für nur-stdin-Segmente, sodass Muster
wie `*` oder `$HOME/...` nicht genutzt werden können, um Dateizugriffe einzuschmuggeln.

### Vertrauenswürdige Verzeichnisse für Binärdateien

Sichere Bins müssen aus vertrauenswürdigen Binärverzeichnissen aufgelöst werden (Systemstandards plus
optionales `tools.exec.safeBinTrustedDirs`). `PATH`-Einträge werden niemals automatisch als vertrauenswürdig eingestuft.
Die standardmäßigen vertrauenswürdigen Verzeichnisse sind absichtlich minimal: `/bin`, `/usr/bin`. Wenn
sich Ihre Safe-Bin-Datei in Paketmanager-/Benutzerpfaden befindet (zum Beispiel
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), fügen Sie diese
explizit zu `tools.exec.safeBinTrustedDirs` hinzu.

### Shell-Verkettung, Wrapper und Multiplexer

Shell-Verkettung (`&&`, `||`, `;`) ist erlaubt, wenn jedes Segment auf oberster Ebene
die Allowlist erfüllt (einschließlich Safe-Bins oder automatischer Skill-Zulassung). Umleitungen bleiben im Allowlist-Modus nicht unterstützt. Command-Substitution (`$()` / Backticks) wird
während des Allowlist-Parsings abgelehnt, auch innerhalb doppelter Anführungszeichen; verwenden
Sie einfache Anführungszeichen, wenn Sie wörtlichen `$()`-Text benötigen.

Bei Genehmigungen über die macOS-Companion-App wird roher Shell-Text, der Shell-Steuer- oder
Expansion-Syntax enthält (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), als
Allowlist-Miss behandelt, sofern die Shell-Binärdatei selbst nicht allowlisted ist.

Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden überschreibende env-Werte mit Anfrage-Scope auf
eine kleine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Bei Entscheidungen `allow-always` im Allowlist-Modus persistieren bekannte Dispatch-Wrapper (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) den Pfad der inneren ausführbaren Datei statt des Wrapper-Pfads. Shell-Multiplexer (`busybox`, `toybox`) werden für
Shell-Applets (`sh`, `ash` usw.) auf dieselbe Weise entpackt. Wenn ein Wrapper oder Multiplexer
nicht sicher entpackt werden kann, wird kein Allowlist-Eintrag automatisch persistiert.

Wenn Sie Interpreter wie `python3` oder `node` allowlisten, bevorzugen Sie
`tools.exec.strictInlineEval=true`, damit Inline-Eval weiterhin eine explizite
Genehmigung erfordert. Im Strict-Modus kann `allow-always` weiterhin harmlose
Interpreter-/Skriptaufrufe persistieren, aber Inline-Eval-Träger werden nicht automatisch persistiert.

### Sichere Bins versus Allowlist

| Thema            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Ziel             | Schmale stdin-Filter automatisch zulassen                        | Bestimmten ausführbaren Dateien explizit vertrauen                        |
| Match-Typ       | Name der ausführbaren Datei + Safe-Bin-argv-Richtlinie                 | Glob-Muster des aufgelösten Pfads der ausführbaren Datei                        |
| Argument-Scope   | Durch Safe-Bin-Profil und Regeln für Literal-Tokens eingeschränkt | Nur Pfad-Match; Argumente liegen sonst in Ihrer Verantwortung |
| Typische Beispiele | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, benutzerdefinierte CLIs               |
| Beste Verwendung         | Texttransformationen mit geringem Risiko in Pipelines                  | Jedes Tool mit breiterem Verhalten oder Nebenwirkungen               |

Ort der Konfiguration:

- `safeBins` stammt aus der Konfiguration (`tools.exec.safeBins` oder pro Agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` stammt aus der Konfiguration (`tools.exec.safeBinTrustedDirs` oder pro Agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` stammt aus der Konfiguration (`tools.exec.safeBinProfiles` oder pro Agent `agents.list[].tools.exec.safeBinProfiles`). Profilschlüssel pro Agent überschreiben globale Schlüssel.
- Allowlist-Einträge liegen hostlokal in `~/.openclaw/exec-approvals.json` unter `agents.<id>.allowlist` (oder über Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` warnt mit `tools.exec.safe_bins_interpreter_unprofiled`, wenn Interpreter-/Runtime-Bins in `safeBins` ohne explizite Profile erscheinen.
- `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles.<bin>`-Einträge als `{}` scaffolden (anschließend prüfen und einschränken). Interpreter-/Runtime-Bins werden nicht automatisch scaffoldded.

Beispiel für ein benutzerdefiniertes Profil:
__OC_I18N_900000__
Wenn Sie sich bewusst dafür entscheiden, `jq` zu `safeBins` hinzuzufügen, lehnt OpenClaw das `env`-Builtin im Safe-Bin-
Modus weiterhin ab, sodass `jq -n env` nicht die Prozessumgebung des Hosts ohne expliziten Allowlist-Pfad
oder Genehmigungs-Prompt ausgeben kann.

## Interpreter-/Runtime-Befehle

Interpreter-/Runtime-Läufe mit Genehmigungsunterstützung sind absichtlich konservativ:

- Der exakte Kontext von argv/cwd/env wird immer gebunden.
- Direkte Shell-Skript- und direkte Runtime-Dateiformen werden bestmöglich an genau einen konkreten lokalen
  Dateisnapshot gebunden.
- Häufige Wrapper-Formen von Paketmanagern, die weiterhin auf genau eine direkte lokale Datei aufgelöst werden (zum Beispiel
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`), werden vor dem Binding entpackt.
- Wenn OpenClaw für einen Interpreter-/Runtime-Befehl nicht genau eine konkrete lokale Datei identifizieren kann
  (zum Beispiel bei Paketskripten, Eval-Formen, Runtime-spezifischen Loader-Ketten oder mehrdeutigen Formen mit mehreren Dateien),
  wird die ausführung mit Genehmigungsunterstützung verweigert, statt semantische Abdeckung zu behaupten, die sie nicht hat.
- Für diese Workflows bevorzugen Sie Sandboxing, eine separate Host-Grenze oder einen explizit vertrauenswürdigen
  Allowlist-/Full-Workflow, bei dem der Operator die breitere Runtime-Semantik akzeptiert.

Wenn Genehmigungen erforderlich sind, gibt das Exec-Tool sofort mit einer Genehmigungs-ID zurück. Verwenden Sie diese ID, um
spätere Systemereignisse zu korrelieren (`Exec finished` / `Exec denied`). Wenn vor dem Timeout
keine Entscheidung eintrifft, wird die Anfrage als Genehmigungs-Timeout behandelt und als Ablehnungsgrund angezeigt.

### Verhalten bei Follow-up-Zustellung

Nachdem ein genehmigter asynchroner Exec beendet wurde, sendet OpenClaw einen Follow-up-`agent`-Turn an dieselbe Sitzung.

- Wenn ein gültiges externes Zustellziel existiert (zustellbarer Kanal plus Ziel `to`), verwendet die Follow-up-Zustellung diesen Kanal.
- In reinen Webchat- oder internen Sitzungs-Flows ohne externes Ziel bleibt die Follow-up-Zustellung nur sitzungsintern (`deliver: false`).
- Wenn ein Aufrufer explizit strikte externe Zustellung anfordert, aber kein externer Kanal aufgelöst werden kann, schlägt die Anfrage mit `INVALID_REQUEST` fehl.
- Wenn `bestEffortDeliver` aktiviert ist und kein externer Kanal aufgelöst werden kann, wird die Zustellung statt eines Fehlers auf rein sitzungsintern herabgestuft.

## Weiterleitung von Genehmigungen an Chat-Kanäle

Sie können Exec-Genehmigungs-Prompts an jeden Chat-Kanal weiterleiten (einschließlich Plugin-Kanälen) und
sie mit `/approve` genehmigen. Dies verwendet die normale Pipeline für ausgehende Zustellung.

Konfiguration:
__OC_I18N_900001__
Antwort im Chat:
__OC_I18N_900002__
Der Befehl `/approve` verarbeitet sowohl Exec-Genehmigungen als auch Plugin-Genehmigungen. Wenn die ID nicht zu einer ausstehenden Exec-Genehmigung passt, prüft er automatisch stattdessen Plugin-Genehmigungen.

### Weiterleitung von Plugin-Genehmigungen

Die Weiterleitung von Plugin-Genehmigungen verwendet dieselbe Zustellungspipeline wie Exec-Genehmigungen, hat aber ihre eigene
unabhängige Konfiguration unter `approvals.plugin`. Das Aktivieren oder Deaktivieren des einen beeinflusst das andere nicht.
__OC_I18N_900003__
Die Konfigurationsform ist identisch mit `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` und `targets` funktionieren auf dieselbe Weise.

Kanäle, die gemeinsame interaktive Antworten unterstützen, rendern dieselben Genehmigungsbuttons sowohl für Exec- als auch
für Plugin-Genehmigungen. Kanäle ohne gemeinsame interaktive UI fallen auf Klartext mit
Anweisungen zu `/approve` zurück.

### Genehmigungen im selben Chat auf jedem Kanal

Wenn eine Anfrage für eine Exec- oder Plugin-Genehmigung von einer zustellbaren Chat-Oberfläche ausgeht, kann derselbe Chat
sie jetzt standardmäßig mit `/approve` genehmigen. Dies gilt für Kanäle wie Slack, Matrix und
Microsoft Teams zusätzlich zu den bestehenden Flows in Web UI und Terminal UI.

Dieser gemeinsame Pfad mit Textbefehlen verwendet das normale Channel-Auth-Modell für diese Konversation. Wenn der
ursprüngliche Chat bereits Befehle senden und Antworten empfangen kann, brauchen Genehmigungsanfragen keinen
separaten nativen Zustelladapter mehr, nur um ausstehend zu bleiben.

Discord und Telegram unterstützen ebenfalls `/approve` im selben Chat, aber diese Kanäle verwenden weiterhin ihre
aufgelöste Approver-Liste für die Autorisierung, selbst wenn native Genehmigungszustellung deaktiviert ist.

Für Telegram und andere native Genehmigungs-Clients, die das Gateway direkt aufrufen,
ist dieser Fallback absichtlich auf Fehler vom Typ „Genehmigung nicht gefunden“ begrenzt. Ein echter
Exec-Genehmigungsfehler/-Ablehnung versucht nicht stillschweigend erneut als Plugin-Genehmigung.

### Native Zustellung von Genehmigungen

Einige Kanäle können auch als native Genehmigungs-Clients fungieren. Native Clients fügen Approver-DMs, Origin-Chat-
Fanout und kanalspezifische interaktive Approval-UX über den gemeinsamen `/approve`-
Flow im selben Chat hinzu.

Wenn native Approval-Karten/-Buttons verfügbar sind, ist diese native UI der primäre
agentenseitige Pfad. Der Agent sollte dann nicht zusätzlich einen doppelten Klartext-
Befehl `/approve` ausgeben, es sei denn, das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder
manuelle Genehmigung der einzig verbleibende Pfad ist.

Generisches Modell:

- Die Host-Exec-Richtlinie entscheidet weiterhin, ob eine Exec-Genehmigung erforderlich ist
- `approvals.exec` steuert die Weiterleitung von Genehmigungs-Prompts an andere Chat-Ziele
- `channels.<channel>.execApprovals` steuert, ob dieser Kanal als nativer Genehmigungs-Client fungiert

Native Genehmigungs-Clients aktivieren automatisch DM-first-Zustellung, wenn all dies zutrifft:

- der Kanal unterstützt native Genehmigungszustellung
- Approver können aus expliziten `execApprovals.approvers` oder den
  dokumentierten Fallback-Quellen dieses Kanals aufgelöst werden
- `channels.<channel>.execApprovals.enabled` ist nicht gesetzt oder `"auto"`

Setzen Sie `enabled: false`, um einen nativen Genehmigungs-Client explizit zu deaktivieren. Setzen Sie `enabled: true`, um
ihn zu erzwingen, wenn Approver aufgelöst werden. Öffentliche Zustellung an den Origin-Chat bleibt explizit über
`channels.<channel>.execApprovals.target`.

FAQ: [Warum gibt es zwei Exec-Genehmigungskonfigurationen für Chat-Genehmigungen?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Diese nativen Genehmigungs-Clients fügen DM-Routing und optionales Kanal-Fanout über den gemeinsamen
Flow für `/approve` im selben Chat und gemeinsame Genehmigungsbuttons hinzu.

Gemeinsames Verhalten:

- Slack, Matrix, Microsoft Teams und ähnliche zustellbare Chats verwenden das normale Channel-Auth-Modell
  für `/approve` im selben Chat
- wenn ein nativer Genehmigungs-Client automatisch aktiviert wird, ist das Standardziel für die native Zustellung die DM der Approver
- für Discord und Telegram können nur aufgelöste Approver genehmigen oder ablehnen
- Discord-Approver können explizit (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet sein
- Telegram-Approver können explizit (`execApprovals.approvers`) oder aus bestehender Owner-Konfiguration abgeleitet sein (`allowFrom`, plus Direct-Message-`defaultTo`, wo unterstützt)
- Slack-Approver können explizit (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet sein
- Native Slack-Buttons behalten die Art der Genehmigungs-ID bei, sodass IDs vom Typ `plugin:` Plugin-Genehmigungen auflösen können
  ohne eine zweite Slack-lokale Fallback-Ebene
- Native Matrix-DM-/Kanal-Zustellung und Reaktions-Shortcuts verarbeiten sowohl Exec- als auch Plugin-Genehmigungen;
  die Plugin-Autorisierung kommt weiterhin aus `channels.matrix.dm.allowFrom`
- der Anfragende muss kein Approver sein
- der auslösende Chat kann direkt mit `/approve` genehmigen, wenn dieser Chat bereits Befehle und Antworten unterstützt
- native Discord-Genehmigungsbuttons routen nach Art der Genehmigungs-ID: IDs vom Typ `plugin:` gehen
  direkt an Plugin-Genehmigungen, alles andere geht an Exec-Genehmigungen
- native Telegram-Genehmigungsbuttons folgen demselben begrenzten Exec-zu-Plugin-Fallback wie `/approve`
- wenn natives `target` die Zustellung an den Origin-Chat aktiviert, enthalten Genehmigungs-Prompts den Befehlstext
- ausstehende Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab
- wenn keine Operator-UI oder kein konfigurierter Genehmigungs-Client die Anfrage annehmen kann, fällt der Prompt auf `askFallback` zurück

Telegram verwendet standardmäßig Approver-DMs (`target: "dm"`). Sie können zu `channel` oder `both` wechseln, wenn Sie
möchten, dass Genehmigungs-Prompts auch im auslösenden Telegram-Chat/-Topic erscheinen. Für Telegram-Forum-
Topics bewahrt OpenClaw das Topic für den Genehmigungs-Prompt und das Follow-up nach der Genehmigung.

Siehe:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS-IPC-Flow
__OC_I18N_900004__
Sicherheitshinweise:

- Unix-Socket-Modus `0600`, Token gespeichert in `exec-approvals.json`.
- Same-UID-Peer-Prüfung.
- Challenge/Response (Nonce + HMAC-Token + Request-Hash) + kurze TTL.

## Verwandt

- [Exec-Genehmigungen](/de/tools/exec-approvals) — Kernrichtlinie und Genehmigungsablauf
- [Exec-Tool](/de/tools/exec)
- [Elevated-Modus](/de/tools/elevated)
- [Skills](/de/tools/skills) — Skill-gestütztes Auto-Allow-Verhalten
