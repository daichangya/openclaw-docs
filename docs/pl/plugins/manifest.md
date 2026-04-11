---
read_when:
    - Budujesz plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji pluginu lub debugować błędy walidacji pluginu
summary: Manifest pluginu + wymagania schematu JSON (ścisła walidacja konfiguracji)
title: Manifest pluginu
x-i18n:
    generated_at: "2026-04-11T15:16:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42d454b560a8f6bf714c5d782f34216be1216d83d0a319d08d7349332c91a9e4
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest pluginu (`openclaw.plugin.json`)

Ta strona dotyczy wyłącznie **natywnego manifestu pluginu OpenClaw**.

Informacje o zgodnych układach bundli znajdziesz w [Bundlach pluginów](/pl/plugins/bundles).

Zgodne formaty bundli używają innych plików manifestu:

- Bundel Codex: `.codex-plugin/plugin.json`
- Bundel Claude: `.claude-plugin/plugin.json` lub domyślny układ komponentu Claude
  bez manifestu
- Bundel Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa także te układy bundli, ale nie są one walidowane
względem schematu `openclaw.plugin.json` opisanego tutaj.

W przypadku zgodnych bundli OpenClaw obecnie odczytuje metadane bundla oraz zadeklarowane
korzenie Skills, korzenie poleceń Claude, domyślne wartości `settings.json` bundla Claude,
domyślne ustawienia LSP bundla Claude oraz obsługiwane zestawy hooków, gdy układ odpowiada
oczekiwaniom środowiska uruchomieniowego OpenClaw.

Każdy natywny plugin OpenClaw **musi** zawierać plik `openclaw.plugin.json` w
**katalogu głównym pluginu**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu pluginu**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy pluginu i blokują walidację konfiguracji.

