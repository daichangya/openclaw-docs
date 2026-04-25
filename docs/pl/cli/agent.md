---
read_when:
    - Chcesz uruchomić jedną turę agenta ze skryptów (opcjonalnie dostarczyć odpowiedź)
summary: Dokumentacja CLI dla `openclaw agent` (wyślij jedną turę agenta przez Gateway)
title: Agent
x-i18n:
    generated_at: "2026-04-25T13:43:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: e06681ffbed56cb5be05c7758141e784eac8307ed3c6fc973f71534238b407e1
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Uruchom turę agenta przez Gateway (użyj `--local` dla trybu osadzonego).
Użyj `--agent <id>`, aby bezpośrednio wskazać skonfigurowanego agenta.

Przekaż co najmniej jeden selektor sesji:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Powiązane:

- Narzędzie wysyłania agenta: [Agent send](/pl/tools/agent-send)

## Opcje

- `-m, --message <text>`: wymagane ciało wiadomości
- `-t, --to <dest>`: odbiorca używany do wyprowadzenia klucza sesji
- `--session-id <id>`: jawny identyfikator sesji
- `--agent <id>`: identyfikator agenta; nadpisuje powiązania routingu
- `--thinking <level>`: poziom myślenia agenta (`off`, `minimal`, `low`, `medium`, `high` oraz obsługiwane przez dostawcę niestandardowe poziomy, takie jak `xhigh`, `adaptive` lub `max`)
- `--verbose <on|off>`: utrwala poziom verbose dla sesji
- `--channel <channel>`: kanał dostarczenia; pomiń, aby użyć kanału głównej sesji
- `--reply-to <target>`: nadpisanie celu dostarczenia
- `--reply-channel <channel>`: nadpisanie kanału dostarczenia
- `--reply-account <id>`: nadpisanie konta dostarczenia
- `--local`: uruchamia osadzonego agenta bezpośrednio (po wstępnym załadowaniu rejestru Plugin)
- `--deliver`: wysyła odpowiedź z powrotem do wybranego kanału/celu
- `--timeout <seconds>`: nadpisuje limit czasu agenta (domyślnie 600 lub wartość z konfiguracji)
- `--json`: zwraca JSON

## Przykłady

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Uwagi

- Tryb Gateway wraca do osadzonego agenta, gdy żądanie do Gateway zakończy się niepowodzeniem. Użyj `--local`, aby od razu wymusić wykonanie osadzone.
- `--local` nadal najpierw wstępnie ładuje rejestr Plugin, więc dostawcy, narzędzia i kanały dostarczane przez Plugin pozostają dostępne podczas uruchomień osadzonych.
- Każde wywołanie `openclaw agent` jest traktowane jako jednorazowe uruchomienie. Dołączone lub skonfigurowane przez użytkownika serwery MCP otwarte dla tego uruchomienia są wycofywane po odpowiedzi, nawet gdy polecenie używa ścieżki Gateway, więc procesy potomne stdio MCP nie pozostają aktywne między wywołaniami ze skryptów.
- `--channel`, `--reply-channel` i `--reply-account` wpływają na dostarczenie odpowiedzi, a nie na routing sesji.
- `--json` zachowuje stdout wyłącznie dla odpowiedzi JSON. Diagnostyka Gateway, Plugin i osadzonego trybu awaryjnego jest kierowana do stderr, aby skrypty mogły bezpośrednio parsować stdout.
- Gdy to polecenie wyzwala regenerację `models.json`, poświadczenia dostawcy zarządzane przez SecretRef są utrwalane jako znaczniki niebędące sekretami (na przykład nazwy zmiennych środowiskowych, `secretref-env:ENV_VAR_NAME` lub `secretref-managed`), a nie jako rozwiązany jawny tekst sekretu.
- Zapisy znaczników są autorytatywne względem źródła: OpenClaw utrwala znaczniki z aktywnego migawkowego źródła konfiguracji, a nie z rozwiązanych wartości sekretów w środowisku wykonawczym.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Środowisko wykonawcze agenta](/pl/concepts/agent)
