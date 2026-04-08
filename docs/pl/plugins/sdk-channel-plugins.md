---
read_when:
    - Tworzysz nowy plugin kanału wiadomości
    - Chcesz połączyć OpenClaw z platformą komunikacyjną
    - Musisz zrozumieć powierzchnię adaptera ChannelPlugin
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku po tworzeniu pluginu kanału wiadomości dla OpenClaw
title: Tworzenie pluginów kanałów
x-i18n:
    generated_at: "2026-04-08T02:17:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23365b6d92006b30e671f9f0afdba40a2b88c845c5d2299d71c52a52985672f
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Tworzenie pluginów kanałów

Ten przewodnik pokazuje, jak zbudować plugin kanału, który łączy OpenClaw z
platformą komunikacyjną. Na końcu będziesz mieć działający kanał z zabezpieczeniami DM,
parowaniem, wątkowaniem odpowiedzi i wysyłaniem wiadomości wychodzących.

<Info>
  Jeśli nie tworzyłeś wcześniej żadnego pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

## Jak działają pluginy kanałów

Pluginy kanałów nie potrzebują własnych narzędzi do wysyłania/edycji/reakcji. OpenClaw utrzymuje
jedno współdzielone narzędzie `message` w rdzeniu. Twój plugin odpowiada za:

- **Konfigurację** — rozwiązywanie kont i kreator konfiguracji
- **Bezpieczeństwo** — politykę DM i listy dozwolonych
- **Parowanie** — przepływ zatwierdzania DM
- **Gramatykę sesji** — sposób, w jaki identyfikatory rozmów specyficzne dla dostawcy mapują się na bazowe czaty, identyfikatory wątków i zapasowe relacje nadrzędne
- **Ruch wychodzący** — wysyłanie tekstu, multimediów i ankiet na platformę
- **Wątkowanie** — sposób wątkowania odpowiedzi

Rdzeń odpowiada za współdzielone narzędzie wiadomości, połączenia promptów, zewnętrzny kształt klucza sesji,
ogólne prowadzenie ewidencji `:thread:` oraz dispatch.

Jeśli Twoja platforma przechowuje dodatkowy zakres w identyfikatorach rozmów, zachowaj to parsowanie
w pluginie przy użyciu `messaging.resolveSessionConversation(...)`. To jest
kanoniczny hook do mapowania `rawId` na bazowy identyfikator rozmowy, opcjonalny identyfikator wątku,
jawny `baseConversationId` oraz ewentualne `parentConversationCandidates`.
Gdy zwracasz `parentConversationCandidates`, zachowaj ich kolejność od
najwęższego nadrzędnego do najszerszej/bazowej rozmowy.

