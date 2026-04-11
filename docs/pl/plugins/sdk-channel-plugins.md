---
read_when:
    - Tworzysz nowy plugin kanału wiadomości
    - Chcesz połączyć OpenClaw z platformą komunikacyjną
    - Musisz zrozumieć powierzchnię adaptera ChannelPlugin
sidebarTitle: Channel Plugins
summary: Przewodnik krok po kroku po tworzeniu pluginu kanału wiadomości dla OpenClaw
title: Tworzenie pluginów kanałów
x-i18n:
    generated_at: "2026-04-11T02:46:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8a026e924f9ae8a3ddd46287674443bcfccb0247be504261522b078e1f440aef
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Tworzenie pluginów kanałów

Ten przewodnik przeprowadza przez tworzenie pluginu kanału, który łączy OpenClaw z
platformą komunikacyjną. Na końcu będziesz mieć działający kanał z zabezpieczeniami DM,
parowaniem, wątkowaniem odpowiedzi i wiadomościami wychodzącymi.

<Info>
  Jeśli nie utworzono jeszcze żadnego pluginu OpenClaw,
  najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową
  strukturę pakietu i konfigurację manifestu.
</Info>

## Jak działają pluginy kanałów

Pluginy kanałów nie potrzebują własnych narzędzi send/edit/react. OpenClaw utrzymuje jedno
wspólne narzędzie `message` w rdzeniu. Twój plugin odpowiada za:

- **Konfigurację** — rozstrzyganie kont i kreator konfiguracji
- **Bezpieczeństwo** — politykę DM i listy dozwolonych
- **Parowanie** — przepływ zatwierdzania DM
- **Gramatykę sesji** — sposób, w jaki identyfikatory konwersacji specyficzne dla dostawcy mapują się na czaty bazowe, identyfikatory wątków i zapasowe elementy nadrzędne
- **Ruch wychodzący** — wysyłanie tekstu, multimediów i ankiet na platformę
- **Wątkowanie** — sposób wątkowania odpowiedzi

Rdzeń odpowiada za wspólne narzędzie wiadomości, łączenie monitów, zewnętrzny kształt klucza sesji,
ogólne księgowanie `:thread:` i wysyłkę.

Jeśli twoja platforma przechowuje dodatkowy zakres w identyfikatorach konwersacji, zachowaj to parsowanie
w pluginie za pomocą `messaging.resolveSessionConversation(...)`. To jest
kanoniczny hook do mapowania `rawId` na bazowy identyfikator konwersacji, opcjonalny identyfikator wątku,
jawny `baseConversationId` i dowolne `parentConversationCandidates`.
Gdy zwracasz `parentConversationCandidates`, zachowaj ich kolejność od
najwęższego elementu nadrzędnego do najszerszej/bazowej konwersacji.

Bundlowane pluginy, które potrzebują tego samego parsowania przed uruchomieniem rejestru kanałów,
mogą też udostępniać plik najwyższego poziomu `session-key-api.ts` z pasującym
eksportem `resolveSessionConversation(...)`. Rdzeń używa tej bezpiecznej dla bootstrapu powierzchni
tylko wtedy, gdy rejestr pluginów środowiska uruchomieniowego nie jest jeszcze dostępny.

`messaging.resolveParentConversationCandidates(...)` pozostaje dostępne jako
starszy awaryjny mechanizm zgodności, gdy plugin potrzebuje tylko zapasowych elementów nadrzędnych
na bazie ogólnego/surowego identyfikatora. Jeśli istnieją oba hooki, rdzeń używa najpierw
`resolveSessionConversation(...).parentConversationCandidates`, a do
`resolveParentConversationCandidates(...)` wraca tylko wtedy, gdy hook kanoniczny
ich nie zwraca.

## Zatwierdzenia i możliwości kanału

Większość pluginów kanałów nie potrzebuje kodu specyficznego dla zatwierdzeń.

