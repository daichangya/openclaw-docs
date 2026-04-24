---
read_when:
    - Exec-Genehmigungen oder Allowlists konfigurieren.
    - Die UX für Exec-Genehmigungen in der macOS-App implementieren.
    - Prompts zum Verlassen der Sandbox und ihre Auswirkungen prüfen.
summary: Exec-Genehmigungen, Allowlists und Prompts für das Verlassen der Sandbox
title: Exec-Genehmigungen
x-i18n:
    generated_at: "2026-04-24T07:03:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7c5cd24e7c1831d5a865da6fa20f4c23280a0ec12b9e8f7f3245170a05a37d
    source_path: tools/exec-approvals.md
    workflow: 15
---

Exec-Genehmigungen sind die **Schutzschicht der Companion-App / des Node-Hosts**, damit ein
sandboxed Agent Befehle auf einem echten Host (`gateway` oder `node`) ausführen kann. Eine Sicherheitsverriegelung:
Befehle sind nur erlaubt, wenn Richtlinie + Allowlist + (optionale) Benutzer-
Genehmigung alle zustimmen. Exec-Genehmigungen werden **zusätzlich** zur Tool-Richtlinie und zum Elevated-
Gating angewendet (es sei denn, Elevated ist auf `full` gesetzt, was Genehmigungen überspringt).

<Note>
Die effektive Richtlinie ist die **strengere** aus `tools.exec.*` und den Standards für Genehmigungen;
wenn ein Feld für Genehmigungen fehlt, wird der Wert aus `tools.exec` verwendet. Host-Exec
verwendet auch den lokalen Status der Genehmigungen auf diesem Rechner — ein hostlokales `ask: "always"`
in `~/.openclaw/exec-approvals.json` sorgt weiterhin für Prompts, selbst wenn Sitzungs- oder Konfigurationsstandards `ask: "on-miss"` anfordern.
</Note>

## Die effektive Richtlinie prüfen

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — zeigen angeforderte Richtlinie, Quellen der Host-Richtlinie und das effektive Ergebnis.
- `openclaw exec-policy show` — lokale zusammengeführte Sicht des Rechners.
- `openclaw exec-policy set|preset` — die lokal angeforderte Richtlinie in einem Schritt mit der lokalen Host-Genehmigungsdatei synchronisieren.

Wenn ein lokaler Scope `host=node` anfordert, meldet `exec-policy show` diesen Scope
zur Laufzeit als node-verwaltet, statt so zu tun, als wäre die lokale Genehmigungsdatei die Quelle der Wahrheit.

Wenn die Companion-App-UI **nicht verfügbar** ist, wird jede Anfrage, die normalerweise
einen Prompt erzeugen würde, durch den **Ask-Fallback** aufgelöst (Standard: deny).

<Tip>
Native Chat-Genehmigungs-Clients können kanalspezifische Hilfen an die ausstehende
Genehmigungsnachricht anhängen. Matrix setzt zum Beispiel Reaktionskürzel
(`✅` einmal erlauben, `❌` ablehnen, `♾️` immer erlauben), während weiterhin `/approve ...`-
Befehle als Fallback in der Nachricht bleiben.
</Tip>

## Wo das gilt

Exec-Genehmigungen werden lokal auf dem Ausführungshost erzwungen:

- **gateway host** → `openclaw`-Prozess auf dem Gateway-Rechner
- **node host** → Node-Runner (macOS-Companion-App oder Headless-Node-Host)

Hinweis zum Vertrauensmodell:

- Gateway-authentifizierte Aufrufer sind vertrauenswürdige Operatoren für dieses Gateway.
- Gekoppelte Nodes erweitern diese vertrauenswürdige Operator-Fähigkeit auf den Node-Host.
- Exec-Genehmigungen reduzieren das Risiko versehentlicher Ausführung, sind aber keine Auth-Grenze pro Benutzer.
- Genehmigte Läufe auf dem Node-Host binden den kanonischen Ausführungskontext: kanonisches cwd, exaktes argv, Env-
  Bindung, wenn vorhanden, und festgelegter Pfad zur ausführbaren Datei, wenn zutreffend.
- Für Shell-Skripte und direkte Interpreter-/Runtime-Dateiaufrufe versucht OpenClaw außerdem, genau einen konkreten lokalen Dateio peranden zu binden. Wenn sich diese gebundene Datei nach der Genehmigung, aber vor der Ausführung ändert, wird der Lauf abgelehnt, statt abgewichenen Inhalt auszuführen.
- Diese Dateibindung ist absichtlich Best-Effort und kein vollständiges semantisches Modell jedes
  Interpreter-/Runtime-Loader-Pfads. Wenn der Genehmigungsmodus nicht genau eine konkrete lokale
  Datei identifizieren kann, die gebunden werden soll, verweigert er einen genehmigungsbasierten Lauf, statt vollständige Abdeckung vorzutäuschen.

