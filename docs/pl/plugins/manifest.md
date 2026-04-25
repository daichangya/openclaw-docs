---
read_when:
    - Tworzysz Plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji Plugin lub debugować błędy walidacji Plugin
summary: Manifest Plugin + wymagania schematu JSON (ścisła walidacja konfiguracji)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-04-25T13:53:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa96930c3c9b890194869eb793c65a0af9db43f8f8b1f78d3c3d6ef18b70be6e
    source_path: plugins/manifest.md
    workflow: 15
---

Ta strona dotyczy wyłącznie **natywnego manifestu Plugin OpenClaw**.

Informacje o zgodnych układach bundle znajdziesz w [Plugin bundles](/pl/plugins/bundles).

Zgodne formaty bundle używają innych plików manifestu:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` lub domyślny układ komponentów Claude
  bez manifestu
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa również te układy bundle, ale nie są one walidowane
względem schematu `openclaw.plugin.json` opisanego tutaj.

W przypadku zgodnych bundle OpenClaw obecnie odczytuje metadane bundle oraz zadeklarowane
katalogi główne Skills, katalogi główne poleceń Claude, domyślne ustawienia `settings.json` bundle Claude,
domyślne ustawienia LSP bundle Claude oraz obsługiwane zestawy hooków, gdy układ odpowiada
oczekiwaniom runtime OpenClaw.

Każdy natywny Plugin OpenClaw **musi** zawierać plik `openclaw.plugin.json` w
**katalogu głównym Plugin**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu Plugin**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy Plugin i blokują walidację konfiguracji.

Pełny przewodnik po systemie Pluginów znajdziesz tutaj: [Plugins](/pl/tools/plugin).
Informacje o natywnym modelu capability i aktualnych wskazówkach zgodności zewnętrznej:
[Model capability](/pl/plugins/architecture#public-capability-model).

## Do czego służy ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje **zanim załaduje kod
Twojego Plugin**. Wszystko poniżej musi dać się tanio sprawdzić bez uruchamiania
runtime Plugin.

**Używaj go do:**

- tożsamości Plugin, walidacji konfiguracji i podpowiedzi UI dla konfiguracji
- metadanych uwierzytelniania, onboardingu i konfiguracji (alias, auto-enable, zmienne env providera, opcje uwierzytelniania)
- wskazówek aktywacji dla powierzchni control-plane
- skrótowego przypisania rodzin modeli
- statycznych migawek przypisania capability (`contracts`)
- metadanych runnera QA, które współdzielony host `openclaw qa` może sprawdzić
- metadanych konfiguracji specyficznych dla kanału scalanych z katalogiem i powierzchniami walidacji

**Nie używaj go do:** rejestrowania zachowania runtime, deklarowania punktów wejścia kodu
ani metadanych instalacji npm. To należy do kodu Plugin i `package.json`.

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

| Pole                                | Wymagane | Typ                              | Znaczenie                                                                                                                                                                                                                         |
| ----------------------------------- | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Tak      | `string`                         | Kanoniczny identyfikator Plugin. To identyfikator używany w `plugins.entries.<id>`.                                                                                                                                              |
| `configSchema`                      | Tak      | `object`                         | Wbudowany schemat JSON dla konfiguracji tego Plugin.                                                                                                                                                                              |
| `enabledByDefault`                  | Nie      | `true`                           | Oznacza dołączony Plugin jako domyślnie włączony. Pomiń to pole lub ustaw dowolną wartość inną niż `true`, aby pozostawić Plugin domyślnie wyłączony.                                                                          |
| `legacyPluginIds`                   | Nie      | `string[]`                       | Starsze identyfikatory normalizowane do tego kanonicznego identyfikatora Plugin.                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders` | Nie      | `string[]`                       | Identyfikatory providerów, które powinny automatycznie włączać ten Plugin, gdy uwierzytelnianie, konfiguracja lub referencje modeli o nich wspominają.                                                                         |
| `kind`                              | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj Plugin używany przez `plugins.slots.*`.                                                                                                                                                                |
| `channels`                          | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego Plugin. Używane do wykrywania i walidacji konfiguracji.                                                                                                                                |
| `providers`                         | Nie      | `string[]`                       | Identyfikatory providerów należących do tego Plugin.                                                                                                                                                                             |
| `providerDiscoveryEntry`            | Nie      | `string`                         | Lekka ścieżka modułu wykrywania providerów, względna wobec katalogu głównego Plugin, dla metadanych katalogu providerów ograniczonych do manifestu, które można załadować bez aktywowania pełnego runtime Plugin.             |
| `modelSupport`                      | Nie      | `object`                         | Należące do manifestu skrótowe metadane rodziny modeli używane do automatycznego załadowania Plugin przed runtime.                                                                                                             |
| `modelCatalog`                      | Nie      | `object`                         | Deklaratywne metadane katalogu modeli dla providerów należących do tego Plugin. To kontrakt control-plane dla przyszłego listowania tylko do odczytu, onboardingu, selektorów modeli, aliasów i wyciszania bez ładowania runtime Plugin. |
| `providerEndpoints`                 | Nie      | `object[]`                       | Należące do manifestu metadane host/baseUrl endpointów dla tras providerów, które rdzeń musi sklasyfikować przed załadowaniem runtime providera.                                                                              |
| `cliBackends`                       | Nie      | `string[]`                       | Identyfikatory backendów inferencji CLI należących do tego Plugin. Używane do automatycznej aktywacji przy starcie na podstawie jawnych referencji w konfiguracji.                                                             |
| `syntheticAuthRefs`                 | Nie      | `string[]`                       | Referencje providerów lub backendów CLI, których należący do Plugin syntetyczny hook uwierzytelniania powinien zostać sprawdzony podczas cold discovery modeli przed załadowaniem runtime.                                    |
| `nonSecretAuthMarkers`              | Nie      | `string[]`                       | Należące do dołączonego Plugin placeholdery wartości kluczy API, które reprezentują niesekretne lokalne, OAuth lub ambient credential state.                                                                                   |
| `commandAliases`                    | Nie      | `object[]`                       | Nazwy poleceń należących do tego Plugin, które powinny generować diagnostykę konfiguracji i CLI świadomą Plugin przed załadowaniem runtime.                                                                                    |
| `providerAuthEnvVars`               | Nie      | `Record<string, string[]>`       | Przestarzałe zgodnościowe metadane env dla wyszukiwania uwierzytelniania/statusu providera. W przypadku nowych Plugin preferuj `setup.providers[].envVars`; OpenClaw nadal odczytuje to pole w okresie wycofywania.          |
| `providerAuthAliases`               | Nie      | `Record<string, string>`         | Identyfikatory providerów, które powinny ponownie używać innego identyfikatora providera do wyszukiwania uwierzytelniania, na przykład provider coding współdzielący klucz API i profile uwierzytelniania z providerem bazowym. |
| `channelEnvVars`                    | Nie      | `Record<string, string[]>`       | Lekkie metadane env kanałów, które OpenClaw może sprawdzać bez ładowania kodu Plugin. Używaj tego dla powierzchni konfiguracji kanałów lub uwierzytelniania sterowanych przez env, które powinny być widoczne dla ogólnych pomocników startu/konfiguracji. |
| `providerAuthChoices`               | Nie      | `object[]`                       | Lekkie metadane opcji uwierzytelniania dla selektorów onboardingu, rozwiązywania preferowanego providera i prostego wiązania flag CLI.                                                                                         |
| `activation`                        | Nie      | `object`                         | Lekkie metadane planera aktywacji dla ładowania wyzwalanego przez providera, polecenie, kanał, trasę i capability. Tylko metadane; rzeczywiste zachowanie nadal należy do runtime Plugin.                                      |
| `setup`                             | Nie      | `object`                         | Lekkie deskryptory konfiguracji/onboardingu, które powierzchnie wykrywania i konfiguracji mogą sprawdzać bez ładowania runtime Plugin.                                                                                         |
| `qaRunners`                         | Nie      | `object[]`                       | Lekkie deskryptory runnerów QA używane przez współdzielony host `openclaw qa` przed załadowaniem runtime Plugin.                                                                                                               |
| `contracts`                         | Nie      | `object`                         | Statyczna migawka dołączonych capabilities dla zewnętrznych hooków uwierzytelniania, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia multimediów, generowania obrazów, generowania muzyki, generowania wideo, pobierania z sieci, wyszukiwania w sieci i własności narzędzi. |
| `mediaUnderstandingProviderMetadata` | Nie     | `Record<string, object>`         | Lekkie domyślne ustawienia rozumienia multimediów dla identyfikatorów providerów zadeklarowanych w `contracts.mediaUnderstandingProviders`.                                                                                     |
| `channelConfigs`                    | Nie      | `Record<string, object>`         | Należące do manifestu metadane konfiguracji kanałów scalane z powierzchniami wykrywania i walidacji przed załadowaniem runtime.                                                                                                |
| `skills`                            | Nie      | `string[]`                       | Katalogi Skills do załadowania, względne wobec katalogu głównego Plugin.                                                                                                                                                         |
| `name`                              | Nie      | `string`                         | Czytelna dla człowieka nazwa Plugin.                                                                                                                                                                                              |
| `description`                       | Nie      | `string`                         | Krótkie podsumowanie wyświetlane na powierzchniach Plugin.                                                                                                                                                                        |
| `version`                           | Nie      | `string`                         | Informacyjna wersja Plugin.                                                                                                                                                                                                       |
| `uiHints`                           | Nie      | `Record<string, object>`         | Etykiety UI, placeholdery i wskazówki dotyczące wrażliwości dla pól konfiguracji.                                                                                                                                               |