- Rdzeń odpowiada za `/approve` w tym samym czacie, wspólne ładunki przycisków zatwierdzania oraz ogólne dostarczanie awaryjne.
- Gdy kanał potrzebuje zachowania specyficznego dla zatwierdzeń, preferuj pojedynczy obiekt `approvalCapability` w pluginie kanału.
- `ChannelPlugin.approvals` zostało usunięte. Fakty dotyczące dostarczania/renderowania/natywności/uwierzytelniania zatwierdzeń umieszczaj w `approvalCapability`.
- `plugin.auth` służy tylko do login/logout; rdzeń nie odczytuje już hooków uwierzytelniania zatwierdzeń z tego obiektu.
- `approvalCapability.authorizeActorAction` oraz `approvalCapability.getActionAvailabilityState` to kanoniczna powierzchnia dla uwierzytelniania zatwierdzeń.
- Użyj `approvalCapability.getActionAvailabilityState` dla dostępności uwierzytelniania zatwierdzeń w tym samym czacie.
- Jeśli kanał udostępnia natywne zatwierdzanie exec, użyj `approvalCapability.getExecInitiatingSurfaceState` dla stanu powierzchni inicjującej/klienta natywnego, gdy różni się od uwierzytelniania zatwierdzeń w tym samym czacie. Rdzeń używa tego hooka specyficznego dla exec, aby odróżnić `enabled` od `disabled`, zdecydować, czy kanał inicjujący obsługuje natywne zatwierdzenia exec, i uwzględnić kanał w instrukcjach awaryjnych dla klienta natywnego. `createApproverRestrictedNativeApprovalCapability(...)` wypełnia to dla typowego przypadku.
- Użyj `outbound.shouldSuppressLocalPayloadPrompt` lub `outbound.beforeDeliverPayload` dla zachowań cyklu życia ładunku specyficznych dla kanału, takich jak ukrywanie zduplikowanych lokalnych monitów zatwierdzania lub wysyłanie wskaźników pisania przed dostarczeniem.
- Używaj `approvalCapability.delivery` tylko do natywnego routingu zatwierdzeń lub tłumienia dostarczania awaryjnego.
- Używaj `approvalCapability.nativeRuntime` dla natywnych faktów zatwierdzania należących do kanału. Utrzymuj je w trybie lazy na gorących entrypointach kanału za pomocą `createLazyChannelApprovalNativeRuntimeAdapter(...)`, które może importować moduł środowiska uruchomieniowego na żądanie, jednocześnie pozwalając rdzeniowi złożyć cykl życia zatwierdzania.
- Używaj `approvalCapability.render` tylko wtedy, gdy kanał rzeczywiście potrzebuje własnych ładunków zatwierdzania zamiast wspólnego renderera.
- Użyj `approvalCapability.describeExecApprovalSetup`, gdy kanał chce, aby odpowiedź dla ścieżki wyłączonej wyjaśniała dokładnie, jakie przełączniki konfiguracji są potrzebne do włączenia natywnych zatwierdzeń exec. Hook otrzymuje `{ channel, channelLabel, accountId }`; kanały z nazwanymi kontami powinny renderować ścieżki ograniczone do konta, takie jak `channels.<channel>.accounts.<id>.execApprovals.*`, zamiast domyślnych ścieżek najwyższego poziomu.
- Jeśli kanał potrafi wywnioskować stabilne tożsamości DM podobne do właściciela z istniejącej konfiguracji, użyj `createResolvedApproverActionAuthAdapter` z `openclaw/plugin-sdk/approval-runtime`, aby ograniczyć `/approve` w tym samym czacie bez dodawania logiki specyficznej dla zatwierdzeń do rdzenia.
- Jeśli kanał potrzebuje natywnego dostarczania zatwierdzeń, utrzymuj kod kanału skupiony na normalizacji celu oraz faktach dotyczących transportu/prezentacji. Użyj `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` i `createApproverRestrictedNativeApprovalCapability` z `openclaw/plugin-sdk/approval-runtime`. Fakty specyficzne dla kanału umieść za `approvalCapability.nativeRuntime`, najlepiej przez `createChannelApprovalNativeRuntimeAdapter(...)` lub `createLazyChannelApprovalNativeRuntimeAdapter(...)`, aby rdzeń mógł złożyć obsługę i przejąć filtrowanie żądań, routing, deduplikację, wygasanie, subskrypcję bramy oraz komunikaty „przekierowano gdzie indziej”. `nativeRuntime` jest podzielone na kilka mniejszych powierzchni:
- `availability` — czy konto jest skonfigurowane i czy żądanie powinno zostać obsłużone
- `presentation` — mapowanie wspólnego modelu widoku zatwierdzenia na oczekujące/rozstrzygnięte/wygasłe ładunki natywne lub działania końcowe
- `transport` — przygotowanie celów oraz wysyłanie/aktualizowanie/usuwanie natywnych wiadomości zatwierdzania
- `interactions` — opcjonalne hooki bind/unbind/clear-action dla natywnych przycisków lub reakcji
- `observe` — opcjonalne hooki diagnostyki dostarczania
- Jeśli kanał potrzebuje obiektów należących do środowiska uruchomieniowego, takich jak klient, token, aplikacja Bolt lub odbiornik webhooka, zarejestruj je przez `openclaw/plugin-sdk/channel-runtime-context`. Ogólny rejestr runtime-context pozwala rdzeniowi uruchamiać handlery oparte na możliwościach na podstawie stanu startowego kanału bez dodawania kodu klejącego specyficznego dla zatwierdzeń.
- Sięgaj po niższopoziomowe `createChannelApprovalHandler` lub `createChannelNativeApprovalRuntime` tylko wtedy, gdy powierzchnia oparta na możliwościach nie jest jeszcze wystarczająco ekspresyjna.
- Kanały z natywnymi zatwierdzeniami muszą przekazywać przez te helpery zarówno `accountId`, jak i `approvalKind`. `accountId` utrzymuje politykę zatwierdzeń dla wielu kont w zakresie właściwego konta bota, a `approvalKind` utrzymuje zachowanie zatwierdzeń exec vs plugin dostępne dla kanału bez zakodowanych na sztywno gałęzi w rdzeniu.
- Rdzeń odpowiada teraz także za komunikaty o przekierowaniu zatwierdzeń. Pluginy kanałów nie powinny wysyłać własnych wiadomości uzupełniających typu „zatwierdzenie trafiło do DM / innego kanału” z `createChannelNativeApprovalRuntime`; zamiast tego udostępnij poprawny routing pochodzenia + DM zatwierdzającego przez wspólne helpery możliwości zatwierdzania i pozwól rdzeniowi agregować rzeczywiste dostarczenia przed opublikowaniem ewentualnego komunikatu z powrotem do czatu inicjującego.
- Zachowuj rodzaj dostarczonego identyfikatora zatwierdzenia od początku do końca. Klienci natywni nie powinni
  zgadywać ani przepisywać routingu zatwierdzeń exec vs plugin na podstawie lokalnego stanu kanału.
