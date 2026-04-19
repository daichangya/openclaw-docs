---
read_when:
    - Tworzysz Plugin OpenClaw.
    - Musisz dostarczyć schemat konfiguracji Pluginu lub debugować błędy walidacji Pluginu.
summary: Manifest Plugin + wymagania schematu JSON (ścisła walidacja konfiguracji)
title: Manifest Pluginu
x-i18n:
    generated_at: "2026-04-19T01:11:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2dfc00759108ddee7bfcda8c42acf7f2d47451676447ba3caf8b5950f8a1c181
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest Pluginu (`openclaw.plugin.json`)

Ta strona dotyczy wyłącznie **natywnego manifestu Pluginu OpenClaw**.

Informacje o zgodnych układach bundli znajdziesz tutaj: [Bundle Pluginów](/pl/plugins/bundles).

Zgodne formaty bundli używają innych plików manifestu:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` lub domyślny układ komponentów Claude
  bez manifestu
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa również te układy bundli, ale nie są one walidowane
względem schematu `openclaw.plugin.json` opisanego tutaj.

W przypadku zgodnych bundli OpenClaw obecnie odczytuje metadane bundla oraz zadeklarowane
korzenie Skills, korzenie poleceń Claude, domyślne wartości `settings.json` dla bundla Claude,
domyślne wartości LSP dla bundla Claude oraz obsługiwane pakiety hooków, gdy układ odpowiada
oczekiwaniom środowiska uruchomieniowego OpenClaw.

Każdy natywny Plugin OpenClaw **musi** zawierać plik `openclaw.plugin.json` w
**katalogu głównym Pluginu**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu Pluginu**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy Pluginu i blokują walidację konfiguracji.

Zobacz pełny przewodnik po systemie Pluginów: [Pluginy](/pl/tools/plugin).
Informacje o natywnym modelu capabilities i bieżące wskazówki dotyczące zewnętrznej kompatybilności:
[Model capabilities](/pl/plugins/architecture#public-capability-model).

## Do czego służy ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje przed załadowaniem kodu
Twojego Pluginu.

Używaj go do:

- tożsamości Pluginu
- walidacji konfiguracji
- metadanych uwierzytelniania i onboardingu, które powinny być dostępne bez uruchamiania
  runtime Pluginu
- tanich wskazówek aktywacji, które powierzchnie control-plane mogą sprawdzać przed załadowaniem runtime
- tanich deskryptorów konfiguracji, które powierzchnie konfiguracji/onboardingu mogą sprawdzać przed
  załadowaniem runtime
- metadanych aliasów i automatycznego włączania, które powinny być rozwiązywane przed załadowaniem runtime Pluginu
- skróconych metadanych własności rodziny modeli, które powinny automatycznie aktywować
  Plugin przed załadowaniem runtime
- statycznych snapshotów własności capabilities używanych do wbudowanego okablowania zgodności i
  pokrycia kontraktów
- tanich metadanych runnera QA, które współdzielony host `openclaw qa` może sprawdzać
  przed załadowaniem runtime Pluginu
- metadanych konfiguracji specyficznych dla kanału, które powinny być scalane z powierzchniami katalogu i walidacji
  bez ładowania runtime
- wskazówek dla UI konfiguracji

Nie używaj go do:

- rejestrowania zachowania runtime
- deklarowania entrypointów kodu
- metadanych instalacji npm

To należy do kodu Twojego Pluginu i `package.json`.

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
  "description": "Plugin providera OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
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

## Opis pól najwyższego poziomu

| Pole                                | Wymagane | Typ                              | Co oznacza                                                                                                                                                                                                   |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Tak      | `string`                         | Kanoniczny identyfikator Pluginu. To identyfikator używany w `plugins.entries.<id>`.                                                                                                                        |
| `configSchema`                      | Tak      | `object`                         | Wbudowany schemat JSON Schema dla konfiguracji tego Pluginu.                                                                                                                                                 |
| `enabledByDefault`                  | Nie      | `true`                           | Oznacza, że wbudowany Plugin jest domyślnie włączony. Pomiń to pole lub ustaw dowolną wartość inną niż `true`, aby Plugin pozostał domyślnie wyłączony.                                                   |
| `legacyPluginIds`                   | Nie      | `string[]`                       | Starsze identyfikatory normalizowane do tego kanonicznego identyfikatora Pluginu.                                                                                                                           |
| `autoEnableWhenConfiguredProviders` | Nie      | `string[]`                       | Identyfikatory providerów, które powinny automatycznie włączyć ten Plugin, gdy uwierzytelnianie, konfiguracja lub odwołania do modeli o nich wspominają.                                                  |
| `kind`                              | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny typ Pluginu używany przez `plugins.slots.*`.                                                                                                                                             |
| `channels`                          | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego Pluginu. Używane do wykrywania i walidacji konfiguracji.                                                                                                          |
| `providers`                         | Nie      | `string[]`                       | Identyfikatory providerów należących do tego Pluginu.                                                                                                                                                        |
| `modelSupport`                      | Nie      | `object`                         | Skrócone metadane rodziny modeli zarządzane przez manifest, używane do automatycznego załadowania Pluginu przed uruchomieniem runtime.                                                                    |
| `providerEndpoints`                 | Nie      | `object[]`                       | Metadane hosta/baseUrl endpointów zarządzane przez manifest dla tras providera, które rdzeń musi sklasyfikować przed załadowaniem runtime providera.                                                      |
| `cliBackends`                       | Nie      | `string[]`                       | Identyfikatory backendów inferencji CLI należących do tego Pluginu. Używane do automatycznej aktywacji przy starcie na podstawie jawnych odwołań w konfiguracji.                                          |
| `syntheticAuthRefs`                 | Nie      | `string[]`                       | Odwołania do providerów lub backendów CLI, których zarządzany przez Plugin hook synthetic auth powinien zostać sprawdzony podczas zimnego wykrywania modeli przed załadowaniem runtime.                    |
| `nonSecretAuthMarkers`              | Nie      | `string[]`                       | Wartości zastępczych kluczy API należące do wbudowanego Pluginu, które reprezentują niejawną lokalną, OAuth lub ambient credential state.                                                                  |
| `commandAliases`                    | Nie      | `object[]`                       | Nazwy poleceń należące do tego Pluginu, które powinny generować diagnostykę konfiguracji i CLI uwzględniającą Plugin przed załadowaniem runtime.                                                           |
| `providerAuthEnvVars`               | Nie      | `Record<string, string[]>`       | Lekkie metadane zmiennych środowiskowych uwierzytelniania providera, które OpenClaw może sprawdzić bez ładowania kodu Pluginu.                                                                            |
| `providerAuthAliases`               | Nie      | `Record<string, string>`         | Identyfikatory providerów, które powinny używać ponownie innego identyfikatora providera do wyszukiwania uwierzytelniania, na przykład provider kodowania współdzielący klucz API i profile auth bazowego providera. |
| `channelEnvVars`                    | Nie      | `Record<string, string[]>`       | Lekkie metadane zmiennych środowiskowych kanału, które OpenClaw może sprawdzić bez ładowania kodu Pluginu. Używaj tego dla konfiguracji kanału sterowanej przez env lub dla powierzchni auth, które powinny być widoczne dla ogólnych helperów startu/konfiguracji. |
| `providerAuthChoices`               | Nie      | `object[]`                       | Lekkie metadane wyboru uwierzytelniania dla selektorów onboardingu, rozwiązywania preferowanego providera i prostego powiązania flag CLI.                                                                  |
| `activation`                        | Nie      | `object`                         | Lekkie wskazówki aktywacji dla ładowania wyzwalanego przez providera, polecenie, kanał, trasę i capability. Tylko metadane; rzeczywiste zachowanie nadal należy do runtime Pluginu.                        |
| `setup`                             | Nie      | `object`                         | Lekkie deskryptory konfiguracji/onboardingu, które powierzchnie wykrywania i konfiguracji mogą sprawdzać bez ładowania runtime Pluginu.                                                                    |
| `qaRunners`                         | Nie      | `object[]`                       | Lekkie deskryptory runnerów QA używane przez współdzielony host `openclaw qa` przed załadowaniem runtime Pluginu.                                                                                          |
| `contracts`                         | Nie      | `object`                         | Statyczny snapshot capabilities wbudowanego pakietu dla własności speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search oraz tools. |
| `channelConfigs`                    | Nie      | `Record<string, object>`         | Metadane konfiguracji kanału zarządzane przez manifest, scalane z powierzchniami wykrywania i walidacji przed załadowaniem runtime.                                                                        |
| `skills`                            | Nie      | `string[]`                       | Katalogi Skills do załadowania, względne wobec katalogu głównego Pluginu.                                                                                                                                    |
| `name`                              | Nie      | `string`                         | Czytelna dla człowieka nazwa Pluginu.                                                                                                                                                                         |
| `description`                       | Nie      | `string`                         | Krótkie podsumowanie wyświetlane na powierzchniach Pluginu.                                                                                                                                                   |
| `version`                           | Nie      | `string`                         | Informacyjna wersja Pluginu.                                                                                                                                                                                  |
| `uiHints`                           | Nie      | `Record<string, object>`         | Etykiety UI, placeholdery i wskazówki dotyczące wrażliwości dla pól konfiguracji.                                                                                                                            |

## Opis `providerAuthChoices`

Każdy wpis `providerAuthChoices` opisuje jeden wybór onboardingu lub uwierzytelniania.
OpenClaw odczytuje to przed załadowaniem runtime providera.

| Pole                 | Wymagane | Typ                                             | Co oznacza                                                                                                      |
| -------------------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `provider`           | Tak      | `string`                                        | Identyfikator providera, do którego należy ten wybór.                                                           |
| `method`             | Tak      | `string`                                        | Identyfikator metody auth, do której ma nastąpić przekazanie.                                                  |
| `choiceId`           | Tak      | `string`                                        | Stabilny identyfikator wyboru auth używany przez onboarding i przepływy CLI.                                   |
| `choiceLabel`        | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli zostanie pominięta, OpenClaw użyje `choiceId`.                       |
| `choiceHint`         | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                         |
| `assistantPriority`  | Nie      | `number`                                        | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.              |
| `assistantVisibility`| Nie      | `"visible"` \| `"manual-only"`                  | Ukrywa wybór w selektorach asystenta, nadal pozwalając na ręczny wybór w CLI.                                 |
| `deprecatedChoiceIds`| Nie      | `string[]`                                      | Starsze identyfikatory wyboru, które powinny przekierowywać użytkowników do tego zastępczego wyboru.          |
| `groupId`            | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych wyborów.                                              |
| `groupLabel`         | Nie      | `string`                                        | Etykieta tej grupy widoczna dla użytkownika.                                                                   |
| `groupHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                             |
| `optionKey`          | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów auth z jedną flagą.                                            |
| `cliFlag`            | Nie      | `string`                                        | Nazwa flagi CLI, na przykład `--openrouter-api-key`.                                                           |
| `cliOption`          | Nie      | `string`                                        | Pełny kształt opcji CLI, na przykład `--openrouter-api-key <key>`.                                            |
| `cliDescription`     | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                                     |
| `onboardingScopes`   | Nie      | `Array<"text-inference" \| "image-generation">` | Na których powierzchniach onboardingu ten wybór powinien się pojawiać. Jeśli pole zostanie pominięte, domyślnie używane jest `["text-inference"]`. |

