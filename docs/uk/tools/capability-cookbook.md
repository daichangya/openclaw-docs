---
read_when:
    - Додавання нової базової можливості та поверхні реєстрації plugins
    - Вирішення, чи має код належати core, vendor plugin або feature plugin
    - Підключення нового runtime helper для каналів або інструментів
sidebarTitle: Adding Capabilities
summary: Посібник для контриб’юторів із додавання нової спільної можливості до системи plugins OpenClaw
title: Додавання можливостей (посібник для контриб’юторів)
x-i18n:
    generated_at: "2026-04-05T18:18:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29604d88e6df5205b835d71f3078b6223c58b6294135c3e201756c1bcac33ea3
    source_path: tools/capability-cookbook.md
    workflow: 15
---

# Додавання можливостей

<Info>
  Це **посібник для контриб’юторів** для core-розробників OpenClaw. Якщо ви
  створюєте зовнішній plugin, натомість див. [Building Plugins](/uk/plugins/building-plugins).
</Info>

Використовуйте це, коли OpenClaw потрібна нова доменна область, така як генерація зображень, генерація відео або якась майбутня функціональна область із підтримкою vendor.

Правило:

- plugin = межа володіння
- capability = спільний контракт core

Це означає, що не слід починати з прямого підключення vendor до каналу або
інструмента. Почніть із визначення можливості.

## Коли створювати можливість

Створюйте нову можливість, коли всі ці умови істинні:

1. її потенційно може реалізувати більш ніж один vendor
2. канали, інструменти або feature plugins мають споживати її, не зважаючи на
   vendor
3. core має володіти поведінкою fallback, policy, config або delivery

Якщо робота стосується лише vendor і спільного контракту ще не існує, зупиніться й спочатку визначте
контракт.

## Стандартна послідовність

1. Визначте типізований контракт core.
2. Додайте реєстрацію plugin для цього контракту.
3. Додайте спільний runtime helper.
4. Підключіть один реальний vendor plugin як доказ.
5. Переведіть споживачів feature/channel на runtime helper.
6. Додайте контрактні тести.
7. Задокументуйте операторський config і модель володіння.

## Що куди належить

Core:

- типи request/response
- реєстр провайдерів + резолюція
- поведінка fallback
- схема config плюс поширені метадані документації `title` / `description` на вкладених об’єктах, wildcard, елементах масивів і вузлах композиції
- поверхня runtime helper

Vendor plugin:

- виклики API vendor
- обробка auth vendor
- vendor-специфічна нормалізація request
- реєстрація реалізації можливості

Feature/channel plugin:

- викликає `api.runtime.*` або відповідний helper `plugin-sdk/*-runtime`
- ніколи не викликає реалізацію vendor напряму

## Контрольний список файлів

Для нової можливості очікуйте зміни в таких областях:

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
- один або кілька пакетів вбудованих plugins
- config/docs/tests

## Приклад: генерація зображень

Генерація зображень наслідує стандартну форму:

1. core визначає `ImageGenerationProvider`
2. core надає `registerImageGenerationProvider(...)`
3. core надає `runtime.imageGeneration.generate(...)`
4. plugins `openai`, `google`, `fal` і `minimax` реєструють реалізації на основі vendor
5. майбутні vendors можуть реєструвати той самий контракт без змін у каналах/інструментах

Ключ config відокремлений від маршрутизації аналізу зображень:

- `agents.defaults.imageModel` = аналізувати зображення
- `agents.defaults.imageGenerationModel` = генерувати зображення

Зберігайте їх окремими, щоб fallback і policy залишалися явними.

## Контрольний список перевірки

Перед випуском нової можливості переконайтеся, що:

- жоден канал/інструмент не імпортує код vendor напряму
- runtime helper є спільним шляхом
- принаймні один контрактний тест перевіряє вбудоване володіння
- документація config називає новий ключ моделі/config
- документація plugins пояснює межу володіння

Якщо PR пропускає шар можливостей і жорстко вбудовує поведінку vendor у
канал/інструмент, поверніть його назад і спочатку визначте контракт.
