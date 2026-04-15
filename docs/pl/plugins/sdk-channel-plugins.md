---
read_when:
    - Tworzysz nowy Plugin kanału wiadomości.
    - Chcesz połączyć OpenClaw z platformą komunikacyjną.
    - Musisz zrozumieć powierzchnię adaptera ChannelPlugin.
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku dotyczący tworzenia Pluginu kanału wiadomości dla OpenClaw
title: Tworzenie Pluginów kanałów
x-i18n:
    generated_at: "2026-04-15T09:51:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7f4c746fe3163a8880e14c433f4db4a1475535d91716a53fb879551d8d62f65
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Tworzenie Pluginów kanałów

Ten przewodnik krok po kroku pokazuje, jak zbudować Plugin kanału, który łączy OpenClaw z platformą komunikacyjną. Po jego ukończeniu będziesz mieć działający kanał z zabezpieczeniami DM, parowaniem, wątkowaniem odpowiedzi oraz wiadomościami wychodzącymi.

<Info>
  Jeśli nie zbudowano jeszcze żadnego Pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

## Jak działają Pluginy kanałów

Pluginy kanałów nie potrzebują własnych narzędzi do wysyłania/edytowania/reakcji. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w rdzeniu. Twój Plugin odpowiada za:

- **Config** — rozpoznawanie kont i kreator konfiguracji
- **Security** — politykę DM i listy dozwolonych
- **Pairing** — przepływ zatwierdzania DM
- **Session grammar** — sposób, w jaki identyfikatory rozmów specyficzne dla dostawcy mapują się na bazowe czaty, identyfikatory wątków i rezerwy nadrzędne
- **Outbound** — wysyłanie tekstu, multimediów i ankiet na platformę
- **Threading** — sposób wątkowania odpowiedzi

Rdzeń odpowiada za współdzielone narzędzie wiadomości, połączenia z promptami, zewnętrzny kształt klucza sesji, ogólne księgowanie `:thread:` oraz dyspozycję.

Jeśli Twój kanał dodaje parametry narzędzia wiadomości, które przenoszą źródła multimediów, ujawnij nazwy tych parametrów przez `describeMessageTool(...).mediaSourceParams`. Rdzeń używa tej jawnej listy do normalizacji ścieżek w sandboxie i polityki dostępu do multimediów wychodzących, więc Pluginy nie potrzebują wyjątków specyficznych dla dostawcy we współdzielonym rdzeniu dla parametrów awatara, załączników lub obrazów okładki.
Preferuj zwracanie mapy kluczowanej akcjami, takiej jak
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, aby niezwiązane akcje nie dziedziczyły argumentów multimedialnych innej akcji. Płaska tablica nadal działa dla parametrów, które celowo są współdzielone przez każdą ujawnioną akcję.

Jeśli Twoja platforma przechowuje dodatkowy zakres w identyfikatorach rozmów, pozostaw to parsowanie w Pluginie za pomocą `messaging.resolveSessionConversation(...)`. To kanoniczny hak do mapowania `rawId` na bazowy identyfikator rozmowy, opcjonalny identyfikator wątku, jawne `baseConversationId` oraz wszelkie `parentConversationCandidates`.
Gdy zwracasz `parentConversationCandidates`, zachowaj ich kolejność od najwęższego rodzica do najszerszej/bazowej rozmowy.