## Dokumentacja `providerAuthChoices`

Każdy wpis `providerAuthChoices` opisuje jedną opcję onboardingu lub uwierzytelniania.
OpenClaw odczytuje to przed załadowaniem runtime providera.
Przepływ konfiguracji providera preferuje te opcje z manifestu, a następnie wraca do metadanych kreatora runtime
i opcji katalogu instalacji dla zgodności.

| Pole                  | Wymagane | Typ                                             | Znaczenie                                                                                                 |
| --------------------- | -------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Tak      | `string`                                        | Identyfikator providera, do którego należy ta opcja.                                                      |
| `method`              | Tak      | `string`                                        | Identyfikator metody uwierzytelniania, do której należy przekazać obsługę.                                |
| `choiceId`            | Tak      | `string`                                        | Stabilny identyfikator opcji uwierzytelniania używany przez onboarding i przepływy CLI.                   |
| `choiceLabel`         | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli zostanie pominięta, OpenClaw użyje `choiceId`.                  |
| `choiceHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                    |
| `assistantPriority`   | Nie      | `number`                                        | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.         |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                  | Ukrywa opcję w selektorach asystenta, ale nadal pozwala na ręczny wybór przez CLI.                        |
| `deprecatedChoiceIds` | Nie      | `string[]`                                      | Starsze identyfikatory opcji, które powinny przekierowywać użytkowników do tej opcji zastępczej.         |
| `groupId`             | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych opcji.                                           |
| `groupLabel`          | Nie      | `string`                                        | Etykieta widoczna dla użytkownika dla tej grupy.                                                          |
| `groupHint`           | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                        |
| `optionKey`           | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów uwierzytelniania jedną flagą.                             |
| `cliFlag`             | Nie      | `string`                                        | Nazwa flagi CLI, na przykład `--openrouter-api-key`.                                                      |
| `cliOption`           | Nie      | `string`                                        | Pełny kształt opcji CLI, na przykład `--openrouter-api-key <key>`.                                        |
| `cliDescription`      | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                                |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">` | Powierzchnie onboardingu, na których ta opcja powinna się pojawiać. Jeśli pominięte, domyślnie ustawiane jest `["text-inference"]`. |

