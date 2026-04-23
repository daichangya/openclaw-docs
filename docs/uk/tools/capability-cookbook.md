---
read_when:
    - Додавання нової основної можливості та поверхні реєстрації Plugin
    - Визначення, чи має код належати ядру, vendor Plugin чи feature Plugin
    - Підключення нового допоміжного засобу runtime для каналів або інструментів
sidebarTitle: Adding Capabilities
summary: Посібник для контриб’юторів із додавання нової спільної можливості до системи Plugin OpenClaw
title: Додавання можливостей (посібник для контриб’юторів)
x-i18n:
    generated_at: "2026-04-23T23:07:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1e3251b9150c9744d967e91f531dfce01435b13aea3a17088ccd54f2145d14f
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Це **посібник для контриб’юторів** для розробників ядра OpenClaw. Якщо ви
  створюєте зовнішній Plugin, див. [Створення Plugins](/uk/plugins/building-plugins)
  натомість.
</Info>

Використовуйте це, коли OpenClaw потребує нового домену, такого як image generation, video
generation або якоїсь майбутньої функціональної області з підтримкою vendor.

Правило:

- plugin = межа володіння
- capability = спільний контракт ядра

Це означає, що не слід починати з прямого підключення vendor до каналу або
інструмента. Починайте з визначення capability.

## Коли створювати capability

Створюйте нову capability, коли всі ці умови істинні:

1. її потенційно може реалізувати більше ніж один vendor
2. канали, інструменти або feature Plugin мають споживати її, не зважаючи на
   vendor
3. ядро має володіти поведінкою fallback, policy, config або delivery

Якщо робота стосується лише vendor і спільного контракту ще не існує, зупиніться й спочатку визначте
контракт.

## Стандартна послідовність

1. Визначте типізований контракт ядра.
2. Додайте реєстрацію Plugin для цього контракту.
3. Додайте спільний допоміжний засіб runtime.
4. Підключіть один реальний vendor Plugin як доказ.
5. Переведіть feature/channel-споживачів на допоміжний засіб runtime.
6. Додайте contract-тести.
7. Задокументуйте операторський config і модель володіння.

## Що куди належить

Ядро:

- типи request/response
- registry провайдерів + resolution
- поведінка fallback
- schema config плюс поширені метадані docs `title` / `description` у вузлах вкладених об’єктів, wildcard, елементів масивів і composition
- поверхня допоміжного засобу runtime

Vendor Plugin:

- виклики API vendor
- обробка auth vendor
- vendor-специфічна нормалізація request
- реєстрація реалізації capability

Feature/channel Plugin:

- викликає `api.runtime.*` або відповідний допоміжний засіб `plugin-sdk/*-runtime`
- ніколи не викликає реалізацію vendor напряму

## Контрольний список файлів

Для нової capability очікуйте, що доведеться змінити такі області:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- один або кілька пакетів вбудованих Plugin
- config/docs/tests

## Приклад: image generation

Image generation дотримується стандартної форми:

1. ядро визначає `ImageGenerationProvider`
2. ядро відкриває `registerImageGenerationProvider(...)`
3. ядро відкриває `runtime.imageGeneration.generate(...)`
4. Plugin `openai`, `google`, `fal` і `minimax` реєструють реалізації з підтримкою vendor
5. майбутні vendor можуть реєструвати той самий контракт без зміни каналів/інструментів

Ключ config відокремлений від маршрутизації vision-analysis:

- `agents.defaults.imageModel` = аналіз зображень
- `agents.defaults.imageGenerationModel` = генерація зображень

Тримайте їх окремо, щоб fallback і policy залишалися явними.

## Контрольний список перевірки

Перед випуском нової capability перевірте:

- жоден канал/інструмент не імпортує код vendor напряму
- допоміжний засіб runtime є спільним шляхом
- принаймні один contract-тест перевіряє вбудоване володіння
- docs config називають новий ключ model/config
- docs Plugin пояснюють межу володіння

Якщо PR пропускає шар capability і жорстко вбудовує поведінку vendor у
канал/інструмент, повертайте його назад і спочатку визначайте контракт.

## Пов’язане

- [Plugin](/uk/tools/plugin)
- [Створення Skills](/uk/tools/creating-skills)
- [Інструменти та Plugins](/uk/tools)