Bundled plugins, które potrzebują tego samego parsowania przed uruchomieniem rejestru kanałów,
mogą również udostępniać plik najwyższego poziomu `session-key-api.ts` z pasującym
eksportem `resolveSessionConversation(...)`. Rdzeń używa tej bezpiecznej dla bootstrap powierzchni
tylko wtedy, gdy rejestr pluginów środowiska wykonawczego nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` nadal pozostaje dostępne jako
starszy zapasowy mechanizm zgodności, gdy plugin potrzebuje tylko zapasowych relacji nadrzędnych
na bazie ogólnego/surowego identyfikatora. Jeśli istnieją oba hooki, rdzeń używa najpierw
`resolveSessionConversation(...).parentConversationCandidates` i przechodzi do
`resolveParentConversationCandidates(...)` tylko wtedy, gdy hook kanoniczny ich
nie zwraca.

## Zatwierdzenia i możliwości kanałów

Większość pluginów kanałów nie potrzebuje kodu specyficznego dla zatwierdzeń.

- Rdzeń odpowiada za `/approve` w tym samym czacie, współdzielone ładunki przycisków zatwierdzeń i ogólne zapasowe dostarczanie.
- Preferuj pojedynczy obiekt `approvalCapability` w pluginie kanału, gdy kanał potrzebuje zachowania specyficznego dla zatwierdzeń.
- `ChannelPlugin.approvals` zostało usunięte. Umieszczaj fakty dotyczące dostarczania/natywnego renderowania/uwierzytelniania zatwierdzeń w `approvalCapability`.
- `plugin.auth` służy tylko do logowania/wylogowania; rdzeń nie odczytuje już z tego obiektu hooków uwierzytelniania zatwierdzeń.
- `approvalCapability.authorizeActorAction` i `approvalCapability.getActionAvailabilityState` to kanoniczna powierzchnia dla uwierzytelniania zatwierdzeń.
- Używaj `approvalCapability.getActionAvailabilityState` dla dostępności uwierzytelniania zatwierdzeń w tym samym czacie.
- Jeśli Twój kanał udostępnia natywne zatwierdzenia exec, użyj `approvalCapability.getExecInitiatingSurfaceState` dla stanu powierzchni inicjującej/klienta natywnego, gdy różni się on od uwierzytelniania zatwierdzeń w tym samym czacie. Rdzeń używa tego hooka specyficznego dla exec, aby rozróżniać `enabled` i `disabled`, zdecydować, czy kanał inicjujący obsługuje natywne zatwierdzenia exec, oraz uwzględnić kanał we wskazówkach zapasowych dla klientów natywnych. `createApproverRestrictedNativeApprovalCapability(...)` uzupełnia to dla typowego przypadku.
- Używaj `outbound.shouldSuppressLocalPayloadPrompt` lub `outbound.beforeDeliverPayload` dla zachowań cyklu życia ładunku specyficznych dla kanału, takich jak ukrywanie zduplikowanych lokalnych promptów zatwierdzeń albo wysyłanie wskaźników pisania przed dostarczeniem.
- Używaj `approvalCapability.delivery` tylko do natywnego routingu zatwierdzeń albo wyłączania routingu zapasowego.
- Używaj `approvalCapability.nativeRuntime` do faktów o natywnych zatwierdzeniach należących do kanału. Utrzymuj go jako leniwy w gorących punktach wejścia kanału za pomocą `createLazyChannelApprovalNativeRuntimeAdapter(...)`, który może importować moduł runtime na żądanie, a jednocześnie pozwalać rdzeniowi składać cykl życia zatwierdzeń.
- Używaj `approvalCapability.render` tylko wtedy, gdy kanał naprawdę potrzebuje własnych ładunków zatwierdzeń zamiast współdzielonego renderer.
- Używaj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce, aby odpowiedź dla ścieżki wyłączonej wyjaśniała dokładnie, jakie przełączniki konfiguracji są potrzebne do włączenia natywnych zatwierdzeń exec. Hook otrzymuje `{ channel, channelLabel, accountId }`; kanały z nazwanymi kontami powinny renderować ścieżki ograniczone do konta, takie jak `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych ustawień najwyższego poziomu.
- Jeśli kanał może wywnioskować stabilne, podobne do właściciela tożsamości DM z istniejącej konfiguracji, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie bez dodawania logiki specyficznej dla zatwierdzeń do rdzenia.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, utrzymuj kod kanału skupiony na normalizacji celu oraz faktach transportu/prezentacji. Użyj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` i `createApproverRestrictedNativeApprovalCapability` z `openclaw/plugin-sdk/approval-runtime`. Umieść fakty specyficzne dla kanału za `approvalCapability.nativeRuntime`, najlepiej przez `createChannelApprovalNativeRuntimeAdapter(...)` lub `createLazyChannelApprovalNativeRuntimeAdapter(...)`, aby rdzeń mógł złożyć handler i przejąć filtrowanie żądań, routing, deduplikację, wygasanie, subskrypcję gateway oraz komunikaty o przekierowaniu gdzie indziej. `nativeRuntime` jest podzielone na kilka mniejszych powierzchni:
- `availability` — czy konto jest skonfigurowane i czy żądanie powinno zostać obsłużone
- `presentation` — mapowanie współdzielonego view model zatwierdzeń na natywne ładunki oczekujące/rozwiązane/wygasłe lub końcowe akcje
- `transport` — przygotowanie celów oraz wysyłanie/aktualizowanie/usuwanie natywnych wiadomości zatwierdzeń
- `interactions` — opcjonalne hooki bind/unbind/clear-action dla natywnych przycisków lub reakcji
- `observe` — opcjonalne hooki diagnostyki dostarczania
- Jeśli kanał potrzebuje obiektów należących do runtime, takich jak klient, token, aplikacja Bolt lub odbiornik webhooków, zarejestruj je przez `openclaw/plugin-sdk/channel-runtime-context`. Ogólny rejestr kontekstu runtime pozwala rdzeniowi bootstrapować handlery oparte na możliwościach ze stanu uruchomienia kanału bez dodawania glue wrapperów specyficznych dla zatwierdzeń.
- Sięgaj po niższopoziomowe `createChannelApprovalHandler` lub `createChannelNativeApprovalRuntime` tylko wtedy, gdy powierzchnia oparta na możliwościach nie jest jeszcze wystarczająco wyrażalna.
- Kanały z natywnymi zatwierdzeniami muszą przekazywać zarówno `accountId`, jak i `approvalKind` przez te helpery. `accountId` utrzymuje politykę zatwierdzeń dla wielu kont w odpowiednim zakresie konta bota, a `approvalKind` utrzymuje zachowanie zatwierdzeń exec vs plugin dostępne dla kanału bez zakodowanych na sztywno rozgałęzień w rdzeniu.
- Rdzeń odpowiada teraz także za komunikaty o przekierowaniu zatwierdzeń. Pluginy kanałów nie powinny wysyłać własnych wiadomości uzupełniających typu „zatwierdzenie trafiło do DM / innego kanału” z `createChannelNativeApprovalRuntime`; zamiast tego należy udostępnić poprawny routing źródła + DM zatwierdzającego przez współdzielone helpery możliwości zatwierdzeń i pozwolić rdzeniowi agregować rzeczywiste dostarczenia przed opublikowaniem jakiegokolwiek komunikatu z powrotem do czatu inicjującego.
- Zachowuj rodzaj identyfikatora dostarczonego zatwierdzenia od początku do końca. Klienci natywni nie powinni
  zgadywać ani przepisywać routingu zatwierdzeń exec vs plugin na podstawie lokalnego stanu kanału.
- Różne rodzaje zatwierdzeń mogą celowo udostępniać różne powierzchnie natywne.
  Aktualne przykłady bundled:
  - Slack utrzymuje dostępność natywnego routingu zatwierdzeń zarówno dla identyfikatorów exec, jak i plugin.
  - Matrix zachowuje ten sam natywny routing DM/kanału i UX oparty na reakcjach dla zatwierdzeń exec
    i plugin, jednocześnie nadal pozwalając, aby uwierzytelnianie różniło się w zależności od rodzaju zatwierdzenia.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako wrapper zgodności, ale nowy kod powinien preferować builder możliwości i udostępniać `approvalCapability` w pluginie.

Dla gorących punktów wejścia kanału preferuj węższe podścieżki runtime, gdy potrzebujesz tylko
jednej części tej rodziny:

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
`openclaw/plugin-sdk/reply-chunking`, gdy nie potrzebujesz szerszej,
zbiorczej powierzchni.

W przypadku konfiguracji w szczególności:

- `openclaw/plugin-sdk/setup-runtime` obejmuje bezpieczne dla runtime helpery konfiguracji:
  bezpieczne przy importowaniu adaptery łatania konfiguracji (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), wyjście notatek wyszukiwania,
  `promptResolvedAllowFrom`, `splitSetupEntries` oraz buildery
  setup-proxy delegowanych
- `openclaw/plugin-sdk/setup-adapter-runtime` to wąska, świadoma środowiska powierzchnia adaptera
  dla `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje buildery konfiguracji z opcjonalną instalacją
  oraz kilka prymitywów bezpiecznych dla konfiguracji:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jeśli Twój kanał obsługuje konfigurację lub uwierzytelnianie sterowane zmiennymi środowiskowymi i ogólne
