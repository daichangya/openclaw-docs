---
read_when:
    - Ви змінюєте вбудований рантайм агента або реєстр harness-ів
    - Ви реєструєте harness агента з bundled або довіреного Plugin-а
    - Вам потрібно зрозуміти, як Plugin Codex пов’язаний із провайдерами моделей
sidebarTitle: Agent Harness
summary: Експериментальна поверхня SDK для Plugin-ів, які замінюють низькорівневий вбудований виконавець агента
title: Plugin-и Agent Harness
x-i18n:
    generated_at: "2026-04-23T19:26:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0822248298c61f9dda7ec342558e8cda7c936876060b471ed01dc6c90779010
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Plugin-и Agent Harness

**Agent harness** — це низькорівневий виконавець для одного підготовленого ходу агента OpenClaw. Це не провайдер моделі, не канал і не реєстр інструментів.

Використовуйте цю поверхню лише для bundled або довірених native Plugin-ів. Контракт усе ще експериментальний, оскільки типи параметрів навмисно віддзеркалюють поточний вбудований runner.

## Коли використовувати harness

Реєструйте agent harness, коли сімейство моделей має власний native session runtime і звичайний транспорт провайдера OpenClaw є хибною абстракцією.

Приклади:

- native сервер coding-agent, який керує thread-ами та Compaction
- локальний CLI або демон, який має стримити native події plan/reasoning/tool
- runtime моделі, якому потрібен власний resume id на додачу до transcript сесії OpenClaw

**Не** реєструйте harness лише для додавання нового API LLM. Для звичайних HTTP- або WebSocket-API моделей створіть [provider Plugin](/uk/plugins/sdk-provider-plugins).

## Що все ще належить core

Перед вибором harness OpenClaw уже визначив:

- провайдера та модель
- стан автентифікації runtime
- рівень thinking і бюджет контексту
- файл transcript/сесії OpenClaw
- workspace, sandbox і політику інструментів
- callback-и відповіді каналу та callback-и стримінгу
- політику fallback моделі та живого перемикання моделей

Такий поділ є навмисним. Harness виконує підготовлену спробу; він не вибирає провайдерів, не замінює доставку каналу й не перемикає моделі непомітно.

## Зареєструйте harness

**Імпорт:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Політика вибору

OpenClaw вибирає harness після визначення провайдера/моделі:

1. Якщо в наявній сесії вже записано id harness, він має пріоритет, тому зміни config/env не перемикають цей transcript на інший runtime на льоту.
2. `OPENCLAW_AGENT_RUNTIME=<id>` примусово вказує зареєстрований harness із цим id для сесій, які ще не закріплені.
3. `OPENCLAW_AGENT_RUNTIME=pi` примусово вказує вбудований harness PI.
4. `OPENCLAW_AGENT_RUNTIME=auto` запитує зареєстровані harness-и, чи підтримують вони визначену пару провайдер/модель.
5. Якщо жоден зареєстрований harness не підходить, OpenClaw використовує PI, якщо fallback PI не вимкнено.

Збої Plugin harness відображаються як помилки виконання. У режимі `auto` fallback до PI використовується лише тоді, коли жоден зареєстрований Plugin harness не підтримує визначену пару провайдер/модель. Щойно Plugin harness узяв на себе виконання, OpenClaw не повторює той самий хід через PI, оскільки це може змінити семантику auth/runtime або дублювати побічні ефекти.

Вибраний id harness зберігається разом з id сесії після вбудованого запуску. Застарілі сесії, створені до закріплення harness, вважаються закріпленими за PI, щойно в них з’являється history transcript. Використовуйте нову/скинуту сесію, коли перемикаєтеся між PI і native Plugin harness. `/status` показує нестандартні id harness, такі як `codex`, поруч із `Fast`; PI лишається прихованим, оскільки це шлях сумісності за замовчуванням.

Bundled Plugin Codex реєструє `codex` як свій id harness. Core трактує це як звичайний id Plugin harness; специфічні для Codex псевдоніми мають належати Plugin-у або config оператора, а не спільному селектору runtime.

## Поєднання provider і harness

Більшість harness-ів також мають реєструвати provider. Provider робить видимими для решти OpenClaw посилання на моделі, стан auth, метадані моделі та вибір `/model`. Потім harness заявляє про підтримку цього provider у `supports(...)`.

Bundled Plugin Codex дотримується цього шаблону:

- id provider: `codex`
- посилання користувача на моделі: `codex/gpt-5.5`, `codex/gpt-5.2` або інша модель, повернена app-server Codex
- id harness: `codex`
- auth: синтетична доступність provider, оскільки harness Codex керує native входом/сесією Codex
- запит до app-server: OpenClaw надсилає в Codex простий id моделі та дозволяє harness спілкуватися з native протоколом app-server

Plugin Codex є адитивним. Звичайні посилання `openai/gpt-*` лишаються посиланнями provider OpenAI та продовжують використовувати звичайний шлях provider OpenClaw. Вибирайте `codex/gpt-*`, коли вам потрібні auth під керуванням Codex, виявлення моделей Codex, native thread-и та виконання через app-server Codex. `/model` може перемикатися між моделями Codex, поверненими app-server Codex, без потреби в облікових даних provider OpenAI.

Налаштування для операторів, приклади префіксів моделей і конфігурації лише для Codex див. у [Codex Harness](/uk/plugins/codex-harness).