## Opis `commandAliases`

Użyj `commandAliases`, gdy Plugin posiada nazwę polecenia runtime, którą użytkownicy
mogą błędnie umieścić w `plugins.allow` lub próbować uruchomić jako główne polecenie CLI. OpenClaw
używa tych metadanych do diagnostyki bez importowania kodu runtime Pluginu.

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
| `name`       | Tak      | `string`          | Nazwa polecenia należącego do tego Pluginu.                                |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie slash czatu, a nie główne polecenie CLI.      |
| `cliCommand` | Nie      | `string`          | Powiązane główne polecenie CLI sugerowane do operacji CLI, jeśli istnieje. |

## Opis `activation`

Użyj `activation`, gdy Plugin może w tani sposób zadeklarować, które zdarzenia control-plane
powinny aktywować go później.

## Opis `qaRunners`

Użyj `qaRunners`, gdy Plugin wnosi jeden lub więcej runnerów transportu pod współdzielony
główny węzeł `openclaw qa`. Zachowaj te metadane jako lekkie i statyczne; rzeczywista rejestracja CLI nadal należy do runtime
Pluginu poprzez lekką powierzchnię `runtime-api.ts`, która eksportuje `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Uruchom opartą na Dockerze aktywną ścieżkę QA Matrix przeciwko tymczasowemu homeserverowi"
    }
  ]
}
```

