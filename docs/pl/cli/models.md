---
read_when:
    - Chcesz zmienić domyślne modele lub zobaczyć stan auth providera
    - Chcesz przeskanować dostępne modele/providerów i debugować profile auth
summary: Dokumentacja referencyjna CLI dla `openclaw models` (status/list/set/scan, aliasy, fallbacki, auth)
title: Modele
x-i18n:
    generated_at: "2026-04-26T11:26:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5acf5972251ee7aa22d1f9222f1a497822fb1f25f29f827702f8b37dda8dadf
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Wykrywanie modeli, skanowanie i konfiguracja (domyślny model, fallbacki, profile auth).

Powiązane:

- Providerzy + modele: [Modele](/pl/providers/models)
- Koncepcje wyboru modelu + polecenie slash `/models`: [Koncepcja modeli](/pl/concepts/models)
- Konfiguracja auth providera: [Pierwsze kroki](/pl/start/getting-started)

## Typowe polecenia

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` pokazuje rozstrzygnięte wartości domyślne/fallbacki oraz przegląd auth.
Gdy dostępne są snapshoty użycia providera, sekcja statusu OAuth/klucza API zawiera
okna użycia providera i snapshoty limitów.
Obecni providerzy okien użycia: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi i z.ai. Auth użycia pochodzi z hooków specyficznych dla providera,
gdy są dostępne; w przeciwnym razie OpenClaw wraca do dopasowywania poświadczeń
OAuth/klucza API z profili auth, env lub konfiguracji.
W wyjściu `--json` `auth.providers` to przegląd providerów uwzględniający
env/config/store, natomiast `auth.oauth` to tylko stan zdrowia profili auth-store.
Dodaj `--probe`, aby uruchomić aktywne testy auth dla każdego skonfigurowanego profilu providera.
Testy to prawdziwe żądania (mogą zużywać tokeny i wywoływać limity zapytań).
Użyj `--agent <id>`, aby sprawdzić stan modelu/auth skonfigurowanego agenta. Jeśli pominięto,
polecenie używa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, jeśli są ustawione, w przeciwnym razie
skonfigurowanego domyślnego agenta.
Wiersze testów mogą pochodzić z profili auth, poświadczeń env lub `models.json`.

Uwagi:

- `models set <model-or-alias>` akceptuje `provider/model` lub alias.
- `models list` jest tylko do odczytu: odczytuje konfigurację, profile auth, istniejący stan katalogu
  oraz wiersze katalogu należące do providera, ale nie przepisuje
  `models.json`.
- `models list --all --provider <id>` może uwzględniać statyczne wiersze katalogu należące do providera
  z manifestów Plugin lub dołączonych metadanych katalogu providera nawet wtedy,
  gdy nie uwierzytelniłeś się jeszcze u tego providera. Te wiersze nadal są pokazywane jako
  niedostępne, dopóki nie zostanie skonfigurowane pasujące auth.
- `models list` zachowuje rozróżnienie między natywnymi metadanymi modelu a limitami runtime. W
  wyjściu tabelarycznym `Ctx` pokazuje `contextTokens/contextWindow`, gdy efektywny limit runtime
  różni się od natywnego okna kontekstowego; wiersze JSON zawierają `contextTokens`,
  gdy provider ujawnia ten limit.
- `models list --provider <id>` filtruje po identyfikatorze providera, takim jak `moonshot` lub
  `openai-codex`. Nie akceptuje etykiet wyświetlania z interaktywnych
  selektorów providera, takich jak `Moonshot AI`.
- Referencje modeli są parsowane przez podział na **pierwszym** `/`. Jeśli identyfikator modelu zawiera `/` (w stylu OpenRouter), uwzględnij prefiks providera (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz providera, OpenClaw najpierw rozstrzyga dane wejściowe jako alias, potem
  jako unikalne dopasowanie dokładnego identyfikatora modelu do skonfigurowanego providera, a dopiero potem
  wraca do skonfigurowanego domyślnego providera z ostrzeżeniem o deprecacji.
  Jeśli ten provider nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
  wraca do pierwszego skonfigurowanego providera/modelu zamiast pokazywać
  nieaktualną wartość domyślną dla usuniętego providera.
- `models status` może pokazywać `marker(<value>)` w wyjściu auth dla niepoufnych placeholderów (na przykład `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) zamiast maskować je jako sekrety.