macOS-Aufteilung:

- **node host service** leitet `system.run` über lokale IPC an die **macOS-App** weiter.
- **macOS app** erzwingt Genehmigungen + führt den Befehl im UI-Kontext aus.

## Einstellungen und Speicherung

Genehmigungen liegen in einer lokalen JSON-Datei auf dem Ausführungshost:

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

## „YOLO“-Modus ohne Genehmigungen

Wenn Sie möchten, dass Host-Exec ohne Genehmigungs-Prompts ausgeführt wird, müssen Sie **beide** Richtlinienebenen öffnen:

- angeforderte Exec-Richtlinie in der OpenClaw-Konfiguration (`tools.exec.*`)
- hostlokale Richtlinie für Genehmigungen in `~/.openclaw/exec-approvals.json`

Dies ist jetzt das Standardverhalten des Hosts, sofern Sie es nicht explizit verschärfen:

- `tools.exec.security`: `full` auf `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Wichtige Unterscheidung:

- `tools.exec.host=auto` wählt aus, wo Exec läuft: in der Sandbox, wenn verfügbar, sonst auf dem Gateway.
- YOLO wählt aus, wie Host-Exec genehmigt wird: `security=full` plus `ask=off`.
- CLI-gestützte Provider, die ihren eigenen nicht interaktiven Berechtigungsmodus bereitstellen, können dieser Richtlinie folgen.
  Claude CLI fügt `--permission-mode bypassPermissions` hinzu, wenn die von OpenClaw angeforderte Exec-Richtlinie
  YOLO ist. Überschreiben Sie dieses Backend-Verhalten mit expliziten Claude-Argumenten unter
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`, zum Beispiel
  `--permission-mode default`, `acceptEdits` oder `bypassPermissions`.
- Im YOLO-Modus fügt OpenClaw keine separate heuristische Genehmigungsschranke für verschleierte Befehle oder Skript-Vorprüfungen über die konfigurierte Host-Exec-Richtlinie hinaus hinzu.
- `auto` macht Gateway-Routing nicht zu einer freien Überschreibung aus einer sandboxed Sitzung heraus. Eine Anforderung pro Aufruf mit `host=node` ist aus `auto` heraus erlaubt, und `host=gateway` ist aus `auto` nur dann erlaubt, wenn keine Sandbox-Runtime aktiv ist. Wenn Sie einen stabilen Standard ohne `auto` möchten, setzen Sie `tools.exec.host` oder verwenden Sie `/exec host=...` explizit.

Wenn Sie ein konservativeres Setup möchten, verschärfen Sie eine der beiden Ebenen wieder auf `allowlist` / `on-miss`
oder `deny`.

Persistentes Setup „nie nachfragen“ auf dem Gateway-Host:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Setzen Sie dann die Genehmigungsdatei des Hosts passend dazu:

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

Lokale Kurzform für dieselbe Richtlinie auf dem Gateway-Host auf dem aktuellen Rechner:

```bash
openclaw exec-policy preset yolo
```

Diese lokale Kurzform aktualisiert beides:

- lokale `tools.exec.host/security/ask`
- lokale Standardwerte in `~/.openclaw/exec-approvals.json`

Sie ist absichtlich nur lokal. Wenn Sie Genehmigungen auf Gateway-Hosts oder Node-Hosts
remote ändern müssen, verwenden Sie weiterhin `openclaw approvals set --gateway` oder
`openclaw approvals set --node <id|name|ip>`.

Für einen Node-Host wenden Sie stattdessen dieselbe Genehmigungsdatei auf diesem Node an:

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

Wichtige Einschränkung nur lokal:

- `openclaw exec-policy` synchronisiert keine Node-Genehmigungen
- `openclaw exec-policy set --host node` wird abgelehnt
- Exec-Genehmigungen für Nodes werden zur Laufzeit vom Node abgerufen, daher müssen nodebezogene Updates `openclaw approvals --node ...` verwenden

Kurzform nur für die Sitzung:

- `/exec security=full ask=off` ändert nur die aktuelle Sitzung.
- `/elevated full` ist eine Break-Glass-Kurzform, die außerdem Exec-Genehmigungen für diese Sitzung überspringt.

Wenn die Genehmigungsdatei des Hosts strenger bleibt als die Konfiguration, gewinnt weiterhin die strengere Host-Richtlinie.

## Richtlinien-Schalter

### Security (`exec.security`)

