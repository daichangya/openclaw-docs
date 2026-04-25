---
read_when:
    - Ви створюєте новий plugin каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення plugin каналу обміну повідомленнями для OpenClaw
title: Створення plugin каналів
x-i18n:
    generated_at: "2026-04-25T00:26:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 451b4f888cfac92ff37dcc5edd3a942c4df5a6081b283eda8321704d6f760162
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Цей посібник описує створення plugin каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці у вас буде робочий канал із безпекою DM,
паруванням, гілкуванням відповідей і вихідними повідомленнями.

<Info>
  Якщо ви ще не створювали жодного plugin для OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета та налаштуванням маніфесту.
</Info>

## Як працюють plugin каналів

Plugin каналів не потребують власних інструментів send/edit/react. OpenClaw зберігає один
спільний інструмент `message` у core. Ваш plugin відповідає за:

- **Config** — визначення облікового запису та майстер налаштування
- **Security** — політика DM та списки дозволених
- **Pairing** — потік підтвердження DM
- **Граматика сесії** — як специфічні для провайдера ідентифікатори розмов зіставляються з базовими чатами, ідентифікаторами гілок та резервними батьківськими значеннями
- **Outbound** — надсилання тексту, медіа та опитувань на платформу
- **Threading** — як гілкуються відповіді
- **Heartbeat typing** — необов’язкові сигнали typing/busy для цілей доставки Heartbeat

Core відповідає за спільний інструмент повідомлень, підключення prompt, зовнішню форму ключа сесії,
загальний облік `:thread:` та диспетчеризацію.

Якщо ваш канал підтримує індикатори набору тексту поза межами вхідних відповідей,
експортуйте `heartbeat.sendTyping(...)` у plugin каналу. Core викликає його з
визначеною ціллю доставки Heartbeat до початку виконання моделі Heartbeat і
використовує спільний життєвий цикл keepalive/cleanup для typing. Додайте `heartbeat.clearTyping(...)`,
якщо платформі потрібен явний сигнал зупинки.

Якщо ваш канал додає параметри інструмента повідомлень, які містять джерела медіа,
експортуйте ці назви параметрів через `describeMessageTool(...).mediaSourceParams`. Core використовує
цей явний список для нормалізації шляхів у sandbox і політики доступу до вихідних медіа,
тому plugin не потребують спеціальних випадків у shared-core для специфічних для провайдера
параметрів аватара, вкладення або обкладинки.
Віддавайте перевагу поверненню мапи з ключами дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб не пов’язані дії не
успадковували медіа-аргументи іншої дії. Плоский масив теж працює для параметрів, які
навмисно спільні для кожної доступної дії.