przepływy uruchamiania/konfiguracji powinny znać nazwy tych zmiennych przed załadowaniem runtime, zadeklaruj je w
manifeście pluginu przy użyciu `channelEnvVars`. Zachowaj kanałowe `envVars` runtime lub lokalne
stałe tylko dla tekstów skierowanych do operatora.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` oraz
`splitSetupEntries`

- używaj szerszej powierzchni `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz również
  cięższych współdzielonych helperów konfiguracji, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli Twój kanał chce jedynie reklamować w powierzchniach konfiguracji komunikat „najpierw zainstaluj ten plugin”,
preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany
adapter/kreator domyślnie odmawia zapisu konfiguracji i finalizacji oraz ponownie wykorzystuje
ten sam komunikat o wymaganej instalacji w walidacji, finalizacji i tekstach z linkami do dokumentacji.

Dla innych gorących ścieżek kanału preferuj wąskie helpery zamiast szerszych starszych
powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` oraz
  `openclaw/plugin-sdk/account-helpers` dla konfiguracji wielu kont i
  zapasowego użycia konta domyślnego
- `openclaw/plugin-sdk/inbound-envelope` oraz
  `openclaw/plugin-sdk/inbound-reply-dispatch` dla routingu/koperty wejściowej i
  połączenia record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` dla parsowania/dopasowywania celów
