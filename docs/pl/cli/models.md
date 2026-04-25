---
read_when:
    - Chcesz zmienić domyślne modele lub sprawdzić status autoryzacji dostawcy
    - Chcesz przeskanować dostępne modele/dostawców i debugować profile autoryzacji
summary: Dokumentacja CLI dla `openclaw models` (status/list/set/scan, aliasy, fallbacki, autoryzacja)
title: Modele
x-i18n:
    generated_at: "2026-04-25T13:44:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c8040159e23789221357dd60232012759ee540ebfd3e5d192a0a09419d40c9a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Wykrywanie modeli, skanowanie i konfiguracja (model domyślny, fallbacki, profile autoryzacji).

Powiązane:

- Dostawcy + modele: [Modele](/pl/providers/models)
- Pojęcia związane z wyborem modelu + polecenie slash `/models`: [Pojęcie modeli](/pl/concepts/models)
- Konfiguracja autoryzacji dostawcy: [Pierwsze kroki](/pl/start/getting-started)

## Typowe polecenia

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` pokazuje rozstrzygnięty model domyślny/fallbacki oraz przegląd autoryzacji.
Gdy dostępne są migawki użycia dostawcy, sekcja statusu OAuth/klucza API zawiera
okna użycia dostawcy i migawki limitów.
Obecni dostawcy z oknami użycia: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi i z.ai. Autoryzacja użycia pochodzi z haków specyficznych
dla dostawcy, gdy są dostępne; w przeciwnym razie OpenClaw wraca do dopasowania poświadczeń
OAuth/klucza API z profili autoryzacji, env lub config.
W wyjściu `--json` `auth.providers` jest przeglądem dostawców
uwzględniającym env/config/store, natomiast `auth.oauth` obejmuje wyłącznie stan profili w auth-store.
Dodaj `--probe`, aby uruchomić aktywne sondy autoryzacji dla każdego skonfigurowanego profilu dostawcy.
Sondy są rzeczywistymi żądaniami (mogą zużywać tokeny i wywoływać limity żądań).
Użyj `--agent <id>`, aby sprawdzić stan modelu/autoryzacji skonfigurowanego agenta. Gdy opcja jest pominięta,
polecenie używa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, jeśli są ustawione, w przeciwnym razie
używa skonfigurowanego agenta domyślnego.
Wiersze sond mogą pochodzić z profili autoryzacji, poświadczeń env lub `models.json`.

Uwagi:

- `models set <model-or-alias>` akceptuje `provider/model` albo alias.
- `models list` jest tylko do odczytu: odczytuje config, profile autoryzacji, istniejący stan katalogu
  oraz wiersze katalogu należące do dostawcy, ale nie przepisuje
  `models.json`.
- `models list --all` obejmuje dołączone statyczne wiersze katalogu należące do dostawcy nawet
  wtedy, gdy nie uwierzytelniłeś się jeszcze u tego dostawcy. Te wiersze nadal są oznaczone
  jako niedostępne, dopóki nie zostanie skonfigurowana pasująca autoryzacja.
- `models list` zachowuje rozdział między natywnymi metadanymi modelu a limitami środowiska wykonawczego. W wyjściu
  tabelarycznym `Ctx` pokazuje `contextTokens/contextWindow`, gdy efektywny limit środowiska wykonawczego
  różni się od natywnego okna kontekstu; wiersze JSON zawierają `contextTokens`,
  gdy dostawca udostępnia ten limit.
- `models list --provider <id>` filtruje według identyfikatora dostawcy, takiego jak `moonshot` lub
  `openai-codex`. Nie akceptuje etykiet wyświetlanych przez interaktywne
  selektory dostawców, takich jak `Moonshot AI`.
- Referencje modeli są parsowane przez podział na **pierwszym** znaku `/`. Jeśli identyfikator modelu zawiera `/` (styl OpenRouter), dołącz prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw najpierw rozwiązuje dane wejściowe jako alias, następnie
  jako unikalne dopasowanie dokładnego identyfikatora modelu wśród skonfigurowanych dostawców, a dopiero potem
  wraca do skonfigurowanego dostawcy domyślnego z ostrzeżeniem o wycofaniu.
  Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
  wraca do pierwszego skonfigurowanego dostawcy/modelu zamiast zgłaszać
  nieaktualny domyślny model usuniętego dostawcy.
- `models status` może pokazywać `marker(<value>)` w wyjściu autoryzacji dla niebędących sekretami placeholderów (na przykład `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) zamiast maskować je jako sekrety.

