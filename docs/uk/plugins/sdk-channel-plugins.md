---
read_when:
    - Ви створюєте новий plugin каналу повідомлень
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення plugin каналу повідомлень для OpenClaw
title: Створення plugin каналів
x-i18n:
    generated_at: "2026-04-25T02:39:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a466decff828bdce1d9d3e85127867b88f43c6eca25aa97306f8bd0df39f3a9
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Цей посібник описує створення plugin каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці у вас буде робочий канал із
безпекою DM, сполученням, прив’язкою відповідей до гілок і вихідними повідомленнями.

<Info>
  Якщо ви раніше не створювали жодного plugin для OpenClaw, спочатку прочитайте
  [Getting Started](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета та налаштуванням маніфесту.
</Info>

## Як працюють plugin каналів

Plugin каналів не потребують власних інструментів send/edit/react. OpenClaw
зберігає один спільний інструмент `message` у core. Ваш plugin відповідає за:

- **Config** — визначення облікового запису та майстер налаштування
- **Security** — політика DM і списки дозволених
- **Pairing** — потік підтвердження DM
- **Session grammar** — як специфічні для провайдера ідентифікатори розмов зіставляються з базовими чатами, ідентифікаторами гілок і резервними батьківськими значеннями
- **Outbound** — надсилання тексту, медіа та опитувань на платформу
- **Threading** — як відповіді прив’язуються до гілок
- **Heartbeat typing** — необов’язкові сигнали typing/busy для цілей доставки Heartbeat

Core відповідає за спільний інструмент повідомлень, підключення prompt, зовнішню
форму ключа сесії, загальний облік `:thread:` і диспетчеризацію.

Якщо ваш канал підтримує індикатори набору поза вхідними відповідями,
експонуйте `heartbeat.sendTyping(...)` у plugin каналу. Core викликає його з
визначеною ціллю доставки heartbeat до початку запуску моделі heartbeat і
використовує спільний життєвий цикл typing keepalive/cleanup. Додайте
`heartbeat.clearTyping(...)`, якщо платформі потрібен явний сигнал зупинки.

Якщо ваш канал додає параметри інструмента message, які містять джерела медіа,
експонуйте ці імена параметрів через `describeMessageTool(...).mediaSourceParams`.
Core використовує цей явний список для нормалізації шляхів sandbox і політики
доступу до вихідних медіа, тому plugins не потребують спеціальних випадків у
спільному core для специфічних для провайдера параметрів avatar, attachment або
cover-image.
Рекомендовано повертати мапу з ключами дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб не пов’язані дії не
успадковували медіа-аргументи іншої дії. Плоский масив також працює для
параметрів, які навмисно є спільними для кожної експонованої дії.

Якщо ваша платформа зберігає додаткову область в ідентифікаторах розмов,
залишайте цей розбір у plugin за допомогою `messaging.resolveSessionConversation(...)`.
Це канонічний hook для зіставлення `rawId` з базовим ідентифікатором розмови,
необов’язковим ідентифікатором гілки, явним `baseConversationId` і будь-якими
`parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їхній порядок від
найвужчого батьківського значення до найширшої/базової розмови.

Вбудовані plugins, яким потрібен той самий розбір до запуску реєстру каналів,
також можуть експонувати файл верхнього рівня `session-key-api.ts` з відповідним
експортом `resolveSessionConversation(...)`. Core використовує цю безпечну для
bootstrap поверхню лише тоді, коли реєстр runtime plugin ще недоступний.

`messaging.resolveParentConversationCandidates(...)` лишається доступним як
застарілий резервний варіант сумісності, коли plugin потребує лише резервних
батьківських значень поверх загального/raw id. Якщо існують обидва hooks, core
спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і переходить до
`resolveParentConversationCandidates(...)` лише тоді, коли канонічний hook
їх не вказує.

## Підтвердження та можливості каналів

Більшості plugin каналів не потрібен код, специфічний для підтверджень.

- Core відповідає за `/approve` у тому самому чаті, спільні payload кнопок підтвердження та загальну резервну доставку.
- Надавайте перевагу одному об’єкту `approvalCapability` у plugin каналу, якщо каналу потрібна поведінка, специфічна для підтверджень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти про доставку/native/render/auth підтверджень у `approvalCapability`.
- `plugin.auth` призначений лише для login/logout; core більше не читає hooks auth підтверджень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічна межа approval-auth.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності auth підтверджень у тому самому чаті.
- Якщо ваш канал експонує native exec підтвердження, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану initiating-surface/native-client, коли він відрізняється від auth підтверджень у тому самому чаті. Core використовує цей специфічний для exec hook, щоб розрізняти `enabled` і `disabled`, визначати, чи підтримує initiating channel native exec підтвердження, і включати канал до вказівок із резервного переходу native-client. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для поширеного випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для специфічної для каналу поведінки життєвого циклу payload, як-от приховування дубльованих локальних prompts підтвердження або надсилання індикаторів typing перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для native-маршрутизації підтверджень або вимкнення резервної доставки.
- Використовуйте `approvalCapability.nativeRuntime` для фактів native підтверджень, якими керує канал. Залишайте його lazy на гарячих точках входу каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш runtime-модуль на вимогу, водночас дозволяючи core збирати життєвий цикл підтверджень.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload підтвердження замість спільного renderer.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь на вимкнений шлях пояснювала точні параметри config, потрібні для ввімкнення native exec підтверджень. Hook отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають відображати шляхи з областю облікового запису, як-от `channels.<channel>.accounts.<id>.execApprovals.*`, а не defaults верхнього рівня.
- Якщо канал може вивести стабільні схожі на власника DM-ідентичності з наявного config, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання логіки core, специфічної для підтверджень.
- Якщо каналу потрібна native-доставка підтверджень, зосередьте код каналу на нормалізації цілей і фактах transport/presentation. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте специфічні для каналу факти за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб core міг зібрати handler і взяти на себе фільтрацію запитів, маршрутизацію, дедуплікацію, строки дії, підписку Gateway і сповіщення routed-elsewhere. `nativeRuntime` поділено на кілька менших меж:
- `availability` — чи налаштовано обліковий запис і чи слід обробляти запит
- `presentation` — зіставлення спільної view model підтвердження з native payload у станах pending/resolved/expired або з фінальними діями
- `transport` — підготовка цілей плюс надсилання/оновлення/видалення native-повідомлень підтвердження
- `interactions` — необов’язкові hooks bind/unbind/clear-action для native-кнопок або реакцій
- `observe` — необов’язкові hooks діагностики доставки
- Якщо каналу потрібні об’єкти, якими володіє runtime, як-от client, token, Bolt app або Webhook receiver, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-context дозволяє core ініціалізувати handlers, керовані capability, зі стану запуску каналу без додавання обгорток glue, специфічних для підтверджень.
- Звертайтеся до низькорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли межа, керована capability, ще недостатньо виразна.
- Канали native підтверджень мають маршрутизувати і `accountId`, і `approvalKind` через ці helper-и. `accountId` зберігає політику підтверджень для кількох облікових записів у правильній області bot-облікового запису, а `approvalKind` зберігає поведінку exec проти plugin підтверджень доступною для каналу без жорстко закодованих гілок у core.
- Core тепер також відповідає за сповіщення про перенаправлення підтверджень. Plugin каналів не повинні надсилати власні додаткові повідомлення на кшталт «підтвердження перейшло в DM / інший канал» з `createChannelNativeApprovalRuntime`; натомість експонуйте точну маршрутизацію origin + approver-DM через спільні helper-и capability підтверджень і дозвольте core агрегувати фактичні доставки перед публікацією будь-якого сповіщення назад в initiating chat.
- Зберігайте вид доставленого id підтвердження наскрізно. Native clients не повинні
  вгадувати або переписувати маршрутизацію exec проти plugin підтверджень на основі локального стану каналу.
- Різні види підтверджень можуть навмисно експонувати різні native-поверхні.
  Поточні вбудовані приклади:
  - Slack зберігає доступною native-маршрутизацію підтверджень як для exec-, так і для plugin-id.
  - Matrix зберігає ту саму native DM/channel-маршрутизацію та UX реакцій для exec-
    і plugin-підтверджень, водночас дозволяючи auth відрізнятися за видом підтвердження.
- `createApproverRestrictedNativeApprovalAdapter` усе ще існує як обгортка сумісності, але новий код має надавати перевагу builder-у capability та експонувати `approvalCapability` у plugin.

Для гарячих точок входу каналу надавайте перевагу вужчим runtime subpath, коли вам потрібна лише
одна частина цієї сім’ї:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Аналогічно надавайте перевагу `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` і
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша umbrella-
поверхня.

Зокрема для setup:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime helper-и setup:
  безпечні для імпорту адаптери patch setup (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), виведення приміток lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` і builders делегованого
  setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузька env-aware межа adapter
  для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює builders setup для необов’язкового встановлення плюс кілька setup-safe примітивів:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує setup або auth на основі env і загальні потоки startup/config
мають знати ці імена env до завантаження runtime, оголосіть їх у
маніфесті plugin через `channelEnvVars`. Залишайте `envVars` runtime каналу або локальні
константи лише для копірайту, орієнтованого на операторів.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status` або
скануваннях SecretRef до запуску runtime plugin, додайте `openclaw.setupEntry` у
`package.json`. Ця точка входу має бути безпечною для імпорту в read-only шляхах команд
і має повертати метадані каналу, безпечний для setup adapter config, adapter status
і метадані channel secret target, потрібні для цих зведень. Не запускайте clients,
listeners або runtime transport із точки входу setup.

Тримайте вузьким і головний шлях імпорту точки входу каналу. Виявлення може
обчислювати точку входу та модуль plugin каналу для реєстрації capability без
активації каналу. Файли на кшталт `channel-plugin-api.ts` мають експортувати об’єкт plugin каналу
без імпорту майстрів setup, clients transport, listeners socket, запускальників subprocess
або модулів запуску сервісів. Розміщуйте ці runtime-частини в модулях, що
завантажуються з `registerFull(...)`, setter-ів runtime або lazy adapter-ів capability.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширшу межу `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні helper-и setup/config, як-от
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал лише хоче показувати «спочатку встановіть цей plugin» у поверхнях
setup, надавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенеровані
adapter/wizard безпечно відмовляють у записі config і завершенні, а також
повторно використовують те саме повідомлення про обов’язкове встановлення в
валідації, завершенні та тексті з посиланням на документацію.

Для інших гарячих шляхів каналу надавайте перевагу вузьким helper-ам замість
ширших застарілих поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для config з кількома обліковими записами та
  резервного переходу до облікового запису за замовчуванням
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для маршруту/конверта inbound і
  зв’язування record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` для розбору/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа плюс outbound
  identity/send delegate-ів і планування payload
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли маршрут outbound має зберігати явний
  `replyToId`/`threadId` або відновлювати поточну сесію `:thread:`,
  якщо базовий ключ сесії все ще збігається. Plugins провайдерів можуть
  перевизначати пріоритет, поведінку суфіксів і нормалізацію id гілки, коли
  їхня платформа має native-семантику доставки в гілки.
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу thread-binding
  і реєстрації adapter-ів
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли все ще потрібне
  застаріле компонування полів payload агента/медіа
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації користувацьких
  команд Telegram, валідації дублікатів/конфліктів і стабільного щодо fallback
  контракту config команд

Канали лише з auth зазвичай можуть зупинитися на шляху за замовчуванням: core обробляє підтвердження, а plugin лише експонує можливості outbound/auth. Канали native підтверджень, як-от Matrix, Slack, Telegram і власні chat-транспорти, мають використовувати спільні native helper-и замість створення власного життєвого циклу підтверджень.

## Політика вхідних згадок

Зберігайте обробку вхідних згадок розділеною на два рівні:

- збирання доказів, яким володіє plugin
- спільне оцінювання політики

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень політики згадок.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли вам потрібен ширший
barrel helper-ів inbound.

Добре підходить для локальної логіки plugin:

- виявлення reply-to-bot
- виявлення quoted-bot
- перевірки участі в гілці
- виключення службових/системних повідомлень
- native-кеші платформи, потрібні для підтвердження участі бота

Добре підходить для спільного helper-а:

- `requireMention`
- явний результат згадки
- allowlist неявних згадок
- обхід команд
- фінальне рішення про пропуск

Рекомендований потік:

1. Обчисліть локальні факти згадки.
2. Передайте ці факти в `resolveInboundMentionDecision({ facts, policy })`.
3. Використовуйте `decision.effectiveWasMentioned`, `decision.shouldBypassMention` і `decision.shouldSkip` у вашому вхідному шлюзі.

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

`api.runtime.channel.mentions` експонує ті самі спільні helper-и згадок для
вбудованих plugin каналів, які вже залежать від ін’єкції runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження не пов’язаних
helper-ів runtime inbound.

Старі helper-и `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як експорти сумісності. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли plugin. Поле `channel` у `package.json` —
    це те, що робить його plugin каналу. Для повної поверхні метаданих пакета
    див. [Налаштування і Config plugin](/uk/plugins/sdk-setup#openclaw-channel):

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
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` валідує `plugins.entries.acme-chat.config`. Використовуйте його для
    налаштувань, якими володіє plugin, що не є config облікового запису каналу. `channelConfigs`
    валідує `channels.acme-chat` і є джерелом cold-path, яке використовують schema
    config, setup і поверхні UI до завантаження runtime plugin.

  </Step>

  <Step title="Створіть об’єкт plugin каналу">
    Інтерфейс `ChannelPlugin` має багато необов’язкових поверхонь adapter-ів. Почніть із
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

    <Accordion title="Що для вас робить createChatChannelPlugin">
      Замість ручної реалізації низькорівневих інтерфейсів adapter-ів ви передаєте
      декларативні параметри, а builder компонує їх:

      | Option | Що він підключає |
      | --- | --- |
      | `security.dm` | Розв’язувач безпеки DM з областю каналу на основі полів config |
      | `pairing.text` | Потік текстового сполучення DM з обміном кодами |
      | `threading` | Розв’язувач режиму reply-to (фіксований, з областю облікового запису або власний) |
      | `outbound.attachedResults` | Функції надсилання, які повертають метадані результату (id повідомлень) |

      Ви також можете передавати сирі об’єкти adapter-ів замість декларативних параметрів,
      якщо вам потрібен повний контроль.

      Сирі adapter-и outbound можуть визначати функцію `chunker(text, limit, ctx)`.
      Необов’язковий `ctx.formatting` містить рішення форматування під час доставки,
      як-от `maxLinesPerMessage`; застосовуйте його до надсилання, щоб прив’язка
      відповідей до гілок і межі chunk визначалися один раз спільною outbound-доставкою.
      Контексти надсилання також містять `replyToIdSource` (`implicit` або `explicit`),
      коли native-ціль відповіді було визначено, щоб helper-и payload могли зберігати
      явні теги відповіді без використання неявного одноразового слота reply.
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

    Розміщуйте CLI descriptors, якими володіє канал, у `registerCliMetadata(...)`, щоб OpenClaw
    міг показувати їх у кореневій довідці без активації повного runtime каналу,
    тоді як звичайні повні завантаження все одно підхоплюватимуть ті самі descriptors для реєстрації
    реальних команд. Залишайте `registerFull(...)` для роботи, що виконується лише в runtime.
    Якщо `registerFull(...)` реєструє gateway RPC methods, використовуйте
    префікс, специфічний для plugin.
    Простори імен адміністрування core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    зіставляються з `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє це розділення режимів реєстрації. Див.
    [Entry Points](/uk/plugins/sdk-entrypoints#definechannelpluginentry) для всіх
    параметрів.

  </Step>

  <Step title="Додайте точку входу setup">
    Створіть `setup-entry.ts` для полегшеного завантаження під час onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнено
    або не налаштовано. Це дає змогу уникнути підключення важкого runtime-коду під час потоків setup.
    Докладніше див. у [Setup and Config](/uk/plugins/sdk-setup#setup-entry).

    Вбудовані workspace-канали, які розділяють безпечні для setup експорти в sidecar-
    модулях, можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний setter runtime під час setup.

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш plugin має отримувати повідомлення з платформи та пересилати їх до
    OpenClaw. Типовий шаблон — це Webhook, який перевіряє запит і
    диспетчеризує його через inbound handler вашого каналу:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth, яким керує plugin (підписи перевіряйте самі)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ваш inbound handler диспетчеризує повідомлення до OpenClaw.
          // Точне підключення залежить від SDK вашої платформи —
          // реальний приклад див. у вбудованому пакеті plugin Microsoft Teams або Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Обробка вхідних повідомлень є специфічною для каналу. Кожен plugin каналу
      володіє власним inbound pipeline. Подивіться на вбудовані plugins каналів
      (наприклад, пакет plugin Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Тестування">
Пишіть colocated-тести в `src/channel.test.ts`:

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

    Спільні helper-и для тестування див. у [Testing](/uk/plugins/sdk-testing).

  </Step>
</Steps>

## Структура файлів

```
<bundled-plugin-root>/acme-chat/
├── package.json              # метадані openclaw.channel
├── openclaw.plugin.json      # Маніфест зі schema config
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Публічні експорти (необов’язково)
├── runtime-api.ts            # Внутрішні runtime-експорти (необов’язково)
└── src/
    ├── channel.ts            # ChannelPlugin через createChatChannelPlugin
    ├── channel.test.ts       # Тести
    ├── client.ts             # API client платформи
    └── runtime.ts            # Сховище runtime (за потреби)
```

## Розширені теми

<CardGroup cols={2}>
  <Card title="Варіанти thread-прив’язки" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані, з областю облікового запису або власні режими reply
  </Card>
  <Card title="Інтеграція інструмента message" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Розв’язання цілей" icon="crosshair" href="/uk/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper-и runtime" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі вбудовані helper seams усе ще існують для підтримки вбудованих plugins і
сумісності. Це не рекомендований шаблон для нових plugin каналів;
надавайте перевагу загальним subpath channel/setup/reply/runtime зі спільної
поверхні SDK, якщо лише ви не підтримуєте цю родину вбудованих plugins безпосередньо.
</Note>

## Наступні кроки

- [Plugins провайдерів](/uk/plugins/sdk-provider-plugins) — якщо ваш plugin також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Тестування SDK](/uk/plugins/sdk-testing) — утиліти тестування та контрактні тести
- [Маніфест plugin](/uk/plugins/manifest) — повна schema маніфесту

## Пов’язане

- [Налаштування SDK plugin](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
- [Plugins harness агента](/uk/plugins/sdk-agent-harness)