- `openclaw/plugin-sdk/outbound-media` oraz
  `openclaw/plugin-sdk/outbound-runtime` dla ładowania multimediów oraz delegatów tożsamości/wysyłania
  wychodzącego
- `openclaw/plugin-sdk/thread-bindings-runtime` dla cyklu życia powiązań wątków
  i rejestracji adapterów
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy nadal wymagany jest
  starszy układ pól ładunku agent/media
- `openclaw/plugin-sdk/telegram-command-config` dla normalizacji niestandardowych poleceń Telegram, walidacji duplikatów/konfliktów oraz stabilnego w razie fallback kontraktu konfiguracji poleceń

Kanały wyłącznie uwierzytelniające zwykle mogą zakończyć na ścieżce domyślnej: rdzeń obsługuje zatwierdzenia, a plugin po prostu udostępnia możliwości outbound/auth. Kanały z natywnymi zatwierdzeniami, takie jak Matrix, Slack, Telegram oraz niestandardowe transporty czatu, powinny używać współdzielonych helperów natywnych zamiast implementować własny cykl życia zatwierdzeń.

## Polityka wzmianek przy wiadomościach przychodzących

Zachowaj obsługę przychodzących wzmianek rozdzieloną na dwie warstwy:

- gromadzenie danych należące do pluginu
- współdzielona ewaluacja polityki

Dla warstwy współdzielonej używaj `openclaw/plugin-sdk/channel-inbound`.

Dobre dopasowanie do logiki lokalnej pluginu:

- wykrywanie odpowiedzi do bota
- wykrywanie cytatu bota
- sprawdzanie uczestnictwa wątku
- wykluczanie wiadomości usługowych/systemowych
- natywne dla platformy pamięci podręczne potrzebne do potwierdzenia udziału bota

Dobre dopasowanie do helpera współdzielonego:

- `requireMention`
- jawny wynik wzmianki
- lista dozwolonych niejawnych wzmianek
- obejście dla poleceń
- ostateczna decyzja o pominięciu

Preferowany przepływ:

1. Oblicz lokalne fakty dotyczące wzmianek.
2. Przekaż te fakty do `resolveInboundMentionDecision({ facts, policy })`.
3. Użyj `decision.effectiveWasMentioned`, `decision.shouldBypassMention` i `decision.shouldSkip` w bramce wiadomości przychodzących.

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
bundled plugins kanałów, które już zależą od wstrzykiwania runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Starsze helpery `resolveMentionGating*` pozostają w
`openclaw/plugin-sdk/channel-inbound` wyłącznie jako eksporty zgodności. Nowy kod
powinien używać `resolveInboundMentionDecision({ facts, policy })`.