Bundlowane Pluginy, które potrzebują tego samego parsowania przed uruchomieniem rejestru kanałów, mogą też udostępniać plik najwyższego poziomu `session-key-api.ts` z pasującym eksportem `resolveSessionConversation(...)`. Rdzeń używa tej bezpiecznej dla bootstrapu powierzchni tylko wtedy, gdy rejestr Pluginów runtime nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` pozostaje dostępne jako starsza rezerwa zgodności, gdy Plugin potrzebuje jedynie rezerw nadrzędnych ponad ogólnym/surowym identyfikatorem. Jeśli istnieją oba haki, rdzeń najpierw używa `resolveSessionConversation(...).parentConversationCandidates`, a do `resolveParentConversationCandidates(...)` wraca tylko wtedy, gdy kanoniczny hak ich nie zwraca.

## Zatwierdzenia i możliwości kanału

Większość Pluginów kanałów nie potrzebuje kodu specyficznego dla zatwierdzeń.

- Rdzeń odpowiada za `/approve` w tym samym czacie, współdzielone ładunki przycisków zatwierdzania oraz ogólne dostarczanie rezerwowe.
- Preferuj pojedynczy obiekt `approvalCapability` w Pluginie kanału, gdy kanał potrzebuje zachowania specyficznego dla zatwierdzeń.
- `ChannelPlugin.approvals` zostało usunięte. Umieść fakty dotyczące dostarczania/natywnego/renderowania/uwierzytelniania zatwierdzeń w `approvalCapability`.
- `plugin.auth` służy tylko do logowania/wylogowania; rdzeń nie odczytuje już haków uwierzytelniania zatwierdzeń z tego obiektu.
- `approvalCapability.authorizeActorAction` i `approvalCapability.getActionAvailabilityState` to kanoniczna powierzchnia uwierzytelniania zatwierdzeń.
- Używaj `approvalCapability.getActionAvailabilityState` dla dostępności uwierzytelniania zatwierdzeń w tym samym czacie.
- Jeśli Twój kanał udostępnia natywne zatwierdzenia exec, użyj `approvalCapability.getExecInitiatingSurfaceState` dla stanu powierzchni inicjującej/klienta natywnego, gdy różni się on od uwierzytelniania zatwierdzeń w tym samym czacie. Rdzeń używa tego haka specyficznego dla exec, aby rozróżnić `enabled` i `disabled`, zdecydować, czy kanał inicjujący obsługuje natywne zatwierdzenia exec, oraz uwzględnić ten kanał w wskazówkach dotyczących rezerwy klienta natywnego. `createApproverRestrictedNativeApprovalCapability(...)` wypełnia to dla typowego przypadku.
- Używaj `outbound.shouldSuppressLocalPayloadPrompt` lub `outbound.beforeDeliverPayload` do zachowań cyklu życia ładunku specyficznych dla kanału, takich jak ukrywanie zduplikowanych lokalnych promptów zatwierdzeń lub wysyłanie wskaźników pisania przed dostarczeniem.
- Używaj `approvalCapability.delivery` tylko do natywnego routingu zatwierdzeń lub wyciszania rezerwy.
- Używaj `approvalCapability.nativeRuntime` dla faktów natywnych zatwierdzeń należących do kanału. Zachowaj leniwe ładowanie na gorących punktach wejścia kanału za pomocą `createLazyChannelApprovalNativeRuntimeAdapter(...)`, które może importować moduł runtime na żądanie, a jednocześnie pozwala rdzeniowi składać cykl życia zatwierdzeń.
- Używaj `approvalCapability.render` tylko wtedy, gdy kanał naprawdę potrzebuje niestandardowych ładunków zatwierdzeń zamiast współdzielonego renderera.
- Używaj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce, aby odpowiedź dla ścieżki wyłączonej wyjaśniała dokładne pokrętła konfiguracji potrzebne do włączenia natywnych zatwierdzeń exec. Hak otrzymuje `{ channel, channelLabel, accountId }`; kanały z nazwanymi kontami powinny renderować ścieżki z zakresem konta, takie jak `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych ścieżek najwyższego poziomu.
- Jeśli kanał może wnioskować o stabilnych tożsamościach DM podobnych do właściciela na podstawie istniejącej konfiguracji, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie bez dodawania logiki specyficznej dla zatwierdzeń do rdzenia.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, skup kod kanału na normalizacji celu oraz faktach transportu/prezentacji. Użyj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` i `createApproverRestrictedNativeApprovalCapability` z `openclaw/plugin-sdk/approval-runtime`. Umieść fakty specyficzne dla kanału za `approvalCapability.nativeRuntime`, najlepiej przez `createChannelApprovalNativeRuntimeAdapter(...)` lub `createLazyChannelApprovalNativeRuntimeAdapter(...)`, aby rdzeń mógł złożyć obsługę i przejąć filtrowanie żądań, routing, usuwanie duplikatów, wygaśnięcie, subskrypcję Gateway oraz powiadomienia o przekierowaniu. `nativeRuntime` jest podzielone na kilka mniejszych powierzchni:
- `availability` — czy konto jest skonfigurowane i czy żądanie powinno zostać obsłużone
- `presentation` — mapowanie współdzielonego modelu widoku zatwierdzenia na oczekujące/rozwiązane/wygasłe ładunki natywne lub działania końcowe
- `transport` — przygotowanie celów oraz wysyłanie/aktualizowanie/usuwanie natywnych wiadomości zatwierdzeń
- `interactions` — opcjonalne haki bind/unbind/clear-action dla natywnych przycisków lub reakcji
- `observe` — opcjonalne haki diagnostyki dostarczania
- Jeśli kanał potrzebuje obiektów należących do runtime, takich jak klient, token, aplikacja Bolt lub odbiornik Webhook, zarejestruj je przez `openclaw/plugin-sdk/channel-runtime-context`. Ogólny rejestr kontekstu runtime pozwala rdzeniowi bootstrapować handlery sterowane możliwościami na podstawie stanu uruchomienia kanału bez dodawania kleju opakowującego specyficznego dla zatwierdzeń.
- Sięgaj po niższopoziomowe `createChannelApprovalHandler` lub `createChannelNativeApprovalRuntime` tylko wtedy, gdy powierzchnia sterowana możliwościami nie jest jeszcze wystarczająco ekspresyjna.
- Kanały natywnych zatwierdzeń muszą routować zarówno `accountId`, jak i `approvalKind` przez te helpery. `accountId` utrzymuje politykę zatwierdzeń dla wielu kont w zakresie właściwego konta bota, a `approvalKind` zachowuje dla kanału dostępność zachowania zatwierdzeń exec vs Plugin bez zakodowanych na sztywno gałęzi w rdzeniu.
- Rdzeń odpowiada teraz także za powiadomienia o przekierowaniu zatwierdzeń. Pluginy kanałów nie powinny wysyłać własnych wiadomości uzupełniających typu „zatwierdzenie trafiło do DM / innego kanału” z `createChannelNativeApprovalRuntime`; zamiast tego ujawnij dokładny routing źródła i DM zatwierdzającego przez współdzielone helpery możliwości zatwierdzeń i pozwól rdzeniowi agregować rzeczywiste dostarczenia przed opublikowaniem powiadomienia z powrotem do czatu inicjującego.
- Zachowuj rodzaj identyfikatora dostarczonego zatwierdzenia od początku do końca. Klienci natywni nie powinni zgadywać ani przepisywać routingu zatwierdzeń exec vs Plugin na podstawie lokalnego stanu kanału.
- Różne rodzaje zatwierdzeń mogą celowo ujawniać różne powierzchnie natywne.
  Obecne przykłady bundlowane:
  - Slack zachowuje dostępny natywny routing zatwierdzeń zarówno dla identyfikatorów exec, jak i Plugin.
  - Matrix zachowuje ten sam natywny routing DM/kanału i UX reakcji dla zatwierdzeń exec i Plugin, nadal pozwalając, by uwierzytelnianie różniło się zależnie od rodzaju zatwierdzenia.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako opakowanie zgodności, ale nowy kod powinien preferować kreator możliwości i ujawniać `approvalCapability` w Pluginie.

Dla gorących punktów wejścia kanału preferuj węższe podścieżki runtime, gdy potrzebujesz tylko jednej części tej rodziny:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Podobnie preferuj `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` oraz
`openclaw/plugin-sdk/reply-chunking`, gdy nie potrzebujesz szerszej powierzchni parasolowej.

W przypadku konfiguracji w szczególności:

- `openclaw/plugin-sdk/setup-runtime` obejmuje bezpieczne dla runtime helpery konfiguracji:
  bezpieczne dla importu adaptery łatania konfiguracji (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), wyjście notatek wyszukiwania,
  `promptResolvedAllowFrom`, `splitSetupEntries` oraz delegowane
  kreatory proxy konfiguracji
- `openclaw/plugin-sdk/setup-adapter-runtime` to wąska, świadoma środowiska powierzchnia
  adaptera dla `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje kreatory konfiguracji opcjonalnej instalacji
  oraz kilka prymitywów bezpiecznych dla konfiguracji:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jeśli Twój kanał obsługuje konfigurację lub uwierzytelnianie sterowane środowiskiem i ogólne przepływy uruchamiania/konfiguracji powinny znać te nazwy zmiennych środowiskowych przed załadowaniem runtime, zadeklaruj je w manifeście Pluginu za pomocą `channelEnvVars`. Zachowaj runtime `envVars` kanału lub lokalne stałe tylko dla kopii skierowanej do operatora.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` oraz
`splitSetupEntries`

- używaj szerszej powierzchni `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz również
  cięższych współdzielonych helperów konfiguracji/ustawień, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli Twój kanał chce jedynie reklamować „najpierw zainstaluj ten Plugin” w powierzchniach konfiguracji, preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany adapter/kreator domyślnie odmawia zapisów konfiguracji i finalizacji oraz ponownie wykorzystuje ten sam komunikat o wymaganej instalacji w walidacji, finalizacji i treści linku do dokumentacji.