- **deny**: alle Host-Exec-Anfragen blockieren.
- **allowlist**: nur Befehle aus der Allowlist erlauben.
- **full**: alles erlauben (entspricht elevated).

### Ask (`exec.ask`)

- **off**: niemals nachfragen.
- **on-miss**: nur nachfragen, wenn die Allowlist nicht passt.
- **always**: bei jedem Befehl nachfragen.
- Dauerhaftes Vertrauen über `allow-always` unterdrückt Prompts nicht, wenn der effektive Ask-Modus `always` ist

### Ask-Fallback (`askFallback`)

Wenn ein Prompt erforderlich ist, aber keine UI erreichbar ist, entscheidet der Fallback:

- **deny**: blockieren.
- **allowlist**: nur erlauben, wenn die Allowlist passt.
- **full**: erlauben.

### Härtung für Inline-Interpreter-Eval (`tools.exec.strictInlineEval`)

Wenn `tools.exec.strictInlineEval=true`, behandelt OpenClaw Formen mit Inline-Code-Eval als nur per Genehmigung erlaubt, selbst wenn die Interpreter-Binärdatei selbst auf der Allowlist steht.

Beispiele:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Dies ist Defense-in-Depth für Interpreter-Loader, die sich nicht sauber auf einen stabilen Dateioperanden abbilden lassen. Im strikten Modus:

- benötigen diese Befehle weiterhin explizite Genehmigung;
- persistiert `allow-always` für sie nicht automatisch neue Allowlist-Einträge.

## Allowlist (pro Agent)

Allowlists gelten **pro Agent**. Wenn mehrere Agenten existieren, wechseln Sie in der macOS-App,
welchen Agenten Sie bearbeiten. Muster sind **globale Matches ohne Beachtung der Groß-/Kleinschreibung**.
Muster sollten auf **Pfade zu Binärdateien** aufgelöst werden (Einträge nur mit Basename werden ignoriert).
Ältere Einträge in `agents.default` werden beim Laden nach `agents.main` migriert.
Shell-Ketten wie `echo ok && pwd` erfordern weiterhin, dass jedes Segment auf oberster Ebene die Allowlist-Regeln erfüllt.

Beispiele:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Jeder Allowlist-Eintrag verfolgt:

- **id** stabile UUID, die für die UI-Identität verwendet wird (optional)
- **last used** Zeitstempel
- **last used command**
- **last resolved path**

## Skill-CLIs automatisch erlauben

Wenn **Auto-allow skill CLIs** aktiviert ist, werden ausführbare Dateien, auf die von bekannten Skills verwiesen wird,
auf Nodes (macOS-Node oder Headless-Node-Host) als auf der Allowlist behandelt. Dafür wird
über Gateway-RPC `skills.bins` verwendet, um die Bin-Liste des Skills abzurufen. Deaktivieren Sie dies, wenn Sie strikte manuelle Allowlists möchten.

Wichtige Hinweise zum Vertrauen:

- Dies ist eine **implizite Convenience-Allowlist**, getrennt von manuellen Pfad-Allowlist-Einträgen.
- Sie ist für vertrauenswürdige Operator-Umgebungen gedacht, in denen Gateway und Node dieselbe Vertrauensgrenze haben.
- Wenn Sie striktes explizites Vertrauen benötigen, lassen Sie `autoAllowSkills: false` und verwenden Sie nur manuelle Pfad-Allowlist-Einträge.

## Sichere Binaries und Weiterleitung von Genehmigungen

Für sichere Binaries (der schnelle Pfad nur mit stdin), Details zur Interpreter-Bindung und wie
Genehmigungs-Prompts an Slack/Discord/Telegram weitergeleitet werden (oder als native
Genehmigungs-Clients laufen), siehe [Exec approvals — advanced](/de/tools/exec-approvals-advanced).

<!-- moved to /tools/exec-approvals-advanced -->

## Bearbeitung in der Control UI

Verwenden Sie die Karte **Control UI → Nodes → Exec approvals**, um Standardwerte, Überschreibungen pro Agent
und Allowlists zu bearbeiten. Wählen Sie einen Scope (Defaults oder einen Agenten), passen Sie die Richtlinie an,
fügen Sie Allowlist-Muster hinzu/entfernen Sie sie und klicken Sie dann auf **Save**. Die UI zeigt **last used**-Metadaten
pro Muster, damit Sie die Liste sauber halten können.

Die Zielauswahl verwendet **Gateway** (lokale Genehmigungen) oder einen **Node**. Nodes
müssen `system.execApprovals.get/set` bereitstellen (macOS-App oder Headless-Node-Host).
Wenn ein Node noch keine Exec-Genehmigungen bereitstellt, bearbeiten Sie dessen lokale
`~/.openclaw/exec-approvals.json` direkt.

