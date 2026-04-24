---
read_when:
    - Das acpx-Harness für Claude Code / Codex / Gemini CLI installieren oder konfigurieren
    - Die MCP-Bridge für plugin-tools oder OpenClaw-tools aktivieren
    - ACP-Berechtigungsmodi konfigurieren
summary: 'ACP-Agenten einrichten: acpx-Harness-Konfiguration, Plugin-Setup, Berechtigungen'
title: ACP-Agents — Einrichtung
x-i18n:
    generated_at: "2026-04-24T07:01:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f1b34217b0709c85173ca13d952e996676b73b7ac7b9db91a5069e19ff76013
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Für Überblick, Operator-Runbook und Konzepte siehe [ACP agents](/de/tools/acp-agents).
Diese Seite behandelt die Konfiguration des acpx-Harness, das Plugin-Setup für die MCP-Bridges und die
Konfiguration von Berechtigungen.

## Unterstützung des acpx-Harness (aktuell)

Aktuelle integrierte Harness-Aliasse von acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Wenn OpenClaw das Backend acpx verwendet, bevorzugen Sie diese Werte für `agentId`, sofern Ihre acpx-Konfiguration keine benutzerdefinierten Agenten-Aliasse definiert.
Wenn Ihre lokale Cursor-Installation ACP weiterhin als `agent acp` bereitstellt, überschreiben Sie den `cursor`-Agentenbefehl in Ihrer acpx-Konfiguration, statt den integrierten Standard zu ändern.

Direkte Nutzung der acpx-CLI kann über `--agent <command>` auch beliebige Adapter ansteuern, aber dieser rohe Escape-Hatch ist ein Feature der acpx-CLI (nicht der normale OpenClaw-Pfad über `agentId`).

## Erforderliche Konfiguration

ACP-Basis auf Core-Ebene:

```json5
{
  acp: {
    enabled: true,
    // Optional. Standard ist true; auf false setzen, um den ACP-Dispatch zu pausieren und /acp-Steuerungen beizubehalten.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Die Konfiguration für Thread-Bindings ist adapter-spezifisch nach Kanal. Beispiel für Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Wenn das Erzeugen threadgebundener ACP-Sitzungen nicht funktioniert, prüfen Sie zuerst das Feature-Flag des Adapters:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Bindings an die aktuelle Konversation erfordern keine Erstellung von Child-Threads. Sie erfordern einen aktiven Konversationskontext und einen Kanal-Adapter, der ACP-Konversations-Bindings bereitstellt.

Siehe [Configuration Reference](/de/gateway/configuration-reference).

## Plugin-Setup für das acpx-Backend

Frische Installationen liefern das gebündelte Laufzeit-Plugin `acpx` standardmäßig aktiviert aus, sodass ACP
normalerweise ohne manuellen Installationsschritt für Plugins funktioniert.

Beginnen Sie mit:

```text
/acp doctor
```

Wenn Sie `acpx` deaktiviert, über `plugins.allow` / `plugins.deny` blockiert oder
zu einem lokalen Entwicklungs-Checkout wechseln möchten, verwenden Sie den expliziten Plugin-Pfad:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokale Workspace-Installation während der Entwicklung:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Prüfen Sie dann den Zustand des Backends:

```text
/acp doctor
```

### Konfiguration von acpx-Befehl und Version

Standardmäßig verwendet das gebündelte Plugin `acpx` seine im Plugin lokal gepinnte Binärdatei (`node_modules/.bin/acpx` innerhalb des Plugin-Pakets). Beim Start registriert es das Backend als nicht bereit, und ein Hintergrundjob prüft `acpx --version`; wenn die Binärdatei fehlt oder nicht passt, führt es `npm install --omit=dev --no-save acpx@<pinned>` aus und prüft erneut. Das Gateway bleibt dabei durchgehend nicht blockierend.

Überschreiben Sie Befehl oder Version in der Plugin-Konfiguration:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` akzeptiert einen absoluten Pfad, einen relativen Pfad (aufgelöst vom OpenClaw-Workspace aus) oder einen Befehlsnamen.
- `expectedVersion: "any"` deaktiviert striktes Versions-Matching.
- Benutzerdefinierte `command`-Pfade deaktivieren die plugin-lokale Auto-Installation.

Siehe [Plugins](/de/tools/plugin).

### Automatische Installation von Abhängigkeiten

Wenn Sie OpenClaw global mit `npm install -g openclaw` installieren, werden die acpx-
Laufzeitabhängigkeiten (plattformspezifische Binärdateien) automatisch
über einen Postinstall-Hook installiert. Wenn die automatische Installation fehlschlägt, startet das Gateway trotzdem
normal und meldet die fehlende Abhängigkeit über `openclaw acp doctor`.

### MCP-Bridge für Plugin-Tools

Standardmäßig stellen ACPX-Sitzungen registrierte Plugin-Tools von OpenClaw dem
ACP-Harness **nicht** bereit.

Wenn ACP-Agenten wie Codex oder Claude Code installierte
OpenClaw-Plugin-Tools wie Memory-Recall/Store aufrufen sollen, aktivieren Sie die dedizierte Bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Was dies bewirkt:

- Injiziert einen integrierten MCP-Server namens `openclaw-plugin-tools` in den ACPX-Sitzungs-
  Bootstrap.
