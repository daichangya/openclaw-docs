---
read_when:
    - Você quer uma lista completa do que o OpenClaw oferece
summary: Recursos do OpenClaw em canais, roteamento, mídia e UX.
title: Recursos
x-i18n:
    generated_at: "2026-04-05T12:39:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43eae89d9af44ea786dd0221d8d602ebcea15da9d5064396ac9920c0345e2ad3
    source_path: concepts/features.md
    workflow: 15
---

# Recursos

## Destaques

<Columns>
  <Card title="Canais" icon="message-square">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e muito mais com um único Gateway.
  </Card>
  <Card title="Plugins" icon="plug">
    Plugins incluídos adicionam Matrix, Nextcloud Talk, Nostr, Twitch, Zalo e muito mais sem instalações separadas nas versões atuais normais.
  </Card>
  <Card title="Roteamento" icon="route">
    Roteamento com vários agentes e sessões isoladas.
  </Card>
  <Card title="Mídia" icon="image">
    Imagens, áudio, vídeo, documentos e geração de imagem/vídeo.
  </Card>
  <Card title="Apps e UI" icon="monitor">
    Web Control UI e app complementar para macOS.
  </Card>
  <Card title="Nós móveis" icon="smartphone">
    Nós iOS e Android com pareamento, voz/chat e comandos avançados de dispositivo.
  </Card>
</Columns>

## Lista completa

**Canais:**

- Os canais integrados incluem Discord, Google Chat, iMessage (legacy), IRC, Signal, Slack, Telegram, WebChat e WhatsApp
- Os canais de plugin incluídos incluem BlueBubbles para iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo e Zalo Personal
- Plugins de canal opcionais instalados separadamente incluem Voice Call e pacotes de terceiros, como WeChat
- Plugins de canal de terceiros podem ampliar ainda mais o Gateway, como WeChat
- Suporte a chat em grupo com ativação baseada em menção
- Segurança em DM com listas de permissões e pareamento

**Agente:**

- Runtime de agente incorporado com streaming de ferramentas
- Roteamento com vários agentes e sessões isoladas por workspace ou remetente
- Sessões: chats diretos são consolidados em `main`; grupos são isolados
- Streaming e fragmentação para respostas longas

**Autenticação e providers:**

- Mais de 35 providers de modelo (Anthropic, OpenAI, Google e outros)
- Autenticação de assinatura via OAuth (por exemplo, OpenAI Codex)
- Suporte a providers personalizados e auto-hospedados (vLLM, SGLang, Ollama e qualquer endpoint compatível com OpenAI ou Anthropic)

**Mídia:**

- Imagens, áudio, vídeo e documentos de entrada e saída
- Superfícies de capacidade compartilhadas para geração de imagem e geração de vídeo
- Transcrição de mensagens de voz
- Texto para fala com vários providers

**Apps e interfaces:**

- WebChat e Control UI no navegador
- App complementar na barra de menus do macOS
- Nó iOS com pareamento, Canvas, câmera, gravação de tela, localização e voz
- Nó Android com pareamento, chat, voz, Canvas, câmera e comandos de dispositivo

**Ferramentas e automação:**

- Automação de navegador, exec, sandboxing
- Busca na web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Trabalhos cron e agendamento por heartbeat
- Skills, plugins e pipelines de fluxo de trabalho (Lobster)
