---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Warum ein Tool blockiert wird: Sandbox-Runtime, Tool-Allow-/Deny-Richtlinie und erhöhte `exec`-Gates'
title: Sandbox vs. Tool-Richtlinie vs. erhöhtes `exec`
x-i18n:
    generated_at: "2026-04-24T06:39:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 74bb73023a3f7a85a0c020b2e8df69610ab8f8e60f8ab6142f8da7810dc08429
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

OpenClaw hat drei verwandte (aber unterschiedliche) Steuerungen:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) entscheidet, **wo Tools ausgeführt werden** (Sandbox-Backend vs. Host).
2. **Tool-Richtlinie** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) entscheidet, **welche Tools verfügbar/erlaubt sind**.
3. **Erhöht** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) ist eine **nur für `exec` gedachte Escape-Hatch**, um außerhalb der Sandbox auszuführen, wenn Sie sandboxed sind (`gateway` standardmäßig oder `node`, wenn das `exec`-Ziel auf `node` konfiguriert ist).

## Schnelles Debugging

Verwenden Sie den Inspector, um zu sehen, was OpenClaw _tatsächlich_ macht:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Er zeigt:

- effektiven Sandbox-Modus/-Scope/-Workspace-Zugriff
- ob die Sitzung aktuell sandboxed ist (main vs. non-main)
- effektive Sandbox-Tool-Allow-/Deny-Richtlinie (und ob sie von Agent/global/Standard stammt)
- Gates für erhöhten Zugriff und Fix-it-Schlüsselpfade

## Sandbox: wo Tools laufen

Sandboxing wird durch `agents.defaults.sandbox.mode` gesteuert:

- `"off"`: alles läuft auf dem Host.
- `"non-main"`: nur non-main-Sitzungen sind sandboxed (häufige „Überraschung“ bei Gruppen/Channels).
- `"all"`: alles ist sandboxed.

Siehe [Sandboxing](/de/gateway/sandboxing) für die vollständige Matrix (Scope, Workspace-Mounts, Images).

### Bind-Mounts (kurzer Sicherheitscheck)

- `docker.binds` _durchbricht_ das Sandbox-Dateisystem: Alles, was Sie mounten, ist innerhalb des Containers mit dem gesetzten Modus sichtbar (`:ro` oder `:rw`).
- Standard ist Lesen-Schreiben, wenn Sie den Modus weglassen; bevorzugen Sie `:ro` für Source/Secrets.
- `scope: "shared"` ignoriert Bind-Mounts pro Agent (es gelten nur globale Bind-Mounts).
- OpenClaw validiert Bind-Quellen zweimal: zuerst am normalisierten Quellpfad, dann erneut nach der Auflösung über den tiefsten vorhandenen Vorfahren. Ausbrüche über Symlink-Eltern umgehen weder Prüfungen auf blockierte Pfade noch Checks erlaubter Roots.
- Nicht vorhandene Leaf-Pfade werden weiterhin sicher geprüft. Wenn `/workspace/alias-out/new-file` über einen Symlink-Elternpfad auf einen blockierten Pfad oder außerhalb der konfigurierten erlaubten Roots aufgelöst wird, wird der Bind abgelehnt.
- Das Binden von `/var/run/docker.sock` gibt der Sandbox effektiv Kontrolle über den Host; tun Sie das nur absichtlich.
- Workspace-Zugriff (`workspaceAccess: "ro"`/`"rw"`) ist unabhängig von den Bind-Modi.

## Tool-Richtlinie: welche Tools existieren/aufrufbar sind

Zwei Ebenen sind wichtig:

- **Tool-Profil**: `tools.profile` und `agents.list[].tools.profile` (Basis-Allowlist)
- **Provider-Tool-Profil**: `tools.byProvider[provider].profile` und `agents.list[].tools.byProvider[provider].profile`
- **Globale/pro-Agent-Tool-Richtlinie**: `tools.allow`/`tools.deny` und `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider-Tool-Richtlinie**: `tools.byProvider[provider].allow/deny` und `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox-Tool-Richtlinie** (gilt nur, wenn sandboxed): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` und `agents.list[].tools.sandbox.tools.*`

Faustregeln:

- `deny` gewinnt immer.
- Wenn `allow` nicht leer ist, wird alles andere als blockiert behandelt.
- Die Tool-Richtlinie ist der harte Stop: `/exec` kann ein verweigertes Tool `exec` nicht überschreiben.
- `/exec` ändert nur Sitzungsstandards für autorisierte Absender; es gewährt keinen Tool-Zugriff.
  Schlüssel für Provider-Tools akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).

### Tool-Gruppen (Kurzformen)

Tool-Richtlinien (global, Agent, Sandbox) unterstützen Einträge `group:*`, die zu mehreren Tools expandieren:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Verfügbare Gruppen:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` wird als
  Alias für `exec` akzeptiert)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: alle integrierten OpenClaw-Tools (ohne Provider-Plugins)

## Erhöht: `exec` nur auf dem Host ausführen

Erhöht gewährt **keine** zusätzlichen Tools; es betrifft nur `exec`.

- Wenn Sie sandboxed sind, führt `/elevated on` (oder `exec` mit `elevated: true`) außerhalb der Sandbox aus (Freigaben können weiterhin gelten).
- Verwenden Sie `/elevated full`, um `exec`-Freigaben für die Sitzung zu überspringen.
- Wenn Sie bereits direkt ausführen, ist erhöht effektiv ein No-Op (weiterhin gated).
- Erhöht ist **nicht** Skill-bezogen und überschreibt **nicht** Tool-Allow/Deny.
- Erhöht gewährt keine beliebigen Cross-Host-Überschreibungen aus `host=auto`; es folgt den normalen `exec`-Zielregeln und behält `node` nur bei, wenn das konfigurierte/sitzungsbezogene Ziel bereits `node` ist.
- `/exec` ist getrennt von erhöht. Es passt nur die `exec`-Standardwerte pro Sitzung für autorisierte Absender an.

Gates:

- Aktivierung: `tools.elevated.enabled` (und optional `agents.list[].tools.elevated.enabled`)
- Allowlist für Absender: `tools.elevated.allowFrom.<provider>` (und optional `agents.list[].tools.elevated.allowFrom.<provider>`)

Siehe [Elevated Mode](/de/tools/elevated).

## Häufige Korrekturen für die „Sandbox-Jail“

### „Tool X durch Sandbox-Tool-Richtlinie blockiert“

Fix-it-Schlüssel (wählen Sie einen):

- Sandbox deaktivieren: `agents.defaults.sandbox.mode=off` (oder pro Agent `agents.list[].sandbox.mode=off`)
- Das Tool innerhalb der Sandbox erlauben:
  - aus `tools.sandbox.tools.deny` entfernen (oder pro Agent `agents.list[].tools.sandbox.tools.deny`)
  - oder zu `tools.sandbox.tools.allow` hinzufügen (oder zur Allowlist pro Agent)

### „Ich dachte, das wäre main, warum ist es sandboxed?“

Im Modus `"non-main"` sind Gruppen-/Channel-Schlüssel _nicht_ main. Verwenden Sie den main-Sitzungsschlüssel (wird von `sandbox explain` angezeigt) oder schalten Sie den Modus auf `"off"`.

## Verwandt

- [Sandboxing](/de/gateway/sandboxing) -- vollständige Referenz zur Sandbox (Modi, Scopes, Backends, Images)
- [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) -- Überschreibungen pro Agent und Priorität
- [Elevated Mode](/de/tools/elevated)