Zobacz pełny przewodnik po systemie pluginów: [Pluginy](/pl/tools/plugin).
Informacje o natywnym modelu możliwości i aktualnych wskazówkach dotyczących kompatybilności zewnętrznej:
[Model możliwości](/pl/plugins/architecture#public-capability-model).

## Do czego służy ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje przed załadowaniem kodu
Twojego pluginu.

Używaj go do:

- tożsamości pluginu
- walidacji konfiguracji
- metadanych uwierzytelniania i onboardingu, które powinny być dostępne bez uruchamiania
  środowiska wykonawczego pluginu
- tanich wskazówek aktywacji, które powierzchnie płaszczyzny sterowania mogą sprawdzać przed załadowaniem runtime
- tanich deskryptorów konfiguracji, które powierzchnie konfiguracji/onboardingu mogą sprawdzać przed
  załadowaniem runtime
- metadanych aliasów i automatycznego włączania, które powinny być rozstrzygane przed załadowaniem runtime pluginu
- skróconych metadanych własności rodzin modeli, które powinny automatycznie aktywować
  plugin przed załadowaniem runtime
- statycznych migawek własności możliwości używanych do zgodnego okablowania bundli i
  pokrycia kontraktów
- metadanych konfiguracji specyficznych dla kanału, które powinny być scalane z powierzchniami katalogu i walidacji
  bez ładowania runtime
- wskazówek UI konfiguracji

Nie używaj go do:

- rejestrowania zachowania runtime
- deklarowania punktów wejścia kodu
- metadanych instalacji npm

Te elementy należą do kodu Twojego pluginu i `package.json`.

## Minimalny przykład

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Rozbudowany przykład

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "Plugin dostawcy OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "Klucz API OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "Klucz API OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "Klucz API",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Odniesienie do pól najwyższego poziomu

| Pole                                | Wymagane | Typ                              | Co oznacza                                                                                                                                                                                                   |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Tak      | `string`                         | Kanoniczny identyfikator pluginu. To identyfikator używany w `plugins.entries.<id>`.                                                                                                                        |
| `configSchema`                      | Tak      | `object`                         | Wbudowany schemat JSON dla konfiguracji tego pluginu.                                                                                                                                                        |
| `enabledByDefault`                  | Nie      | `true`                           | Oznacza plugin bundlowany jako domyślnie włączony. Pomiń to pole lub ustaw dowolną wartość inną niż `true`, aby pozostawić plugin domyślnie wyłączony.                                                     |
| `legacyPluginIds`                   | Nie      | `string[]`                       | Starsze identyfikatory normalizowane do tego kanonicznego identyfikatora pluginu.                                                                                                                           |
| `autoEnableWhenConfiguredProviders` | Nie      | `string[]`                       | Identyfikatory dostawców, które powinny automatycznie włączać ten plugin, gdy uwierzytelnianie, konfiguracja lub odwołania do modeli je wskazują.                                                          |
| `kind`                              | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj pluginu używany przez `plugins.slots.*`.                                                                                                                                          |
| `channels`                          | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego pluginu. Używane do wykrywania i walidacji konfiguracji.                                                                                                          |
| `providers`                         | Nie      | `string[]`                       | Identyfikatory dostawców należących do tego pluginu.                                                                                                                                                        |
| `modelSupport`                      | Nie      | `object`                         | Skrócone metadane rodzin modeli należące do manifestu, używane do automatycznego załadowania pluginu przed runtime.                                                                                        |
| `cliBackends`                       | Nie      | `string[]`                       | Identyfikatory backendów inferencji CLI należących do tego pluginu. Używane do automatycznej aktywacji przy uruchomieniu na podstawie jawnych odwołań w konfiguracji.                                     |
| `commandAliases`                    | Nie      | `object[]`                       | Nazwy poleceń należące do tego pluginu, które powinny generować diagnostykę konfiguracji i CLI świadomą pluginu przed załadowaniem runtime.                                                                |
| `providerAuthEnvVars`               | Nie      | `Record<string, string[]>`       | Lekkie metadane zmiennych środowiskowych uwierzytelniania dostawcy, które OpenClaw może sprawdzać bez ładowania kodu pluginu.                                                                             |
| `providerAuthAliases`               | Nie      | `Record<string, string>`         | Identyfikatory dostawców, które powinny ponownie używać innego identyfikatora dostawcy do wyszukiwania uwierzytelniania, na przykład dostawca do kodowania współdzielący bazowy klucz API i profile auth. |
| `channelEnvVars`                    | Nie      | `Record<string, string[]>`       | Lekkie metadane zmiennych środowiskowych kanału, które OpenClaw może sprawdzać bez ładowania kodu pluginu. Używaj tego do konfiguracji kanału sterowanej env lub powierzchni auth, które powinny widzieć ogólne pomocniki uruchamiania/konfiguracji. |
| `providerAuthChoices`               | Nie      | `object[]`                       | Lekkie metadane wyboru uwierzytelniania dla selektorów onboardingu, rozpoznawania preferowanego dostawcy i prostego mapowania flag CLI.                                                                   |
| `activation`                        | Nie      | `object`                         | Lekkie wskazówki aktywacji dla ładowania wyzwalanego przez dostawcę, polecenie, kanał, trasę i możliwości. To tylko metadane; rzeczywiste zachowanie nadal należy do runtime pluginu.                     |
| `setup`                             | Nie      | `object`                         | Lekkie deskryptory konfiguracji/onboardingu, które powierzchnie wykrywania i konfiguracji mogą sprawdzać bez ładowania runtime pluginu.                                                                   |
| `contracts`                         | Nie      | `object`                         | Statyczna migawka możliwości bundlowanych dla własności mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia multimediów, generowania obrazów, generowania muzyki, generowania wideo, pobierania z sieci, wyszukiwania w sieci i własności narzędzi. |
| `channelConfigs`                    | Nie      | `Record<string, object>`         | Metadane konfiguracji kanału należące do manifestu, scalane z powierzchniami wykrywania i walidacji przed załadowaniem runtime.                                                                           |
| `skills`                            | Nie      | `string[]`                       | Katalogi Skills do załadowania, względne względem katalogu głównego pluginu.                                                                                                                                |
| `name`                              | Nie      | `string`                         | Czytelna dla człowieka nazwa pluginu.                                                                                                                                                                        |
| `description`                       | Nie      | `string`                         | Krótkie podsumowanie wyświetlane na powierzchniach pluginu.                                                                                                                                                  |
| `version`                           | Nie      | `string`                         | Informacyjna wersja pluginu.                                                                                                                                                                                 |
| `uiHints`                           | Nie      | `Record<string, object>`         | Etykiety UI, placeholdery i wskazówki dotyczące wrażliwości dla pól konfiguracji.                                                                                                                            |

## Odniesienie do `providerAuthChoices`

Każdy wpis `providerAuthChoices` opisuje jeden wybór onboardingu lub uwierzytelniania.
OpenClaw odczytuje to przed załadowaniem runtime dostawcy.

| Pole                  | Wymagane | Typ                                             | Co oznacza                                                                                               |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Tak      | `string`                                        | Identyfikator dostawcy, do którego należy ten wybór.                                                     |
| `method`              | Tak      | `string`                                        | Identyfikator metody uwierzytelniania, do której należy przekierować.                                    |
| `choiceId`            | Tak      | `string`                                        | Stabilny identyfikator wyboru uwierzytelniania używany przez onboarding i przepływy CLI.                |
| `choiceLabel`         | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli zostanie pominięta, OpenClaw użyje `choiceId`.                 |
| `choiceHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                   |
| `assistantPriority`   | Nie      | `number`                                        | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.        |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                  | Ukrywa wybór w selektorach asystenta, nadal pozwalając na ręczny wybór w CLI.                           |
| `deprecatedChoiceIds` | Nie      | `string[]`                                      | Starsze identyfikatory wyboru, które powinny przekierowywać użytkowników do tego zastępczego wyboru.    |
| `groupId`             | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych wyborów.                                       |
| `groupLabel`          | Nie      | `string`                                        | Etykieta tej grupy widoczna dla użytkownika.                                                             |
| `groupHint`           | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                       |
| `optionKey`           | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów auth z jedną flagą.                                      |
| `cliFlag`             | Nie      | `string`                                        | Nazwa flagi CLI, na przykład `--openrouter-api-key`.                                                     |
| `cliOption`           | Nie      | `string`                                        | Pełna postać opcji CLI, na przykład `--openrouter-api-key <key>`.                                        |
| `cliDescription`      | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                               |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">` | Na których powierzchniach onboardingu ten wybór powinien się pojawiać. Jeśli zostanie pominięte, domyślnie używane jest `["text-inference"]`. |

## Odniesienie do `commandAliases`

Używaj `commandAliases`, gdy plugin jest właścicielem nazwy polecenia runtime, którą użytkownicy mogą
omyłkowo umieścić w `plugins.allow` lub próbować uruchomić jako główne polecenie CLI. OpenClaw
używa tych metadanych do diagnostyki bez importowania kodu runtime pluginu.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Pole         | Wymagane | Typ               | Co oznacza                                                                 |
| ------------ | -------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Tak      | `string`          | Nazwa polecenia należącego do tego pluginu.                                |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie slash czatu, a nie główne polecenie CLI.      |
| `cliCommand` | Nie      | `string`          | Powiązane główne polecenie CLI, które można zasugerować dla operacji CLI, jeśli istnieje. |

## Odniesienie do `activation`

Używaj `activation`, gdy plugin może w prosty sposób zadeklarować, które zdarzenia płaszczyzny sterowania
powinny później go aktywować.

Ten blok zawiera wyłącznie metadane. Nie rejestruje zachowania runtime i nie
zastępuje `register(...)`, `setupEntry` ani innych punktów wejścia runtime/pluginu.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Pole             | Wymagane | Typ                                                  | Co oznacza                                                          |
| ---------------- | -------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| `onProviders`    | Nie      | `string[]`                                           | Identyfikatory dostawców, które powinny aktywować ten plugin po żądaniu. |
| `onCommands`     | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny aktywować ten plugin.         |
| `onChannels`     | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny aktywować ten plugin.         |
| `onRoutes`       | Nie      | `string[]`                                           | Rodzaje tras, które powinny aktywować ten plugin.                   |
| `onCapabilities` | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Ogólne wskazówki dotyczące możliwości używane przez planowanie aktywacji płaszczyzny sterowania. |

## Odniesienie do `setup`

Używaj `setup`, gdy powierzchnie konfiguracji i onboardingu potrzebują lekkich metadanych należących do pluginu
przed załadowaniem runtime.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

Pole najwyższego poziomu `cliBackends` pozostaje prawidłowe i nadal opisuje backendy inferencji CLI.
`setup.cliBackends` to powierzchnia deskryptorów specyficzna dla konfiguracji dla
przepływów płaszczyzny sterowania/konfiguracji, która powinna pozostać wyłącznie metadanymi.

### Odniesienie do `setup.providers`

| Pole          | Wymagane | Typ        | Co oznacza                                                                                |
| ------------- | -------- | ---------- | ----------------------------------------------------------------------------------------- |
| `id`          | Tak      | `string`   | Identyfikator dostawcy udostępniany podczas konfiguracji lub onboardingu.                 |
| `authMethods` | Nie      | `string[]` | Identyfikatory metod konfiguracji/auth, które ten dostawca obsługuje bez ładowania pełnego runtime. |
| `envVars`     | Nie      | `string[]` | Zmienne środowiskowe, które ogólne powierzchnie konfiguracji/statusu mogą sprawdzać przed załadowaniem runtime pluginu. |

### Pola `setup`

| Pole               | Wymagane | Typ        | Co oznacza                                                                    |
| ------------------ | -------- | ---------- | ----------------------------------------------------------------------------- |
| `providers`        | Nie      | `object[]` | Deskryptory konfiguracji dostawców udostępniane podczas konfiguracji i onboardingu. |
| `cliBackends`      | Nie      | `string[]` | Identyfikatory backendów dostępnych podczas konfiguracji bez pełnej aktywacji runtime. |
| `configMigrations` | Nie      | `string[]` | Identyfikatory migracji konfiguracji należące do powierzchni konfiguracji tego pluginu. |
| `requiresRuntime`  | Nie      | `boolean`  | Czy konfiguracja nadal wymaga wykonania runtime pluginu po wyszukaniu deskryptora. |

## Odniesienie do `uiHints`

`uiHints` to mapa od nazw pól konfiguracji do niewielkich wskazówek renderowania.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Każda wskazówka pola może zawierać:

| Pole          | Typ        | Co oznacza                               |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Etykieta pola widoczna dla użytkownika.  |
| `help`        | `string`   | Krótki tekst pomocniczy.                 |
| `tags`        | `string[]` | Opcjonalne tagi UI.                      |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.          |
| `sensitive`   | `boolean`  | Oznacza pole jako sekretne lub wrażliwe. |
| `placeholder` | `string`   | Tekst placeholdera dla pól formularza.   |

## Odniesienie do `contracts`

Używaj `contracts` wyłącznie do statycznych metadanych własności możliwości, które OpenClaw może
odczytać bez importowania runtime pluginu.

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Każda lista jest opcjonalna:

| Pole                             | Typ        | Co oznacza                                                      |
| -------------------------------- | ---------- | --------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Identyfikatory dostawców mowy należące do tego pluginu.         |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców transkrypcji w czasie rzeczywistym należące do tego pluginu. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców głosu w czasie rzeczywistym należące do tego pluginu. |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców rozumienia multimediów należące do tego pluginu. |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania obrazów należące do tego pluginu. |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania wideo należące do tego pluginu. |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców pobierania z sieci należące do tego pluginu. |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców wyszukiwania w sieci należące do tego pluginu. |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należące do tego pluginu na potrzeby sprawdzania kontraktów bundlowanych. |

## Odniesienie do `channelConfigs`

Używaj `channelConfigs`, gdy plugin kanału potrzebuje lekkich metadanych konfiguracji przed
załadowaniem runtime.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Połączenie z homeserverem Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Każdy wpis kanału może zawierać:

| Pole          | Typ                      | Co oznacza                                                                                   |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schemat JSON dla `channels.<id>`. Wymagany dla każdego zadeklarowanego wpisu konfiguracji kanału. |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety UI/placeholdery/wskazówki dotyczące wrażliwości dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami wyboru i inspekcji, gdy metadane runtime nie są jeszcze gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                      |
| `preferOver`  | `string[]`               | Starsze lub mniej priorytetowe identyfikatory pluginów, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

## Odniesienie do `modelSupport`

Używaj `modelSupport`, gdy OpenClaw ma wywnioskować plugin Twojego dostawcy na podstawie
skróconych identyfikatorów modeli, takich jak `gpt-5.4` lub `claude-sonnet-4.6`, zanim runtime pluginu
zostanie załadowane.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje następujący priorytet:

- jawne odwołania `provider/model` używają należących do właściciela metadanych manifestu `providers`
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli pasują jednocześnie jeden plugin niebundlowany i jeden plugin bundlowany, wygrywa plugin niebundlowany
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik lub konfiguracja nie określą dostawcy

Pola:

| Pole            | Typ        | Co oznacza                                                                        |
| --------------- | ---------- | --------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane przez `startsWith` do skróconych identyfikatorów modeli.    |
| `modelPatterns` | `string[]` | Źródła regex dopasowywane do skróconych identyfikatorów modeli po usunięciu sufiksu profilu. |

Starsze klucze możliwości na najwyższym poziomie są przestarzałe. Użyj `openclaw doctor --fix`, aby
przenieść `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` i `webSearchProviders` pod `contracts`; zwykłe
ładowanie manifestu nie traktuje już tych pól najwyższego poziomu jako
własności możliwości.

## Manifest a package.json

Te dwa pliki służą do różnych zadań:

| Plik                   | Używaj go do                                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Wykrywania, walidacji konfiguracji, metadanych wyboru auth i wskazówek UI, które muszą istnieć przed uruchomieniem kodu pluginu |
| `package.json`         | Metadanych npm, instalacji zależności i bloku `openclaw` używanego do punktów wejścia, ograniczeń instalacji, konfiguracji lub metadanych katalogu |

Jeśli nie masz pewności, gdzie powinien znaleźć się dany fragment metadanych, użyj tej zasady:

- jeśli OpenClaw musi znać go przed załadowaniem kodu pluginu, umieść go w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików wejściowych lub zachowania instalacji npm, umieść go w `package.json`

### Pola `package.json`, które wpływają na wykrywanie

Niektóre metadane pluginu sprzed uruchomienia runtime celowo znajdują się w `package.json` pod
blokiem `openclaw`, a nie w `openclaw.plugin.json`.

Ważne przykłady:

| Pole                                                              | Co oznacza                                                                                                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklaruje natywne punkty wejścia pluginu.                                                                                                     |
| `openclaw.setupEntry`                                             | Lekki punkt wejścia wyłącznie do konfiguracji używany podczas onboardingu i odroczonego uruchamiania kanału.                                |
| `openclaw.channel`                                                | Lekkie metadane katalogu kanałów, takie jak etykiety, ścieżki dokumentacji, aliasy i tekst wyboru.                                          |
| `openclaw.channel.configuredState`                                | Lekkie metadane sprawdzania stanu skonfigurowania, które mogą odpowiedzieć na pytanie „czy konfiguracja wyłącznie przez env już istnieje?” bez ładowania pełnego runtime kanału. |
| `openclaw.channel.persistedAuthState`                             | Lekkie metadane sprawdzania utrwalonego auth, które mogą odpowiedzieć na pytanie „czy cokolwiek jest już zalogowane?” bez ładowania pełnego runtime kanału. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Wskazówki instalacji/aktualizacji dla pluginów bundlowanych i publikowanych zewnętrznie.                                                     |
| `openclaw.install.defaultChoice`                                  | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                 |
| `openclaw.install.minHostVersion`                                 | Minimalna obsługiwana wersja hosta OpenClaw, z użyciem dolnej granicy semver, takiej jak `>=2026.3.22`.                                     |
| `openclaw.install.allowInvalidConfigRecovery`                     | Umożliwia wąską ścieżkę odzyskiwania przez ponowną instalację pluginu bundlowanego, gdy konfiguracja jest nieprawidłowa.                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Pozwala powierzchniom kanału tylko do konfiguracji ładować się przed pełnym pluginem kanału podczas uruchamiania.                           |

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i ładowania rejestru
manifestu. Nieprawidłowe wartości są odrzucane; nowsze, ale prawidłowe wartości powodują pominięcie
pluginu na starszych hostach.

`openclaw.install.allowInvalidConfigRecovery` jest celowo bardzo wąskie. Nie
sprawia, że dowolnie uszkodzone konfiguracje stają się możliwe do zainstalowania. Obecnie pozwala jedynie przepływom instalacji
odzyskać sprawność po określonych nieaktualnych błędach aktualizacji pluginu bundlowanego, takich jak
brak ścieżki do pluginu bundlowanego lub nieaktualny wpis `channels.<id>` dla tego samego
pluginu bundlowanego. Niepowiązane błędy konfiguracji nadal blokują instalację i kierują operatorów
do `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` to metadane pakietu dla małego modułu sprawdzającego:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Używaj tego, gdy przepływy konfiguracji, doctor lub stanu skonfigurowania potrzebują taniego sondowania auth
typu tak/nie przed załadowaniem pełnego pluginu kanału. Docelowy eksport powinien być małą
funkcją odczytującą wyłącznie stan utrwalony; nie prowadź go przez pełny barrel runtime
kanału.

`openclaw.channel.configuredState` ma taki sam kształt dla tanich sprawdzeń
skonfigurowania tylko na podstawie env:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Używaj tego, gdy kanał może określić stan skonfigurowania na podstawie env lub innych małych
wejść niezwiązanych z runtime. Jeśli sprawdzenie wymaga pełnego rozpoznania konfiguracji lub rzeczywistego
runtime kanału, pozostaw tę logikę w hooku `config.hasConfiguredState` pluginu.

## Wymagania schematu JSON

- **Każdy plugin musi dostarczać schemat JSON**, nawet jeśli nie akceptuje żadnej konfiguracji.
- Pusty schemat jest akceptowalny, na przykład `{ "type": "object", "additionalProperties": false }`.
- Schematy są walidowane podczas odczytu/zapisu konfiguracji, a nie w runtime.

## Zachowanie walidacji

- Nieznane klucze `channels.*` to **błędy**, chyba że identyfikator kanału jest zadeklarowany przez
  manifest pluginu.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` i `plugins.slots.*`
  muszą odwoływać się do identyfikatorów pluginów, które można **wykryć**. Nieznane identyfikatory to **błędy**.
- Jeśli plugin jest zainstalowany, ale ma uszkodzony lub brakujący manifest albo schemat,
  walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd pluginu.
- Jeśli konfiguracja pluginu istnieje, ale plugin jest **wyłączony**, konfiguracja jest zachowywana, a
  w Doctor + logach pojawia się **ostrzeżenie**.

Zobacz [Odniesienie do konfiguracji](/pl/gateway/configuration), aby poznać pełny schemat `plugins.*`.

## Uwagi

- Manifest jest **wymagany dla natywnych pluginów OpenClaw**, w tym przy ładowaniu z lokalnego systemu plików.
- Runtime nadal ładuje moduł pluginu osobno; manifest służy wyłącznie do
  wykrywania + walidacji.
- Natywne manifesty są parsowane przy użyciu JSON5, więc komentarze, końcowe przecinki i
  nieujęte w cudzysłowy klucze są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Loader manifestu odczytuje tylko udokumentowane pola manifestu. Unikaj dodawania
  tutaj własnych kluczy najwyższego poziomu.
- `providerAuthEnvVars` to tania ścieżka metadanych dla sondowania auth, walidacji
  znaczników env i podobnych powierzchni uwierzytelniania dostawcy, które nie powinny uruchamiać runtime pluginu
  tylko po to, aby sprawdzić nazwy env.
- `providerAuthAliases` pozwala wariantom dostawcy ponownie używać auth
  env vars, profili auth, auth opartego na konfiguracji i wyboru onboardingu klucza API innego dostawcy
  bez twardego kodowania tej relacji w rdzeniu.
- `channelEnvVars` to tania ścieżka metadanych dla rezerwowego użycia env powłoki, promptów konfiguracji
  i podobnych powierzchni kanału, które nie powinny uruchamiać runtime pluginu
  tylko po to, aby sprawdzić nazwy env.
- `providerAuthChoices` to tania ścieżka metadanych dla selektorów wyboru auth,
  rozpoznawania `--auth-choice`, mapowania preferowanego dostawcy i prostej rejestracji flag CLI
  onboardingu przed załadowaniem runtime dostawcy. Metadane kreatora runtime,
  które wymagają kodu dostawcy, znajdziesz w
  [Hookach runtime dostawcy](/pl/plugins/architecture#provider-runtime-hooks).
- Wyłączne rodzaje pluginów są wybierane przez `plugins.slots.*`.
  - `kind: "memory"` jest wybierane przez `plugins.slots.memory`.
  - `kind: "context-engine"` jest wybierane przez `plugins.slots.contextEngine`
    (domyślnie: wbudowane `legacy`).
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, gdy
  plugin ich nie potrzebuje.
- Jeśli Twój plugin zależy od modułów natywnych, udokumentuj kroki budowania oraz wszelkie
  wymagania dotyczące listy dozwolonych menedżera pakietów, na przykład pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`.

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins) — jak zacząć pracę z pluginami
- [Architektura pluginów](/pl/plugins/architecture) — architektura wewnętrzna
- [Przegląd SDK](/pl/plugins/sdk-overview) — odniesienie do SDK pluginów
