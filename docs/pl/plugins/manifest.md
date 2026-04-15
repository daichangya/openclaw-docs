---
read_when:
    - Tworzysz Plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji Plugin lub debugować błędy walidacji Plugin
summary: Wymagania dotyczące manifestu Plugin + schematu JSON (ścisła walidacja konfiguracji)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-04-15T09:51:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba2183bfa8802871e4ef33a0ebea290606e8351e9e83e25ee72456addb768730
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest Plugin (`openclaw.plugin.json`)

Ta strona dotyczy wyłącznie **natywnego manifestu Plugin OpenClaw**.

Informacje o zgodnych układach bundli znajdziesz w [Plugin bundles](/pl/plugins/bundles).

Zgodne formaty bundli używają innych plików manifestu:

- bundle Codex: `.codex-plugin/plugin.json`
- bundle Claude: `.claude-plugin/plugin.json` lub domyślny układ komponentu Claude
  bez manifestu
- bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw również automatycznie wykrywa te układy bundli, ale nie są one walidowane
względem schematu `openclaw.plugin.json` opisanego tutaj.

W przypadku zgodnych bundli OpenClaw obecnie odczytuje metadane bundla oraz zadeklarowane
korzenie skilli, korzenie poleceń Claude, domyślne wartości `settings.json` bundla Claude,
domyślne ustawienia LSP bundla Claude oraz obsługiwane pakiety hooków, gdy układ odpowiada
oczekiwaniom środowiska uruchomieniowego OpenClaw.

Każdy natywny Plugin OpenClaw **musi** dostarczać plik `openclaw.plugin.json` w
**katalogu głównym Plugin**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu Plugin**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy Plugin i blokują walidację konfiguracji.

