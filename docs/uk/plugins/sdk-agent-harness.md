---
read_when:
    - Ви змінюєте вбудоване runtime-середовище агента або реєстр harness-ів
    - Ви реєструєте harness агента з вбудованого або довіреного Plugin-а
    - Вам потрібно зрозуміти, як Plugin Codex пов’язаний із провайдерами моделей
sidebarTitle: Agent Harness
summary: Експериментальна поверхня SDK для Plugin-ів, які замінюють низькорівневий вбудований виконавець агента
title: Plugin-и harness агента
x-i18n:
    generated_at: "2026-04-23T23:02:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: af76c2a3ebe54c87920954b58126ee59538c0e6d3d1b4ba44890c1f5079fabc2
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**Harness агента** — це низькорівневий виконавець одного підготовленого циклу агента OpenClaw.
Це не провайдер моделі, не канал і не реєстр інструментів.

Використовуйте цю поверхню лише для вбудованих або довірених native Plugin-ів. Контракт
усе ще експериментальний, оскільки типи параметрів навмисно віддзеркалюють поточний
вбудований runner.

## Коли використовувати harness

Реєструйте harness агента, коли сімейство моделей має власне native session
runtime-середовище і звичайний транспорт провайдера OpenClaw є неправильною абстракцією.

Приклади:

- native server агента для кодування, який сам керує threads і Compaction
- локальний CLI або daemon, який має потоково передавати native-події плану/міркування/інструментів
- runtime-середовище моделі, якому потрібен власний resume id на додачу до транскрипту
  сесії OpenClaw

**Не** реєструйте harness лише для додавання нового API LLM. Для звичайних HTTP- або
WebSocket-API моделей створюйте [provider plugin](/uk/plugins/sdk-provider-plugins).

## Чим і далі володіє core

До вибору harness OpenClaw уже визначив:

- провайдера і модель
- стан runtime-автентифікації
- рівень thinking і бюджет контексту
- файл транскрипту/сесії OpenClaw
- робочий простір, sandbox і політику інструментів
- callback-и відповіді каналу і callback-и потокової передачі
- політику fallback моделі та живого перемикання моделі

Цей поділ є навмисним. Harness виконує підготовлену спробу; він не вибирає
провайдерів, не замінює доставку каналом і не перемикає моделі потайки.

## Реєстрація harness

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

1. Якщо в наявній сесії вже записано id harness, воно має пріоритет, тож зміни config/env
   не перемикають цей транскрипт на інше runtime-середовище “на гарячу”.
2. `OPENCLAW_AGENT_RUNTIME=<id>` примусово задає зареєстрований harness із цим id для
   сесій, які ще не закріплені.
3. `OPENCLAW_AGENT_RUNTIME=pi` примусово задає вбудований harness PI.
4. `OPENCLAW_AGENT_RUNTIME=auto` просить зареєстровані harness-и перевірити, чи підтримують вони
   визначені провайдера/модель.
5. Якщо жоден зареєстрований harness не підходить, OpenClaw використовує PI, якщо fallback до PI
   не вимкнено.

Збої Plugin harness відображаються як збої запуску. У режимі `auto` fallback до PI
використовується лише тоді, коли жоден зареєстрований Plugin harness не підтримує визначені
провайдера/модель. Щойно Plugin harness вже заявив про запуск, OpenClaw не
повторює цей самий цикл через PI, оскільки це може змінити семантику auth/runtime
або дублювати побічні ефекти.

Вибраний id harness зберігається разом з id сесії після вбудованого запуску.
Legacy-сесії, створені до закріплення harness, трактуються як закріплені за PI, щойно вони
мають історію транскрипту. Використовуйте нову/скинуту сесію при перемиканні між PI і
native Plugin harness. `/status` показує нетипові id harness, як-от `codex`,
поруч із `Fast`; PI приховується, бо це типовий шлях сумісності.
Якщо вибраний harness виглядає несподівано, увімкніть debug-логування `agents/harness` і
перегляньте структурований запис gateway `agent harness selected`. Він містить
id вибраного harness, причину вибору, політику runtime/fallback і, у режимі
`auto`, результат підтримки для кожного кандидата Plugin-а.

Вбудований Plugin Codex реєструє `codex` як свій id harness. Core трактує це
як звичайний id Plugin harness; псевдоніми, специфічні для Codex, мають належати
Plugin-у або конфігурації оператора, а не спільному селектору runtime.

## Поєднання провайдера і harness

Більшість harness-ів також повинні реєструвати провайдера. Провайдер робить посилання на моделі,
стан auth, метадані моделі та вибір `/model` видимими для решти
OpenClaw. Потім harness заявляє про цей провайдер у `supports(...)`.

Вбудований Plugin Codex дотримується цього шаблону:

- id провайдера: `codex`
- користувацькі посилання на модель: `openai/gpt-5.5` плюс `embeddedHarness.runtime: "codex"`;
  legacy-посилання `codex/gpt-*` і далі приймаються для сумісності
- id harness: `codex`
- auth: синтетична доступність провайдера, оскільки harness Codex володіє
  native login/session Codex
- запит app-server: OpenClaw надсилає Codex сирий id моделі й дозволяє
  harness-у спілкуватися з native-протоколом app-server

Plugin Codex є додатковим. Звичайні посилання `openai/gpt-*` і далі використовують
звичайний шлях провайдера OpenClaw, якщо ви не примусово задасте harness Codex через
`embeddedHarness.runtime: "codex"`. Старіші посилання `codex/gpt-*` і далі вибирають
провайдера і harness Codex для сумісності.