Dla innych gorących ścieżek kanału preferuj wąskie helpery zamiast szerszych starszych powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` oraz
  `openclaw/plugin-sdk/account-helpers` dla konfiguracji wielu kont i
  rezerwy konta domyślnego
- `openclaw/plugin-sdk/inbound-envelope` oraz
  `openclaw/plugin-sdk/inbound-reply-dispatch` dla routingu/koperty wejściowej oraz
  połączeń rejestrowania i dyspozycji
- `openclaw/plugin-sdk/messaging-targets` dla parsowania/dopasowywania celów
- `openclaw/plugin-sdk/outbound-media` oraz
  `openclaw/plugin-sdk/outbound-runtime` dla ładowania multimediów oraz delegatów
  tożsamości/wysyłania wychodzącego
- `openclaw/plugin-sdk/thread-bindings-runtime` dla cyklu życia powiązań wątków
  i rejestracji adapterów
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy nadal wymagany jest
  starszy układ pól ładunku agent/media
- `openclaw/plugin-sdk/telegram-command-config` dla normalizacji niestandardowych komend Telegram,
  walidacji duplikatów/konfliktów oraz stabilnego dla rezerw kontraktu konfiguracji komend

Kanały tylko z uwierzytelnianiem zwykle mogą zatrzymać się na ścieżce domyślnej: rdzeń obsługuje zatwierdzenia, a Plugin jedynie udostępnia możliwości outbound/auth. Kanały natywnych zatwierdzeń, takie jak Matrix, Slack, Telegram i niestandardowe transporty czatu, powinny używać współdzielonych helperów natywnych zamiast implementować własny cykl życia zatwierdzeń.

## Zasady wzmianek przychodzących

Obsługę wzmianek przychodzących utrzymuj w podziale na dwie warstwy:

- gromadzenie danych należące do Pluginu
- współdzielona ocena zasad

Dla warstwy współdzielonej używaj `openclaw/plugin-sdk/channel-inbound`.

Dobre dopasowanie do logiki lokalnej dla Pluginu:

- wykrywanie odpowiedzi do bota
- wykrywanie cytatów bota
- sprawdzanie uczestnictwa we wątku
- wykluczanie wiadomości usługowych/systemowych
- natywne dla platformy cache potrzebne do udowodnienia uczestnictwa bota

Dobre dopasowanie do współdzielonego helpera:

- `requireMention`
- jawny wynik wzmianki
- lista dozwolonych niejawnych wzmianek
- obejście komend
- ostateczna decyzja o pominięciu

Preferowany przepływ:

1. Oblicz lokalne fakty dotyczące wzmianek.
2. Przekaż te fakty do `resolveInboundMentionDecision({ facts, policy })`.
3. Użyj `decision.effectiveWasMentioned`, `decision.shouldBypassMention` i `decision.shouldSkip` w swojej bramce wejściowej.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions` udostępnia te same współdzielone helpery wzmianek dla
bundlowanych Pluginów kanałów, które już zależą od wstrzykiwania runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Starsze helpery `resolveMentionGating*` pozostają w
`openclaw/plugin-sdk/channel-inbound` jedynie jako eksporty zgodności. Nowy kod
powinien używać `resolveInboundMentionDecision({ facts, policy })`.