## Przewodnik krok po kroku

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    Utwórz standardowe pliki pluginu. Pole `channel` w `package.json`
    sprawia, że jest to plugin kanału. Pełny zakres metadanych pakietu znajdziesz
    w [Konfiguracja pluginu i konfiguracja](/pl/plugins/sdk-setup#openclawchannel):

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

  <Step title="Zbuduj obiekt pluginu kanału">
    Interfejs `ChannelPlugin` ma wiele opcjonalnych powierzchni adapterów. Zacznij od
    minimum — `id` i `setup` — a następnie dodawaj adaptery w miarę potrzeb.

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
      Zamiast ręcznie implementować niskopoziomowe interfejsy adapterów,
      przekazujesz deklaratywne opcje, a builder je składa:

      | Opcja | Co jest podłączane |
      | --- | --- |
      | `security.dm` | Resolver zabezpieczeń DM ograniczony do pól konfiguracji |
      | `pairing.text` | Tekstowy przepływ parowania DM z wymianą kodów |
      | `threading` | Resolver trybu odpowiedzi (stały, ograniczony do konta lub niestandardowy) |
      | `outbound.attachedResults` | Funkcje wysyłania zwracające metadane wyniku (identyfikatory wiadomości) |

      Możesz też przekazać surowe obiekty adapterów zamiast opcji deklaratywnych,
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

    Umieszczaj deskryptory CLI należące do kanału w `registerCliMetadata(...)`, aby OpenClaw
    mógł pokazywać je w głównej pomocy bez aktywowania pełnego runtime kanału,
    podczas gdy zwykłe pełne ładowania nadal pobierają te same deskryptory do rzeczywistej rejestracji
    poleceń. Zachowaj `registerFull(...)` do pracy tylko w runtime.
    Jeśli `registerFull(...)` rejestruje metody Gateway RPC, używaj
    prefiksu specyficznego dla pluginu. Przestrzenie nazw administratora rdzenia (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zastrzeżone i zawsze
    są mapowane na `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje podział trybów rejestracji. Zobacz
    [Punkty wejścia](/pl/plugins/sdk-entrypoints#definechannelpluginentry), aby poznać wszystkie
    opcje.

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
    Twój plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowy wzorzec to webhook, który weryfikuje żądanie i
    dispatchuje je przez handler wejściowy Twojego kanału:

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
      Obsługa wiadomości przychodzących jest specyficzna dla kanału. Każdy plugin kanału
      odpowiada za własny pipeline wejściowy. Sprawdź bundled plugins kanałów
      (na przykład pakiet pluginów Microsoft Teams lub Google Chat), aby zobaczyć rzeczywiste wzorce.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testowanie">
Napisz testy colocated w `src/channel.test.ts`:

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

    Współdzielone helpery testowe znajdziesz w [Testowanie](/pl/plugins/sdk-testing).

  </Step>
</Steps>

## Struktura plików

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadane openclaw.channel
├── openclaw.plugin.json      # Manifest ze schematem konfiguracji
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Publiczne eksporty (opcjonalnie)
├── runtime-api.ts            # Wewnętrzne eksporty runtime (opcjonalnie)
└── src/
    ├── channel.ts            # ChannelPlugin przez createChatChannelPlugin
    ├── channel.test.ts       # Testy
    ├── client.ts             # Klient API platformy
    └── runtime.ts            # Magazyn runtime (jeśli potrzebny)
```

## Tematy zaawansowane

<CardGroup cols={2}>
  <Card title="Opcje wątkowania" icon="git-branch" href="/pl/plugins/sdk-entrypoints#registration-mode">
    Stałe tryby odpowiedzi, ograniczone do konta lub niestandardowe
  </Card>
  <Card title="Integracja narzędzia wiadomości" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i wykrywanie akcji
  </Card>
  <Card title="Rozwiązywanie celu" icon="crosshair" href="/pl/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpery runtime" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, STT, multimedia, subagent przez api.runtime
  </Card>
</CardGroup>

<Note>
Niektóre bundled helper seams nadal istnieją na potrzeby utrzymania bundled plugins i
zgodności. Nie są one zalecanym wzorcem dla nowych pluginów kanałów;
preferuj ogólne podścieżki channel/setup/reply/runtime ze wspólnej
powierzchni SDK, chyba że bezpośrednio utrzymujesz tę rodzinę bundled plugins.
</Note>

## Kolejne kroki

- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — jeśli Twój plugin dostarcza także modele
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełne odniesienie do importów podścieżek
- [Testowanie SDK](/pl/plugins/sdk-testing) — narzędzia testowe i testy kontraktowe
- [Manifest pluginu](/pl/plugins/manifest) — pełny schemat manifestu
