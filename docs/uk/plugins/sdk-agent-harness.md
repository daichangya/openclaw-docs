---
read_when:
    - Ви змінюєте вбудований runtime агента або реєстр harness-а
    - Ви реєструєте harness агента з вбудованого або довіреного Plugin-а
    - Вам потрібно зрозуміти, як Plugin Codex пов’язаний із провайдерами моделей
sidebarTitle: Agent Harness
summary: Експериментальна поверхня SDK для Plugin-ів, які замінюють низькорівневий вбудований виконавець агента
title: Plugin-и harness агента
x-i18n:
    generated_at: "2026-04-24T19:52:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: ffb57530e6259952c8dde473a69052f578b081f28659e22b72347fa64e497a38
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**harness агента** — це низькорівневий виконавець для одного підготовленого
ходу агента OpenClaw. Це не провайдер моделей, не канал і не реєстр інструментів.

Використовуйте цю поверхню лише для вбудованих або довірених нативних Plugin-ів. Контракт
досі експериментальний, оскільки типи параметрів навмисно віддзеркалюють поточний
вбудований runner.

## Коли використовувати harness

Реєструйте harness агента, коли сімейство моделей має власний нативний runtime
сеансів, а звичайний транспорт провайдера OpenClaw є хибною абстракцією.

Приклади:

- нативний сервер coding-agent, який володіє тредами й Compaction
- локальний CLI або демон, який має стримити нативні події plan/reasoning/tool
- runtime моделі, якому потрібен власний resume id на додачу до транскрипту
  сеансу OpenClaw

**Не** реєструйте harness лише для додавання нового API LLM. Для звичайних HTTP або
WebSocket API моделей створюйте [provider Plugin](/uk/plugins/sdk-provider-plugins).

## Чим усе ще володіє core

До того, як буде вибрано harness, OpenClaw уже визначив:

- провайдера і модель
- стан автентифікації runtime
- рівень thinking і бюджет контексту
- файл транскрипту/сеансу OpenClaw
- workspace, sandbox і політику інструментів
- callback-и відповіді каналу та стримінгу
- політику fallback моделі та live-перемикання моделей

Такий поділ навмисний. Harness виконує підготовлену спробу; він не вибирає
провайдерів, не замінює доставку каналу й не перемикає моделі непомітно.

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

1. Ідентифікатор harness, записаний у наявному сеансі, має пріоритет, щоб зміни config/env не
   перемикали цей транскрипт на інший runtime на льоту.
2. `OPENCLAW_AGENT_RUNTIME=<id>` примусово вмикає зареєстрований harness з цим id для
   сеансів, які ще не закріплені.
3. `OPENCLAW_AGENT_RUNTIME=pi` примусово вмикає вбудований harness PI.
4. `OPENCLAW_AGENT_RUNTIME=auto` просить зареєстровані harness-и перевірити, чи підтримують вони
   визначеного провайдера/модель.
5. Якщо відповідного зареєстрованого harness-а немає, OpenClaw використовує PI, якщо fallback на PI
   не вимкнено.

Помилки harness-ів Plugin-ів відображаються як помилки виконання. У режимі `auto` fallback на PI
застосовується лише тоді, коли жоден зареєстрований harness Plugin-а не підтримує визначеного
провайдера/модель. Щойно harness Plugin-а заявив про запуск, OpenClaw не
програє той самий хід повторно через PI, оскільки це може змінити семантику
auth/runtime або спричинити дубльовані побічні ефекти.

Вибраний id harness-а зберігається разом з id сеансу після вбудованого запуску.
Застарілі сеанси, створені до появи привʼязок harness-а, вважаються привʼязаними до PI, щойно в них
зʼявляється історія транскрипту. Використовуйте новий/скинутий сеанс, коли перемикаєтеся між PI і
нативним harness-ом Plugin-а. `/status` показує не типові id harness-ів, такі як `codex`,
поруч із `Fast`; PI прихований, оскільки це типовий шлях сумісності.
Якщо вибраний harness виглядає неочікуваним, увімкніть журналювання налагодження `agents/harness` і
перегляньте структурований запис gateway `agent harness selected`. Він містить
id вибраного harness-а, причину вибору, політику runtime/fallback і, у режимі
`auto`, результат підтримки для кожного кандидата Plugin-а.

