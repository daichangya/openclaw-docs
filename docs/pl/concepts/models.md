---
read_when:
    - Dodawanie lub modyfikowanie CLI modeli (models list/set/scan/aliases/fallbacks)
    - Zmiana zachowania fallbacku modelu lub UX wyboru.
    - Aktualizowanie testów skanowania modeli (narzędzia/obrazy)
summary: 'CLI modeli: list, set, aliasy, fallbacki, skanowanie, status'
title: CLI modeli
x-i18n:
    generated_at: "2026-04-25T13:45:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 370453529596e87e724c4de7d2ae9d20334c29393116059bc01363b47c017d5d
    source_path: concepts/models.md
    workflow: 15
---

Zobacz [/concepts/model-failover](/pl/concepts/model-failover), aby poznać rotację
profili auth, cooldowny i to, jak współgra to z fallbackami.
Szybki przegląd dostawców + przykłady: [/concepts/model-providers](/pl/concepts/model-providers).
Referencje modeli wybierają dostawcę i model. Zwykle nie wybierają
niskopoziomowego runtime’u agenta. Na przykład `openai/gpt-5.5` może działać przez
zwykłą ścieżkę dostawcy OpenAI albo przez runtime serwera aplikacji Codex, zależnie
od `agents.defaults.embeddedHarness.runtime`. Zobacz
[/concepts/agent-runtimes](/pl/concepts/agent-runtimes).

## Jak działa wybór modelu

OpenClaw wybiera modele w tej kolejności:

1. **Główny** model (`agents.defaults.model.primary` lub `agents.defaults.model`).
2. **Fallbacki** w `agents.defaults.model.fallbacks` (w kolejności).
3. **Failover auth dostawcy** zachodzi wewnątrz dostawcy przed przejściem do
   następnego modelu.

Powiązane:

- `agents.defaults.models` to allowlista/katalog modeli, których OpenClaw może używać (plus aliasy).
- `agents.defaults.imageModel` jest używany **tylko wtedy**, gdy główny model nie może przyjmować obrazów.
- `agents.defaults.pdfModel` jest używany przez narzędzie `pdf`. Jeśli go brak,
  narzędzie przechodzi fallbackiem do `agents.defaults.imageModel`, a następnie do rozpoznanego modelu sesji/dom yślnego.
- `agents.defaults.imageGenerationModel` jest używany przez współdzieloną funkcję generowania obrazów. Jeśli go brak, `image_generate` nadal może wywnioskować domyślny dostawca oparty na auth. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretny dostawca/model, skonfiguruj też auth/klucz API tego dostawcy.
- `agents.defaults.musicGenerationModel` jest używany przez współdzieloną funkcję generowania muzyki. Jeśli go brak, `music_generate` nadal może wywnioskować domyślny dostawca oparty na auth. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania muzyki w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretny dostawca/model, skonfiguruj też auth/klucz API tego dostawcy.
- `agents.defaults.videoGenerationModel` jest używany przez współdzieloną funkcję generowania wideo. Jeśli go brak, `video_generate` nadal może wywnioskować domyślny dostawca oparty na auth. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania wideo w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretny dostawca/model, skonfiguruj też auth/klucz API tego dostawcy.
- Domyślne ustawienia dla poszczególnych agentów mogą nadpisywać `agents.defaults.model` przez `agents.list[].model` oraz bindings (zobacz [/concepts/multi-agent](/pl/concepts/multi-agent)).

## Szybka polityka modeli

- Ustaw główny model na najmocniejszy model najnowszej generacji, do którego masz dostęp.
- Używaj fallbacków dla zadań wrażliwych na koszt/opóźnienie oraz czatów o mniejszej wadze.
- W przypadku agentów z włączonymi narzędziami lub niezaufanych danych wejściowych unikaj starszych/słabszych warstw modeli.

## Onboarding (zalecane)

Jeśli nie chcesz ręcznie edytować konfiguracji, uruchom onboarding:

