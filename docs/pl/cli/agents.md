---
read_when:
    - Chcesz korzystać z wielu odizolowanych agentów (workspaces + routing + uwierzytelnianie)
summary: Dokumentacja CLI dla `openclaw agents` (`list`/`add`/`delete`/`bindings`/`bind`/`unbind`/`set identity`)
title: agenty
x-i18n:
    generated_at: "2026-04-23T09:57:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: f328d9f4ce636ce27defdcbcc48b1ca041bc25d0888c3e4df0dd79840f44ca8f
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Zarządzaj odizolowanymi agentami (workspaces + uwierzytelnianie + routing).

Powiązane:

- Routing wielu agentów: [Routing wielu agentów](/pl/concepts/multi-agent)
- Workspace agenta: [Workspace agenta](/pl/concepts/agent-workspace)
- Konfiguracja widoczności Skills: [Konfiguracja Skills](/pl/tools/skills-config)

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

Używaj powiązań routingu, aby przypiąć przychodzący ruch kanałowy do konkretnego agenta.

Jeśli chcesz też mieć różne widoczne Skills dla każdego agenta, skonfiguruj
`agents.defaults.skills` oraz `agents.list[].skills` w `openclaw.json`. Zobacz
[Konfiguracja Skills](/pl/tools/skills-config) oraz
[Dokumentacja konfiguracji](/pl/gateway/configuration-reference#agents-defaults-skills).

Lista powiązań:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Dodawanie powiązań:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Jeśli pominiesz `accountId` (`--bind <channel>`), OpenClaw rozwiąże go z domyślnych ustawień kanału i hooków konfiguracji pluginu, gdy są dostępne.

Jeśli pominiesz `--agent` dla `bind` lub `unbind`, OpenClaw użyje bieżącego domyślnego agenta.

### Zachowanie zakresu powiązań

- Powiązanie bez `accountId` pasuje tylko do domyślnego konta kanału.
- `accountId: "*"` to fallback dla całego kanału (wszystkie konta) i jest mniej specyficzny niż jawne powiązanie konta.
- Jeśli ten sam agent ma już pasujące powiązanie kanału bez `accountId`, a później dodasz powiązanie z jawnym lub rozwiązanym `accountId`, OpenClaw zaktualizuje istniejące powiązanie na miejscu zamiast dodawać duplikat.

Przykład:

```bash
# początkowe powiązanie tylko z kanałem
openclaw agents bind --agent work --bind telegram

# późniejsza aktualizacja do powiązania w zakresie konta
openclaw agents bind --agent work --bind telegram:ops
```

Po tej aktualizacji routing dla tego powiązania ma zakres `telegram:ops`. Jeśli chcesz też routingu dla konta domyślnego, dodaj go jawnie (na przykład `--bind telegram:default`).

Usuwanie powiązań:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` akceptuje albo `--all`, albo jedną lub więcej wartości `--bind`, ale nie oba naraz.

## Powierzchnia poleceń

### `agents`

Uruchomienie `openclaw agents` bez podpolecenia jest równoważne z `openclaw agents list`.

### `agents list`

Opcje:

- `--json`
- `--bindings`: uwzględnij pełne reguły routingu, a nie tylko liczniki/podsumowania per-agent

### `agents add [name]`

Opcje:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (powtarzalne)
- `--non-interactive`
- `--json`

Uwagi:

- Przekazanie dowolnych jawnych flag add przełącza polecenie w tryb non-interactive.
- Tryb non-interactive wymaga zarówno nazwy agenta, jak i `--workspace`.
- `main` jest zarezerwowane i nie może być użyte jako nowe ID agenta.

### `agents bindings`

Opcje:

- `--agent <id>`
- `--json`

### `agents bind`

Opcje:

- `--agent <id>` (domyślnie bieżący domyślny agent)
- `--bind <channel[:accountId]>` (powtarzalne)
- `--json`

### `agents unbind`

Opcje:

- `--agent <id>` (domyślnie bieżący domyślny agent)
- `--bind <channel[:accountId]>` (powtarzalne)
- `--all`
- `--json`

### `agents delete <id>`

Opcje:

- `--force`
- `--json`

Uwagi:

- `main` nie może zostać usunięte.
- Bez `--force` wymagane jest interaktywne potwierdzenie.
- Katalogi workspace, stanu agenta i transkryptów sesji są przenoszone do Kosza, a nie trwale usuwane.

## Pliki tożsamości

Każdy workspace agenta może zawierać `IDENTITY.md` w katalogu głównym workspace:

- Przykładowa ścieżka: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` odczytuje z katalogu głównego workspace (lub z jawnie podanego `--identity-file`)

Ścieżki avatar są rozwiązywane względem katalogu głównego workspace.

## Ustawianie tożsamości

`set-identity` zapisuje pola w `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (ścieżka względna względem workspace, URL http(s) lub data URI)

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

- `--agent` lub `--workspace` mogą być użyte do wybrania docelowego agenta.
- Jeśli polegasz na `--workspace`, a wiele agentów współdzieli ten workspace, polecenie zakończy się błędem i poprosi o podanie `--agent`.
- Gdy nie podano jawnych pól tożsamości, polecenie odczytuje dane tożsamości z `IDENTITY.md`.

Wczytanie z `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Jawne nadpisanie pól:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Przykładowa konfiguracja:

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