## Dokumentacja `commandAliases`

Używaj `commandAliases`, gdy Plugin posiada nazwę polecenia runtime, którą użytkownicy mogą
omyłkowo umieszczać w `plugins.allow` albo próbować uruchamiać jako polecenie główne CLI. OpenClaw
używa tych metadanych do diagnostyki bez importowania kodu runtime Plugin.

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

| Pole         | Wymagane | Typ               | Znaczenie                                                                    |
| ------------ | -------- | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | Tak      | `string`          | Nazwa polecenia należącego do tego Plugin.                                   |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie slash czatu, a nie jako polecenie główne CLI.   |
| `cliCommand` | Nie      | `string`          | Powiązane polecenie główne CLI sugerowane dla operacji CLI, jeśli istnieje.  |

## Dokumentacja `activation`

Używaj `activation`, gdy Plugin może tanio zadeklarować, które zdarzenia control-plane
powinny uwzględniać go w planie aktywacji/ładowania.

Ten blok to metadane planera, a nie API cyklu życia. Nie rejestruje
zachowania runtime, nie zastępuje `register(...)` i nie obiecuje, że
kod Plugin został już wykonany. Planner aktywacji używa tych pól do
zawężenia kandydackich Pluginów przed przejściem do istniejących metadanych
własności w manifeście, takich jak `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` i hooki.

Preferuj najwęższe metadane, które już opisują własność. Używaj
`providers`, `channels`, `commandAliases`, deskryptorów setup lub `contracts`,
gdy te pola wyrażają daną relację. Używaj `activation` dla dodatkowych wskazówek planera,
których nie da się przedstawić przez te pola własności.

Ten blok zawiera wyłącznie metadane. Nie rejestruje zachowania runtime i nie
zastępuje `register(...)`, `setupEntry` ani innych punktów wejścia runtime/Plugin.
Bieżący konsumenci używają go jako wskazówki zawężającej przed szerszym ładowaniem Pluginów, więc
brak metadanych aktywacji zwykle kosztuje tylko wydajność; nie powinien
zmieniać poprawności, dopóki nadal istnieją starsze fallbacki własności manifestu.

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

| Pole             | Wymagane | Typ                                                  | Znaczenie                                                                                                 |
| ---------------- | -------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Nie      | `string[]`                                           | Identyfikatory providerów, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.           |
| `onCommands`     | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.              |
| `onChannels`     | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.              |
| `onRoutes`       | Nie      | `string[]`                                           | Rodzaje tras, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.                        |
| `onCapabilities` | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Szerokie wskazówki capability używane przez planowanie aktywacji control-plane. Gdy to możliwe, preferuj węższe pola. |

Bieżący konsumenci live:

- planowanie CLI wyzwalane poleceniem wraca do starszego
  `commandAliases[].cliCommand` lub `commandAliases[].name`
- planowanie konfiguracji/kanałów wyzwalane kanałem wraca do starszej własności `channels[]`,
  gdy brakuje jawnych metadanych aktywacji kanału
- planowanie konfiguracji/runtime wyzwalane providerem wraca do starszej własności
  `providers[]` i głównego `cliBackends[]`, gdy brakuje jawnych metadanych aktywacji providera

Diagnostyka planera potrafi odróżnić jawne wskazówki aktywacji od fallbacku
własności manifestu. Na przykład `activation-command-hint` oznacza dopasowanie
`activation.onCommands`, natomiast `manifest-command-alias` oznacza, że
planner użył własności `commandAliases`. Te etykiety powodów są przeznaczone dla
diagnostyki hosta i testów; autorzy Pluginów powinni nadal deklarować metadane,
które najlepiej opisują własność.

## Dokumentacja `qaRunners`

Używaj `qaRunners`, gdy Plugin wnosi jeden lub więcej runnerów transportu pod
wspólny główny węzeł `openclaw qa`. Te metadane powinny pozostać tanie i statyczne; runtime Plugin
nadal odpowiada za rzeczywistą rejestrację CLI przez lekką
powierzchnię `runtime-api.ts`, która eksportuje `qaRunnerCliRegistrations`.

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

| Pole          | Wymagane | Typ      | Znaczenie                                                                    |
| ------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `commandName` | Tak      | `string` | Podpolecenie montowane pod `openclaw qa`, na przykład `matrix`.              |
| `description` | Nie      | `string` | Zapasowy tekst pomocy używany, gdy wspólny host potrzebuje polecenia stub.   |

## Dokumentacja `setup`

Używaj `setup`, gdy powierzchnie konfiguracji i onboardingu potrzebują tanich metadanych należących do Plugin
zanim runtime zostanie załadowane.

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

