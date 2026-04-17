---
read_when:
    - Ви створюєте новий Plugin каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення Plugin каналу обміну повідомленнями для OpenClaw
title: Створення Plugin каналів
x-i18n:
    generated_at: "2026-04-17T15:49:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3dda53c969bc7356a450c2a5bf49fb82bf1283c23e301dec832d8724b11e724b
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Створення Plugin каналів

Цей посібник проводить вас через створення Plugin каналу, який підключає OpenClaw до платформи обміну повідомленнями. Наприкінці у вас буде робочий канал із безпекою DM, паруванням, потоками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви раніше не створювали жодного Plugin для OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета та налаштуванням маніфесту.
</Info>

## Як працюють Plugin каналів

Plugin каналів не потребують власних інструментів send/edit/react. OpenClaw зберігає один спільний інструмент `message` у core. Ваш Plugin відповідає за:

- **Конфігурацію** — визначення облікового запису та майстер налаштування
- **Безпеку** — політику DM і списки дозволених
- **Парування** — процес підтвердження DM
- **Граматику сесії** — як специфічні для провайдера ідентифікатори розмов зіставляються з базовими чатами, ідентифікаторами потоків і резервними батьківськими значеннями
- **Вихідні повідомлення** — надсилання тексту, медіа й опитувань на платформу
- **Потоки** — як організовано потоки відповідей

Core відповідає за спільний інструмент повідомлень, прив’язку prompt, зовнішню форму ключа сесії, загальний облік `:thread:` і dispatch.

Якщо ваш канал додає параметри інструмента повідомлень, які містять джерела медіа, відкрийте ці імена параметрів через `describeMessageTool(...).mediaSourceParams`. Core використовує цей явний список для нормалізації шляху sandbox і політики доступу до вихідних медіа, тож Plugins не потребують особливих випадків у спільному core для специфічних для провайдера параметрів аватара, вкладення чи зображення обкладинки.
Надавайте перевагу поверненню мапи з ключами дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб непов’язані дії не
успадковували медіа-аргументи іншої дії. Плоский масив також працює для
параметрів, які навмисно спільні для кожної відкритої дії.

