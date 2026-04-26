---
read_when:
    - Tworzysz Plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji Pluginu lub debugować błędy walidacji Pluginu
summary: Manifest Pluginu + wymagania schematu JSON (ścisła walidacja konfiguracji)
title: Manifest Pluginu
x-i18n:
    generated_at: "2026-04-26T11:36:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: b86920ad774c5ef4ace7b546ef44e5b087a8ca694dea622ddb440258ffff4237
    source_path: plugins/manifest.md
    workflow: 15
---

Ta strona dotyczy wyłącznie **natywnego manifestu Pluginu OpenClaw**.

Informacje o zgodnych układach bundli znajdziesz w [Bundlach Pluginów](/pl/plugins/bundles).

Zgodne formaty bundli używają innych plików manifestu:

- Bundel Codex: `.codex-plugin/plugin.json`
- Bundel Claude: `.claude-plugin/plugin.json` lub domyślny układ komponentów Claude
  bez manifestu
- Bundel Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa także te układy bundli, ale nie są one walidowane
względem opisanego tutaj schematu `openclaw.plugin.json`.

W przypadku zgodnych bundli OpenClaw obecnie odczytuje metadane bundla oraz zadeklarowane
korzenie skillów, korzenie poleceń Claude, domyślne wartości `settings.json` bundla Claude,
domyślne wartości LSP bundla Claude oraz obsługiwane pakiety hooków, gdy układ odpowiada
oczekiwaniom środowiska uruchomieniowego OpenClaw.

Każdy natywny Plugin OpenClaw **musi** dostarczać plik `openclaw.plugin.json` w
**katalogu głównym Pluginu**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu Pluginu**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy Pluginu i blokują walidację konfiguracji.