Główne `cliBackends` pozostaje prawidłowe i nadal opisuje backendy inferencji CLI.
`setup.cliBackends` to powierzchnia deskryptorów specyficzna dla konfiguracji dla
przepływów control-plane/setup, które powinny pozostać wyłącznie metadanymi.

Jeśli są obecne, `setup.providers` i `setup.cliBackends` są preferowaną
powierzchnią wyszukiwania opartą na deskryptorach dla wykrywania konfiguracji. Jeśli
deskryptor tylko zawęża kandydacki Plugin, a konfiguracja nadal potrzebuje bogatszych hooków runtime czasu konfiguracji, ustaw `requiresRuntime: true` i pozostaw `setup-api` jako
zapasową ścieżkę wykonania.

OpenClaw uwzględnia również `setup.providers[].envVars` w ogólnych wyszukiwaniach uwierzytelniania providera i zmiennych env. `providerAuthEnvVars` pozostaje obsługiwane przez adapter zgodności w okresie wycofywania, ale niedołączone Pluginy, które nadal go używają,
otrzymują diagnostykę manifestu. Nowe Pluginy powinny umieszczać metadane env konfiguracji/statusu
w `setup.providers[].envVars`.

OpenClaw może również wyprowadzać proste opcje konfiguracji z `setup.providers[].authMethods`,
gdy brak wpisu setup albo gdy `setup.requiresRuntime: false`
deklaruje, że runtime konfiguracji nie jest potrzebne. Jawne wpisy `providerAuthChoices` nadal są preferowane dla niestandardowych etykiet, flag CLI, zakresu onboardingu i metadanych asystenta.

Ustaw `requiresRuntime: false` tylko wtedy, gdy te deskryptory są wystarczające dla
powierzchni konfiguracji. OpenClaw traktuje jawne `false` jako kontrakt oparty wyłącznie na deskryptorze
i nie wykona `setup-api` ani `openclaw.setupEntry` przy wyszukiwaniu konfiguracji. Jeśli
Plugin oparty wyłącznie na deskryptorze nadal dostarcza jeden z tych wpisów runtime konfiguracji,
OpenClaw zgłasza dodatkową diagnostykę i nadal go ignoruje. Pominięcie
`requiresRuntime` zachowuje starsze zachowanie fallback, dzięki czemu istniejące Pluginy, które dodały
deskryptory bez tej flagi, nie ulegają uszkodzeniu.

Ponieważ wyszukiwanie konfiguracji może wykonywać należący do Plugin kod `setup-api`, znormalizowane
wartości `setup.providers[].id` i `setup.cliBackends[]` muszą pozostać unikalne wśród wykrytych Pluginów. Niejednoznaczna własność kończy się bezpieczną odmową zamiast wybierania
zwycięzcy według kolejności wykrywania.

Gdy runtime konfiguracji jednak się wykonuje, diagnostyka rejestru konfiguracji zgłasza dryf deskryptorów, jeśli `setup-api` rejestruje providera lub backend CLI, którego nie deklarują deskryptory manifestu, albo jeśli deskryptor nie ma odpowiadającej rejestracji runtime. Te diagnostyki są dodatkowe i nie odrzucają starszych Pluginów.

### Dokumentacja `setup.providers`

| Pole          | Wymagane | Typ        | Znaczenie                                                                                 |
| ------------- | -------- | ---------- | ----------------------------------------------------------------------------------------- |
| `id`          | Tak      | `string`   | Identyfikator providera udostępniany podczas konfiguracji lub onboardingu. Utrzymuj globalnie unikalne znormalizowane identyfikatory. |
| `authMethods` | Nie      | `string[]` | Identyfikatory metod konfiguracji/uwierzytelniania obsługiwanych przez tego providera bez ładowania pełnego runtime. |
| `envVars`     | Nie      | `string[]` | Zmienne env, które ogólne powierzchnie konfiguracji/statusu mogą sprawdzać przed załadowaniem runtime Plugin. |

### Pola `setup`

| Pole               | Wymagane | Typ        | Znaczenie                                                                                              |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `providers`        | Nie      | `object[]` | Deskryptory konfiguracji providerów udostępniane podczas konfiguracji i onboardingu.                  |
| `cliBackends`      | Nie      | `string[]` | Identyfikatory backendów używane w czasie konfiguracji do wyszukiwania setup najpierw po deskryptorach. Utrzymuj globalnie unikalne znormalizowane identyfikatory. |
| `configMigrations` | Nie      | `string[]` | Identyfikatory migracji konfiguracji należące do powierzchni setup tego Plugin.                       |
| `requiresRuntime`  | Nie      | `boolean`  | Czy po wyszukaniu deskryptora konfiguracja nadal wymaga wykonania `setup-api`.                        |

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

Każda wskazówka dla pola może zawierać:

| Pole          | Typ        | Znaczenie                                 |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Etykieta pola widoczna dla użytkownika.   |
| `help`        | `string`   | Krótki tekst pomocniczy.                  |
| `tags`        | `string[]` | Opcjonalne tagi UI.                       |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.           |
| `sensitive`   | `boolean`  | Oznacza pole jako sekretne lub wrażliwe.  |
| `placeholder` | `string`   | Tekst placeholdera dla pól formularza.    |

## Dokumentacja `contracts`

Używaj `contracts` tylko dla statycznych metadanych własności capability, które OpenClaw może
odczytać bez importowania runtime Plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
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

