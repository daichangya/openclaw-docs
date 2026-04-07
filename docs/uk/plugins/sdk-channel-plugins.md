---
read_when:
    - Ви створюєте новий плагін каналу обміну повідомленнями
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення плагіна каналу обміну повідомленнями для OpenClaw
title: Створення плагінів каналів
x-i18n:
    generated_at: "2026-04-07T06:53:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0aab6cc835b292c62e33c52ad0c35f989fb1a5b225511e8bdc2972feb3c64f09
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Створення плагінів каналів

Цей посібник покроково пояснює створення плагіна каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці у вас буде працездатний канал із безпекою DM,
паруванням, потоками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви ще не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) про базову структуру пакета
  та налаштування маніфесту.
</Info>

## Як працюють плагіни каналів

Плагінам каналів не потрібні власні інструменти send/edit/react. OpenClaw зберігає один
спільний інструмент `message` у core. Ваш плагін відповідає за:

- **Config** — визначення облікового запису та майстер налаштування
- **Security** — політика DM та списки дозволених
- **Pairing** — потік схвалення DM
- **Session grammar** — як ідентифікатори розмов, специфічні для провайдера, зіставляються з базовими чатами, ідентифікаторами потоків і резервними батьківськими значеннями
- **Outbound** — надсилання тексту, медіа та опитувань на платформу
- **Threading** — як організовуються відповіді в потоки

Core відповідає за спільний інструмент повідомлень, підключення до prompt, зовнішню форму ключа сесії,
загальне ведення `:thread:` та диспетчеризацію.

Якщо ваша платформа зберігає додаткову область дії в ідентифікаторах розмов, зберігайте цей розбір
у плагіні через `messaging.resolveSessionConversation(...)`. Це
канонічний хук для зіставлення `rawId` з базовим ідентифікатором розмови, необов’язковим ідентифікатором потоку,
явним `baseConversationId` та будь-якими `parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їхній порядок
від найвужчого батьківського елемента до найширшої/базової розмови.

Вбудовані плагіни, яким потрібен такий самий розбір до запуску реєстру каналів,
також можуть експортувати файл верхнього рівня `session-key-api.ts` із
відповідним експортом `resolveSessionConversation(...)`. Core використовує цю безпечну для bootstrap поверхню
лише тоді, коли реєстр плагінів середовища виконання ще недоступний.

`messaging.resolveParentConversationCandidates(...)` залишається доступним як
застарілий резервний варіант сумісності, коли плагіну потрібні лише батьківські резервні значення поверх
загального/raw id. Якщо існують обидва хуки, core спочатку використовує
`resolveSessionConversation(...).parentConversationCandidates` і лише потім
переходить до `resolveParentConversationCandidates(...)`, якщо канонічний хук
їх не вказує.

## Схвалення та можливості каналу

Більшості плагінів каналів не потрібен код, специфічний для схвалень.

- Core відповідає за `/approve` у тому ж чаті, спільні payload кнопок схвалення та загальну резервну доставку.
- Віддавайте перевагу одному об’єкту `approvalCapability` у плагіні каналу, якщо каналу потрібна поведінка, специфічна для схвалень.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічний шов автентифікації схвалень.
- Якщо ваш канал надає нативні схвалення exec, реалізуйте `approvalCapability.getActionAvailabilityState`, навіть якщо нативний транспорт повністю знаходиться в `approvalCapability.native`. Core використовує цей хук доступності, щоб розрізняти `enabled` і `disabled`, визначати, чи підтримує канал-ініціатор нативні схвалення, і включати канал до інструкцій резервного варіанта для нативного клієнта.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для специфічної для каналу поведінки життєвого циклу payload, наприклад приховування дубльованих локальних запитів на схвалення або надсилання індикаторів набору перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для нативної маршрутизації схвалень або вимкнення резервного варіанта.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload схвалення замість спільного рендерера.
- Використовуйте `approvalCapability.describeExecApprovalSetup`, якщо канал хоче, щоб відповідь для вимкненого шляху пояснювала точні параметри config, потрібні для ввімкнення нативних схвалень exec. Хук отримує `{ channel, channelLabel, accountId }`; канали з іменованими обліковими записами мають відображати шляхи з областю дії облікового запису, такі як `channels.<channel>.accounts.<id>.execApprovals.*`, замість дефолтів верхнього рівня.
- Якщо канал може вивести стабільні DM-ідентичності, подібні до власника, з наявного config, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому ж чаті без додавання логіки core, специфічної для схвалень.
- Якщо каналу потрібна нативна доставка схвалень, зосередьте код каналу на нормалізації цілі та хуках транспорту. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability` і `createChannelNativeApprovalRuntime` з `openclaw/plugin-sdk/approval-runtime`, щоб core відповідав за фільтрацію запитів, маршрутизацію, усунення дублікатів, строк дії та підписку на gateway.
- Канали нативних схвалень мають маршрутизувати і `accountId`, і `approvalKind` через ці helper-и. `accountId` утримує політику схвалень для кількох облікових записів у межах правильного бот-облікового запису, а `approvalKind` зберігає поведінку схвалень exec і plugin доступною для каналу без жорстко закодованих гілок у core.
- Зберігайте тип delivered approval id наскрізно. Нативні клієнти не повинні
  вгадувати або переписувати маршрутизацію схвалень exec чи plugin на основі локального стану каналу.