Zobacz pełny przewodnik po systemie Pluginów: [Pluginy](/pl/tools/plugin).
Informacje o natywnym modelu możliwości i aktualnych wskazówkach dotyczących kompatybilności zewnętrznej:
[Model możliwości](/pl/plugins/architecture#public-capability-model).

## Do czego służy ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje **zanim załaduje kod
Twojego Pluginu**. Wszystko poniżej musi być na tyle lekkie, aby można to było sprawdzić bez uruchamiania
środowiska uruchomieniowego Pluginu.

**Używaj go do:**

- tożsamości Pluginu, walidacji konfiguracji i podpowiedzi interfejsu konfiguracji
- metadanych uwierzytelniania, onboardingu i konfiguracji (alias, automatyczne włączanie, zmienne środowiskowe dostawcy, wybory uwierzytelniania)
- wskazówek aktywacji dla powierzchni control plane
- skróconej własności rodziny modeli
- statycznych migawek własności możliwości (`contracts`)
- metadanych runnera QA, które współdzielony host `openclaw qa` może sprawdzić
- metadanych konfiguracji specyficznych dla kanału, łączonych w powierzchnie katalogu i walidacji

**Nie używaj go do:** rejestrowania zachowania środowiska uruchomieniowego, deklarowania punktów wejścia kodu
ani metadanych instalacji npm. To należy do kodu Pluginu i `package.json`.

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

## Rozszerzony przykład

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
| `id`                                 | Tak      | `string`                         | Kanoniczny identyfikator Pluginu. Jest to identyfikator używany w `plugins.entries.<id>`.                                                                                                                                         |
| `configSchema`                       | Tak      | `object`                         | Wbudowany schemat JSON Schema dla konfiguracji tego Pluginu.                                                                                                                                                                      |
| `enabledByDefault`                   | Nie      | `true`                           | Oznacza Plugin dołączony do pakietu jako włączony domyślnie. Pomiń to pole albo ustaw dowolną wartość inną niż `true`, aby Plugin był domyślnie wyłączony.                                                                      |
| `legacyPluginIds`                    | Nie      | `string[]`                       | Starsze identyfikatory, które są normalizowane do tego kanonicznego identyfikatora Pluginu.                                                                                                                                      |
| `autoEnableWhenConfiguredProviders`  | Nie      | `string[]`                       | Identyfikatory dostawców, które powinny automatycznie włączyć ten Plugin, gdy uwierzytelnianie, konfiguracja lub odwołania do modeli o nich wspominają.                                                                          |
| `kind`                               | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj Pluginu używany przez `plugins.slots.*`.                                                                                                                                                                |
| `channels`                           | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego Pluginu. Używane do wykrywania i walidacji konfiguracji.                                                                                                                                |
| `providers`                          | Nie      | `string[]`                       | Identyfikatory dostawców należących do tego Pluginu.                                                                                                                                                                              |
| `providerDiscoveryEntry`             | Nie      | `string`                         | Lekka ścieżka modułu wykrywania dostawcy, względna względem katalogu głównego Pluginu, dla metadanych katalogu dostawcy ograniczonych do manifestu, które można załadować bez aktywowania pełnego środowiska uruchomieniowego Pluginu. |
| `modelSupport`                       | Nie      | `object`                         | Należące do manifestu skrócone metadane rodziny modeli używane do automatycznego ładowania Pluginu przed uruchomieniem środowiska uruchomieniowego.                                                                              |
| `modelCatalog`                       | Nie      | `object`                         | Deklaratywne metadane katalogu modeli dla dostawców należących do tego Pluginu. To kontrakt control plane dla przyszłego listowania tylko do odczytu, onboardingu, selektorów modeli, aliasów i ukrywania bez ładowania środowiska uruchomieniowego Pluginu. |
| `providerEndpoints`                  | Nie      | `object[]`                       | Należące do manifestu metadane host/baseUrl punktów końcowych dla tras dostawcy, które rdzeń musi sklasyfikować przed załadowaniem środowiska uruchomieniowego dostawcy.                                                         |
| `cliBackends`                        | Nie      | `string[]`                       | Identyfikatory backendów inferencji CLI należących do tego Pluginu. Używane do automatycznej aktywacji przy uruchomieniu na podstawie jawnych odwołań w konfiguracji.                                                            |
| `syntheticAuthRefs`                  | Nie      | `string[]`                       | Odwołania do dostawców lub backendów CLI, których należący do Pluginu syntetyczny hook uwierzytelniania powinien być sprawdzany podczas cold model discovery przed załadowaniem środowiska uruchomieniowego.                   |
| `nonSecretAuthMarkers`               | Nie      | `string[]`                       | Wartości zastępczych kluczy API należące do Pluginów dołączonych do pakietu, które oznaczają niesecretny lokalny stan poświadczeń, OAuth lub poświadczeń ambient.                                                                 |
| `commandAliases`                     | Nie      | `object[]`                       | Nazwy poleceń należących do tego Pluginu, które powinny generować diagnostykę konfiguracji i CLI świadomą Pluginu przed załadowaniem środowiska uruchomieniowego.                                                                 |
| `providerAuthEnvVars`                | Nie      | `Record<string, string[]>`       | Przestarzałe kompatybilnościowe metadane env dla wyszukiwania uwierzytelniania/statusu dostawcy. Dla nowych Pluginów preferuj `setup.providers[].envVars`; OpenClaw nadal odczytuje to w okresie wycofywania.                  |
| `providerAuthAliases`                | Nie      | `Record<string, string>`         | Identyfikatory dostawców, które powinny ponownie używać innego identyfikatora dostawcy do wyszukiwania uwierzytelniania, na przykład dostawca kodowania współdzielący bazowy klucz API dostawcy i profile uwierzytelniania.   |
| `channelEnvVars`                     | Nie      | `Record<string, string[]>`       | Lekkie metadane env kanału, które OpenClaw może sprawdzić bez ładowania kodu Pluginu. Używaj tego dla konfiguracji kanału opartej na env lub powierzchni uwierzytelniania, które powinny być widoczne dla ogólnych helperów uruchamiania/konfiguracji. |
| `providerAuthChoices`                | Nie      | `object[]`                       | Lekkie metadane wyboru uwierzytelniania dla selektorów onboardingu, rozstrzygania preferowanego dostawcy i prostego wiązania flag CLI.                                                                                           |
| `activation`                         | Nie      | `object`                         | Lekkie metadane planisty aktywacji dla ładowania wyzwalanego przez dostawcę, polecenie, kanał, trasę i możliwości. Tylko metadane; rzeczywiste zachowanie nadal należy do środowiska uruchomieniowego Pluginu.                |
| `setup`                              | Nie      | `object`                         | Lekkie deskryptory konfiguracji/onboardingu, które powierzchnie wykrywania i konfiguracji mogą sprawdzać bez ładowania środowiska uruchomieniowego Pluginu.                                                                      |
| `qaRunners`                          | Nie      | `object[]`                       | Lekkie deskryptory runnerów QA używane przez współdzielonego hosta `openclaw qa` przed załadowaniem środowiska uruchomieniowego Pluginu.                                                                                         |
| `contracts`                          | Nie      | `object`                         | Statyczna migawka możliwości dołączonych do pakietu dla zewnętrznych hooków uwierzytelniania, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia multimediów, generowania obrazów, generowania muzyki, generowania wideo, web-fetch, web search i własności narzędzi. |
| `mediaUnderstandingProviderMetadata` | Nie      | `Record<string, object>`         | Lekkie wartości domyślne rozumienia multimediów dla identyfikatorów dostawców zadeklarowanych w `contracts.mediaUnderstandingProviders`.                                                                                          |
| `channelConfigs`                     | Nie      | `Record<string, object>`         | Należące do manifestu metadane konfiguracji kanału łączone w powierzchnie wykrywania i walidacji przed załadowaniem środowiska uruchomieniowego.                                                                                |
| `skills`                             | Nie      | `string[]`                       | Katalogi Skills do załadowania, względne względem katalogu głównego Pluginu.                                                                                                                                                      |
| `name`                               | Nie      | `string`                         | Czytelna dla człowieka nazwa Pluginu.                                                                                                                                                                                             |
| `description`                        | Nie      | `string`                         | Krótkie podsumowanie wyświetlane na powierzchniach Pluginu.                                                                                                                                                                       |
| `version`                            | Nie      | `string`                         | Informacyjna wersja Pluginu.                                                                                                                                                                                                      |
| `uiHints`                            | Nie      | `Record<string, object>`         | Etykiety interfejsu, placeholdery i wskazówki dotyczące wrażliwości dla pól konfiguracji.                                                                                                                                        |

## Dokumentacja `providerAuthChoices`

Każdy wpis `providerAuthChoices` opisuje jeden wybór onboardingu lub uwierzytelniania.
OpenClaw odczytuje to przed załadowaniem środowiska uruchomieniowego dostawcy.
Listy konfiguracji dostawcy używają tych wyborów z manifestu, wyborów konfiguracji
pochodzących z deskryptorów oraz metadanych katalogu instalacji bez ładowania środowiska uruchomieniowego dostawcy.

| Pole                  | Wymagane | Typ                                             | Znaczenie                                                                                               |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Tak      | `string`                                        | Identyfikator dostawcy, do którego należy ten wybór.                                                    |
| `method`              | Tak      | `string`                                        | Identyfikator metody uwierzytelniania, do której ma nastąpić przekazanie.                              |
| `choiceId`            | Tak      | `string`                                        | Stabilny identyfikator wyboru uwierzytelniania używany przez onboarding i przepływy CLI.               |
| `choiceLabel`         | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli jest pominięta, OpenClaw używa `choiceId`.                    |
| `choiceHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                  |
| `assistantPriority`   | Nie      | `number`                                        | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.       |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                  | Ukrywa wybór przed selektorami asystenta, ale nadal pozwala na ręczny wybór w CLI.                     |
| `deprecatedChoiceIds` | Nie      | `string[]`                                      | Starsze identyfikatory wyborów, które powinny przekierowywać użytkowników do tego zastępczego wyboru.  |
| `groupId`             | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych wyborów.                                      |
| `groupLabel`          | Nie      | `string`                                        | Etykieta tej grupy widoczna dla użytkownika.                                                            |
| `groupHint`           | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                      |
| `optionKey`           | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów uwierzytelniania z jedną flagą.                         |
| `cliFlag`             | Nie      | `string`                                        | Nazwa flagi CLI, na przykład `--openrouter-api-key`.                                                    |
| `cliOption`           | Nie      | `string`                                        | Pełny kształt opcji CLI, na przykład `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                              |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">` | Na których powierzchniach onboardingu ten wybór powinien się pojawiać. Jeśli pole jest pominięte, domyślnie używane jest `["text-inference"]`. |

## Dokumentacja `commandAliases`

Używaj `commandAliases`, gdy Plugin jest właścicielem nazwy polecenia środowiska uruchomieniowego, którą użytkownicy mogą
omyłkowo umieścić w `plugins.allow` albo próbować uruchomić jako polecenie główne CLI. OpenClaw
używa tych metadanych do diagnostyki bez importowania kodu środowiska uruchomieniowego Pluginu.

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
| `name`       | Tak      | `string`          | Nazwa polecenia należącego do tego Pluginu.                                |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie slash czatu, a nie polecenie główne CLI.      |
| `cliCommand` | Nie      | `string`          | Powiązane polecenie główne CLI, które należy zasugerować dla operacji CLI, jeśli istnieje. |

## Dokumentacja `activation`

Używaj `activation`, gdy Plugin może w tani sposób zadeklarować, które zdarzenia control plane
powinny uwzględniać go w planie aktywacji/ładowania.

Ten blok to metadane planisty, a nie API cyklu życia. Nie rejestruje
zachowania środowiska uruchomieniowego, nie zastępuje `register(...)` i nie obiecuje, że
kod Pluginu został już wykonany. Planista aktywacji używa tych pól do
zawężania kandydackich Pluginów, zanim przejdzie do istniejących metadanych własności manifestu,
takich jak `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` i hooki.

Preferuj najwęższe metadane, które już opisują własność. Używaj
`providers`, `channels`, `commandAliases`, deskryptorów konfiguracji lub `contracts`,
gdy te pola wyrażają daną relację. Używaj `activation` dla dodatkowych wskazówek planisty,
których nie da się przedstawić za pomocą tych pól własności.
Dla aliasów środowiska uruchomieniowego CLI, takich jak `claude-cli`,
`codex-cli` czy `google-gemini-cli`, używaj najwyższego poziomu `cliBackends`; `activation.onAgentHarnesses` jest tylko dla
osadzonych identyfikatorów harnessów agentów, które nie mają już pola własności.

Ten blok zawiera tylko metadane. Nie rejestruje zachowania środowiska uruchomieniowego i nie
zastępuje `register(...)`, `setupEntry` ani innych punktów wejścia środowiska uruchomieniowego/Pluginu.
Obecni konsumenci używają go jako wskazówki do zawężania przed szerszym ładowaniem Pluginu, więc
brak metadanych aktywacji zwykle wpływa tylko na wydajność; nie powinien
zmieniać poprawności, dopóki istnieją starsze mechanizmy rezerwowe własności manifestu.

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

| Pole               | Wymagane | Typ                                                  | Znaczenie                                                                                                                                        |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onProviders`      | Nie      | `string[]`                                           | Identyfikatory dostawców, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.                                                   |
| `onAgentHarnesses` | Nie      | `string[]`                                           | Identyfikatory środowiska uruchomieniowego osadzonych harnessów agentów, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania. Dla aliasów backendów CLI używaj najwyższego poziomu `cliBackends`. |
| `onCommands`       | Nie      | `string[]`                                           | Identyfikatory poleceń, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.                                                     |
| `onChannels`       | Nie      | `string[]`                                           | Identyfikatory kanałów, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.                                                     |
| `onRoutes`         | Nie      | `string[]`                                           | Rodzaje tras, które powinny uwzględniać ten Plugin w planach aktywacji/ładowania.                                                               |
| `onCapabilities`   | Nie      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Szerokie wskazówki dotyczące możliwości używane przez planowanie aktywacji control plane. Gdy to możliwe, preferuj węższe pola.                |

Aktualni aktywni konsumenci:

- planowanie CLI wyzwalane poleceniem korzysta z mechanizmu rezerwowego
  `commandAliases[].cliCommand` lub `commandAliases[].name`
- planowanie uruchamiania środowiska uruchomieniowego agenta używa `activation.onAgentHarnesses` dla
  osadzonych harnessów oraz najwyższego poziomu `cliBackends[]` dla aliasów środowiska uruchomieniowego CLI
- planowanie konfiguracji/kanału wyzwalane kanałem korzysta z mechanizmu rezerwowego starszej własności `channels[]`
  gdy brakuje jawnych metadanych aktywacji kanału
- planowanie konfiguracji/środowiska uruchomieniowego wyzwalane dostawcą korzysta z mechanizmu rezerwowego starszej
  własności `providers[]` oraz najwyższego poziomu `cliBackends[]`, gdy jawne metadane aktywacji dostawcy
  są nieobecne

Diagnostyka planisty może rozróżniać jawne wskazówki aktywacji od mechanizmu rezerwowego
własności manifestu. Na przykład `activation-command-hint` oznacza dopasowanie
`activation.onCommands`, natomiast `manifest-command-alias` oznacza, że
planista użył zamiast tego własności `commandAliases`. Te etykiety powodów służą do
diagnostyki hosta i testów; autorzy Pluginów powinni nadal deklarować metadane,
które najlepiej opisują własność.

## Dokumentacja `qaRunners`

Używaj `qaRunners`, gdy Plugin wnosi jeden lub więcej runnerów transportu pod
współdzielonym korzeniem `openclaw qa`. Zachowuj te metadane jako lekkie i statyczne; środowisko uruchomieniowe Pluginu
nadal odpowiada za rzeczywistą rejestrację CLI przez lekką
powierzchnię `runtime-api.ts`, która eksportuje `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Uruchom wspieraną przez Docker aktywną ścieżkę QA Matrix względem tymczasowego homeservera"
    }
  ]
}
```

| Pole          | Wymagane | Typ      | Znaczenie                                                                |
| ------------- | -------- | -------- | ------------------------------------------------------------------------ |
| `commandName` | Tak      | `string` | Podpolecenie montowane pod `openclaw qa`, na przykład `matrix`.          |
| `description` | Nie      | `string` | Zastępczy tekst pomocy używany, gdy współdzielony host potrzebuje polecenia stub. |

## Dokumentacja `setup`

Używaj `setup`, gdy powierzchnie konfiguracji i onboardingu potrzebują lekkich metadanych należących do Pluginu
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

Najwyższy poziom `cliBackends` pozostaje prawidłowy i nadal opisuje backendy inferencji CLI.
`setup.cliBackends` to powierzchnia deskryptora specyficzna dla konfiguracji
dla przepływów control plane/konfiguracji, które powinny pozostać wyłącznie metadanymi.

Jeśli są obecne, `setup.providers` i `setup.cliBackends` są preferowaną
powierzchnią wyszukiwania typu descriptor-first dla wykrywania konfiguracji. Jeśli deskryptor jedynie
zawęża kandydacki Plugin, a konfiguracja nadal potrzebuje bogatszych hooków środowiska uruchomieniowego na etapie konfiguracji,
ustaw `requiresRuntime: true` i pozostaw `setup-api` jako
rezerwową ścieżkę wykonania.

OpenClaw uwzględnia także `setup.providers[].envVars` w ogólnych wyszukiwaniach uwierzytelniania dostawcy i
zmiennych env. `providerAuthEnvVars` pozostaje obsługiwane przez adapter zgodności
w okresie wycofywania, ale niedołączone do pakietu Pluginy, które nadal z niego korzystają,
otrzymują diagnostykę manifestu. Nowe Pluginy powinny umieszczać metadane env konfiguracji/statusu
w `setup.providers[].envVars`.

OpenClaw może również wyprowadzać proste wybory konfiguracji z `setup.providers[].authMethods`,
gdy nie ma dostępnego wpisu konfiguracji lub gdy `setup.requiresRuntime: false`
deklaruje, że środowisko uruchomieniowe konfiguracji nie jest potrzebne. Jawne wpisy `providerAuthChoices` pozostają
preferowane dla niestandardowych etykiet, flag CLI, zakresu onboardingu i metadanych asystenta.

Ustaw `requiresRuntime: false` tylko wtedy, gdy te deskryptory są wystarczające dla
powierzchni konfiguracji. OpenClaw traktuje jawne `false` jako kontrakt wyłącznie deskryptorowy
i nie wykona `setup-api` ani `openclaw.setupEntry` przy wyszukiwaniu konfiguracji. Jeśli
Plugin wyłącznie deskryptorowy nadal dostarcza jeden z tych wpisów środowiska uruchomieniowego konfiguracji,
OpenClaw zgłasza dodatkową diagnostykę i nadal go ignoruje. Pominięte
`requiresRuntime` zachowuje starsze działanie rezerwowe, aby istniejące Pluginy, które dodały
deskryptory bez tej flagi, nie uległy awarii.

Ponieważ wyszukiwanie konfiguracji może wykonywać należący do Pluginu kod `setup-api`, znormalizowane
wartości `setup.providers[].id` i `setup.cliBackends[]` muszą pozostać unikalne globalnie wśród
wykrytych Pluginów. Niejednoznaczna własność kończy się bezpieczną odmową zamiast wybierania
zwycięzcy na podstawie kolejności wykrywania.

Gdy środowisko uruchomieniowe konfiguracji rzeczywiście się uruchamia, diagnostyka rejestru konfiguracji zgłasza
rozbieżność deskryptora, jeśli `setup-api` rejestruje dostawcę lub backend CLI, którego
deskryptory manifestu nie deklarują, albo jeśli deskryptor nie ma odpowiadającej
rejestracji środowiska uruchomieniowego. Ta diagnostyka jest addytywna i nie odrzuca starszych Pluginów.

### Dokumentacja `setup.providers`

| Pole          | Wymagane | Typ        | Znaczenie                                                                                 |
| ------------- | -------- | ---------- | ----------------------------------------------------------------------------------------- |
| `id`          | Tak      | `string`   | Identyfikator dostawcy udostępniany podczas konfiguracji lub onboardingu. Utrzymuj znormalizowane identyfikatory globalnie unikalne. |
| `authMethods` | Nie      | `string[]` | Identyfikatory metod konfiguracji/uwierzytelniania obsługiwane przez tego dostawcę bez ładowania pełnego środowiska uruchomieniowego. |
| `envVars`     | Nie      | `string[]` | Zmienne env, które ogólne powierzchnie konfiguracji/statusu mogą sprawdzać przed załadowaniem środowiska uruchomieniowego Pluginu. |

### Pola `setup`

| Pole               | Wymagane | Typ        | Znaczenie                                                                                                  |
| ------------------ | -------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`        | Nie      | `object[]` | Deskryptory konfiguracji dostawcy udostępniane podczas konfiguracji i onboardingu.                        |
| `cliBackends`      | Nie      | `string[]` | Identyfikatory backendów używane na etapie konfiguracji do wyszukiwania typu descriptor-first. Utrzymuj znormalizowane identyfikatory globalnie unikalne. |
| `configMigrations` | Nie      | `string[]` | Identyfikatory migracji konfiguracji należące do powierzchni konfiguracji tego Pluginu.                  |
| `requiresRuntime`  | Nie      | `boolean`  | Czy konfiguracja nadal wymaga wykonania `setup-api` po wyszukaniu deskryptora.                            |

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