Якщо ваша платформа зберігає додаткову область видимості в ідентифікаторах розмов, залишайте цей парсинг у Plugin за допомогою `messaging.resolveSessionConversation(...)`. Це канонічний hook для зіставлення `rawId` із базовим ідентифікатором розмови, необов’язковим `thread id`, явним `baseConversationId` і будь-якими `parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їх порядок
від найвужчого батьківського елемента до найширшої/базової розмови.

Bundled Plugins, яким потрібен той самий парсинг до запуску реєстру каналів,
також можуть відкривати файл верхнього рівня `session-key-api.ts` із
відповідним експортом `resolveSessionConversation(...)`. Core використовує цю
безпечну для bootstrap поверхню лише тоді, коли реєстр Plugin середовища
виконання ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий резервний механізм сумісності, коли Plugin потребує лише резервних
батьківських значень поверх загального/сирого ідентифікатора. Якщо існують
обидва hooks, core спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і переходить до
`resolveParentConversationCandidates(...)` лише тоді, коли канонічний hook їх
не повертає.

## Підтвердження та можливості каналу

Більшості Plugin каналів не потрібен код, специфічний для підтверджень.

- Core відповідає за `/approve` у тому самому чаті, спільні корисні навантаження кнопок підтвердження та доставку загального резервного варіанта.
- Віддавайте перевагу одному об’єкту `approvalCapability` у Plugin каналу, коли каналу потрібна поведінка, специфічна для підтверджень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти про доставку/нативний режим/рендеринг/автентифікацію підтверджень у `approvalCapability`.
- `plugin.auth` призначений лише для login/logout; core більше не зчитує hooks автентифікації підтверджень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічний механізм автентифікації підтверджень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності автентифікації підтвердження в тому самому чаті.
- Якщо ваш канал відкриває нативні exec-підтвердження, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану поверхні ініціювання/нативного клієнта, коли він відрізняється від автентифікації підтвердження в тому самому чаті. Core використовує цей специфічний для exec hook, щоб розрізняти `enabled` і `disabled`, визначати, чи підтримує канал нативні exec-підтвердження, і включати канал до підказок резервного сценарію нативного клієнта. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для поведінки життєвого циклу корисного навантаження, специфічної для каналу, наприклад приховування дубльованих локальних запитів на підтвердження або надсилання індикаторів набору перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для маршрутизації нативних підтверджень або вимкнення резервної доставки.
- Використовуйте `approvalCapability.nativeRuntime` для фактів нативного підтвердження, що належать каналу. Зберігайте його lazy на гарячих точках входу каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш модуль середовища виконання на вимогу, водночас дозволяючи core збирати життєвий цикл підтвердження.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні корисні навантаження підтвердження замість спільного рендерера.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь для вимкненого шляху пояснювала точні параметри конфігурації, потрібні для ввімкнення нативних exec-підтверджень. Hook отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають відтворювати шляхи з областю облікового запису, наприклад `channels.<channel>.accounts.<id>.execApprovals.*`, а не верхньорівневі значення за замовчуванням.
- Якщо канал може виводити стабільні DM-ідентичності, подібні до власника, із наявної конфігурації, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання логіки core, специфічної для підтверджень.
- Якщо каналу потрібна доставка нативних підтверджень, зосередьте код каналу на нормалізації цілі плюс фактах транспорту/представлення. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте специфічні для каналу факти за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб core міг зібрати обробник і керувати фільтрацією запитів, маршрутизацією, дедуплікацією, строком дії, підпискою Gateway та сповіщеннями про маршрутизацію в інше місце. `nativeRuntime` поділено на кілька менших механізмів:
- `availability` — чи налаштовано обліковий запис і чи слід обробляти запит
- `presentation` — зіставлення спільної view model підтвердження з нативними корисними навантаженнями pending/resolved/expired або фінальними діями
- `transport` — підготовка цілей плюс надсилання/оновлення/видалення нативних повідомлень підтвердження
- `interactions` — необов’язкові hooks bind/unbind/clear-action для нативних кнопок або реакцій
- `observe` — необов’язкові hooks діагностики доставки
- Якщо каналу потрібні об’єкти, що належать середовищу виконання, такі як клієнт, токен, застосунок Bolt або приймач Webhook, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-context дозволяє core ініціалізувати обробники, керовані можливостями, зі стану запуску каналу без додавання допоміжного коду-обгортки, специфічного для підтверджень.
- Звертайтеся до нижчорівневого `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли механізм, керований можливостями, ще недостатньо виразний.
- Канали нативного підтвердження мають маршрутизувати і `accountId`, і `approvalKind` через ці допоміжні засоби. `accountId` зберігає політику підтверджень для кількох облікових записів у межах правильного облікового запису бота, а `approvalKind` зберігає поведінку exec і Plugin-підтверджень доступною для каналу без жорстко закодованих розгалужень у core.
- Core тепер також відповідає за сповіщення про повторну маршрутизацію підтверджень. Plugin каналів не повинні надсилати власні подальші повідомлення на кшталт «підтвердження перейшло в DM / інший канал» із `createChannelNativeApprovalRuntime`; натомість відкривайте точну маршрутизацію origin + approver-DM через спільні допоміжні засоби можливостей підтвердження й дозвольте core агрегувати фактичні доставки перед публікацією будь-якого сповіщення назад у чат-ініціатор.
- Зберігайте тип delivered approval id упродовж усього ланцюжка. Нативні клієнти не повинні
  вгадувати або переписувати маршрутизацію exec чи Plugin-підтверджень на основі локального стану каналу.
- Різні типи підтверджень можуть навмисно відкривати різні нативні поверхні.
  Поточні bundled приклади:
  - Slack зберігає доступність маршрутизації нативних підтверджень як для exec-, так і для Plugin-ідентифікаторів.
  - Matrix зберігає ту саму маршрутизацію нативних DM/каналів і UX реакцій для exec
    і Plugin-підтверджень, водночас усе ще дозволяючи автентифікації відрізнятися за типом підтвердження.
