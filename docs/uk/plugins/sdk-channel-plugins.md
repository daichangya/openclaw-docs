---
read_when:
    - Ви створюєте новий plugin каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення plugin каналу обміну повідомленнями для OpenClaw
title: Створення plugin каналів
x-i18n:
    generated_at: "2026-04-21T04:19:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 569394aeefa0231ae3157a13406f91c97fe7eeff2b62df0d35a893f1ad4d5d05
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Створення plugin каналів

Цей посібник описує створення plugin каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці ви матимете робочий канал із
безпекою приватних повідомлень, сполученням, гілками відповідей і вихідними
повідомленнями.

<Info>
  Якщо ви ще не створювали жодного plugin для OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) про базову структуру пакета та
  налаштування маніфесту.
</Info>

## Як працюють plugin каналів

Plugin каналів не потребують власних інструментів send/edit/react. OpenClaw
зберігає один спільний інструмент `message` у ядрі. Ваш plugin відповідає за:

- **Config** — визначення облікового запису та майстер налаштування
- **Security** — політика приватних повідомлень і списки дозволених
- **Pairing** — потік підтвердження приватних повідомлень
- **Session grammar** — як ідентифікатори розмов, специфічні для провайдера, зіставляються з базовими чатами, ідентифікаторами гілок і резервними батьківськими значеннями
- **Outbound** — надсилання тексту, медіа та опитувань на платформу
- **Threading** — як організовуються гілки відповідей

Ядро відповідає за спільний інструмент повідомлень, підключення промптів,
зовнішню форму ключа сесії, загальний облік `:thread:` і диспетчеризацію.

Якщо ваш канал додає параметри інструмента повідомлень, які містять джерела
медіа, надайте назви цих параметрів через
`describeMessageTool(...).mediaSourceParams`. Ядро використовує цей явний
список для нормалізації шляхів у sandbox і політики доступу до вихідних медіа,
тому plugin не потребують особливих випадків у спільному ядрі для параметрів
аватарів, вкладень або зображень обкладинки, специфічних для провайдера.
Надавайте перевагу поверненню мапи з ключами дій, наприклад
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, щоб не пов’язані дії не
успадковували медіа-аргументи іншої дії. Плоский масив також працює для
параметрів, які навмисно спільні для кожної доступної дії.

Якщо ваша платформа зберігає додаткову область видимості в ідентифікаторах
розмов, залиште цей розбір у plugin через
`messaging.resolveSessionConversation(...)`. Це канонічний хук для зіставлення
`rawId` з базовим ідентифікатором розмови, необов’язковим ідентифікатором
гілки, явним `baseConversationId` і будь-якими
`parentConversationCandidates`. Коли ви повертаєте
`parentConversationCandidates`, зберігайте їхній порядок від найвужчого
батьківського значення до найширшої/базової розмови.

Вбудовані plugin, яким потрібен той самий розбір до запуску реєстру каналів,
також можуть надавати файл верхнього рівня `session-key-api.ts` із відповідним
експортом `resolveSessionConversation(...)`. Ядро використовує цю безпечну для
bootstrap поверхню лише тоді, коли реєстр plugin під час виконання ще
недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий резервний варіант сумісності, коли plugin потребує лише резервних
батьківських значень поверх загального/raw id. Якщо існують обидва хуки, ядро
спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і лише потім
переходить до `resolveParentConversationCandidates(...)`, якщо канонічний хук
їх не повертає.

## Підтвердження та можливості каналу

Більшості plugin каналів не потрібен код, специфічний для підтверджень.