- Różne rodzaje zatwierdzeń mogą celowo udostępniać różne powierzchnie natywne.
  Bieżące przykłady bundlowane:
  - Slack zachowuje dostępny natywny routing zatwierdzeń zarówno dla identyfikatorów exec, jak i plugin.
  - Matrix utrzymuje ten sam natywny routing DM/kanał i UX reakcji dla zatwierdzeń exec
    i plugin, jednocześnie pozwalając, by uwierzytelnianie różniło się zależnie od rodzaju zatwierdzenia.
- `createApproverRestrictedNativeApprovalAdapter` nadal istnieje jako opakowanie zgodności, ale nowy kod powinien preferować konstruktor możliwości i udostępniać `approvalCapability` w pluginie.

Dla gorących entrypointów kanału preferuj węższe podścieżki środowiska uruchomieniowego, gdy potrzebujesz tylko
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
`openclaw/plugin-sdk/reply-chunking`, gdy nie potrzebujesz szerszej
powierzchni parasolowej.

Konkretnie dla konfiguracji:

- `openclaw/plugin-sdk/setup-runtime` obejmuje bezpieczne dla środowiska uruchomieniowego helpery konfiguracji:
  bezpieczne przy imporcie adaptery łatania konfiguracji (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), dane wyjściowe notatek lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` oraz delegowane
  konstruktory proxy konfiguracji
- `openclaw/plugin-sdk/setup-adapter-runtime` to wąska, świadoma środowiska surface adaptera
  dla `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` obejmuje konstruktory konfiguracji z opcjonalną instalacją
  oraz kilka prymitywów bezpiecznych dla konfiguracji:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jeśli twój kanał obsługuje konfigurację lub uwierzytelnianie sterowane przez env, a ogólne przepływy uruchamiania/konfiguracji
powinny znać te nazwy zmiennych env przed załadowaniem środowiska uruchomieniowego, zadeklaruj je w
manifeście pluginu za pomocą `channelEnvVars`. Zachowaj runtime `envVars` kanału lub lokalne
stałe wyłącznie dla tekstów operatora.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` oraz
`splitSetupEntries`

- używaj szerszej powierzchni `openclaw/plugin-sdk/setup` tylko wtedy, gdy potrzebujesz także
  cięższych wspólnych helperów konfiguracji/ustawień, takich jak
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jeśli kanał chce tylko reklamować „najpierw zainstaluj ten plugin” w powierzchniach konfiguracji,
preferuj `createOptionalChannelSetupSurface(...)`. Wygenerowany
adapter/kreator domyślnie blokuje zapis konfiguracji i finalizację, a także ponownie używa
tego samego komunikatu o wymaganej instalacji w walidacji, finalizacji i tekstach z linkiem do dokumentacji.

