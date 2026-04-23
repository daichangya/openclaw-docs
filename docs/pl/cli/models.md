---
read_when:
    - Chcesz zmienić domyślne modele lub sprawdzić stan uwierzytelniania dostawcy
    - Chcesz przeskanować dostępne modele/dostawców i debugować profile uwierzytelniania
summary: Dokumentacja CLI dla `openclaw models` (status/list/set/scan, aliasy, wartości zapasowe, uwierzytelnianie)
title: modele
x-i18n:
    generated_at: "2026-04-23T09:59:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4ba72ca8acb7cc31796c119fce3816e6a919eb28a4ed4b03664d3b222498f5a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Wykrywanie modeli, skanowanie i konfiguracja (model domyślny, wartości zapasowe, profile uwierzytelniania).

Powiązane:

- Dostawcy + modele: [Modele](/pl/providers/models)
- Koncepcje wyboru modelu + polecenie slash `/models`: [Koncepcja modeli](/pl/concepts/models)
- Konfiguracja uwierzytelniania dostawcy: [Pierwsze kroki](/pl/start/getting-started)

## Typowe polecenia

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` pokazuje rozpoznany model domyślny/wartości zapasowe oraz przegląd uwierzytelniania.
Gdy dostępne są migawki użycia dostawcy, sekcja stanu OAuth/klucza API zawiera
okna użycia dostawcy i migawki limitów.
Dostawcy z bieżącymi oknami użycia: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi i z.ai. Uwierzytelnianie użycia pochodzi z hooków
specyficznych dla dostawcy, gdy są dostępne; w przeciwnym razie OpenClaw wraca do dopasowywania poświadczeń OAuth/klucza API
z profili uwierzytelniania, środowiska lub konfiguracji.
W wyjściu `--json` `auth.providers` to przegląd dostawców uwzględniający
środowisko/konfigurację/magazyn, a `auth.oauth` to tylko stan profili magazynu uwierzytelniania.
Dodaj `--probe`, aby uruchomić rzeczywiste sondy uwierzytelniania względem każdego skonfigurowanego profilu dostawcy.
Sondy są prawdziwymi żądaniami (mogą zużywać tokeny i wywoływać ograniczenia szybkości).
Użyj `--agent <id>`, aby sprawdzić stan modelu/uwierzytelniania skonfigurowanego agenta. Gdy opcja jest pominięta,
polecenie używa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, jeśli są ustawione, w przeciwnym razie
skonfigurowanego agenta domyślnego.
Wiersze sond mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub `models.json`.

Uwagi:

- `models set <model-or-alias>` akceptuje `provider/model` lub alias.
- `models list --all` zawiera dołączone statyczne wiersze katalogu należące do dostawcy, nawet
  jeśli nie uwierzytelniłeś się jeszcze u tego dostawcy. Te wiersze nadal będą pokazywane
  jako niedostępne, dopóki nie zostanie skonfigurowane pasujące uwierzytelnianie.
- `models list --provider <id>` filtruje po identyfikatorze dostawcy, takim jak `moonshot` lub
  `openai-codex`. Nie akceptuje etykiet wyświetlanych z interaktywnych selektorów dostawców,
  takich jak `Moonshot AI`.
- Odwołania do modeli są parsowane przez podział według **pierwszego** `/`. Jeśli identyfikator modelu zawiera `/` (styl OpenRouter), dołącz prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw najpierw rozpoznaje dane wejściowe jako alias, a następnie
  jako unikalne dopasowanie dokładnego identyfikatora modelu wśród skonfigurowanych dostawców, i dopiero potem
  wraca do skonfigurowanego dostawcy domyślnego z ostrzeżeniem o przestarzałości.
  Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
  wraca do pierwszego skonfigurowanego dostawcy/modelu zamiast pokazywać
  nieaktualną wartość domyślną usuniętego dostawcy.
- `models status` może pokazywać `marker(<value>)` w wyjściu uwierzytelniania dla niebędących sekretami placeholderów (na przykład `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) zamiast maskować je jako sekrety.

### `models status`

Opcje:

- `--json`
- `--plain`
- `--check` (kod wyjścia 1=brak/wygasło, 2=wygasa)
- `--probe` (rzeczywista sonda skonfigurowanych profili uwierzytelniania)
- `--probe-provider <name>` (sonduj jednego dostawcę)
- `--probe-profile <id>` (powtarzalne lub profile rozdzielone przecinkami)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (identyfikator skonfigurowanego agenta; nadpisuje `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Kategorie stanu sond:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Przypadki szczegółów/kodów przyczyn sond, których można się spodziewać:

- `excluded_by_auth_order`: istnieje zapisany profil, ale jawne
  `auth.order.<provider>` go pominęło, więc sonda zgłasza wykluczenie zamiast
  próbować go użyć.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil jest obecny, ale nie kwalifikuje się / nie można go rozpoznać.
- `no_model`: istnieje uwierzytelnianie dostawcy, ale OpenClaw nie mógł rozpoznać
  kandydata modelu nadającego się do sondowania dla tego dostawcy.

## Aliasy + wartości zapasowe

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profile uwierzytelniania

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` to interaktywny pomocnik uwierzytelniania. Może uruchomić przepływ uwierzytelniania dostawcy
(OAuth/klucz API) albo poprowadzić Cię do ręcznego wklejenia tokenu, zależnie od wybranego
dostawcy.

`models auth login` uruchamia przepływ uwierzytelniania plugin dostawcy (OAuth/klucz API). Użyj
`openclaw plugins list`, aby zobaczyć, którzy dostawcy są zainstalowani.

Przykłady:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Uwagi:

- `setup-token` i `paste-token` pozostają ogólnymi poleceniami tokenów dla dostawców,
  którzy udostępniają metody uwierzytelniania tokenem.
- `setup-token` wymaga interaktywnego TTY i uruchamia metodę uwierzytelniania tokenem dostawcy
  (domyślnie jego metodę `setup-token`, jeśli ją udostępnia).
- `paste-token` akceptuje ciąg tokenu wygenerowany gdzie indziej lub przez automatyzację.
- `paste-token` wymaga `--provider`, prosi o wartość tokenu i zapisuje
  ją do domyślnego identyfikatora profilu `<provider>:manual`, chyba że podasz
  `--profile-id`.
- `paste-token --expires-in <duration>` zapisuje bezwzględny czas wygaśnięcia tokenu na podstawie
  względnego czasu trwania, takiego jak `365d` lub `12h`.
- Uwaga dotycząca Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest znów dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- `setup-token` / `paste-token` dla Anthropic pozostają dostępną obsługiwaną ścieżką tokenów OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
