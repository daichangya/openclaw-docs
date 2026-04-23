---
read_when:
    - Dodawanie lub modyfikowanie CLI modeli (`models list`/`set`/`scan`/`aliases`/`fallbacks`)
    - Zmiana zachowania fallbacków modeli lub UX wyboru modelu
    - Aktualizowanie sond skanowania modeli (narzędzia/obrazy)
summary: 'CLI modeli: listowanie, ustawianie, aliasy, fallbacki, skanowanie, status'
title: CLI modeli
x-i18n:
    generated_at: "2026-04-23T10:00:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46916d9600a4e4aebdb026aa42df39149d8b6d438a8a7e85a61053dfc8f76dcc
    source_path: concepts/models.md
    workflow: 15
---

# CLI modeli

Zobacz [/concepts/model-failover](/pl/concepts/model-failover), aby poznać rotację profili uwierzytelniania,
cooldowny oraz to, jak współgra to z fallbackami.
Szybki przegląd dostawców + przykłady: [/concepts/model-providers](/pl/concepts/model-providers).

## Jak działa wybór modelu

OpenClaw wybiera modele w tej kolejności:

1. Model **główny** (`agents.defaults.model.primary` lub `agents.defaults.model`).
2. **Fallbacki** w `agents.defaults.model.fallbacks` (w kolejności).
3. **Failover uwierzytelniania dostawcy** odbywa się wewnątrz dostawcy przed przejściem do
   następnego modelu.

Powiązane:

- `agents.defaults.models` to allowlista/katalog modeli, których OpenClaw może używać (plus aliasy).
- `agents.defaults.imageModel` jest używany **tylko wtedy**, gdy model główny nie może przyjmować obrazów.
- `agents.defaults.pdfModel` jest używany przez narzędzie `pdf`. Jeśli zostanie pominięty, narzędzie
  wraca do `agents.defaults.imageModel`, a potem do rozwiązanego modelu sesji/domyślnego.
- `agents.defaults.imageGenerationModel` jest używany przez współdzieloną możliwość generowania obrazów. Jeśli zostanie pominięty, `image_generate` nadal może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj także uwierzytelnianie/klucz API tego dostawcy.
- `agents.defaults.musicGenerationModel` jest używany przez współdzieloną możliwość generowania muzyki. Jeśli zostanie pominięty, `music_generate` nadal może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania muzyki w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj także uwierzytelnianie/klucz API tego dostawcy.
- `agents.defaults.videoGenerationModel` jest używany przez współdzieloną możliwość generowania wideo. Jeśli zostanie pominięty, `video_generate` nadal może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania wideo w kolejności identyfikatorów dostawców. Jeśli ustawisz konkretnego dostawcę/model, skonfiguruj także uwierzytelnianie/klucz API tego dostawcy.
- Ustawienia domyślne per agent mogą nadpisać `agents.defaults.model` przez `agents.list[].model` oraz powiązania (zobacz [/concepts/multi-agent](/pl/concepts/multi-agent)).

## Szybka polityka modeli

- Ustaw model główny na najmocniejszy model najnowszej generacji, do którego masz dostęp.
- Używaj fallbacków dla zadań wrażliwych na koszt/opóźnienie oraz czatu o niższej wadze.
- Dla agentów z włączonymi narzędziami lub przy niezaufanych danych wejściowych unikaj starszych/słabszych klas modeli.

## Onboarding (zalecane)

Jeśli nie chcesz ręcznie edytować konfiguracji, uruchom onboarding:

```bash
openclaw onboard
```

Może on skonfigurować model + uwierzytelnianie dla popularnych dostawców, w tym **subskrypcję OpenAI Code (Codex)**
(OAuth) i **Anthropic** (klucz API lub Claude CLI).

## Klucze konfiguracji (przegląd)

