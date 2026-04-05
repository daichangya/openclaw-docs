---
read_when:
    - Ви хочете, щоб ваш агент звучав менш шаблонно
    - Ви редагуєте SOUL.md
    - Ви хочете сильнішу особистість без шкоди для безпеки чи лаконічності
summary: Використовуйте SOUL.md, щоб надати вашому агенту OpenClaw справжній голос замість шаблонної млявості асистента
title: Посібник з особистості SOUL.md
x-i18n:
    generated_at: "2026-04-05T18:02:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4f73d68bc8ded6b46497a2f63516f9b2753b111e6176ba40b200858a6938fba
    source_path: concepts/soul.md
    workflow: 15
---

# Посібник з особистості SOUL.md

`SOUL.md` — це місце, де живе голос вашого агента.

OpenClaw інʼєктує його у звичайні сесії, тож він справді має вагу. Якщо ваш агент
звучить блякло, надто ухильно або дивно по-корпоративному, зазвичай треба виправляти саме цей файл.

## Що має бути в SOUL.md

Додавайте те, що змінює відчуття від спілкування з агентом:

- тон
- думки
- лаконічність
- гумор
- межі
- типовий рівень прямолінійності

**Не** перетворюйте його на:

- історію життя
- changelog
- злив безпекових політик
- гігантську стіну вайбу без жодного поведінкового ефекту

Коротке краще за довге. Чітке краще за розмите.

## Чому це працює

Це узгоджується з рекомендаціями OpenAI щодо prompt:

- Посібник із prompt engineering каже, що високорівнева поведінка, тон, цілі та
  приклади мають бути у шарі інструкцій із високим пріоритетом, а не
  заховані в повідомленні користувача.
- Той самий посібник рекомендує ставитися до prompt як до чогось, що ви
  ітеруєте, фіксуєте й оцінюєте, а не як до магічної прози, яку пишуть один раз і забувають.

Для OpenClaw саме `SOUL.md` є таким шаром.

Якщо ви хочете кращу особистість, пишіть сильніші інструкції. Якщо хочете стабільну
особистість, тримайте їх стислими й версійованими.

Посилання OpenAI:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Prompt Molty

Вставте це у свого агента й дозвольте йому переписати `SOUL.md`.

Шлях фіксований для робочих тек OpenClaw: використовуйте `SOUL.md`, а не `http://SOUL.md`.

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## Як виглядає хороший результат

Хороші правила в `SOUL.md` звучать так:

- май чітку позицію
- пропускай заповнювачі
- будь смішним, коли це доречно
- рано вказуй на погані ідеї
- залишайся лаконічним, якщо глибина справді не потрібна

Погані правила в `SOUL.md` звучать так:

- maintain professionalism at all times
- provide comprehensive and thoughtful assistance
- ensure a positive and supportive experience

Саме другий список і перетворює все на кашу.

## Одне попередження

Особистість — це не дозвіл бути недбалим.

Тримайте `AGENTS.md` для правил роботи. Тримайте `SOUL.md` для голосу, позиції та
стилю. Якщо ваш агент працює у спільних каналах, публічних відповідях або на
поверхнях для клієнтів, переконайтеся, що тон усе ще відповідає ситуації.

Гострота — це добре. Дратівливість — ні.

## Повʼязана документація

- [Робоча тека агента](/concepts/agent-workspace)
- [System prompt](/concepts/system-prompt)
- [Шаблон SOUL.md](/reference/templates/SOUL)
