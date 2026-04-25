---
read_when:
    - Dodajesz kreator konfiguracji do Pluginu
    - Musisz zrozumieć `setup-entry.ts` vs `index.ts`
    - Definiujesz schematy konfiguracji Plugin lub metadane `openclaw` w `package.json`
sidebarTitle: Setup and Config
summary: Kreatory konfiguracji, `setup-entry.ts`, schematy konfiguracji i metadane `package.json`
title: Konfiguracja i setup Plugin
x-i18n:
    generated_at: "2026-04-25T13:55:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 487cff34e0f9ae307a7c920dfc3cb0a8bbf2cac5e137abd8be4d1fbed19200ca
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Dokumentacja referencyjna pakowania Plugin (`package.json` metadata), manifestów
(`openclaw.plugin.json`), wpisów setup i schematów konfiguracji.

<Tip>
  **Szukasz przewodnika krok po kroku?** Przewodniki how-to omawiają pakowanie w kontekście:
  [Channel Plugins](/pl/plugins/sdk-channel-plugins#step-1-package-and-manifest) oraz
  [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadane pakietu

Twój `package.json` potrzebuje pola `openclaw`, które mówi systemowi Plugin, co
udostępnia Twój Plugin:

**Plugin kanału:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Plugin providera / bazowy poziom publikacji ClawHub:**

```json openclaw-clawhub-package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Jeśli publikujesz Plugin zewnętrznie w ClawHub, pola `compat` i `build`
są wymagane. Kanoniczne snippety publikacji znajdują się w
`docs/snippets/plugin-publish/`.

### Pola `openclaw`

| Pole         | Typ        | Opis                                                                                                                |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Pliki punktów wejścia (względem katalogu głównego pakietu)                                                         |
| `setupEntry` | `string`   | Lekki wpis tylko do konfiguracji (opcjonalny)                                                                      |
| `channel`    | `object`   | Metadane katalogu kanału dla powierzchni setup, selektora, quickstart i statusu                                   |
| `providers`  | `string[]` | Identyfikatory providerów zarejestrowanych przez ten Plugin                                                         |
| `install`    | `object`   | Wskazówki instalacji: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flagi zachowania przy starcie                                                                                       |

### `openclaw.channel`

`openclaw.channel` to tanie metadane pakietu dla wykrywania kanału i powierzchni
setup przed załadowaniem runtime.

| Pole                                   | Typ        | Znaczenie                                                                    |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanoniczny identyfikator kanału.                                             |
| `label`                                | `string`   | Główna etykieta kanału.                                                      |
| `selectionLabel`                       | `string`   | Etykieta selektora/setup, gdy powinna różnić się od `label`.                 |
| `detailLabel`                          | `string`   | Drugorzędna etykieta szczegółowa dla bogatszych katalogów kanałów i powierzchni statusu. |
| `docsPath`                             | `string`   | Ścieżka dokumentacji dla linków setup i wyboru.                              |
| `docsLabel`                            | `string`   | Nadpisuje etykietę używaną dla linków do dokumentacji, gdy powinna różnić się od identyfikatora kanału. |
| `blurb`                                | `string`   | Krótki opis onboardingowy/katalogowy.                                        |
| `order`                                | `number`   | Kolejność sortowania w katalogach kanałów.                                   |
| `aliases`                              | `string[]` | Dodatkowe aliasy wyszukiwania dla wyboru kanału.                             |
| `preferOver`                           | `string[]` | Identyfikatory Plugin/kanałów o niższym priorytecie, które ten kanał powinien wyprzedzać. |
| `systemImage`                          | `string`   | Opcjonalna nazwa ikony/system-image dla katalogów UI kanałów.                |
| `selectionDocsPrefix`                  | `string`   | Tekst prefiksu przed linkami do dokumentacji na powierzchniach wyboru.       |
| `selectionDocsOmitLabel`               | `boolean`  | Pokazuje ścieżkę dokumentacji bezpośrednio zamiast oznaczonego linku do dokumentacji w tekście wyboru. |
| `selectionExtras`                      | `string[]` | Dodatkowe krótkie ciągi dołączane w tekście wyboru.                          |
| `markdownCapable`                      | `boolean`  | Oznacza kanał jako zdolny do markdown dla decyzji formatowania wychodzącego. |
| `exposure`                             | `object`   | Kontrolki widoczności kanału dla setup, list skonfigurowanych i powierzchni dokumentacji. |
| `quickstartAllowFrom`                  | `boolean`  | Włącza ten kanał do standardowego przepływu setup `allowFrom` w quickstart.  |
| `forceAccountBinding`                  | `boolean`  | Wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferuje wyszukiwanie sesji przy rozwiązywaniu celów announce dla tego kanału. |

Przykład:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` obsługuje:

- `configured`: uwzględnia kanał na powierzchniach listowania w stylu configured/status
- `setup`: uwzględnia kanał w interaktywnych selektorach setup/configure
- `docs`: oznacza kanał jako publicznie widoczny na powierzchniach dokumentacji/nawigacji

`showConfigured` i `showInSetup` pozostają obsługiwane jako starsze aliasy. Preferuj
`exposure`.

### `openclaw.install`

`openclaw.install` to metadane pakietu, a nie metadane manifestu.

| Pole                         | Typ                  | Znaczenie                                                                        |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanoniczny spec npm dla przepływów instalacji/aktualizacji.                      |
| `localPath`                  | `string`             | Lokalna ścieżka instalacji deweloperskiej lub dołączonej.                        |
| `defaultChoice`              | `"npm"` \| `"local"` | Preferowane źródło instalacji, gdy dostępne są oba.                              |
| `minHostVersion`             | `string`             | Minimalna obsługiwana wersja OpenClaw w postaci `>=x.y.z`.                       |
| `expectedIntegrity`          | `string`             | Oczekiwany ciąg integralności npm dist, zwykle `sha512-...`, dla przypiętych instalacji. |
| `allowInvalidConfigRecovery` | `boolean`            | Pozwala przepływom ponownej instalacji dołączonych Plugin odzyskać stan po określonych błędach nieaktualnej konfiguracji. |

Interaktywny onboarding używa też `openclaw.install` dla powierzchni instalacji na żądanie.
Jeśli Twój Plugin ujawnia wybory auth providera albo metadane setup/katalogu kanału przed załadowaniem runtime, onboarding może pokazać ten wybór, zapytać o instalację npm vs lokalną, zainstalować lub włączyć Plugin, a następnie kontynuować wybrany
przepływ. Wybory onboardingu npm wymagają zaufanych metadanych katalogu ze
źródłem rejestru `npmSpec`; dokładne wersje i `expectedIntegrity` są opcjonalnymi przypięciami. Jeśli
obecne jest `expectedIntegrity`, przepływy instalacji/aktualizacji je egzekwują. Utrzymuj
metadane „co pokazać” w `openclaw.plugin.json`, a metadane „jak to zainstalować”
w `package.json`.

Jeśli ustawiono `minHostVersion`, zarówno instalacja, jak i ładowanie rejestru manifestów egzekwują
to ograniczenie. Starsze hosty pomijają Plugin; nieprawidłowe ciągi wersji są odrzucane.

Dla przypiętych instalacji npm zachowuj dokładną wersję w `npmSpec` i dodawaj
oczekiwaną integralność artefaktu:

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery` nie jest ogólnym obejściem dla zepsutych konfiguracji. Jest
przeznaczone wyłącznie do wąskiego odzyskiwania dla dołączonych Plugin, aby ponowna instalacja/setup
mogły naprawić znane pozostałości po aktualizacji, takie jak brakująca ścieżka dołączonego Plugin albo
nieaktualny wpis `channels.<id>` dla tego samego Plugin. Jeśli konfiguracja jest zepsuta z
niepowiązanych powodów, instalacja nadal kończy się bezpiecznym błędem i nakazuje operatorowi uruchomić `openclaw doctor --fix`.

### Odroczone pełne ładowanie

Pluginy kanałowe mogą włączyć odroczone ładowanie przez:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Po włączeniu OpenClaw ładuje tylko `setupEntry` podczas fazy startowej
przed listen, nawet dla już skonfigurowanych kanałów. Pełny wpis ładowany jest po
rozpoczęciu nasłuchiwania przez gateway.

<Warning>
  Włączaj odroczone ładowanie tylko wtedy, gdy `setupEntry` rejestruje wszystko, czego
  gateway potrzebuje przed rozpoczęciem nasłuchiwania (rejestracja kanału, trasy HTTP,
  metody gateway). Jeśli pełny wpis jest właścicielem wymaganych możliwości startowych, zachowaj
  zachowanie domyślne.
</Warning>

Jeśli Twój wpis setup/pełny wpis rejestruje metody RPC gateway, trzymaj je na
prefiksie specyficznym dla Plugin. Zarezerwowane przestrzenie nazw administracyjnych rdzenia (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają własnością rdzenia i zawsze rozwiązują się
do `operator.admin`.

## Manifest Plugin

Każdy natywny Plugin musi dostarczać `openclaw.plugin.json` w katalogu głównym pakietu.
OpenClaw używa tego do walidacji konfiguracji bez wykonywania kodu Plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Dla Plugin kanałowych dodaj `kind` i `channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Nawet Pluginy bez konfiguracji muszą dostarczać schemat. Pusty schemat jest prawidłowy:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Pełna dokumentacja schematu: [Plugin Manifest](/pl/plugins/manifest).

## Publikowanie ClawHub

Dla pakietów Plugin używaj polecenia ClawHub specyficznego dla pakietów:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Starszy alias publikacji tylko dla Skills jest przeznaczony dla Skills. Pakiety Plugin powinny
zawsze używać `clawhub package publish`.

## Wpis setup

Plik `setup-entry.ts` to lekka alternatywa dla `index.ts`, którą
OpenClaw ładuje, gdy potrzebuje tylko powierzchni setup (onboarding, naprawa konfiguracji,
inspekcja wyłączonego kanału).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dzięki temu podczas przepływów setup nie trzeba ładować ciężkiego kodu runtime (bibliotek crypto, rejestracji CLI,
usług w tle).

Dołączone kanały obszaru roboczego, które trzymają bezpieczne dla setup eksporty w modułach sidecar, mogą
używać `defineBundledChannelSetupEntry(...)` z
`openclaw/plugin-sdk/channel-entry-contract` zamiast
`defineSetupPluginEntry(...)`. Ten dołączony kontrakt obsługuje także opcjonalny
eksport `runtime`, dzięki czemu okablowanie runtime w czasie setup może pozostać lekkie i jawne.

**Kiedy OpenClaw używa `setupEntry` zamiast pełnego wpisu:**

- Kanał jest wyłączony, ale potrzebuje powierzchni setup/onboardingu
- Kanał jest włączony, ale nieskonfigurowany
- Włączone jest odroczone ładowanie (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Co `setupEntry` musi zarejestrować:**

- Obiekt Plugin kanału (przez `defineSetupPluginEntry`)
- Wszelkie trasy HTTP wymagane przed listen gateway
- Wszelkie metody gateway potrzebne podczas startu

Te startowe metody gateway nadal powinny unikać zarezerwowanych przestrzeni nazw administracyjnych rdzenia,
takich jak `config.*` albo `update.*`.

**Czego `setupEntry` NIE powinno zawierać:**

- Rejestracji CLI
- Usług w tle
- Ciężkich importów runtime (crypto, SDK)
- Metod gateway potrzebnych dopiero po starcie

### Wąskie importy helperów setup

Dla gorących ścieżek tylko-setup preferuj wąskie seamy helperów setup zamiast szerszego
zbiorczego `plugin-sdk/setup`, gdy potrzebujesz tylko części powierzchni setup:

| Ścieżka importu                    | Używaj do                                                                                  | Kluczowe eksporty                                                                                                                                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helperów runtime czasu setup, które pozostają dostępne w `setupEntry` / odroczonym starcie kanału | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapterów setup kont świadomych środowiska                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                           |
| `plugin-sdk/setup-tools`           | helperów CLI/instalacji/archiwów/dokumentacji dla setup                                     | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                 |

Używaj szerszego seamu `plugin-sdk/setup`, gdy chcesz pełnej współdzielonej skrzynki narzędzi setup,
w tym helperów patchowania konfiguracji, takich jak
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adaptery patchy setup pozostają bezpieczne dla gorącej ścieżki przy imporcie. Ich dołączone
wyszukiwanie powierzchni kontraktu promocji jednokontowej jest leniwe, więc import
`plugin-sdk/setup-runtime` nie ładuje zachłannie wykrywania powierzchni kontraktu dołączonych kanałów, zanim
adapter zostanie rzeczywiście użyty.

### Promocja jednokontowa należąca do kanału

Gdy kanał przechodzi z jednokontowej konfiguracji najwyższego poziomu do
`channels.<id>.accounts.*`, domyślne współdzielone zachowanie polega na przeniesieniu
wartości o zakresie promowanego konta do `accounts.default`.

Dołączone kanały mogą zawężać albo nadpisywać tę promocję przez swoją powierzchnię kontraktu setup:

- `singleAccountKeysToMove`: dodatkowe klucze najwyższego poziomu, które powinny zostać przeniesione do
  promowanego konta
- `namedAccountPromotionKeys`: gdy nazwane konta już istnieją, tylko te
  klucze trafiają do promowanego konta; współdzielone klucze polityki/dostarczenia pozostają przy katalogu głównym kanału
- `resolveSingleAccountPromotionTarget(...)`: wybiera, które istniejące konto
  otrzyma promowane wartości

Matrix jest obecnym dołączonym przykładem. Jeśli istnieje dokładnie jedno nazwane konto Matrix
albo `defaultAccount` wskazuje istniejący niekanoniczny klucz,
taki jak `Ops`, promocja zachowuje to konto zamiast tworzyć nowe
`accounts.default`.

## Schemat konfiguracji

Konfiguracja Plugin jest walidowana względem JSON Schema w manifeście. Użytkownicy
konfigurują Pluginy przez:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Twój Plugin otrzymuje tę konfigurację jako `api.pluginConfig` podczas rejestracji.

Dla konfiguracji specyficznej dla kanału użyj zamiast tego sekcji konfiguracji kanału:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Budowanie schematów konfiguracji kanału

Użyj `buildChannelConfigSchema`, aby przekonwertować schemat Zod do
wrappera `ChannelConfigSchema` używanego przez artefakty konfiguracji należące do Plugin:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

Dla Plugin stron trzecich zimnym kontraktem ścieżki pozostaje manifest Plugin:
odzwierciedl wygenerowany JSON Schema do `openclaw.plugin.json#channelConfigs`, aby
schemat konfiguracji, setup i powierzchnie UI mogły sprawdzać `channels.<id>` bez
ładowania kodu runtime.

## Kreatory setup

Pluginy kanałowe mogą udostępniać interaktywne kreatory setup dla `openclaw onboard`.
Kreator to obiekt `ChannelSetupWizard` w `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

Typ `ChannelSetupWizard` obsługuje `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` i inne.
Pełne przykłady znajdziesz w pakietach dołączonych Plugin (na przykład w Pluginie Discord `src/channel.setup.ts`).

Dla promptów allowlisty DM, które potrzebują tylko standardowego przepływu
`note -> prompt -> parse -> merge -> patch`, preferuj współdzielone helpery setup
z `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` oraz
`createNestedChannelParsedAllowFromPrompt(...)`.

Dla bloków statusu setup kanału, które różnią się tylko etykietami, wynikami i opcjonalnymi
dodatkowymi liniami, preferuj `createStandardChannelSetupStatus(...)` z
`openclaw/plugin-sdk/setup` zamiast ręcznie tworzyć ten sam obiekt `status` w
każdym Pluginie.

Dla opcjonalnych powierzchni setup, które powinny pojawiać się tylko w określonych kontekstach, użyj
`createOptionalChannelSetupSurface` z `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` udostępnia także niższego poziomu konstruktory
`createOptionalChannelSetupAdapter(...)` oraz
`createOptionalChannelSetupWizard(...)`, gdy potrzebujesz tylko połowy
tej powierzchni opcjonalnej instalacji.

Wygenerowany opcjonalny adapter/kreator kończy się bezpieczną odmową przy rzeczywistych zapisach konfiguracji. Ponownie używa jednego komunikatu o wymaganej instalacji w `validateInput`,
`applyAccountConfig` i `finalize`, a także dołącza link do dokumentacji, gdy ustawiono `docsPath`.

Dla UI setup opartych na binarkach preferuj współdzielone helpery delegowane zamiast
kopiować to samo klejenie binarki/statusu do każdego kanału:

- `createDetectedBinaryStatus(...)` dla bloków statusu różniących się tylko etykietami,
  wskazówkami, wynikami i wykrywaniem binarek
- `createCliPathTextInput(...)` dla wejść tekstowych opartych na ścieżce
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` oraz
  `createDelegatedResolveConfigured(...)`, gdy `setupEntry` musi leniwie przekazywać dalej do
  cięższego pełnego kreatora
- `createDelegatedTextInputShouldPrompt(...)`, gdy `setupEntry` musi tylko
  delegować decyzję `textInputs[*].shouldPrompt`

## Publikowanie i instalowanie

**Pluginy zewnętrzne:** publikuj do [ClawHub](/pl/tools/clawhub) albo npm, a następnie instaluj:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw najpierw próbuje ClawHub, a następnie automatycznie wraca do npm. Możesz też
jawnie wymusić ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # tylko ClawHub
```

Nie ma odpowiadającego nadpisania `npm:`. Użyj zwykłego specyfikatora pakietu npm, gdy
chcesz ścieżki npm po fallbacku ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Pluginy w repo:** umieść pod drzewem obszaru roboczego dołączonych Plugin, a będą automatycznie
wykrywane podczas builda.

**Użytkownicy mogą instalować:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Dla instalacji pochodzących z npm `openclaw plugins install` uruchamia
  `npm install --ignore-scripts` (bez skryptów cyklu życia). Utrzymuj drzewo zależności Plugin
  jako czyste JS/TS i unikaj pakietów wymagających buildów `postinstall`.
</Info>

Dołączone Pluginy należące do OpenClaw są jedynym wyjątkiem naprawy przy starcie: gdy
spakowana instalacja widzi taki Plugin włączony przez konfigurację Plugin, starszą konfigurację kanału albo
jego dołączony manifest domyślnie włączony, start instaluje brakujące zależności runtime tego Plugin przed importem. Pluginy stron trzecich nie powinny polegać na
instalacjach przy starcie; nadal używaj jawnego instalatora Plugin.

## Powiązane

- [SDK entry points](/pl/plugins/sdk-entrypoints) — `definePluginEntry` i `defineChannelPluginEntry`
- [Plugin manifest](/pl/plugins/manifest) — pełna dokumentacja referencyjna schematu manifestu
- [Building plugins](/pl/plugins/building-plugins) — przewodnik krok po kroku na start