| Pole          | Wymagane | Typ      | Co oznacza                                                           |
| ------------- | -------- | -------- | -------------------------------------------------------------------- |
| `commandName` | Tak      | `string` | Podpolecenie montowane pod `openclaw qa`, na przykład `matrix`.      |
| `description` | Nie      | `string` | Zapasowy tekst pomocy używany, gdy współdzielony host potrzebuje polecenia zastępczego. |

Ten blok zawiera wyłącznie metadane. Nie rejestruje zachowania runtime i nie
zastępuje `register(...)`, `setupEntry` ani innych entrypointów runtime/Pluginu.
Obecni konsumenci używają go jako wskazówki zawężającej przed szerszym ładowaniem Pluginu, więc
brak metadanych aktywacji zwykle wpływa tylko na wydajność; nie powinien
zmieniać poprawności, dopóki nadal istnieją starsze mechanizmy własności w manifeście.

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

| Pole             | Wymagane | Typ                                                  | Co oznacza                                                           |
| ---------------- | -------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `onProviders`    | Nie      | `string[]`                                           | Identyfikatory providerów, które powinny aktywować ten Plugin na żądanie. |
| `onCommands`     | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny aktywować ten Plugin.          |
| `onChannels`     | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny aktywować ten Plugin.          |
| `onRoutes`       | Nie      | `string[]`                                           | Rodzaje tras, które powinny aktywować ten Plugin.                    |
| `onCapabilities` | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Ogólne wskazówki capabilities używane przez planowanie aktywacji control-plane. |

