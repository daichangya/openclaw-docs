---
read_when:
    - Ви створюєте новий plugin каналу повідомлень
    - Ви хочете підключити OpenClaw до платформи обміну повідомленнями
    - Вам потрібно зрозуміти поверхню адаптера ChannelPlugin
sidebarTitle: Channel Plugins
summary: Покроковий посібник зі створення plugin каналу повідомлень для OpenClaw
title: Створення plugin каналів
x-i18n:
    generated_at: "2026-04-05T18:12:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a6ad2c75549db8ce54f7e22ca9850d7ed68c5cd651c9bb41c9f73769f48aba
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Створення plugin каналів

Цей посібник покроково пояснює створення plugin каналу, який підключає OpenClaw до
платформи обміну повідомленнями. Наприкінці ви матимете робочий канал із безпекою DM,
pairing, гілками відповідей і вихідними повідомленнями.

<Info>
  Якщо ви ще не створювали жодного plugin для OpenClaw, спочатку прочитайте
  [Getting Started](/plugins/building-plugins) про базову структуру пакета
  та налаштування маніфесту.
</Info>

## Як працюють plugin каналів

Plugin каналів не потребують власних інструментів send/edit/react. OpenClaw зберігає один
спільний інструмент `message` у core. Ваш plugin відповідає за:

- **Config** — визначення облікового запису та майстер налаштування
- **Security** — політику DM і allowlist
- **Pairing** — потік підтвердження DM
- **Граматику сесій** — те, як специфічні для провайдера ідентифікатори розмов зіставляються з базовими чатами, ідентифікаторами гілок і резервними батьківськими значеннями
- **Outbound** — надсилання тексту, медіа та опитувань на платформу
- **Threading** — як упорядковуються відповіді в гілках

Core відповідає за спільний інструмент message, підключення prompt, зовнішню форму ключа сесії,
загальний облік `:thread:` і диспетчеризацію.

Якщо ваша платформа зберігає додаткову область в ідентифікаторах розмов, залиште цей розбір
у plugin через `messaging.resolveSessionConversation(...)`. Це
канонічний hook для зіставлення `rawId` з базовим ідентифікатором розмови, необов’язковим
ідентифікатором гілки, явним `baseConversationId` і будь-якими
`parentConversationCandidates`.
Коли ви повертаєте `parentConversationCandidates`, зберігайте їх порядок
від найвужчого батьківського елемента до найширшої/базової розмови.

Bundled plugin, яким потрібен той самий розбір до запуску реєстру каналів,
також можуть надавати файл верхнього рівня `session-key-api.ts` із відповідним
експортом `resolveSessionConversation(...)`. Core використовує цю безпечну для bootstrap поверхню
лише тоді, коли реєстр runtime plugin ще недоступний.

`messaging.resolveParentConversationCandidates(...)` і далі доступний як
застарілий сумісний резервний механізм, коли plugin потрібні лише
резервні батьківські значення поверх загального/raw id. Якщо існують обидва hooks, core використовує
спочатку `resolveSessionConversation(...).parentConversationCandidates` і лише потім
повертається до `resolveParentConversationCandidates(...)`, якщо канонічний hook
їх не надає.

## Підтвердження та можливості каналів

Більшості plugin каналів не потрібен код, специфічний для підтверджень.

- Core відповідає за `/approve` у тому самому чаті, спільні payload кнопок підтвердження та загальну резервну доставку.
- Надавайте перевагу одному об’єкту `approvalCapability` у plugin каналу, коли каналу потрібна специфічна для підтверджень поведінка.
- `approvalCapability.authorizeActorAction` і `approvalCapability.getActionAvailabilityState` — це канонічний шов авторизації підтверджень.
- Використовуйте `outbound.shouldSuppressLocalPayloadPrompt` або `outbound.beforeDeliverPayload` для поведінки життєвого циклу payload, специфічної для каналу, наприклад приховування дублікатів локальних prompt підтвердження або надсилання індикаторів набору тексту перед доставкою.
- Використовуйте `approvalCapability.delivery` лише для нативної маршрутизації підтверджень або придушення резервного механізму.
- Використовуйте `approvalCapability.render` лише тоді, коли каналу справді потрібні власні payload підтверджень замість спільного renderer.
- Якщо канал може виводити стабільні DM-ідентичності, подібні до власника, з наявного config, використовуйте `createResolvedApproverActionAuthAdapter` з `openclaw/plugin-sdk/approval-runtime`, щоб обмежити `/approve` у тому самому чаті без додавання специфічної для підтверджень логіки в core.
- Якщо каналу потрібна нативна доставка підтверджень, зосередьте код каналу на нормалізації цілей і транспортних hooks. Використовуйте `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability` і `createChannelNativeApprovalRuntime` з `openclaw/plugin-sdk/approval-runtime`, щоб core відповідав за фільтрацію запитів, маршрутизацію, дедуплікацію, термін дії та підписку gateway.
- Канали з нативними підтвердженнями мають маршрутизувати і `accountId`, і `approvalKind` через ці helper. `accountId` забезпечує прив’язку політики підтверджень для кількох облікових записів до правильного bot account, а `approvalKind` зберігає доступність поведінки exec і plugin для каналу без жорстко закодованих гілок у core.
- Зберігайте тип delivered approval id від початку до кінця. Нативні клієнти не повинні
  вгадувати або переписувати маршрутизацію exec чи plugin підтверджень на основі локального стану каналу.