## Omówienie

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    Utwórz standardowe pliki Pluginu. Pole `channel` w `package.json`
    sprawia, że jest to Plugin kanału. Pełną powierzchnię metadanych pakietu
    znajdziesz w [Konfiguracja i ustawienia Pluginu](/pl/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="Zbuduj obiekt Pluginu kanału">
    Interfejs `ChannelPlugin` ma wiele opcjonalnych powierzchni adapterów. Zacznij od
    minimum — `id` i `setup` — i dodawaj adaptery w miarę potrzeb.

    Utwórz `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    <Accordion title="Co robi za Ciebie createChatChannelPlugin">
      Zamiast ręcznie implementować niskopoziomowe interfejsy adapterów, przekazujesz
      deklaratywne opcje, a kreator je składa:

      | Opcja | Co podłącza |
      | --- | --- |
      | `security.dm` | Rozpoznawanie zabezpieczeń DM z zakresem z pól konfiguracji |
      | `pairing.text` | Przepływ parowania DM oparty na tekście z wymianą kodów |
      | `threading` | Rozpoznawanie trybu reply-to (stały, z zakresem konta lub niestandardowy) |
      | `outbound.attachedResults` | Funkcje wysyłania zwracające metadane wyniku (identyfikatory wiadomości) |

      Możesz również przekazać surowe obiekty adapterów zamiast opcji deklaratywnych,
      jeśli potrzebujesz pełnej kontroli.
    </Accordion>

  </Step>

  <Step title="Podłącz punkt wejścia">
    Utwórz `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Umieść deskryptory CLI należące do kanału w `registerCliMetadata(...)`, aby OpenClaw
    mógł pokazywać je w pomocy głównej bez aktywowania pełnego runtime kanału,
    podczas gdy zwykłe pełne ładowania nadal pobierają te same deskryptory do rzeczywistej
    rejestracji komend. Zachowaj `registerFull(...)` dla pracy tylko w runtime.
    Jeśli `registerFull(...)` rejestruje metody RPC Gateway, użyj prefiksu
    specyficznego dla Pluginu. Przestrzenie nazw administratora rdzenia (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze
    rozwiązują się do `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje podział trybów rejestracji. Wszystkie
    opcje znajdziesz w [Punkty wejścia](/pl/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Dodaj wpis konfiguracji">
    Utwórz `setup-entry.ts` do lekkiego ładowania podczas onboardingu:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw ładuje to zamiast pełnego punktu wejścia, gdy kanał jest wyłączony
    lub nieskonfigurowany. Pozwala to uniknąć wciągania ciężkiego kodu runtime podczas przepływów konfiguracji.
    Szczegóły znajdziesz w [Konfiguracja i ustawienia](/pl/plugins/sdk-setup#setup-entry).

  </Step>

  <Step title="Obsłuż wiadomości przychodzące">
    Twój Plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowy wzorzec to Webhook, który weryfikuje żądanie i
    dyspozytuje je przez handler wejściowy Twojego kanału:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Obsługa wiadomości przychodzących jest specyficzna dla kanału. Każdy Plugin kanału
      odpowiada za własny pipeline wejściowy. Zobacz bundlowane Pluginy kanałów
      (na przykład pakiet Pluginu Microsoft Teams lub Google Chat), aby poznać rzeczywiste wzorce.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testuj">
Napisz testy kolokowane w `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Informacje o współdzielonych helperach testowych znajdziesz w sekcji [Testowanie](/pl/plugins/sdk-testing).

  </Step>
</Steps>

## Struktura plików

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadane openclaw.channel
├── openclaw.plugin.json      # Manifest ze schematem konfiguracji
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Eksporty publiczne (opcjonalnie)
├── runtime-api.ts            # Wewnętrzne eksporty runtime (opcjonalnie)
└── src/
    ├── channel.ts            # ChannelPlugin przez createChatChannelPlugin
    ├── channel.test.ts       # Testy
    ├── client.ts             # Klient API platformy
    └── runtime.ts            # Magazyn runtime (w razie potrzeby)
```

## Tematy zaawansowane

<CardGroup cols={2}>
  <Card title="Opcje wątkowania" icon="git-branch" href="/pl/plugins/sdk-entrypoints#registration-mode">
    Stałe, z zakresem konta lub niestandardowe tryby odpowiedzi
  </Card>
  <Card title="Integracja narzędzia wiadomości" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i wykrywanie akcji
  </Card>
  <Card title="Rozpoznawanie celu" icon="crosshair" href="/pl/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpery runtime" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, STT, multimedia, subagent przez api.runtime
  </Card>
</CardGroup>

<Note>
Niektóre bundlowane powierzchnie helperów nadal istnieją na potrzeby utrzymania
bundlowanych Pluginów i zgodności. Nie są one zalecanym wzorcem dla nowych Pluginów kanałów;
preferuj ogólne podścieżki channel/setup/reply/runtime ze wspólnej
powierzchni SDK, chyba że bezpośrednio utrzymujesz tę rodzinę bundlowanych Pluginów.
</Note>

## Następne kroki

- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — jeśli Twój Plugin udostępnia także modele
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełne odniesienie do importów podścieżek
- [Testowanie SDK](/pl/plugins/sdk-testing) — narzędzia testowe i testy kontraktowe
- [Manifest Pluginu](/pl/plugins/manifest) — pełny schemat manifestu
