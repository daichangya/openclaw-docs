---
read_when:
    - Budujesz plugin OpenClaw
    - Musisz dostarczyć schemat konfiguracji pluginu albo debugować błędy walidacji pluginu
summary: Manifest pluginu + wymagania schematu JSON (ścisła walidacja konfiguracji)
title: Manifest pluginu
x-i18n:
    generated_at: "2026-04-11T02:46:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b254c121d1eb5ea19adbd4148243cf47339c960442ab1ca0e0bfd52e0154c88
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest pluginu (`openclaw.plugin.json`)

Ta strona dotyczy wyłącznie **natywnego manifestu pluginu OpenClaw**.

Informacje o zgodnych układach bundli znajdziesz w [Bundlach pluginów](/pl/plugins/bundles).

Zgodne formaty bundli używają innych plików manifestu:

- Bundel Codex: `.codex-plugin/plugin.json`
- Bundel Claude: `.claude-plugin/plugin.json` albo domyślny układ komponentów Claude
  bez manifestu
- Bundel Cursor: `.cursor-plugin/plugin.json`

OpenClaw automatycznie wykrywa także te układy bundli, ale nie są one walidowane
względem schematu `openclaw.plugin.json` opisanego tutaj.

Dla zgodnych bundli OpenClaw obecnie odczytuje metadane bundla oraz zadeklarowane
katalogi główne Skills, katalogi główne poleceń Claude, domyślne ustawienia `settings.json` bundla Claude,
domyślne ustawienia LSP bundla Claude oraz obsługiwane zestawy hooków, gdy układ odpowiada oczekiwaniom runtime OpenClaw.

Każdy natywny plugin OpenClaw **musi** dostarczać plik `openclaw.plugin.json` w
**katalogu głównym pluginu**. OpenClaw używa tego manifestu do walidacji konfiguracji
**bez wykonywania kodu pluginu**. Brakujące lub nieprawidłowe manifesty są traktowane jako
błędy pluginu i blokują walidację konfiguracji.

