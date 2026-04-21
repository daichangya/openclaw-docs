---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Warum ein Tool blockiert ist: Sandbox-Laufzeit, Tool-Zulassungs-/Sperrrichtlinie und Gates für erhöhte Ausführung'
title: Sandbox vs. Tool-Richtlinie vs. Erhöht
x-i18n:
    generated_at: "2026-04-21T06:25:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: a85378343df0594be451212cb4c95b349a0cc7cd1f242b9306be89903a450db1
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs. Tool-Richtlinie vs. Erhöht

OpenClaw hat drei zusammenhängende (aber unterschiedliche) Steuerungen:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) entscheidet, **wo Tools ausgeführt werden** (Sandbox-Backend vs. Host).
2. **Tool-Richtlinie** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) entscheidet, **welche Tools verfügbar/erlaubt sind**.
3. **Erhöht** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) ist eine **nur für Exec gedachte Escape-Hatch**, um außerhalb der Sandbox auszuführen, wenn Sie sich in einer Sandbox befinden (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel auf `node` konfiguriert ist).

## Schnelles Debugging

Verwenden Sie den Inspektor, um zu sehen, was OpenClaw _tatsächlich_ macht:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Er gibt Folgendes aus:

- effektiver Sandbox-Modus/-Bereich/-Workspace-Zugriff
- ob die Sitzung derzeit in einer Sandbox läuft (main vs. nicht-main)
- effektive Sandbox-Tool-Zulassung/-Sperrung (und ob sie von Agent/global/Standard stammt)
- erhöhte Gates und Fix-it-Schlüsselpfade

## Sandbox: wo Tools ausgeführt werden

Sandboxing wird durch `agents.defaults.sandbox.mode` gesteuert:

- `"off"`: alles wird auf dem Host ausgeführt.
- `"non-main"`: nur nicht-main-Sitzungen laufen in einer Sandbox (häufige „Überraschung“ bei Gruppen/Kanälen).
- `"all"`: alles läuft in einer Sandbox.

Siehe [Sandboxing](/de/gateway/sandboxing) für die vollständige Matrix (Bereich, Workspace-Mounts, Images).

### Bind-Mounts (Sicherheits-Schnellprüfung)

- `docker.binds` _durchbricht_ das Sandbox-Dateisystem: Alles, was Sie mounten, ist im Container mit dem von Ihnen gesetzten Modus sichtbar (`:ro` oder `:rw`).
- Standard ist Lese-/Schreibzugriff, wenn Sie den Modus weglassen; bevorzugen Sie `:ro` für Quellcode/Secrets.
- `scope: "shared"` ignoriert Bind-Mounts pro Agent (es gelten nur globale Bind-Mounts).
- OpenClaw validiert Bind-Quellen zweimal: zuerst auf dem normalisierten Quellpfad, dann erneut nach der Auflösung über den tiefsten vorhandenen Vorfahren. Escapes über symbolische Links im Elternpfad umgehen weder Prüfungen auf gesperrte Pfade noch Prüfungen auf erlaubte Wurzeln.
- Nicht vorhandene Blattpfade werden weiterhin sicher geprüft. Wenn `/workspace/alias-out/new-file` über einen symbolisch verlinkten Elternpfad auf einen gesperrten Pfad oder außerhalb der konfigurierten erlaubten Wurzeln aufgelöst wird, wird der Bind-Mount abgelehnt.
- Das Binden von `/var/run/docker.sock` gibt der Sandbox effektiv Kontrolle über den Host; tun Sie dies nur bewusst.
- Workspace-Zugriff (`workspaceAccess: "ro"`/`"rw"`) ist unabhängig von Bind-Modi.

## Tool-Richtlinie: welche Tools existieren/aufrufbar sind

Zwei Ebenen sind wichtig:

