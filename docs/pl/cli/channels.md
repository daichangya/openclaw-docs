---
read_when:
    - Chcesz dodać/usunąć konta kanałów (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Chcesz sprawdzić stan kanału lub śledzić logi kanału
summary: Dokumentacja CLI dla `openclaw channels` (konta, status, logowanie/wylogowanie, logi)
title: Kanały
x-i18n:
    generated_at: "2026-04-26T12:24:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73c44ccac8996d2700d8c912d29e1ea08898128427ae10ff2e35b6ed422e45d1
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Zarządzaj kontami kanałów czatu i ich stanem działania w Gateway.

Powiązana dokumentacja:

- Przewodniki po kanałach: [Kanały](/pl/channels/index)
- Konfiguracja Gateway: [Konfiguracja](/pl/gateway/configuration)

## Typowe polecenia

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Status / capabilities / resolve / logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (tylko z `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` to ścieżka na żywo: przy osiągalnym Gateway uruchamia dla każdego konta
sprawdzenia `probeAccount` oraz opcjonalnie `auditAccount`, więc dane wyjściowe mogą zawierać stan
transportu oraz wyniki sprawdzeń, takie jak `works`, `probe failed`, `audit ok` lub `audit failed`.
Jeśli Gateway jest nieosiągalny, `channels status` przechodzi na podsumowania oparte wyłącznie na konfiguracji
zamiast danych wyjściowych z aktywnego sprawdzania.

## Dodawanie / usuwanie kont

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Wskazówka: `openclaw channels add --help` pokazuje flagi specyficzne dla danego kanału (token, klucz prywatny, token aplikacji, ścieżki signal-cli itp.).

Typowe nieinteraktywne powierzchnie dodawania obejmują:

- kanały z tokenem bota: `--token`, `--bot-token`, `--app-token`, `--token-file`
- pola transportu Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- pola Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- pola Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- pola Nostr: `--private-key`, `--relay-urls`
- pola Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` dla uwierzytelniania domyślnego konta opartego na zmiennych środowiskowych, jeśli jest obsługiwane

Jeśli Plugin kanału musi zostać zainstalowany podczas polecenia dodawania sterowanego flagami, OpenClaw używa domyślnego źródła instalacji danego kanału bez otwierania interaktywnego monitu instalacji Pluginu.

Gdy uruchomisz `openclaw channels add` bez flag, interaktywny kreator może zapytać o:

- identyfikatory kont dla wybranego kanału
- opcjonalne nazwy wyświetlane dla tych kont
- `Bind configured channel accounts to agents now?`

Jeśli potwierdzisz powiązanie teraz, kreator zapyta, który agent ma być właścicielem każdego skonfigurowanego konta kanału, i zapisze powiązania routingu w zakresie konta.

Tymi samymi regułami routingu możesz też zarządzać później za pomocą `openclaw agents bindings`, `openclaw agents bind` i `openclaw agents unbind` (zobacz [agents](/pl/cli/agents)).

Gdy dodajesz konto inne niż domyślne do kanału, który nadal używa ustawień najwyższego poziomu dla pojedynczego konta, OpenClaw promuje wartości najwyższego poziomu o zakresie konta do mapy kont kanału przed zapisaniem nowego konta. W większości kanałów te wartości trafiają do `channels.<channel>.accounts.default`, ale wbudowane kanały mogą zamiast tego zachować istniejące pasujące promowane konto. Matrix jest obecnie takim przykładem: jeśli jedno nazwane konto już istnieje albo `defaultAccount` wskazuje istniejące nazwane konto, promowanie zachowuje to konto zamiast tworzyć nowe `accounts.default`.

Zachowanie routingu pozostaje spójne:

- Istniejące powiązania tylko z kanałem (bez `accountId`) nadal pasują do konta domyślnego.
- `channels add` nie tworzy automatycznie ani nie przepisuje powiązań w trybie nieinteraktywnym.
- Interaktywna konfiguracja może opcjonalnie dodać powiązania o zakresie konta.

Jeśli Twoja konfiguracja już była w stanie mieszanym (obecne nazwane konta i nadal ustawione wartości najwyższego poziomu dla pojedynczego konta), uruchom `openclaw doctor --fix`, aby przenieść wartości o zakresie konta do promowanego konta wybranego dla tego kanału. W większości kanałów promowanie trafia do `accounts.default`; Matrix może zachować istniejący nazwany/domyślny cel zamiast tego.

## Logowanie / wylogowanie (interaktywne)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Uwagi:

- `channels login` obsługuje `--verbose`.
- `channels login` / `logout` mogą wywnioskować kanał, gdy skonfigurowano tylko jeden obsługiwany cel logowania.

## Rozwiązywanie problemów

- Uruchom `openclaw status --deep`, aby wykonać szerokie sprawdzenie.
- Użyj `openclaw doctor`, aby przejść przez sugerowane naprawy.
- `openclaw channels list` wypisuje `Claude: HTTP 403 ... user:profile` → migawka użycia wymaga zakresu `user:profile`. Użyj `--no-usage`, podaj klucz sesji claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) albo ponownie uwierzytelnij się przez Claude CLI.
- `openclaw channels status` przechodzi na podsumowania oparte wyłącznie na konfiguracji, gdy Gateway jest nieosiągalny. Jeśli poświadczenie obsługiwanego kanału jest skonfigurowane przez SecretRef, ale niedostępne w bieżącej ścieżce polecenia, zgłasza to konto jako skonfigurowane z uwagami o stanie pogorszonym zamiast pokazywać je jako nieskonfigurowane.

## Sprawdzanie capabilities

Pobierz wskazówki dotyczące capabilities dostawcy (intents/scopes, jeśli są dostępne) oraz statyczną obsługę funkcji:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Uwagi:

- `--channel` jest opcjonalne; pomiń je, aby wyświetlić każdy kanał (w tym rozszerzenia).
- `--account` jest prawidłowe tylko z `--channel`.
- `--target` akceptuje `channel:<id>` lub surowy numeryczny identyfikator kanału i dotyczy tylko Discord.
- Sprawdzenia są specyficzne dla dostawcy: Discord intents + opcjonalne uprawnienia kanału; Slack scopes bota i użytkownika; flagi bota Telegram i Webhook; wersja demona Signal; token aplikacji Microsoft Teams + role/scopes Graph (z adnotacjami tam, gdzie to znane). Kanały bez sprawdzeń raportują `Probe: unavailable`.

## Rozwiązywanie nazw na identyfikatory

Rozwiązuj nazwy kanałów/użytkowników na identyfikatory za pomocą katalogu dostawcy:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Uwagi:

- Użyj `--kind user|group|auto`, aby wymusić typ celu.
- Rozwiązywanie preferuje aktywne dopasowania, gdy wiele wpisów ma tę samą nazwę.
- `channels resolve` działa tylko do odczytu. Jeśli wybrane konto jest skonfigurowane przez SecretRef, ale to poświadczenie jest niedostępne w bieżącej ścieżce polecenia, polecenie zwraca pogorszone nierozwiązane wyniki z uwagami zamiast przerywać całe wykonanie.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Przegląd kanałów](/pl/channels)