Pełny przewodnik po systemie pluginów: [Pluginy](/pl/tools/plugin).
Informacje o natywnym modelu możliwości i aktualnych wskazówkach dotyczących zgodności zewnętrznej:
[Model możliwości](/pl/plugins/architecture#public-capability-model).

## Do czego służy ten plik

`openclaw.plugin.json` to metadane, które OpenClaw odczytuje przed załadowaniem
kodu pluginu.

Używaj go do:

- tożsamości pluginu
- walidacji konfiguracji
- metadanych uwierzytelniania i onboardingu, które powinny być dostępne bez uruchamiania runtime pluginu
- metadanych aliasów i automatycznego włączania, które powinny być rozstrzygane przed załadowaniem runtime pluginu
- metadanych własności skrótowych rodzin modeli, które powinny automatycznie aktywować
  plugin przed załadowaniem runtime
- statycznych migawek własności możliwości używanych do bundlowanego okablowania zgodności i pokrycia kontraktów
- metadanych konfiguracji specyficznych dla kanału, które powinny scalać się z powierzchniami katalogu i walidacji bez ładowania runtime
- podpowiedzi UI dla konfiguracji

Nie używaj go do:

- rejestrowania zachowania runtime
- deklarowania punktów wejścia kodu
- metadanych instalacji npm

To należy do kodu pluginu i `package.json`.

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
| `enabledByDefault`                  | Nie      | `true`                           | Oznacza bundlowany plugin jako domyślnie włączony. Pomiń to pole albo ustaw dowolną wartość inną niż `true`, aby pozostawić plugin domyślnie wyłączony.                                                   |
| `legacyPluginIds`                   | Nie      | `string[]`                       | Starsze identyfikatory, które są normalizowane do tego kanonicznego identyfikatora pluginu.                                                                                                                 |
| `autoEnableWhenConfiguredProviders` | Nie      | `string[]`                       | Identyfikatory dostawców, które powinny automatycznie włączać ten plugin, gdy uwierzytelnianie, konfiguracja lub odwołania do modeli o nich wspominają.                                                  |
| `kind`                              | Nie      | `"memory"` \| `"context-engine"` | Deklaruje wyłączny rodzaj pluginu używany przez `plugins.slots.*`.                                                                                                                                          |
| `channels`                          | Nie      | `string[]`                       | Identyfikatory kanałów należących do tego pluginu. Używane do wykrywania i walidacji konfiguracji.                                                                                                          |
| `providers`                         | Nie      | `string[]`                       | Identyfikatory dostawców należących do tego pluginu.                                                                                                                                                         |
| `modelSupport`                      | Nie      | `object`                         | Należące do manifestu skrótowe metadane rodzin modeli używane do automatycznego załadowania pluginu przed runtime.                                                                                         |
| `cliBackends`                       | Nie      | `string[]`                       | Identyfikatory backendów inferencji CLI należących do tego pluginu. Używane do automatycznej aktywacji przy uruchamianiu na podstawie jawnych odwołań w konfiguracji.                                     |
| `commandAliases`                    | Nie      | `object[]`                       | Nazwy poleceń należące do tego pluginu, które powinny generować diagnostykę konfiguracji i CLI uwzględniającą plugin przed załadowaniem runtime.                                                          |
| `providerAuthEnvVars`               | Nie      | `Record<string, string[]>`       | Lekkie metadane env uwierzytelniania dostawcy, które OpenClaw może sprawdzać bez ładowania kodu pluginu.                                                                                                    |
| `providerAuthAliases`               | Nie      | `Record<string, string>`         | Identyfikatory dostawców, które powinny używać ponownie innego identyfikatora dostawcy do wyszukiwania uwierzytelniania, na przykład dostawca do kodowania, który współdzieli klucz API i profile uwierzytelniania dostawcy bazowego. |
| `channelEnvVars`                    | Nie      | `Record<string, string[]>`       | Lekkie metadane env kanału, które OpenClaw może sprawdzać bez ładowania kodu pluginu. Używaj tego dla konfiguracji kanału sterowanej env lub powierzchni uwierzytelniania, które powinny być widoczne dla ogólnych pomocników uruchamiania/konfiguracji. |
| `providerAuthChoices`               | Nie      | `object[]`                       | Lekkie metadane wyboru uwierzytelniania dla selektorów onboardingu, rozstrzygania preferowanego dostawcy i prostego mapowania flag CLI.                                                                    |
| `contracts`                         | Nie      | `object`                         | Statyczna migawka bundlowanych możliwości dla speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search i własności narzędzi. |
| `channelConfigs`                    | Nie      | `Record<string, object>`         | Należące do manifestu metadane konfiguracji kanału scalane z powierzchniami wykrywania i walidacji przed załadowaniem runtime.                                                                             |
| `skills`                            | Nie      | `string[]`                       | Katalogi Skills do załadowania, względne względem katalogu głównego pluginu.                                                                                                                                |
| `name`                              | Nie      | `string`                         | Czytelna dla człowieka nazwa pluginu.                                                                                                                                                                        |
| `description`                       | Nie      | `string`                         | Krótkie podsumowanie wyświetlane na powierzchniach pluginu.                                                                                                                                                  |
| `version`                           | Nie      | `string`                         | Informacyjna wersja pluginu.                                                                                                                                                                                 |
| `uiHints`                           | Nie      | `Record<string, object>`         | Etykiety UI, placeholdery i wskazówki dotyczące wrażliwości dla pól konfiguracji.                                                                                                                           |

## Odniesienie do `providerAuthChoices`

Każdy wpis `providerAuthChoices` opisuje jeden wybór onboardingu lub uwierzytelniania.
OpenClaw odczytuje to przed załadowaniem runtime dostawcy.

| Pole                  | Wymagane | Typ                                             | Co oznacza                                                                                              |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Tak      | `string`                                        | Identyfikator dostawcy, do którego należy ten wybór.                                                    |
| `method`              | Tak      | `string`                                        | Identyfikator metody uwierzytelniania, do której należy przekierować.                                   |
| `choiceId`            | Tak      | `string`                                        | Stabilny identyfikator wyboru uwierzytelniania używany przez onboarding i przepływy CLI.               |
| `choiceLabel`         | Nie      | `string`                                        | Etykieta widoczna dla użytkownika. Jeśli zostanie pominięta, OpenClaw użyje `choiceId`.                |
| `choiceHint`          | Nie      | `string`                                        | Krótki tekst pomocniczy dla selektora.                                                                  |
| `assistantPriority`   | Nie      | `number`                                        | Niższe wartości są sortowane wcześniej w interaktywnych selektorach sterowanych przez asystenta.       |
| `assistantVisibility` | Nie      | `"visible"` \| `"manual-only"`                  | Ukrywa wybór przed selektorami asystenta, nadal pozwalając na ręczny wybór w CLI.                      |
| `deprecatedChoiceIds` | Nie      | `string[]`                                      | Starsze identyfikatory wyboru, które powinny przekierowywać użytkowników do tego zamiennego wyboru.    |
| `groupId`             | Nie      | `string`                                        | Opcjonalny identyfikator grupy do grupowania powiązanych wyborów.                                       |
| `groupLabel`          | Nie      | `string`                                        | Etykieta tej grupy widoczna dla użytkownika.                                                            |
| `groupHint`           | Nie      | `string`                                        | Krótki tekst pomocniczy dla grupy.                                                                      |
| `optionKey`           | Nie      | `string`                                        | Wewnętrzny klucz opcji dla prostych przepływów uwierzytelniania jedną flagą.                            |
| `cliFlag`             | Nie      | `string`                                        | Nazwa flagi CLI, na przykład `--openrouter-api-key`.                                                    |
| `cliOption`           | Nie      | `string`                                        | Pełna postać opcji CLI, na przykład `--openrouter-api-key <key>`.                                       |
| `cliDescription`      | Nie      | `string`                                        | Opis używany w pomocy CLI.                                                                              |
| `onboardingScopes`    | Nie      | `Array<"text-inference" \| "image-generation">` | Na których powierzchniach onboardingu ten wybór powinien się pojawiać. Jeśli zostanie pominięte, domyślnie używane jest `["text-inference"]`. |

## Odniesienie do `commandAliases`

Używaj `commandAliases`, gdy plugin posiada nazwę polecenia runtime, którą użytkownicy mogą
omyłkowo umieścić w `plugins.allow` albo próbować uruchomić jako główne polecenie CLI. OpenClaw
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

| Pole         | Wymagane | Typ               | Co oznacza                                                                   |
| ------------ | -------- | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | Tak      | `string`          | Nazwa polecenia należąca do tego pluginu.                                    |
| `kind`       | Nie      | `"runtime-slash"` | Oznacza alias jako polecenie ukośnikowe czatu, a nie główne polecenie CLI.   |
| `cliCommand` | Nie      | `string`          | Powiązane główne polecenie CLI do zasugerowania przy operacjach CLI, jeśli istnieje. |

## Odniesienie do `uiHints`

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

| Pole          | Typ        | Co oznacza                               |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Etykieta pola widoczna dla użytkownika.  |
| `help`        | `string`   | Krótki tekst pomocniczy.                 |
| `tags`        | `string[]` | Opcjonalne tagi UI.                      |
| `advanced`    | `boolean`  | Oznacza pole jako zaawansowane.          |
| `sensitive`   | `boolean`  | Oznacza pole jako sekretne lub wrażliwe. |
| `placeholder` | `string`   | Tekst zastępczy dla pól formularza.      |

## Odniesienie do `contracts`

Używaj `contracts` tylko dla statycznych metadanych własności możliwości, które OpenClaw może
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

| Pole                             | Typ        | Co oznacza                                                  |
| -------------------------------- | ---------- | ----------------------------------------------------------- |
| `speechProviders`                | `string[]` | Identyfikatory dostawców speech należące do tego pluginu.   |
| `realtimeTranscriptionProviders` | `string[]` | Identyfikatory dostawców realtime-transcription należące do tego pluginu. |
| `realtimeVoiceProviders`         | `string[]` | Identyfikatory dostawców realtime voice należące do tego pluginu. |
| `mediaUnderstandingProviders`    | `string[]` | Identyfikatory dostawców media-understanding należące do tego pluginu. |
| `imageGenerationProviders`       | `string[]` | Identyfikatory dostawców image-generation należące do tego pluginu. |
| `videoGenerationProviders`       | `string[]` | Identyfikatory dostawców video-generation należące do tego pluginu. |
| `webFetchProviders`              | `string[]` | Identyfikatory dostawców web-fetch należące do tego pluginu. |
| `webSearchProviders`             | `string[]` | Identyfikatory dostawców web search należące do tego pluginu. |
| `tools`                          | `string[]` | Nazwy narzędzi agenta należące do tego pluginu dla bundlowanych kontroli kontraktów. |

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
| `schema`      | `object`                 | Schemat JSON dla `channels.<id>`. Wymagany dla każdego zadeklarowanego wpisu konfiguracji kanału. |
| `uiHints`     | `Record<string, object>` | Opcjonalne etykiety UI/placeholdery/wskazówki wrażliwości dla tej sekcji konfiguracji kanału. |
| `label`       | `string`                 | Etykieta kanału scalana z powierzchniami selektora i inspekcji, gdy metadane runtime nie są gotowe. |
| `description` | `string`                 | Krótki opis kanału dla powierzchni inspekcji i katalogu.                                   |
| `preferOver`  | `string[]`               | Starsze lub mniej priorytetowe identyfikatory pluginów, które ten kanał powinien wyprzedzać na powierzchniach wyboru. |

## Odniesienie do `modelSupport`

Używaj `modelSupport`, gdy OpenClaw powinien wnioskować o Twoim pluginie dostawcy na podstawie
skrótowych identyfikatorów modeli takich jak `gpt-5.4` lub `claude-sonnet-4.6` przed załadowaniem runtime pluginu.

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
- jeśli pasuje jednocześnie jeden plugin niebundlowany i jeden bundlowany,
  wygrywa plugin niebundlowany
- pozostała niejednoznaczność jest ignorowana, dopóki użytkownik lub konfiguracja nie określi dostawcy

Pola:

| Pole            | Typ        | Co oznacza                                                                    |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiksy dopasowywane przez `startsWith` do skrótowych identyfikatorów modeli. |
| `modelPatterns` | `string[]` | Źródła regex dopasowywane do skrótowych identyfikatorów modeli po usunięciu sufiksu profilu. |

Starsze klucze możliwości na najwyższym poziomie są przestarzałe. Użyj `openclaw doctor --fix`, aby
przenieść `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` i `webSearchProviders` do `contracts`; zwykłe
ładowanie manifestu nie traktuje już tych pól najwyższego poziomu jako
własności możliwości.

## Manifest a package.json

Te dwa pliki pełnią różne role:

| Plik                   | Używaj go do                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Wykrywania, walidacji konfiguracji, metadanych wyboru uwierzytelniania i wskazówek UI, które muszą istnieć przed uruchomieniem kodu pluginu |
| `package.json`         | Metadanych npm, instalacji zależności oraz bloku `openclaw` używanego dla punktów wejścia, blokowania instalacji, konfiguracji lub metadanych katalogu |

Jeśli nie masz pewności, gdzie powinien trafić dany element metadanych, użyj tej zasady:

- jeśli OpenClaw musi znać go przed załadowaniem kodu pluginu, umieść go w `openclaw.plugin.json`
- jeśli dotyczy pakowania, plików wejściowych lub zachowania instalacji npm, umieść go w `package.json`

### Pola `package.json`, które wpływają na wykrywanie

Niektóre metadane pluginu sprzed uruchomienia celowo znajdują się w `package.json` w bloku
`openclaw`, a nie w `openclaw.plugin.json`.

Ważne przykłady:

| Pole                                                              | Co oznacza                                                                                                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklaruje natywne punkty wejścia pluginu.                                                                                                     |
| `openclaw.setupEntry`                                             | Lekki punkt wejścia tylko do konfiguracji używany podczas onboardingu i odroczonego uruchamiania kanału.                                     |
| `openclaw.channel`                                                | Lekkie metadane katalogu kanałów, takie jak etykiety, ścieżki dokumentacji, aliasy i teksty wyboru.                                         |
| `openclaw.channel.configuredState`                                | Lekkie metadane sprawdzania stanu konfiguracji, które mogą odpowiedzieć na pytanie „czy konfiguracja tylko przez env już istnieje?” bez ładowania pełnego runtime kanału. |
| `openclaw.channel.persistedAuthState`                             | Lekkie metadane sprawdzania trwałego stanu uwierzytelnienia, które mogą odpowiedzieć na pytanie „czy coś jest już zalogowane?” bez ładowania pełnego runtime kanału. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Wskazówki instalacji/aktualizacji dla pluginów bundlowanych i publikowanych zewnętrznie.                                                    |
| `openclaw.install.defaultChoice`                                  | Preferowana ścieżka instalacji, gdy dostępnych jest wiele źródeł instalacji.                                                                |
| `openclaw.install.minHostVersion`                                 | Minimalna obsługiwana wersja hosta OpenClaw, używająca dolnej granicy semver, takiej jak `>=2026.3.22`.                                     |
| `openclaw.install.allowInvalidConfigRecovery`                     | Pozwala na wąską ścieżkę odzyskiwania przez ponowną instalację bundlowanego pluginu, gdy konfiguracja jest nieprawidłowa.                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Pozwala ładować powierzchnie kanału tylko do konfiguracji przed pełnym pluginem kanału podczas uruchamiania.                                |

`openclaw.install.minHostVersion` jest egzekwowane podczas instalacji i
ładowania rejestru manifestów. Nieprawidłowe wartości są odrzucane; nowsze, ale
prawidłowe wartości powodują pominięcie pluginu na starszych hostach.

`openclaw.install.allowInvalidConfigRecovery` jest celowo wąskie. Nie sprawia,
że dowolne uszkodzone konfiguracje stają się możliwe do zainstalowania. Obecnie
pozwala tylko przepływom instalacji odzyskać stan po konkretnych nieaktualnych
błędach aktualizacji bundlowanych pluginów, takich jak brakująca ścieżka
bundlowanego pluginu albo nieaktualny wpis `channels.<id>` dla tego samego
bundlowanego pluginu. Niezwiązane błędy konfiguracji nadal blokują instalację i
kierują operatorów do `openclaw doctor --fix`.

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

Używaj tego, gdy konfiguracja, doctor albo przepływy stanu konfiguracji
potrzebują taniego sprawdzenia uwierzytelnienia typu tak/nie przed załadowaniem
pełnego pluginu kanału. Docelowy eksport powinien być małą funkcją, która tylko
odczytuje stan trwały; nie prowadź do niego przez pełny barrel runtime kanału.

`openclaw.channel.configuredState` ma taki sam kształt dla tanich kontroli
skonfigurowania tylko przez env:

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
wejść niezwiązanych z runtime. Jeśli sprawdzenie wymaga pełnego rozstrzygania konfiguracji lub
rzeczywistego runtime kanału, zachowaj tę logikę w hooku pluginu `config.hasConfiguredState`.

## Wymagania schematu JSON

- **Każdy plugin musi dostarczać schemat JSON**, nawet jeśli nie przyjmuje żadnej konfiguracji.
- Pusty schemat jest akceptowalny (na przykład `{ "type": "object", "additionalProperties": false }`).
- Schematy są walidowane podczas odczytu/zapisu konfiguracji, a nie w runtime.

## Zachowanie walidacji

- Nieznane klucze `channels.*` są **błędami**, chyba że identyfikator kanału został zadeklarowany przez
  manifest pluginu.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` i `plugins.slots.*`
  muszą wskazywać **wykrywalne** identyfikatory pluginów. Nieznane identyfikatory są **błędami**.
- Jeśli plugin jest zainstalowany, ale ma uszkodzony lub brakujący manifest albo schemat,
  walidacja kończy się niepowodzeniem, a Doctor zgłasza błąd pluginu.
- Jeśli konfiguracja pluginu istnieje, ale plugin jest **wyłączony**, konfiguracja jest zachowywana i
  zgłaszane jest **ostrzeżenie** w Doctor + logach.

Pełny schemat `plugins.*` znajdziesz w [Odniesieniu do konfiguracji](/pl/gateway/configuration).

## Uwagi

- Manifest jest **wymagany dla natywnych pluginów OpenClaw**, w tym ładowanych z lokalnego systemu plików.
- Runtime nadal ładuje moduł pluginu osobno; manifest służy wyłącznie do
  wykrywania + walidacji.
- Natywne manifesty są parsowane przez JSON5, więc komentarze, końcowe przecinki i
  nieujęte w cudzysłów klucze są akceptowane, o ile końcowa wartość nadal jest obiektem.
- Ładowarka manifestu odczytuje tylko udokumentowane pola manifestu. Unikaj dodawania
  tutaj własnych kluczy najwyższego poziomu.
- `providerAuthEnvVars` to tania ścieżka metadanych dla sprawdzania uwierzytelnienia, walidacji znaczników env
  i podobnych powierzchni uwierzytelniania dostawców, które nie powinny uruchamiać runtime pluginu
  tylko po to, aby sprawdzić nazwy env.
- `providerAuthAliases` pozwala wariantom dostawców ponownie używać env vars uwierzytelniania,
  profili uwierzytelniania, uwierzytelniania opartego na konfiguracji i wyboru onboardingu klucza API innego dostawcy
  bez zakodowywania tej relacji na sztywno w rdzeniu.
- `channelEnvVars` to tania ścieżka metadanych dla fallbacku env powłoki, promptów konfiguracji
  i podobnych powierzchni kanałów, które nie powinny uruchamiać runtime pluginu
  tylko po to, aby sprawdzić nazwy env.
- `providerAuthChoices` to tania ścieżka metadanych dla selektorów wyboru uwierzytelniania,
  rozstrzygania `--auth-choice`, mapowania preferowanego dostawcy i prostego rejestrowania
  flag CLI onboardingu przed załadowaniem runtime dostawcy. Metadane kreatora runtime,
  które wymagają kodu dostawcy, opisano w
  [Hookach runtime dostawcy](/pl/plugins/architecture#provider-runtime-hooks).
- Wyłączne rodzaje pluginów są wybierane przez `plugins.slots.*`.
  - `kind: "memory"` jest wybierane przez `plugins.slots.memory`.
  - `kind: "context-engine"` jest wybierane przez `plugins.slots.contextEngine`
    (domyślnie: wbudowane `legacy`).
- `channels`, `providers`, `cliBackends` i `skills` można pominąć, gdy
  plugin ich nie potrzebuje.
- Jeśli Twój plugin zależy od modułów natywnych, udokumentuj kroki budowania i wszelkie
  wymagania dotyczące listy dozwolonych menedżera pakietów (na przykład pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins) — wprowadzenie do pluginów
- [Architektura pluginów](/pl/plugins/architecture) — architektura wewnętrzna
- [Przegląd SDK](/pl/plugins/sdk-overview) — odniesienie do Plugin SDK