Якщо ваша платформа зберігає додаткову область видимості всередині ідентифікаторів розмов,
залиште цей розбір у plugin через `messaging.resolveSessionConversation(...)`. Це
канонічний hook для зіставлення `rawId` з базовим ідентифікатором розмови, необов’язковим
ідентифікатором гілки, явним `baseConversationId` і будь-якими
`parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їх порядок від
найвужчого батьківського елемента до найширшої/базової розмови.

Вбудовані plugin, яким потрібен такий самий розбір до запуску реєстру каналів,
також можуть експортувати файл верхнього рівня `session-key-api.ts` із відповідним
експортом `resolveSessionConversation(...)`. Core використовує цю безпечну для bootstrap поверхню
лише тоді, коли реєстр runtime plugin ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий сумісний резервний варіант, коли plugin потрібні лише резервні батьківські значення
поверх загального/raw id. Якщо існують обидва hooks, core спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і лише потім
перемикається на `resolveParentConversationCandidates(...)`, якщо канонічний hook
їх не надає.

## Підтвердження та можливості каналу

Більшості plugin каналів не потрібен код, специфічний для підтверджень.

- Core відповідає за same-chat `/approve`, спільні payload кнопок підтвердження та загальну резервну доставку.
- Віддавайте перевагу одному об’єкту `approvalCapability` у plugin каналу, коли каналу потрібна специфічна для підтверджень поведінка.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти доставки/native/render/auth для підтверджень у `approvalCapability`.
- `plugin.auth` призначений лише для login/logout; core більше не читає hooks auth підтверджень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічний шов auth для підтверджень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності auth підтверджень у same-chat.
- Якщо ваш канал надає native exec підтвердження, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану initiating-surface/native-client, коли він відрізняється від auth підтверджень у same-chat. Core використовує цей специфічний для exec hook, щоб розрізняти `enabled` і `disabled`, визначати, чи підтримує канал-ініціатор native exec підтвердження, і включати канал до вказівок резервного переходу для native-client. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для специфічної для каналу поведінки життєвого циклу payload, наприклад приховування дубльованих локальних prompt підтвердження або надсилання індикаторів typing перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для native-маршрутизації підтверджень або придушення резервної доставки.
- Використовуйте `approvalCapability.nativeRuntime` для фактів native підтверджень, якими володіє канал. Зберігайте його лінивим на гарячих entrypoint каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш runtime-модуль на вимогу, водночас дозволяючи core зібрати життєвий цикл підтвердження.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload підтверджень замість спільного renderer.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь для вимкненого шляху пояснювала точні параметри config, потрібні для ввімкнення native exec підтверджень. Hook отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами повинні відображати шляхи з областю облікового запису, такі як `channels.<channel>.accounts.<id>.execApprovals.*`, а не top-level значення за замовчуванням.
- Якщо канал може виводити стабільні DM-ідентичності на кшталт власника з наявного config, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити same-chat `/approve` без додавання логіки, специфічної для підтверджень, у core.
- Якщо каналу потрібна native-доставка підтверджень, зосередьте код каналу на нормалізації цілей плюс фактах транспортування/представлення. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте специфічні для каналу факти за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб core міг зібрати handler і взяти на себе фільтрацію запитів, маршрутизацію, усунення дублікатів, термін дії, підписку Gateway та повідомлення routed-elsewhere. `nativeRuntime` поділено на кілька менших швів:
- `availability` — чи налаштовано обліковий запис і чи слід обробляти запит
- `presentation` — зіставлення спільної view model підтвердження з native payload у стані pending/resolved/expired або кінцевими діями
- `transport` — підготовка цілей плюс надсилання/оновлення/видалення native-повідомлень підтвердження
- `interactions` — необов’язкові hooks bind/unbind/clear-action для native-кнопок або реакцій
- `observe` — необов’язкові hooks діагностики доставки
- Якщо каналу потрібні об’єкти, якими володіє runtime, наприклад client, token, Bolt app або Webhook receiver, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-context дозволяє core запускати handlers на основі можливостей зі стану запуску каналу без додавання специфічного для підтверджень обгорткового glue-коду.
- Звертайтеся до нижчорівневих `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли шов на основі можливостей поки що недостатньо виразний.
- Канали native-підтверджень повинні маршрутизувати і `accountId`, і `approvalKind` через ці helper-и. `accountId` зберігає область політики підтверджень для кількох облікових записів прив’язаною до правильного облікового запису бота, а `approvalKind` зберігає поведінку підтверджень exec і plugin доступною для каналу без жорстко закодованих гілок у core.
- Тепер core також відповідає за повідомлення про перенаправлення підтверджень. Plugin каналів не повинні надсилати власні додаткові повідомлення на кшталт «підтвердження надійшло в DM / інший канал» з `createChannelNativeApprovalRuntime`; натомість експортуйте точну маршрутизацію origin + approver-DM через спільні helper-и можливостей підтвердження й дозвольте core агрегувати фактичні доставки перед публікацією будь-якого повідомлення назад у чат-ініціатор.
- Зберігайте тип id доставленого підтвердження наскрізно. Native clients не повинні
  вгадувати або переписувати маршрутизацію підтверджень exec і plugin на основі локального для каналу стану.
- Різні типи підтверджень можуть навмисно надавати різні native-поверхні.
  Поточні вбудовані приклади:
  - Slack зберігає доступною native-маршрутизацію підтверджень як для exec, так і для plugin id.
  - Matrix зберігає ту саму native DM/channel-маршрутизацію та UX реакцій для exec
    і plugin підтверджень, водночас усе ще дозволяючи auth відрізнятися залежно від типу підтвердження.
- `createApproverRestrictedNativeApprovalAdapter` усе ще існує як обгортка сумісності, але новий код повинен віддавати перевагу builder можливостей і експортувати `approvalCapability` у plugin.

Для гарячих entrypoint каналу віддавайте перевагу вужчим runtime subpath, коли вам потрібна лише
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

Так само віддавайте перевагу `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` і
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша umbrella-
поверхня.