| Pole                             | Typ        | Znaczenie                                                                      |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Identyfikatory fabryk rozszerzeń serwera aplikacji Codex, obecnie `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Identyfikatory runtime, dla których dołączony Plugin może rejestrować middleware wyników narzędzi. |
| `externalAuthProviders`          | `string[]` | Identyfikatory providerów, których zewnętrzny hook profilu uwierzytelniania należy do tego Plugin. |
| `speechProviders`                | `string[]` | Identyfikatory providerów mowy należące do tego Plugin.                        |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory providerów transkrypcji w czasie rzeczywistym należące do tego Plugin. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory providerów głosu w czasie rzeczywistym należące do tego Plugin. |
| `memoryEmbeddingProviders`       | `string[]` | Identyfikatory providerów embeddingów pamięci należące do tego Plugin.         |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory providerów rozumienia multimediów należące do tego Plugin.      |
| `imageGenerationProviders`       | `string[]` | Identyfikatory providerów generowania obrazów należące do tego Plugin.         |
| `videoGenerationProviders`       | `string[]` | Identyfikatory providerów generowania wideo należące do tego Plugin.           |
| `webFetchProviders`              | `string[]` | Identyfikatory providerów pobierania z sieci należące do tego Plugin.          |
| `webSearchProviders`             | `string[]` | Identyfikatory providerów wyszukiwania w sieci należące do tego Plugin.        |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należących do tego Plugin dla kontroli kontraktów dołączonych. |

`contracts.embeddedExtensionFactories` jest zachowane dla dołączonych fabryk
rozszerzeń tylko dla serwera aplikacji Codex. Dołączone transformacje wyników narzędzi powinny
zadeklarować `contracts.agentToolResultMiddleware` i rejestrować się przez
`api.registerAgentToolResultMiddleware(...)`. Zewnętrzne Pluginy nie mogą
rejestrować middleware wyników narzędzi, ponieważ ta powierzchnia może przepisywać wyjście narzędzi wysokiego zaufania,
zanim zobaczy je model.

Pluginy providerów, które implementują `resolveExternalAuthProfiles`, powinny deklarować
`contracts.externalAuthProviders`. Pluginy bez tej deklaracji nadal działają
przez przestarzały fallback zgodności, ale ten fallback jest wolniejszy i
zostanie usunięty po okresie migracji.

Dołączone providery embeddingów pamięci powinny deklarować
`contracts.memoryEmbeddingProviders` dla każdego identyfikatora adaptera, który udostępniają, w tym
dla wbudowanych adapterów, takich jak `local`. Samodzielne ścieżki CLI używają tego kontraktu manifestu do ładowania tylko Plugin będącego właścicielem, zanim pełne runtime Gateway zarejestruje providery.

## Dokumentacja `mediaUnderstandingProviderMetadata`

Używaj `mediaUnderstandingProviderMetadata`, gdy provider rozumienia multimediów ma
domyślne modele, priorytet fallbacku automatycznego uwierzytelniania lub natywną obsługę dokumentów, których
ogólne helpery rdzenia potrzebują przed załadowaniem runtime. Klucze muszą być również zadeklarowane w
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

| Pole                   | Typ                                 | Znaczenie                                                                         |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capabilities multimedialne udostępniane przez tego providera.                    |
| `defaultModels`        | `Record<string, string>`            | Domyślne mapowanie capability-na-model używane, gdy konfiguracja nie określa modelu. |
| `autoPriority`         | `Record<string, number>`            | Niższe liczby są sortowane wcześniej przy automatycznym fallbacku providera opartym na danych uwierzytelniających. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Natywne wejścia dokumentów obsługiwane przez providera.                           |

## Dokumentacja `channelConfigs`

Używaj `channelConfigs`, gdy Plugin kanału potrzebuje tanich metadanych konfiguracji przed
załadowaniem runtime. Odkrywanie konfiguracji/statusu kanałów tylko do odczytu może używać tych metadanych
bezpośrednio dla skonfigurowanych kanałów zewnętrznych, gdy nie ma wpisu setup lub
gdy `setup.requiresRuntime: false` deklaruje, że runtime konfiguracji nie jest potrzebne.

Dla Plugin kanału `configSchema` i `channelConfigs` opisują różne
ścieżki:

- `configSchema` waliduje `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` waliduje `channels.<channel-id>`

Niedołączone Pluginy deklarujące `channels[]` powinny również deklarować pasujące
wpisy `channelConfigs`. Bez nich OpenClaw nadal może załadować Plugin, ale
powierzchnie schematu konfiguracji cold-path, setup i Control UI nie będą znały
kształtu opcji należących do kanału, dopóki runtime Plugin się nie wykona.

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

| Pole          | Typ                      | Znaczenie                                                                                     |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schemat JSON dla `channels.<id>`. Wymagany dla każdego zadeklarowanego wpisu konfiguracji kanału. |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety UI/placeholdery/wskazówki dotyczące wrażliwości dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami selektorów i inspekcji, gdy metadane runtime nie są gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                      |
| `preferOver`  | `string[]`               | Starsze lub niższopriorytetowe identyfikatory Plugin, które ten kanał powinien wyprzedzać w powierzchniach wyboru. |

## Dokumentacja `modelSupport`

Używaj `modelSupport`, gdy OpenClaw ma wywnioskować Twój Plugin providera z
skrótowych identyfikatorów modeli, takich jak `gpt-5.5` lub `claude-sonnet-4.6`, zanim runtime Plugin
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

- jawne referencje `provider/model` używają metadanych manifestu `providers` należących do właściciela
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli pasuje jeden niedołączony Plugin i jeden dołączony Plugin, wygrywa niedołączony
  Plugin
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik lub konfiguracja nie wskaże providera

Pola:

| Pole            | Typ        | Znaczenie                                                                              |
| --------------- | ---------- | -------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane przez `startsWith` do skrótowych identyfikatorów modeli.         |
| `modelPatterns` | `string[]` | Źródła regex dopasowywane do skrótowych identyfikatorów modeli po usunięciu sufiksu profilu. |

## Dokumentacja `modelCatalog`

Używaj `modelCatalog`, gdy OpenClaw ma znać metadane modeli providera przed
załadowaniem runtime Plugin. To należące do manifestu źródło dla stałych
wierszy katalogu, aliasów providerów, reguł wyciszania i trybu wykrywania. Odświeżanie runtime
nadal należy do kodu runtime providera, ale manifest informuje rdzeń, kiedy runtime
jest wymagane.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "niedostępne w Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Pola najwyższego poziomu:

| Pole           | Typ                                                      | Znaczenie                                                                                                 |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Wiersze katalogu dla identyfikatorów providerów należących do tego Plugin. Klucze powinny również pojawiać się w głównym `providers`. |
| `aliases`      | `Record<string, object>`                                 | Aliasy providerów, które powinny rozwiązywać się do providera będącego właścicielem na potrzeby katalogu lub planowania wyciszeń. |
| `suppressions` | `object[]`                                               | Wiersze modeli z innego źródła, które ten Plugin wycisza z powodu specyficznego dla providera.          |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Czy katalog providera można odczytać z metadanych manifestu, odświeżyć do cache, czy wymaga runtime.     |

Pola providera:

| Pole      | Typ                      | Znaczenie                                                                |
| --------- | ------------------------ | ------------------------------------------------------------------------ |
| `baseUrl` | `string`                 | Opcjonalny domyślny bazowy URL dla modeli w katalogu tego providera.     |
| `api`     | `ModelApi`               | Opcjonalny domyślny adapter API dla modeli w katalogu tego providera.    |
| `headers` | `Record<string, string>` | Opcjonalne statyczne nagłówki stosowane do katalogu tego providera.      |
| `models`  | `object[]`               | Wymagane wiersze modeli. Wiersze bez `id` są ignorowane.                 |

Pola modelu:

| Pole            | Typ                                                            | Znaczenie                                                                    |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Lokalny dla providera identyfikator modelu, bez prefiksu `provider/`.       |
| `name`          | `string`                                                       | Opcjonalna nazwa wyświetlana.                                                |
| `api`           | `ModelApi`                                                     | Opcjonalne nadpisanie API per model.                                         |
| `baseUrl`       | `string`                                                       | Opcjonalne nadpisanie bazowego URL per model.                                |
| `headers`       | `Record<string, string>`                                       | Opcjonalne statyczne nagłówki per model.                                     |
| `input`         | `Array<"text" \| "image" \| "document">`                       | Modalności akceptowane przez model.                                          |
| `reasoning`     | `boolean`                                                      | Czy model udostępnia zachowanie reasoning.                                   |
| `contextWindow` | `number`                                                       | Natywne okno kontekstu providera.                                            |
| `contextTokens` | `number`                                                       | Opcjonalny efektywny limit kontekstu runtime, gdy różni się od `contextWindow`. |
| `maxTokens`     | `number`                                                       | Maksymalna liczba tokenów wyjściowych, jeśli jest znana.                     |
| `cost`          | `object`                                                       | Opcjonalne ceny w USD za milion tokenów, w tym opcjonalne `tieredPricing`.  |
| `compat`        | `object`                                                       | Opcjonalne flagi zgodności odpowiadające zgodności konfiguracji modelu OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status listowania. Wyciszaj tylko wtedy, gdy wiersz nie może pojawić się wcale. |
| `statusReason`  | `string`                                                       | Opcjonalny powód wyświetlany przy statusie innym niż available.              |
| `replaces`      | `string[]`                                                     | Starsze lokalne dla providera identyfikatory modeli, które ten model zastępuje. |
| `replacedBy`    | `string`                                                       | Lokalny dla providera identyfikator modelu zastępującego dla przestarzałych wierszy. |
| `tags`          | `string[]`                                                     | Stabilne tagi używane przez selektory i filtry.                              |

Nie umieszczaj danych tylko runtime w `modelCatalog`. Jeśli provider potrzebuje stanu
konta, żądania API albo wykrywania lokalnego procesu, aby znać pełny zestaw modeli,
zadeklaruj tego providera jako `refreshable` albo `runtime` w `discovery`.

Starsze główne klucze capability są przestarzałe. Użyj `openclaw doctor --fix`, aby
przenieść `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` i `webSearchProviders` do `contracts`; normalne
ładowanie manifestu nie traktuje już tych głównych pól jako
własności capability.

## Manifest a package.json

Te dwa pliki służą do różnych zadań:

| Plik                   | Używaj go do                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Wykrywanie, walidacja konfiguracji, metadane opcji uwierzytelniania i wskazówki UI, które muszą istnieć przed uruchomieniem kodu Plugin |
| `package.json`         | Metadane npm, instalacja zależności oraz blok `openclaw` używany do punktów wejścia, blokowania instalacji, konfiguracji lub metadanych katalogu |

Jeśli nie masz pewności, gdzie powinien trafić dany fragment metadanych, użyj tej zasady:

- jeśli OpenClaw musi znać go przed załadowaniem kodu Plugin, umieść go w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików wejściowych lub zachowania instalacji npm, umieść go w `package.json`

### Pola `package.json`, które wpływają na wykrywanie

Niektóre metadane Plugin sprzed runtime celowo znajdują się w `package.json` w bloku
`openclaw`, a nie w `openclaw.plugin.json`.

Ważne przykłady:

| Pole                                                              | Znaczenie                                                                                                                                                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklaruje natywne punkty wejścia Plugin. Muszą pozostać wewnątrz katalogu pakietu Plugin.                                                                                            |
| `openclaw.runtimeExtensions`                                      | Deklaruje zbudowane punkty wejścia runtime JavaScript dla zainstalowanych pakietów. Muszą pozostać wewnątrz katalogu pakietu Plugin.                                                |
| `openclaw.setupEntry`                                             | Lekki punkt wejścia tylko dla konfiguracji używany podczas onboardingu, opóźnionego uruchamiania kanału i wykrywania statusu kanału/SecretRef tylko do odczytu. Musi pozostać wewnątrz katalogu pakietu Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Deklaruje zbudowany punkt wejścia konfiguracji JavaScript dla zainstalowanych pakietów. Musi pozostać wewnątrz katalogu pakietu Plugin.                                             |
| `openclaw.channel`                                                | Lekkie metadane katalogu kanałów, takie jak etykiety, ścieżki dokumentacji, aliasy i tekst do wyboru.                                                                               |
| `openclaw.channel.configuredState`                                | Lekkie metadane sprawdzania stanu konfiguracji, które mogą odpowiedzieć na pytanie „czy konfiguracja oparta tylko na env już istnieje?” bez ładowania pełnego runtime kanału.      |
| `openclaw.channel.persistedAuthState`                             | Lekkie metadane sprawdzania utrwalonego stanu uwierzytelniania, które mogą odpowiedzieć na pytanie „czy cokolwiek jest już zalogowane?” bez ładowania pełnego runtime kanału.      |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Wskazówki instalacji/aktualizacji dla dołączonych i publikowanych zewnętrznie Pluginów.                                                                                              |
| `openclaw.install.defaultChoice`                                  | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                                                         |
| `openclaw.install.minHostVersion`                                 | Minimalna obsługiwana wersja hosta OpenClaw, przy użyciu progu semver, takiego jak `>=2026.3.22`.                                                                                   |
| `openclaw.install.expectedIntegrity`                              | Oczekiwany ciąg integralności npm dist, taki jak `sha512-...`; przepływy instalacji i aktualizacji weryfikują względem niego pobrany artefakt.                                     |
| `openclaw.install.allowInvalidConfigRecovery`                     | Pozwala na wąską ścieżkę odzyskiwania przez ponowną instalację dołączonego Plugin, gdy konfiguracja jest nieprawidłowa.                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Pozwala ładować powierzchnie kanałów tylko do konfiguracji przed pełnym Plugin kanału podczas uruchamiania.                                                                         |

Metadane manifestu decydują, które opcje providera/kanału/konfiguracji pojawiają się
w onboardingu przed załadowaniem runtime. `package.json#openclaw.install` mówi
onboardingowi, jak pobrać lub włączyć ten Plugin, gdy użytkownik wybierze jedną z tych
opcji. Nie przenoś wskazówek instalacyjnych do `openclaw.plugin.json`.

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i ładowania
rejestru manifestów. Nieprawidłowe wartości są odrzucane; nowsze, ale prawidłowe wartości powodują pominięcie
Plugin na starszych hostach.

