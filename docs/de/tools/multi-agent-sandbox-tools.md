---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: „Sandboxing und Tool-Einschränkungen pro Agent, Priorität und Beispiele“
title: Sandboxing und Tools für mehrere Agenten
x-i18n:
    generated_at: "2026-04-05T12:58:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07985f7c8fae860a7b9bf685904903a4a8f90249e95e4179cf0775a1208c0597
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Konfiguration für Sandboxing und Tools bei mehreren Agenten

Jeder Agent in einem Multi-Agent-Setup kann die globale Sandbox- und Tool-
Richtlinie überschreiben. Diese Seite behandelt die Konfiguration pro Agent, Prioritätsregeln und
Beispiele.

- **Sandbox-Backends und -Modi**: siehe [Sandboxing](/de/gateway/sandboxing).
- **Debugging blockierter Tools**: siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) und `openclaw sandbox explain`.
- **Erhöhtes Exec**: siehe [Elevated Mode](/tools/elevated).

Die Authentifizierung ist pro Agent: Jeder Agent liest aus seinem eigenen `agentDir`-Auth-Speicher unter
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Anmeldedaten werden **nicht** zwischen Agenten geteilt. Verwenden Sie `agentDir` niemals für mehrere Agenten gemeinsam.
Wenn Sie Anmeldedaten teilen möchten, kopieren Sie `auth-profiles.json` in das `agentDir` des anderen Agenten.

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
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
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

- Agent `main`: Läuft auf dem Host, voller Tool-Zugriff
- Agent `family`: Läuft in Docker (ein Container pro Agent), nur Tool `read`

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
- Agent `support` ist nur für Messaging gedacht (+ Slack-Tool)

---

### Beispiel 3: Unterschiedliche Sandbox-Modi pro Agent

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Globaler Standard
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Überschreibung: main nie in einer Sandbox
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Überschreibung: public immer in einer Sandbox
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

## Konfigurationspriorität

Wenn sowohl globale (`agents.defaults.*`) als auch agentenspezifische (`agents.list[].*`) Konfigurationen vorhanden sind:

### Sandbox-Konfiguration

Agentenspezifische Einstellungen überschreiben globale:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Hinweise:**

- `agents.list[].sandbox.{docker,browser,prune}.*` überschreibt `agents.defaults.sandbox.{docker,browser,prune}.*` für diesen Agenten (wird ignoriert, wenn der Sandbox-Bereich zu `"shared"` aufgelöst wird).

### Tool-Einschränkungen

Die Filterreihenfolge ist:

1. **Tool-Profil** (`tools.profile` oder `agents.list[].tools.profile`)
2. **Tool-Profil des Providers** (`tools.byProvider[provider].profile` oder `agents.list[].tools.byProvider[provider].profile`)
3. **Globale Tool-Richtlinie** (`tools.allow` / `tools.deny`)
4. **Tool-Richtlinie des Providers** (`tools.byProvider[provider].allow/deny`)
5. **Agentenspezifische Tool-Richtlinie** (`agents.list[].tools.allow/deny`)
6. **Provider-Richtlinie des Agenten** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Sandbox-Tool-Richtlinie** (`tools.sandbox.tools` oder `agents.list[].tools.sandbox.tools`)
8. **Subagent-Tool-Richtlinie** (`tools.subagents.tools`, falls zutreffend)

Jede Ebene kann Tools weiter einschränken, aber kann zuvor verweigerte Tools nicht wieder freigeben.
Wenn `agents.list[].tools.sandbox.tools` gesetzt ist, ersetzt es `tools.sandbox.tools` für diesen Agenten.
Wenn `agents.list[].tools.profile` gesetzt ist, überschreibt es `tools.profile` für diesen Agenten.
Tool-Schlüssel für Provider akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).

Tool-Richtlinien unterstützen Kurzformen `group:*`, die in mehrere Tools expandiert werden. Die vollständige Liste finden Sie unter [Tool groups](/de/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Überschreibungen für erhöhten Modus pro Agent (`agents.list[].tools.elevated`) können erhöhtes Exec für bestimmte Agenten weiter einschränken. Details finden Sie unter [Elevated Mode](/tools/elevated).

---

## Migration von einem einzelnen Agenten

**Vorher (einzelner Agent):**

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

**Nachher (mehrere Agenten mit unterschiedlichen Profilen):**

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

Alte Konfigurationen `agent.*` werden von `openclaw doctor` migriert; bevorzugen Sie künftig `agents.defaults` + `agents.list`.

---

## Beispiele für Tool-Einschränkungen

### Agent nur mit Leserechten

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agent für sichere Ausführung (keine Dateiänderungen)

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

`sessions_history` in diesem Profil gibt weiterhin eine begrenzte, bereinigte
Recall-Ansicht statt eines rohen Transkript-Dumps zurück. Der Assistant-Recall entfernt Thinking-Tags,
Scaffolding `<relevant-memories>`, XML-Nutzlasten von Tool-Aufrufen im Klartext
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke),
herabgestuftes Tool-Call-Scaffolding, durchgesickerte ASCII-/Vollbreiten-Steuertokens des Modells
sowie fehlerhaftes MiniMax-Tool-Call-XML vor Redaction/Trunkierung.

---

## Häufiger Stolperstein: "non-main"

`agents.defaults.sandbox.mode: "non-main"` basiert auf `session.mainKey` (Standard `"main"`),
nicht auf der Agenten-ID. Gruppen-/Kanal-Sitzungen erhalten immer eigene Schlüssel und
werden daher als non-main behandelt und in eine Sandbox gesetzt. Wenn Sie möchten, dass ein Agent niemals in einer
Sandbox läuft, setzen Sie `agents.list[].sandbox.mode: "off"`.

---

## Tests

Nach der Konfiguration von Sandboxing und Tools für mehrere Agenten:

1. **Agent-Auflösung prüfen:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Sandbox-Container verifizieren:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Tool-Einschränkungen testen:**
   - Senden Sie eine Nachricht, die eingeschränkte Tools erfordert
   - Verifizieren Sie, dass der Agent verweigerte Tools nicht verwenden kann

4. **Logs überwachen:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Fehlerbehebung

### Agent ist trotz `mode: "all"` nicht in einer Sandbox

- Prüfen Sie, ob es ein globales `agents.defaults.sandbox.mode` gibt, das dies überschreibt
- Agentenspezifische Konfiguration hat Vorrang, setzen Sie also `agents.list[].sandbox.mode: "all"`

### Tools sind trotz Deny-Liste weiterhin verfügbar

- Prüfen Sie die Filterreihenfolge für Tools: global → Agent → Sandbox → Subagent
- Jede Ebene kann nur weiter einschränken, aber nichts wieder freigeben
- Mit Logs verifizieren: `[tools] filtering tools for agent:${agentId}`

### Container ist nicht pro Agent isoliert

- Setzen Sie `scope: "agent"` in der agentenspezifischen Sandbox-Konfiguration
- Der Standard ist `"session"`, wodurch ein Container pro Sitzung erstellt wird

---

## Siehe auch

- [Sandboxing](/de/gateway/sandboxing) -- vollständige Sandbox-Referenz (Modi, Bereiche, Backends, Images)
- [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) -- Debugging von „warum ist das blockiert?“
- [Elevated Mode](/tools/elevated)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Sandbox-Konfiguration](/de/gateway/configuration-reference#agentsdefaultssandbox)
- [Sitzungsverwaltung](/de/concepts/session)
