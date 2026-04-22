---
read_when:
    - Ви змінюєте вбудоване середовище виконання агента або реєстр обв’язок агента
    - Ви реєструєте обв’язку агента з bundled або trusted plugin
    - Вам потрібно зрозуміти, як plugin Codex пов’язаний із постачальниками моделей
sidebarTitle: Agent Harness
summary: Експериментальна поверхня SDK для plugins, які замінюють низькорівневий вбудований виконавець агента
title: Plugins обв’язки агента
x-i18n:
    generated_at: "2026-04-22T23:30:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: efaecca18210af0e9e641bd888c1edb55e08e96299158ff021d6c2dd0218ec25
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Plugins обв’язки агента

**Обв’язка агента** — це низькорівневий виконавець одного підготовленого ходу агента OpenClaw. Це не постачальник моделей, не канал і не реєстр інструментів.

Використовуйте цю поверхню лише для bundled або trusted native plugins. Контракт усе ще експериментальний, тому що типи параметрів навмисно віддзеркалюють поточний вбудований виконавець.

## Коли використовувати обв’язку

Реєструйте обв’язку агента, коли сімейство моделей має власне native session runtime і звичайний транспорт постачальника OpenClaw є хибною абстракцією.

Приклади:

- native server кодувального агента, який керує потоками та Compaction
- локальний CLI або демон, який має потоково передавати native plan/reasoning/tool events
- середовище виконання моделі, якому потрібен власний resume id на додачу до транскрипту сесії OpenClaw

**Не** реєструйте обв’язку лише для додавання нового API LLM. Для звичайних HTTP або WebSocket API моделей створіть [provider plugin](/uk/plugins/sdk-provider-plugins).

## Чим усе ще керує ядро

До того, як обв’язка буде вибрана, OpenClaw уже визначив:

- постачальника й модель
- стан автентифікації середовища виконання
- рівень мислення та бюджет контексту
- файл транскрипту/сесії OpenClaw
- робочий простір, sandbox і політику інструментів
- зворотні виклики відповіді каналу та потокові зворотні виклики
- політику резервної моделі та live-перемикання моделей

Такий поділ є навмисним. Обв’язка виконує підготовлену спробу; вона не вибирає постачальників, не замінює доставку через канал і не перемикає моделі непомітно.

## Зареєструвати обв’язку

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

OpenClaw вибирає обв’язку після визначення постачальника/моделі:

1. `OPENCLAW_AGENT_RUNTIME=<id>` примусово вибирає зареєстровану обв’язку з цим id.
2. `OPENCLAW_AGENT_RUNTIME=pi` примусово вибирає вбудовану обв’язку PI.
3. `OPENCLAW_AGENT_RUNTIME=auto` запитує в зареєстрованих обв’язок, чи підтримують вони визначеного постачальника/модель.
4. Якщо жодна зареєстрована обв’язка не підходить, OpenClaw використовує PI, якщо резервний перехід на PI не вимкнено.

Збої plugin-обв’язки відображаються як збої виконання. У режимі `auto` резервний перехід на PI використовується лише тоді, коли жодна зареєстрована plugin-обв’язка не підтримує визначеного постачальника/модель. Щойно plugin-обв’язка взяла виконання на себе, OpenClaw не повторює той самий хід через PI, тому що це може змінити семантику автентифікації/середовища виконання або продублювати побічні ефекти.

Bundled plugin Codex реєструє `codex` як id своєї обв’язки. Ядро розглядає це як звичайний id plugin-обв’язки; специфічні для Codex псевдоніми мають належати plugin або конфігурації оператора, а не спільному селектору середовища виконання.

## Поєднання постачальника й обв’язки

Більшість обв’язок також мають реєструвати постачальника. Постачальник робить посилання на моделі, стан автентифікації, метадані моделей і вибір `/model` видимими для решти OpenClaw. Потім обв’язка заявляє про підтримку цього постачальника в `supports(...)`.

Bundled plugin Codex дотримується цього шаблону:

- id постачальника: `codex`
- посилання користувача на моделі: `codex/gpt-5.4`, `codex/gpt-5.2` або інша модель, повернена Codex app server
- id обв’язки: `codex`
- автентифікація: синтетична доступність постачальника, тому що обв’язка Codex керує native login/session Codex
- запит до app-server: OpenClaw надсилає в Codex bare model id і дозволяє обв’язці працювати з native app-server protocol

Plugin Codex є адитивним. Звичайні посилання `openai/gpt-*` лишаються посиланнями постачальника OpenAI й далі використовують звичайний шлях постачальника OpenClaw. Вибирайте `codex/gpt-*`, коли вам потрібні керована Codex автентифікація, виявлення моделей Codex, native threads і виконання через Codex app-server. `/model` може перемикатися між моделями Codex, які повертає Codex app server, без потреби в облікових даних постачальника OpenAI.

Щоб дізнатися про налаштування для операторів, приклади префіксів моделей і конфігурації лише для Codex, див. [Codex Harness](/uk/plugins/codex-harness).

OpenClaw вимагає Codex app-server `0.118.0` або новішої версії. Plugin Codex перевіряє initialize handshake app-server і блокує старіші сервери або сервери без версії, щоб OpenClaw працював лише з тією поверхнею протоколу, з якою його було протестовано.