Вбудований Plugin Codex реєструє `codex` як свій id harness-а. Core розглядає це
як звичайний id harness-а Plugin-а; специфічні для Codex псевдоніми мають належати Plugin-у
або config оператора, а не спільному селектору runtime.

## Поєднання provider + harness

Більшість harness-ів також мають реєструвати provider. Provider робить refs моделей,
статус auth, метадані моделі та вибір `/model` видимими для решти
OpenClaw. Потім harness заявляє цей provider у `supports(...)`.

Вбудований Plugin Codex дотримується цього шаблону:

- id provider: `codex`
- refs моделей для користувача: `openai/gpt-5.5` плюс `embeddedHarness.runtime: "codex"`;
  застарілі refs `codex/gpt-*` досі приймаються для сумісності
- id harness-а: `codex`
- auth: синтетична доступність provider, оскільки harness Codex володіє
  нативним входом/сеансом Codex
- запит app-server: OpenClaw надсилає до Codex чистий id моделі й дозволяє
  harness-у працювати з нативним протоколом app-server

Plugin Codex є додатковим. Звичайні refs `openai/gpt-*` і далі використовують
нормальний шлях provider OpenClaw, якщо ви не примусите harness Codex через
`embeddedHarness.runtime: "codex"`. Старі refs `codex/gpt-*` і далі вибирають
provider і harness Codex для сумісності.

Налаштування для операторів, приклади префіксів моделей і config-и лише для Codex дивіться в
[Codex Harness](/uk/plugins/codex-harness).

OpenClaw вимагає Codex app-server `0.118.0` або новіше. Plugin Codex перевіряє
initialize handshake app-server і блокує старі або неверсіоновані сервери, щоб
OpenClaw працював лише з тією поверхнею протоколу, з якою його було протестовано.

### Middleware результатів інструментів

Plugin-и можуть підключати нейтральне щодо harness middleware для результатів інструментів через
`api.registerAgentToolResultMiddleware(...)`, коли їхній manifest оголошує
цільові id harness-ів у `contracts.agentToolResultMiddleware`. Це шов для
асинхронних перетворень результатів інструментів, які мають виконуватися до того, як PI або Codex
повернуть вивід інструмента назад у модель.

Застарілі вбудовані Plugin-и все ще можуть використовувати
`api.registerCodexAppServerExtensionFactory(...)` для middleware лише app-server Codex,
але нові перетворення результатів мають використовувати API, нейтральний щодо harness-а.
Хук лише для Pi `api.registerEmbeddedExtensionFactory(...)` є застарілим для
перетворень результатів інструментів; зберігайте його лише для коду сумісності вбудованих компонентів, якому
досі потрібні прямі події embedded-runner-а Pi.

### Режим нативного harness-а Codex

Вбудований harness `codex` — це нативний режим Codex для вбудованих
ходів агента OpenClaw. Спочатку ввімкніть вбудований Plugin `codex` і додайте `codex` до
`plugins.allow`, якщо ваш config використовує обмежувальний allowlist. Конфігурації нативного app-server
мають використовувати `openai/gpt-*` з `embeddedHarness.runtime: "codex"`.
Використовуйте `openai-codex/*` для Codex OAuth через PI. Застарілі refs моделей `codex/*`
і далі залишаються псевдонімами сумісності для нативного harness-а.

Коли цей режим працює, Codex володіє нативним id треду, поведінкою resume,
Compaction і виконанням app-server. OpenClaw, як і раніше, володіє чатом каналу,
видимим дзеркалом транскрипту, політикою інструментів, схваленнями, доставкою медіа та
вибором сеансу. Використовуйте `embeddedHarness.runtime: "codex"` разом із
`embeddedHarness.fallback: "none"`, коли вам потрібно довести, що запуск може
заявити лише шлях app-server Codex. Цей config є лише захистом вибору:
помилки app-server Codex уже напряму завершуються помилкою замість повторної спроби через PI.