| Pole          | Typ        | Znaczenie                                 |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Etykieta pola widoczna dla użytkownika.   |
| `help`        | `string`   | Krótki tekst pomocniczy.                  |
| `tags`        | `string[]` | Opcjonalne tagi interfejsu.               |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.           |
| `sensitive`   | `boolean`  | Oznacza pole jako sekretne lub wrażliwe.  |
| `placeholder` | `string`   | Tekst placeholdera dla pól formularza.    |

## Dokumentacja `contracts`

Używaj `contracts` tylko dla statycznych metadanych własności możliwości, które OpenClaw może
odczytać bez importowania środowiska uruchomieniowego Pluginu.

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

| Pole                             | Typ        | Znaczenie                                                            |
| -------------------------------- | ---------- | -------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Identyfikatory fabryk rozszerzeń Codex app-server, obecnie `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Identyfikatory środowiska uruchomieniowego, dla których dołączony do pakietu Plugin może zarejestrować middleware wyników narzędzi. |
| `externalAuthProviders`          | `string[]` | Identyfikatory dostawców, których zewnętrzny hook profilu uwierzytelniania należy do tego Pluginu. |
| `speechProviders`                | `string[]` | Identyfikatory dostawców mowy należące do tego Pluginu.              |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców transkrypcji w czasie rzeczywistym należące do tego Pluginu. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców głosu w czasie rzeczywistym należące do tego Pluginu. |
| `memoryEmbeddingProviders`       | `string[]` | Identyfikatory dostawców embeddingów pamięci należące do tego Pluginu. |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców rozumienia multimediów należące do tego Pluginu. |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania obrazów należące do tego Pluginu. |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców generowania wideo należące do tego Pluginu. |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców web-fetch należące do tego Pluginu.         |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców web search należące do tego Pluginu.        |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należących do tego Pluginu dla dołączonych do pakietu kontroli kontraktów. |

`contracts.embeddedExtensionFactories` jest zachowane dla dołączonych do pakietu
fabryk rozszerzeń wyłącznie Codex app-server. Dołączone do pakietu transformacje wyników narzędzi powinny
deklarować `contracts.agentToolResultMiddleware` i rejestrować się przez
`api.registerAgentToolResultMiddleware(...)`. Zewnętrzne Pluginy nie mogą
rejestrować middleware wyników narzędzi, ponieważ ten interfejs może przepisywać dane wyjściowe
narzędzi o wysokim poziomie zaufania, zanim model je zobaczy.

Pluginy dostawców implementujące `resolveExternalAuthProfiles` powinny deklarować
`contracts.externalAuthProviders`. Pluginy bez tej deklaracji nadal działają przez
przestarzały mechanizm rezerwowy kompatybilności, ale ten mechanizm rezerwowy jest wolniejszy i
zostanie usunięty po okresie migracji.

Dołączoni do pakietu dostawcy embeddingów pamięci powinni deklarować
`contracts.memoryEmbeddingProviders` dla każdego identyfikatora adaptera, który udostępniają, w tym
wbudowanych adapterów takich jak `local`. Samodzielne ścieżki CLI używają tego kontraktu
manifestu do ładowania tylko właściwego Pluginu przed pełnym środowiskiem uruchomieniowym Gateway
zarejestrowało dostawców.

## Dokumentacja `mediaUnderstandingProviderMetadata`

Używaj `mediaUnderstandingProviderMetadata`, gdy dostawca rozumienia multimediów ma
modele domyślne, priorytet rezerwowy auto-auth lub natywną obsługę dokumentów, których
ogólne helpery rdzenia potrzebują przed załadowaniem środowiska uruchomieniowego. Klucze muszą być także zadeklarowane w
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

Każdy wpis dostawcy może zawierać:

| Pole                   | Typ                                 | Znaczenie                                                                    |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Możliwości multimedialne udostępniane przez tego dostawcę.                  |
| `defaultModels`        | `Record<string, string>`            | Domyślne przypisania możliwości do modeli używane, gdy konfiguracja nie określa modelu. |
| `autoPriority`         | `Record<string, number>`            | Niższe liczby są sortowane wcześniej dla automatycznego, opartego na poświadczeniach mechanizmu rezerwowego dostawcy. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Natywne wejścia dokumentów obsługiwane przez dostawcę.                      |

## Dokumentacja `channelConfigs`

Używaj `channelConfigs`, gdy Plugin kanału potrzebuje lekkich metadanych konfiguracji przed
załadowaniem środowiska uruchomieniowego. Wykrywanie konfiguracji/statusu kanału tylko do odczytu może używać tych metadanych
bezpośrednio dla skonfigurowanych kanałów zewnętrznych, gdy nie ma dostępnego wpisu konfiguracji lub
gdy `setup.requiresRuntime: false` deklaruje, że środowisko uruchomieniowe konfiguracji nie jest potrzebne.

`channelConfigs` to metadane manifestu Pluginu, a nie nowa sekcja konfiguracji użytkownika najwyższego poziomu.
Użytkownicy nadal konfigurują instancje kanałów w `channels.<channel-id>`.
OpenClaw odczytuje metadane manifestu, aby zdecydować, który Plugin jest właścicielem tego skonfigurowanego
kanału, zanim wykona się kod środowiska uruchomieniowego Pluginu.

Dla Pluginu kanału `configSchema` i `channelConfigs` opisują różne
ścieżki:

- `configSchema` waliduje `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` waliduje `channels.<channel-id>`

Pluginy niedołączone do pakietu, które deklarują `channels[]`, powinny także deklarować odpowiadające
wpisy `channelConfigs`. Bez nich OpenClaw nadal może załadować Plugin, ale
schemat konfiguracji cold-path, konfiguracja i powierzchnie Control UI nie mogą znać
kształtu opcji należących do kanału, dopóki nie wykona się środowisko uruchomieniowe Pluginu.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` oraz
`nativeSkillsAutoEnabled` mogą deklarować statyczne domyślne wartości `auto` dla kontroli konfiguracji poleceń,
które działają przed załadowaniem środowiska uruchomieniowego kanału. Kanały dołączone do pakietu mogą również publikować
te same wartości domyślne przez `package.json#openclaw.channel.commands` obok
innych metadanych katalogu kanałów należących do pakietu.

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
          "label": "Adres URL homeservera",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Połączenie z homeserverem Matrix",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
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
| `label`       | `string`                 | Etykieta kanału łączona z powierzchniami selektora i inspekcji, gdy metadane środowiska uruchomieniowego nie są gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                    |
| `commands`    | `object`                 | Statyczne domyślne ustawienia auto dla natywnych poleceń i natywnych Skills do kontroli konfiguracji przed uruchomieniem środowiska uruchomieniowego. |
| `preferOver`  | `string[]`               | Starsze lub o niższym priorytecie identyfikatory Pluginów, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