Dla innych gorących ścieżek kanału preferuj wąskie helpery zamiast szerszych starszych
powierzchni:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` oraz
  `openclaw/plugin-sdk/account-helpers` dla konfiguracji wielu kont i
  awaryjnego powrotu do konta domyślnego
- `openclaw/plugin-sdk/inbound-envelope` oraz
  `openclaw/plugin-sdk/inbound-reply-dispatch` dla routingu/koperty wejściowej i
  łączenia zapisu z wysyłką
- `openclaw/plugin-sdk/messaging-targets` do parsowania/dopasowywania celów
- `openclaw/plugin-sdk/outbound-media` oraz
  `openclaw/plugin-sdk/outbound-runtime` do ładowania multimediów oraz delegatów
  tożsamości/wysyłania wychodzącego
- `openclaw/plugin-sdk/thread-bindings-runtime` dla cyklu życia powiązań wątków
  i rejestracji adapterów
- `openclaw/plugin-sdk/agent-media-payload` tylko wtedy, gdy nadal wymagany jest
  starszy układ pól ładunku agenta/multimediów
- `openclaw/plugin-sdk/telegram-command-config` do normalizacji niestandardowych poleceń Telegram,
  walidacji duplikatów/konfliktów oraz stabilnego awaryjnie kontraktu konfiguracji poleceń

Kanały wyłącznie uwierzytelniające zwykle mogą zatrzymać się na ścieżce domyślnej: rdzeń obsługuje zatwierdzenia, a plugin jedynie udostępnia możliwości outbound/auth. Kanały z natywnymi zatwierdzeniami, takie jak Matrix, Slack, Telegram i niestandardowe transporty czatu, powinny używać wspólnych helperów natywnych zamiast implementować własny cykl życia zatwierdzeń.

## Polityka wzmianek przychodzących

Obsługę wzmianek przychodzących utrzymuj rozdzieloną na dwie warstwy:

- gromadzenie danych należące do pluginu
- współdzieloną ocenę polityki

Dla warstwy współdzielonej używaj `openclaw/plugin-sdk/channel-inbound`.

Dobre zastosowania dla logiki lokalnej pluginu:

- wykrywanie odpowiedzi do bota
- wykrywanie cytatu bota
- sprawdzanie uczestnictwa w wątku
- wykluczenia wiadomości usługowych/systemowych
- natywne dla platformy pamięci podręczne potrzebne do potwierdzenia uczestnictwa bota

Dobre zastosowania dla wspólnego helpera:

- `requireMention`
- jawny wynik wzmianki
- lista dozwolonych wzmianek niejawnych
- obejście dla poleceń
- końcowa decyzja o pominięciu

Preferowany przepływ:

1. Oblicz lokalne fakty dotyczące wzmianki.
2. Przekaż te fakty do `resolveInboundMentionDecision({ facts, policy })`.
3. Użyj `decision.effectiveWasMentioned`, `decision.shouldBypassMention` i `decision.shouldSkip` w bramce wejściowej.

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

`api.runtime.channel.mentions` udostępnia te same wspólne helpery wzmiankowania dla
bundlowanych pluginów kanałów, które już zależą od wstrzykiwania środowiska uruchomieniowego:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Starsze helpery `resolveMentionGating*` pozostają w
`openclaw/plugin-sdk/channel-inbound` wyłącznie jako eksporty zgodności. Nowy kod
powinien używać `resolveInboundMentionDecision({ facts, policy })`.

## Instrukcja krok po kroku

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    Utwórz standardowe pliki pluginu. Pole `channel` w `package.json` sprawia,
    że jest to plugin kanału. Aby zobaczyć pełną powierzchnię metadanych pakietu,
    zobacz [Konfiguracja pluginu i ustawienia](/pl/plugins/sdk-setup#openclaw-channel):

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
    minimum — `id` i `setup` — a następnie dodawaj adaptery według potrzeb.

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
      opcje deklaratywne, a konstruktor je składa:

      | Opcja | Co jest podłączane |
      | --- | --- |
      | `security.dm` | Resolver bezpieczeństwa DM ograniczony do konfiguracji pól |
      | `pairing.text` | Tekstowy przepływ parowania DM z wymianą kodu |
      | `threading` | Resolver trybu reply-to (stały, ograniczony do konta lub niestandardowy) |
      | `outbound.attachedResults` | Funkcje wysyłania, które zwracają metadane wyniku (identyfikatory wiadomości) |

      Możesz także przekazać surowe obiekty adapterów zamiast opcji deklaratywnych,
      jeśli potrzebujesz pełnej kontroli.
    </Accordion>

  </Step>

  <Step title="Podłącz entrypoint">
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
    mógł pokazywać je w pomocy głównej bez aktywowania pełnego środowiska uruchomieniowego kanału,
    podczas gdy zwykłe pełne ładowanie nadal pobiera te same deskryptory do rzeczywistej
    rejestracji poleceń. Zachowaj `registerFull(...)` dla prac tylko środowiska uruchomieniowego.
    Jeśli `registerFull(...)` rejestruje metody RPC bramy, użyj
    prefiksu specyficznego dla pluginu. Przestrzenie nazw administracyjnych rdzenia (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze
    są rozstrzygane do `operator.admin`.
    `defineChannelPluginEntry` automatycznie obsługuje podział trybu rejestracji. Zobacz
    [Entry Points](/pl/plugins/sdk-entrypoints#definechannelpluginentry), aby poznać wszystkie
    opcje.

  </Step>

  <Step title="Dodaj entry konfiguracji">
    Utwórz `setup-entry.ts` do lekkiego ładowania podczas onboardingu:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw ładuje to zamiast pełnego entry, gdy kanał jest wyłączony
    lub nieskonfigurowany. Pozwala to uniknąć pobierania ciężkiego kodu środowiska uruchomieniowego podczas przepływów konfiguracji.
    Szczegóły znajdziesz w [Konfiguracja i ustawienia](/pl/plugins/sdk-setup#setup-entry).

  </Step>

  <Step title="Obsłuż wiadomości przychodzące">
    Twój plugin musi odbierać wiadomości z platformy i przekazywać je do
    OpenClaw. Typowy wzorzec to webhook, który weryfikuje żądanie i
    wysyła je przez handler wejściowy twojego kanału:

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
      Obsługa wiadomości przychodzących jest specyficzna dla kanału. Każdy plugin kanału odpowiada
      za własny potok wejściowy. Zobacz bundlowane pluginy kanałów
      (na przykład pakiet pluginu Microsoft Teams lub Google Chat), aby poznać rzeczywiste wzorce.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testy">
Napisz testy współlokowane w `src/channel.test.ts`:

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

    Informacje o współdzielonych helperach testowych znajdziesz w [Testowanie](/pl/plugins/sdk-testing).

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
├── runtime-api.ts            # Wewnętrzne eksporty środowiska uruchomieniowego (opcjonalnie)
└── src/
    ├── channel.ts            # ChannelPlugin przez createChatChannelPlugin
    ├── channel.test.ts       # Testy
    ├── client.ts             # Klient API platformy
    └── runtime.ts            # Magazyn środowiska uruchomieniowego (w razie potrzeby)
```

