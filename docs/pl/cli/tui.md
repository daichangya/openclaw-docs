---
read_when:
    - Chcesz terminalowego interfejsu użytkownika dla Gatewaya (przyjaznego dla pracy zdalnej)
    - Chcesz przekazywać url/token/session ze skryptów
    - Chcesz uruchomić TUI w lokalnym trybie osadzonym bez Gatewaya
    - Chcesz używać `openclaw chat` lub `openclaw tui --local`
summary: Dokumentacja CLI dla `openclaw tui` (terminalowy interfejs użytkownika oparty na Gatewayu lub lokalnie osadzony)
title: tui
x-i18n:
    generated_at: "2026-04-23T09:59:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fca025a15f5e985ca6f2eaf39fcbe784bd716f24841f43450b71936db26d141
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Otwórz terminalowy interfejs użytkownika połączony z Gatewayem albo uruchom go w lokalnym trybie osadzonym.

Powiązane:

- Przewodnik po TUI: [TUI](/pl/web/tui)

Uwagi:

- `chat` i `terminal` to aliasy dla `openclaw tui --local`.
- `--local` nie można łączyć z `--url`, `--token` ani `--password`.
- `tui` rozwiązuje skonfigurowane SecretRefs uwierzytelniania Gatewaya dla uwierzytelniania tokenem/hasłem, gdy to możliwe (dostawcy `env`/`file`/`exec`).
- Po uruchomieniu z wnętrza katalogu workspace skonfigurowanego agenta TUI automatycznie wybiera tego agenta jako domyślny klucz sesji (chyba że `--session` jawnie ustawiono na `agent:<id>:...`).
- Tryb lokalny używa bezpośrednio osadzonego runtime agenta. Większość lokalnych narzędzi działa, ale funkcje dostępne tylko w Gatewayu są niedostępne.
- Tryb lokalny dodaje `/auth [provider]` wewnątrz powierzchni komend TUI.
- Bramki zatwierdzania plugin nadal obowiązują w trybie lokalnym. Narzędzia wymagające zatwierdzenia wyświetlają monit o decyzję w terminalu; nic nie jest automatycznie zatwierdzane po cichu, ponieważ Gateway nie bierze udziału.

## Przykłady

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Pętla naprawy configu

Użyj trybu lokalnego, gdy bieżący config już przechodzi walidację i chcesz, aby
osadzony agent sprawdził go, porównał z dokumentacją i pomógł go naprawić
z tego samego terminala:

Jeśli `openclaw config validate` już kończy się błędem, najpierw użyj `openclaw configure` lub
`openclaw doctor --fix`. `openclaw chat` nie omija ochrony przed nieprawidłowym
configiem.

```bash
openclaw chat
```

Następnie w TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Zastosuj precyzyjne poprawki za pomocą `openclaw config set` lub `openclaw configure`, a następnie
ponownie uruchom `openclaw config validate`. Zobacz [TUI](/pl/web/tui) i [Config](/pl/cli/config).