- Різні типи схвалень можуть навмисно надавати різні нативні поверхні.
  Поточні приклади вбудованих:
  - Slack зберігає доступність нативної маршрутизації схвалень як для exec, так і для plugin id.
  - Matrix зберігає нативну DM/канальну маршрутизацію лише для схвалень exec і залишає
    схвалення plugin на спільному шляху `/approve` у тому ж чаті.
- `createApproverRestrictedNativeApprovalAdapter` усе ще існує як обгортка сумісності, але новий код має віддавати перевагу builder-у можливостей і експонувати `approvalCapability` у плагіні.

Для гарячих точок входу каналу віддавайте перевагу вужчим runtime subpath, коли вам
потрібна лише одна частина цієї сім’ї:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

Так само віддавайте перевагу `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` і
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша узагальнена
поверхня.

Зокрема для налаштування:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime helper-и налаштування:
  безпечні для import адаптери патчів налаштування (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані
  builder-и setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузький env-aware шов адаптера
  для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює builder-и налаштування з необов’язковим встановленням
  плюс кілька примітивів, безпечних для setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Якщо ваш канал підтримує налаштування або auth на основі env і загальні потоки startup/config
мають знати ці назви env до завантаження runtime, оголосіть їх у
маніфесті плагіна через `channelEnvVars`. Зберігайте runtime `envVars` каналу або локальні
константи лише для копії, орієнтованої на оператора.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
`splitSetupEntries`

- використовуйте ширший шов `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні helper-и setup/config, наприклад
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал хоче лише рекламувати «спочатку встановіть цей плагін» у поверхнях setup,
віддавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенеровані
адаптер/майстер fail closed під час запису config та завершення, і повторно використовують
те саме повідомлення про необхідність встановлення в копії валідації, finalize та docs-link.

Для інших гарячих шляхів каналу віддавайте перевагу вузьким helper-ам замість ширших застарілих
поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для config кількох облікових записів та
  резервного варіанта для облікового запису за замовчуванням
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для маршруту/конверта inbound та
  запису й диспетчеризації
- `openclaw/plugin-sdk/messaging-targets` для розбору/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа плюс
  делегатів ідентичності/надсилання outbound
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу прив’язок потоків
  та реєстрації адаптерів
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли все ще потрібне
  застаріле компонування полів payload agent/media
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації користувацьких команд Telegram,
  перевірки дублікатів/конфліктів і стабільного для резервного варіанта контракту
  config команд

Канали лише з auth зазвичай можуть зупинитися на стандартному шляху: core обробляє схвалення, а плагін лише надає можливості outbound/auth. Канали нативних схвалень, такі як Matrix, Slack, Telegram і користувацькі chat-транспорти, повинні використовувати спільні нативні helper-и замість власної реалізації життєвого циклу схвалень.

## Політика вхідних згадок

Розділяйте обробку вхідних згадок на два шари:

- збирання доказів, яким володіє плагін
- спільне оцінювання політики

Для спільного шару використовуйте `openclaw/plugin-sdk/channel-inbound`.

Добре підходить для локальної логіки плагіна:

- виявлення reply-to-bot
- виявлення quoted-bot
- перевірки участі в потоці
- виключення службових/системних повідомлень
- платформені нативні кеші, потрібні для підтвердження участі бота

Добре підходить для спільного helper-а:

- `requireMention`
- явний результат згадки
- список дозволених неявних згадок
- обхід команди
- фінальне рішення про пропуск

Бажаний потік:

1. Обчисліть локальні факти згадок.
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

`api.runtime.channel.mentions` надає ті самі спільні helper-и згадок для
вбудованих плагінів каналів, які вже залежать від ін’єкції runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Старіші helper-и `resolveMentionGating*` залишаються в
`openclaw/plugin-sdk/channel-inbound` лише як експорти сумісності. Новий код
має використовувати `resolveInboundMentionDecision({ facts, policy })`.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли плагіна. Поле `channel` у `package.json` —
    це те, що робить його плагіном каналу. Повну поверхню метаданих пакета
    дивіться в [Налаштування плагіна і Config](/uk/plugins/sdk-setup#openclawchannel):

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

  <Step title="Створіть об’єкт плагіна каналу">
    Інтерфейс `ChannelPlugin` має багато необов’язкових поверхонь адаптера. Почніть із
    мінімуму — `id` і `setup` — і додавайте адаптери за потреби.

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

    <Accordion title="Що робить для вас createChatChannelPlugin">
      Замість ручної реалізації низькорівневих інтерфейсів адаптера ви передаєте
      декларативні параметри, а builder компонуватиме їх:

      | Параметр | Що він підключає |
      | --- | --- |
      | `security.dm` | Визначення scoped DM security з полів config |
      | `pairing.text` | Потік парування DM на основі тексту з обміном кодом |
      | `threading` | Визначення режиму reply-to (фіксований, у межах облікового запису або користувацький) |
      | `outbound.attachedResults` | Функції надсилання, що повертають метадані результату (ідентифікатори повідомлень) |

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

    Розміщуйте CLI-дескриптори, що належать каналу, у `registerCliMetadata(...)`, щоб OpenClaw
    міг показувати їх у кореневій довідці без активації повного runtime каналу,
    тоді як звичайні повні завантаження все одно підхоплюватимуть ті самі дескриптори для реєстрації
    реальних команд. Залишайте `registerFull(...)` для роботи лише в runtime.
    Якщо `registerFull(...)` реєструє gateway RPC methods, використовуйте
    префікс, специфічний для плагіна. Простори імен адміністрування core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими та завжди
    визначаються як `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє поділ режимів реєстрації. Усі
    параметри дивіться в [Точки входу](/uk/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Додайте запис налаштування">
    Створіть `setup-entry.ts` для легкого завантаження під час онбордингу:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує це замість повної точки входу, коли канал вимкнений
    або не налаштований. Це дає змогу не підтягувати важкий runtime-код під час потоків setup.
    Подробиці дивіться в [Setup and Config](/uk/plugins/sdk-setup#setup-entry).

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Вашому плагіну потрібно отримувати повідомлення з платформи та пересилати їх до
    OpenClaw. Типовий шаблон — це webhook, який перевіряє запит і
    диспетчеризує його через inbound-обробник вашого каналу:

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
      Обробка вхідних повідомлень залежить від каналу. Кожен плагін каналу має
      власний inbound-конвеєр. Подивіться на вбудовані плагіни каналів
      (наприклад, пакет плагіна Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Тестування">
Пишіть colocated тести в `src/channel.test.ts`:

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

    Спільні helper-и для тестування дивіться в [Тестування](/uk/plugins/sdk-testing).

  </Step>
</Steps>

## Структура файлів

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadata openclaw.channel
├── openclaw.plugin.json      # Маніфест зі схемою config
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
    Фіксовані, у межах облікового запису або користувацькі режими reply
  </Card>
  <Card title="Інтеграція інструмента message" icon="puzzle" href="/uk/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілі" icon="crosshair" href="/uk/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helper-и" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, STT, media, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі вбудовані helper-шви все ще існують для підтримки вбудованих плагінів і
сумісності. Вони не є рекомендованим шаблоном для нових плагінів каналів;
віддавайте перевагу загальним channel/setup/reply/runtime subpath зі спільної
поверхні SDK, якщо тільки ви безпосередньо не підтримуєте цю сім’ю вбудованих плагінів.
</Note>

## Наступні кроки

- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — якщо ваш плагін також надає моделі
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник з import subpath
- [Тестування SDK](/uk/plugins/sdk-testing) — тестові утиліти та контрактні тести
- [Маніфест плагіна](/uk/plugins/manifest) — повна схема маніфесту
