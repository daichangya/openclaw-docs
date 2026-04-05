---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Warum ein Tool blockiert ist: Sandbox-Laufzeit, Tool-Allow-/Deny-Richtlinie und Elevated-Gates'
title: Sandbox vs. Tool-Richtlinie vs. Elevated
x-i18n:
    generated_at: "2026-04-05T12:43:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d5ddc1dbf02b89f18d46e5473ff0a29b8a984426fe2db7270c170f2de0cdeac
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs. Tool-Richtlinie vs. Elevated

OpenClaw hat drei verwandte (aber unterschiedliche) Steuerungen:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) entscheidet, **wo Tools ausgeführt werden** (Docker vs. Host).
2. **Tool-Richtlinie** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) entscheidet, **welche Tools verfügbar/erlaubt sind**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) ist ein **nur für Exec vorgesehener Escape Hatch**, um außerhalb der Sandbox zu laufen, wenn Sie sandboxed sind (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel entsprechend konfiguriert ist).

## Schnelles Debugging

Verwenden Sie den Inspector, um zu sehen, was OpenClaw _tatsächlich_ macht:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Er gibt Folgendes aus:

- effektiver Sandbox-Modus/-Scope/-Workspace-Zugriff
- ob die Sitzung derzeit sandboxed ist (main vs. non-main)
- effektives Sandbox-Tool-Allow/Deny (und ob es von Agent/global/default stammt)
- Elevated-Gates und Fix-it-Schlüsselpfade

## Sandbox: wo Tools laufen

Sandboxing wird durch `agents.defaults.sandbox.mode` gesteuert:

- `"off"`: Alles läuft auf dem Host.
- `"non-main"`: Nur non-main-Sitzungen sind sandboxed (häufige „Überraschung“ für Gruppen/Channels).
- `"all"`: Alles ist sandboxed.

Siehe [Sandboxing](/gateway/sandboxing) für die vollständige Matrix (Scope, Workspace-Mounts, Images).

### Bind-Mounts (schnelle Sicherheitsprüfung)

- `docker.binds` _durchdringt_ das Sandbox-Dateisystem: Was immer Sie mounten, ist im Container mit dem von Ihnen gesetzten Modus sichtbar (`:ro` oder `:rw`).
- Standard ist Lesen/Schreiben, wenn Sie den Modus weglassen; bevorzugen Sie `:ro` für Quellcode/Secrets.
- `scope: "shared"` ignoriert Bind-Mounts pro Agent (es gelten nur globale Bind-Mounts).
- OpenClaw validiert Bind-Quellen zweimal: zuerst auf dem normalisierten Quellpfad und dann erneut nach der Auflösung über den tiefsten vorhandenen Vorfahren. Escape-Versuche über Symlink-Parents umgehen Prüfungen für blockierte Pfade oder erlaubte Roots nicht.
- Nicht existierende Blattpfade werden trotzdem sicher geprüft. Wenn `/workspace/alias-out/new-file` über einen Symlink-Parent auf einen blockierten Pfad oder außerhalb der konfigurierten erlaubten Roots aufgelöst wird, wird der Bind-Mount abgelehnt.
- Das Binden von `/var/run/docker.sock` übergibt effektiv Host-Kontrolle an die Sandbox; tun Sie das nur bewusst.
- Workspace-Zugriff (`workspaceAccess: "ro"`/`"rw"`) ist unabhängig von Bind-Modi.

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
- Die Tool-Richtlinie ist der harte Stop: `/exec` kann ein verweigertes `exec`-Tool nicht überschreiben.
- `/exec` ändert nur Sitzungs-Standardwerte für autorisierte Absender; es gewährt keinen Tool-Zugriff.
  Provider-Tool-Schlüssel akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).

### Tool-Gruppen (Kurzschreibweisen)

Tool-Richtlinien (global, Agent, Sandbox) unterstützen `group:*`-Einträge, die zu mehreren Tools erweitert werden:

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
- `group:media`: `image`, `image_generate`, `tts`
- `group:openclaw`: alle integrierten OpenClaw-Tools (ohne Provider-Plugins)

## Elevated: nur für Exec vorgesehenes „auf dem Host ausführen“

Elevated gewährt **keine** zusätzlichen Tools; es betrifft nur `exec`.

- Wenn Sie sandboxed sind, führt `/elevated on` (oder `exec` mit `elevated: true`) außerhalb der Sandbox aus (Genehmigungen können weiterhin gelten).
- Verwenden Sie `/elevated full`, um Exec-Genehmigungen für die Sitzung zu überspringen.
- Wenn Sie bereits direkt laufen, ist Elevated effektiv ein No-op (bleibt aber gated).
- Elevated ist **nicht** skill-scoped und überschreibt Tool-Allow/Deny **nicht**.
- Elevated gewährt keine beliebigen Cross-Host-Überschreibungen von `host=auto`; es folgt den normalen Exec-Zielregeln und bewahrt `node` nur dann, wenn das konfigurierte/Sitzungs-Ziel bereits `node` ist.
- `/exec` ist von Elevated getrennt. Es passt nur Exec-Standardwerte pro Sitzung für autorisierte Absender an.

Gates:

- Aktivierung: `tools.elevated.enabled` (und optional `agents.list[].tools.elevated.enabled`)
- Absender-Allowlists: `tools.elevated.allowFrom.<provider>` (und optional `agents.list[].tools.elevated.allowFrom.<provider>`)

Siehe [Elevated Mode](/tools/elevated).

## Häufige Korrekturen für „Sandbox-Gefängnis“

### „Tool X durch Sandbox-Tool-Richtlinie blockiert“

Fix-it-Schlüssel (wählen Sie einen):

- Sandbox deaktivieren: `agents.defaults.sandbox.mode=off` (oder pro Agent `agents.list[].sandbox.mode=off`)
- Das Tool innerhalb der Sandbox erlauben:
  - aus `tools.sandbox.tools.deny` entfernen (oder pro Agent `agents.list[].tools.sandbox.tools.deny`)
  - oder zu `tools.sandbox.tools.allow` hinzufügen (oder pro-Agent-Allowlist)

### „Ich dachte, das wäre main, warum ist es sandboxed?“

Im Modus `"non-main"` sind Gruppen-/Channel-Schlüssel _nicht_ main. Verwenden Sie den main-Sitzungsschlüssel (wird von `sandbox explain` angezeigt) oder wechseln Sie den Modus zu `"off"`.

## Siehe auch

- [Sandboxing](/gateway/sandboxing) -- vollständige Sandbox-Referenz (Modi, Scopes, Backends, Images)
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- Überschreibungen pro Agent und Priorität
- [Elevated Mode](/tools/elevated)
