---
read_when:
    - Ви хочете отримати повний список того, що підтримує OpenClaw
summary: Можливості OpenClaw у каналах, маршрутизації, медіа та UX.
title: Можливості
x-i18n:
    generated_at: "2026-04-05T18:00:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43eae89d9af44ea786dd0221d8d602ebcea15da9d5064396ac9920c0345e2ad3
    source_path: concepts/features.md
    workflow: 15
---

# Можливості

## Основні переваги

<Columns>
  <Card title="Канали" icon="message-square">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat та інші через один Gateway.
  </Card>
  <Card title="Плагіни" icon="plug">
    Вбудовані плагіни додають Matrix, Nextcloud Talk, Nostr, Twitch, Zalo та інші без окремого встановлення у звичайних актуальних релізах.
  </Card>
  <Card title="Маршрутизація" icon="route">
    Маршрутизація між кількома агентами з ізольованими сесіями.
  </Card>
  <Card title="Медіа" icon="image">
    Зображення, аудіо, відео, документи та генерація зображень/відео.
  </Card>
  <Card title="Застосунки та UI" icon="monitor">
    Веб-інтерфейс Control UI і супровідний застосунок для macOS.
  </Card>
  <Card title="Мобільні nodes" icon="smartphone">
    Nodes для iOS і Android з pairing, голосом/чатом і розширеними командами пристрою.
  </Card>
</Columns>

## Повний список

**Канали:**

- Вбудовані канали включають Discord, Google Chat, iMessage (legacy), IRC, Signal, Slack, Telegram, WebChat і WhatsApp
- Канали вбудованих плагінів включають BlueBubbles для iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo і Zalo Personal
- Необов’язкові окремо встановлювані плагіни каналів включають Voice Call і сторонні пакунки, такі як WeChat
- Сторонні плагіни каналів можуть додатково розширювати Gateway, наприклад WeChat
- Підтримка групових чатів з активацією через згадки
- Безпека особистих повідомлень через allowlist і pairing

**Агент:**

- Вбудований runtime агента з потоковою передачею інструментів
- Маршрутизація між кількома агентами з ізольованими сесіями для кожного робочого простору або відправника
- Сесії: особисті чати згортаються в спільну `main`; групи ізольовані
- Потокова передача й розбиття довгих відповідей на частини

**Автентифікація та провайдери:**

- Понад 35 провайдерів моделей (Anthropic, OpenAI, Google та інші)
- Автентифікація підписки через OAuth (наприклад, OpenAI Codex)
- Підтримка власних і self-hosted провайдерів (vLLM, SGLang, Ollama, а також будь-яка сумісна з OpenAI або Anthropic кінцева точка)

**Медіа:**

- Зображення, аудіо, відео та документи на вхід і вихід
- Спільні поверхні можливостей для генерації зображень і відео
- Транскрибування голосових повідомлень
- Text-to-speech з кількома провайдерами

**Застосунки та інтерфейси:**

- WebChat і браузерний Control UI
- Супровідний застосунок для macOS у рядку меню
- Node для iOS з pairing, Canvas, камерою, записом екрана, геолокацією та голосом
- Node для Android з pairing, чатом, голосом, Canvas, камерою та командами пристрою

**Інструменти та автоматизація:**

- Автоматизація браузера, exec, sandboxing
- Вебпошук (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron jobs і планування heartbeat
- Skills, плагіни та конвеєри робочих процесів (Lobster)
