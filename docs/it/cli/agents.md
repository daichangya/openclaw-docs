---
read_when:
    - Vuoi più agenti isolati (spazi di lavoro + instradamento + autenticazione)
summary: Riferimento CLI per `openclaw agents` (list/add/delete/bindings/bind/unbind/imposta identità)
title: Agenti
x-i18n:
    generated_at: "2026-04-25T13:43:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd0698f0821f9444e84cd82fe78ee46071447fb4c3cada6d1a98b5130147691
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Gestisci agenti isolati (spazi di lavoro + autenticazione + instradamento).

Correlati:

- Instradamento multi-agente: [Instradamento multi-agente](/it/concepts/multi-agent)
- Spazio di lavoro dell'agente: [Spazio di lavoro dell'agente](/it/concepts/agent-workspace)
- Configurazione della visibilità delle Skills: [Configurazione delle Skills](/it/tools/skills-config)

## Esempi

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

## Associazioni di instradamento

Usa le associazioni di instradamento per fissare il traffico del canale in entrata a un agente specifico.

Se vuoi anche Skills visibili diverse per ogni agente, configura
`agents.defaults.skills` e `agents.list[].skills` in `openclaw.json`. Vedi
[Configurazione delle Skills](/it/tools/skills-config) e
[Riferimento della configurazione](/it/gateway/config-agents#agents-defaults-skills).

Elenca le associazioni:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Aggiungi associazioni:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Se ometti `accountId` (`--bind <channel>`), OpenClaw lo risolve dai valori predefiniti del canale e dagli hook di configurazione del Plugin quando disponibili.

Se ometti `--agent` per `bind` o `unbind`, OpenClaw usa come destinazione l'agente predefinito corrente.

### Comportamento dell'ambito di associazione

- Un'associazione senza `accountId` corrisponde solo all'account predefinito del canale.
- `accountId: "*"` è il fallback a livello di canale (tutti gli account) ed è meno specifico di un'associazione esplicita a un account.
- Se lo stesso agente ha già un'associazione di canale corrispondente senza `accountId` e successivamente effettui l'associazione con un `accountId` esplicito o risolto, OpenClaw aggiorna quell'associazione esistente sul posto invece di aggiungerne una duplicata.

Esempio:

```bash
# associazione iniziale solo canale
openclaw agents bind --agent work --bind telegram

# successivo aggiornamento ad associazione con ambito account
openclaw agents bind --agent work --bind telegram:ops
```

Dopo l'aggiornamento, l'instradamento per quell'associazione è limitato a `telegram:ops`. Se vuoi anche l'instradamento per l'account predefinito, aggiungilo esplicitamente (ad esempio `--bind telegram:default`).

Rimuovi associazioni:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` accetta `--all` oppure uno o più valori `--bind`, non entrambi.

## Superficie dei comandi

### `agents`

Eseguire `openclaw agents` senza un sottocomando equivale a `openclaw agents list`.

### `agents list`

Opzioni:

- `--json`
- `--bindings`: include le regole di instradamento complete, non solo conteggi/riepiloghi per agente

### `agents add [name]`

Opzioni:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (ripetibile)
- `--non-interactive`
- `--json`

Note:

- Passare qualsiasi flag esplicito di aggiunta fa passare il comando al percorso non interattivo.
- La modalità non interattiva richiede sia un nome agente sia `--workspace`.
- `main` è riservato e non può essere usato come nuovo id agente.

### `agents bindings`

Opzioni:

- `--agent <id>`
- `--json`

### `agents bind`

Opzioni:

- `--agent <id>` (usa come predefinito l'agente predefinito corrente)
- `--bind <channel[:accountId]>` (ripetibile)
- `--json`

### `agents unbind`

Opzioni:

- `--agent <id>` (usa come predefinito l'agente predefinito corrente)
- `--bind <channel[:accountId]>` (ripetibile)
- `--all`
- `--json`

### `agents delete <id>`

Opzioni:

- `--force`
- `--json`

Note:

- `main` non può essere eliminato.
- Senza `--force`, è richiesta una conferma interattiva.
- Le directory dello spazio di lavoro, dello stato agente e della trascrizione della sessione vengono spostate nel Cestino, non eliminate definitivamente.
- Se lo spazio di lavoro di un altro agente è lo stesso percorso, si trova all'interno di questo spazio di lavoro o contiene questo spazio di lavoro,
  lo spazio di lavoro viene mantenuto e `--json` riporta `workspaceRetained`,
  `workspaceRetainedReason` e `workspaceSharedWith`.

## File di identità

Ogni spazio di lavoro agente può includere un file `IDENTITY.md` nella radice dello spazio di lavoro:

- Percorso di esempio: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` legge dalla radice dello spazio di lavoro (oppure da un `--identity-file` esplicito)

I percorsi dell'avatar vengono risolti relativamente alla radice dello spazio di lavoro.

## Imposta identità

`set-identity` scrive i campi in `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (percorso relativo allo spazio di lavoro, URL http(s) o data URI)

Opzioni:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Note:

- `--agent` o `--workspace` possono essere usati per selezionare l'agente di destinazione.
- Se fai affidamento su `--workspace` e più agenti condividono quello spazio di lavoro, il comando fallisce e ti chiede di passare `--agent`.
- Quando non vengono forniti campi di identità espliciti, il comando legge i dati di identità da `IDENTITY.md`.

Carica da `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Sovrascrivi i campi esplicitamente:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Esempio di configurazione:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "aragosta spaziale",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Spazio di lavoro dell'agente](/it/concepts/agent-workspace)
