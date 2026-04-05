---
read_when:
    - Exec-Freigaben oder Allowlists konfigurieren
    - UX für Exec-Freigaben in der macOS-App implementieren
    - Prompts zum Verlassen der Sandbox und deren Auswirkungen prüfen
summary: Exec-Freigaben, Allowlists und Prompts zum Verlassen der Sandbox
title: Exec-Freigaben
x-i18n:
    generated_at: "2026-04-05T12:58:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1efa3b78efe3ca6246acfb37830b103ede40cc5298dcc7da8e9fbc5f6cc88ef
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Exec-Freigaben

Exec-Freigaben sind die **Schutzvorrichtung der Begleit-App / des Node-Hosts**, damit ein in einer Sandbox laufender Agent
Befehle auf einem echten Host (`gateway` oder `node`) ausführen kann. Stellen Sie sich das wie eine Sicherheitsverriegelung vor:
Befehle sind nur erlaubt, wenn Richtlinie + Allowlist + (optionale) Benutzerfreigabe alle zustimmen.
Exec-Freigaben gelten **zusätzlich** zur Tool-Richtlinie und Elevated-Gating (es sei denn, Elevated ist auf `full` gesetzt, was Freigaben überspringt).
Die wirksame Richtlinie ist die **strengere** von `tools.exec.*` und den Standardwerten der Freigaben; wenn ein Feld bei den Freigaben fehlt, wird der Wert aus `tools.exec` verwendet.
Host-Exec verwendet auch den lokalen Freigabestatus auf dieser Maschine. Ein host-lokales
`ask: "always"` in `~/.openclaw/exec-approvals.json` sorgt weiterhin für Prompts, auch wenn
Sitzungs- oder Konfigurationsstandardwerte `ask: "on-miss"` anfordern.
Verwenden Sie `openclaw approvals get`, `openclaw approvals get --gateway` oder
`openclaw approvals get --node <id|name|ip>`, um die angeforderte Richtlinie,
die Quellen der Host-Richtlinie und das wirksame Ergebnis zu prüfen.

Wenn die UI der Begleit-App **nicht verfügbar** ist, wird jede Anfrage, die einen Prompt erfordert,
durch den **Ask-Fallback** aufgelöst (Standard: deny).

## Wo dies gilt

Exec-Freigaben werden lokal auf dem Ausführungshost erzwungen:

- **gateway host** → `openclaw`-Prozess auf der Gateway-Maschine
- **node host** → Node-Runner (macOS-Begleit-App oder headless Node-Host)

Hinweis zum Vertrauensmodell:

- Über das Gateway authentifizierte Aufrufer sind vertrauenswürdige Operatoren für dieses Gateway.
- Gekoppelte Nodes erweitern diese vertrauenswürdige Operator-Fähigkeit auf den Node-Host.
- Exec-Freigaben verringern das Risiko versehentlicher Ausführung, sind aber keine Authentifizierungsgrenze pro Benutzer.
- Freigegebene Ausführungen auf dem Node-Host binden den kanonischen Ausführungskontext: kanonisches cwd, exaktes argv, Env-
  Binding, wenn vorhanden, und gepinnter Pfad zur ausführbaren Datei, falls zutreffend.
- Für Shell-Skripte und direkte Interpreter-/Runtime-Dateiaufrufe versucht OpenClaw außerdem,
  genau einen konkreten lokalen Dateioperanden zu binden. Wenn sich diese gebundene Datei nach der Freigabe,
  aber vor der Ausführung ändert, wird der Lauf abgelehnt, statt veränderten Inhalt auszuführen.
- Diese Dateibindung ist absichtlich Best-Effort und kein vollständiges semantisches Modell für jeden
  Loader-Pfad von Interpretern/Runtimes. Wenn der Freigabemodus nicht genau eine konkrete lokale
  Datei zur Bindung identifizieren kann, verweigert er die Ausstellung einer freigabegestützten Ausführung,
  statt vollständige Abdeckung vorzutäuschen.

macOS-Aufteilung:

- **node host service** leitet `system.run` über lokales IPC an die **macOS-App** weiter.
- **macOS-App** erzwingt Freigaben + führt den Befehl im UI-Kontext aus.

## Einstellungen und Speicherung