## Tematy zaawansowane

<CardGroup cols={2}>
  <Card title="Opcje wątkowania" icon="git-branch" href="/pl/plugins/sdk-entrypoints#registration-mode">
    Stałe, ograniczone do konta lub niestandardowe tryby odpowiedzi
  </Card>
  <Card title="Integracja z narzędziem wiadomości" icon="puzzle" href="/pl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool i wykrywanie działań
  </Card>
  <Card title="Rozstrzyganie celu" icon="crosshair" href="/pl/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpery środowiska uruchomieniowego" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, STT, multimedia, podagent przez api.runtime
  </Card>
</CardGroup>

<Note>
Niektóre bundlowane powierzchnie helperów nadal istnieją na potrzeby utrzymania bundlowanych pluginów i
zgodności. Nie są one zalecanym wzorcem dla nowych pluginów kanałów;
preferuj ogólne podścieżki channel/setup/reply/runtime ze wspólnej
powierzchni SDK, chyba że bezpośrednio utrzymujesz tę rodzinę bundlowanych pluginów.
</Note>

## Kolejne kroki

- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — jeśli twój plugin udostępnia także modele
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełna dokumentacja importów podścieżek
- [Testowanie SDK](/pl/plugins/sdk-testing) — narzędzia testowe i testy kontraktowe
- [Manifest pluginu](/pl/plugins/manifest) — pełny schemat manifestu