Obecni aktywni konsumenci:

- planowanie CLI wyzwalane poleceniami wraca do starszych
  `commandAliases[].cliCommand` lub `commandAliases[].name`
- planowanie konfiguracji/kanału wyzwalane kanałem wraca do starszej własności `channels[]`,
  gdy brakuje jawnych metadanych aktywacji kanału
- planowanie konfiguracji/runtime wyzwalane providerem wraca do starszej
  własności `providers[]` i najwyższego poziomu `cliBackends[]`, gdy brakuje jawnych metadanych aktywacji providera

## Opis `setup`

Użyj `setup`, gdy powierzchnie konfiguracji i onboardingu potrzebują lekkich metadanych należących do Pluginu
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

Najwyższego poziomu `cliBackends` pozostaje poprawne i nadal opisuje backendy
inferencji CLI. `setup.cliBackends` to powierzchnia deskryptora specyficzna dla konfiguracji
dla przepływów control-plane/konfiguracji, które powinny pozostać wyłącznie metadanymi.

Jeśli są obecne, `setup.providers` i `setup.cliBackends` są preferowaną
powierzchnią wyszukiwania opartą najpierw na deskryptorze dla wykrywania konfiguracji. Jeśli deskryptor jedynie zawęża
kandydujący Plugin, a konfiguracja nadal potrzebuje bogatszych hooków runtime działających w czasie konfiguracji,
ustaw `requiresRuntime: true` i pozostaw `setup-api` jako
zapasową ścieżkę wykonania.

Ponieważ wyszukiwanie konfiguracji może wykonywać należący do Pluginu kod `setup-api`,
znormalizowane wartości `setup.providers[].id` i `setup.cliBackends[]` muszą pozostać unikalne globalnie
we wszystkich wykrytych Pluginach. Niejednoznaczna własność kończy się bezpiecznym zamknięciem zamiast wybierania
zwycięzcy na podstawie kolejności wykrywania.

### Opis `setup.providers`

| Pole          | Wymagane | Typ        | Co oznacza                                                                                 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------------ |
| `id`          | Tak      | `string`   | Identyfikator providera ujawniany podczas konfiguracji lub onboardingu. Zachowaj globalną unikalność znormalizowanych identyfikatorów. |
| `authMethods` | Nie      | `string[]` | Identyfikatory metod konfiguracji/auth obsługiwane przez tego providera bez ładowania pełnego runtime. |
| `envVars`     | Nie      | `string[]` | Zmienne środowiskowe, które ogólne powierzchnie konfiguracji/statusu mogą sprawdzać przed załadowaniem runtime Pluginu. |

### Pola `setup`