### Middleware tool-result Codex app-server

Bundled plugins також можуть підключати middleware `tool_result`, специфічний для Codex app-server, через `api.registerCodexAppServerExtensionFactory(...)`, коли їхній manifest оголошує `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
Це seam trusted-plugin для асинхронних перетворень tool-result, які мають виконуватися всередині native обв’язки Codex до того, як вивід інструмента буде спроєктовано назад у транскрипт OpenClaw.

### Режим native обв’язки Codex

Bundled обв’язка `codex` — це native режим Codex для вбудованих ходів агента OpenClaw. Спочатку ввімкніть bundled plugin `codex` і додайте `codex` до `plugins.allow`, якщо у вашій конфігурації використовується обмежувальний allowlist. Це відрізняється від `openai-codex/*`:

- `openai-codex/*` використовує OAuth ChatGPT/Codex через звичайний шлях постачальника OpenClaw.
- `codex/*` використовує bundled постачальника Codex і маршрутизує хід через Codex app-server.

Коли цей режим виконується, Codex керує native thread id, поведінкою resume, Compaction і виконанням app-server. OpenClaw усе ще керує каналом чату, видимим дзеркалом транскрипту, політикою інструментів, підтвердженнями, доставкою медіа та вибором сесії. Використовуйте `embeddedHarness.runtime: "codex"` разом із `embeddedHarness.fallback: "none"`, коли вам потрібно довести, що лише шлях Codex app-server може взяти виконання на себе. Ця конфігурація є лише захистом вибору: збої Codex app-server уже напряму завершуються помилкою замість повторної спроби через PI.

## Вимкнути резервний перехід на PI

За замовчуванням OpenClaw запускає вбудованих агентів із `agents.defaults.embeddedHarness`, встановленим у `{ runtime: "auto", fallback: "pi" }`. У режимі `auto` зареєстровані plugin-обв’язки можуть взяти на себе пару постачальник/модель. Якщо жодна не підходить, OpenClaw переходить на PI.

Установіть `fallback: "none"`, коли вам потрібно, щоб відсутність вибору plugin-обв’язки завершувалася помилкою замість використання PI. Збої вже вибраних plugin-обв’язок і так завершуються жорсткою помилкою. Це не блокує явний `runtime: "pi"` або `OPENCLAW_AGENT_RUNTIME=pi`.

Для вбудованих запусків лише з Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Якщо ви хочете, щоб будь-яка зареєстрована plugin-обв’язка брала на себе відповідні моделі, але ніколи не хочете, щоб OpenClaw непомітно переходив на PI, залиште `runtime: "auto"` і вимкніть резервний перехід:

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
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` усе ще перевизначає налаштоване середовище виконання. Використовуйте `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб вимкнути резервний перехід на PI через середовище.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Якщо резервний перехід вимкнено, сесія завершується помилкою рано, коли запитана обв’язка не зареєстрована, не підтримує визначеного постачальника/модель або завершується помилкою до створення побічних ефектів ходу. Це навмисно для розгортань лише з Codex і для live-тестів, які мають довести, що шлях Codex app-server справді використовується.

Цей параметр керує лише вбудованою обв’язкою агента. Він не вимикає маршрутизацію image, video, music, TTS, PDF або іншої модельної маршрутизації, специфічної для постачальника.

## Native sessions і дзеркало транскрипту

Обв’язка може зберігати native session id, thread id або daemon-side resume token.
Явно зберігайте цю прив’язку пов’язаною із сесією OpenClaw і продовжуйте дзеркалити видимий користувачеві вивід assistant/tool у транскрипт OpenClaw.

Транскрипт OpenClaw залишається шаром сумісності для:

- видимої в каналі історії сесії
- пошуку та індексації транскриптів
- перемикання назад на вбудовану обв’язку PI на наступному ході
- загальної поведінки `/new`, `/reset` і видалення сесії

Якщо ваша обв’язка зберігає sidecar-прив’язку, реалізуйте `reset(...)`, щоб OpenClaw міг очистити її, коли пов’язану сесію OpenClaw буде скинуто.

## Результати інструментів і медіа

Ядро створює список інструментів OpenClaw і передає його в підготовлену спробу.
Коли обв’язка виконує dynamic tool call, поверніть результат інструмента назад через форму результату обв’язки замість самостійного надсилання канального медіа.

Це зберігає text, image, video, music, TTS, approval і виводи messaging-tool на тому самому шляху доставки, що й у запусків на базі PI.

## Поточні обмеження

- Публічний шлях імпорту є загальним, але деякі псевдоніми типів attempt/result усе ще містять назви `Pi` для сумісності.
- Встановлення сторонніх обв’язок є експериментальним. Віддавайте перевагу provider plugins, доки вам не знадобиться native session runtime.
- Перемикання обв’язок між ходами підтримується. Не перемикайте обв’язки посеред ходу після того, як уже почалися native tools, approvals, текст assistant або надсилання повідомлень.

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview)
- [Допоміжні засоби середовища виконання](/uk/plugins/sdk-runtime)
- [Provider Plugins](/uk/plugins/sdk-provider-plugins)
- [Codex Harness](/uk/plugins/codex-harness)
- [Постачальники моделей](/uk/concepts/model-providers)