```bash
openclaw onboard
```

Może on skonfigurować model + auth dla popularnych dostawców, w tym subskrypcję **OpenAI Code (Codex)**
(OAuth) oraz **Anthropic** (klucz API albo Claude CLI).

## Klucze konfiguracji (przegląd)

- `agents.defaults.model.primary` i `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` i `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` i `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` i `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` i `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlista + aliasy + parametry dostawcy)
- `models.providers` (niestandardowi dostawcy zapisywani do `models.json`)

Referencje modeli są normalizowane do małych liter. Aliasy dostawców, takie jak `z.ai/*`, są normalizowane
do `zai/*`.

Przykłady konfiguracji dostawców (w tym OpenCode) znajdują się w
[/providers/opencode](/pl/providers/opencode).

### Bezpieczne edycje allowlisty

Podczas ręcznego aktualizowania `agents.defaults.models` używaj zapisów addytywnych:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` chroni mapy modeli/dostawców przed przypadkowym nadpisaniem. Zwykłe
przypisanie obiektu do `agents.defaults.models`, `models.providers` lub
`models.providers.<id>.models` jest odrzucane, jeśli usunęłoby istniejące
wpisy. Użyj `--merge` dla zmian addytywnych; użyj `--replace` tylko wtedy, gdy
podana wartość ma stać się pełną wartością docelową.

Interaktywna konfiguracja dostawcy oraz `openclaw configure --section model` również scalają
wybory z zakresu dostawcy z istniejącą allowlistą, więc dodanie Codex,
Ollama lub innego dostawcy nie usuwa niepowiązanych wpisów modeli.
Configure zachowuje istniejące `agents.defaults.model.primary`, gdy auth dostawcy
jest ponownie stosowane. Jawne polecenia ustawiania domyślnych, takie jak
`openclaw models auth login --provider <id> --set-default` oraz
`openclaw models set <model>`, nadal zastępują `agents.defaults.model.primary`.

## „Model is not allowed” (i dlaczego odpowiedzi się zatrzymują)

Jeśli ustawione jest `agents.defaults.models`, staje się to **allowlistą** dla `/model` oraz dla
nadpisań sesji. Gdy użytkownik wybierze model, którego nie ma na tej allowliście,
OpenClaw zwraca:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Dzieje się to **przed** wygenerowaniem normalnej odpowiedzi, więc wiadomość może sprawiać wrażenie,
jakby „nie odpowiedziała”. Rozwiązanie polega na tym, aby:

- Dodać model do `agents.defaults.models`, albo
- Wyczyścić allowlistę (usunąć `agents.defaults.models`), albo
- Wybrać model z `/model list`.

Przykładowa konfiguracja allowlisty:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Przełączanie modeli na czacie (`/model`)

Możesz przełączać modele dla bieżącej sesji bez restartu:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Uwagi:

- `/model` (oraz `/model list`) to kompaktowy, numerowany selektor (rodzina modeli + dostępni dostawcy).
- Na Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawcy i modelu oraz krokiem Submit.
- `/models add` jest wycofane i teraz zwraca komunikat o wycofaniu zamiast rejestrować modele z czatu.
- `/model <#>` wybiera z tego selektora.
- `/model` natychmiast zapisuje nowy wybór sesji.
- Jeśli agent jest bezczynny, następne uruchomienie od razu użyje nowego modelu.
- Jeśli uruchomienie już trwa, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje do nowego modelu dopiero w czystym punkcie ponowienia.
- Jeśli aktywność narzędzi lub generowanie odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia albo do następnej tury użytkownika.
- `/model status` to widok szczegółowy (kandydaci auth oraz, jeśli skonfigurowano, `baseUrl` endpointu dostawcy + tryb `api`).
- Referencje modeli są parsowane przez podział po **pierwszym** `/`. Podczas wpisywania `/model <ref>` używaj `provider/model`.
- Jeśli sam identyfikator modelu zawiera `/` (styl OpenRouter), musisz podać prefiks dostawcy (przykład: `/model openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw rozwiązuje dane wejściowe w tej kolejności:
  1. dopasowanie aliasu
  2. unikalne dopasowanie skonfigurowanego dostawcy dla tego dokładnego identyfikatora modelu bez prefiksu
  3. wycofywany fallback do skonfigurowanego domyślnego dostawcy
     Jeśli ten dostawca nie udostępnia już skonfigurowanego domyślnego modelu, OpenClaw
     zamiast tego przechodzi fallbackiem do pierwszego skonfigurowanego dostawca/model, aby uniknąć
     pokazywania nieaktualnego domyślnego modelu z usuniętego dostawcy.

Pełne zachowanie/konfiguracja poleceń: [Slash commands](/pl/tools/slash-commands).

## Polecenia CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (bez podpolecenia) to skrót dla `models status`.

### `models list`

Domyślnie pokazuje skonfigurowane modele. Przydatne flagi:

- `--all`: pełny katalog
- `--local`: tylko lokalni dostawcy
- `--provider <id>`: filtr według identyfikatora dostawcy, na przykład `moonshot`; etykiety wyświetlane w interaktywnych selektorach nie są akceptowane
- `--plain`: jeden model w wierszu
- `--json`: wyjście czytelne maszynowo

`--all` obejmuje statyczne wiersze katalogu dołączonego i należącego do dostawcy przed skonfigurowaniem auth, więc widoki tylko do wykrywania mogą pokazywać modele, które są niedostępne, dopóki nie dodasz pasujących danych uwierzytelniających dostawcy.

### `models status`

Pokazuje rozpoznany model główny, fallbacki, model obrazu oraz przegląd auth
skonfigurowanych dostawców. Pokazuje też status wygaśnięcia OAuth dla profili znalezionych
w magazynie auth (domyślnie ostrzega w ciągu 24 h). `--plain` wypisuje tylko
rozpoznany model główny.
Status OAuth jest zawsze pokazywany (i uwzględniany w wyjściu `--json`). Jeśli skonfigurowany
dostawca nie ma danych uwierzytelniających, `models status` wypisuje sekcję **Missing auth**.
JSON zawiera `auth.oauth` (okno ostrzeżeń + profile) oraz `auth.providers`
(efektywne auth dla każdego dostawcy, w tym dane uwierzytelniające oparte na env). `auth.oauth`
dotyczy tylko kondycji profili z magazynu auth; dostawcy wyłącznie env nie pojawiają się tam.
Użyj `--check` do automatyzacji (kod wyjścia `1` przy braku/wygaszeniu, `2` przy zbliżającym się wygaśnięciu).
Użyj `--probe` do kontroli auth na żywo; wiersze testów mogą pochodzić z profili auth, danych
uwierzytelniających env albo `models.json`.
Jeśli jawne `auth.order.<provider>` pomija zapisany profil, test zgłasza
`excluded_by_auth_order` zamiast próbować go użyć. Jeśli auth istnieje, ale nie można
rozpoznać żadnego modelu testowalnego dla tego dostawcy, test zgłasza `status: no_model`.

Wybór auth zależy od dostawcy/konta. Dla zawsze włączonych hostów Gateway klucze API
są zwykle najbardziej przewidywalne; obsługiwane jest też ponowne użycie Claude CLI
oraz istniejących profili OAuth/token Anthropic.

Przykład (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Skanowanie (darmowe modele OpenRouter)

`openclaw models scan` sprawdza **katalog darmowych modeli** OpenRouter i może
opcjonalnie testować modele pod kątem obsługi narzędzi i obrazów.

Kluczowe flagi:

- `--no-probe`: pomiń testy na żywo (tylko metadane)
- `--min-params <b>`: minimalny rozmiar parametrów (miliardy)
- `--max-age-days <days>`: pomiń starsze modele
- `--provider <name>`: filtr prefiksu dostawcy
- `--max-candidates <n>`: rozmiar listy fallbacków
- `--set-default`: ustaw `agents.defaults.model.primary` na pierwszy wybór
- `--set-image`: ustaw `agents.defaults.imageModel.primary` na pierwszy wybór obrazu

Katalog OpenRouter `/models` jest publiczny, więc skany tylko metadanych mogą wyświetlać
darmowych kandydatów bez klucza. Testowanie i inferencja nadal wymagają
klucza API OpenRouter (z profili auth lub `OPENROUTER_API_KEY`). Jeśli nie ma
dostępnego klucza, `openclaw models scan` przechodzi fallbackiem do wyjścia tylko z metadanymi i pozostawia
konfigurację bez zmian. Użyj `--no-probe`, aby jawnie zażądać trybu tylko metadanych.

Wyniki skanowania są klasyfikowane według:

1. Obsługi obrazów
2. Opóźnienia narzędzi
3. Rozmiaru kontekstu
4. Liczby parametrów

Dane wejściowe

- Lista OpenRouter `/models` (filtr `:free`)
- Testy na żywo wymagają klucza API OpenRouter z profili auth lub `OPENROUTER_API_KEY` (zobacz [/environment](/pl/help/environment))
- Opcjonalne filtry: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kontrole żądań/testów: `--timeout`, `--concurrency`

Gdy testy na żywo są uruchamiane w TTY, możesz interaktywnie wybierać fallbacki. W
trybie nieinteraktywnym podaj `--yes`, aby zaakceptować ustawienia domyślne. Wyniki tylko z metadanymi są
informacyjne; `--set-default` i `--set-image` wymagają testów na żywo, aby
OpenClaw nie skonfigurował bezużytecznego modelu OpenRouter bez klucza.

## Rejestr modeli (`models.json`)

Niestandardowi dostawcy w `models.providers` są zapisywani do `models.json` w katalogu
agenta (domyślnie `~/.openclaw/agents/<agentId>/agent/models.json`). Ten plik
jest domyślnie scalany, chyba że `models.mode` jest ustawione na `replace`.

Priorytet w trybie scalania dla pasujących identyfikatorów dostawców:

- Niepuste `baseUrl` już obecne w `models.json` agenta ma pierwszeństwo.
- Niepuste `apiKey` w `models.json` agenta ma pierwszeństwo tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście config/auth-profile.
- Wartości `apiKey` dostawców zarządzanych przez SecretRef są odświeżane ze znaczników źródła (`ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec) zamiast zapisywania rozwiązanych sekretów.
- Wartości nagłówków dostawców zarządzanych przez SecretRef są odświeżane ze znaczników źródła (`secretref-env:ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec).
- Puste lub brakujące `apiKey`/`baseUrl` agenta przechodzą fallbackiem do `models.providers` z konfiguracji.
- Inne pola dostawcy są odświeżane z konfiguracji i znormalizowanych danych katalogu.

Zapisywanie znaczników jest nadrzędnie sterowane przez źródło: OpenClaw zapisuje znaczniki z aktywnej migawki konfiguracji źródłowej (przed rozwiązywaniem), a nie z rozwiązanych wartości sekretów w runtime.
Dotyczy to wszystkich sytuacji, gdy OpenClaw regeneruje `models.json`, w tym ścieżek uruchamianych poleceniami, takich jak `openclaw agent`.

## Powiązane

- [Dostawcy modeli](/pl/concepts/model-providers) — routing dostawców i auth
- [Runtime’y agentów](/pl/concepts/agent-runtimes) — PI, Codex i inne runtime’y pętli agenta
- [Failover modeli](/pl/concepts/model-failover) — łańcuchy fallbacków
- [Generowanie obrazów](/pl/tools/image-generation) — konfiguracja modelu obrazu
- [Generowanie muzyki](/pl/tools/music-generation) — konfiguracja modelu muzyki
- [Generowanie wideo](/pl/tools/video-generation) — konfiguracja modelu wideo
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — klucze konfiguracji modeli
