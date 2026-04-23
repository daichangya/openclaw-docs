---
read_when:
    - Chcesz uruchomić jedną turę agenta ze skryptów (opcjonalnie dostarczyć odpowiedź)
summary: Dokumentacja CLI dla `openclaw agent` (wyślij jedną turę agenta przez Gateway)
title: agent
x-i18n:
    generated_at: "2026-04-23T09:57:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ba3181d74e9a8d6d607ee62b18e1e6fd693e64e7789e6b29b7f7b1ccb7b69d0
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Uruchom turę agenta przez Gateway (użyj `--local` dla trybu osadzonego).
Użyj `--agent <id>`, aby kierować bezpośrednio do skonfigurowanego agenta.

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
- `--agent <id>`: identyfikator agenta; zastępuje powiązania routingu
- `--thinking <level>`: poziom myślenia agenta (`off`, `minimal`, `low`, `medium`, `high` oraz niestandardowe poziomy obsługiwane przez dostawcę, takie jak `xhigh`, `adaptive` lub `max`)
- `--verbose <on|off>`: utrwal poziom verbose dla sesji
- `--channel <channel>`: kanał dostarczenia; pomiń, aby użyć głównego kanału sesji
- `--reply-to <target>`: nadpisanie celu dostarczenia
- `--reply-channel <channel>`: nadpisanie kanału dostarczenia
- `--reply-account <id>`: nadpisanie konta dostarczenia
- `--local`: uruchom osadzonego agenta bezpośrednio (po wstępnym załadowaniu rejestru Pluginów)
- `--deliver`: wyślij odpowiedź z powrotem do wybranego kanału/celu
- `--timeout <seconds>`: nadpisz limit czasu agenta (domyślnie 600 lub wartość z konfiguracji)
- `--json`: wyjście w formacie JSON

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

- Tryb Gateway przełącza się awaryjnie na osadzonego agenta, gdy żądanie do Gateway zakończy się niepowodzeniem. Użyj `--local`, aby od razu wymusić wykonanie osadzone.
- `--local` nadal najpierw wstępnie ładuje rejestr Pluginów, dzięki czemu dostawcy, narzędzia i kanały dostarczane przez Pluginy pozostają dostępne podczas uruchomień osadzonych.
- `--channel`, `--reply-channel` i `--reply-account` wpływają na dostarczanie odpowiedzi, a nie na routing sesji.
- Gdy to polecenie wywołuje regenerację `models.json`, poświadczenia dostawców zarządzane przez SecretRef są zapisywane jako znaczniki niebędące sekretami (na przykład nazwy zmiennych środowiskowych, `secretref-env:ENV_VAR_NAME` lub `secretref-managed`), a nie jako rozwiązany jawny tekst sekretu.
- Zapisy znaczników są źródłowo autorytatywne: OpenClaw zapisuje znaczniki z aktywnego źródłowego snapshotu konfiguracji, a nie z rozwiązanych wartości sekretów środowiska wykonawczego.
