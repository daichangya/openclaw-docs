---
read_when:
    - Anda menginginkan daftar lengkap tentang apa yang didukung OpenClaw
summary: Kapabilitas OpenClaw di seluruh channel, routing, media, dan UX.
title: Fitur
x-i18n:
    generated_at: "2026-04-22T04:21:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af9955b65030fe02e35d3056d284271fa9700f3ed094c6f8323eb10e4064e22
    source_path: concepts/features.md
    workflow: 15
---

# Fitur

## Sorotan

<Columns>
  <Card title="Channels" icon="message-square" href="/id/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat, dan lainnya dengan satu Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/id/tools/plugin">
    Plugin bawaan menambahkan Matrix, Nextcloud Talk, Nostr, Twitch, Zalo, dan lainnya tanpa instalasi terpisah pada rilis normal saat ini.
  </Card>
  <Card title="Routing" icon="route" href="/id/concepts/multi-agent">
    Routing multi-agent dengan sesi terisolasi.
  </Card>
  <Card title="Media" icon="image" href="/id/nodes/images">
    Gambar, audio, video, dokumen, serta pembuatan gambar/video.
  </Card>
  <Card title="Apps and UI" icon="monitor" href="/web/control-ui">
    UI Control web dan aplikasi pendamping macOS.
  </Card>
  <Card title="Mobile nodes" icon="smartphone" href="/id/nodes">
    Node iOS dan Android dengan pairing, suara/chat, dan perintah perangkat yang kaya.
  </Card>
</Columns>

## Daftar lengkap

**Channels:**

- Channel bawaan mencakup Discord, Google Chat, iMessage (lama), IRC, Signal, Slack, Telegram, WebChat, dan WhatsApp
- Channel plugin bawaan mencakup BlueBubbles untuk iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo, dan Zalo Personal
- Plugin channel opsional yang diinstal terpisah mencakup Voice Call dan paket pihak ketiga seperti WeChat
- Plugin channel pihak ketiga dapat memperluas Gateway lebih jauh, seperti WeChat
- Dukungan chat grup dengan aktivasi berbasis mention
- Keamanan DM dengan allowlist dan pairing

**Agent:**

- Runtime agent tersemat dengan streaming tool
- Routing multi-agent dengan sesi terisolasi per workspace atau pengirim
- Sesi: chat langsung digabung ke `main`; grup diisolasi
- Streaming dan chunking untuk respons panjang

**Auth dan provider:**

- 35+ provider model (Anthropic, OpenAI, Google, dan lainnya)
- Subscription auth melalui OAuth (mis. OpenAI Codex)
- Dukungan provider kustom dan self-hosted (vLLM, SGLang, Ollama, dan endpoint apa pun yang kompatibel dengan OpenAI atau Anthropic)

**Media:**

- Gambar, audio, video, dan dokumen masuk dan keluar
- Surface kapabilitas bersama untuk pembuatan gambar dan video
- Transkripsi catatan suara
- Text-to-speech dengan banyak provider

**Aplikasi dan antarmuka:**

- WebChat dan UI Control browser
- Aplikasi pendamping bilah menu macOS
- Node iOS dengan pairing, Canvas, kamera, perekaman layar, lokasi, dan suara
- Node Android dengan pairing, chat, suara, Canvas, kamera, dan perintah perangkat

**Tools dan otomasi:**

- Otomasi browser, exec, sandboxing
- Pencarian web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Job Cron dan penjadwalan Heartbeat
- Skills, plugin, dan pipeline workflow (Lobster)