### Zastępowanie innego Pluginu kanału

Używaj `preferOver`, gdy Twój Plugin jest preferowanym właścicielem identyfikatora kanału, który
może być również dostarczany przez inny Plugin. Typowe przypadki to zmieniony identyfikator Pluginu,
samodzielny Plugin, który zastępuje Plugin dołączony do pakietu, albo utrzymywany fork,
który zachowuje ten sam identyfikator kanału dla zgodności konfiguracji.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

Gdy `channels.chat` jest skonfigurowane, OpenClaw bierze pod uwagę zarówno identyfikator kanału, jak i
preferowany identyfikator Pluginu. Jeśli Plugin o niższym priorytecie został wybrany tylko dlatego,
że jest dołączony do pakietu lub domyślnie włączony, OpenClaw wyłącza go w efektywnej
konfiguracji środowiska uruchomieniowego, tak aby jeden Plugin był właścicielem kanału i jego narzędzi. Jawny
wybór użytkownika nadal ma pierwszeństwo: jeśli użytkownik jawnie włączy oba Pluginy, OpenClaw
zachowa ten wybór i zgłosi diagnostykę zduplikowanego kanału/narzędzi zamiast
po cichu zmieniać żądany zestaw Pluginów.

Utrzymuj `preferOver` ograniczone do identyfikatorów Pluginów, które rzeczywiście mogą dostarczać ten sam kanał.
Nie jest to ogólne pole priorytetu i nie zmienia nazw kluczy konfiguracji użytkownika.