### `models scan`

`models scan` odczytuje publiczny katalog `:free` z OpenRouter i szereguje kandydatów do użycia
jako fallback. Sam katalog jest publiczny, więc skany tylko metadanych nie wymagają klucza OpenRouter.

Domyślnie OpenClaw próbuje sondować obsługę narzędzi i obrazów za pomocą aktywnych wywołań modeli.
Jeśli nie skonfigurowano klucza OpenRouter, polecenie wraca do wyjścia tylko z metadanymi i wyjaśnia,
że modele `:free` nadal wymagają `OPENROUTER_API_KEY` do sond i inferencji.

Opcje:

- `--no-probe` (tylko metadane; bez wyszukiwania config/sekretów)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (limit czasu żądania katalogu i każdej sondy)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` i `--set-image` wymagają aktywnych sond; wyniki skanu tylko metadanych
mają charakter informacyjny i nie są stosowane do config.

### `models status`

Opcje:

- `--json`
- `--plain`
- `--check` (kod wyjścia 1=brak/wygasłe, 2=wygasające)
- `--probe` (aktywna sonda skonfigurowanych profili autoryzacji)
- `--probe-provider <name>` (sonduj jednego dostawcę)
- `--probe-profile <id>` (powtarzalne lub identyfikatory profili rozdzielone przecinkami)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (identyfikator skonfigurowanego agenta; nadpisuje `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Kategorie statusu sond:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Przypadki szczegółów/kodów przyczyn sond, których należy się spodziewać:

- `excluded_by_auth_order`: istnieje zapisany profil, ale jawne
  `auth.order.<provider>` go pominęło, więc sonda zgłasza wykluczenie zamiast
  próbować go użyć.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil jest obecny, ale nie kwalifikuje się / nie daje się rozwiązać.
- `no_model`: autoryzacja dostawcy istnieje, ale OpenClaw nie mógł rozwiązać
  kandydata modelu możliwego do sondowania dla tego dostawcy.

## Aliasy + fallbacki

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profile autoryzacji

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` to interaktywny pomocnik autoryzacji. Może uruchomić przepływ autoryzacji dostawcy
(OAuth/klucz API) albo przeprowadzić Cię przez ręczne wklejenie tokenu, zależnie od
wybranego dostawcy.

`models auth login` uruchamia przepływ autoryzacji Plugin dostawcy (OAuth/klucz API). Użyj
`openclaw plugins list`, aby zobaczyć, którzy dostawcy są zainstalowani.

Przykłady:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Uwagi:

- `setup-token` i `paste-token` pozostają ogólnymi poleceniami tokenów dla dostawców,
  którzy udostępniają metody autoryzacji tokenem.
- `setup-token` wymaga interaktywnego TTY i uruchamia metodę autoryzacji tokenem dostawcy
  (domyślnie metodę `setup-token` tego dostawcy, jeśli ją udostępnia).
- `paste-token` akceptuje ciąg tokenu wygenerowany gdzie indziej lub przez automatyzację.
- `paste-token` wymaga `--provider`, prosi o wartość tokenu i zapisuje
  ją w domyślnym identyfikatorze profilu `<provider>:manual`, chyba że przekażesz
  `--profile-id`.
- `paste-token --expires-in <duration>` zapisuje bezwzględny termin wygaśnięcia tokenu na podstawie
  względnego czasu trwania, takiego jak `365d` lub `12h`.
- Uwaga dotycząca Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- `setup-token` / `paste-token` dla Anthropic pozostają dostępne jako obsługiwana ścieżka tokenowa OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wybór modelu](/pl/concepts/model-providers)
- [Failover modeli](/pl/concepts/model-failover)
