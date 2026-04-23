---
read_when:
    - Budujesz Plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji Pluginu albo diagnozować błędy walidacji Pluginu
summary: Manifest Pluginu + wymagania schematu JSON (ścisła walidacja konfiguracji)
title: Manifest Pluginu
x-i18n:
    generated_at: "2026-04-23T10:04:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: d48810f604aa0c3ff8553528cfa4cb735d1d5e7a15b1bbca6152070d6c8f9cce
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest Pluginu (`openclaw.plugin.json`)

Ta strona dotyczy tylko **natywnego manifestu Pluginu OpenClaw**.

Informacje o zgodnych układach pakietów znajdziesz w [Plugin bundles](/pl/plugins/bundles).

Zgodne formaty pakietów używają innych plików manifestu:

- pakiet Codex: `.codex-plugin/plugin.json`
- pakiet Claude: `.claude-plugin/plugin.json` albo domyślny układ komponentów Claude
  bez manifestu
- pakiet Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa także te układy pakietów, ale nie są one walidowane
względem schematu `openclaw.plugin.json` opisanego tutaj.

W przypadku zgodnych pakietów OpenClaw obecnie odczytuje metadane pakietu oraz zadeklarowane
korzenie Skills, korzenie poleceń Claude, domyślne ustawienia `settings.json` pakietu Claude,
domyślne ustawienia LSP pakietu Claude oraz obsługiwane zestawy hooków, gdy układ odpowiada
oczekiwaniom runtime OpenClaw.

Każdy natywny Plugin OpenClaw **musi** dostarczać plik `openclaw.plugin.json` w
**katalogu głównym Pluginu**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu Pluginu**. Brakujące albo nieprawidłowe manifesty są traktowane jako
błędy Pluginu i blokują walidację konfiguracji.