- Різні види підтверджень можуть навмисно відкривати різні нативні поверхні.
  Поточні bundled приклади:
  - Slack зберігає доступність нативної маршрутизації підтверджень і для exec, і для plugin id.
  - Matrix зберігає нативну DM/канальну маршрутизацію лише для exec-підтверджень і залишає
    plugin-підтвердження на спільному шляху `/approve` у тому самому чаті.
- `createApproverRestrictedNativeApprovalAdapter` і далі існує як сумісна обгортка, але новий код має віддавати перевагу builder можливостей і надавати `approvalCapability` у plugin.

Для гарячих точок входу каналів надавайте перевагу вужчим runtime subpath, коли вам потрібна лише одна частина цієї сім’ї:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

Так само надавайте перевагу `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` і
`openclaw/plugin-sdk/reply-chunking`, коли вам не потрібна ширша umbrella-поверхня.

Окремо для setup:

- `openclaw/plugin-sdk/setup-runtime` охоплює безпечні для runtime helper для setup:
  безпечні для import адаптери patched setup (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), вивід приміток lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` і delegated
  builder setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` — це вузький env-aware adapter
  seam для `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` охоплює builder optional-install setup
  плюс кілька безпечних для setup примітивів:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,
  `createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
  `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` і
  `splitSetupEntries`
- використовуйте ширший seam `openclaw/plugin-sdk/setup` лише тоді, коли вам також потрібні
  важчі спільні helper для setup/config, такі як
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Якщо ваш канал хоче лише рекламувати "спочатку встановіть цей plugin" у поверхнях setup,
надавайте перевагу `createOptionalChannelSetupSurface(...)`. Згенеровані
adapter/wizard закриваються безпечно для записів config і фіналізації, а також повторно використовують
одне й те саме повідомлення про обов’язкове встановлення у валідації, finalize і тексті з посиланням на docs.

Для інших гарячих шляхів каналів надавайте перевагу вузьким helper замість ширших застарілих
поверхонь:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` і
  `openclaw/plugin-sdk/account-helpers` для config із кількома обліковими записами та
  резервного механізму account за замовчуванням
- `openclaw/plugin-sdk/inbound-envelope` і
  `openclaw/plugin-sdk/inbound-reply-dispatch` для маршруту/конверта вхідних повідомлень та
  підключення запису і диспетчеризації
- `openclaw/plugin-sdk/messaging-targets` для розбору/зіставлення цілей
- `openclaw/plugin-sdk/outbound-media` і
  `openclaw/plugin-sdk/outbound-runtime` для завантаження медіа плюс delegate
  вихідної ідентичності/надсилання
- `openclaw/plugin-sdk/thread-bindings-runtime` для життєвого циклу прив’язок гілок
  і реєстрації adapter
- `openclaw/plugin-sdk/agent-media-payload` лише тоді, коли все ще потрібна
  застаріла схема полів payload агента/медіа
- `openclaw/plugin-sdk/telegram-command-config` для нормалізації власних команд Telegram,
  валідації дублікатів/конфліктів і стабільного щодо резервного механізму контракту config команд