- Stellt Plugin-Tools bereit, die bereits von installierten und aktivierten OpenClaw-
  Plugins registriert wurden.
- Hält dieses Feature explizit und standardmäßig deaktiviert.

Hinweise zu Sicherheit und Vertrauen:

- Dies erweitert die Tool-Oberfläche des ACP-Harness.
- ACP-Agenten erhalten nur Zugriff auf Plugin-Tools, die bereits im Gateway aktiv sind.
- Behandeln Sie dies als dieselbe Vertrauensgrenze, wie wenn diese Plugins in
  OpenClaw selbst ausgeführt werden dürfen.
- Prüfen Sie installierte Plugins, bevor Sie dies aktivieren.

Benutzerdefinierte `mcpServers` funktionieren weiterhin wie bisher. Die integrierte Bridge für Plugin-Tools ist eine
zusätzliche explizite Komfortfunktion, kein Ersatz für generische MCP-Server-Konfiguration.

### MCP-Bridge für OpenClaw-Tools

Standardmäßig stellen ACPX-Sitzungen eingebaute OpenClaw-Tools ebenfalls **nicht** über
MCP bereit. Aktivieren Sie die separate Bridge für Core-Tools, wenn ein ACP-Agent ausgewählte
eingebaute Tools wie `cron` benötigt:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Was dies bewirkt:

- Injiziert einen integrierten MCP-Server namens `openclaw-tools` in den ACPX-Sitzungs-
  Bootstrap.
- Stellt ausgewählte eingebaute OpenClaw-Tools bereit. Der anfängliche Server stellt `cron` bereit.
- Hält die Bereitstellung von Core-Tools explizit und standardmäßig deaktiviert.

### Konfiguration des Laufzeit-Timeouts

Das gebündelte Plugin `acpx` setzt für eingebettete Laufzeit-Turns standardmäßig ein
Timeout von 120 Sekunden. Das gibt langsameren Harnesses wie Gemini CLI genug Zeit, um ACP-
Start und Initialisierung abzuschließen. Überschreiben Sie diesen Wert, wenn Ihr Host ein anderes
Laufzeitlimit benötigt:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Starten Sie das Gateway neu, nachdem Sie diesen Wert geändert haben.

### Konfiguration des Health-Probe-Agenten

Das gebündelte Plugin `acpx` prüft einen Harness-Agenten, während es entscheidet, ob das
eingebettete Laufzeit-Backend bereit ist. Standardmäßig ist dies `codex`. Wenn Ihre Bereitstellung einen anderen
Standard-ACP-Agenten verwendet, setzen Sie den Probe-Agenten auf dieselbe ID:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Starten Sie das Gateway neu, nachdem Sie diesen Wert geändert haben.

## Berechtigungskonfiguration

ACP-Sitzungen laufen nicht interaktiv — es gibt kein TTY, um Prompts für Genehmigen oder Ablehnen von Berechtigungen für Dateischreibvorgänge und Shell-Exec zu beantworten. Das Plugin acpx stellt zwei Konfigurationsschlüssel bereit, die steuern, wie mit Berechtigungen umgegangen wird:

Diese ACPX-Harness-Berechtigungen sind getrennt von OpenClaw-Exec-Genehmigungen und getrennt von Anbieter-Bypass-Flags für CLI-Backends wie Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` ist der Harness-seitige Break-Glass-Schalter für ACP-Sitzungen.

### `permissionMode`

Steuert, welche Operationen der Harness-Agent ohne Prompt ausführen kann.

| Wert            | Verhalten                                                  |
| --------------- | ---------------------------------------------------------- |
| `approve-all`   | Alle Dateischreibvorgänge und Shell-Befehle automatisch genehmigen. |
| `approve-reads` | Nur Lesezugriffe automatisch genehmigen; Schreibvorgänge und Exec erfordern Prompts. |
| `deny-all`      | Alle Berechtigungs-Prompts ablehnen.                       |

### `nonInteractivePermissions`

Steuert, was passiert, wenn ein Berechtigungs-Prompt angezeigt würde, aber kein interaktives TTY verfügbar ist (was bei ACP-Sitzungen immer der Fall ist).

| Wert   | Verhalten                                                       |
| ------ | --------------------------------------------------------------- |
| `fail` | Sitzung mit `AcpRuntimeError` abbrechen. **(Standard)**         |
| `deny` | Die Berechtigung stillschweigend verweigern und fortfahren (graceful degradation). |

### Konfiguration

Per Plugin-Konfiguration setzen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Starten Sie das Gateway neu, nachdem Sie diese Werte geändert haben.

> **Wichtig:** OpenClaw verwendet derzeit standardmäßig `permissionMode=approve-reads` und `nonInteractivePermissions=fail`. In nicht interaktiven ACP-Sitzungen kann jeder Schreibvorgang oder Exec, der einen Berechtigungs-Prompt auslöst, mit `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` fehlschlagen.
>
> Wenn Sie Berechtigungen einschränken müssen, setzen Sie `nonInteractivePermissions` auf `deny`, damit Sitzungen graceful degradiert werden, statt abzustürzen.

## Verwandt

- [ACP agents](/de/tools/acp-agents) — Überblick, Operator-Runbook, Konzepte
- [Sub-agents](/de/tools/subagents)
- [Multi-agent routing](/de/concepts/multi-agent)