Freigaben liegen in einer lokalen JSON-Datei auf dem Ausführungshost:

`~/.openclaw/exec-approvals.json`

Beispielschema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Modus ohne Freigabe „YOLO“

Wenn Sie möchten, dass Host-Exec ohne Freigabe-Prompts ausgeführt wird, müssen Sie **beide** Richtlinienebenen öffnen:

- angeforderte Exec-Richtlinie in der OpenClaw-Konfiguration (`tools.exec.*`)
- host-lokale Freigaberichtlinie in `~/.openclaw/exec-approvals.json`

Dies ist jetzt das Standardverhalten des Hosts, sofern Sie es nicht ausdrücklich verschärfen:

- `tools.exec.security`: `full` auf `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Wichtige Unterscheidung:

- `tools.exec.host=auto` wählt, wo Exec läuft: in der Sandbox, wenn verfügbar, andernfalls auf dem Gateway.
- YOLO wählt, wie Host-Exec freigegeben wird: `security=full` plus `ask=off`.
- `auto` macht Gateway-Routing nicht zu einer freien Überschreibung aus einer in der Sandbox laufenden Sitzung. Eine Anfrage pro Aufruf mit `host=node` ist aus `auto` erlaubt, und `host=gateway` ist aus `auto` nur erlaubt, wenn keine Sandbox-Runtime aktiv ist. Wenn Sie einen stabilen Standardwert ohne `auto` möchten, setzen Sie `tools.exec.host` oder verwenden Sie `/exec host=...` explizit.

Wenn Sie ein konservativeres Setup möchten, verschärfen Sie eine der Ebenen wieder auf `allowlist` / `on-miss`
oder `deny`.

Persistentes Setup „niemals prompten“ für den Gateway-Host:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Setzen Sie dann die Freigabedatei des Hosts passend dazu:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Für einen Node-Host wenden Sie stattdessen dieselbe Freigabedatei auf diesem Node an:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Nur-Sitzung-Abkürzung:

- `/exec security=full ask=off` ändert nur die aktuelle Sitzung.
- `/elevated full` ist eine Break-Glass-Abkürzung, die für diese Sitzung auch Exec-Freigaben überspringt.

Wenn die Freigabedatei des Hosts strenger bleibt als die Konfiguration, gewinnt weiterhin die strengere Host-Richtlinie.

## Richtlinienregler

### Security (`exec.security`)

- **deny**: blockiert alle Host-Exec-Anfragen.
- **allowlist**: erlaubt nur Befehle aus der Allowlist.
- **full**: erlaubt alles (entspricht Elevated).

### Ask (`exec.ask`)

- **off**: niemals prompten.
- **on-miss**: nur prompten, wenn die Allowlist nicht passt.
- **always**: bei jedem Befehl prompten.
- Dauerhaftes Vertrauen per `allow-always` unterdrückt Prompts nicht, wenn der wirksame Ask-Modus `always` ist

### Ask-Fallback (`askFallback`)

Wenn ein Prompt erforderlich ist, aber keine UI erreichbar ist, entscheidet der Fallback:

- **deny**: blockieren.
- **allowlist**: nur erlauben, wenn die Allowlist passt.
- **full**: erlauben.

### Härtung für Inline-Interpreter-Eval (`tools.exec.strictInlineEval`)

Wenn `tools.exec.strictInlineEval=true`, behandelt OpenClaw Formen mit Inline-Code-Auswertung als nur mit Freigabe erlaubt, selbst wenn das Interpreter-Binary selbst auf der Allowlist steht.

Beispiele:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Dies ist Defense-in-Depth für Interpreter-Loader, die sich nicht sauber auf genau einen stabilen Dateioperanden abbilden lassen. Im strikten Modus:

- benötigen diese Befehle weiterhin eine explizite Freigabe;
- persistiert `allow-always` nicht automatisch neue Allowlist-Einträge für sie.

## Allowlist (pro Agent)

Allowlists sind **pro Agent**. Wenn mehrere Agenten existieren, wechseln Sie in der macOS-App den Agenten,
den Sie bearbeiten. Muster sind **groß-/kleinschreibungsunabhängige Glob-Matches**.
Muster sollten sich zu **Pfaden von Binärdateien** auflösen (Einträge nur mit Basename werden ignoriert).
Legacy-Einträge `agents.default` werden beim Laden nach `agents.main` migriert.
Shell-Ketten wie `echo ok && pwd` erfordern weiterhin, dass jedes Segment auf oberster Ebene die Allowlist-Regeln erfüllt.

Beispiele:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Jeder Allowlist-Eintrag verfolgt:

- **id** stabile UUID für die Identität in der UI (optional)
- **last used** Zeitstempel
- **last used command**
- **last resolved path**

## Skills-CLIs automatisch erlauben

Wenn **Skills-CLIs automatisch erlauben** aktiviert ist, werden ausführbare Dateien, auf die bekannte Skills verweisen,
auf Nodes (macOS-Node oder headless Node-Host) so behandelt, als stünden sie auf der Allowlist. Dies verwendet
`skills.bins` über Gateway RPC, um die Liste der Skill-Binaries abzurufen. Deaktivieren Sie dies, wenn Sie strikte manuelle Allowlists möchten.

Wichtige Hinweise zum Vertrauen:

- Dies ist eine **implizite Komfort-Allowlist**, getrennt von manuellen Allowlist-Einträgen für Pfade.
- Sie ist für vertrauenswürdige Operator-Umgebungen gedacht, in denen Gateway und Node innerhalb derselben Vertrauensgrenze liegen.
- Wenn Sie striktes explizites Vertrauen benötigen, belassen Sie `autoAllowSkills: false` und verwenden Sie nur manuelle Allowlist-Einträge für Pfade.

## Safe Bins (nur stdin)

`tools.exec.safeBins` definiert eine kleine Liste **nur für stdin** geeigneter Binaries (zum Beispiel `cut`),
die im Allowlist-Modus **ohne** explizite Allowlist-Einträge ausgeführt werden dürfen. Safe Bins lehnen
positionale Dateiar gumente und pfadähnliche Tokens ab, sodass sie nur auf dem eingehenden Stream arbeiten können.
Behandeln Sie dies als schmalen Fast-Path für Stream-Filter, nicht als allgemeine Vertrauensliste.
Fügen Sie **keine** Interpreter- oder Runtime-Binaries (zum Beispiel `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) zu `safeBins` hinzu.
Wenn ein Befehl per Design Code auswerten, Unterbefehle ausführen oder Dateien lesen kann, sollten Sie explizite Allowlist-Einträge bevorzugen und Freigabe-Prompts aktiviert lassen.
Benutzerdefinierte Safe Bins müssen ein explizites Profil in `tools.exec.safeBinProfiles.<bin>` definieren.
Die Validierung ist nur anhand der argv-Form deterministisch (keine Prüfungen der Host-Dateisystemexistenz), was
Oracle-Verhalten über Dateiexistenz durch Unterschiede zwischen Erlauben/Ablehnen verhindert.
Dateiorientierte Optionen werden für Standard-Safe-Bins abgelehnt (zum Beispiel `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Safe Bins erzwingen außerdem eine explizite Richtlinie pro Binary für Flags, die das Nur-stdin-
Verhalten brechen (zum Beispiel `sort -o/--output/--compress-program` und rekursive Flags bei grep).
Lange Optionen werden im Safe-Bin-Modus fail-closed validiert: unbekannte Flags und mehrdeutige
Abkürzungen werden abgelehnt.
Abgelehnte Flags nach Safe-Bin-Profil:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe Bins erzwingen außerdem, dass argv-Tokens zur Ausführungszeit als **wörtlicher Text** behandelt werden (kein Globbing
und keine `$VARS`-Expansion) für Nur-stdin-Segmente, sodass Muster wie `*` oder `$HOME/...` nicht
zum Einschmuggeln von Dateilesen verwendet werden können.
Safe Bins müssen sich außerdem aus vertrauenswürdigen Binary-Verzeichnissen auflösen (Systemstandard plus optional
`tools.exec.safeBinTrustedDirs`). `PATH`-Einträge werden niemals automatisch als vertrauenswürdig behandelt.
Die Standardverzeichnisse für vertrauenswürdige Safe Bins sind absichtlich minimal: `/bin`, `/usr/bin`.
Wenn sich Ihr Safe-Bin-Binary in Paketmanager-/Benutzerpfaden befindet (zum Beispiel
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), fügen Sie diese explizit
zu `tools.exec.safeBinTrustedDirs` hinzu.
Shell-Verkettungen und Umleitungen werden im Allowlist-Modus nicht automatisch erlaubt.

Shell-Verkettung (`&&`, `||`, `;`) ist erlaubt, wenn jedes Segment auf oberster Ebene die Allowlist erfüllt
(einschließlich Safe Bins oder automatischer Skill-Erlaubnis). Umleitungen bleiben im Allowlist-Modus nicht unterstützt.
Command Substitution (`$()` / Backticks) wird beim Parsen der Allowlist abgelehnt, auch innerhalb
doppelter Anführungszeichen; verwenden Sie einfache Anführungszeichen, wenn Sie wörtlichen `$()`-Text benötigen.
Bei Freigaben der macOS-Begleit-App wird roher Shell-Text, der Shell-Steuer- oder Expansionssyntax enthält
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), als Fehlpassung zur Allowlist behandelt, sofern
nicht das Shell-Binary selbst auf der Allowlist steht.
Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden Env-Überschreibungen im Anfragebereich auf eine kleine explizite
Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Bei `allow-always`-Entscheidungen im Allowlist-Modus werden bei bekannten Dispatch-Wrappern
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) innere Pfade von ausführbaren Dateien statt Wrapper-Pfade persistiert. Shell-
Multiplexer (`busybox`, `toybox`) werden ebenfalls für Shell-Applets (`sh`, `ash`,
usw.) entpackt, sodass innere ausführbare Dateien statt Multiplexer-Binaries persistiert werden. Wenn ein Wrapper oder
Multiplexer nicht sicher entpackt werden kann, wird kein Allowlist-Eintrag automatisch persistiert.
Wenn Sie Interpreter wie `python3` oder `node` auf die Allowlist setzen, sollten Sie `tools.exec.strictInlineEval=true` bevorzugen, damit Inline-Eval weiterhin eine explizite Freigabe erfordert. Im strikten Modus kann `allow-always` weiterhin harmlose Interpreter-/Skriptaufrufe persistieren, aber Träger für Inline-Eval werden nicht automatisch persistiert.

Standard-Safe-Bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` und `sort` sind nicht in der Standardliste. Wenn Sie sich dafür entscheiden, behalten Sie explizite Allowlist-Einträge für
deren Workflows außerhalb von stdin bei.
Für `grep` im Safe-Bin-Modus geben Sie das Muster mit `-e`/`--regexp` an; die positionale Form eines Musters wird
abgelehnt, damit Dateio peranden nicht als mehrdeutige Positionsargumente eingeschmuggelt werden können.

### Safe Bins versus Allowlist

| Thema            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Ziel             | Schmale stdin-Filter automatisch erlauben              | Spezifischen ausführbaren Dateien explizit vertrauen         |
| Match-Typ        | Name der ausführbaren Datei + argv-Richtlinie für Safe Bins | Glob-Muster für aufgelösten Pfad der ausführbaren Datei |
| Argumentbereich  | Eingeschränkt durch Safe-Bin-Profil und Regeln für Literal-Tokens | Nur Pfadabgleich; für Argumente sind Sie ansonsten selbst verantwortlich |
| Typische Beispiele | `head`, `tail`, `tr`, `wc`                           | `jq`, `python3`, `node`, `ffmpeg`, benutzerdefinierte CLIs   |
| Beste Verwendung | Texttransformationen mit geringem Risiko in Pipelines  | Jedes Tool mit breiterem Verhalten oder Nebenwirkungen       |

Speicherort der Konfiguration:

- `safeBins` kommt aus der Konfiguration (`tools.exec.safeBins` oder pro Agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` kommt aus der Konfiguration (`tools.exec.safeBinTrustedDirs` oder pro Agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` kommt aus der Konfiguration (`tools.exec.safeBinProfiles` oder pro Agent `agents.list[].tools.exec.safeBinProfiles`). Pro-Agent-Profilschlüssel überschreiben globale Schlüssel.
- Allowlist-Einträge liegen host-lokal in `~/.openclaw/exec-approvals.json` unter `agents.<id>.allowlist` (oder über Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` warnt mit `tools.exec.safe_bins_interpreter_unprofiled`, wenn Interpreter-/Runtime-Bins in `safeBins` ohne explizite Profile erscheinen.
- `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles.<bin>`-Einträge als `{}` erzeugen (danach prüfen und verschärfen). Interpreter-/Runtime-Bins werden nicht automatisch erzeugt.

Beispiel für ein benutzerdefiniertes Profil:
__OC_I18N_900004__
Wenn Sie `jq` ausdrücklich in `safeBins` aufnehmen, lehnt OpenClaw das Builtin `env` im Safe-Bin-
Modus trotzdem ab, sodass `jq -n env` nicht die Host-Prozessumgebung ohne expliziten Allowlist-Pfad
oder Freigabe-Prompt ausgeben kann.

## Bearbeiten in der Control UI

Verwenden Sie die Karte **Control UI → Nodes → Exec approvals**, um Standardwerte, Überschreibungen pro Agent
und Allowlists zu bearbeiten. Wählen Sie einen Geltungsbereich (Defaults oder ein Agent), passen Sie die Richtlinie an,
fügen Sie Allowlist-Muster hinzu/entfernen Sie sie und klicken Sie dann auf **Save**. Die UI zeigt **last used**-Metadaten
pro Muster an, damit Sie die Liste sauber halten können.

Der Zielauswähler wählt **Gateway** (lokale Freigaben) oder einen **Node**. Nodes
müssen `system.execApprovals.get/set` bekanntgeben (macOS-App oder headless Node-Host).
Wenn ein Node noch keine Exec-Freigaben bekanntgibt, bearbeiten Sie seine lokale
`~/.openclaw/exec-approvals.json` direkt.

CLI: `openclaw approvals` unterstützt das Bearbeiten von Gateway oder Node (siehe [Approvals CLI](/cli/approvals)).

## Freigabeablauf

Wenn ein Prompt erforderlich ist, sendet das Gateway `exec.approval.requested` an Operator-Clients.
Die Control UI und die macOS-App lösen dies über `exec.approval.resolve` auf, dann leitet das Gateway die
freigegebene Anfrage an den Node-Host weiter.

Für `host=node` enthalten Freigabeanfragen eine kanonische Payload `systemRunPlan`. Das Gateway verwendet
diesen Plan als maßgeblichen Befehls-/cwd-/Sitzungskontext, wenn freigegebene `system.run`-
Anfragen weitergeleitet werden.

Das ist wichtig für asynchrone Freigabelatenz:

- der Exec-Pfad auf dem Node bereitet vorab einen kanonischen Plan vor
- der Freigabedatensatz speichert diesen Plan und seine Binding-Metadaten
- nach der Freigabe verwendet der endgültig weitergeleitete `system.run`-Aufruf erneut den gespeicherten Plan,
  statt späteren Änderungen des Aufrufers zu vertrauen
- wenn der Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` ändert, nachdem die Freigabeanfrage erstellt wurde, lehnt das Gateway die
  weitergeleitete Ausführung als Freigabe-Fehlpassung ab

## Interpreter-/Runtime-Befehle

Freigabegestützte Interpreter-/Runtime-Ausführungen sind absichtlich konservativ:

- Exakter argv-/cwd-/Env-Kontext ist immer gebunden.
- Direkte Shell-Skripte und direkte Runtime-Dateiformen werden bestmöglich an genau einen konkreten lokalen
  Dateisnapshot gebunden.
- Häufige Paketmanager-Wrapper-Formen, die sich trotzdem in genau eine direkte lokale Datei auflösen (zum Beispiel
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`), werden vor dem Binden entpackt.
- Wenn OpenClaw bei einem Interpreter-/Runtime-Befehl nicht genau eine konkrete lokale Datei identifizieren kann
  (zum Beispiel Paketskripte, Eval-Formen, runtime-spezifische Loader-Ketten oder mehrdeutige Formen mit mehreren Dateien),
  wird die freigabegestützte Ausführung abgelehnt, statt semantische Abdeckung zu behaupten, die nicht vorhanden ist.
- Für diese Workflows sollten Sie Sandboxing, eine separate Host-Grenze oder einen expliziten vertrauenswürdigen
  Allowlist-/Full-Workflow bevorzugen, bei dem der Operator die breitere Runtime-Semantik akzeptiert.

Wenn Freigaben erforderlich sind, gibt das Exec-Tool sofort mit einer Freigabe-ID zurück. Verwenden Sie diese ID, um
spätere Systemereignisse zuzuordnen (`Exec finished` / `Exec denied`). Wenn vor dem
Timeout keine Entscheidung eintrifft, wird die Anfrage als Freigabe-Timeout behandelt und als Ablehnungsgrund angezeigt.

### Verhalten bei der Zustellung von Follow-ups

Nachdem ein freigegebener asynchroner Exec beendet ist, sendet OpenClaw einen Follow-up-`agent`-Zug an dieselbe Sitzung.

- Wenn ein gültiges externes Zustellziel existiert (zustellbarer Kanal plus Ziel `to`), verwendet die Follow-up-Zustellung diesen Kanal.
- In Webchat-only- oder internen Sitzungsabläufen ohne externes Ziel bleibt die Follow-up-Zustellung nur sitzungsintern (`deliver: false`).
- Wenn ein Aufrufer ausdrücklich strikte externe Zustellung ohne auflösbaren externen Kanal anfordert, schlägt die Anfrage mit `INVALID_REQUEST` fehl.
- Wenn `bestEffortDeliver` aktiviert ist und kein externer Kanal aufgelöst werden kann, wird die Zustellung statt eines Fehlers auf nur sitzungsintern herabgestuft.

Der Bestätigungsdialog enthält:

- Befehl + Argumente
- cwd
- Agent-ID
- aufgelösten Pfad zur ausführbaren Datei
- Host- + Richtlinienmetadaten

Aktionen:

- **Allow once** → jetzt ausführen
- **Always allow** → zur Allowlist hinzufügen + ausführen
- **Deny** → blockieren

## Weiterleitung von Freigaben an Chat-Kanäle

Sie können Prompts für Exec-Freigaben an jeden Chat-Kanal weiterleiten (einschließlich Plugin-Kanälen) und sie
mit `/approve` freigeben. Dies verwendet die normale Pipeline für ausgehende Zustellung.

Konfiguration:
__OC_I18N_900005__
Antwort im Chat:
__OC_I18N_900006__
Der Befehl `/approve` verarbeitet sowohl Exec-Freigaben als auch Plugin-Freigaben. Wenn die ID nicht zu einer ausstehenden Exec-Freigabe passt, prüft er stattdessen automatisch Plugin-Freigaben.

### Weiterleitung von Plugin-Freigaben

Die Weiterleitung von Plugin-Freigaben verwendet dieselbe Zustellpipeline wie Exec-Freigaben, hat aber eine eigene
unabhängige Konfiguration unter `approvals.plugin`. Das Aktivieren oder Deaktivieren der einen beeinflusst die andere nicht.
__OC_I18N_900007__
Die Form der Konfiguration ist identisch mit `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` und `targets` funktionieren auf dieselbe Weise.

Kanäle, die gemeinsame interaktive Antworten unterstützen, rendern dieselben Freigabeschaltflächen für Exec- und
Plugin-Freigaben. Kanäle ohne gemeinsame interaktive UI fallen auf Klartext mit `/approve`-
Anweisungen zurück.

### Freigaben im selben Chat auf jedem Kanal

Wenn eine Exec- oder Plugin-Freigabeanfrage von einer zustellbaren Chat-Oberfläche stammt, kann derselbe Chat
sie jetzt standardmäßig mit `/approve` freigeben. Das gilt für Kanäle wie Slack, Matrix und
Microsoft Teams zusätzlich zu den bestehenden Abläufen in Web UI und Terminal UI.

Dieser gemeinsame Textbefehlsweg verwendet das normale Kanal-Auth-Modell für diese Unterhaltung. Wenn im
ursprünglichen Chat bereits Befehle gesendet und Antworten empfangen werden können, benötigen Freigabeanfragen
keinen separaten nativen Zustelladapter mehr, nur um ausstehend zu bleiben.

Discord und Telegram unterstützen ebenfalls `/approve` im selben Chat, aber diese Kanäle verwenden weiterhin ihre
aufgelöste Liste von Genehmigern für die Autorisierung, auch wenn native Freigabezustellung deaktiviert ist.

Für Telegram und andere native Freigabe-Clients, die das Gateway direkt aufrufen,
ist dieser Fallback absichtlich auf Fehler „approval not found“ begrenzt. Eine echte
Ablehnung/ein echter Fehler einer Exec-Freigabe wird nicht stillschweigend erneut als Plugin-Freigabe versucht.

### Native Freigabezustellung

Einige Kanäle können auch als native Freigabe-Clients fungieren. Native Clients ergänzen DM-Freigeber, Fanout in den Ursprungs-Chat
und kanalspezifische interaktive Freigabe-UX zusätzlich zum gemeinsamen `/approve`-
Ablauf im selben Chat.

Wenn native Freigabekarten/-schaltflächen verfügbar sind, ist diese native UI der primäre
agentenseitige Weg. Der Agent sollte nicht zusätzlich einen doppelten Klartext-
Befehl `/approve` im Chat ausgeben, es sei denn, das Tool-Ergebnis sagt, dass Chat-Freigaben nicht verfügbar sind oder
manuelle Freigabe der einzig verbleibende Weg ist.

Generisches Modell:

- die Richtlinie für Host-Exec entscheidet weiterhin, ob eine Exec-Freigabe erforderlich ist
- `approvals.exec` steuert die Weiterleitung von Freigabe-Prompts an andere Chat-Ziele
- `channels.<channel>.execApprovals` steuert, ob dieser Kanal als nativer Freigabe-Client fungiert

Native Freigabe-Clients aktivieren DM-first-Zustellung automatisch, wenn alle folgenden Bedingungen erfüllt sind:

- der Kanal unterstützt native Freigabezustellung
- Freigeber lassen sich aus expliziten `execApprovals.approvers` oder den
  dokumentierten Fallback-Quellen dieses Kanals auflösen
- `channels.<channel>.execApprovals.enabled` ist nicht gesetzt oder `"auto"`

Setzen Sie `enabled: false`, um einen nativen Freigabe-Client explizit zu deaktivieren. Setzen Sie `enabled: true`, um
ihn zu erzwingen, wenn sich Freigeber auflösen lassen. Öffentliche Zustellung in den Ursprungs-Chat bleibt explizit über
`channels.<channel>.execApprovals.target`.

FAQ: [Warum gibt es zwei Konfigurationen für Exec-Freigaben bei Chat-Freigaben?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Diese nativen Freigabe-Clients fügen DM-Routing und optionales Fanout in Kanäle zusätzlich zum gemeinsamen
Ablauf `/approve` im selben Chat und gemeinsamen Freigabeschaltflächen hinzu.

Gemeinsames Verhalten:

- Slack, Matrix, Microsoft Teams und ähnliche zustellbare Chats verwenden das normale Kanal-Auth-Modell
  für `/approve` im selben Chat
- wenn ein nativer Freigabe-Client automatisch aktiviert wird, ist das Standardziel für native Zustellung Freigeber-DMs
- für Discord und Telegram können nur aufgelöste Freigeber freigeben oder ablehnen
- Discord-Freigeber können explizit (`execApprovals.approvers`) sein oder aus `commands.ownerAllowFrom` abgeleitet werden
- Telegram-Freigeber können explizit (`execApprovals.approvers`) sein oder aus bestehender Owner-Konfiguration abgeleitet werden (`allowFrom`, plus direktnachrichtenbasiertes `defaultTo`, wo unterstützt)
- Slack-Freigeber können explizit (`execApprovals.approvers`) sein oder aus `commands.ownerAllowFrom` abgeleitet werden
- native Slack-Schaltflächen behalten die Art der Freigabe-ID bei, sodass `plugin:`-IDs Plugin-Freigaben auflösen können
  ohne eine zweite Slack-lokale Fallback-Ebene
- natives DM-/Kanal-Routing von Matrix gilt nur für Exec; Plugin-Freigaben in Matrix bleiben beim gemeinsamen
  `/approve` im selben Chat und optionalen Weiterleitungspfaden über `approvals.plugin`
- der Anfordernde muss kein Freigeber sein
- der Ursprungs-Chat kann direkt mit `/approve` freigeben, wenn dieser Chat bereits Befehle und Antworten unterstützt
- native Discord-Freigabeschaltflächen routen nach der Art der Freigabe-ID: `plugin:`-IDs gehen
  direkt zu Plugin-Freigaben, alles andere zu Exec-Freigaben
- native Telegram-Freigabeschaltflächen folgen demselben begrenzten Exec-zu-Plugin-Fallback wie `/approve`
- wenn natives `target` die Zustellung in den Ursprungs-Chat aktiviert, enthalten Freigabe-Prompts den Befehlstext
- ausstehende Exec-Freigaben laufen standardmäßig nach 30 Minuten ab
- wenn keine Operator-UI oder kein konfigurierter Freigabe-Client die Anfrage annehmen kann, fällt der Prompt auf `askFallback` zurück

Telegram verwendet standardmäßig Freigeber-DMs (`target: "dm"`). Sie können zu `channel` oder `both` wechseln, wenn Sie
möchten, dass Freigabe-Prompts zusätzlich im ursprünglichen Telegram-Chat/Topic erscheinen. Für Telegram-Foren-Topics
behält OpenClaw das Topic sowohl für den Freigabe-Prompt als auch für das Follow-up nach der Freigabe bei.

Siehe:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS-IPC-Ablauf
__OC_I18N_900008__
Sicherheitshinweise:

- Unix-Socket-Modus `0600`, Token gespeichert in `exec-approvals.json`.
- Peer-Prüfung mit derselben UID.
- Challenge/Response (Nonce + HMAC-Token + Request-Hash) + kurze TTL.

## Systemereignisse

Der Exec-Lebenszyklus wird als Systemnachrichten dargestellt:

- `Exec running` (nur wenn der Befehl den Schwellenwert für die Running-Meldung überschreitet)
- `Exec finished`
- `Exec denied`

Diese werden in die Sitzung des Agenten gepostet, nachdem der Node das Ereignis gemeldet hat.
Exec-Freigaben auf dem Gateway-Host erzeugen dieselben Lebenszyklusereignisse, wenn der Befehl endet (und optional auch, wenn er länger als der Schwellenwert läuft).
Freigabegesteuerte Execs verwenden die Freigabe-ID in diesen Nachrichten erneut als `runId`, damit sie einfach zugeordnet werden können.

## Verhalten bei abgelehnter Freigabe

Wenn eine asynchrone Exec-Freigabe abgelehnt wird, verhindert OpenClaw, dass der Agent
Ausgabe aus einem früheren Lauf desselben Befehls in der Sitzung wiederverwendet. Der Ablehnungsgrund
wird mit expliziter Anweisung übergeben, dass keine Befehlsausgabe verfügbar ist, wodurch
der Agent daran gehindert wird, zu behaupten, es gebe neue Ausgabe, oder den abgelehnten Befehl mit
veralteten Ergebnissen eines früheren erfolgreichen Laufs zu wiederholen.

## Auswirkungen

- **full** ist mächtig; bevorzugen Sie nach Möglichkeit Allowlists.
- **ask** hält Sie im Loop und erlaubt trotzdem schnelle Freigaben.
- Allowlists pro Agent verhindern, dass Freigaben eines Agenten auf andere übergehen.
- Freigaben gelten nur für Host-Exec-Anfragen von **autorisierten Sendern**. Nicht autorisierte Sender können kein `/exec` ausführen.
- `/exec security=full` ist eine Abkürzung auf Sitzungsebene für autorisierte Operatoren und überspringt Freigaben absichtlich.
  Um Host-Exec hart zu blockieren, setzen Sie die Security der Freigaben auf `deny` oder verweigern Sie das Tool `exec` über die Tool-Richtlinie.

Verwandt:

- [Exec-Tool](/tools/exec)
- [Elevated-Modus](/tools/elevated)
- [Skills](/tools/skills)

## Verwandte Themen

- [Exec](/tools/exec) — Tool zur Ausführung von Shell-Befehlen
- [Sandboxing](/de/gateway/sandboxing) — Sandbox-Modi und Workspace-Zugriff
- [Sicherheit](/de/gateway/security) — Sicherheitsmodell und Härtung
- [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) — wann was verwendet werden sollte