Dokładne przypinanie wersji npm już znajduje się w `npmSpec`, na przykład
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Oficjalne wpisy katalogu zewnętrznego
powinny łączyć dokładne specyfikacje z `expectedIntegrity`, tak aby przepływy aktualizacji kończyły się
bezpieczną odmową, jeśli pobrany artefakt npm nie odpowiada już przypiętemu wydaniu.
Interaktywny onboarding nadal oferuje specyfikacje npm z zaufanego rejestru, w tym zwykłe
nazwy pakietów i dist-tagi, dla zgodności. Diagnostyka katalogu potrafi
odróżnić źródła dokładne, pływające, przypięte integralnością, bez integralności,
z niedopasowaniem nazwy pakietu i z nieprawidłowym default-choice. Ostrzega też, gdy
`expectedIntegrity` jest obecne, ale nie ma prawidłowego źródła npm, do którego można je przypiąć.
Gdy `expectedIntegrity` jest obecne,
przepływy instalacji/aktualizacji je egzekwują; gdy jest pominięte, rozwiązywanie rejestru jest
zapisywane bez przypięcia integralności.

Pluginy kanałów powinny dostarczać `openclaw.setupEntry`, gdy status, lista kanałów
lub skany SecretRef muszą identyfikować skonfigurowane konta bez ładowania pełnego
runtime. Wpis setup powinien udostępniać metadane kanału oraz bezpieczne dla setup adaptery
konfiguracji, statusu i sekretów; klientów sieciowych, listenerów gateway i
runtime transportu należy trzymać w głównym punkcie wejścia rozszerzenia.