## Dokumentacja `modelSupport`

Używaj `modelSupport`, gdy OpenClaw powinien wnioskować o Twoim Pluginie dostawcy na podstawie
skróconych identyfikatorów modeli, takich jak `gpt-5.5` lub `claude-sonnet-4.6`, zanim załaduje się
środowisko uruchomieniowe Pluginu.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw stosuje następujące pierwszeństwo:

- jawne odwołania `provider/model` używają metadanych manifestu `providers` właściwego właściciela
- `modelPatterns` mają pierwszeństwo przed `modelPrefixes`
- jeśli dopasuje się jeden Plugin niedołączony do pakietu i jeden Plugin dołączony do pakietu, wygrywa Plugin
  niedołączony do pakietu
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik lub konfiguracja nie określi dostawcy

Pola:

| Pole            | Typ        | Znaczenie                                                                 |
| --------------- | ---------- | ------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane przez `startsWith` do skróconych identyfikatorów modeli. |
| `modelPatterns` | `string[]` | Źródła wyrażeń regularnych dopasowywane do skróconych identyfikatorów modeli po usunięciu sufiksu profilu. |

## Dokumentacja `modelCatalog`

Używaj `modelCatalog`, gdy OpenClaw powinien znać metadane modeli dostawcy przed
załadowaniem środowiska uruchomieniowego Pluginu. To należące do manifestu źródło dla stałych
wierszy katalogu, aliasów dostawców, reguł ukrywania i trybu wykrywania. Odświeżanie środowiska uruchomieniowego
nadal należy do kodu środowiska uruchomieniowego dostawcy, ale manifest informuje rdzeń, kiedy środowisko uruchomieniowe
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
        "reason": "niedostępny w Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Pola najwyższego poziomu:

| Pole           | Typ                                                      | Znaczenie                                                                                                   |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Wiersze katalogu dla identyfikatorów dostawców należących do tego Pluginu. Klucze powinny też występować w najwyższym poziomie `providers`. |
| `aliases`      | `Record<string, object>`                                 | Aliasy dostawców, które powinny być rozwiązywane do należącego dostawcy na potrzeby katalogu lub planowania ukrywania. |
| `suppressions` | `object[]`                                               | Wiersze modeli z innego źródła, które ten Plugin ukrywa z powodu specyficznego dla dostawcy.              |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Czy katalog dostawcy można odczytać z metadanych manifestu, odświeżyć do pamięci podręcznej, czy wymaga środowiska uruchomieniowego. |

Pola dostawcy:

| Pole      | Typ                      | Znaczenie                                                                |
| --------- | ------------------------ | ------------------------------------------------------------------------ |
| `baseUrl` | `string`                 | Opcjonalny domyślny `baseUrl` dla modeli w tym katalogu dostawcy.        |
| `api`     | `ModelApi`               | Opcjonalny domyślny adapter API dla modeli w tym katalogu dostawcy.      |
| `headers` | `Record<string, string>` | Opcjonalne statyczne nagłówki mające zastosowanie do tego katalogu dostawcy. |
| `models`  | `object[]`               | Wymagane wiersze modeli. Wiersze bez `id` są ignorowane.                 |

Pola modelu:

| Pole            | Typ                                                            | Znaczenie                                                                  |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Lokalny dla dostawcy identyfikator modelu, bez prefiksu `provider/`.       |
| `name`          | `string`                                                       | Opcjonalna nazwa wyświetlana.                                              |
| `api`           | `ModelApi`                                                     | Opcjonalne nadpisanie API dla pojedynczego modelu.                         |
| `baseUrl`       | `string`                                                       | Opcjonalne nadpisanie `baseUrl` dla pojedynczego modelu.                   |
| `headers`       | `Record<string, string>`                                       | Opcjonalne statyczne nagłówki dla pojedynczego modelu.                     |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalności akceptowane przez model.                                        |
| `reasoning`     | `boolean`                                                      | Czy model udostępnia zachowanie reasoning.                                 |
| `contextWindow` | `number`                                                       | Natywne okno kontekstu dostawcy.                                           |
| `contextTokens` | `number`                                                       | Opcjonalny efektywny limit kontekstu środowiska uruchomieniowego, gdy różni się od `contextWindow`. |
| `maxTokens`     | `number`                                                       | Maksymalna liczba tokenów wyjściowych, jeśli jest znana.                   |
| `cost`          | `object`                                                       | Opcjonalna cena w USD za milion tokenów, w tym opcjonalne `tieredPricing`. |
| `compat`        | `object`                                                       | Opcjonalne flagi zgodności odpowiadające zgodności konfiguracji modelu OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status na liście. Ukrywaj tylko wtedy, gdy wiersz w ogóle nie powinien się pojawiać. |
| `statusReason`  | `string`                                                       | Opcjonalny powód wyświetlany przy statusie innym niż dostępny.             |
| `replaces`      | `string[]`                                                     | Starsze lokalne dla dostawcy identyfikatory modeli, które ten model zastępuje. |
| `replacedBy`    | `string`                                                       | Zastępczy lokalny dla dostawcy identyfikator modelu dla wierszy przestarzałych. |
| `tags`          | `string[]`                                                     | Stabilne tagi używane przez selektory i filtry.                            |

Nie umieszczaj danych wyłącznie środowiska uruchomieniowego w `modelCatalog`. Jeśli dostawca potrzebuje stanu
konta, żądania API lub wykrywania lokalnego procesu, aby znać pełny zestaw modeli,
zadeklaruj tego dostawcę jako `refreshable` albo `runtime` w `discovery`.

### Indeks dostawców OpenClaw

Indeks dostawców OpenClaw to należące do OpenClaw metadane podglądowe dla dostawców,
których Pluginy mogą nie być jeszcze zainstalowane. Nie jest częścią manifestu Pluginu.
Manifesty Pluginów pozostają autorytatywnym źródłem dla zainstalowanych Pluginów. Indeks dostawców jest
wewnętrznym kontraktem rezerwowym, z którego będą korzystać przyszłe powierzchnie
instalowalnych dostawców i selektory modeli przed instalacją, gdy Plugin dostawcy nie jest zainstalowany.

Kolejność autorytetu katalogu:

1. Konfiguracja użytkownika.
2. `modelCatalog` manifestu zainstalowanego Pluginu.
3. Pamięć podręczna katalogu modeli z jawnego odświeżenia.
4. Wiersze podglądu Indeksu dostawców OpenClaw.

Indeks dostawców nie może zawierać sekretów, stanu włączenia, hooków środowiska uruchomieniowego ani
aktywnych danych modeli specyficznych dla konta. Jego katalogi podglądowe używają tego samego
kształtu wiersza dostawcy `modelCatalog` co manifesty Pluginów, ale powinny pozostać ograniczone
do stabilnych metadanych wyświetlania, chyba że pola adaptera środowiska uruchomieniowego, takie jak `api`,
`baseUrl`, ceny lub flagi zgodności, są celowo utrzymywane w zgodności z manifestem
zainstalowanego Pluginu. Dostawcy z aktywnym wykrywaniem `/models` powinni zapisywać
odświeżone wiersze przez jawną ścieżkę pamięci podręcznej katalogu modeli zamiast wykonywać normalne
listowanie lub onboarding wywołujący API dostawcy.

Wpisy Indeksu dostawców mogą również zawierać metadane instalowalnego Pluginu dla dostawców,
których Plugin został przeniesiony poza rdzeń lub nie jest jeszcze zainstalowany. Te
metadane odzwierciedlają wzorzec katalogu kanałów: nazwa pakietu, specyfikacja instalacji npm,
oczekiwana integralność i lekkie etykiety wyboru uwierzytelniania wystarczą, by pokazać
instalowalną opcję konfiguracji. Po zainstalowaniu Pluginu jego manifest ma pierwszeństwo, a wpis
Indeksu dostawców jest ignorowany dla tego dostawcy.

Starsze klucze możliwości najwyższego poziomu są przestarzałe. Użyj `openclaw doctor --fix`, aby
przenieść `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` i `webSearchProviders` pod `contracts`; normalne
ładowanie manifestu nie traktuje już tych pól najwyższego poziomu jako
własności możliwości.