- `createApproverRestrictedNativeApprovalAdapter` все ще існує як обгортка сумісності, але новий код має віддавати перевагу конструктору можливостей і відкривати `approvalCapability` у Plugin.

Для гарячих точок входу каналу віддавайте перевагу вужчим runtime subpath, коли вам потрібна лише одна частина цієї родини:

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
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша
парасолькова поверхня.

Зокрема для налаштування:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime допоміжні засоби налаштування:
  безпечні для імпорту адаптери patch для налаштування (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід приміток пошуку,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  конструктори setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузький env-aware адаптерний
  механізм для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює конструктори налаштування optional-install
  плюс кілька безпечних для setup примітивів:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує налаштування або auth, керовані env, і загальні потоки запуску/конфігурації повинні знати ці env-імена до завантаження runtime, оголосіть їх у маніфесті Plugin через `channelEnvVars`. Зберігайте `envVars` runtime каналу або локальні константи лише для тексту, орієнтованого на операторів.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширший механізм `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні допоміжні засоби setup/config, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал хоче лише оголосити «спочатку встановіть цей Plugin» у поверхнях налаштування, віддавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенеровані адаптер/майстер за замовчуванням блокують записи конфігурації та фіналізацію і повторно використовують те саме повідомлення про обов’язкове встановлення для валідації, finalize і тексту з посиланням на документацію.

Для інших гарячих шляхів каналу віддавайте перевагу вузьким допоміжним засобам замість ширших застарілих поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для конфігурації кількох облікових записів і
  резервного сценарію облікового запису за замовчуванням
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для маршруту/конверта вхідних повідомлень і
  логіки запису та dispatch
- `openclaw/plugin-sdk/messaging-targets` для парсингу/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа плюс делегатів
  ідентифікації/надсилання вихідних повідомлень
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу прив’язок потоків
  і реєстрації адаптерів
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли все ще потрібна
  застаріла структура полів корисного навантаження agent/media
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації користувацьких команд Telegram, валідації дублікатів/конфліктів і стабільного за резервним сценарієм контракту конфігурації команд

Канали лише з auth зазвичай можуть зупинитися на стандартному шляху: core обробляє підтвердження, а Plugin лише відкриває можливості outbound/auth. Канали нативного підтвердження, такі як Matrix, Slack, Telegram і користувацькі транспорти чату, мають використовувати спільні нативні допоміжні засоби замість створення власного життєвого циклу підтверджень.

## Політика вхідних згадок

Зберігайте обробку вхідних згадок розділеною на два рівні:

- збір доказів, що належить Plugin
- оцінювання спільної політики

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень політики згадок.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли вам потрібен ширший
барель допоміжних засобів для inbound.

Добре підходить для логіки на рівні Plugin:

- виявлення відповіді боту
- виявлення цитування бота
- перевірки участі в потоці
- виключення службових/системних повідомлень
- платформо-нативні кеші, потрібні для підтвердження участі бота

Добре підходить для спільного допоміжного засобу:

- `requireMention`
- явний результат згадки
- список дозволених неявних згадок
- обхід для команд
- фінальне рішення про пропуск

Рекомендований потік:

1. Обчисліть локальні факти згадок.
2. Передайте ці факти в `resolveInboundMentionDecision({ facts, policy })`.
3. Використовуйте `decision.effectiveWasMentioned`, `decision.shouldBypassMention` і `decision.shouldSkip` у вашому inbound gate.

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

`api.runtime.channel.mentions` відкриває ті самі спільні допоміжні засоби для згадок для
bundled Plugin каналів, які вже залежать від ін’єкції runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження
непов’язаних допоміжних засобів runtime для inbound.

Старіші допоміжні засоби `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як експорти сумісності. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли Plugin. Поле `channel` у `package.json` — це те,
    що робить його Plugin каналу. Повний набір поверхні метаданих пакета див. у
    [Налаштування Plugin і конфігурація](/uk/plugins/sdk-setup#openclaw-channel):

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

  <Step title="Створіть об’єкт Plugin каналу">
    Інтерфейс `ChannelPlugin` має багато необов’язкових поверхонь адаптера. Почніть
    із мінімуму — `id` і `setup` — і додавайте адаптери за потреби.

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
      Замість ручної реалізації низькорівневих інтерфейсів адаптера ви передаєте
      декларативні параметри, а конструктор їх компонує:

      | Параметр | Що він підключає |
      | --- | --- |
      | `security.dm` | Визначення політики безпеки DM з областю дії на основі полів конфігурації |
      | `pairing.text` | Текстовий процес парування DM з обміном кодами |
      | `threading` | Визначення режиму reply-to (фіксований, з областю облікового запису або користувацький) |
      | `outbound.attachedResults` | Функції надсилання, які повертають метадані результату (ідентифікатори повідомлень) |

      Ви також можете передавати сирі об’єкти адаптера замість декларативних параметрів,
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

    Розміщуйте дескриптори CLI, що належать каналу, у `registerCliMetadata(...)`, щоб OpenClaw
    міг показувати їх у довідці кореневого рівня без активації повного runtime каналу,
    водночас звичайні повні завантаження все одно підхоплюватимуть ті самі дескриптори для реєстрації
    реальних команд. Залишайте `registerFull(...)` для роботи лише на рівні runtime.
    Якщо `registerFull(...)` реєструє gateway RPC methods, використовуйте
    префікс, специфічний для Plugin. Простори імен адміністратора core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    визначаються як `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє розділення режимів реєстрації. Див.
    [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry), щоб побачити всі
    параметри.

  </Step>

  <Step title="Додайте setup entry">
    Створіть `setup-entry.ts` для легкого завантаження під час онбордингу:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнено
    або не налаштовано. Це дозволяє уникнути підключення важкого runtime-коду під час процесів налаштування.
    Докладніше див. у [Налаштування і конфігурація](/uk/plugins/sdk-setup#setup-entry).

    Bundled workspace channels, які виносять безпечні для setup експорти в sidecar
    модулі, можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний setter runtime для часу налаштування.

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш Plugin має отримувати повідомлення з платформи й пересилати їх до
    OpenClaw. Типовий шаблон — це Webhook, який перевіряє запит і
    dispatch-ить його через inbound handler вашого каналу:

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
      володіє власним inbound pipeline. Подивіться на bundled Plugin каналів
      (наприклад, пакет Plugin Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Тестування">
Пишіть colocated тести у `src/channel.test.ts`:

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

    Для спільних допоміжних засобів тестування див. [Тестування](/uk/plugins/sdk-testing).

  </Step>
</Steps>

## Структура файлів

```
<bundled-plugin-root>/acme-chat/
├── package.json              # метадані openclaw.channel
├── openclaw.plugin.json      # маніфест зі схемою конфігурації
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # публічні експорти (необов’язково)
├── runtime-api.ts            # внутрішні експорти runtime (необов’язково)
└── src/
    ├── channel.ts            # ChannelPlugin через createChatChannelPlugin
    ├── channel.test.ts       # тести
    ├── client.ts             # клієнт API платформи
    └── runtime.ts            # сховище runtime (за потреби)
```

## Розширені теми

<CardGroup cols={2}>
  <Card title="Параметри потоків" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані, з областю облікового запису або користувацькі режими відповідей
  </Card>
  <Card title="Інтеграція інструмента повідомлень" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Допоміжні засоби runtime" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі seams допоміжних засобів bundled все ще існують для підтримки bundled Plugin і
сумісності. Це не рекомендований шаблон для нових Plugin каналів;
віддавайте перевагу загальним subpath channel/setup/reply/runtime зі спільної
поверхні SDK, якщо тільки ви безпосередньо не підтримуєте цю родину bundled Plugin.
</Note>

## Наступні кроки

- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — якщо ваш Plugin також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повна довідка з імпортів subpath
- [Тестування SDK](/uk/plugins/sdk-testing) — утиліти тестування та контрактні тести
- [Маніфест Plugin](/uk/plugins/manifest) — повна схема маніфесту