- `agents.defaults.model.primary` i `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` i `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` i `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` i `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` i `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlista + aliasy + parametry dostawcy)
- `models.providers` (niestandardowi dostawcy zapisywani do `models.json`)

Odwołania do modeli są normalizowane do małych liter. Aliasy dostawców, takie jak `z.ai/*`, są normalizowane
do `zai/*`.

Przykłady konfiguracji dostawców (w tym OpenCode) znajdują się w
[/providers/opencode](/pl/providers/opencode).

### Bezpieczne edycje allowlisty

Używaj zapisów addytywnych przy ręcznym aktualizowaniu `agents.defaults.models`:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` chroni mapy modeli/dostawców przed przypadkowym nadpisaniem. Zwykłe
przypisanie obiektu do `agents.defaults.models`, `models.providers` lub
`models.providers.<id>.models` jest odrzucane, gdy usuwałoby istniejące
wpisy. Używaj `--merge` dla zmian addytywnych; używaj `--replace` tylko wtedy, gdy
podana wartość ma stać się kompletną wartością docelową.

Interaktywna konfiguracja dostawcy oraz `openclaw configure --section model` również scalają
wybory w zakresie dostawcy z istniejącą allowlistą, więc dodanie Codex,
Ollama lub innego dostawcy nie usuwa niepowiązanych wpisów modeli.

## „Model is not allowed” (i dlaczego odpowiedzi się zatrzymują)

Jeśli ustawiono `agents.defaults.models`, staje się ono **allowlistą** dla `/model` oraz dla
nadpisań sesji. Gdy użytkownik wybierze model, którego nie ma na tej allowliście,
OpenClaw zwraca:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Dzieje się to **przed** wygenerowaniem zwykłej odpowiedzi, więc wiadomość może sprawiać wrażenie,
jakby „nie odpowiedziała”. Rozwiązaniem jest:

- dodać model do `agents.defaults.models`, albo
- wyczyścić allowlistę (usunąć `agents.defaults.models`), albo
- wybrać model z `/model list`.

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

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Uwagi:

- `/model` (oraz `/model list`) to zwarty, numerowany wybierak (rodzina modeli + dostępni dostawcy).
- Na Discord `/model` i `/models` otwierają interaktywny wybierak z listami rozwijanymi dostawcy i modelu oraz krokiem Submit.
- `/models add` jest dostępne domyślnie i można je wyłączyć przez `commands.modelsWrite=false`.
- Gdy jest włączone, najszybszą ścieżką jest `/models add <provider> <modelId>`; samo `/models add` uruchamia wspierany przepływ z przewodnikiem, zaczynający się od dostawcy.
- Po `/models add` nowy model staje się dostępny w `/models` i `/model` bez restartu gateway.
- `/model <#>` wybiera z tego wybieraka.
- `/model` natychmiast utrwala nowy wybór sesji.
- Jeśli agent jest bezczynny, następny przebieg od razu użyje nowego modelu.
- Jeśli przebieg jest już aktywny, OpenClaw oznacza przełączenie live jako oczekujące i restartuje do nowego modelu dopiero w czystym punkcie ponownej próby.
- Jeśli aktywność narzędzi lub wyjście odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponownej próby albo do następnej tury użytkownika.
- `/model status` to widok szczegółowy (kandydaci uwierzytelniania oraz, jeśli skonfigurowano, `baseUrl` endpointu dostawcy + tryb `api`).
- Odwołania do modeli są parsowane przez podział na **pierwszym** `/`. Używaj `provider/model` przy wpisywaniu `/model <ref>`.
- Jeśli sam identyfikator modelu zawiera `/` (styl OpenRouter), musisz podać prefiks dostawcy (przykład: `/model openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw rozwiązuje dane wejściowe w tej kolejności:
  1. dopasowanie aliasu
  2. jednoznaczne dopasowanie skonfigurowanego dostawcy dla dokładnie tego samego identyfikatora modelu bez prefiksu
  3. przestarzały fallback do skonfigurowanego domyślnego dostawcy  
     Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw
     zamiast tego wraca do pierwszego skonfigurowanego dostawcy/modelu, aby uniknąć
     pokazywania nieaktualnej domyślnej wartości usuniętego dostawcy.

Pełne zachowanie/config poleceń: [Slash commands](/pl/tools/slash-commands).

Przykłady:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

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
- `--provider <id>`: filtruj według identyfikatora dostawcy, na przykład `moonshot`; etykiety
  wyświetlania z interaktywnych wybieraków nie są akceptowane
- `--plain`: jeden model na linię
- `--json`: wyjście czytelne maszynowo

`--all` obejmuje statyczne wiersze katalogu bundlowane i należące do dostawców jeszcze przed skonfigurowaniem uwierzytelniania, więc widoki tylko do wykrywania mogą pokazywać modele, które są niedostępne, dopóki nie dodasz pasujących poświadczeń dostawcy.

### `models status`

Pokazuje rozwiązany model główny, fallbacki, model obrazu oraz przegląd uwierzytelniania
skonfigurowanych dostawców. Pokazuje też status wygaśnięcia OAuth dla profili znalezionych
w magazynie uwierzytelniania (domyślnie ostrzega w ciągu 24 h). `--plain` wypisuje tylko
rozwiązany model główny.
Status OAuth jest zawsze pokazywany (i uwzględniany w wyjściu `--json`). Jeśli skonfigurowany
dostawca nie ma poświadczeń, `models status` wypisuje sekcję **Missing auth**.
JSON zawiera `auth.oauth` (okno ostrzeżeń + profile) oraz `auth.providers`
(skuteczne uwierzytelnianie per dostawca, w tym poświadczenia oparte na env). `auth.oauth`
dotyczy wyłącznie kondycji profili w magazynie uwierzytelniania; dostawcy używający wyłącznie env się tam nie pojawiają.
Użyj `--check` do automatyzacji (kod wyjścia `1` dla brakujących/wygasłych, `2` dla wygasających).
Użyj `--probe` do aktywnych kontroli uwierzytelniania; wiersze sond mogą pochodzić z profili uwierzytelniania, poświadczeń env
lub `models.json`.
Jeśli jawne `auth.order.<provider>` pomija zapisany profil, sonda zgłasza
`excluded_by_auth_order` zamiast go próbować. Jeśli uwierzytelnianie istnieje, ale dla tego dostawcy nie można rozwiązać modelu nadającego się do sondowania, sonda zgłasza `status: no_model`.

Wybór uwierzytelniania zależy od dostawcy/konta. Dla hostów Gateway działających stale klucze API
są zwykle najbardziej przewidywalne; obsługiwane jest też ponowne użycie Claude CLI i istniejące profile Anthropic
OAuth/token.

Przykład (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Skanowanie (darmowe modele OpenRouter)

`openclaw models scan` sprawdza **katalog darmowych modeli** OpenRouter i może
opcjonalnie sondować modele pod kątem obsługi narzędzi i obrazów.

Kluczowe flagi:

- `--no-probe`: pomiń aktywne sondy (tylko metadane)
- `--min-params <b>`: minimalny rozmiar parametrów (w miliardach)
- `--max-age-days <days>`: pomiń starsze modele
- `--provider <name>`: filtr prefiksu dostawcy
- `--max-candidates <n>`: rozmiar listy fallbacków
- `--set-default`: ustaw `agents.defaults.model.primary` na pierwszy wybrany model
- `--set-image`: ustaw `agents.defaults.imageModel.primary` na pierwszy wybrany model obrazu

Sondowanie wymaga klucza API OpenRouter (z profili uwierzytelniania lub
`OPENROUTER_API_KEY`). Bez klucza użyj `--no-probe`, aby tylko wyświetlić kandydatów.

Wyniki skanowania są rankingowane według:

1. Obsługa obrazów
2. Opóźnienie narzędzi
3. Rozmiar kontekstu
4. Liczba parametrów

Dane wejściowe

- Lista OpenRouter `/models` (filtr `:free`)
- Wymaga klucza API OpenRouter z profili uwierzytelniania lub `OPENROUTER_API_KEY` (zobacz [/environment](/pl/help/environment))
- Opcjonalne filtry: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kontrolki sond: `--timeout`, `--concurrency`

Po uruchomieniu w TTY możesz interaktywnie wybrać fallbacki. W trybie nieinteraktywnym
przekaż `--yes`, aby zaakceptować wartości domyślne.

## Rejestr modeli (`models.json`)

Niestandardowi dostawcy w `models.providers` są zapisywani do `models.json` w
katalogu agenta (domyślnie `~/.openclaw/agents/<agentId>/agent/models.json`). Ten plik
jest domyślnie scalany, chyba że `models.mode` jest ustawione na `replace`.

Pierwszeństwo trybu scalania dla pasujących identyfikatorów dostawców:

- Niepuste `baseUrl` już obecne w `models.json` agenta ma pierwszeństwo.
- Niepuste `apiKey` w `models.json` agenta ma pierwszeństwo tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście config/profilu uwierzytelniania.
- Wartości `apiKey` dostawców zarządzanych przez SecretRef są odświeżane ze znaczników źródła (`ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec) zamiast zapisywania rozwiązanych sekretów.
- Wartości nagłówków dostawców zarządzanych przez SecretRef są odświeżane ze znaczników źródła (`secretref-env:ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec).
- Puste lub brakujące `apiKey`/`baseUrl` agenta wracają do konfiguracji `models.providers`.
- Pozostałe pola dostawcy są odświeżane z konfiguracji i znormalizowanych danych katalogowych.

Utrwalanie znaczników jest źródłowo autorytatywne: OpenClaw zapisuje znaczniki z aktywnego źródłowego snapshotu konfiguracji (przed rozwiązaniem), a nie z rozwiązanych wartości sekretów środowiska wykonawczego.
Dotyczy to wszystkich sytuacji, gdy OpenClaw regeneruje `models.json`, w tym ścieżek uruchamianych poleceniami, takich jak `openclaw agent`.

## Powiązane

- [Dostawcy modeli](/pl/concepts/model-providers) — routing dostawców i uwierzytelnianie
- [Failover modeli](/pl/concepts/model-failover) — łańcuchy fallbacków
- [Generowanie obrazów](/pl/tools/image-generation) — konfiguracja modelu obrazu
- [Generowanie muzyki](/pl/tools/music-generation) — konfiguracja modelu muzyki
- [Generowanie wideo](/pl/tools/video-generation) — konfiguracja modelu wideo
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#agent-defaults) — klucze konfiguracji modeli