## Manifest a package.json

Te dwa pliki służą do różnych zadań:

| Plik                   | Używaj go do                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Wykrywania, walidacji konfiguracji, metadanych wyboru uwierzytelniania i wskazówek interfejsu, które muszą istnieć przed uruchomieniem kodu Pluginu |
| `package.json`         | Metadanych npm, instalacji zależności oraz bloku `openclaw` używanego do punktów wejścia, kontroli instalacji, konfiguracji lub metadanych katalogu |

Jeśli nie masz pewności, gdzie powinien znajdować się dany fragment metadanych, stosuj tę zasadę:

- jeśli OpenClaw musi znać je przed załadowaniem kodu Pluginu, umieść je w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików wejściowych lub zachowania instalacji npm, umieść je w `package.json`

### Pola `package.json`, które wpływają na wykrywanie

Niektóre metadane Pluginu używane przed uruchomieniem celowo znajdują się w `package.json` w bloku
`openclaw`, a nie w `openclaw.plugin.json`.

Ważne przykłady:

| Pole                                                              | Znaczenie                                                                                                                                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Deklaruje natywne punkty wejścia Pluginu. Muszą pozostawać wewnątrz katalogu pakietu Pluginu.                                                                                       |
| `openclaw.runtimeExtensions`                                      | Deklaruje zbudowane punkty wejścia środowiska uruchomieniowego JavaScript dla zainstalowanych pakietów. Muszą pozostawać wewnątrz katalogu pakietu Pluginu.                        |
| `openclaw.setupEntry`                                             | Lekki punkt wejścia tylko do konfiguracji używany podczas onboardingu, odroczonego uruchamiania kanału oraz wykrywania statusu kanału/SecretRef tylko do odczytu. Musi pozostawać wewnątrz katalogu pakietu Pluginu. |
| `openclaw.runtimeSetupEntry`                                      | Deklaruje zbudowany punkt wejścia konfiguracji JavaScript dla zainstalowanych pakietów. Musi pozostawać wewnątrz katalogu pakietu Pluginu.                                          |
| `openclaw.channel`                                                | Lekkie metadane katalogu kanałów, takie jak etykiety, ścieżki dokumentacji, aliasy i tekst wyboru.                                                                                  |
| `openclaw.channel.commands`                                       | Statyczne metadane natywnych poleceń i natywnych Skills z domyślnymi ustawieniami auto, używane przez powierzchnie konfiguracji, audytu i listy poleceń przed załadowaniem środowiska uruchomieniowego kanału. |
| `openclaw.channel.configuredState`                                | Lekkie metadane sprawdzania stanu konfiguracji, które mogą odpowiedzieć na pytanie „czy konfiguracja oparta wyłącznie na env już istnieje?” bez ładowania pełnego środowiska uruchomieniowego kanału. |
| `openclaw.channel.persistedAuthState`                             | Lekkie metadane sprawdzania utrwalonego stanu uwierzytelniania, które mogą odpowiedzieć na pytanie „czy coś jest już zalogowane?” bez ładowania pełnego środowiska uruchomieniowego kanału. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Wskazówki instalacji/aktualizacji dla Pluginów dołączonych do pakietu i publikowanych zewnętrznie.                                                                                  |
| `openclaw.install.defaultChoice`                                  | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                                                        |
| `openclaw.install.minHostVersion`                                 | Minimalna obsługiwana wersja hosta OpenClaw, używająca dolnej granicy semver, takiej jak `>=2026.3.22`.                                                                            |
| `openclaw.install.expectedIntegrity`                              | Oczekiwany ciąg integralności npm dist, taki jak `sha512-...`; przepływy instalacji i aktualizacji weryfikują względem niego pobrany artefakt.                                    |
| `openclaw.install.allowInvalidConfigRecovery`                     | Pozwala na wąską ścieżkę odzyskiwania przez ponowną instalację dołączonego do pakietu Pluginu, gdy konfiguracja jest nieprawidłowa.                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Pozwala powierzchniom kanału tylko do konfiguracji załadować się przed pełnym Pluginem kanału podczas uruchamiania.                                                                 |

Metadane manifestu decydują, które wybory dostawcy/kanału/konfiguracji pojawiają się w
onboardingu przed załadowaniem środowiska uruchomieniowego. `package.json#openclaw.install` mówi
onboardingowi, jak pobrać lub włączyć ten Plugin, gdy użytkownik wybierze jeden z tych
wyborów. Nie przenoś wskazówek instalacji do `openclaw.plugin.json`.

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i ładowania rejestru
manifestów. Nieprawidłowe wartości są odrzucane; nowsze, ale prawidłowe wartości powodują pominięcie
Pluginu na starszych hostach.

Dokładne przypinanie wersji npm znajduje się już w `npmSpec`, na przykład
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Oficjalne wpisy zewnętrznego katalogu
powinny łączyć dokładne specyfikacje z `expectedIntegrity`, aby przepływy aktualizacji kończyły się bezpieczną odmową,
jeśli pobrany artefakt npm nie odpowiada już przypiętemu wydaniu.
Interaktywny onboarding nadal oferuje zaufane specyfikacje npm z rejestru, w tym same nazwy
pakietów i dist-tagi, dla zachowania kompatybilności. Diagnostyka katalogu może
rozróżniać źródła dokładne, pływające, przypięte integralnością, bez integralności, z niezgodnością
nazwy pakietu i z nieprawidłowym wyborem domyślnym. Ostrzega również, gdy
`expectedIntegrity` jest obecne, ale nie ma prawidłowego źródła npm, które można nim przypiąć.
Gdy `expectedIntegrity` jest obecne,
przepływy instalacji/aktualizacji je egzekwują; gdy jest pominięte, rozstrzygnięcie rejestru jest
zapisywane bez przypięcia integralności.

Pluginy kanałów powinny udostępniać `openclaw.setupEntry`, gdy status, lista kanałów
lub skany SecretRef muszą identyfikować skonfigurowane konta bez ładowania pełnego
środowiska uruchomieniowego. Wpis konfiguracji powinien udostępniać metadane kanału oraz bezpieczne dla konfiguracji
adaptery konfiguracji, statusu i sekretów; klientów sieciowych, listenery Gateway i
środowiska uruchomieniowe transportu pozostaw w głównym punkcie wejścia rozszerzenia.

