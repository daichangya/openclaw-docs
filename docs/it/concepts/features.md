---
read_when:
    - Vuoi un elenco completo di ciò che OpenClaw supporta
summary: Funzionalità di OpenClaw nei vari canali, instradamento, contenuti multimediali e UX.
title: Funzionalità
x-i18n:
    generated_at: "2026-04-22T04:21:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af9955b65030fe02e35d3056d284271fa9700f3ed094c6f8323eb10e4064e22
    source_path: concepts/features.md
    workflow: 15
---

# Funzionalità

## In evidenza

<Columns>
  <Card title="Canali" icon="message-square" href="/it/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e altro con un unico Gateway.
  </Card>
  <Card title="Plugin" icon="plug" href="/it/tools/plugin">
    I Plugin inclusi aggiungono Matrix, Nextcloud Talk, Nostr, Twitch, Zalo e altro senza installazioni separate nelle normali release correnti.
  </Card>
  <Card title="Instradamento" icon="route" href="/it/concepts/multi-agent">
    Instradamento multi-agente con sessioni isolate.
  </Card>
  <Card title="Contenuti multimediali" icon="image" href="/it/nodes/images">
    Immagini, audio, video, documenti e generazione di immagini/video.
  </Card>
  <Card title="App e interfaccia utente" icon="monitor" href="/web/control-ui">
    Control UI web e app complementare per macOS.
  </Card>
  <Card title="Node mobili" icon="smartphone" href="/it/nodes">
    Node iOS e Android con pairing, voce/chat e comandi avanzati del dispositivo.
  </Card>
</Columns>

## Elenco completo

**Canali:**

- I canali integrati includono Discord, Google Chat, iMessage (legacy), IRC, Signal, Slack, Telegram, WebChat e WhatsApp
- I canali Plugin inclusi comprendono BlueBubbles per iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo e Zalo Personal
- I Plugin di canale opzionali installati separatamente includono Voice Call e pacchetti di terze parti come WeChat
- I Plugin di canale di terze parti possono estendere ulteriormente il Gateway, come WeChat
- Supporto per chat di gruppo con attivazione basata sulle menzioni
- Sicurezza DM con allowlist e pairing

**Agente:**

- Runtime agente incorporato con streaming degli strumenti
- Instradamento multi-agente con sessioni isolate per workspace o mittente
- Sessioni: le chat dirette confluiscono nel `main` condiviso; i gruppi sono isolati
- Streaming e suddivisione in blocchi per risposte lunghe

**Autenticazione e provider:**

- Oltre 35 provider di modelli (Anthropic, OpenAI, Google e altri)
- Autenticazione in abbonamento tramite OAuth (ad esempio OpenAI Codex)
- Supporto per provider personalizzati e self-hosted (vLLM, SGLang, Ollama e qualsiasi endpoint compatibile con OpenAI o Anthropic)

**Contenuti multimediali:**

- Immagini, audio, video e documenti in ingresso e in uscita
- Superfici di funzionalità condivise per la generazione di immagini e video
- Trascrizione di note vocali
- Sintesi vocale con più provider

**App e interfacce:**

- WebChat e Control UI nel browser
- App complementare per la barra dei menu di macOS
- Node iOS con pairing, Canvas, fotocamera, registrazione dello schermo, posizione e voce
- Node Android con pairing, chat, voce, Canvas, fotocamera e comandi del dispositivo

**Strumenti e automazione:**

- Automazione del browser, exec, sandboxing
- Ricerca web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Processi Cron e pianificazione Heartbeat
- Skills, Plugin e pipeline di workflow (Lobster)