- Ядро відповідає за `/approve` у тому самому чаті, спільні payload кнопок підтвердження та загальну резервну доставку.
- Надавайте перевагу одному об’єкту `approvalCapability` у plugin каналу, якщо каналу потрібна поведінка, специфічна для підтверджень.
- `ChannelPlugin.approvals` видалено. Розміщуйте факти доставки/власного режиму/рендерингу/автентифікації підтверджень у `approvalCapability`.
- `plugin.auth` — лише для login/logout; ядро більше не читає хуки автентифікації підтверджень із цього об’єкта.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічна поверхня для автентифікації підтверджень.
- Використовуйте `approvalCapability.getActionAvailabilityState` для доступності автентифікації підтвердження в тому самому чаті.
- Якщо ваш канал надає власні exec-підтвердження, використовуйте `approvalCapability.getExecInitiatingSurfaceState` для стану поверхні ініціювання/власного клієнта, коли він відрізняється від автентифікації підтвердження в тому самому чаті. Ядро використовує цей специфічний для exec хук, щоб розрізняти `enabled` і `disabled`, визначати, чи підтримує канал ініціювання власні exec-підтвердження, і включати канал до інструкцій резервного шляху для власного клієнта. `createApproverRestrictedNativeApprovalCapability(...)` заповнює це для типового випадку.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для поведінки життєвого циклу payload, специфічної для каналу, наприклад для приховування дубльованих локальних запитів на підтвердження або надсилання індикаторів набору перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для маршрутизації власних підтверджень або придушення резервної доставки.
- Використовуйте `approvalCapability.nativeRuntime` для фактів власних підтверджень, що належать каналу. Зберігайте ліниве завантаження на гарячих точках входу каналу за допомогою `createLazyChannelApprovalNativeRuntimeAdapter(...)`, який може імпортувати ваш runtime-модуль на вимогу, водночас дозволяючи ядру зібрати життєвий цикл підтвердження.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload підтвердження замість спільного рендерера.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, коли канал хоче, щоб відповідь для вимкненого шляху пояснювала точні параметри config, потрібні для ввімкнення власних exec-підтверджень. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають рендерити шляхи в області облікового запису, наприклад `channels.<channel>.accounts.<id>.execApprovals.*`, а не типові шляхи верхнього рівня.
- Якщо канал може вивести стабільні DM-ідентичності на кшталт власника з наявного config, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання логіки ядра, специфічної для підтверджень.
- Якщо каналу потрібна доставка власних підтверджень, зосередьте код каналу на нормалізації цілей і фактах транспорту/представлення. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` і `createApproverRestrictedNativeApprovalCapability` з `openclaw/plugin-sdk/approval-runtime`. Розміщуйте факти, специфічні для каналу, за `approvalCapability.nativeRuntime`, бажано через `createChannelApprovalNativeRuntimeAdapter(...)` або `createLazyChannelApprovalNativeRuntimeAdapter(...)`, щоб ядро могло зібрати обробник і взяти на себе фільтрацію запитів, маршрутизацію, дедуплікацію, закінчення строку дії, підписку на gateway і сповіщення про перенаправлення в інше місце. `nativeRuntime` поділено на кілька менших поверхонь:
- `availability` — чи налаштовано обліковий запис і чи слід обробляти запит
- `presentation` — зіставлення спільної view-model підтвердження з власними payload у станах pending/resolved/expired або з фінальними діями
- `transport` — підготовка цілей, а також надсилання/оновлення/видалення власних повідомлень підтвердження
- `interactions` — необов’язкові хуки bind/unbind/clear-action для власних кнопок або реакцій
- `observe` — необов’язкові хуки діагностики доставки
- Якщо каналу потрібні об’єкти, що належать runtime, як-от клієнт, токен, Bolt app або приймач Webhook, реєструйте їх через `openclaw/plugin-sdk/channel-runtime-context`. Загальний реєстр runtime-context дозволяє ядру bootstrap-ити обробники, керовані можливостями, зі стану запуску каналу без додавання glue-коду обгорток, специфічного для підтверджень.
- Використовуйте низькорівневі `createChannelApprovalHandler` або `createChannelNativeApprovalRuntime` лише тоді, коли поверхня, керована можливостями, поки що недостатньо виразна.
- Канали власних підтверджень мають маршрутизувати і `accountId`, і `approvalKind` через ці helper-и. `accountId` зберігає область політики підтверджень для кількох облікових записів у межах правильного bot account, а `approvalKind` зберігає доступність поведінки exec і plugin підтверджень для каналу без жорстко закодованих гілок у ядрі.
- Тепер ядро також відповідає за сповіщення про перенаправлення підтверджень. Plugin каналів не повинні надсилати власні додаткові повідомлення на кшталт «підтвердження перейшло в приватні повідомлення / інший канал» із `createChannelNativeApprovalRuntime`; натомість надавайте точну маршрутизацію origin + approver-DM через спільні helper-и можливостей підтвердження й дозвольте ядру агрегувати фактичні доставки перед публікацією будь-якого сповіщення назад в ініціювальний чат.
- Зберігайте наскрізно вид ідентифікатора доставленого підтвердження. Власні клієнти не повинні вгадувати або переписувати маршрутизацію exec чи plugin підтверджень на основі локального стану каналу.
- Різні типи підтверджень можуть навмисно надавати різні власні поверхні.
  Поточні приклади вбудованих plugin:
  - Slack зберігає доступність маршрутизації власних підтверджень як для exec, так і для plugin id.
  - Matrix зберігає ту саму маршрутизацію власних DM/каналів і UX реакцій для exec і plugin підтверджень, водночас дозволяючи, щоб автентифікація відрізнялася залежно від типу підтвердження.
- `createApproverRestrictedNativeApprovalAdapter` усе ще існує як обгортка сумісності, але новий код має надавати перевагу builder-у можливостей і експортувати `approvalCapability` у plugin.

Для гарячих точок входу каналу надавайте перевагу вужчим runtime-підшляхам, коли вам потрібна лише одна частина цієї групи:

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
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша узагальнена
поверхня.

Для setup зокрема:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime helper-и setup:
  безпечні для імпорту patched-адаптери setup (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), виведення примітки пошуку,
  `promptResolvedAllowFrom`, `splitSetupEntries` і builder-и
  проксі делегованого setup
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузька env-aware поверхня
  адаптера для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює builder-и setup для
  необов’язкового встановлення, а також кілька безпечних для setup примітивів:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує setup або auth, керовані env, і загальні потоки
startup/config мають знати ці назви env ще до завантаження runtime, оголосіть
їх у маніфесті plugin через `channelEnvVars`. Залишайте runtime `envVars`
каналу або локальні константи лише для операторського тексту.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширшу поверхню `openclaw/plugin-sdk/setup` лише тоді, коли вам
  також потрібні важчі спільні helper-и setup/config, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал хоче лише рекламувати «спочатку встановіть цей plugin» у
поверхнях setup, надавайте перевагу `createOptionalChannelSetupSurface(...)`.
Згенеровані adapter/wizard відмовляють за замовчуванням під час запису config і
фіналізації, а також повторно використовують те саме повідомлення про
необхідність встановлення у валідації, фіналізації й тексті з посиланням на
документацію.

Для інших гарячих шляхів каналу надавайте перевагу вузьким helper-ам замість
ширших застарілих поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для multi-account config і
  резервного переходу до облікового запису за замовчуванням
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для маршруту/конверта inbound і
  wiring запису та диспетчеризації
- `openclaw/plugin-sdk/messaging-targets` для розбору/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа, а також
  делегатів ідентичності/надсилання outbound і планування payload
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу прив’язок
  гілок і реєстрації адаптерів
- `openclaw/plugin-sdk/agent-media-payload` лише коли все ще потрібне
  застаріле компонування полів payload агента/медіа
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації
  користувацьких команд Telegram, валідації дублікатів/конфліктів і
  стабільного резервного контракту config команд

Канали лише з auth зазвичай можуть зупинитися на типовому шляху: ядро обробляє підтвердження, а plugin просто надає можливості outbound/auth. Канали власних підтверджень, як-от Matrix, Slack, Telegram і власні транспорти чатів, мають використовувати спільні helper-и для власних підтверджень замість створення власного життєвого циклу підтверджень.

## Політика вхідних згадок

Розділяйте обробку вхідних згадок на два рівні:

- збирання даних, яке належить plugin
- оцінювання спільної політики

Використовуйте `openclaw/plugin-sdk/channel-mention-gating` для рішень щодо
політики згадок.
Використовуйте `openclaw/plugin-sdk/channel-inbound` лише тоді, коли вам
потрібен ширший barrel helper-ів для inbound.

Підходить для локальної логіки plugin:

- виявлення відповіді bot-у
- виявлення цитування bot-а
- перевірки участі в гілці
- виключення сервісних/системних повідомлень
- власні кеші платформи, потрібні для підтвердження участі bot-а

Підходить для спільного helper-а:

- `requireMention`
- явний результат згадки
- список дозволених неявних згадок
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

`api.runtime.channel.mentions` надає ті самі спільні helper-и для згадок
для вбудованих plugin каналів, які вже залежать від ін’єкції runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Якщо вам потрібні лише `implicitMentionKindWhen` і
`resolveInboundMentionDecision`, імпортуйте з
`openclaw/plugin-sdk/channel-mention-gating`, щоб уникнути завантаження
непов’язаних runtime helper-ів для inbound.

Старіші helper-и `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як сумісні експорти. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли plugin. Поле `channel` у `package.json`
    робить це plugin каналу. Повну поверхню метаданих пакета
    див. у [Налаштування plugin і Config](/uk/plugins/sdk-setup#openclaw-channel):

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

  <Step title="Створіть об’єкт plugin каналу">
    Інтерфейс `ChannelPlugin` має багато необов’язкових поверхонь адаптера. Почніть із мінімуму — `id` і `setup` — і додавайте адаптери за потреби.

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
      декларативні параметри, а builder їх компонує:

      | Option | Що він підключає |
      | --- | --- |
      | `security.dm` | Обмежений за областю визначник безпеки приватних повідомлень із полів config |
      | `pairing.text` | Текстовий потік сполучення приватних повідомлень з обміном кодами |
      | `threading` | Визначник режиму reply-to (фіксований, в області облікового запису або власний) |
      | `outbound.attachedResults` | Функції надсилання, які повертають метадані результату (ідентифікатори повідомлень) |

      Ви також можете передавати сирі об’єкти адаптерів замість декларативних параметрів,
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
    міг показувати їх у кореневій довідці без активації повного runtime каналу,
    тоді як звичайні повні завантаження все одно підхоплюватимуть ті самі дескриптори для фактичної реєстрації команд. Залишайте `registerFull(...)` для роботи лише під час виконання.
    Якщо `registerFull(...)` реєструє методи Gateway RPC, використовуйте
    префікс, специфічний для plugin. Простори імен адміністратора ядра (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
    визначаються як `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє цей поділ режимів реєстрації. Див.
    [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry) для всіх
    параметрів.

  </Step>

  <Step title="Додайте запис setup">
    Створіть `setup-entry.ts` для легкого завантаження під час onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнено
    або не налаштовано. Це дає змогу уникнути підтягування важкого runtime-коду під час потоків setup.
    Докладніше див. у [Setup і Config](/uk/plugins/sdk-setup#setup-entry).

    Вбудовані workspace-канали, які розділяють безпечні для setup експорти на sidecar-модулі,
    можуть використовувати `defineBundledChannelSetupEntry(...)` з
    `openclaw/plugin-sdk/channel-entry-contract`, коли їм також потрібен
    явний setter runtime для часу setup.

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш plugin має отримувати повідомлення з платформи та пересилати їх до
    OpenClaw. Типовий шаблон — це Webhook, який перевіряє запит і
    диспетчеризує його через обробник inbound вашого каналу:

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
      Обробка вхідних повідомлень залежить від каналу. Кожен plugin каналу
      володіє власним pipeline inbound. Подивіться на вбудовані plugin каналів
      (наприклад, пакет plugin Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Тестування">
Пишіть колоковані тести в `src/channel.test.ts`:

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

    Спільні helper-и для тестування див. у [Тестування](/uk/plugins/sdk-testing).

  </Step>
</Steps>

## Структура файлів

```
<bundled-plugin-root>/acme-chat/
├── package.json              # метадані openclaw.channel
├── openclaw.plugin.json      # Маніфест зі схемою config
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Публічні експорти (необов’язково)
├── runtime-api.ts            # Внутрішні runtime-експорти (необов’язково)
└── src/
    ├── channel.ts            # ChannelPlugin через createChatChannelPlugin
    ├── channel.test.ts       # Тести
    ├── client.ts             # API-клієнт платформи
    └── runtime.ts            # runtime-сховище (за потреби)
```

## Розширені теми

<CardGroup cols={2}>
  <Card title="Параметри гілок" icon="git-branch" href="/uk/plugins/sdk-entrypoints#registration-mode">
    Фіксовані, обмежені обліковим записом або власні режими відповідей
  </Card>
  <Card title="Інтеграція інструмента повідомлень" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helper-и" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі вбудовані поверхні helper-ів усе ще існують для підтримки й сумісності
вбудованих plugin. Це не рекомендований шаблон для нових plugin каналів;
надавайте перевагу загальним підшляхам channel/setup/reply/runtime зі спільної
поверхні SDK, якщо лише ви не підтримуєте цю родину вбудованих plugin
безпосередньо.
</Note>

## Наступні кроки

- [Plugin провайдерів](/uk/plugins/sdk-provider-plugins) — якщо ваш plugin також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Тестування SDK](/uk/plugins/sdk-testing) — утиліти тестування й контрактні тести
- [Маніфест plugin](/uk/plugins/manifest) — повна схема маніфесту
