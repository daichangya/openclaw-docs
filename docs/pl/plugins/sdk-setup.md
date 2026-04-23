---
read_when:
    - Dodajesz kreator konfiguracji do Pluginu
    - Musisz zrozumieć różnicę między `setup-entry.ts` a `index.ts`
    - Definiujesz schematy konfiguracji Pluginu lub metadane `openclaw` w `package.json`
sidebarTitle: Setup and Config
summary: Kreatory konfiguracji, `setup-entry.ts`, schematy konfiguracji i metadane `package.json`
title: Konfiguracja i ustawienia Pluginu
x-i18n:
    generated_at: "2026-04-23T10:05:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 110cf9aa1bfaeb286d38963cfba2006502e853dd603a126d1c179cbc9b60aea1
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Konfiguracja i ustawienia Pluginu

Dokumentacja pakowania Pluginu (metadane `package.json`), manifestów
(`openclaw.plugin.json`), wpisów konfiguracji i schematów konfiguracji.

<Tip>
  **Szukasz przewodnika krok po kroku?** Instrukcje pokazują pakowanie w kontekście:
  [Pluginy kanałów](/pl/plugins/sdk-channel-plugins#step-1-package-and-manifest) i
  [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadane pakietu

Twój `package.json` potrzebuje pola `openclaw`, które mówi systemowi Pluginów, co
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

**Plugin dostawcy / punkt odniesienia dla publikacji w ClawHub:**

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
są wymagane. Kanoniczne fragmenty publikacji znajdują się w
`docs/snippets/plugin-publish/`.

### Pola `openclaw`

| Pole         | Typ        | Opis                                                                                                                     |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | Pliki punktów wejścia (względem root pakietu)                                                                            |
| `setupEntry` | `string`   | Lekki wpis tylko do konfiguracji (opcjonalny)                                                                            |
| `channel`    | `object`   | Metadane katalogu kanałów dla powierzchni konfiguracji, wybieraka, szybkiego startu i statusu                           |
| `providers`  | `string[]` | Identyfikatory dostawców rejestrowane przez ten Plugin                                                                   |
| `install`    | `object`   | Wskazówki instalacji: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flagi zachowania przy starcie                                                                                            |

### `openclaw.channel`

`openclaw.channel` to tanie metadane pakietu do wykrywania kanałów i powierzchni konfiguracji
jeszcze przed załadowaniem runtime.

| Pole                                   | Typ        | Znaczenie                                                                     |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanoniczny identyfikator kanału.                                              |
| `label`                                | `string`   | Główna etykieta kanału.                                                       |
| `selectionLabel`                       | `string`   | Etykieta w wybieraku/konfiguracji, gdy powinna różnić się od `label`.         |
| `detailLabel`                          | `string`   | Dodatkowa etykieta szczegółowa dla bogatszych katalogów kanałów i powierzchni statusu. |
| `docsPath`                             | `string`   | Ścieżka dokumentacji dla linków konfiguracji i wyboru.                        |
| `docsLabel`                            | `string`   | Nadpisuje etykietę używaną w linkach do dokumentacji, gdy powinna różnić się od identyfikatora kanału. |
| `blurb`                                | `string`   | Krótki opis do onboardingu/katalogu.                                          |
| `order`                                | `number`   | Kolejność sortowania w katalogach kanałów.                                    |
| `aliases`                              | `string[]` | Dodatkowe aliasy wyszukiwania dla wyboru kanału.                              |
| `preferOver`                           | `string[]` | Identyfikatory Pluginów/kanałów o niższym priorytecie, które ten kanał ma wyprzedzać. |
| `systemImage`                          | `string`   | Opcjonalna nazwa ikony/system-image dla katalogów UI kanałów.                 |
| `selectionDocsPrefix`                  | `string`   | Tekst prefiksu przed linkami do dokumentacji na powierzchniach wyboru.        |
| `selectionDocsOmitLabel`               | `boolean`  | Pokazuje bezpośrednio ścieżkę dokumentacji zamiast opisanego linku do dokumentacji w treści wyboru. |
| `selectionExtras`                      | `string[]` | Dodatkowe krótkie ciągi dołączane w treści wyboru.                            |
| `markdownCapable`                      | `boolean`  | Oznacza kanał jako obsługujący Markdown dla decyzji o formatowaniu wychodzącym. |
| `exposure`                             | `object`   | Kontrolki widoczności kanału dla konfiguracji, list skonfigurowanych i powierzchni dokumentacji. |
| `quickstartAllowFrom`                  | `boolean`  | Włącza ten kanał do standardowego przepływu konfiguracji `allowFrom` w szybkim starcie. |
| `forceAccountBinding`                  | `boolean`  | Wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto.  |
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

- `configured`: uwzględnij kanał na powierzchniach listowania w stylu configured/status
- `setup`: uwzględnij kanał w interaktywnych wybierakach setup/configure
- `docs`: oznacz kanał jako skierowany publicznie na powierzchniach dokumentacji/nawigacji

`showConfigured` i `showInSetup` pozostają obsługiwane jako starsze aliasy. Preferuj
`exposure`.

### `openclaw.install`

`openclaw.install` to metadane pakietu, a nie metadane manifestu.

| Pole                         | Typ                  | Znaczenie                                                                        |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanoniczna specyfikacja npm dla przepływów install/update.                       |
| `localPath`                  | `string`             | Lokalna ścieżka instalacji deweloperskiej lub bundled.                           |
| `defaultChoice`              | `"npm"` \| `"local"` | Preferowane źródło instalacji, gdy oba są dostępne.                              |
| `minHostVersion`             | `string`             | Minimalna obsługiwana wersja OpenClaw w postaci `>=x.y.z`.                       |
| `expectedIntegrity`          | `string`             | Oczekiwany ciąg integralności dist npm, zwykle `sha512-...`, dla przypiętych instalacji. |
| `allowInvalidConfigRecovery` | `boolean`            | Pozwala przepływom reinstalacji bundled Pluginów odzyskiwać stan po określonych błędach przestarzałej konfiguracji. |

Interaktywny onboarding również używa `openclaw.install` na powierzchniach
instalacji na żądanie. Jeśli Twój Plugin udostępnia wybory uwierzytelniania dostawcy lub metadane konfiguracji/katalogu kanału przed załadowaniem runtime, onboarding może pokazać ten wybór, zapytać o instalację npm czy lokalną, zainstalować lub włączyć Plugin, a następnie kontynuować wybrany
przepływ. Wybory npm w onboardingu wymagają zaufanych metadanych katalogu z rejestrową
specyfikacją `npmSpec`; dokładne wersje i `expectedIntegrity` są opcjonalnymi przypięciami. Jeśli
`expectedIntegrity` jest obecne, przepływy instalacji/aktualizacji wymuszają je. Metadane „co
pokazać” trzymaj w `openclaw.plugin.json`, a metadane „jak to zainstalować”
w `package.json`.

Jeśli ustawiono `minHostVersion`, wymuszają je zarówno instalacja, jak i ładowanie rejestru manifestów.
Starsze hosty pomijają Plugin; nieprawidłowe ciągi wersji są odrzucane.

Dla przypiętych instalacji npm zachowaj dokładną wersję w `npmSpec` i dodaj
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

`allowInvalidConfigRecovery` nie jest ogólnym obejściem dla uszkodzonych konfiguracji. Służy
tylko do wąskiego odzyskiwania bundled Pluginów, tak aby reinstalacja/konfiguracja mogła naprawić znane pozostałości po aktualizacji, takie jak brakująca ścieżka bundled Pluginu lub przestarzały wpis `channels.<id>`
dla tego samego Pluginu. Jeśli konfiguracja jest uszkodzona z niepowiązanych powodów, instalacja
nadal kończy się trybem fail-closed i mówi operatorowi, by uruchomił `openclaw doctor --fix`.

### Odroczone pełne ładowanie

Pluginy kanałów mogą włączyć odroczone ładowanie przez:

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

Gdy jest włączone, OpenClaw ładuje tylko `setupEntry` podczas fazy startowej
przed nasłuchem, nawet dla już skonfigurowanych kanałów. Pełny wpis jest ładowany po rozpoczęciu nasłuchu przez gateway.

<Warning>
  Włączaj odroczone ładowanie tylko wtedy, gdy Twoje `setupEntry` rejestruje wszystko, czego
  gateway potrzebuje przed rozpoczęciem nasłuchiwania (rejestracja kanału, trasy HTTP,
  metody Gateway). Jeśli pełny wpis posiada wymagane możliwości startowe, pozostaw
  domyślne zachowanie.
</Warning>

Jeśli Twój wpis setup/full rejestruje metody Gateway RPC, zachowaj je pod
prefiksem specyficznym dla Pluginu. Zastrzeżone główne przestrzenie nazw administracyjnych (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają własnością core i zawsze rozwiązują się
do `operator.admin`.

## Manifest Pluginu

Każdy natywny Plugin musi dostarczać `openclaw.plugin.json` w root pakietu.
OpenClaw używa go do walidacji konfiguracji bez wykonywania kodu Pluginu.

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

Dla Pluginów kanałów dodaj `kind` i `channels`:

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

Nawet Pluginy bez konfiguracji muszą dostarczać schemat. Pusty schemat jest poprawny:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Zobacz [Manifest Pluginu](/pl/plugins/manifest), aby poznać pełną dokumentację schematu.

## Publikacja w ClawHub

Dla pakietów Pluginów używaj polecenia ClawHub specyficznego dla pakietów:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Starszy alias publikacji tylko dla Skills dotyczy Skills. Pakiety Pluginów powinny
zawsze używać `clawhub package publish`.

## Wpis konfiguracji

Plik `setup-entry.ts` to lekka alternatywa dla `index.ts`, którą
OpenClaw ładuje, gdy potrzebuje tylko powierzchni konfiguracji (onboarding, naprawa konfiguracji,
inspekcja wyłączonego kanału).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Pozwala to uniknąć ładowania ciężkiego kodu runtime (bibliotek kryptograficznych, rejestracji CLI,
usług działających w tle) podczas przepływów konfiguracji.

Bundled kanały workspace, które trzymają eksporty bezpieczne dla konfiguracji w modułach sidecar, mogą
używać `defineBundledChannelSetupEntry(...)` z
`openclaw/plugin-sdk/channel-entry-contract` zamiast
`defineSetupPluginEntry(...)`. Ten kontrakt bundled obsługuje także opcjonalny
eksport `runtime`, dzięki czemu łączenie runtime w czasie konfiguracji może pozostać lekkie i jawne.

**Kiedy OpenClaw używa `setupEntry` zamiast pełnego wpisu:**

- Kanał jest wyłączony, ale potrzebuje powierzchni konfiguracji/onboardingu
- Kanał jest włączony, ale nieskonfigurowany
- Włączone jest odroczone ładowanie (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Co `setupEntry` musi rejestrować:**

- Obiekt Pluginu kanału (przez `defineSetupPluginEntry`)
- Wszystkie trasy HTTP wymagane przed rozpoczęciem nasłuchu przez gateway
- Wszystkie metody Gateway potrzebne podczas uruchamiania

Te startowe metody Gateway nadal powinny unikać zastrzeżonych głównych
przestrzeni nazw administracyjnych, takich jak `config.*` czy `update.*`.

**Czego `setupEntry` NIE powinno zawierać:**

- Rejestracji CLI
- Usług działających w tle
- Ciężkich importów runtime (crypto, SDK)
- Metod Gateway potrzebnych dopiero po uruchomieniu

### Wąskie importy pomocników konfiguracji

Dla gorących ścieżek tylko-konfiguracyjnych preferuj wąskie punkty wejścia pomocników konfiguracji zamiast szerszego
zbioru `plugin-sdk/setup`, gdy potrzebujesz tylko części powierzchni konfiguracji:

| Ścieżka importu                     | Używaj do                                                                                | Kluczowe eksporty                                                                                                                                                                                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`          | pomocniki runtime w czasie konfiguracji, które pozostają dostępne w `setupEntry` / przy odroczonym starcie kanału | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`  | adaptery konfiguracji kont zależne od środowiska                                         | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`            | pomocniki CLI/archiwów/dokumentacji dla konfiguracji/instalacji                          | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                             |

Używaj szerszego punktu wejścia `plugin-sdk/setup`, gdy chcesz pełny współdzielony
zestaw narzędzi konfiguracji, w tym pomocniki łatania konfiguracji, takie jak
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adaptery łatania konfiguracji pozostają bezpieczne dla gorącej ścieżki przy imporcie. Ich bundled
lazy lookup powierzchni kontraktu promowania pojedynczego konta jest leniwy, więc import
`plugin-sdk/setup-runtime` nie ładuje eagerly wykrywania bundled powierzchni kontraktów
zanim adapter faktycznie zostanie użyty.

### Własne promowanie pojedynczego konta przez kanał

Gdy kanał przechodzi z najwyższego poziomu konfiguracji pojedynczego konta do
`channels.<id>.accounts.*`, domyślne współdzielone zachowanie przenosi wartości o zakresie konta
do `accounts.default`.

Bundled kanały mogą zawęzić lub nadpisać to promowanie przez swoją powierzchnię
kontraktu konfiguracji:

- `singleAccountKeysToMove`: dodatkowe klucze najwyższego poziomu, które powinny zostać przeniesione do
  promowanego konta
- `namedAccountPromotionKeys`: gdy istnieją już nazwane konta, tylko te
  klucze są przenoszone do promowanego konta; współdzielone klucze policy/delivery pozostają w root kanału
- `resolveSingleAccountPromotionTarget(...)`: wybiera, które istniejące konto
  otrzyma promowane wartości

Matrix jest obecnie bundled przykładem. Jeśli istnieje już dokładnie jedno nazwane konto Matrix
albo jeśli `defaultAccount` wskazuje na istniejący niekanoniczny klucz
taki jak `Ops`, promowanie zachowuje to konto zamiast tworzyć nowy
wpis `accounts.default`.

## Schemat konfiguracji

Konfiguracja Pluginu jest walidowana względem JSON Schema w Twoim manifeście. Użytkownicy
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

Użyj `buildChannelConfigSchema` z `openclaw/plugin-sdk/core`, aby przekształcić
schemat Zod w opakowanie `ChannelConfigSchema`, które OpenClaw waliduje:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Kreatory konfiguracji

Pluginy kanałów mogą udostępniać interaktywne kreatory konfiguracji dla `openclaw onboard`.
Kreator to obiekt `ChannelSetupWizard` na `ChannelPlugin`:

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
Pełne przykłady znajdziesz w pakietach bundled Pluginów (na przykład Plugin Discord `src/channel.setup.ts`).

Dla promptów allowlisty DM, które potrzebują tylko standardowego
przepływu `note -> prompt -> parse -> merge -> patch`, preferuj współdzielone pomocniki konfiguracji
z `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` i
`createNestedChannelParsedAllowFromPrompt(...)`.

Dla bloków statusu konfiguracji kanału, które różnią się tylko etykietami, ocenami i opcjonalnymi
dodatkowymi liniami, preferuj `createStandardChannelSetupStatus(...)` z
`openclaw/plugin-sdk/setup` zamiast ręcznie budować ten sam obiekt `status` w
każdym Pluginie.

Dla opcjonalnych powierzchni konfiguracji, które powinny pojawiać się tylko w określonych kontekstach, użyj
`createOptionalChannelSetupSurface` z `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Zwraca { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` udostępnia też niższopoziomowe konstruktory
`createOptionalChannelSetupAdapter(...)` i
`createOptionalChannelSetupWizard(...)`, gdy potrzebujesz tylko jednej połowy
tej opcjonalnej powierzchni instalacji.

Wygenerowany opcjonalny adapter/kreator kończy się trybem fail-closed przy rzeczywistych zapisach konfiguracji. Ponownie
używa jednego komunikatu o wymaganej instalacji w `validateInput`,
`applyAccountConfig` i `finalize`, a gdy ustawiono `docsPath`, dołącza link do dokumentacji.

Dla UI konfiguracji opartych na plikach binarnych preferuj współdzielone pomocniki delegowane zamiast
kopiowania tego samego kleju binary/status do każdego kanału:

- `createDetectedBinaryStatus(...)` dla bloków statusu, które różnią się tylko etykietami,
  wskazówkami, ocenami i wykrywaniem plików binarnych
- `createCliPathTextInput(...)` dla pól tekstowych opartych na ścieżce
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` i
  `createDelegatedResolveConfigured(...)`, gdy `setupEntry` musi leniwie przekazywać
  do cięższego pełnego kreatora
- `createDelegatedTextInputShouldPrompt(...)`, gdy `setupEntry` musi tylko
  delegować decyzję `textInputs[*].shouldPrompt`

## Publikowanie i instalowanie

**Pluginy zewnętrzne:** opublikuj w [ClawHub](/pl/tools/clawhub) albo npm, a następnie zainstaluj:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw najpierw próbuje ClawHub, a potem automatycznie wraca do npm. Możesz też
jawnie wymusić ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # tylko ClawHub
```

Nie istnieje odpowiadające nadpisanie `npm:`. Użyj zwykłej specyfikacji pakietu npm, gdy
chcesz ścieżki npm po fallbacku ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Pluginy w repozytorium:** umieść je w drzewie workspace bundled Pluginów, a będą automatycznie
wykrywane podczas buildu.

**Użytkownicy mogą instalować:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Dla instalacji pochodzących z npm `openclaw plugins install` uruchamia
  `npm install --ignore-scripts` (bez skryptów cyklu życia). Utrzymuj drzewa zależności Pluginów jako czyste JS/TS i unikaj pakietów wymagających buildów `postinstall`.
</Info>

Bundled Pluginy należące do OpenClaw są jedynym wyjątkiem dla napraw przy starcie: gdy
spakowana instalacja widzi taki Plugin jako włączony przez konfigurację Pluginu, starszą konfigurację kanału lub
jego bundled manifest domyślnie włączony, startup instaluje brakujące zależności runtime tego Pluginu przed importem. Pluginy zewnętrzne nie powinny polegać na instalacjach przy starcie; nadal używaj jawnego instalatora Pluginów.

## Powiązane

- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) -- `definePluginEntry` i `defineChannelPluginEntry`
- [Manifest Pluginu](/pl/plugins/manifest) -- pełna dokumentacja schematu manifestu
- [Tworzenie Pluginów](/pl/plugins/building-plugins) -- przewodnik krok po kroku na początek