OpenClaw вимагає Codex app-server `0.118.0` або новішої версії. Plugin Codex перевіряє initialize handshake app-server і блокує старіші сервери або сервери без версії, щоб OpenClaw працював лише з тією поверхнею протоколу, яку було протестовано.

### Middleware результатів інструментів Codex app-server

Bundled Plugin-и також можуть підключати middleware `tool_result`, специфічний для Codex app-server, через `api.registerCodexAppServerExtensionFactory(...)`, коли їхній маніфест оголошує `contracts.embeddedExtensionFactories: ["codex-app-server"]`. Це seam довіреного Plugin-а для асинхронних трансформацій `tool_result`, які мають виконуватися всередині native harness Codex до того, як вивід інструмента буде спроєктовано назад у transcript OpenClaw.

### Режим native harness Codex

Bundled harness `codex` — це native режим Codex для вбудованих ходів агента OpenClaw. Спочатку увімкніть bundled Plugin `codex` і додайте `codex` у `plugins.allow`, якщо у вашій config використовується обмежувальний allowlist. Він відрізняється від `openai-codex/*`:

- `openai-codex/*` використовує OAuth ChatGPT/Codex через звичайний шлях provider OpenClaw.
- `codex/*` використовує bundled provider Codex і маршрутизує хід через app-server Codex.

Коли працює цей режим, Codex керує native id thread, поведінкою resume, Compaction і виконанням app-server. OpenClaw усе ще керує chat-каналом, видимим дзеркалом transcript, політикою інструментів, погодженнями, доставкою медіа та вибором сесії. Використовуйте `embeddedHarness.runtime: "codex"` разом із `embeddedHarness.fallback: "none"`, коли потрібно довести, що лише шлях app-server Codex може взяти на себе виконання. Ця config є лише захистом вибору: збої app-server Codex і так завершуються помилкою напряму, а не повторною спробою через PI.

## Вимкнення fallback до PI

За замовчуванням OpenClaw запускає вбудованих агентів із `agents.defaults.embeddedHarness`, встановленим у `{ runtime: "auto", fallback: "pi" }`. У режимі `auto` зареєстровані Plugin harness-и можуть взяти на себе пару провайдер/модель. Якщо жоден не підходить, OpenClaw переходить на PI.

Установіть `fallback: "none"`, коли потрібно, щоб відсутність вибору Plugin harness завершувалася помилкою замість використання PI. Збої вже вибраного Plugin harness і так завершуються жорсткою помилкою. Це не блокує явний `runtime: "pi"` або `OPENCLAW_AGENT_RUNTIME=pi`.

Для вбудованих запусків лише з Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Якщо ви хочете, щоб будь-який зареєстрований Plugin harness міг узяти на себе відповідні моделі, але ніколи не хочете, щоб OpenClaw непомітно переходив на PI, залиште `runtime: "auto"` і вимкніть fallback:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Перевизначення для окремого агента використовують ту саму форму:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "codex/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` усе ще перевизначає налаштований runtime. Використовуйте `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб вимкнути fallback до PI через середовище.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Коли fallback вимкнено, сесія завершується помилкою на ранньому етапі, якщо запитаний harness не зареєстровано, він не підтримує визначену пару провайдер/модель або завершується збоєм до створення побічних ефектів ходу. Це навмисно для розгортань лише з Codex і для live-тестів, які мають довести, що фактично використовується шлях app-server Codex.

Цей параметр керує лише вбудованим agent harness. Він не вимикає маршрутизацію image, video, music, TTS, PDF або інших моделей, специфічних для provider.

## Native сесії та дзеркало transcript

Harness може зберігати native id сесії, id thread або resume token на боці демона. Зберігайте цю прив’язку явно пов’язаною із сесією OpenClaw і продовжуйте дзеркалити видимий користувачу вивід assistant/tool у transcript OpenClaw.

Transcript OpenClaw залишається шаром сумісності для:

- видимої в каналі history сесії
- пошуку й індексації transcript
- перемикання назад на вбудований harness PI на наступному ході
- типової поведінки `/new`, `/reset` і видалення сесії

Якщо ваш harness зберігає sidecar-прив’язку, реалізуйте `reset(...)`, щоб OpenClaw міг очистити її під час скидання відповідної сесії OpenClaw.

## Результати інструментів і медіа

Core формує список інструментів OpenClaw і передає його в підготовлену спробу. Коли harness виконує динамічний виклик інструмента, повертайте результат інструмента назад через форму результату harness, а не надсилайте медіа в канал самостійно.

Це зберігає text, image, video, music, TTS, approval і виводи інструментів обміну повідомленнями в тому самому шляху доставки, що й у запусків на базі PI.

## Поточні обмеження

- Публічний шлях імпорту є узагальненим, але деякі псевдоніми типів спроб/результатів усе ще містять назви `Pi` для сумісності.
- Установлення сторонніх harness-ів є експериментальним. Віддавайте перевагу provider Plugin-ам, доки вам не знадобиться native session runtime.
- Перемикання harness підтримується між ходами. Не перемикайте harness посеред ходу після того, як уже почалися native інструменти, approvals, текст assistant або надсилання повідомлень.

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview)
- [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)
- [Provider Plugin-и](/uk/plugins/sdk-provider-plugins)
- [Codex Harness](/uk/plugins/codex-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