CLI: `openclaw approvals` unterstützt Bearbeitung für Gateway oder Node (siehe [Approvals CLI](/de/cli/approvals)).

## Genehmigungsablauf

Wenn ein Prompt erforderlich ist, sendet das Gateway `exec.approval.requested` an Operator-Clients.
Die Control UI und die macOS-App lösen dies über `exec.approval.resolve` auf, dann leitet das Gateway die
genehmigte Anfrage an den Node-Host weiter.

Für `host=node` enthalten Genehmigungsanfragen eine kanonische Nutzlast `systemRunPlan`. Das Gateway verwendet
diesen Plan als maßgeblichen Befehls-/cwd-/Sitzungskontext, wenn genehmigte `system.run`-
Anfragen weitergeleitet werden.

Das ist wichtig für Latenz bei asynchronen Genehmigungen:

- der Node-Exec-Pfad bereitet vorab genau einen kanonischen Plan vor
- der Genehmigungsdatensatz speichert diesen Plan und seine Bindungsmetadaten
- nach der Genehmigung verwendet der endgültig weitergeleitete Aufruf `system.run` den gespeicherten Plan erneut,
  statt späteren Änderungen des Aufrufers zu vertrauen
- wenn der Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` ändert, nachdem die Genehmigungsanfrage erstellt wurde, lehnt das Gateway den
  weitergeleiteten Lauf als Genehmigungs-Mismatch ab

## System-Events

Der Lebenszyklus von Exec wird als Systemnachrichten angezeigt:

- `Exec running` (nur wenn der Befehl die Schwelle für Hinweise auf laufende Ausführung überschreitet)
- `Exec finished`
- `Exec denied`

Diese werden an die Sitzung des Agenten gepostet, nachdem der Node das Event gemeldet hat.
Exec-Genehmigungen auf dem Gateway-Host erzeugen dieselben Lifecycle-Events, wenn der Befehl beendet ist (und optional, wenn er länger als die Schwelle läuft).
Execs mit Genehmigungs-Gating verwenden die Genehmigungs-ID in diesen Nachrichten erneut als `runId`, damit sie leicht korreliert werden können.

## Verhalten bei abgelehnter Genehmigung

Wenn eine asynchrone Exec-Genehmigung abgelehnt wird, verhindert OpenClaw, dass der Agent
Ausgaben eines früheren Laufs desselben Befehls in der Sitzung wiederverwendet. Der Ablehnungsgrund
wird mit expliziter Anweisung übergeben, dass keine Befehlsausgabe verfügbar ist, wodurch verhindert wird,
dass der Agent behauptet, es gäbe neue Ausgaben, oder den abgelehnten Befehl mit veralteten Ergebnissen aus einem früheren erfolgreichen Lauf wiederholt.

## Auswirkungen

- **full** ist mächtig; bevorzugen Sie nach Möglichkeit Allowlists.
- **ask** hält Sie im Loop und erlaubt dennoch schnelle Genehmigungen.
- Allowlists pro Agent verhindern, dass Genehmigungen eines Agenten in andere durchsickern.
- Genehmigungen gelten nur für Host-Exec-Anfragen von **autorisierten Absendern**. Nicht autorisierte Absender können `/exec` nicht ausführen.
- `/exec security=full` ist eine Komfortfunktion auf Sitzungsebene für autorisierte Operatoren und überspringt Genehmigungen absichtlich. Um Host-Exec hart zu blockieren, setzen Sie die Security für Genehmigungen auf `deny` oder verbieten Sie das Tool `exec` über die Tool-Richtlinie.

## Verwandt

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/de/tools/exec-approvals-advanced" icon="gear">
    Sichere Binaries, Interpreter-Bindung und Weiterleitung von Genehmigungen an Chats.
  </Card>
  <Card title="Exec-Tool" href="/de/tools/exec" icon="terminal">
    Tool zur Ausführung von Shell-Befehlen.
  </Card>
  <Card title="Elevated mode" href="/de/tools/elevated" icon="shield-exclamation">
    Break-Glass-Pfad, der Genehmigungen ebenfalls überspringt.
  </Card>
  <Card title="Sandboxing" href="/de/gateway/sandboxing" icon="box">
    Sandbox-Modi und Workspace-Zugriff.
  </Card>
  <Card title="Sicherheit" href="/de/gateway/security" icon="lock">
    Sicherheitsmodell und Härtung.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/de/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Wann welche Steuerung eingesetzt werden sollte.
  </Card>
  <Card title="Skills" href="/de/tools/skills" icon="sparkles">
    Automatisches Erlauben über Skills.
  </Card>
</CardGroup>
