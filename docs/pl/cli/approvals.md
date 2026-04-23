---
read_when:
    - Chcesz edytować zatwierdzenia exec z poziomu CLI
    - Musisz zarządzać listami dozwolonych elementów na hostach Gateway lub Node
summary: Dokumentacja CLI dla `openclaw approvals` i `openclaw exec-policy`
title: zatwierdzenia
x-i18n:
    generated_at: "2026-04-23T09:58:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e4e031df737e3bdde97ece81fe50eafbb4384557b40c6d52cf2395cf30721a3
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Zarządzaj zatwierdzeniami exec dla **hosta lokalnego**, **hosta Gateway** lub **hosta Node**.
Domyślnie polecenia są kierowane do lokalnego pliku zatwierdzeń na dysku. Użyj `--gateway`, aby kierować je do Gateway, albo `--node`, aby kierować je do konkretnego Node.

Alias: `openclaw exec-approvals`

Powiązane:

- Zatwierdzenia exec: [Zatwierdzenia exec](/pl/tools/exec-approvals)
- Node: [Nodes](/pl/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` to wygodne lokalne polecenie służące do utrzymywania żądanej
konfiguracji `tools.exec.*` i lokalnego pliku zatwierdzeń hosta w zgodzie w jednym kroku.

Użyj go, gdy chcesz:

- sprawdzić lokalną żądaną politykę, plik zatwierdzeń hosta i wynikowe scalenie
- zastosować lokalny preset taki jak YOLO lub deny-all
- zsynchronizować lokalne `tools.exec.*` i lokalne `~/.openclaw/exec-approvals.json`

Przykłady:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Tryby wyjścia:

- bez `--json`: wypisuje czytelny dla człowieka widok tabeli
- `--json`: wypisuje strukturalne dane czytelne maszynowo

Bieżący zakres:

- `exec-policy` jest **tylko lokalne**
- aktualizuje razem lokalny plik konfiguracji i lokalny plik zatwierdzeń
- **nie** wypycha polityki do hosta Gateway ani hosta Node
- `--host node` jest odrzucane w tym poleceniu, ponieważ zatwierdzenia exec dla Node są pobierane z Node w czasie działania i muszą być zarządzane zamiast tego przez polecenia zatwierdzeń kierowane do Node
- `openclaw exec-policy show` oznacza zakresy `host=node` jako zarządzane przez Node w czasie działania zamiast wyprowadzać efektywną politykę z lokalnego pliku zatwierdzeń

Jeśli musisz bezpośrednio edytować zatwierdzenia zdalnego hosta, nadal używaj `openclaw approvals set --gateway`
lub `openclaw approvals set --node <id|name|ip>`.

## Typowe polecenia

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` pokazuje teraz efektywną politykę exec dla celów lokalnych, Gateway i Node:

- żądana polityka `tools.exec`
- polityka pliku zatwierdzeń hosta
- efektywny wynik po zastosowaniu reguł pierwszeństwa

Pierwszeństwo jest celowe:

- plik zatwierdzeń hosta jest możliwym do wyegzekwowania źródłem prawdy
- żądana polityka `tools.exec` może zawężać lub rozszerzać zamierzenie, ale efektywny wynik nadal jest wyprowadzany z reguł hosta
- `--node` łączy plik zatwierdzeń hosta Node z polityką `tools.exec` Gateway, ponieważ obie nadal obowiązują w czasie działania
- jeśli konfiguracja Gateway jest niedostępna, CLI przechodzi awaryjnie do migawki zatwierdzeń Node i zaznacza, że nie udało się obliczyć końcowej polityki czasu działania

## Zastąp zatwierdzenia z pliku

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` akceptuje JSON5, a nie tylko ścisły JSON. Użyj albo `--file`, albo `--stdin`, ale nie obu naraz.

## Przykład „Nigdy nie pytaj” / YOLO

Dla hosta, który nigdy nie powinien zatrzymywać się na zatwierdzeniach exec, ustaw domyślne wartości pliku zatwierdzeń hosta na `full` + `off`:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Wariant dla Node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

To zmienia tylko **plik zatwierdzeń hosta**. Aby utrzymać zgodność z żądaną polityką OpenClaw, ustaw również:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Dlaczego `tools.exec.host=gateway` w tym przykładzie:

- `host=auto` nadal oznacza „sandbox, gdy jest dostępny, w przeciwnym razie Gateway”.
- YOLO dotyczy zatwierdzeń, a nie routingu.
- Jeśli chcesz exec na hoście nawet wtedy, gdy skonfigurowano sandbox, jawnie wskaż host przez `gateway` lub `/exec host=gateway`.

To odpowiada bieżącemu zachowaniu YOLO dla domyślnego hosta. Zaostrz je, jeśli chcesz zatwierdzeń.

Lokalny skrót:

```bash
openclaw exec-policy preset yolo
```

Ten lokalny skrót aktualizuje razem zarówno żądaną lokalną konfigurację `tools.exec.*`,
jak i lokalne domyślne ustawienia zatwierdzeń. Jest równoważny pod względem intencji ręcznej
dwuetapowej konfiguracji powyżej, ale tylko dla maszyny lokalnej.

## Pomocniki listy dozwolonych

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Typowe opcje

`get`, `set` oraz `allowlist add|remove` obsługują wszystkie:

- `--node <id|name|ip>`
- `--gateway`
- współdzielone opcje RPC dla Node: `--url`, `--token`, `--timeout`, `--json`

Uwagi dotyczące kierowania:

- brak flag celu oznacza lokalny plik zatwierdzeń na dysku
- `--gateway` kieruje do pliku zatwierdzeń hosta Gateway
- `--node` kieruje do jednego hosta Node po rozpoznaniu identyfikatora, nazwy, IP lub prefiksu identyfikatora

`allowlist add|remove` obsługuje również:

- `--agent <id>` (domyślnie `*`)

## Uwagi

- `--node` używa tego samego resolvera co `openclaw nodes` (id, name, ip lub prefiks id).
- `--agent` domyślnie ma wartość `"*"`, która dotyczy wszystkich agentów.
- Host Node musi udostępniać `system.execApprovals.get/set` (aplikacja macOS lub bezgłowy host Node).
- Pliki zatwierdzeń są przechowywane osobno dla każdego hosta w `~/.openclaw/exec-approvals.json`.
