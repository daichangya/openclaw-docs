---
read_when:
    - Ви створюєте новий Plugin каналу повідомлень
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення Plugin-а каналу повідомлень для OpenClaw
title: Створення Plugin-ів каналів
x-i18n:
    generated_at: "2026-04-23T23:03:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8829432f3d9671f7ab5a8fec6683e52ae363990aa4c7962dfbdda061d4b1b6c9
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Цей посібник покроково пояснює, як створити Plugin каналу, що підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці у вас буде робочий канал із безпекою DM,
сполученням, потоками відповідей і вихідним обміном повідомленнями.

<Info>
  Якщо ви ще не створювали жодного Plugin-а OpenClaw, спершу прочитайте
  [Початок роботи](/uk/plugins/building-plugins) про базову структуру пакета
  та налаштування manifest.
</Info>

## Як працюють Plugin-и каналів

Plugin-ам каналів не потрібні власні інструменти send/edit/react. OpenClaw зберігає один
спільний інструмент `message` у core. Ваш Plugin відповідає за:

- **Конфігурацію** — визначення облікового запису та майстер налаштування
- **Безпеку** — політику DM і списки дозволених
- **Сполучення** — процес підтвердження DM
- **Граматику сесії** — як специфічні для провайдера id розмов відображаються на базові чати, id потоків і резервні батьківські значення
- **Вихідний потік** — надсилання тексту, медіа та poll на платформу
- **Потоковість** — як організовано потоки відповідей
- **Набір Heartbeat** — необов’язкові сигнали typing/busy для цілей доставки Heartbeat

Core володіє спільним інструментом повідомлень, wiring prompt-ів, зовнішньою формою ключа сесії,
загальним обліком `:thread:` і диспетчеризацією.

Якщо ваш канал підтримує індикатори набору поза вхідними відповідями, відкрийте
`heartbeat.sendTyping(...)` у Plugin каналу. Core викликає його з визначеною
ціллю доставки Heartbeat до початку запуску моделі Heartbeat і
використовує спільний життєвий цикл typing keepalive/cleanup. Додайте `heartbeat.clearTyping(...)`,
коли платформі потрібен явний сигнал зупинки.

Якщо ваш канал додає params інструмента повідомлень, що містять джерела медіа, відкрийте ці
назви param через `describeMessageTool(...).mediaSourceParams`. Core використовує
цей явний список для нормалізації шляхів sandbox і політики доступу до вихідних медіа,
тому Plugin-ам не потрібні спеціальні випадки в shared core для специфічних для провайдера
params аватарів, вкладень або обкладинок.
Надавайте перевагу поверненню map із ключем дії, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб несуміжні дії не
успадковували аргументи медіа іншої дії. Плоский масив також працює для params, які
навмисно спільні для кожної відкритої дії.