### `models scan`

`models scan` odczytuje publiczny katalog `:free` OpenRouter i klasyfikuje kandydatów do
użycia jako fallback. Sam katalog jest publiczny, więc skany tylko metadanych nie wymagają klucza OpenRouter.

Domyślnie OpenClaw próbuje testować obsługę narzędzi i obrazów przez aktywne wywołania modeli.
Jeśli nie skonfigurowano klucza OpenRouter, polecenie wraca do wyjścia tylko z metadanymi
i wyjaśnia, że modele `:free` nadal wymagają `OPENROUTER_API_KEY` do testów i inferencji.

Opcje:

- `--no-probe` (tylko metadane; bez odczytu konfiguracji/sekretów)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (limit czasu żądania katalogu i limit czasu pojedynczego testu)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` i `--set-image` wymagają aktywnych testów; wyniki skanu
tylko z metadanymi mają charakter informacyjny i nie są stosowane do konfiguracji.

### `models status`

Opcje:

- `--json`
- `--plain`
- `--check` (kod wyjścia 1=brak/wygasło, 2=wkrótce wygaśnie)
- `--probe` (aktywny test skonfigurowanych profili auth)
- `--probe-provider <name>` (test jednego providera)
- `--probe-profile <id>` (powtarzalne lub identyfikatory profili rozdzielone przecinkami)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (identyfikator skonfigurowanego agenta; nadpisuje `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Kategorie statusu testów:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Przypadki szczegółów testu/kodu przyczyny, których należy się spodziewać:

- `excluded_by_auth_order`: zapisany profil istnieje, ale jawne
  `auth.order.<provider>` go pominęło, więc test raportuje wykluczenie zamiast
  próbować go użyć.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil jest obecny, ale nie kwalifikuje się / nie daje się rozstrzygnąć.
- `no_model`: auth providera istnieje, ale OpenClaw nie mógł rozstrzygnąć
  modelu-kandydata odpowiedniego do testu dla tego providera.

## Aliasy + fallbacki

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profile auth

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` to interaktywny pomocnik auth. Może uruchomić przepływ auth providera
(OAuth/klucz API) albo poprowadzić do ręcznego wklejenia tokenu, zależnie od
wybranego providera.

`models auth login` uruchamia przepływ auth Pluginu providera (OAuth/klucz API). Użyj
`openclaw plugins list`, aby zobaczyć, którzy providerzy są zainstalowani.
Użyj `openclaw models auth --agent <id> <subcommand>`, aby zapisać wyniki auth do
konkretnego store skonfigurowanego agenta. Nadrzędna flaga `--agent` jest respektowana przez
`add`, `login`, `setup-token`, `paste-token` i `login-github-copilot`.

Przykłady:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Uwagi:

- `setup-token` i `paste-token` pozostają ogólnymi poleceniami tokenów dla providerów,
  którzy udostępniają metody auth oparte na tokenach.
- `setup-token` wymaga interaktywnego TTY i uruchamia metodę auth tokenu providera
  (domyślnie metodę `setup-token` tego providera, jeśli ją udostępnia).
- `paste-token` akceptuje ciąg tokenu wygenerowany gdzie indziej lub przez automatyzację.
- `paste-token` wymaga `--provider`, prosi o wartość tokenu i zapisuje
  ją do domyślnego identyfikatora profilu `<provider>:manual`, chyba że podasz
  `--profile-id`.
- `paste-token --expires-in <duration>` zapisuje bezwzględny czas wygaśnięcia tokenu na podstawie
  względnego czasu trwania, takiego jak `365d` lub `12h`.
- Uwaga dotycząca Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest znów dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- `setup-token` / `paste-token` dla Anthropic nadal pozostają obsługiwaną ścieżką tokenową OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Powiązane

- [Dokumentacja referencyjna CLI](/pl/cli)
- [Wybór modelu](/pl/concepts/model-providers)
- [Failover modeli](/pl/concepts/model-failover)