Pola punktów wejścia środowiska uruchomieniowego nie zastępują kontroli granic pakietu dla
źródłowych pól punktów wejścia. Na przykład `openclaw.runtimeExtensions` nie może sprawić, że
uciekająca ścieżka `openclaw.extensions` stanie się możliwa do załadowania.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie
sprawia, że dowolne uszkodzone konfiguracje stają się instalowalne. Obecnie pozwala jedynie
przepływom instalacji odzyskiwać działanie po określonych nieaktualnych błędach aktualizacji dołączonych do pakietu Pluginów, takich jak
brakująca ścieżka dołączonego do pakietu Pluginu lub nieaktualny wpis `channels.<id>` dla tego samego
dołączonego do pakietu Pluginu. Niezwiązane błędy konfiguracji nadal blokują instalację i kierują operatorów
do `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` to metadane pakietu dla małego modułu
sprawdzającego:

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

Używaj ich, gdy przepływy konfiguracji, doctor albo configured-state potrzebują taniego sprawdzenia
uwierzytelniania tak/nie przed załadowaniem pełnego Pluginu kanału. Docelowy eksport powinien być małą
funkcją, która odczytuje tylko stan utrwalony; nie prowadź go przez pełny barrel
środowiska uruchomieniowego kanału.

`openclaw.channel.configuredState` ma ten sam kształt dla tanich kontroli
skonfigurowanego stanu opartych wyłącznie na env:

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

Używaj ich, gdy kanał może odpowiedzieć na pytanie o stan konfiguracji na podstawie env lub innych małych
wejść niezwiązanych ze środowiskiem uruchomieniowym. Jeśli kontrola wymaga pełnego rozstrzygania konfiguracji lub rzeczywistego
środowiska uruchomieniowego kanału, pozostaw tę logikę zamiast tego w hooku Pluginu `config.hasConfiguredState`.

## Pierwszeństwo wykrywania (zduplikowane identyfikatory Pluginów)

OpenClaw wykrywa Pluginy z kilku korzeni (dołączone do pakietu, instalacja globalna, workspace, jawnie wskazane ścieżki wybrane w konfiguracji). Jeśli dwa wykrycia mają ten sam `id`, zachowywany jest tylko manifest o **najwyższym pierwszeństwie**; duplikaty o niższym pierwszeństwie są odrzucane zamiast ładowania obok niego.

Pierwszeństwo, od najwyższego do najniższego:

1. **Wybrane w konfiguracji** — ścieżka jawnie przypięta w `plugins.entries.<id>`
2. **Dołączone do pakietu** — Pluginy dostarczane z OpenClaw
3. **Instalacja globalna** — Pluginy zainstalowane w globalnym katalogu Pluginów OpenClaw
4. **Workspace** — Pluginy wykrywane względem bieżącego workspace

Implikacje:

- Rozgałęziona lub nieaktualna kopia dołączonego do pakietu Pluginu znajdująca się w workspace nie przesłoni wersji dołączonej do pakietu.
- Aby rzeczywiście zastąpić dołączony do pakietu Plugin lokalnym, przypnij go przez `plugins.entries.<id>`, aby wygrał przez pierwszeństwo zamiast polegać na wykrywaniu w workspace.
- Odrzucenia duplikatów są logowane, dzięki czemu Doctor i diagnostyka uruchamiania mogą wskazać odrzuconą kopię.

## Wymagania JSON Schema

- **Każdy Plugin musi dostarczać JSON Schema**, nawet jeśli nie przyjmuje żadnej konfiguracji.
- Pusty schemat jest akceptowalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane podczas odczytu/zapisu konfiguracji, a nie w czasie działania.

## Zachowanie walidacji

- Nieznane klucze `channels.*` są **błędami**, chyba że identyfikator kanału jest zadeklarowany przez
  manifest Pluginu.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` oraz `plugins.slots.*`
  muszą odwoływać się do **wykrywalnych** identyfikatorów Pluginów. Nieznane identyfikatory są **błędami**.
- Jeśli Plugin jest zainstalowany, ale ma uszkodzony lub brakujący manifest albo schemat,
  walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd Pluginu.
- Jeśli konfiguracja Pluginu istnieje, ale Plugin jest **wyłączony**, konfiguracja jest zachowywana i
  w Doctor oraz logach pojawia się **ostrzeżenie**.

Pełny schemat `plugins.*` znajdziesz w [Dokumentacji konfiguracji](/pl/gateway/configuration).

## Uwagi

- Manifest jest **wymagany dla natywnych Pluginów OpenClaw**, także dla ładowań z lokalnego systemu plików. Środowisko uruchomieniowe nadal ładuje moduł Pluginu oddzielnie; manifest służy tylko do wykrywania i walidacji.
- Natywne manifesty są parsowane przy użyciu JSON5, więc komentarze, końcowe przecinki i klucze bez cudzysłowów są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Loader manifestu odczytuje tylko udokumentowane pola manifestu. Unikaj niestandardowych kluczy najwyższego poziomu.
- `channels`, `providers`, `cliBackends` i `skills` mogą zostać pominięte, jeśli Plugin ich nie potrzebuje.
- `providerDiscoveryEntry` musi pozostać lekkie i nie powinno importować szerokiego kodu środowiska uruchomieniowego; używaj go do statycznych metadanych katalogu dostawców albo wąskich deskryptorów wykrywania, a nie do wykonywania w czasie żądania.
- Wyłączne rodzaje Pluginów są wybierane przez `plugins.slots.*`: `kind: "memory"` przez `plugins.slots.memory`, `kind: "context-engine"` przez `plugins.slots.contextEngine` (domyślnie `legacy`).
- Metadane zmiennych env (`setup.providers[].envVars`, przestarzałe `providerAuthEnvVars` oraz `channelEnvVars`) mają wyłącznie charakter deklaratywny. Status, audyt, walidacja dostarczania Cron i inne powierzchnie tylko do odczytu nadal stosują zasady zaufania do Pluginu i efektywnej aktywacji przed uznaniem zmiennej env za skonfigurowaną.
- Informacje o metadanych kreatora środowiska uruchomieniowego wymagających kodu dostawcy znajdziesz w [Hookach środowiska uruchomieniowego dostawcy](/pl/plugins/architecture-internals#provider-runtime-hooks).
- Jeśli Twój Plugin zależy od modułów natywnych, udokumentuj kroki budowania oraz wszelkie wymagania dotyczące allowlist menedżera pakietów (na przykład pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Powiązane

<CardGroup cols={3}>
  <Card title="Tworzenie Pluginów" href="/pl/plugins/building-plugins" icon="rocket">
    Pierwsze kroki z Pluginami.
  </Card>
  <Card title="Architektura Pluginów" href="/pl/plugins/architecture" icon="diagram-project">
    Architektura wewnętrzna i model możliwości.
  </Card>
  <Card title="Przegląd SDK" href="/pl/plugins/sdk-overview" icon="book">
    Dokumentacja Plugin SDK i importy subpath.
  </Card>
</CardGroup>