Zobacz pełny przewodnik po systemie Plugin: [Plugins](/pl/tools/plugin).
Informacje o natywnym modelu możliwości i aktualnych wytycznych dotyczących zewnętrznej kompatybilności:
[Model możliwości](/pl/plugins/architecture#public-capability-model).

## Do czego służy ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje przed załadowaniem
kodu Twojego Plugin.

Używaj go do:

- tożsamości Plugin
- walidacji konfiguracji
- metadanych uwierzytelniania i onboardingu, które powinny być dostępne bez uruchamiania środowiska uruchomieniowego Plugin
- tanich wskazówek aktywacji, które powierzchnie płaszczyzny sterowania mogą sprawdzać przed załadowaniem środowiska uruchomieniowego
- tanich deskryptorów konfiguracji, które powierzchnie konfiguracji/onboardingu mogą sprawdzać przed załadowaniem środowiska uruchomieniowego
- metadanych aliasów i automatycznego włączania, które powinny być rozstrzygane przed załadowaniem środowiska uruchomieniowego Plugin
- skróconych metadanych własności rodziny modeli, które powinny automatycznie aktywować Plugin przed załadowaniem środowiska uruchomieniowego
- statycznych migawek własności możliwości używanych do zgodnego okablowania bundli i pokrycia kontraktów
- tanich metadanych runnera QA, które współdzielony host `openclaw qa` może sprawdzać przed załadowaniem środowiska uruchomieniowego Plugin
- metadanych konfiguracji specyficznych dla kanału, które powinny zostać scalone z powierzchniami katalogu i walidacji bez ładowania środowiska uruchomieniowego
- wskazówek UI konfiguracji

Nie używaj go do:

- rejestrowania zachowania w czasie wykonywania
- deklarowania punktów wejścia kodu
- metadanych instalacji npm

Te elementy należą do kodu Plugin i `package.json`.

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

## Opis pól najwyższego poziomu

| Pole                                | Wymagane | Typ                              | Znaczenie                                                                                                                                                                                                    |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Tak      | `string`                         | Kanoniczny identyfikator Plugin. Jest to identyfikator używany w `plugins.entries.<id>`.                                                                                                                    |
| `configSchema`                      | Tak      | `object`                         | Wbudowany schemat JSON Schema dla konfiguracji tego Plugin.                                                                                                                                                  |
| `enabledByDefault`                  | Nie      | `true`                           | Oznacza bundlowany Plugin jako domyślnie włączony. Pomiń to pole lub ustaw dowolną wartość inną niż `true`, aby pozostawić Plugin domyślnie wyłączony.                                                     |
| `legacyPluginIds`                   | Nie      | `string[]`                       | Starsze identyfikatory normalizowane do tego kanonicznego identyfikatora Plugin.                                                                                                                            |
| `autoEnableWhenConfiguredProviders` | Nie      | `string[]`                       | Identyfikatory dostawców, które powinny automatycznie włączyć ten Plugin, gdy uwierzytelnianie, konfiguracja lub odwołania do modeli o nich wspominają.                                                    |
| `kind`                              | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj Plugin używany przez `plugins.slots.*`.                                                                                                                                            |
| `channels`                          | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego Plugin. Używane do wykrywania i walidacji konfiguracji.                                                                                                           |
| `providers`                         | Nie      | `string[]`                       | Identyfikatory dostawców należących do tego Plugin.                                                                                                                                                          |
| `modelSupport`                      | Nie      | `object`                         | Należące do manifestu skrócone metadane rodziny modeli używane do automatycznego ładowania Plugin przed uruchomieniem środowiska wykonawczego.                                                             |
| `cliBackends`                       | Nie      | `string[]`                       | Identyfikatory backendów inferencji CLI należących do tego Plugin. Używane do automatycznej aktywacji przy uruchomieniu na podstawie jawnych odwołań w konfiguracji.                                      |
| `commandAliases`                    | Nie      | `object[]`                       | Nazwy poleceń należących do tego Plugin, które powinny generować diagnostykę konfiguracji i CLI świadomą Plugin przed załadowaniem środowiska uruchomieniowego.                                            |
| `providerAuthEnvVars`               | Nie      | `Record<string, string[]>`       | Lekkie metadane zmiennych środowiskowych uwierzytelniania dostawcy, które OpenClaw może sprawdzać bez ładowania kodu Plugin.                                                                               |
| `providerAuthAliases`               | Nie      | `Record<string, string>`         | Identyfikatory dostawców, które powinny ponownie używać innego identyfikatora dostawcy do wyszukiwania uwierzytelniania, na przykład dostawca kodowania współdzielący bazowy klucz API i profile auth.    |
| `channelEnvVars`                    | Nie      | `Record<string, string[]>`       | Lekkie metadane zmiennych środowiskowych kanału, które OpenClaw może sprawdzać bez ładowania kodu Plugin. Użyj tego dla konfiguracji kanału sterowanej przez env lub powierzchni auth, które powinny być widoczne dla generycznych pomocników uruchamiania/konfiguracji. |
| `providerAuthChoices`               | Nie      | `object[]`                       | Lekkie metadane wyboru uwierzytelniania dla selektorów onboardingu, rozstrzygania preferowanego dostawcy i prostego mapowania flag CLI.                                                                    |
| `activation`                        | Nie      | `object`                         | Lekkie wskazówki aktywacji dla ładowania wyzwalanego przez dostawcę, polecenie, kanał, trasę i możliwości. Tylko metadane; rzeczywiste zachowanie nadal należy do środowiska uruchomieniowego Plugin.      |
| `setup`                             | Nie      | `object`                         | Lekkie deskryptory konfiguracji/onboardingu, które powierzchnie wykrywania i konfiguracji mogą sprawdzać bez ładowania środowiska uruchomieniowego Plugin.                                                |
| `qaRunners`                         | Nie      | `object[]`                       | Lekkie deskryptory runnerów QA używane przez współdzielony host `openclaw qa` przed załadowaniem środowiska uruchomieniowego Plugin.                                                                       |
| `contracts`                         | Nie      | `object`                         | Statyczna migawka możliwości bundla dla speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search i własności narzędzi. |
| `channelConfigs`                    | Nie      | `Record<string, object>`         | Należące do manifestu metadane konfiguracji kanału scalane z powierzchniami wykrywania i walidacji przed załadowaniem środowiska uruchomieniowego.                                                         |
| `skills`                            | Nie      | `string[]`                       | Katalogi Skills do załadowania, względne względem katalogu głównego Plugin.                                                                                                                                  |
| `name`                              | Nie      | `string`                         | Czytelna dla człowieka nazwa Plugin.                                                                                                                                                                         |
| `description`                       | Nie      | `string`                         | Krótkie podsumowanie wyświetlane na powierzchniach Plugin.                                                                                                                                                   |
| `version`                           | Nie      | `string`                         | Informacyjna wersja Plugin.                                                                                                                                                                                  |
| `uiHints`                           | Nie      | `Record<string, object>`         | Etykiety UI, placeholdery i wskazówki dotyczące wrażliwości dla pól konfiguracji.                                                                                                                           |

## Opis `providerAuthChoices`

Każdy wpis `providerAuthChoices` opisuje jeden wybór onboardingu lub uwierzytelniania.
OpenClaw odczytuje to przed załadowaniem środowiska uruchomieniowego dostawcy.

| Pole                  | Wymagane | Typ                                             | Znaczenie                                                                                                  |
| --------------------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Tak      | `string`                                        | Identyfikator dostawcy, do którego należy ten wybór.                                                       |
| `method`              | Tak      | `string`                                        | Identyfikator metody uwierzytelniania, do której należy przekazać sterowanie.                              |
| `choiceId`            | Tak      | `string`                                        | Stabilny identyfikator wyboru uwierzytelniania używany przez onboarding i przepływy CLI.                   |
| `choiceLabel`         | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli zostanie pominięta, OpenClaw użyje `choiceId`.                   |
| `choiceHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                     |
| `assistantPriority`   | Nie      | `number`                                        | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.          |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                  | Ukrywa wybór przed selektorami asystenta, nadal pozwalając na ręczny wybór w CLI.                         |
| `deprecatedChoiceIds` | Nie      | `string[]`                                      | Starsze identyfikatory wyboru, które powinny przekierowywać użytkowników do tego wyboru zastępczego.      |
| `groupId`             | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych wyborów.                                          |
| `groupLabel`          | Nie      | `string`                                        | Etykieta tej grupy widoczna dla użytkownika.                                                               |
| `groupHint`           | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                         |
| `optionKey`           | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów uwierzytelniania z jedną flagą.                            |
| `cliFlag`             | Nie      | `string`                                        | Nazwa flagi CLI, na przykład `--openrouter-api-key`.                                                       |
| `cliOption`           | Nie      | `string`                                        | Pełny kształt opcji CLI, na przykład `--openrouter-api-key <key>`.                                         |
| `cliDescription`      | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                                 |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">` | Określa, na których powierzchniach onboardingu ten wybór powinien się pojawiać. Jeśli zostanie pominięte, domyślnie używane jest `["text-inference"]`. |

## Opis `commandAliases`

Używaj `commandAliases`, gdy Plugin jest właścicielem nazwy polecenia czasu wykonywania, którą użytkownicy mogą
omyłkowo umieścić w `plugins.allow` lub próbować uruchomić jako główne polecenie CLI. OpenClaw
używa tych metadanych do diagnostyki bez importowania kodu środowiska uruchomieniowego Plugin.

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

| Pole         | Wymagane | Typ               | Znaczenie                                                              |
| ------------ | -------- | ----------------- | ---------------------------------------------------------------------- |
| `name`       | Tak      | `string`          | Nazwa polecenia należąca do tego Plugin.                               |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie slash czatu, a nie główne polecenie CLI.  |
| `cliCommand` | Nie      | `string`          | Powiązane główne polecenie CLI sugerowane dla operacji CLI, jeśli istnieje. |

## Opis `activation`

Używaj `activation`, gdy Plugin może w prosty sposób zadeklarować, które zdarzenia płaszczyzny sterowania
powinny aktywować go później.

## Opis `qaRunners`

Używaj `qaRunners`, gdy Plugin dodaje jeden lub więcej runnerów transportu pod
wspólnym korzeniem `openclaw qa`. Zachowaj te metadane jako lekkie i statyczne; środowisko uruchomieniowe Plugin
nadal odpowiada za faktyczną rejestrację CLI przez lekką powierzchnię
`runtime-api.ts`, która eksportuje `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Uruchom wspieraną przez Docker ścieżkę live QA Matrix na jednorazowym homeserverze"
    }
  ]
}
```

| Pole          | Wymagane | Typ      | Znaczenie                                                           |
| ------------- | -------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Tak      | `string` | Podpolecenie montowane pod `openclaw qa`, na przykład `matrix`.     |
| `description` | Nie      | `string` | Zapasowy tekst pomocy używany, gdy współdzielony host potrzebuje polecenia zastępczego. |

Ten blok to tylko metadane. Nie rejestruje zachowania w czasie wykonywania i nie
zastępuje `register(...)`, `setupEntry` ani innych punktów wejścia runtime/Plugin.
Obecni konsumenci używają go jako wskazówki zawężającej przed szerszym ładowaniem Plugin, więc
brak metadanych aktywacji zwykle wpływa tylko na wydajność; nie powinien
zmieniać poprawności, dopóki istnieją jeszcze starsze fallbacki własności manifestu.

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

| Pole             | Wymagane | Typ                                                  | Znaczenie                                                          |
| ---------------- | -------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `onProviders`    | Nie      | `string[]`                                           | Identyfikatory dostawców, które powinny aktywować ten Plugin po żądaniu. |
| `onCommands`     | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny aktywować ten Plugin.        |
| `onChannels`     | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny aktywować ten Plugin.        |
| `onRoutes`       | Nie      | `string[]`                                           | Rodzaje tras, które powinny aktywować ten Plugin.                  |
| `onCapabilities` | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Szerokie wskazówki dotyczące możliwości używane przez planowanie aktywacji płaszczyzny sterowania. |

Obecni aktywni konsumenci:

- planowanie CLI wyzwalane poleceniem korzysta awaryjnie ze starszego
  `commandAliases[].cliCommand` lub `commandAliases[].name`
- planowanie konfiguracji/kanału wyzwalane kanałem korzysta awaryjnie ze starszej
  własności `channels[]`, gdy brakuje jawnych metadanych aktywacji kanału
- planowanie konfiguracji/runtime wyzwalane dostawcą korzysta awaryjnie ze starszej
  własności `providers[]` i najwyższego poziomu `cliBackends[]`, gdy brakuje jawnych metadanych aktywacji dostawcy

## Opis `setup`

Używaj `setup`, gdy powierzchnie konfiguracji i onboardingu potrzebują lekkich metadanych należących do Plugin
przed załadowaniem środowiska uruchomieniowego.

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

Najwyższego poziomu `cliBackends` pozostaje prawidłowe i nadal opisuje backendy
inferencji CLI. `setup.cliBackends` to powierzchnia deskryptorów specyficzna dla konfiguracji
dla przepływów płaszczyzny sterowania/konfiguracji, które powinny pozostać wyłącznie metadanymi.

Jeśli są obecne, `setup.providers` i `setup.cliBackends` są preferowaną
powierzchnią wyszukiwania konfiguracji w modelu descriptor-first dla wykrywania konfiguracji. Jeśli deskryptor tylko
zawęża kandydujący Plugin, a konfiguracja nadal potrzebuje bogatszych hooków runtime na etapie konfiguracji,
ustaw `requiresRuntime: true` i pozostaw `setup-api` jako
zapasową ścieżkę wykonania.

Ponieważ wyszukiwanie konfiguracji może wykonywać należący do Plugin kod `setup-api`,
znormalizowane wartości `setup.providers[].id` i `setup.cliBackends[]` muszą pozostać unikalne
we wszystkich wykrytych Plugin. Niejednoznaczna własność kończy się bezpieczną odmową zamiast wybierania
zwycięzcy na podstawie kolejności wykrywania.

### Opis `setup.providers`

| Pole          | Wymagane | Typ        | Znaczenie                                                                                  |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------------ |
| `id`          | Tak      | `string`   | Identyfikator dostawcy ujawniany podczas konfiguracji lub onboardingu. Zachowaj globalnie unikalne znormalizowane identyfikatory. |
| `authMethods` | Nie      | `string[]` | Identyfikatory metod konfiguracji/uwierzytelniania, które ten dostawca obsługuje bez ładowania pełnego runtime. |
| `envVars`     | Nie      | `string[]` | Zmienne środowiskowe, które generyczne powierzchnie konfiguracji/statusu mogą sprawdzać przed załadowaniem środowiska uruchomieniowego Plugin. |

### Pola `setup`

| Pole               | Wymagane | Typ        | Znaczenie                                                                                             |
| ------------------ | -------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | Nie      | `object[]` | Deskryptory konfiguracji dostawców ujawniane podczas konfiguracji i onboardingu.                     |
| `cliBackends`      | Nie      | `string[]` | Identyfikatory backendów czasu konfiguracji używane do wyszukiwania konfiguracji w modelu descriptor-first. Zachowaj globalnie unikalne znormalizowane identyfikatory. |
| `configMigrations` | Nie      | `string[]` | Identyfikatory migracji konfiguracji należące do powierzchni konfiguracji tego Plugin.               |
| `requiresRuntime`  | Nie      | `boolean`  | Czy konfiguracja nadal wymaga wykonania `setup-api` po wyszukaniu deskryptora.                       |

## Opis `uiHints`

`uiHints` to mapa nazw pól konfiguracji do małych wskazówek renderowania.

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

| Pole          | Typ        | Znaczenie                                |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Etykieta pola widoczna dla użytkownika.  |
| `help`        | `string`   | Krótki tekst pomocniczy.                 |
| `tags`        | `string[]` | Opcjonalne tagi UI.                      |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.          |
| `sensitive`   | `boolean`  | Oznacza pole jako sekretne lub wrażliwe. |
| `placeholder` | `string`   | Tekst placeholdera dla pól formularza.   |

## Opis `contracts`

Używaj `contracts` tylko dla statycznych metadanych własności możliwości, które OpenClaw może
odczytać bez importowania środowiska uruchomieniowego Plugin.

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

| Pole                             | Typ        | Znaczenie                                                           |
| -------------------------------- | ---------- | ------------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Identyfikatory dostawców speech należących do tego Plugin.          |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców realtime transcription należących do tego Plugin. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców realtime voice należących do tego Plugin.  |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców media-understanding należących do tego Plugin. |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców image-generation należących do tego Plugin. |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców video-generation należących do tego Plugin. |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców web-fetch należących do tego Plugin.       |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców web search należących do tego Plugin.      |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należących do tego Plugin dla sprawdzania kontraktów bundli. |

## Opis `channelConfigs`

Używaj `channelConfigs`, gdy kanałowy Plugin potrzebuje lekkich metadanych konfiguracji przed
załadowaniem środowiska uruchomieniowego.

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
          "label": "URL homeserwera",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Połączenie z homeserwerem Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Każdy wpis kanału może zawierać:

| Pole          | Typ                      | Znaczenie                                                                                  |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema dla `channels.<id>`. Wymagane dla każdego zadeklarowanego wpisu konfiguracji kanału. |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety UI/placeholdery/wskazówki wrażliwości dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami wyboru i inspekcji, gdy metadane runtime nie są gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                  |
| `preferOver`  | `string[]`               | Starsze lub niższopriorytetowe identyfikatory Plugin, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

## Opis `modelSupport`

Używaj `modelSupport`, gdy OpenClaw powinien wywnioskować Twój Plugin dostawcy na podstawie
skrótowych identyfikatorów modeli takich jak `gpt-5.4` lub `claude-sonnet-4.6` przed załadowaniem runtime Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje następujący priorytet:

- jawne odwołania `provider/model` używają metadanych manifestu `providers` właściciela
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli pasują jednocześnie jeden Plugin niebundlowany i jeden bundlowany, wygrywa Plugin
  niebundlowany
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik lub konfiguracja nie określi dostawcy

Pola:

| Pole            | Typ        | Znaczenie                                                                      |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane przez `startsWith` do skrótowych identyfikatorów modeli. |
| `modelPatterns` | `string[]` | Źródła regex dopasowywane do skrótowych identyfikatorów modeli po usunięciu sufiksu profilu. |

Starsze klucze możliwości najwyższego poziomu są przestarzałe. Użyj `openclaw doctor --fix`, aby
przenieść `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` i `webSearchProviders` do `contracts`; zwykłe
ładowanie manifestu nie traktuje już tych pól najwyższego poziomu jako
własności możliwości.

## Manifest a package.json

Te dwa pliki pełnią różne role:

| Plik                   | Użycie                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Wykrywanie, walidacja konfiguracji, metadane wyboru uwierzytelniania i wskazówki UI, które muszą istnieć przed uruchomieniem kodu Plugin |
| `package.json`         | Metadane npm, instalacja zależności oraz blok `openclaw` używany dla punktów wejścia, blokowania instalacji, konfiguracji lub metadanych katalogu |

Jeśli nie masz pewności, gdzie powinien należeć dany fragment metadanych, użyj tej zasady:

- jeśli OpenClaw musi znać go przed załadowaniem kodu Plugin, umieść go w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików wejściowych lub zachowania instalacji npm, umieść go w `package.json`

### Pola package.json wpływające na wykrywanie

Część metadanych Plugin używanych przed uruchomieniem celowo znajduje się w `package.json` w bloku
`openclaw`, a nie w `openclaw.plugin.json`.

Ważne przykłady:

| Pole                                                              | Znaczenie                                                                                                                                   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklaruje natywne punkty wejścia Plugin.                                                                                                    |
| `openclaw.setupEntry`                                             | Lekki punkt wejścia tylko do konfiguracji, używany podczas onboardingu i odroczonego uruchamiania kanału.                                  |
| `openclaw.channel`                                                | Lekkie metadane katalogu kanału, takie jak etykiety, ścieżki dokumentacji, aliasy i teksty wyboru.                                        |
| `openclaw.channel.configuredState`                                | Lekkie metadane sprawdzania stanu skonfigurowania, które potrafią odpowiedzieć na pytanie „czy konfiguracja tylko z env już istnieje?” bez ładowania pełnego runtime kanału. |
| `openclaw.channel.persistedAuthState`                             | Lekkie metadane sprawdzania utrwalonego stanu auth, które potrafią odpowiedzieć na pytanie „czy cokolwiek jest już zalogowane?” bez ładowania pełnego runtime kanału. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Wskazówki instalacji/aktualizacji dla Plugin bundlowanych i publikowanych zewnętrznie.                                                     |
| `openclaw.install.defaultChoice`                                  | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                               |
| `openclaw.install.minHostVersion`                                 | Minimalna obsługiwana wersja hosta OpenClaw, używająca dolnego ograniczenia semver, na przykład `>=2026.3.22`.                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | Pozwala na wąską ścieżkę odzyskiwania przez ponowną instalację bundlowanego Plugin, gdy konfiguracja jest nieprawidłowa.                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Pozwala ładować powierzchnie kanału tylko do konfiguracji przed pełnym Plugin kanału podczas uruchamiania.                                 |

`openclaw.install.minHostVersion` jest wymuszane podczas instalacji i ładowania
rejestru manifestu. Nieprawidłowe wartości są odrzucane; nowsze, ale prawidłowe wartości powodują pominięcie
Plugin na starszych hostach.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie
sprawia, że dowolnie uszkodzone konfiguracje stają się możliwe do zainstalowania. Obecnie pozwala jedynie przepływom instalacji
odzyskać działanie po określonych nieaktualnych błędach aktualizacji bundlowanego Plugin, takich jak
brakująca ścieżka bundlowanego Plugin lub nieaktualny wpis `channels.<id>` dla tego samego
bundlowanego Plugin. Niepowiązane błędy konfiguracji nadal blokują instalację i kierują operatorów
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

Używaj tego, gdy przepływy konfiguracji, doctor lub configured-state potrzebują lekkiego sprawdzenia auth
typu tak/nie przed załadowaniem pełnego Plugin kanału. Docelowy eksport powinien być małą
funkcją, która odczytuje wyłącznie stan utrwalony; nie kieruj go przez pełny barrel runtime kanału.

`openclaw.channel.configuredState` ma ten sam kształt dla lekkich sprawdzeń
skonfigurowania opartych wyłącznie na env:

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

Używaj tego, gdy kanał może odpowiedzieć na pytanie o stan skonfigurowania na podstawie env lub innych małych
wejść nieruntime. Jeśli sprawdzenie wymaga pełnego rozstrzygnięcia konfiguracji lub rzeczywistego
runtime kanału, zachowaj tę logikę w hooku Plugin `config.hasConfiguredState`.

## Wymagania JSON Schema

- **Każdy Plugin musi dostarczać JSON Schema**, nawet jeśli nie przyjmuje żadnej konfiguracji.
- Pusty schemat jest dopuszczalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane podczas odczytu/zapisu konfiguracji, a nie w czasie wykonywania.

## Zachowanie walidacji

- Nieznane klucze `channels.*` to **błędy**, chyba że identyfikator kanału został zadeklarowany przez
  manifest Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` i `plugins.slots.*`
  muszą odwoływać się do **wykrywalnych** identyfikatorów Plugin. Nieznane identyfikatory to **błędy**.
- Jeśli Plugin jest zainstalowany, ale ma uszkodzony lub brakujący manifest albo schemat,
  walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd Plugin.
- Jeśli konfiguracja Plugin istnieje, ale Plugin jest **wyłączony**, konfiguracja jest zachowywana i
  pojawia się **ostrzeżenie** w Doctor + logach.

Pełny schemat `plugins.*` znajdziesz w [Configuration reference](/pl/gateway/configuration).

## Uwagi

- Manifest jest **wymagany dla natywnych Plugin OpenClaw**, w tym dla ładowań z lokalnego systemu plików.
- Runtime nadal ładuje moduł Plugin osobno; manifest służy wyłącznie do
  wykrywania + walidacji.
- Natywne manifesty są parsowane przy użyciu JSON5, więc komentarze, końcowe przecinki i
  klucze bez cudzysłowów są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Loader manifestu odczytuje tylko udokumentowane pola manifestu. Unikaj dodawania
  tutaj niestandardowych kluczy najwyższego poziomu.
- `providerAuthEnvVars` to lekka ścieżka metadanych dla sprawdzeń auth, walidacji znaczników env
  i podobnych powierzchni auth dostawcy, które nie powinny uruchamiać runtime Plugin
  tylko po to, by sprawdzić nazwy env.
- `providerAuthAliases` pozwala wariantom dostawców ponownie używać zmiennych env auth innego dostawcy,
  profili auth, auth opartego na konfiguracji i wyboru onboardingu klucza API
  bez hardkodowania tej relacji w core.
- `channelEnvVars` to lekka ścieżka metadanych dla fallbacku shell-env, promptów konfiguracji
  i podobnych powierzchni kanału, które nie powinny uruchamiać runtime Plugin
  tylko po to, by sprawdzić nazwy env.
- `providerAuthChoices` to lekka ścieżka metadanych dla selektorów wyboru auth,
  rozstrzygania `--auth-choice`, mapowania preferowanego dostawcy i prostej rejestracji flag CLI
  onboardingu przed załadowaniem runtime dostawcy. Metadane kreatora runtime,
  które wymagają kodu dostawcy, opisano w
  [Provider runtime hooks](/pl/plugins/architecture#provider-runtime-hooks).
- Wyłączne rodzaje Plugin są wybierane przez `plugins.slots.*`.
  - `kind: "memory"` jest wybierany przez `plugins.slots.memory`.
  - `kind: "context-engine"` jest wybierany przez `plugins.slots.contextEngine`
    (domyślnie: wbudowany `legacy`).
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, gdy
  Plugin ich nie potrzebuje.
- Jeśli Twój Plugin zależy od modułów natywnych, udokumentuj kroki budowania oraz wszelkie
  wymagania dotyczące allowlist menedżera pakietów (na przykład pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Powiązane

- [Building Plugins](/pl/plugins/building-plugins) — pierwsze kroki z Plugin
- [Plugin Architecture](/pl/plugins/architecture) — architektura wewnętrzna
- [SDK Overview](/pl/plugins/sdk-overview) — opis Plugin SDK