Налаштування оператора, приклади префіксів моделей і конфігурації лише для Codex див. у
[Codex Harness](/uk/plugins/codex-harness).

OpenClaw вимагає Codex app-server `0.118.0` або новіший. Plugin Codex перевіряє
initialize handshake app-server і блокує старіші або неверсійовані сервери, тож
OpenClaw працює лише з тією поверхнею протоколу, з якою його було протестовано.

### Middleware результатів інструментів Codex app-server

Вбудовані Plugin-и також можуть підключати middleware `tool_result`, специфічний для Codex app-server,
через `api.registerCodexAppServerExtensionFactory(...)`, коли їхній
manifest оголошує `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
Це шов для довірених Plugin-ів для асинхронних перетворень `tool_result`, які мають
виконуватися всередині native harness Codex до того, як вивід інструмента буде спроєктовано
назад у транскрипт OpenClaw.

### Режим native harness Codex

Вбудований harness `codex` — це native-режим Codex для вбудованих циклів
агента OpenClaw. Спочатку ввімкніть вбудований Plugin `codex` і додайте `codex` до
`plugins.allow`, якщо у вашій конфігурації використовується обмежувальний allowlist. Конфігурації native app-server
мають використовувати `openai/gpt-*` з `embeddedHarness.runtime: "codex"`.
Використовуйте `openai-codex/*` для Codex OAuth через PI. Legacy-посилання на модель `codex/*`
залишаються псевдонімами сумісності для native harness.

Коли цей режим працює, Codex володіє native thread id, поведінкою resume,
Compaction і виконанням app-server. OpenClaw і далі володіє каналом чату,
видимим дзеркалом транскрипту, політикою інструментів, approvals, доставкою медіа й
вибором сесії. Використовуйте `embeddedHarness.runtime: "codex"` разом із
`embeddedHarness.fallback: "none"`, коли вам потрібно довести, що лише шлях
Codex app-server може заявити про цей запуск. Ця конфігурація є лише запобіжником вибору:
збої Codex app-server уже й так завершуються помилкою напряму, без повторної спроби через PI.

## Вимкнення fallback до PI

Типово OpenClaw запускає вбудованих агентів з `agents.defaults.embeddedHarness`,
установленим у `{ runtime: "auto", fallback: "pi" }`. У режимі `auto` зареєстровані Plugin
harness-и можуть заявляти про пару провайдер/модель. Якщо жоден не підходить, OpenClaw повертається до PI.

Установіть `fallback: "none"`, коли вам потрібно, щоб відсутність вибору Plugin harness завершувалася
помилкою замість використання PI. Збої вибраного Plugin harness і так уже завершуються жорсткою помилкою. Це
не блокує явний `runtime: "pi"` або `OPENCLAW_AGENT_RUNTIME=pi`.

Для вбудованих запусків лише з Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Якщо ви хочете, щоб будь-який зареєстрований Plugin harness міг заявляти про відповідні моделі, але ніколи
не хочете, щоб OpenClaw непомітно повертався до PI, залиште `runtime: "auto"` і вимкніть fallback:

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
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` і далі перевизначає налаштоване runtime-середовище. Використовуйте
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб вимкнути fallback до PI через
середовище.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Коли fallback вимкнено, сесія завершується помилкою на ранньому етапі, якщо запитаний harness не
зареєстровано, він не підтримує визначені провайдера/модель або завершується помилкою до
створення побічних ефектів циклу. Це зроблено навмисно для розгортань лише з Codex і
для live-тестів, які мають довести, що фактично використовується саме шлях Codex app-server.

Це налаштування керує лише вбудованим harness агента. Воно не вимикає
маршрутизацію моделей, специфічну для провайдерів, для зображень, відео, музики, TTS, PDF чи інших.

## Native-сесії та дзеркало транскрипту

Harness може зберігати native session id, thread id або токен resume на боці daemon.
Явно пов’язуйте це прив’язування із сесією OpenClaw і продовжуйте
дзеркалити видимий користувачеві вивід помічника/інструментів у транскрипт OpenClaw.

Транскрипт OpenClaw залишається шаром сумісності для:

- історії сесії, видимої в каналі
- пошуку та індексації транскрипту
- повернення до вбудованого harness PI на пізнішому циклі
- загальної поведінки `/new`, `/reset` і видалення сесії

Якщо ваш harness зберігає sidecar-прив’язування, реалізуйте `reset(...)`, щоб OpenClaw міг
очищати його під час скидання відповідної сесії OpenClaw.

## Результати інструментів і медіа

Core формує список інструментів OpenClaw і передає його в підготовлену спробу.
Коли harness виконує динамічний виклик інструмента, повертайте результат інструмента через
форму результату harness замість того, щоб самостійно надсилати медіа каналом.

Це дозволяє тексту, зображенням, відео, музиці, TTS, approvals і виводам
інструментів повідомлень проходити тим самим шляхом доставки, що й у запусках на базі PI.

## Поточні обмеження

- Публічний шлях імпорту є узагальненим, але деякі псевдоніми типів спроб/результатів усе ще
  містять назви `Pi` для сумісності.
- Установлення сторонніх harness-ів є експериментальним. Надавайте перевагу provider plugin-ам,
  доки вам не знадобиться native session runtime.
- Перемикання harness-ів між циклами підтримується. Не перемикайте harness-и посеред
  циклу після того, як уже почалися native-інструменти, approvals, текст помічника або
  надсилання повідомлень.

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview)
- [Runtime Helpers](/uk/plugins/sdk-runtime)
- [Provider Plugins](/uk/plugins/sdk-provider-plugins)
- [Codex Harness](/uk/plugins/codex-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
