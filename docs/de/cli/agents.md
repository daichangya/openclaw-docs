---
read_when:
    - Sie möchten mehrere isolierte Agenten (Workspaces + Routing + Authentifizierung).
summary: CLI-Referenz für `openclaw agents` (`list`/`add`/`delete`/`bindings`/`bind`/`unbind`/`set identity`)
title: Agenten
x-i18n:
    generated_at: "2026-04-24T06:30:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04d0ce4f3fb3d0c0ba8ffb3676674cda7d9a60441a012bc94ff24a17105632f1
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Verwalten isolierter Agenten (Workspaces + Authentifizierung + Routing).

Verwandt:

- Multi-Agent-Routing: [Multi-Agent Routing](/de/concepts/multi-agent)
- Agent-Workspace: [Agent workspace](/de/concepts/agent-workspace)
- Konfiguration der Skill-Sichtbarkeit: [Skills config](/de/tools/skills-config)

## Beispiele

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Routing-Bindings

Verwenden Sie Routing-Bindings, um eingehenden Channel-Verkehr an einen bestimmten Agenten zu binden.

Wenn Sie außerdem unterschiedliche sichtbare Skills pro Agent möchten, konfigurieren Sie
`agents.defaults.skills` und `agents.list[].skills` in `openclaw.json`. Siehe
[Skills config](/de/tools/skills-config) und
[Configuration Reference](/de/gateway/config-agents#agents-defaults-skills).

Bindings auflisten:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Bindings hinzufügen:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Wenn Sie `accountId` weglassen (`--bind <channel>`), löst OpenClaw sie aus den Channel-Standards und Plugin-Setup-Hooks auf, sofern verfügbar.

Wenn Sie `--agent` bei `bind` oder `unbind` weglassen, verwendet OpenClaw den aktuellen Standard-Agenten.

### Verhalten des Binding-Bereichs

- Ein Binding ohne `accountId` passt nur auf das Standardkonto des Channels.
- `accountId: "*"` ist der Channel-weite Fallback (alle Konten) und weniger spezifisch als ein explizites Account-Binding.
- Wenn derselbe Agent bereits ein passendes Channel-Binding ohne `accountId` hat und Sie später mit einer expliziten oder aufgelösten `accountId` binden, aktualisiert OpenClaw dieses vorhandene Binding direkt, anstatt ein Duplikat hinzuzufügen.

Beispiel:

```bash
# anfängliches nur-Channel-Binding
openclaw agents bind --agent work --bind telegram

# später auf ein accountbezogenes Binding aktualisieren
openclaw agents bind --agent work --bind telegram:ops
```

Nach der Aktualisierung ist das Routing für dieses Binding auf `telegram:ops` beschränkt. Wenn Sie zusätzlich Routing für das Standardkonto möchten, fügen Sie es explizit hinzu (zum Beispiel `--bind telegram:default`).

Bindings entfernen:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` akzeptiert entweder `--all` oder einen oder mehrere `--bind`-Werte, nicht beides.

## Befehlsoberfläche

### `agents`

Wenn `openclaw agents` ohne Unterbefehl ausgeführt wird, entspricht dies `openclaw agents list`.

### `agents list`

Optionen:

- `--json`
- `--bindings`: vollständige Routing-Regeln einschließen, nicht nur Zählwerte/Zusammenfassungen pro Agent

### `agents add [name]`

Optionen:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (wiederholbar)
- `--non-interactive`
- `--json`

Hinweise:

- Das Übergeben beliebiger expliziter Add-Flags schaltet den Befehl in den nicht-interaktiven Pfad.
- Der nicht-interaktive Modus erfordert sowohl einen Agent-Namen als auch `--workspace`.
- `main` ist reserviert und kann nicht als neue Agent-ID verwendet werden.

### `agents bindings`

Optionen:

- `--agent <id>`
- `--json`

### `agents bind`

Optionen:

- `--agent <id>` (standardmäßig der aktuelle Standard-Agent)
- `--bind <channel[:accountId]>` (wiederholbar)
- `--json`

### `agents unbind`

Optionen:

- `--agent <id>` (standardmäßig der aktuelle Standard-Agent)
- `--bind <channel[:accountId]>` (wiederholbar)
- `--all`
- `--json`

### `agents delete <id>`

Optionen:

- `--force`
- `--json`

Hinweise:

- `main` kann nicht gelöscht werden.
- Ohne `--force` ist eine interaktive Bestätigung erforderlich.
- Workspace-, Agent-Status- und Sitzungs-Transkriptverzeichnisse werden in den Papierkorb verschoben, nicht endgültig gelöscht.

## Identity-Dateien

Jeder Agent-Workspace kann eine `IDENTITY.md` im Workspace-Stamm enthalten:

- Beispielpfad: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` liest aus dem Workspace-Stamm (oder aus einer expliziten `--identity-file`)

Avatar-Pfade werden relativ zum Workspace-Stamm aufgelöst.

## Identity setzen

`set-identity` schreibt Felder in `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (workspace-relativer Pfad, http(s)-URL oder Daten-URI)

Optionen:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Hinweise:

- `--agent` oder `--workspace` kann verwendet werden, um den Ziel-Agenten auszuwählen.
- Wenn Sie sich auf `--workspace` verlassen und mehrere Agenten denselben Workspace verwenden, schlägt der Befehl fehl und fordert Sie auf, `--agent` anzugeben.
- Wenn keine expliziten Identity-Felder angegeben werden, liest der Befehl die Identity-Daten aus `IDENTITY.md`.

Aus `IDENTITY.md` laden:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Felder explizit überschreiben:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Konfigurationsbeispiel:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Multi-Agent Routing](/de/concepts/multi-agent)
- [Agent workspace](/de/concepts/agent-workspace)
