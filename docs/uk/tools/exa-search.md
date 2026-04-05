---
read_when:
    - Ви хочете використовувати Exa для `web_search`
    - Вам потрібен `EXA_API_KEY`
    - Ви хочете використовувати neural search або витягування вмісту
summary: Пошук Exa AI — neural і keyword search з витягуванням вмісту
title: Пошук Exa
x-i18n:
    generated_at: "2026-04-05T18:19:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 307b727b4fb88756cac51c17ffd73468ca695c4481692e03d0b4a9969982a2a8
    source_path: tools/exa-search.md
    workflow: 15
---

# Пошук Exa

OpenClaw підтримує [Exa AI](https://exa.ai/) як провайдера `web_search`. Exa
пропонує режими neural, keyword і hybrid search із вбудованим
витягуванням вмісту (highlights, text, summaries).

## Отримайте API-ключ

<Steps>
  <Step title="Створіть обліковий запис">
    Зареєструйтеся на [exa.ai](https://exa.ai/) і згенеруйте API-ключ на
    своїй панелі керування.
  </Step>
  <Step title="Збережіть ключ">
    Установіть `EXA_API_KEY` у середовищі Gateway або налаштуйте через:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Конфігурація

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // optional if EXA_API_KEY is set
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Альтернатива через середовище:** установіть `EXA_API_KEY` у середовищі Gateway.
Для встановлення gateway додайте його в `~/.openclaw/.env`.

## Параметри інструмента

| Параметр      | Опис                                                                          |
| ------------- | ----------------------------------------------------------------------------- |
| `query`       | Пошуковий запит (обов’язково)                                                 |
| `count`       | Кількість результатів для повернення (1-100)                                  |
| `type`        | Режим пошуку: `auto`, `neural`, `fast`, `deep`, `deep-reasoning` або `instant` |
| `freshness`   | Часовий фільтр: `day`, `week`, `month` або `year`                             |
| `date_after`  | Результати після цієї дати (YYYY-MM-DD)                                       |
| `date_before` | Результати до цієї дати (YYYY-MM-DD)                                          |
| `contents`    | Параметри витягування вмісту (див. нижче)                                     |

### Витягування вмісту

Exa може повертати витягнутий вміст разом із результатами пошуку. Передайте об’єкт `contents`,
щоб увімкнути це:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| Параметр `contents` | Тип                                                                   | Опис                         |
| ------------------- | --------------------------------------------------------------------- | ---------------------------- |
| `text`              | `boolean \| { maxCharacters }`                                        | Витягнути повний текст сторінки |
| `highlights`        | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Витягнути ключові речення    |
| `summary`           | `boolean \| { query }`                                                | Згенерований AI підсумок     |

### Режими пошуку

| Режим            | Опис                                 |
| ---------------- | ------------------------------------ |
| `auto`           | Exa вибирає найкращий режим (типово) |
| `neural`         | Семантичний пошук / пошук за змістом |
| `fast`           | Швидкий keyword search               |
| `deep`           | Ретельний глибокий пошук             |
| `deep-reasoning` | Глибокий пошук із reasoning          |
| `instant`        | Найшвидші результати                 |

## Примітки

- Якщо параметр `contents` не вказано, Exa типово використовує `{ highlights: true }`,
  щоб результати містили витяги з ключових речень
- Результати зберігають поля `highlightScores` і `summary` з відповіді API Exa,
  якщо вони доступні
- Описи результатів формуються спочатку з highlights, потім із summary, потім із
  повного тексту — залежно від того, що доступно
- `freshness` і `date_after`/`date_before` не можна комбінувати — використовуйте один
  режим часової фільтрації
- Для одного запиту можна повернути до 100 результатів (з урахуванням обмежень Exa
  для типу пошуку)
- Результати типово кешуються на 15 хвилин (налаштовується через
  `cacheTtlMinutes`)
- Exa — це офіційна інтеграція API зі структурованими JSON-відповідями

## Пов’язане

- [Огляд Web Search](/tools/web) -- усі провайдери та автовизначення
- [Brave Search](/tools/brave-search) -- структуровані результати з фільтрами країни/мови
- [Perplexity Search](/tools/perplexity-search) -- структуровані результати з фільтрацією за доменами