| Pole               | Wymagane | Typ        | Co oznacza                                                                                          |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Nie      | `object[]` | Deskryptory konfiguracji providera ujawniane podczas konfiguracji i onboardingu.                    |
| `cliBackends`      | Nie      | `string[]` | Identyfikatory backendów używane w czasie konfiguracji do wyszukiwania najpierw po deskryptorze. Zachowaj globalną unikalność znormalizowanych identyfikatorów. |
| `configMigrations` | Nie      | `string[]` | Identyfikatory migracji konfiguracji należące do powierzchni konfiguracji tego Pluginu.             |
| `requiresRuntime`  | Nie      | `boolean`  | Czy konfiguracja nadal wymaga wykonania `setup-api` po wyszukaniu po deskryptorze.                  |

## Opis `uiHints`

`uiHints` to mapa od nazw pól konfiguracji do niewielkich wskazówek renderowania.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Klucz API",
      "help": "Używany do żądań OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Każda wskazówka pola może zawierać:

| Pole          | Typ        | Co oznacza                                |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Etykieta pola widoczna dla użytkownika.   |
| `help`        | `string`   | Krótki tekst pomocniczy.                  |
| `tags`        | `string[]` | Opcjonalne tagi UI.                       |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.           |
| `sensitive`   | `boolean`  | Oznacza pole jako sekretne lub wrażliwe.  |
| `placeholder` | `string`   | Tekst placeholdera dla pól formularza.    |

## Opis `contracts`

Używaj `contracts` wyłącznie do statycznych metadanych własności capabilities, które OpenClaw może
odczytać bez importowania runtime Pluginu.

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

| Pole                             | Typ        | Co oznacza                                                       |
| -------------------------------- | ---------- | ---------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Identyfikatory providerów speech należących do tego Pluginu.     |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory providerów realtime transcription należących do tego Pluginu. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory providerów realtime voice należących do tego Pluginu. |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory providerów media-understanding należących do tego Pluginu. |
| `imageGenerationProviders`       | `string[]` | Identyfikatory providerów image-generation należących do tego Pluginu. |
| `videoGenerationProviders`       | `string[]` | Identyfikatory providerów video-generation należących do tego Pluginu. |
| `webFetchProviders`              | `string[]` | Identyfikatory providerów web-fetch należących do tego Pluginu.  |
| `webSearchProviders`             | `string[]` | Identyfikatory providerów web search należących do tego Pluginu. |
| `tools`                          | `string[]` | Nazwy tools agenta należących do tego Pluginu do sprawdzania kontraktów wbudowanych. |

## Opis `channelConfigs`

Użyj `channelConfigs`, gdy Plugin kanału potrzebuje lekkich metadanych konfiguracji przed
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
          "label": "URL homeservera",
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

| Pole          | Typ                      | Co oznacza                                                                                 |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema dla `channels.<id>`. Wymagane dla każdego zadeklarowanego wpisu konfiguracji kanału. |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety UI/placeholdery/wskazówki dotyczące wrażliwości dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami selektora i inspekcji, gdy metadane runtime nie są jeszcze gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                   |
| `preferOver`  | `string[]`               | Starsze lub niżej priorytetyzowane identyfikatory Pluginów, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

## Opis `modelSupport`

Użyj `modelSupport`, gdy OpenClaw ma wnioskować o Twoim Pluginie providera na podstawie
skróconych identyfikatorów modeli takich jak `gpt-5.4` lub `claude-sonnet-4.6`, zanim runtime Pluginu
zostanie załadowany.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje następujący priorytet:

- jawne odwołania `provider/model` używają metadanych manifestu `providers` należących do właściciela
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli pasują jednocześnie jeden Plugin niewbudowany i jeden wbudowany, wygrywa Plugin
  niewbudowany
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik lub konfiguracja nie określi providera

Pola:

| Pole            | Typ        | Co oznacza                                                                          |
| --------------- | ---------- | ----------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane za pomocą `startsWith` do skróconych identyfikatorów modeli. |
| `modelPatterns` | `string[]` | Źródła regex dopasowywane do skróconych identyfikatorów modeli po usunięciu sufiksu profilu. |

Starsze klucze capabilities najwyższego poziomu są przestarzałe. Użyj `openclaw doctor --fix`, aby
przenieść `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` i `webSearchProviders` do `contracts`; zwykłe
ładowanie manifestu nie traktuje już tych pól najwyższego poziomu jako
własności capabilities.

## Manifest a package.json

Te dwa pliki pełnią różne role:

| Plik                   | Używaj go do                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Wykrywania, walidacji konfiguracji, metadanych wyboru auth i wskazówek UI, które muszą istnieć przed uruchomieniem kodu Pluginu |
| `package.json`         | Metadanych npm, instalacji zależności oraz bloku `openclaw` używanego dla entrypointów, kontroli instalacji, konfiguracji lub metadanych katalogu |

Jeśli nie masz pewności, gdzie powinien trafić dany fragment metadanych, zastosuj tę zasadę:

- jeśli OpenClaw musi znać go przed załadowaniem kodu Pluginu, umieść go w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików entry lub zachowania instalacji npm, umieść go w `package.json`

### Pola `package.json`, które wpływają na wykrywanie

Część metadanych Pluginu używanych przed runtime celowo znajduje się w `package.json` w bloku
`openclaw`, a nie w `openclaw.plugin.json`.

Ważne przykłady:

| Pole                                                              | Co oznacza                                                                                                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklaruje natywne entrypointy Pluginu.                                                                                                       |
| `openclaw.setupEntry`                                             | Lekki entrypoint tylko do konfiguracji, używany podczas onboardingu i opóźnionego uruchamiania kanału.                                      |
| `openclaw.channel`                                                | Lekkie metadane katalogu kanałów, takie jak etykiety, ścieżki do dokumentacji, aliasy i teksty wyboru.                                     |
| `openclaw.channel.configuredState`                                | Lekkie metadane sprawdzania stanu konfiguracji, które mogą odpowiedzieć na pytanie „czy konfiguracja tylko z env już istnieje?” bez ładowania pełnego runtime kanału. |
| `openclaw.channel.persistedAuthState`                             | Lekkie metadane sprawdzania utrwalonego stanu auth, które mogą odpowiedzieć na pytanie „czy coś jest już zalogowane?” bez ładowania pełnego runtime kanału. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Wskazówki instalacji/aktualizacji dla Pluginów wbudowanych i publikowanych zewnętrznie.                                                      |
| `openclaw.install.defaultChoice`                                  | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                |
| `openclaw.install.minHostVersion`                                 | Minimalna obsługiwana wersja hosta OpenClaw, z użyciem dolnego ograniczenia semver, na przykład `>=2026.3.22`.                              |
| `openclaw.install.allowInvalidConfigRecovery`                     | Pozwala na wąską ścieżkę odzyskiwania przez ponowną instalację wbudowanego Pluginu, gdy konfiguracja jest nieprawidłowa.                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Umożliwia załadowanie powierzchni kanału tylko do konfiguracji przed pełnym Pluginem kanału podczas uruchamiania.                           |

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i ładowania rejestru
manifestu. Nieprawidłowe wartości są odrzucane; nowsze, ale poprawne wartości powodują pominięcie
Pluginu na starszych hostach.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie
sprawia, że dowolnie uszkodzone konfiguracje stają się instalowalne. Obecnie pozwala tylko przepływom instalacji
odzyskać stan po określonych nieaktualnych błędach aktualizacji wbudowanego Pluginu, takich jak
brakująca ścieżka wbudowanego Pluginu lub nieaktualny wpis `channels.<id>` dla tego samego
wbudowanego Pluginu. Niezwiązane błędy konfiguracji nadal blokują instalację i kierują operatorów
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

Użyj tego, gdy przepływy konfiguracji, doctor lub configured-state potrzebują lekkiego
sprawdzenia auth typu tak/nie przed załadowaniem pełnego Pluginu kanału. Eksport docelowy powinien być małą
funkcją, która odczytuje wyłącznie stan utrwalony; nie kieruj go przez pełny
barrel runtime kanału.

`openclaw.channel.configuredState` ma ten sam kształt dla lekkich sprawdzeń
skonfigurowania wyłącznie na podstawie env:

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

Użyj tego, gdy kanał może odpowiedzieć o stanie konfiguracji na podstawie env lub innych małych
wejść niezwiązanych z runtime. Jeśli sprawdzenie wymaga pełnego rozwiązywania konfiguracji lub rzeczywistego
runtime kanału, pozostaw tę logikę w hooku Pluginu `config.hasConfiguredState`.

## Wymagania JSON Schema

- **Każdy Plugin musi dostarczać JSON Schema**, nawet jeśli nie przyjmuje żadnej konfiguracji.
- Pusty schemat jest akceptowalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane podczas odczytu/zapisu konfiguracji, a nie w runtime.

## Zachowanie walidacji

