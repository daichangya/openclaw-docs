---
read_when:
    - Вам потрібен повний список того, що підтримує OpenClaw
summary: Можливості OpenClaw у каналах, маршрутизації, медіа та UX.
title: Можливості
x-i18n:
    generated_at: "2026-04-23T22:58:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
    source_path: concepts/features.md
    workflow: 15
---

## Основні можливості

<Columns>
  <Card title="Канали" icon="message-square" href="/uk/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat та інші через єдиний Gateway.
  </Card>
  <Card title="Plugin-и" icon="plug" href="/uk/tools/plugin">
    Вбудовані Plugin-и додають Matrix, Nextcloud Talk, Nostr, Twitch, Zalo та інші без окремих установлень у звичайних поточних релізах.
  </Card>
  <Card title="Маршрутизація" icon="route" href="/uk/concepts/multi-agent">
    Маршрутизація з кількома агентами з ізольованими сесіями.
  </Card>
  <Card title="Медіа" icon="image" href="/uk/nodes/images">
    Зображення, аудіо, відео, документи та генерація зображень/відео.
  </Card>
  <Card title="Застосунки та UI" icon="monitor" href="/uk/web/control-ui">
    Web Control UI та супутній застосунок для macOS.
  </Card>
  <Card title="Мобільні Node" icon="smartphone" href="/uk/nodes">
    Node для iOS та Android зі сполученням, голосом/чатом і розширеними командами пристрою.
  </Card>
</Columns>

## Повний список

**Канали:**

- Вбудовані канали включають Discord, Google Chat, iMessage (legacy), IRC, Signal, Slack, Telegram, WebChat і WhatsApp
- Канали вбудованих Plugin-ів включають BlueBubbles для iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo і Zalo Personal
- Необов’язкові окремо встановлювані Plugin-и каналів включають Voice Call і сторонні пакети, такі як WeChat
- Сторонні Plugin-и каналів можуть іще більше розширювати Gateway, наприклад WeChat
- Підтримка групових чатів з активацією через згадки
- Безпека приватних повідомлень зі списками дозволених і сполученням

**Агент:**

- Вбудоване runtime-середовище агента з потоковою передачею інструментів
- Маршрутизація з кількома агентами з ізольованими сесіями для кожного робочого простору або відправника
- Сесії: прямі чати згортаються в спільну `main`; групи ізольовані
- Потокова передача та поділ на частини для довгих відповідей

**Автентифікація та провайдери:**

- 35+ провайдерів моделей (Anthropic, OpenAI, Google та інші)
- Підпискова автентифікація через OAuth (наприклад, OpenAI Codex)
- Підтримка користувацьких і self-hosted провайдерів (vLLM, SGLang, Ollama та будь-який endpoint, сумісний з OpenAI або Anthropic)

**Медіа:**

- Зображення, аудіо, відео та документи на вхід і вихід
- Спільні поверхні можливостей для генерації зображень і відео
- Транскрибування голосових повідомлень
- Перетворення тексту на мовлення з кількома провайдерами

**Застосунки та інтерфейси:**

- WebChat і браузерний Control UI
- Супутній застосунок для macOS у рядку меню
- Node для iOS зі сполученням, Canvas, камерою, записом екрана, геолокацією та голосом
- Node для Android зі сполученням, чатом, голосом, Canvas, камерою та командами пристрою

**Інструменти та автоматизація:**

- Автоматизація браузера, exec, sandboxing
- Вебпошук (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Завдання Cron і планування Heartbeat
- Skills, Plugin-и та конвеєри робочих процесів (Lobster)

## Пов’язане

- [Експериментальні можливості](/uk/concepts/experimental-features)
- [Runtime-середовище агента](/uk/concepts/agent)
