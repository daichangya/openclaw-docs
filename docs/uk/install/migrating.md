---
read_when:
    - Ви переносите OpenClaw на новий ноутбук/сервер
    - Ви хочете зберегти сесії, auth і входи в канали (WhatsApp тощо)
summary: Перенесення (міграція) встановленого OpenClaw з однієї машини на іншу
title: Посібник з міграції
x-i18n:
    generated_at: "2026-04-05T18:08:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 403f0b9677ce723c84abdbabfad20e0f70fd48392ebf23eabb7f8a111fd6a26d
    source_path: install/migrating.md
    workflow: 15
---

# Міграція OpenClaw на нову машину

Цей посібник допоможе перенести gateway OpenClaw на нову машину без повторного проходження onboarding.

## Що переноситься

Коли ви копіюєте **state dir** (типово `~/.openclaw/`) і свій **workspace**, ви зберігаєте:

- **Config** -- `openclaw.json` і всі налаштування gateway
- **Auth** -- `auth-profiles.json` для кожного агента (API key + OAuth), а також будь-який стан каналу/провайдера в `credentials/`
- **Sessions** -- історію розмов і стан агента
- **Стан каналу** -- вхід у WhatsApp, сесію Telegram тощо
- **Файли workspace** -- `MEMORY.md`, `USER.md`, Skills і prompts

<Tip>
Виконайте `openclaw status` на старій машині, щоб підтвердити шлях до вашої state dir.
Кастомні профілі використовують `~/.openclaw-<profile>/` або шлях, заданий через `OPENCLAW_STATE_DIR`.
</Tip>

## Кроки міграції

<Steps>
  <Step title="Зупиніть gateway і створіть резервну копію">
    На **старій** машині зупиніть gateway, щоб файли не змінювалися під час копіювання, а потім створіть архів:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Якщо ви використовуєте кілька профілів (наприклад `~/.openclaw-work`), архівуйте кожен окремо.

  </Step>

  <Step title="Установіть OpenClaw на новій машині">
    [Установіть](/install) CLI (і Node за потреби) на новій машині.
    Нормально, якщо onboarding створить новий `~/.openclaw/` — далі ви його перезапишете.
  </Step>

  <Step title="Скопіюйте state dir і workspace">
    Передайте архів через `scp`, `rsync -a` або зовнішній носій, а потім розпакуйте:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Переконайтеся, що приховані каталоги були включені, а власник файлів збігається з користувачем, від імені якого працюватиме gateway.

  </Step>

  <Step title="Запустіть doctor і перевірте">
    На новій машині запустіть [Doctor](/gateway/doctor), щоб застосувати міграції config і відновити services:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## Поширені проблеми

<AccordionGroup>
  <Accordion title="Невідповідність профілю або state-dir">
    Якщо старий gateway використовував `--profile` або `OPENCLAW_STATE_DIR`, а новий — ні,
    канали виглядатимуть як вийшли з облікового запису, а сесії будуть порожні.
    Запустіть gateway з **тим самим** профілем або state-dir, який ви перенесли, а потім знову виконайте `openclaw doctor`.
  </Accordion>

  <Accordion title="Копіювання лише openclaw.json">
    Одного лише файлу config недостатньо. Профілі auth моделей зберігаються в
    `agents/<agentId>/agent/auth-profiles.json`, а стан каналу/провайдера як і раніше
    зберігається в `credentials/`. Завжди переносіть **усю** state dir.
  </Accordion>

  <Accordion title="Права доступу та власник">
    Якщо ви копіювали як root або змінили користувача, gateway може не змогти прочитати облікові дані.
    Переконайтеся, що state dir і workspace належать користувачу, від імені якого працює gateway.
  </Accordion>

  <Accordion title="Віддалений режим">
    Якщо ваш UI вказує на **віддалений** gateway, саме віддалений хост володіє сесіями та workspace.
    Переносьте сам хост gateway, а не локальний ноутбук. Див. [FAQ](/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Секрети в резервних копіях">
    State dir містить профілі auth, облікові дані каналів та інший
    стан провайдерів.
    Зберігайте резервні копії в зашифрованому вигляді, уникайте небезпечних каналів передачі й ротуйте ключі, якщо підозрюєте витік.
  </Accordion>
</AccordionGroup>

## Контрольний список перевірки

На новій машині переконайтеся, що:

- [ ] `openclaw status` показує, що gateway запущено
- [ ] Канали все ще підключені (повторне pairing не потрібне)
- [ ] Dashboard відкривається і показує наявні сесії
- [ ] Файли workspace (memory, configs) присутні