- Nieznane klucze `channels.*` są **błędami**, chyba że identyfikator kanału jest zadeklarowany
  przez manifest Pluginu.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` i `plugins.slots.*`
  muszą odwoływać się do **wykrywalnych** identyfikatorów Pluginów. Nieznane identyfikatory są **błędami**.
- Jeśli Plugin jest zainstalowany, ale ma uszkodzony lub brakujący manifest albo schemat,
  walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd Pluginu.
- Jeśli konfiguracja Pluginu istnieje, ale Plugin jest **wyłączony**, konfiguracja zostaje zachowana, a
  w Doctor + logach pojawia się **ostrzeżenie**.

Pełny schemat `plugins.*` znajdziesz w [Opisie konfiguracji](/pl/gateway/configuration).

## Uwagi

- Manifest jest **wymagany dla natywnych Pluginów OpenClaw**, w tym dla ładowania z lokalnego systemu plików.
- Runtime nadal ładuje moduł Pluginu osobno; manifest służy wyłącznie do
  wykrywania + walidacji.
- Natywne manifesty są parsowane przy użyciu JSON5, więc komentarze, końcowe przecinki i
  klucze bez cudzysłowów są akceptowane, o ile wartość końcowa nadal jest obiektem.
- Loader manifestu odczytuje wyłącznie udokumentowane pola manifestu. Unikaj dodawania
  tutaj własnych kluczy najwyższego poziomu.
- `providerAuthEnvVars` to lekka ścieżka metadanych dla sprawdzeń auth, walidacji
  znaczników env i podobnych powierzchni auth providera, które nie powinny uruchamiać runtime Pluginu
  tylko po to, aby sprawdzić nazwy env.
- `providerAuthAliases` pozwala wariantom providera ponownie używać zmiennych env auth,
  profili auth, auth opartego na konfiguracji i wyboru onboardingu klucza API innego providera
  bez hardcodowania tej relacji w rdzeniu.
- `providerEndpoints` pozwala Pluginom providera zarządzać prostymi metadanymi dopasowywania
  hosta/baseUrl endpointu. Używaj tego tylko dla klas endpointów, które rdzeń już obsługuje;
  zachowanie runtime nadal należy do Pluginu.
- `syntheticAuthRefs` to lekka ścieżka metadanych dla należących do providera hooków
  synthetic auth, które muszą być widoczne dla zimnego wykrywania modeli, zanim rejestr runtime
  zacznie istnieć. Wypisuj tylko odwołania, których runtime provider lub backend CLI rzeczywiście
  implementuje `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` to lekka ścieżka metadanych dla należących do wbudowanego Pluginu
  zastępczych kluczy API, takich jak znaczniki lokalne, OAuth lub ambient credential.
  Rdzeń traktuje je jako niesekretne na potrzeby wyświetlania auth i audytów sekretów bez
  hardcodowania właściciela providera.
- `channelEnvVars` to lekka ścieżka metadanych dla fallbacku shell-env, promptów konfiguracji
  i podobnych powierzchni kanału, które nie powinny uruchamiać runtime Pluginu
  tylko po to, aby sprawdzić nazwy env.
- `providerAuthChoices` to lekka ścieżka metadanych dla selektorów wyboru auth,
  rozwiązywania `--auth-choice`, mapowania preferowanego providera i prostej rejestracji
  flag CLI onboardingu przed załadowaniem runtime providera. Metadane kreatora runtime,
  które wymagają kodu providera, opisano tutaj:
  [Hooki runtime providera](/pl/plugins/architecture#provider-runtime-hooks).
- Wyłączne typy Pluginów są wybierane przez `plugins.slots.*`.
  - `kind: "memory"` jest wybierane przez `plugins.slots.memory`.
  - `kind: "context-engine"` jest wybierane przez `plugins.slots.contextEngine`
    (domyślnie: wbudowane `legacy`).
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, jeśli
  Plugin ich nie potrzebuje.
- Jeśli Twój Plugin zależy od modułów natywnych, opisz kroki budowania oraz wszelkie
  wymagania dotyczące allowlist menedżera pakietów (na przykład pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Powiązane

- [Tworzenie Pluginów](/pl/plugins/building-plugins) — pierwsze kroki z Pluginami
- [Architektura Pluginów](/pl/plugins/architecture) — architektura wewnętrzna
- [Przegląd SDK](/pl/plugins/sdk-overview) — opis Plugin SDK