## Вимкнення fallback на PI

За замовчуванням OpenClaw запускає вбудованих агентів із `agents.defaults.embeddedHarness`,
встановленим у `{ runtime: "auto", fallback: "pi" }`. У режимі `auto` зареєстровані
harness-и Plugin-ів можуть заявити пару provider/model. Якщо жоден не підходить, OpenClaw
переходить до PI.

Установіть `fallback: "none"`, коли потрібно, щоб відсутність вибору harness-а Plugin-а
завершувалася помилкою замість використання PI. Помилки вже вибраних harness-ів Plugin-ів і так
завершуються жорсткою помилкою. Це не блокує явний `runtime: "pi"` або `OPENCLAW_AGENT_RUNTIME=pi`.

Для вбудованих запусків лише Codex:

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

Якщо ви хочете, щоб будь-який зареєстрований harness Plugin-а міг заявити сумісні моделі, але ніколи
не хочете, щоб OpenClaw непомітно переходив до PI, залиште `runtime: "auto"` і вимкніть
fallback:

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

Перевизначення на рівні агента використовують ту саму форму:

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

`OPENCLAW_AGENT_RUNTIME` і далі перевизначає налаштований runtime. Використовуйте
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб вимкнути fallback на PI через
середовище.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Коли fallback вимкнено, сеанс завершується рано з помилкою, якщо запитаний harness не
зареєстровано, він не підтримує визначеного provider/model або завершується
помилкою до появи побічних ефектів ходу. Це навмисно для розгортань лише Codex і
для live-тестів, які мають довести, що шлях app-server Codex справді використовується.

Цей параметр керує лише вбудованим harness-ом агента. Він не вимикає
маршрутизацію моделей, специфічну для provider, для image, video, music, TTS, PDF або інших типів.

## Нативні сеанси й дзеркало транскрипту

Harness може зберігати нативний id сеансу, id треду або токен resume на боці демона.
Тримайте цю привʼязку явно повʼязаною із сеансом OpenClaw і продовжуйте
дзеркалити видимий користувачу вивід assistant/tool у транскрипт OpenClaw.

Транскрипт OpenClaw залишається шаром сумісності для:

- видимої в каналі історії сеансу
- пошуку та індексації транскриптів
- перемикання назад на вбудований harness PI на наступному ході
- узагальненої поведінки `/new`, `/reset` і видалення сеансу

Якщо ваш harness зберігає sidecar-привʼязку, реалізуйте `reset(...)`, щоб OpenClaw міг
очистити її під час скидання повʼязаного сеансу OpenClaw.

## Результати інструментів і медіа

Core формує список інструментів OpenClaw і передає його в підготовлену спробу.
Коли harness виконує динамічний виклик інструмента, повертайте результат інструмента через
форму результату harness-а замість того, щоб самостійно надсилати медіа в канал.

Це зберігає text, image, video, music, TTS, approval і результати
інструментів для повідомлень на тому ж шляху доставки, що й запуски на базі PI.

## Поточні обмеження

- Публічний шлях імпорту є узагальненим, але деякі псевдоніми типів спроб/результатів досі
  містять назви `Pi` для сумісності.
- Установлення сторонніх harness-ів є експериментальним. Віддавайте перевагу provider Plugin-ам,
  доки вам не знадобиться нативний runtime сеансів.
- Перемикання harness-ів між ходами підтримується. Не перемикайте harness-и посеред
  ходу після того, як уже почалися нативні інструменти, схвалення, текст assistant-а або
  надсилання повідомлень.

## Пов’язане

- [SDK Overview](/uk/plugins/sdk-overview)
- [Runtime Helpers](/uk/plugins/sdk-runtime)
- [Provider Plugins](/uk/plugins/sdk-provider-plugins)
- [Codex Harness](/uk/plugins/codex-harness)
- [Model Providers](/uk/concepts/model-providers)