- **Tool-Profil**: `tools.profile` und `agents.list[].tools.profile` (Basis-Zulassungsliste)
- **Provider-Tool-Profil**: `tools.byProvider[provider].profile` und `agents.list[].tools.byProvider[provider].profile`
- **Globale/pro-Agent-Tool-Richtlinie**: `tools.allow`/`tools.deny` und `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider-Tool-Richtlinie**: `tools.byProvider[provider].allow/deny` und `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox-Tool-Richtlinie** (gilt nur in der Sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` und `agents.list[].tools.sandbox.tools.*`

Faustregeln:

- `deny` gewinnt immer.
- Wenn `allow` nicht leer ist, wird alles andere als blockiert behandelt.
- Die Tool-Richtlinie ist der harte Stopp: `/exec` kann ein gesperrtes `exec`-Tool nicht überschreiben.
- `/exec` ändert nur Sitzungsstandards für autorisierte Absender; es gewährt keinen Tool-Zugriff.
  Provider-Tool-Schlüssel akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).

### Tool-Gruppen (Kurzformen)

Tool-Richtlinien (global, Agent, Sandbox) unterstützen Einträge vom Typ `group:*`, die zu mehreren Tools erweitert werden:

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
- `group:openclaw`: alle integrierten OpenClaw-Tools (schließt Provider-Plugins aus)

## Erhöht: nur für Exec „auf dem Host ausführen“

Erhöht gewährt **keine** zusätzlichen Tools; es betrifft nur `exec`.

- Wenn Sie sich in einer Sandbox befinden, führt `/elevated on` (oder `exec` mit `elevated: true`) außerhalb der Sandbox aus (Freigaben können weiterhin gelten).
- Verwenden Sie `/elevated full`, um Exec-Freigaben für die Sitzung zu überspringen.
- Wenn Sie bereits direkt ausführen, ist Erhöht faktisch ein No-op (bleibt aber durch Gates geschützt).
- Erhöht ist **nicht** auf Skills begrenzt und überschreibt **nicht** Tool-Zulassungen/-Sperrungen.
- Erhöht gewährt keine beliebigen hostübergreifenden Überschreibungen aus `host=auto`; es folgt den normalen Exec-Zielregeln und behält `node` nur dann bei, wenn das konfigurierte/Sitzungsziel bereits `node` ist.
- `/exec` ist von Erhöht getrennt. Es passt nur die Exec-Standards pro Sitzung für autorisierte Absender an.

Gates:

- Aktivierung: `tools.elevated.enabled` (und optional `agents.list[].tools.elevated.enabled`)
- Zulassungslisten für Absender: `tools.elevated.allowFrom.<provider>` (und optional `agents.list[].tools.elevated.allowFrom.<provider>`)

Siehe [Elevated Mode](/de/tools/elevated).

## Häufige Korrekturen für „Sandbox-Gefängnis“

### „Tool X durch Sandbox-Tool-Richtlinie blockiert“

Fix-it-Schlüssel (wählen Sie einen):

- Sandbox deaktivieren: `agents.defaults.sandbox.mode=off` (oder pro Agent `agents.list[].sandbox.mode=off`)
- Das Tool innerhalb der Sandbox zulassen:
  - aus `tools.sandbox.tools.deny` entfernen (oder pro Agent `agents.list[].tools.sandbox.tools.deny`)
  - oder zu `tools.sandbox.tools.allow` hinzufügen (oder zur Zulassung pro Agent)

### „Ich dachte, das wäre main, warum läuft es in einer Sandbox?“

Im Modus `"non-main"` sind Gruppen-/Kanalschlüssel _nicht_ main. Verwenden Sie den main-Sitzungsschlüssel (wird von `sandbox explain` angezeigt) oder wechseln Sie den Modus zu `"off"`.

## Siehe auch

- [Sandboxing](/de/gateway/sandboxing) -- vollständige Sandbox-Referenz (Modi, Bereiche, Backends, Images)
- [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) -- Überschreibungen pro Agent und Vorrangregeln
- [Elevated Mode](/de/tools/elevated)