Якщо ваша платформа зберігає додатковий scope всередині id розмов, залишайте цей парсинг
у Plugin-і за допомогою `messaging.resolveSessionConversation(...)`. Це канонічний hook
для відображення `rawId` на базовий id розмови, необов’язковий id потоку,
явний `baseConversationId` і будь-які `parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їхній порядок від
найвужчого батьківського до найширшої/базової розмови.

Вбудовані Plugin-и, яким потрібен той самий парсинг до запуску реєстру каналів,
також можуть відкривати файл верхнього рівня `session-key-api.ts` із відповідним
експортом `resolveSessionConversation(...)`. Core використовує цю безпечну для bootstrap поверхню
лише тоді, коли реєстр Plugin-ів runtime ще недоступний.

`messaging.resolveParentConversationCandidates(...)` лишається доступним як legacy fallback для сумісності, коли Plugin-у потрібні лише батьківські резервні значення поверх
загального/сирого id. Якщо існують обидва hook-и, core спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і лише потім
переходить до `resolveParentConversationCandidates(...)`, коли канонічний hook
не повертає їх.

## Підтвердження та можливості каналу

Більшості Plugin-ів каналів не потрібен код, специфічний для підтверджень.

- Core володіє `/approve` у тому самому чаті, спільними payload кнопок підтвердження та загальною резервною доставкою.
- Надавайте перевагу одному об’єкту `approvalCapability` у Plugin-і каналу, коли каналу потрібна поведінка, специфічна для підтверджень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти доставки/native/render/auth для підтверджень у `approvalCapability`.
- `plugin.auth` — лише для login/logout; core більше не читає hook-и auth підтверджень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — канонічний шов approval-auth.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності auth підтверджень у тому самому чаті.
- Якщо ваш канал відкриває native exec-підтвердження, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану initiating-surface/native-client, коли він відрізняється від auth підтверджень у тому самому чаті. Core використовує цей exec-специфічний hook, щоб розрізняти `enabled` і `disabled`, визначати, чи підтримує ініціювальний канал native exec-підтвердження, і включати канал до резервних вказівок native-client. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для специфічної для каналу поведінки життєвого циклу payload, наприклад приховування дубльованих локальних prompt-ів підтвердження або надсилання індикаторів typing перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для native-маршрутизації підтверджень або пригнічення fallback.
- Використовуйте `approvalCapability.nativeRuntime` для фактів native-підтверджень, що належать каналу. Тримайте його лінивим на гарячих точках входу каналу через `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш runtime module за потреби, водночас дозволяючи core збирати життєвий цикл підтвердження.
- Використовуйте `approvalCapability.render` лише коли каналу справді потрібні користувацькі payload підтверджень замість спільного renderer.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь для вимкненого шляху пояснювала точні параметри config, потрібні для ввімкнення native exec-підтверджень. Hook отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають відображати шляхи з scope облікового запису, наприклад `channels.<channel>.accounts.<id>.execApprovals.*`, а не верхньорівневі типові значення.
- Якщо канал може виводити стабільні DM-ідентичності, подібні до власника, з наявної config, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання специфічної для підтверджень логіки в core.
- Якщо каналу потрібна native-доставка підтверджень, тримайте код каналу зосередженим на нормалізації цілі плюс фактах транспорту/представлення. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте специфічні для каналу факти за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб core міг зібрати handler і володіти фільтрацією запитів, маршрутизацією, dedupe, терміном дії, підпискою gateway та повідомленнями “маршрутизовано в інше місце”. `nativeRuntime` поділено на кілька менших швів:
- `availability` — чи налаштовано обліковий запис і чи слід обробляти запит
- `presentation` — відобразити спільну view model підтвердження у native payload pending/resolved/expired або фінальні дії
- `transport` — підготувати цілі плюс надсилати/оновлювати/видаляти native-повідомлення підтверджень
- `interactions` — необов’язкові hook-и bind/unbind/clear-action для native-кнопок або реакцій
- `observe` — необов’язкові hook-и діагностики доставки
- Якщо каналу потрібні об’єкти, що належать runtime, такі як клієнт, token, застосунок Bolt або приймач Webhook, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-context дозволяє core виконувати bootstrap handler-ів на основі capability зі стану запуску каналу без додавання специфічного для підтверджень wrapper glue.
- Звертайтеся до нижчорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише коли шов, керований capability, ще недостатньо виразний.
- Native-канали підтверджень мають маршрутизувати і `accountId`, і `approvalKind` через ці helper-и. `accountId` зберігає scope політики підтверджень для кількох облікових записів прив’язаним до правильного облікового запису бота, а `approvalKind` зберігає поведінку exec vs plugin approval доступною каналу без жорстко закодованих гілок у core.
- Тепер core також володіє повідомленнями про перенаправлення підтверджень. Plugin-и каналів не повинні надсилати власні подальші повідомлення на кшталт "підтвердження пішло в DM / інший канал" з `createChannelNativeApprovalRuntime`; натомість відкривайте точну маршрутизацію origin + approver-DM через спільні helper-и approval capability і дозвольте core агрегувати фактичні доставки перед публікацією будь-якого повідомлення назад в ініціювальний чат.
- Зберігайте вид доставленого id підтвердження end-to-end. Native-клієнти не повинні
  вгадувати або переписувати маршрутизацію exec vs plugin approval зі стану, локального для каналу.
- Різні види підтверджень можуть навмисно відкривати різні native-поверхні.
  Поточні приклади вбудованих:
  - Slack зберігає native-маршрутизацію підтверджень доступною як для exec-, так і для plugin-id.
  - Matrix зберігає ту саму native-маршрутизацію DM/каналу й UX реакцій для exec
    і plugin-підтверджень, водночас дозволяючи auth відрізнятися за видом підтвердження.
- `createApproverRestrictedNativeApprovalAdapter` і далі існує як wrapper сумісності, але новий код має надавати перевагу builder-у capability і відкривати `approvalCapability` у Plugin-і.

Для гарячих точок входу каналу надавайте перевагу вужчим runtime-підшляхам, коли вам потрібна лише
одна частина цієї родини:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Так само надавайте перевагу `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` і
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша umbrella-
поверхня.