Pola punktów wejścia runtime nie nadpisują kontroli granic pakietu dla pól
punktów wejścia źródła. Na przykład `openclaw.runtimeExtensions` nie może sprawić, by
uciekająca ścieżka `openclaw.extensions` stała się ładowalna.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie
sprawia, że dowolnie uszkodzone konfiguracje stają się instalowalne. Obecnie pozwala jedynie
przepływom instalacji odzyskiwać się po określonych błędach aktualizacji starych dołączonych Pluginów, takich jak
brakująca ścieżka dołączonego Plugin lub stary wpis `channels.<id>` dla tego samego
dołączonego Plugin. Niezwiązane błędy konfiguracji nadal blokują instalację i kierują operatorów
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

Używaj tego, gdy setup, doctor lub przepływy configured-state potrzebują taniej sondy
uwierzytelniania typu tak/nie przed załadowaniem pełnego Plugin kanału. Docelowy eksport powinien być małą
funkcją, która tylko odczytuje utrwalony stan; nie prowadź go przez główny barrel runtime kanału.

`openclaw.channel.configuredState` ma ten sam kształt dla tanich kontroli configured-state opartych tylko na env:

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

Używaj tego, gdy kanał może odpowiedzieć na configured-state na podstawie env lub innych małych
wejść niezwiązanych z runtime. Jeśli kontrola wymaga pełnego rozwiązania konfiguracji lub rzeczywistego
runtime kanału, pozostaw tę logikę w hooku Plugin `config.hasConfiguredState`.

