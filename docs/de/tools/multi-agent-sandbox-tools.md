---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: „Sandboxing + Tool-Einschränkungen pro Agent, Priorität und Beispiele“
title: Sandbox & Tools für Multi-Agenten
x-i18n:
    generated_at: "2026-04-24T07:04:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7239e28825759efb060b821f87f5ebd9a7f3b720b30ff16dc076b186e47fcde9
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Konfiguration von Sandbox & Tools für Multi-Agenten

Jeder Agent in einem Multi-Agent-Setup kann die globale Sandbox- und Tool-
Richtlinie überschreiben. Diese Seite behandelt Konfiguration pro Agent, Prioritätsregeln und
Beispiele.

- **Sandbox-Backends und -Modi**: siehe [Sandboxing](/de/gateway/sandboxing).
- **Debugging blockierter Tools**: siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) und `openclaw sandbox explain`.
- **Erhöhtes `exec`**: siehe [Elevated Mode](/de/tools/elevated).

Auth ist pro Agent: Jeder Agent liest aus seinem eigenen `agentDir`-Auth-Store unter
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Zugangsdaten werden **nicht** zwischen Agenten geteilt. Verwenden Sie niemals dasselbe `agentDir` für mehrere Agenten.
Wenn Sie Zugangsdaten teilen möchten, kopieren Sie `auth-profiles.json` in das `agentDir` des anderen Agenten.

---

## Konfigurationsbeispiele

### Beispiel 1: Persönlicher + eingeschränkter Familien-Agent

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Persönlicher Assistent",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Familien-Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**Ergebnis:**

- Agent `main`: läuft auf dem Host, voller Tool-Zugriff
- Agent `family`: läuft in Docker (ein Container pro Agent), nur Tool `read`

---

### Beispiel 2: Arbeits-Agent mit gemeinsamer Sandbox

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### Beispiel 2b: Globales Coding-Profil + Agent nur für Messaging

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**Ergebnis:**

- Standard-Agenten erhalten Coding-Tools
- Agent `support` ist nur für Messaging (+ Slack-Tool)

---

### Beispiel 3: Unterschiedliche Sandbox-Modi pro Agent

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // globaler Standard
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Überschreibung: main niemals sandboxed
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Überschreibung: public immer sandboxed
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## Priorität der Konfiguration

Wenn sowohl globale (`agents.defaults.*`) als auch agentspezifische (`agents.list[].*`) Konfigurationen existieren:

### Sandbox-Konfiguration

Agentspezifische Einstellungen überschreiben globale:

```text
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Hinweise:**

- `agents.list[].sandbox.{docker,browser,prune}.*` überschreibt `agents.defaults.sandbox.{docker,browser,prune}.*` für diesen Agenten (ignoriert, wenn sich der Sandbox-Scope zu `"shared"` auflöst).

### Tool-Einschränkungen

Die Filterreihenfolge ist:

1. **Tool-Profil** (`tools.profile` oder `agents.list[].tools.profile`)
2. **Provider-Tool-Profil** (`tools.byProvider[provider].profile` oder `agents.list[].tools.byProvider[provider].profile`)
3. **Globale Tool-Richtlinie** (`tools.allow` / `tools.deny`)
4. **Provider-Tool-Richtlinie** (`tools.byProvider[provider].allow/deny`)
5. **Agentspezifische Tool-Richtlinie** (`agents.list[].tools.allow/deny`)
6. **Provider-Richtlinie des Agenten** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Sandbox-Tool-Richtlinie** (`tools.sandbox.tools` oder `agents.list[].tools.sandbox.tools`)
8. **Subagent-Tool-Richtlinie** (`tools.subagents.tools`, falls zutreffend)

Jede Ebene kann Tools weiter einschränken, aber keine auf früheren Ebenen verweigerten Tools wieder erlauben.
Wenn `agents.list[].tools.sandbox.tools` gesetzt ist, ersetzt es `tools.sandbox.tools` für diesen Agenten.
Wenn `agents.list[].tools.profile` gesetzt ist, überschreibt es `tools.profile` für diesen Agenten.
Schlüssel für Provider-Tools akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).

Tool-Richtlinien unterstützen Kurzformen `group:*`, die zu mehreren Tools expandieren. Siehe [Tool groups](/de/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) für die vollständige Liste.

Erhöhte Überschreibungen pro Agent (`agents.list[].tools.elevated`) können erhöhtes `exec` für bestimmte Agenten weiter einschränken. Siehe [Elevated Mode](/de/tools/elevated) für Details.

---

## Migration von Single Agent

**Vorher (Single Agent):**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**Nachher (Multi-Agent mit unterschiedlichen Profilen):**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

Legacy-Konfigurationen `agent.*` werden von `openclaw doctor` migriert; bevorzugen Sie künftig `agents.defaults` + `agents.list`.

---

## Beispiele für Tool-Einschränkungen

### Nur-Lese-Agent

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agent für sichere Ausführung (keine Dateimodifikationen)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Agent nur für Kommunikation

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

`sessions_history` in diesem Profil gibt weiterhin eine begrenzte, bereinigte Recall-
Ansicht zurück und keinen rohen Transkript-Dump. Assistant-Recall entfernt Thinking-Tags,
`<relevant-memories>`-Gerüste, XML-Payloads von Tool-Calls im Klartext
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und abgeschnittene Tool-Call-Blöcke),
heruntergestufte Tool-Call-Gerüste, geleakte ASCII-/Vollbreiten-Model-Control-
Tokens und fehlerhaftes MiniMax-Tool-Call-XML vor Redaction/Trunkierung.

---

## Häufiger Stolperstein: `non-main`

`agents.defaults.sandbox.mode: "non-main"` basiert auf `session.mainKey` (Standard `"main"`),
nicht auf der Agent-ID. Gruppen-/Channel-Sitzungen erhalten immer eigene Schlüssel und
werden daher als non-main behandelt und sandboxed. Wenn ein Agent niemals
sandboxed sein soll, setzen Sie `agents.list[].sandbox.mode: "off"`.

---

## Tests

Nach der Konfiguration von Multi-Agent-Sandbox und Tools:

1. **Agent-Auflösung prüfen:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Sandbox-Container verifizieren:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Tool-Einschränkungen testen:**
   - Eine Nachricht senden, die eingeschränkte Tools erfordert
   - Verifizieren, dass der Agent verweigerte Tools nicht verwenden kann

4. **Logs überwachen:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Fehlerbehebung

### Agent wird trotz `mode: "all"` nicht sandboxed

- Prüfen Sie, ob ein globales `agents.defaults.sandbox.mode` existiert, das dies überschreibt
- Agentspezifische Konfiguration hat Priorität, setzen Sie also `agents.list[].sandbox.mode: "all"`

### Tools sind trotz Deny-Liste weiterhin verfügbar

- Prüfen Sie die Filterreihenfolge der Tools: global → Agent → Sandbox → Subagent
- Jede Ebene kann nur weiter einschränken, nicht wieder erlauben
- Mit Logs verifizieren: `[tools] filtering tools for agent:${agentId}`

### Container ist nicht pro Agent isoliert

- Setzen Sie `scope: "agent"` in der agentspezifischen Sandbox-Konfiguration
- Standard ist `"session"`, wodurch ein Container pro Sitzung erzeugt wird

---

## Verwandt

- [Sandboxing](/de/gateway/sandboxing) -- vollständige Referenz zur Sandbox (Modi, Scopes, Backends, Images)
- [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) -- Debugging von „warum ist das blockiert?“
- [Elevated Mode](/de/tools/elevated)
- [Multi-Agent Routing](/de/concepts/multi-agent)
- [Sandbox Configuration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Session Management](/de/concepts/session)