Окремо для setup:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime helper-и setup:
  безпечні для імпорту адаптери patch setup (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  builder-и setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузький env-aware adapter-
  шов для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює builder-и setup для необов’язкового встановлення плюс кілька setup-safe примітивів:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує setup або auth, керовані env, і загальні startup/config
потоки мають знати ці назви env до завантаження runtime, оголосіть їх у
manifest Plugin-а через `channelEnvVars`. Тримайте runtime `envVars` каналу або локальні
константи лише для operator-facing copy.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status` або під час сканування SecretRef до запуску runtime Plugin-а, додайте `openclaw.setupEntry` у `package.json`. Ця точка входу має бути безпечною для імпорту в шляхах команд лише для читання і має повертати метадані каналу, adapter config, безпечний для setup, adapter status і метадані цілей secret каналу, потрібні для цих підсумків. Не запускайте клієнти, listener-и чи transport runtime з точки входу setup.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, і
`splitSetupEntries`

- використовуйте ширший шов `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні helper-и setup/config, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал лише хоче показувати "спершу встановіть цей Plugin" у поверхнях
setup, надавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенеровані
adapter/wizard закриваються безпечно при записах config і finalization та повторно використовують
те саме повідомлення про потрібне встановлення для validation, finalize і копії з посиланням на docs.

Для інших гарячих шляхів каналу надавайте перевагу вузьким helper-ам замість ширших legacy-
поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для багатокористувацької config та
  fallback до типового облікового запису
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для вхідного маршруту/envelope і
  wiring запису та диспетчеризації
- `openclaw/plugin-sdk/messaging-targets` для парсингу/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа плюс outbound
  delegates ідентичності/надсилання та планування payload
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли outbound-маршрут має зберігати
  явний `replyToId`/`threadId` або відновлювати поточну сесію `:thread:`,
  якщо базовий ключ сесії все ще збігається. Plugin-и провайдерів можуть перевизначати
  пріоритет, поведінку суфіксів і нормалізацію id потоку, коли їхня платформа
  має native-семантику доставки в потоки.
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу прив’язок потоків
  і реєстрації adapter
- `openclaw/plugin-sdk/agent-media-payload` лише коли все ще потрібна legacy-структура полів
  payload агента/медіа
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації користувацьких команд Telegram, перевірки дублювань/конфліктів і стабільного щодо fallback контракту config команд

Канали лише з auth зазвичай можуть зупинитися на типовому шляху: core обробляє підтвердження, а Plugin лише відкриває outbound/auth capabilities. Native-канали підтверджень, такі як Matrix, Slack, Telegram і користувацькі chat-транспорти, мають використовувати спільні native-helper-и замість створення власного життєвого циклу підтверджень.

## Політика вхідних згадок

Тримайте обробку вхідних згадок розділеною на два шари:

- збирання фактів, що належать Plugin-у
- оцінювання спільної політики

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень щодо політики згадок.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише коли вам потрібен ширший
barrel helper-ів для вхідного потоку.

Добре підходить для локальної логіки Plugin-а:

- виявлення reply-to-bot
- виявлення quoted-bot
- перевірки участі в потоці
- виключення службових/системних повідомлень
- специфічні для платформи native-кеші, потрібні для доведення участі бота

Добре підходить для спільного helper:

- `requireMention`
- явний результат згадки
- allowlist неявних згадок
- обхід через команду
- фінальне рішення про пропуск

Бажаний потік:

1. Обчисліть локальні факти згадок.
2. Передайте ці факти в `resolveInboundMentionDecision({ facts, policy })`.
3. Використовуйте `decision.effectiveWasMentioned`, `decision.shouldBypassMention` і `decision.shouldSkip` у своєму вхідному gate.

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

`api.runtime.channel.mentions` відкриває ті самі спільні helper-и для згадок
для вбудованих Plugin-ів каналів, які вже залежать від ін’єкції runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте їх із
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження не пов’язаних helper-ів
runtime для вхідного потоку.

Старіші helper-и `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як експорт сумісності. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і manifest">
    Створіть стандартні файли Plugin-а. Поле `channel` у `package.json`
    робить цей Plugin Plugin-ом каналу. Повну поверхню метаданих пакета див. у
    [Налаштування Plugin-а і Config](/uk/plugins/sdk-setup#openclaw-channel):

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
      "description": "Plugin каналу Acme Chat",
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

  <Step title="Створіть об’єкт Plugin-а каналу">
    Інтерфейс `ChannelPlugin` має багато необов’язкових adapter-поверхонь. Почніть із
    мінімуму — `id` і `setup` — і додавайте adapter-и за потреби.

    Створіть `src/channel.ts`:

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

    <Accordion title="Що `createChatChannelPlugin` робить для вас">
      Замість ручної реалізації низькорівневих інтерфейсів adapter, ви передаєте
      декларативні параметри, а builder компонуватиме їх:

      | Параметр | Що він підключає |
      | --- | --- |
      | `security.dm` | Визначення scoped DM security з полів config |
      | `pairing.text` | Текстовий процес сполучення DM з обміном кодами |
      | `threading` | Визначення режиму reply-to (фіксований, scoped до облікового запису або користувацький) |
      | `outbound.attachedResults` | Функції надсилання, які повертають метадані результату (id повідомлень) |

      Ви також можете передавати сирі об’єкти adapter замість декларативних параметрів,
      якщо вам потрібен повний контроль.
    </Accordion>

  </Step>

  <Step title="Підключіть точку входу">
    Створіть `index.ts`:

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

    Розміщуйте CLI-descriptors, що належать каналу, у `registerCliMetadata(...)`, щоб OpenClaw
    міг показувати їх у довідці кореневого рівня без активації повного runtime каналу,
    тоді як звичайні повні завантаження все одно підхоплюватимуть ті самі descriptors для реєстрації
    реальних команд. Залишайте `registerFull(...)` для роботи лише на рівні runtime.
    Якщо `registerFull(...)` реєструє gateway RPC-методи, використовуйте
    префікс, специфічний для Plugin-а. Простори імен адміністратора core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими і завжди
    визначаються як `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє поділ за режимами реєстрації. Усі
    параметри див. в [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Додайте точку входу setup">
    Створіть `setup-entry.ts` для легкого завантаження під час онбордингу:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнено
    або не налаштовано. Це дозволяє уникнути підключення важкого коду runtime під час потоків setup.
    Подробиці див. у [Setup і Config](/uk/plugins/sdk-setup#setup-entry).

    Вбудовані канали робочого простору, які розділяють setup-safe експорти в sidecar-
    module-и, можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний setter runtime на етапі setup.

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш Plugin має отримувати повідомлення з платформи й передавати їх до
    OpenClaw. Типовий шаблон — це Webhook, який перевіряє запит і
    диспетчеризує його через inbound-handler вашого каналу:

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
      Обробка вхідних повідомлень є специфічною для каналу. Кожен Plugin каналу
      володіє власним inbound-конвеєром. Подивіться на вбудовані Plugin-и каналів
      (наприклад, пакет Plugin-а Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Тестування">
Пишіть colocated-тести у `src/channel.test.ts`:

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

    Спільні helper-и тестування див. у [Testing](/uk/plugins/sdk-testing).

  </Step>
</Steps>

## Структура файлів

```
<bundled-plugin-root>/acme-chat/
├── package.json              # Метадані openclaw.channel
├── openclaw.plugin.json      # Manifest зі схемою config
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Публічні експорти (необов’язково)
├── runtime-api.ts            # Внутрішні експорти runtime (необов’язково)
└── src/
    ├── channel.ts            # ChannelPlugin через createChatChannelPlugin
    ├── channel.test.ts       # Тести
    ├── client.ts             # API-клієнт платформи
    └── runtime.ts            # Сховище runtime (за потреби)
```

## Розширені теми

<CardGroup cols={2}>
  <Card title="Параметри потоків" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані, scoped до облікового запису або користувацькі режими reply
  </Card>
  <Card title="Інтеграція інструмента повідомлень" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, субагент через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі шви helper-ів для вбудованих Plugin-ів усе ще існують для підтримки та
сумісності вбудованих Plugin-ів. Це не рекомендований шаблон для нових Plugin-ів каналів;
надавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної
поверхні SDK, якщо тільки ви не підтримуєте безпосередньо цю родину вбудованих Plugin-ів.
</Note>

## Наступні кроки

- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — якщо ваш Plugin також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпорту підшляхів
- [SDK Testing](/uk/plugins/sdk-testing) — утиліти тестування та контрактні тести
- [Plugin Manifest](/uk/plugins/manifest) — повна схема manifest

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin-ів](/uk/plugins/building-plugins)
- [Plugin-и harness агента](/uk/plugins/sdk-agent-harness)