Для setup зокрема:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime helper-и setup:
  безпечні для import адаптери patch setup (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід приміток lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  builder-и setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузький env-aware adapter
  seam для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює builder-и setup для необов’язкового встановлення плюс кілька безпечних для setup примітивів:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує setup або auth на основі env і загальні потоки startup/config
мають знати ці env-імена до завантаження runtime, оголосіть їх у маніфесті plugin через
`channelEnvVars`. Зберігайте runtime `envVars` каналу або локальні константи лише для тексту, орієнтованого на операторів.

Якщо ваш канал може з’являтися в `status`, `channels list`, `channels status` або скануваннях SecretRef до запуску runtime plugin, додайте `openclaw.setupEntry` у `package.json`. Цей entrypoint має бути безпечним для import у read-only шляхах команд і повинен повертати метадані каналу, безпечний для setup adapter config, adapter status і метадані channel secret target, потрібні для цих зведень. Не запускайте clients, listeners або transport runtime з setup entry.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширший seam `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні helper-и setup/config, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал лише хоче показувати в поверхнях setup повідомлення «спочатку встановіть цей plugin»,
віддавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенеровані
adapter/wizard безпечно закривають запис config і фіналізацію та повторно використовують
те саме повідомлення про необхідність встановлення для валідації, finalize і тексту з посиланням на docs.

Для інших гарячих шляхів каналу віддавайте перевагу вузьким helper-ам замість ширших застарілих
поверхонь:

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
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа плюс делегатів
  identity/send для outbound і планування payload
- `buildThreadAwareOutboundSessionRoute(...)` з
  `openclaw/plugin-sdk/channel-core`, коли маршрут outbound має зберігати явний
  `replyToId`/`threadId` або відновлювати поточну сесію `:thread:`,
  якщо базовий ключ сесії все ще збігається. Plugin провайдерів можуть перевизначати
  пріоритет, поведінку суфіксів і нормалізацію thread id, коли їхня платформа має
  native-семантику доставки в гілках.
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу thread-binding
  і реєстрації adapter
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли все ще потрібна
  застаріла розкладка полів payload agent/media
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації користувацьких команд Telegram,
  перевірки дублікатів/конфліктів і стабільного при резервному переході контракту config команд

Канали лише з auth зазвичай можуть зупинитися на стандартному шляху: core обробляє підтвердження, а plugin просто експортує можливості outbound/auth. Канали з native-підтвердженнями, такі як Matrix, Slack, Telegram і користувацькі транспорти чату, повинні використовувати спільні native helper-и замість власної реалізації життєвого циклу підтверджень.

## Політика inbound-згадок

Зберігайте обробку inbound-згадок розділеною на два шари:

- збір доказів, яким володіє plugin
- спільне оцінювання політики

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень політики згадок.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли вам потрібен
ширший barrel helper-ів inbound.

Підходить для локальної логіки plugin:

- виявлення reply-to-bot
- виявлення quoted-bot
- перевірки участі в гілці
- виключення службових/системних повідомлень
- native-кеші платформи, потрібні для підтвердження участі бота

Підходить для спільного helper-а:

- `requireMention`
- явний результат згадки
- список дозволених неявних згадок
- обхід команд
- остаточне рішення про пропуск

Рекомендований потік:

1. Обчисліть локальні факти згадки.
2. Передайте ці факти в `resolveInboundMentionDecision({ facts, policy })`.
3. Використовуйте `decision.effectiveWasMentioned`, `decision.shouldBypassMention` і `decision.shouldSkip` у вашому inbound-gate.

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

`api.runtime.channel.mentions` експортує ті самі спільні helper-и згадок для
вбудованих plugin каналів, які вже залежать від runtime injection:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження не пов’язаних
runtime helper-ів inbound.

Старі helper-и `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як експорти сумісності. Новий код
повинен використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли plugin. Поле `channel` у `package.json` —
    це те, що робить його plugin каналу. Повну поверхню метаданих пакета
    дивіться в [Налаштування plugin і Config](/uk/plugins/sdk-setup#openclaw-channel):

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

    `configSchema` перевіряє `plugins.entries.acme-chat.config`. Використовуйте його для
    налаштувань, якими володіє plugin і які не є config облікового запису каналу. `channelConfigs`
    перевіряє `channels.acme-chat` і є джерелом холодного шляху, яке використовується схемою config,
    setup і поверхнями UI до завантаження runtime plugin.

  </Step>

  <Step title="Побудуйте об’єкт plugin каналу">
    Інтерфейс `ChannelPlugin` має багато необов’язкових поверхонь adapter. Почніть із
    мінімуму — `id` і `setup` — і додавайте adapter-и за потреби.

    Створіть `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // ваш API client платформи

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

      // DM security: хто може писати боту
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: потік підтвердження для нових контактів DM
      pairing: {
        text: {
          idLabel: "Ім’я користувача Acme Chat",
          message: "Надішліть цей код, щоб підтвердити свою особу:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: як доставляються відповіді
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: надсилання повідомлень на платформу
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
      Замість ручної реалізації низькорівневих інтерфейсів adapter ви передаєте
      декларативні опції, а builder компонує їх:

      | Option | Що він підключає |
      | --- | --- |
      | `security.dm` | Scoped-розпізнавач безпеки DM із полів config |
      | `pairing.text` | Текстовий потік парування DM з обміном кодами |
      | `threading` | Розпізнавач режиму reply-to (фіксований, scoped до облікового запису або користувацький) |
      | `outbound.attachedResults` | Функції send, що повертають метадані результату (ідентифікатори повідомлень) |

      Ви також можете передавати сирі об’єкти adapter замість декларативних опцій,
      якщо вам потрібен повний контроль.
    </Accordion>

  </Step>

  <Step title="Підключіть entry point">
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

    Розміщуйте дескриптори CLI, якими володіє канал, у `registerCliMetadata(...)`, щоб OpenClaw
    міг показувати їх у кореневій довідці без активації повного runtime каналу,
    тоді як звичайні повні завантаження все одно підхоплюватимуть ті самі дескриптори для реєстрації
    реальних команд. Залишайте `registerFull(...)` для роботи, що стосується лише runtime.
    Якщо `registerFull(...)` реєструє gateway RPC methods, використовуйте
    префікс, специфічний для plugin. Простори імен admin у core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    зіставляються з `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє розділення режимів реєстрації. Усі
    опції дивіться в [Entry Points](/uk/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Додайте setup entry">
    Створіть `setup-entry.ts` для легкого завантаження під час onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повного entry, коли канал вимкнений
    або не налаштований. Це дозволяє уникнути підключення важкого runtime-коду під час потоків setup.
    Докладніше див. у [Setup і Config](/uk/plugins/sdk-setup#setup-entry).

    Вбудовані workspace-канали, які розділяють безпечні для setup експорти на sidecar-
    модулі, можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний setter runtime під час setup.

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш plugin має отримувати повідомлення з платформи та пересилати їх до
    OpenClaw. Типовий шаблон — це Webhook, який перевіряє запит і
    диспетчеризує його через inbound-handler вашого каналу:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth, яким керує plugin (перевіряйте підписи самостійно)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ваш inbound-handler диспетчеризує повідомлення до OpenClaw.
          // Точне підключення залежить від SDK вашої платформи —
          // реальний приклад дивіться у вбудованому пакеті plugin Microsoft Teams або Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Обробка вхідних повідомлень залежить від каналу. Кожен plugin каналу
      володіє власним inbound-конвеєром. Перегляньте вбудовані plugin каналів
      (наприклад, пакет plugin Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
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

    Спільні helper-и для тестування див. у [Testing](/uk/plugins/sdk-testing).

  </Step>
</Steps>

## Структура файлів

```
<bundled-plugin-root>/acme-chat/
├── package.json              # Метадані openclaw.channel
├── openclaw.plugin.json      # Маніфест зі схемою config
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
  <Card title="Параметри гілкування" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані режими reply, режими в області облікового запису або користувацькі режими
  </Card>
  <Card title="Інтеграція інструмента повідомлень" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helper-и" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі вбудовані helper-шви все ще існують для супроводу вбудованих plugin і
сумісності. Це не рекомендований шаблон для нових plugin каналів;
віддавайте перевагу загальним subpath channel/setup/reply/runtime зі спільної
поверхні SDK, якщо лише ви безпосередньо не супроводжуєте це сімейство вбудованих plugin.
</Note>

## Наступні кроки

- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — якщо ваш plugin також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник з import subpath
- [Тестування SDK](/uk/plugins/sdk-testing) — утиліти тестування та контрактні тести
- [Маніфест plugin](/uk/plugins/manifest) — повна схема маніфесту

## Пов’язане

- [Setup plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugin](/uk/plugins/building-plugins)
- [Plugin harness агента](/uk/plugins/sdk-agent-harness)
