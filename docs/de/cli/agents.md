---
read_when:
    - Sie möchten mehrere isolierte Agents (Workspaces + Routing + Auth)
summary: CLI-Referenz für `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: agents
x-i18n:
    generated_at: "2026-04-05T12:37:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90b90c4915993bd8af322c0590d4cb59baabb8940598ce741315f8f95ef43179
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Isolierte Agents verwalten (Workspaces + Auth + Routing).

Verwandt:

- Multi-Agent-Routing: [Multi-Agent Routing](/concepts/multi-agent)
- Agent-Workspace: [Agent workspace](/concepts/agent-workspace)
- Skills-Sichtbarkeitskonfiguration: [Skills config](/tools/skills-config)

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

Verwenden Sie Routing-Bindings, um eingehenden Channel-Datenverkehr an einen bestimmten Agent zu binden.

Wenn Sie pro Agent auch unterschiedliche sichtbare Skills möchten, konfigurieren Sie
`agents.defaults.skills` und `agents.list[].skills` in `openclaw.json`. Siehe
[Skills config](/tools/skills-config) und
[Configuration Reference](/gateway/configuration-reference#agentsdefaultsskills).

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

Wenn Sie `accountId` weglassen (`--bind <channel>`), löst OpenClaw ihn, wenn möglich, aus den Channel-Standardwerten und Plugin-Setup-Hooks auf.

Wenn Sie `--agent` bei `bind` oder `unbind` weglassen, zielt OpenClaw auf den aktuellen Standard-Agent.

### Verhalten des Binding-Bereichs

- Ein Binding ohne `accountId` passt nur zum Standardkonto des Channels.
- `accountId: "*"` ist der channelweite Fallback (alle Konten) und ist weniger spezifisch als ein explizites Konto-Binding.
- Wenn derselbe Agent bereits ein passendes Channel-Binding ohne `accountId` hat und Sie später mit einer expliziten oder aufgelösten `accountId` binden, aktualisiert OpenClaw dieses bestehende Binding direkt, statt ein Duplikat hinzuzufügen.

Beispiel:

```bash
# anfängliches channelbezogenes Binding
openclaw agents bind --agent work --bind telegram

# späteres Upgrade auf ein kontobezogenes Binding
openclaw agents bind --agent work --bind telegram:ops
```

Nach dem Upgrade ist das Routing für dieses Binding auf `telegram:ops` beschränkt. Wenn Sie auch Routing für das Standardkonto möchten, fügen Sie es explizit hinzu (zum Beispiel `--bind telegram:default`).

Bindings entfernen:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` akzeptiert entweder `--all` oder einen oder mehrere `--bind`-Werte, nicht beides.

## Befehlsoberfläche

### `agents`

Das Ausführen von `openclaw agents` ohne Unterbefehl entspricht `openclaw agents list`.

### `agents list`

Optionen:

- `--json`
- `--bindings`: vollständige Routing-Regeln einschließen, nicht nur Zählungen/Zusammenfassungen pro Agent

### `agents add [name]`

Optionen:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (wiederholbar)
- `--non-interactive`
- `--json`

Hinweise:

- Das Übergeben expliziter Add-Flags schaltet den Befehl in den nicht interaktiven Pfad.
- Der nicht interaktive Modus erfordert sowohl einen Agent-Namen als auch `--workspace`.
- `main` ist reserviert und kann nicht als neue Agent-ID verwendet werden.

### `agents bindings`

Optionen:

- `--agent <id>`
- `--json`

### `agents bind`

Optionen:

- `--agent <id>` (Standard ist der aktuelle Standard-Agent)
- `--bind <channel[:accountId]>` (wiederholbar)
- `--json`

### `agents unbind`

Optionen:

- `--agent <id>` (Standard ist der aktuelle Standard-Agent)
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

## Identitätsdateien

Jeder Agent-Workspace kann ein `IDENTITY.md` im Workspace-Stamm enthalten:

- Beispielpfad: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` liest aus dem Workspace-Stamm (oder aus einer expliziten `--identity-file`)

Avatar-Pfade werden relativ zum Workspace-Stamm aufgelöst.

## Identität setzen

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

- `--agent` oder `--workspace` kann verwendet werden, um den Ziel-Agent auszuwählen.
- Wenn Sie sich auf `--workspace` verlassen und mehrere Agents diesen Workspace gemeinsam nutzen, schlägt der Befehl fehl und fordert Sie auf, `--agent` zu übergeben.
- Wenn keine expliziten Identitätsfelder angegeben werden, liest der Befehl die Identitätsdaten aus `IDENTITY.md`.

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