Zobacz pełny przewodnik po systemie Pluginów: [Plugins](/pl/tools/plugin).
Informacje o natywnym modelu możliwości i aktualnych wskazówkach zgodności zewnętrznej:
[Capability model](/pl/plugins/architecture#public-capability-model).

## Do czego służy ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje przed załadowaniem
kodu Twojego Pluginu.

Używaj go do:

- tożsamości Pluginu
- walidacji konfiguracji
- metadanych auth i onboarding, które powinny być dostępne bez uruchamiania runtime
  Pluginu
- tanich wskazówek aktywacji, które powierzchnie control plane mogą sprawdzać przed załadowaniem runtime
- tanich deskryptorów konfiguracji, które powierzchnie setup/onboarding mogą sprawdzać przed
  załadowaniem runtime
- metadanych aliasów i automatycznego włączania, które powinny być rozwiązywane przed załadowaniem runtime Pluginu
- metadanych własności skrótowych rodzin modeli, które powinny automatycznie aktywować
  Plugin przed załadowaniem runtime
- statycznych migawek własności możliwości używanych do bundlowanego okablowania zgodności i pokrycia kontraktów
- tanich metadanych runnera QA, które współdzielony host `openclaw qa` może sprawdzać
  przed załadowaniem runtime Pluginu
- metadanych konfiguracji specyficznych dla kanału, które powinny być scalane z powierzchniami katalogu i walidacji
  bez ładowania runtime
- wskazówek interfejsu konfiguracji

Nie używaj go do:

- rejestrowania zachowania runtime
- deklarowania entrypointów kodu
- metadanych instalacji npm

To należy do kodu Pluginu i `package.json`.

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

## Dokumentacja pól najwyższego poziomu

| Pole                                 | Wymagane | Typ                              | Znaczenie                                                                                                                                                                                                                         |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Tak      | `string`                         | Kanoniczne ID Pluginu. To jest ID używane w `plugins.entries.<id>`.                                                                                                                                                              |
| `configSchema`                       | Tak      | `object`                         | Wbudowany JSON Schema dla konfiguracji tego Pluginu.                                                                                                                                                                              |
| `enabledByDefault`                   | Nie      | `true`                           | Oznacza bundlowany Plugin jako domyślnie włączony. Pomiń to pole albo ustaw dowolną wartość inną niż `true`, aby pozostawić Plugin domyślnie wyłączony.                                                                        |
| `legacyPluginIds`                    | Nie      | `string[]`                       | Starsze ID, które normalizują się do tego kanonicznego ID Pluginu.                                                                                                                                                               |
| `autoEnableWhenConfiguredProviders`  | Nie      | `string[]`                       | ID providerów, które powinny automatycznie włączać ten Plugin, gdy auth, konfiguracja albo odwołania modeli o nich wspominają.                                                                                                  |
| `kind`                               | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj Pluginu używany przez `plugins.slots.*`.                                                                                                                                                               |
| `channels`                           | Nie      | `string[]`                       | ID kanałów należących do tego Pluginu. Używane do wykrywania i walidacji konfiguracji.                                                                                                                                           |
| `providers`                          | Nie      | `string[]`                       | ID providerów należących do tego Pluginu.                                                                                                                                                                                         |
| `modelSupport`                       | Nie      | `object`                         | Metadane skrótowe rodzin modeli należące do manifestu, używane do automatycznego ładowania Pluginu przed runtime.                                                                                                              |
| `providerEndpoints`                  | Nie      | `object[]`                       | Metadane host/baseUrl endpointów należące do manifestu dla ścieżek providerów, które rdzeń musi sklasyfikować przed załadowaniem runtime providera.                                                                             |
| `cliBackends`                        | Nie      | `string[]`                       | ID backendów inferencji CLI należących do tego Pluginu. Używane do automatycznej aktywacji przy starcie na podstawie jawnych odwołań w konfiguracji.                                                                           |
| `syntheticAuthRefs`                  | Nie      | `string[]`                       | Odwołania providera albo backendu CLI, których należący do Pluginu syntetyczny hook auth powinien być sondowany podczas cold model discovery przed załadowaniem runtime.                                                        |
| `nonSecretAuthMarkers`               | Nie      | `string[]`                       | Wartości placeholderów kluczy API należących do bundlowanego Pluginu, które reprezentują niesekretny stan poświadczeń lokalnych, OAuth albo ambient.                                                                            |
| `commandAliases`                     | Nie      | `object[]`                       | Nazwy poleceń należące do tego Pluginu, które powinny generować świadomą konfiguracji Pluginu diagnostykę konfiguracji i CLI przed załadowaniem runtime.                                                                         |
| `providerAuthEnvVars`                | Nie      | `Record<string, string[]>`       | Tanie metadane env auth providera, które OpenClaw może sprawdzać bez ładowania kodu Pluginu.                                                                                                                                     |
| `providerAuthAliases`                | Nie      | `Record<string, string>`         | ID providerów, które powinny używać ponownie ID innego providera do wyszukiwania auth, na przykład providera kodowania, który współdzieli klucz API bazowego providera i profile auth.                                         |
| `channelEnvVars`                     | Nie      | `Record<string, string[]>`       | Tanie metadane env kanału, które OpenClaw może sprawdzać bez ładowania kodu Pluginu. Użyj tego dla konfiguracji kanału sterowanej przez env albo powierzchni auth, które generyczne helpery startowe/konfiguracyjne powinny widzieć. |
| `providerAuthChoices`                | Nie      | `object[]`                       | Tanie metadane wyboru auth dla selektorów onboarding, rozwiązywania preferowanego providera i prostego mapowania flag CLI.                                                                                                      |
| `activation`                         | Nie      | `object`                         | Tanie wskazówki aktywacji dla ładowania wyzwalanego przez providera, polecenie, kanał, trasę i możliwość. Tylko metadane; faktyczne zachowanie nadal należy do runtime Pluginu.                                               |
| `setup`                              | Nie      | `object`                         | Tanie deskryptory setup/onboarding, które powierzchnie wykrywania i konfiguracji mogą sprawdzać bez ładowania runtime Pluginu.                                                                                                  |
| `qaRunners`                          | Nie      | `object[]`                       | Tanie deskryptory runnerów QA używane przez współdzielony host `openclaw qa` przed załadowaniem runtime Pluginu.                                                                                                                |
| `contracts`                          | Nie      | `object`                         | Statyczna migawka bundlowanych możliwości dla zewnętrznych hooków auth, mowy, transkrypcji realtime, głosu realtime, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search oraz własności narzędzi. |
| `mediaUnderstandingProviderMetadata` | Nie      | `Record<string, object>`         | Tanie domyślne ustawienia media-understanding dla ID providerów zadeklarowanych w `contracts.mediaUnderstandingProviders`.                                                                                                       |
| `channelConfigs`                     | Nie      | `Record<string, object>`         | Metadane konfiguracji kanału należące do manifestu, scalane z powierzchniami wykrywania i walidacji przed załadowaniem runtime.                                                                                                 |
| `skills`                             | Nie      | `string[]`                       | Katalogi Skills do załadowania, względne względem katalogu głównego Pluginu.                                                                                                                                                     |
| `name`                               | Nie      | `string`                         | Czytelna dla człowieka nazwa Pluginu.                                                                                                                                                                                             |
| `description`                        | Nie      | `string`                         | Krótkie podsumowanie pokazywane na powierzchniach Pluginu.                                                                                                                                                                        |
| `version`                            | Nie      | `string`                         | Informacyjna wersja Pluginu.                                                                                                                                                                                                      |
| `uiHints`                            | Nie      | `Record<string, object>`         | Etykiety interfejsu, placeholdery i wskazówki wrażliwości dla pól konfiguracji.                                                                                                                                                  |

## Dokumentacja `providerAuthChoices`

Każdy wpis `providerAuthChoices` opisuje jeden wybór onboarding albo auth.
OpenClaw odczytuje to przed załadowaniem runtime providera.

| Pole                  | Wymagane | Typ                                              | Znaczenie                                                                                                    |
| --------------------- | -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `provider`            | Tak      | `string`                                         | ID providera, do którego należy ten wybór.                                                                   |
| `method`              | Tak      | `string`                                         | ID metody auth, do której należy wysłać żądanie.                                                             |
| `choiceId`            | Tak      | `string`                                         | Stabilne ID wyboru auth używane przez onboarding i przepływy CLI.                                            |
| `choiceLabel`         | Nie      | `string`                                         | Etykieta dla użytkownika. Jeśli pominięta, OpenClaw wraca do `choiceId`.                                     |
| `choiceHint`          | Nie      | `string`                                         | Krótki tekst pomocniczy dla selektora.                                                                       |
| `assistantPriority`   | Nie      | `number`                                         | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.            |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                   | Ukrywa wybór przed selektorami asystenta, nadal pozwalając na ręczny wybór z CLI.                           |
| `deprecatedChoiceIds` | Nie      | `string[]`                                       | Starsze ID wyborów, które powinny przekierowywać użytkowników do tego zamiennego wyboru.                    |
| `groupId`             | Nie      | `string`                                         | Opcjonalne ID grupy do grupowania powiązanych wyborów.                                                       |
| `groupLabel`          | Nie      | `string`                                         | Etykieta tej grupy dla użytkownika.                                                                          |
| `groupHint`           | Nie      | `string`                                         | Krótki tekst pomocniczy dla grupy.                                                                           |
| `optionKey`           | Nie      | `string`                                         | Wewnętrzny klucz opcji dla prostych przepływów auth z jedną flagą.                                           |
| `cliFlag`             | Nie      | `string`                                         | Nazwa flagi CLI, na przykład `--openrouter-api-key`.                                                         |
| `cliOption`           | Nie      | `string`                                         | Pełny kształt opcji CLI, na przykład `--openrouter-api-key <key>`.                                           |
| `cliDescription`      | Nie      | `string`                                         | Opis używany w pomocy CLI.                                                                                   |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">`  | Na których powierzchniach onboarding ten wybór powinien się pojawiać. Jeśli pominięte, domyślnie `["text-inference"]`. |

## Dokumentacja `commandAliases`

Użyj `commandAliases`, gdy Plugin jest właścicielem nazwy polecenia runtime, którą użytkownicy mogą
omyłkowo umieszczać w `plugins.allow` albo próbować uruchamiać jako główne polecenie CLI. OpenClaw
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

| Pole         | Wymagane | Typ               | Znaczenie                                                                  |
| ------------ | -------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Tak      | `string`          | Nazwa polecenia należąca do tego Pluginu.                                  |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie slash na czacie, a nie główne polecenie CLI.  |
| `cliCommand` | Nie      | `string`          | Powiązane główne polecenie CLI do zasugerowania dla operacji CLI, jeśli istnieje. |

## Dokumentacja `activation`

Użyj `activation`, gdy Plugin może tanio zadeklarować, które zdarzenia control plane
powinny aktywować go później.

## Dokumentacja `qaRunners`

Użyj `qaRunners`, gdy Plugin wnosi jeden lub więcej runnerów transportu pod
wspólnym korzeniem `openclaw qa`. Utrzymuj te metadane jako tanie i statyczne; runtime Pluginu
nadal jest właścicielem właściwej rejestracji CLI przez lekką powierzchnię
`runtime-api.ts`, która eksportuje `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Uruchom opartą na Dockerze żywą ścieżkę QA Matrix przeciwko jednorazowemu homeserverowi"
    }
  ]
}
```

| Pole          | Wymagane | Typ      | Znaczenie                                                             |
| ------------- | -------- | -------- | --------------------------------------------------------------------- |
| `commandName` | Tak      | `string` | Podpolecenie montowane pod `openclaw qa`, na przykład `matrix`.       |
| `description` | Nie      | `string` | Zapasowy tekst pomocy używany, gdy współdzielony host potrzebuje polecenia stub. |

Ten blok zawiera tylko metadane. Nie rejestruje zachowania runtime i nie
zastępuje `register(...)`, `setupEntry` ani innych entrypointów runtime/Pluginu.
Obecni konsumenci używają go jako wskazówki zawężającej przed szerszym ładowaniem Pluginu, więc
brak metadanych aktywacji zwykle tylko pogarsza wydajność; nie powinien
zmieniać poprawności, dopóki nadal istnieją starsze ścieżki zapasowe własności manifestu.

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

| Pole             | Wymagane | Typ                                                  | Znaczenie                                                       |
| ---------------- | -------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| `onProviders`    | Nie      | `string[]`                                           | ID providerów, które powinny aktywować ten Plugin po żądaniu.   |
| `onCommands`     | Nie      | `string[]`                                           | ID poleceń, które powinny aktywować ten Plugin.                 |
| `onChannels`     | Nie      | `string[]`                                           | ID kanałów, które powinny aktywować ten Plugin.                 |
| `onRoutes`       | Nie      | `string[]`                                           | Rodzaje tras, które powinny aktywować ten Plugin.               |
| `onCapabilities` | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Szerokie wskazówki możliwości używane przez planowanie aktywacji control plane. |

Obecni aktywni konsumenci:

- planowanie CLI wyzwalane poleceniem wraca zapasowo do starszego
  `commandAliases[].cliCommand` albo `commandAliases[].name`
- planowanie konfiguracji/kanału wyzwalane kanałem wraca zapasowo do starszej własności
  `channels[]`, gdy brakuje jawnych metadanych aktywacji kanału
- planowanie konfiguracji/runtime wyzwalane providerem wraca zapasowo do starszej
  własności `providers[]` i najwyższego poziomu `cliBackends[]`, gdy brakuje jawnych metadanych
  aktywacji providera

## Dokumentacja `setup`

Użyj `setup`, gdy powierzchnie setup i onboarding potrzebują tanich metadanych należących do Pluginu
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

Najwyższy poziom `cliBackends` pozostaje prawidłowy i nadal opisuje backendy inferencji CLI.
`setup.cliBackends` to powierzchnia deskryptorów specyficzna dla setup
dla przepływów control plane/setup, które powinny pozostać wyłącznie metadanymi.

Jeśli są obecne, `setup.providers` i `setup.cliBackends` są preferowaną
powierzchnią wyszukiwania opartą najpierw na deskryptorze dla wykrywania setup. Jeśli deskryptor
tylko zawęża kandydata Pluginu, a setup nadal potrzebuje bogatszych hooków runtime czasu setup,
ustaw `requiresRuntime: true` i zachowaj `setup-api` jako zapasową ścieżkę wykonania.

Ponieważ wyszukiwanie setup może wykonywać należący do Pluginu kod `setup-api`, znormalizowane
wartości `setup.providers[].id` i `setup.cliBackends[]` muszą pozostać unikalne globalnie wśród
wykrytych Pluginów. Niejednoznaczna własność kończy się bezpieczną odmową zamiast wybierania
zwycięzcy według kolejności wykrywania.

### Dokumentacja `setup.providers`

| Pole          | Wymagane | Typ        | Znaczenie                                                                             |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | Tak      | `string`   | ID providera udostępniane podczas setup albo onboarding. Zachowaj globalnie unikalne znormalizowane ID. |
| `authMethods` | Nie      | `string[]` | ID metod setup/auth, które ten provider obsługuje bez ładowania pełnego runtime.     |
| `envVars`     | Nie      | `string[]` | Zmienne env, które generyczne powierzchnie setup/status mogą sprawdzać przed załadowaniem runtime Pluginu. |

### Pola `setup`

| Pole               | Wymagane | Typ        | Znaczenie                                                                                          |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `providers`        | Nie      | `object[]` | Deskryptory setup providera udostępniane podczas setup i onboarding.                               |
| `cliBackends`      | Nie      | `string[]` | ID backendów czasu setup używane do wyszukiwania setup najpierw po deskryptorze. Zachowaj globalnie unikalne znormalizowane ID. |
| `configMigrations` | Nie      | `string[]` | ID migracji konfiguracji należące do powierzchni setup tego Pluginu.                               |
| `requiresRuntime`  | Nie      | `boolean`  | Czy setup nadal wymaga wykonania `setup-api` po wyszukaniu deskryptora.                            |

## Dokumentacja `uiHints`

`uiHints` to mapa od nazw pól konfiguracji do małych wskazówek renderowania.

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

| Pole          | Typ        | Znaczenie                               |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Etykieta pola dla użytkownika.          |
| `help`        | `string`   | Krótki tekst pomocniczy.                |
| `tags`        | `string[]` | Opcjonalne tagi interfejsu.             |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.         |
| `sensitive`   | `boolean`  | Oznacza pole jako sekretne lub wrażliwe. |
| `placeholder` | `string`   | Tekst placeholdera dla pól formularza.  |

## Dokumentacja `contracts`

Używaj `contracts` tylko dla statycznych metadanych własności możliwości, które OpenClaw może
odczytać bez importowania runtime Pluginu.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
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

| Pole                             | Typ        | Znaczenie                                                             |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ID wbudowanego runtime, dla których bundlowany Plugin może rejestrować fabryki. |
| `externalAuthProviders`          | `string[]` | ID providerów, których hook zewnętrznego profilu auth należy do tego Pluginu. |
| `speechProviders`                | `string[]` | ID providerów mowy należących do tego Pluginu.                        |
| `realtimeTranscriptionProviders` | `string[]` | ID providerów transkrypcji realtime należących do tego Pluginu.       |
| `realtimeVoiceProviders`         | `string[]` | ID providerów głosu realtime należących do tego Pluginu.              |
| `mediaUnderstandingProviders`    | `string[]` | ID providerów media-understanding należących do tego Pluginu.         |
| `imageGenerationProviders`       | `string[]` | ID providerów image-generation należących do tego Pluginu.            |
| `videoGenerationProviders`       | `string[]` | ID providerów video-generation należących do tego Pluginu.            |
| `webFetchProviders`              | `string[]` | ID providerów web-fetch należących do tego Pluginu.                   |
| `webSearchProviders`             | `string[]` | ID providerów web search należących do tego Pluginu.                  |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należące do tego Pluginu na potrzeby bundlowanych kontroli kontraktów. |

Pluginy providerów implementujące `resolveExternalAuthProfiles` powinny deklarować
`contracts.externalAuthProviders`. Pluginy bez tej deklaracji nadal działają
przez przestarzałą ścieżkę zgodności, ale ta ścieżka jest wolniejsza i
zostanie usunięta po oknie migracji.

## Dokumentacja `mediaUnderstandingProviderMetadata`

Użyj `mediaUnderstandingProviderMetadata`, gdy provider media-understanding ma
domyślne modele, priorytet zapasowej ścieżki auto-auth albo natywną obsługę dokumentów, których
generyczne helpery rdzenia potrzebują przed załadowaniem runtime. Klucze muszą też być zadeklarowane w
`contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Każdy wpis providera może zawierać:

| Pole                   | Typ                                 | Znaczenie                                                                    |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Możliwości multimedialne udostępniane przez tego providera.                  |
| `defaultModels`        | `Record<string, string>`            | Domyślne mapowanie możliwość-model używane, gdy konfiguracja nie określa modelu. |
| `autoPriority`         | `Record<string, number>`            | Niższe liczby są sortowane wcześniej dla automatycznej zapasowej ścieżki providera opartej na poświadczeniach. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Natywne wejścia dokumentów obsługiwane przez providera.                      |

## Dokumentacja `channelConfigs`

Użyj `channelConfigs`, gdy Plugin kanału potrzebuje tanich metadanych konfiguracji przed
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

| Pole          | Typ                      | Znaczenie                                                                                   |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema dla `channels.<id>`. Wymagane dla każdego zadeklarowanego wpisu konfiguracji kanału. |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety interfejsu/placeholdery/wskazówki wrażliwości dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami wyboru i inspekcji, gdy metadane runtime nie są gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                    |
| `preferOver`  | `string[]`               | Starsze albo niższego priorytetu ID Pluginów, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

## Dokumentacja `modelSupport`

Użyj `modelSupport`, gdy OpenClaw powinno wywnioskować Twój Plugin providera na podstawie
skrótowych ID modeli, takich jak `gpt-5.4` albo `claude-sonnet-4.6`, przed załadowaniem runtime Pluginu.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje następujący priorytet:

- jawne odwołania `provider/model` używają należących do manifestu metadanych `providers`
- `modelPatterns` wygrywają z `modelPrefixes`
- jeśli pasują jednocześnie jeden niebundlowany Plugin i jeden bundlowany Plugin, wygrywa
  Plugin niebundlowany
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik albo konfiguracja nie określą providera

Pola:

| Pole            | Typ        | Znaczenie                                                                        |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane przez `startsWith` do skrótowych ID modeli.                |
| `modelPatterns` | `string[]` | Źródła regex dopasowywane do skrótowych ID modeli po usunięciu sufiksu profilu.  |

Starsze klucze możliwości najwyższego poziomu są przestarzałe. Użyj `openclaw doctor --fix`, aby
przenieść `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` oraz `webSearchProviders` do `contracts`; zwykłe
ładowanie manifestu nie traktuje już tych pól najwyższego poziomu jako
własności możliwości.

## Manifest a package.json

Te dwa pliki pełnią różne role:

| Plik                   | Używaj go do                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Wykrywania, walidacji konfiguracji, metadanych wyboru auth i wskazówek interfejsu, które muszą istnieć przed uruchomieniem kodu Pluginu |
| `package.json`         | Metadanych npm, instalacji zależności oraz bloku `openclaw` używanego do entrypointów, blokowania instalacji, setup albo metadanych katalogu |

Jeśli nie masz pewności, gdzie należy dany fragment metadanych, użyj tej reguły:

- jeśli OpenClaw musi o tym wiedzieć przed załadowaniem kodu Pluginu, umieść to w `openclaw.plugin.json`
- jeśli dotyczy to pakowania, plików entry albo zachowania instalacji npm, umieść to w `package.json`

### Pola package.json wpływające na wykrywanie

Niektóre metadane Pluginu sprzed uruchomienia runtime celowo znajdują się w `package.json` pod
blokiem `openclaw`, a nie w `openclaw.plugin.json`.

Ważne przykłady:

| Pole                                                              | Znaczenie                                                                                                                                                                              |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklaruje natywne entrypointy Pluginu. Muszą pozostać w katalogu pakietu Pluginu.                                                                                                      |
| `openclaw.runtimeExtensions`                                      | Deklaruje zbudowane entrypointy runtime JavaScript dla zainstalowanych pakietów. Muszą pozostać w katalogu pakietu Pluginu.                                                          |
| `openclaw.setupEntry`                                             | Lekki entrypoint tylko do setup używany podczas onboardingu, odroczonego uruchamiania kanału i wykrywania statusu kanału/SecretRef tylko do odczytu. Musi pozostać w katalogu pakietu Pluginu. |
| `openclaw.runtimeSetupEntry`                                      | Deklaruje zbudowany entrypoint setup JavaScript dla zainstalowanych pakietów. Musi pozostać w katalogu pakietu Pluginu.                                                              |
| `openclaw.channel`                                                | Tanie metadane katalogu kanałów, takie jak etykiety, ścieżki dokumentacji, aliasy i tekst wyboru.                                                                                     |
| `openclaw.channel.configuredState`                                | Lekkie metadane sprawdzania skonfigurowanego stanu, które mogą odpowiedzieć na pytanie „czy konfiguracja tylko z env już istnieje?” bez ładowania pełnego runtime kanału.            |
| `openclaw.channel.persistedAuthState`                             | Lekkie metadane sprawdzania trwałego stanu auth, które mogą odpowiedzieć na pytanie „czy coś jest już zalogowane?” bez ładowania pełnego runtime kanału.                              |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Wskazówki instalacji/aktualizacji dla bundlowanych i publikowanych zewnętrznie Pluginów.                                                                                               |
| `openclaw.install.defaultChoice`                                  | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                                                           |
| `openclaw.install.minHostVersion`                                 | Minimalna obsługiwana wersja hosta OpenClaw, używająca progu semver, takiego jak `>=2026.3.22`.                                                                                       |
| `openclaw.install.expectedIntegrity`                              | Oczekiwany ciąg integralności npm dist, taki jak `sha512-...`; przepływy instalacji i aktualizacji weryfikują względem niego pobrany artefakt.                                       |
| `openclaw.install.allowInvalidConfigRecovery`                     | Pozwala na wąską ścieżkę odzyskiwania przez reinstalację bundlowanego Pluginu, gdy konfiguracja jest nieprawidłowa.                                                                   |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Pozwala ładować powierzchnie kanału tylko do setup przed pełnym Pluginem kanału podczas uruchamiania.                                                                                 |

Metadane manifestu decydują, które wybory providera/kanału/setup pojawiają się podczas
onboardingu przed załadowaniem runtime. `package.json#openclaw.install` mówi
onboardingowi, jak pobrać albo włączyć ten Plugin, gdy użytkownik wybierze jedną z tych
opcji. Nie przenoś wskazówek instalacji do `openclaw.plugin.json`.

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i ładowania
rejestru manifestów. Nieprawidłowe wartości są odrzucane; nowsze, ale prawidłowe wartości pomijają
Plugin na starszych hostach.

Dokładne przypinanie wersji npm już znajduje się w `npmSpec`, na przykład
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Połącz to z
`expectedIntegrity`, gdy chcesz, aby przepływy aktualizacji kończyły się bezpieczną odmową, jeśli pobrany
artefakt npm nie odpowiada już przypiętemu wydaniu. Interaktywny onboarding
oferuje zaufane specyfikacje npm z rejestru, w tym same nazwy pakietów i dist-tag. Gdy
obecne jest `expectedIntegrity`, przepływy instalacji/aktualizacji je egzekwują; gdy jest
pominięte, rozwiązywanie z rejestru jest zapisywane bez przypięcia integralności.

Pluginy kanałów powinny dostarczać `openclaw.setupEntry`, gdy status, lista kanałów
albo skany SecretRef muszą identyfikować skonfigurowane konta bez ładowania pełnego
runtime. Entry setup powinien udostępniać metadane kanału oraz bezpieczne dla setup adaptery konfiguracji,
statusu i sekretów; klientów sieciowych, listenerów Gateway i runtime transportu
trzymaj w głównym entrypoincie rozszerzenia.

Pola entrypointu runtime nie nadpisują kontroli granic pakietu dla pól
entrypointu źródłowego. Na przykład `openclaw.runtimeExtensions` nie może sprawić, że
uciekająca ścieżka `openclaw.extensions` stanie się ładowalna.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie
sprawia, że dowolnie uszkodzone konfiguracje stają się instalowalne. Dziś pozwala tylko
przepływom instalacji odzyskiwać działanie po określonych nieaktualnych błędach aktualizacji bundlowanego Pluginu, takich jak
brakująca ścieżka bundlowanego Pluginu albo nieaktualny wpis `channels.<id>` dla tego samego
bundlowanego Pluginu. Niezwiązane błędy konfiguracji nadal blokują instalację i kierują operatorów
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

Używaj tego, gdy setup, doctor albo przepływy configured-state potrzebują taniej sondy auth
tak/nie, zanim pełny Plugin kanału się załaduje. Docelowy eksport powinien być małą
funkcją, która odczytuje tylko trwały stan; nie prowadź jej przez pełną
beczkę runtime kanału.

`openclaw.channel.configuredState` ma ten sam kształt dla tanich kontroli skonfigurowanego stanu
tylko z env:

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

Używaj tego, gdy kanał może odpowiedzieć na pytanie o skonfigurowany stan na podstawie env albo innych małych
wejść niestanowiących runtime. Jeśli kontrola wymaga pełnego rozwiązywania konfiguracji albo prawdziwego
runtime kanału, pozostaw tę logikę w hooku Pluginu `config.hasConfiguredState`.

## Priorytet wykrywania (zduplikowane ID Pluginów)

OpenClaw wykrywa Pluginy z kilku korzeni (bundlowane, instalacja globalna, obszar roboczy, jawne ścieżki wybrane w konfiguracji). Jeśli dwa wykrycia współdzielą to samo `id`, zachowywany jest tylko manifest o **najwyższym priorytecie**; duplikaty o niższym priorytecie są odrzucane zamiast ładować się obok niego.

Priorytet, od najwyższego do najniższego:

1. **Wybrany w konfiguracji** — ścieżka jawnie przypięta w `plugins.entries.<id>`
2. **Bundlowany** — Pluginy dostarczane z OpenClaw
3. **Instalacja globalna** — Pluginy zainstalowane w globalnym katalogu Pluginów OpenClaw
4. **Obszar roboczy** — Pluginy wykrywane względem bieżącego obszaru roboczego

Konsekwencje:

- Rozwidlenie albo nieaktualna kopia bundlowanego Pluginu znajdująca się w obszarze roboczym nie przesłoni bundlowanego buildu.
- Aby rzeczywiście nadpisać bundlowany Plugin lokalnym, przypnij go przez `plugins.entries.<id>`, aby wygrał przez priorytet, zamiast polegać na wykrywaniu obszaru roboczego.
- Odrzucenia duplikatów są logowane, dzięki czemu Doctor i diagnostyka startowa mogą wskazać odrzuconą kopię.

## Wymagania JSON Schema

- **Każdy Plugin musi dostarczyć JSON Schema**, nawet jeśli nie akceptuje żadnej konfiguracji.
- Pusty schemat jest akceptowalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane w czasie odczytu/zapisu konfiguracji, a nie w runtime.

## Zachowanie walidacji

- Nieznane klucze `channels.*` są **błędami**, chyba że ID kanału jest zadeklarowane przez
  manifest Pluginu.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` i `plugins.slots.*`
  muszą odwoływać się do **wykrywalnych** ID Pluginów. Nieznane ID są **błędami**.
- Jeśli Plugin jest zainstalowany, ale ma uszkodzony albo brakujący manifest lub schemat,
  walidacja kończy się błędem, a Doctor raportuje błąd Pluginu.
- Jeśli konfiguracja Pluginu istnieje, ale Plugin jest **wyłączony**, konfiguracja jest zachowywana, a
  **ostrzeżenie** jest pokazywane w Doctor + logach.

Zobacz [Configuration reference](/pl/gateway/configuration), aby poznać pełny schemat `plugins.*`.

## Uwagi

- Manifest jest **wymagany dla natywnych Pluginów OpenClaw**, w tym dla ładowań z lokalnego systemu plików.
- Runtime nadal ładuje moduł Pluginu osobno; manifest służy tylko do
  wykrywania i walidacji.
- Natywne manifesty są parsowane przez JSON5, więc komentarze, końcowe przecinki i
  niecytowane klucze są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Loader manifestu odczytuje tylko udokumentowane pola manifestu. Unikaj dodawania
  własnych kluczy najwyższego poziomu.
- `providerAuthEnvVars` to tania ścieżka metadanych dla sond auth, walidacji znaczników env
  i podobnych powierzchni auth providera, które nie powinny uruchamiać runtime Pluginu
  tylko po to, by sprawdzić nazwy env.
- `providerAuthAliases` pozwala wariantom providera ponownie używać auth
  zmiennych env, profili auth, auth opartych na konfiguracji i wyboru onboardingu klucza API innego providera
  bez zakodowywania tej relacji na stałe w rdzeniu.
- `providerEndpoints` pozwala Pluginom providerów być właścicielami prostych metadanych dopasowania host/baseUrl endpointów. Używaj tego tylko dla klas endpointów, które rdzeń już obsługuje;
  runtime nadal należy do Pluginu.
- `syntheticAuthRefs` to tania ścieżka metadanych dla należących do providera hooków
  syntetycznego auth, które muszą być widoczne dla cold model discovery, zanim powstanie rejestr runtime. Wypisuj tylko odwołania, których runtime providera albo backend CLI faktycznie
  implementuje `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` to tania ścieżka metadanych dla należących do bundlowanego Pluginu
  placeholderów kluczy API, takich jak lokalne, OAuth albo ambient credential markers.
  Rdzeń traktuje je jako niesekretne na potrzeby wyświetlania auth i audytów sekretów bez
  zakodowywania właściciela providera na stałe.
- `channelEnvVars` to tania ścieżka metadanych dla zapasowego odczytu z env powłoki, promptów setup
  i podobnych powierzchni kanału, które nie powinny uruchamiać runtime Pluginu
  tylko po to, by sprawdzić nazwy env. Nazwy env to metadane, a nie same w sobie aktywacja:
  status, audit, walidacja dostarczania Cron i inne powierzchnie tylko do odczytu nadal stosują
  zaufanie do Pluginu i zasady efektywnej aktywacji, zanim
  potraktują zmienną env jako skonfigurowany kanał.
- `providerAuthChoices` to tania ścieżka metadanych dla selektorów wyboru auth,
  rozwiązywania `--auth-choice`, mapowania preferowanego providera i prostej rejestracji
  flag CLI onboardingu przed załadowaniem runtime providera. Metadane kreatora runtime,
  które wymagają kodu providera, znajdziesz w
  [Provider runtime hooks](/pl/plugins/architecture#provider-runtime-hooks).
- Wyłączne rodzaje Pluginów są wybierane przez `plugins.slots.*`.
  - `kind: "memory"` jest wybierane przez `plugins.slots.memory`.
  - `kind: "context-engine"` jest wybierane przez `plugins.slots.contextEngine`
    (domyślnie: wbudowane `legacy`).
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, gdy
  Plugin ich nie potrzebuje.
- Jeśli Twój Plugin zależy od modułów natywnych, udokumentuj kroki budowania i wszelkie
  wymagania listy dozwolonych menedżera pakietów (na przykład pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Powiązane

- [Building Plugins](/pl/plugins/building-plugins) — rozpoczęcie pracy z Pluginami
- [Plugin Architecture](/pl/plugins/architecture) — architektura wewnętrzna
- [SDK Overview](/pl/plugins/sdk-overview) — dokumentacja Plugin SDK