Канали лише з auth зазвичай можуть зупинитися на стандартному шляху: core обробляє підтвердження, а plugin просто надає можливості outbound/auth. Канали з нативними підтвердженнями, як-от Matrix, Slack, Telegram і custom chat transport, повинні використовувати спільні нативні helper замість власної реалізації життєвого циклу підтверджень.

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Пакет і маніфест">
    Створіть стандартні файли plugin. Поле `channel` у `package.json`
    робить цей plugin канальним plugin. Повний опис поверхні метаданих пакета
    див. у [Plugin Setup and Config](/plugins/sdk-setup#openclawchannel):

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
    Інтерфейс `ChannelPlugin` має багато необов’язкових поверхонь adapter. Почніть із
    мінімуму — `id` і `setup` — і додавайте adapter за потреби.

    Створіть `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // ваш клієнт API платформи

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

      // Безпека DM: хто може писати боту
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: потік підтвердження для нових контактів у DM
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
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

    <Accordion title="Що для вас робить createChatChannelPlugin">
      Замість ручної реалізації низькорівневих інтерфейсів adapter ви передаєте
      декларативні параметри, а builder компонує їх:

      | Параметр | Що він підключає |
      | --- | --- |
      | `security.dm` | Scoped-резолвер безпеки DM з полів config |
      | `pairing.text` | Потік pairing у DM на основі тексту з обміном кодами |
      | `threading` | Резолвер режиму reply-to (фіксований, scoped за account або custom) |
      | `outbound.attachedResults` | Функції надсилання, які повертають метадані результату (ідентифікатори повідомлень) |

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

    Розміщуйте CLI descriptors, якими володіє канал, у `registerCliMetadata(...)`, щоб OpenClaw
    міг показувати їх у кореневій довідці без активації повного runtime каналу,
    а звичайні повні завантаження все одно підхоплювали ті самі descriptors для реєстрації реальних команд.
    Залишайте `registerFull(...)` для роботи лише під час runtime.
    Якщо `registerFull(...)` реєструє gateway RPC methods, використовуйте
    prefix, специфічний для plugin. Простори імен адміністрування core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими і завжди
    зіставляються з `operator.admin`.
    `defineChannelPluginEntry` автоматично обробляє поділ режимів реєстрації. Див.
    [Entry Points](/plugins/sdk-entrypoints#definechannelpluginentry) для всіх
    параметрів.

  </Step>

  <Step title="Додайте setup entry">
    Створіть `setup-entry.ts` для легкого завантаження під час onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw завантажує цей файл замість повної точки входу, коли канал вимкнено
    або не налаштовано. Це дозволяє уникнути підтягування важкого runtime-коду під час потоків setup.
    Подробиці див. у [Setup and Config](/plugins/sdk-setup#setup-entry).

  </Step>

  <Step title="Обробляйте вхідні повідомлення">
    Ваш plugin має отримувати повідомлення з платформи та пересилати їх до
    OpenClaw. Типовий шаблон — webhook, який перевіряє запит і
    диспетчеризує його через inbound handler вашого каналу:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth під керуванням plugin (перевіряйте підписи самостійно)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ваш inbound handler диспетчеризує повідомлення до OpenClaw.
          // Точне підключення залежить від SDK вашої платформи —
          // див. реальний приклад у пакеті bundled plugin Microsoft Teams або Google Chat.
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
      володіє власним inbound-конвеєром. Подивіться на bundled plugin каналів
      (наприклад пакет plugin Microsoft Teams або Google Chat), щоб побачити реальні шаблони.
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

    Спільні helper для тестування див. у [Testing](/plugins/sdk-testing).

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
    ├── client.ts             # Клієнт API платформи
    └── runtime.ts            # Сховище runtime (за потреби)
```

## Розширені теми

<CardGroup cols={2}>
  <Card title="Параметри threading" icon="git-branch" href="/plugins/sdk-entrypoints#registration-mode">
    Фіксовані reply-режими, scoped за account або custom
  </Card>
  <Card title="Інтеграція інструмента message" icon="puzzle" href="/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool і виявлення дій
  </Card>
  <Card title="Визначення цілей" icon="crosshair" href="/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helper" icon="settings" href="/plugins/sdk-runtime">
    TTS, STT, медіа, subagent через api.runtime
  </Card>
</CardGroup>

<Note>
Деякі bundled helper seams і далі існують для підтримки bundled plugin і
сумісності. Це не рекомендований шаблон для нових plugin каналів;
надавайте перевагу загальним channel/setup/reply/runtime subpath зі спільної поверхні SDK,
якщо тільки ви безпосередньо не підтримуєте цю сім’ю bundled plugin.
</Note>

## Наступні кроки

- [Provider Plugins](/plugins/sdk-provider-plugins) — якщо ваш plugin також надає моделі
- [SDK Overview](/plugins/sdk-overview) — повний довідник import subpath
- [SDK Testing](/plugins/sdk-testing) — утиліти тестування та контрактні тести
- [Plugin Manifest](/plugins/manifest) — повна схема маніфесту
