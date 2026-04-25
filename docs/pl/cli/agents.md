---
read_when:
    - Chcesz wielu odizolowanych agentów (obszary robocze + routing + uwierzytelnianie).
summary: Dokumentacja CLI dla `openclaw agents` (`list`/`add`/`delete`/`bindings`/`bind`/`unbind`/`set identity`)
title: Agenci
x-i18n:
    generated_at: "2026-04-25T13:43:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd0698f0821f9444e84cd82fe78ee46071447fb4c3cada6d1a98b5130147691
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Zarządzaj odizolowanymi agentami (obszary robocze + uwierzytelnianie + routing).

Powiązane:

- Routing wielu agentów: [Multi-Agent Routing](/pl/concepts/multi-agent)
- Obszar roboczy agenta: [Agent workspace](/pl/concepts/agent-workspace)
- Konfiguracja widoczności Skills: [Skills config](/pl/tools/skills-config)

## Przykłady

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

## Powiązania routingu

Używaj powiązań routingu, aby przypiąć przychodzący ruch z kanału do konkretnego agenta.

Jeśli chcesz też mieć różne widoczne Skills dla poszczególnych agentów, skonfiguruj
`agents.defaults.skills` i `agents.list[].skills` w `openclaw.json`. Zobacz
[Skills config](/pl/tools/skills-config) oraz
[Configuration Reference](/pl/gateway/config-agents#agents-defaults-skills).

Wyświetlanie powiązań:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Dodawanie powiązań:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Jeśli pominiesz `accountId` (`--bind <channel>`), OpenClaw ustali je na podstawie domyślnych ustawień kanału i haków konfiguracji Plugin, gdy są dostępne.

Jeśli pominiesz `--agent` dla `bind` lub `unbind`, OpenClaw wybierze bieżącego domyślnego agenta.

### Zachowanie zakresu powiązania

- Powiązanie bez `accountId` pasuje tylko do domyślnego konta kanału.
- `accountId: "*"` jest ustawieniem rezerwowym dla całego kanału (wszystkie konta) i jest mniej specyficzne niż jawne powiązanie konta.
- Jeśli ten sam agent ma już pasujące powiązanie kanału bez `accountId`, a później dodasz powiązanie z jawnym lub ustalonym `accountId`, OpenClaw uaktualni istniejące powiązanie na miejscu zamiast dodawać duplikat.

Przykład:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Po uaktualnieniu routing tego powiązania jest ograniczony do `telegram:ops`. Jeśli chcesz też routing dla konta domyślnego, dodaj go jawnie (na przykład `--bind telegram:default`).

Usuwanie powiązań:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` akceptuje albo `--all`, albo co najmniej jedną wartość `--bind`, ale nie oba jednocześnie.

## Powierzchnia poleceń

### `agents`

Uruchomienie `openclaw agents` bez podpolecenia jest równoważne z `openclaw agents list`.

### `agents list`

Opcje:

- `--json`
- `--bindings`: uwzględnia pełne reguły routingu, a nie tylko liczniki/podsumowania per agent

### `agents add [name]`

Opcje:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (można powtarzać)
- `--non-interactive`
- `--json`

Uwagi:

- Przekazanie dowolnych jawnych flag dodawania przełącza polecenie do ścieżki nieinteraktywnej.
- Tryb nieinteraktywny wymaga zarówno nazwy agenta, jak i `--workspace`.
- `main` jest zarezerwowane i nie może być użyte jako nowy identyfikator agenta.

### `agents bindings`

Opcje:

- `--agent <id>`
- `--json`

### `agents bind`

Opcje:

- `--agent <id>` (domyślnie bieżący domyślny agent)
- `--bind <channel[:accountId]>` (można powtarzać)
- `--json`

### `agents unbind`

Opcje:

- `--agent <id>` (domyślnie bieżący domyślny agent)
- `--bind <channel[:accountId]>` (można powtarzać)
- `--all`
- `--json`

### `agents delete <id>`

Opcje:

- `--force`
- `--json`

Uwagi:

- `main` nie może zostać usunięty.
- Bez `--force` wymagane jest potwierdzenie interaktywne.
- Katalogi obszaru roboczego, stanu agenta i transkryptów sesji są przenoszone do Kosza, a nie usuwane trwale.
- Jeśli obszar roboczy innego agenta ma tę samą ścieżkę, znajduje się wewnątrz tego obszaru roboczego albo zawiera ten obszar roboczy,
  obszar roboczy zostaje zachowany, a `--json` zgłasza `workspaceRetained`,
  `workspaceRetainedReason` oraz `workspaceSharedWith`.

## Pliki tożsamości

Każdy obszar roboczy agenta może zawierać plik `IDENTITY.md` w katalogu głównym obszaru roboczego:

- Przykładowa ścieżka: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` odczytuje z katalogu głównego obszaru roboczego (lub z jawnego `--identity-file`)

Ścieżki avatar są rozwiązywane względem katalogu głównego obszaru roboczego.

## Ustawianie tożsamości

`set-identity` zapisuje pola w `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (ścieżka względna względem obszaru roboczego, URL `http(s)` lub URI danych)

Opcje:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Uwagi:

- `--agent` lub `--workspace` mogą zostać użyte do wskazania docelowego agenta.
- Jeśli polegasz na `--workspace`, a wiele agentów współdzieli ten obszar roboczy, polecenie zakończy się błędem i poprosi o przekazanie `--agent`.
- Gdy nie podano jawnych pól tożsamości, polecenie odczytuje dane tożsamości z `IDENTITY.md`.

Wczytywanie z `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Jawne nadpisanie pól:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Przykład konfiguracji:

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

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Multi-agent routing](/pl/concepts/multi-agent)
- [Agent workspace](/pl/concepts/agent-workspace)