## Priorytet wykrywania (duplikaty identyfikatorów Plugin)

OpenClaw wykrywa Pluginy z kilku katalogów głównych (dołączone, instalacja globalna, obszar roboczy, jawne ścieżki wybrane w konfiguracji). Jeśli dwa wykrycia współdzielą ten sam `id`, zachowywany jest tylko manifest o **najwyższym priorytecie**; duplikaty o niższym priorytecie są odrzucane zamiast ładowania obok niego.

Priorytet, od najwyższego do najniższego:

1. **Config-selected** — ścieżka jawnie przypięta w `plugins.entries.<id>`
2. **Bundled** — Pluginy dostarczane z OpenClaw
3. **Global install** — Pluginy zainstalowane w globalnym katalogu głównym Pluginów OpenClaw
4. **Workspace** — Pluginy wykryte względem bieżącego obszaru roboczego

Konsekwencje:

- Rozwidlenie lub stara kopia dołączonego Plugin znajdująca się w obszarze roboczym nie przesłoni dołączonego buildu.
- Aby faktycznie nadpisać dołączony Plugin lokalnym, przypnij go przez `plugins.entries.<id>`, aby wygrał priorytetem zamiast polegać na wykrywaniu w obszarze roboczym.
- Odrzucenie duplikatów jest logowane, aby Doctor i diagnostyka uruchamiania mogły wskazać odrzuconą kopię.

## Wymagania JSON Schema

- **Każdy Plugin musi dostarczać JSON Schema**, nawet jeśli nie akceptuje żadnej konfiguracji.
- Pusty schemat jest akceptowalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane podczas odczytu/zapisu konfiguracji, a nie w runtime.

## Zachowanie walidacji

- Nieznane klucze `channels.*` są **błędami**, chyba że identyfikator kanału jest zadeklarowany
  przez manifest Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` i `plugins.slots.*`
  muszą odwoływać się do **wykrywalnych** identyfikatorów Plugin. Nieznane identyfikatory to **błędy**.
- Jeśli Plugin jest zainstalowany, ale ma uszkodzony lub brakujący manifest albo schemat,
  walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd Plugin.
- Jeśli konfiguracja Plugin istnieje, ale Plugin jest **wyłączony**, konfiguracja jest zachowywana, a
  w Doctor + logach pojawia się **ostrzeżenie**.

Pełny schemat `plugins.*` znajdziesz w [Dokumentacja konfiguracji](/pl/gateway/configuration).

## Uwagi

- Manifest jest **wymagany dla natywnych Pluginów OpenClaw**, w tym ładowanych z lokalnego systemu plików. Runtime nadal ładuje moduł Plugin osobno; manifest służy wyłącznie do wykrywania i walidacji.
- Natywne manifesty są analizowane z użyciem JSON5, więc komentarze, końcowe przecinki i klucze bez cudzysłowów są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Loader manifestu odczytuje tylko udokumentowane pola manifestu. Unikaj własnych kluczy najwyższego poziomu.
- `channels`, `providers`, `cliBackends` i `skills` mogą zostać pominięte, gdy Plugin ich nie potrzebuje.
- `providerDiscoveryEntry` musi pozostać lekkie i nie powinno importować szerokiego kodu runtime; używaj go do statycznych metadanych katalogu providera lub wąskich deskryptorów wykrywania, a nie do wykonania w czasie żądania.
- Wyłączne rodzaje Pluginów są wybierane przez `plugins.slots.*`: `kind: "memory"` przez `plugins.slots.memory`, `kind: "context-engine"` przez `plugins.slots.contextEngine` (domyślnie `legacy`).
- Metadane zmiennych env (`setup.providers[].envVars`, przestarzałe `providerAuthEnvVars` i `channelEnvVars`) są wyłącznie deklaratywne. Status, audyt, walidacja dostarczania Cron i inne powierzchnie tylko do odczytu nadal stosują zaufanie Plugin i efektywną politykę aktywacji, zanim potraktują zmienną env jako skonfigurowaną.
- Metadane kreatora runtime wymagające kodu providera znajdziesz w [Provider runtime hooks](/pl/plugins/architecture-internals#provider-runtime-hooks).
- Jeśli Twój Plugin zależy od modułów natywnych, udokumentuj kroki build oraz wszelkie wymagania allowlisty menedżera pakietów (na przykład pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Powiązane

<CardGroup cols={3}>
  <Card title="Tworzenie Pluginów" href="/pl/plugins/building-plugins" icon="rocket">
    Jak zacząć pracę z Pluginami.
  </Card>
  <Card title="Architektura Pluginów" href="/pl/plugins/architecture" icon="diagram-project">
    Architektura wewnętrzna i model capability.
  </Card>
  <Card title="Przegląd SDK" href="/pl/plugins/sdk-overview" icon="book">
    Dokumentacja SDK Pluginów i importy podścieżek.
  </Card>
</CardGroup>
