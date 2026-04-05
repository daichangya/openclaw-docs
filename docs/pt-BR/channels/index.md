---
read_when:
    - Você quer escolher um canal de chat para o OpenClaw
    - Você precisa de uma visão geral rápida das plataformas de mensagens compatíveis
summary: Plataformas de mensagens às quais o OpenClaw pode se conectar
title: Canais de chat
x-i18n:
    generated_at: "2026-04-05T12:35:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 246ee6f16aebe751241f00102bb435978ed21f6158385aff5d8e222e30567416
    source_path: channels/index.md
    workflow: 15
---

# Canais de chat

O OpenClaw pode falar com você em qualquer app de chat que você já usa. Cada canal se conecta pelo Gateway.
Texto é compatível em todos os lugares; mídia e reações variam por canal.

## Canais compatíveis

- [BlueBubbles](/channels/bluebubbles) — **Recomendado para iMessage**; usa a API REST do servidor BlueBubbles no macOS com suporte completo a recursos (plugin incluído; editar, cancelar envio, efeitos, reações, gerenciamento de grupos — editar está quebrado no momento no macOS 26 Tahoe).
- [Discord](/channels/discord) — API de Bot do Discord + Gateway; oferece suporte a servidores, canais e DMs.
- [Feishu](/channels/feishu) — bot Feishu/Lark via WebSocket (plugin incluído).
- [Google Chat](/channels/googlechat) — app da API do Google Chat via webhook HTTP.
- [iMessage (legacy)](/channels/imessage) — integração legada com macOS via CLI `imsg` (obsoleta; use BlueBubbles em novas configurações).
- [IRC](/channels/irc) — servidores IRC clássicos; canais + DMs com controles de pareamento/lista de permissões.
- [LINE](/channels/line) — bot da API de Mensagens do LINE (plugin incluído).
- [Matrix](/channels/matrix) — protocolo Matrix (plugin incluído).
- [Mattermost](/channels/mattermost) — API de Bot + WebSocket; canais, grupos, DMs (plugin incluído).
- [Microsoft Teams](/channels/msteams) — Bot Framework; suporte empresarial (plugin incluído).
- [Nextcloud Talk](/channels/nextcloud-talk) — chat auto-hospedado via Nextcloud Talk (plugin incluído).
- [Nostr](/channels/nostr) — DMs descentralizadas via NIP-04 (plugin incluído).
- [QQ Bot](/channels/qqbot) — API de Bot do QQ; chat privado, chat em grupo e mídia avançada (plugin incluído).
- [Signal](/channels/signal) — `signal-cli`; com foco em privacidade.
- [Slack](/channels/slack) — SDK Bolt; apps de workspace.
- [Synology Chat](/channels/synology-chat) — Chat do Synology NAS via webhooks de saída+entrada (plugin incluído).
- [Telegram](/channels/telegram) — API de Bot via grammY; oferece suporte a grupos.
- [Tlon](/channels/tlon) — mensageiro baseado em Urbit (plugin incluído).
- [Twitch](/channels/twitch) — chat da Twitch via conexão IRC (plugin incluído).
- [Voice Call](/plugins/voice-call) — telefonia via Plivo ou Twilio (plugin, instalado separadamente).
- [WebChat](/web/webchat) — interface WebChat do Gateway via WebSocket.
- [WeChat](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin) — plugin Tencent iLink Bot via login por QR; apenas chats privados.
- [WhatsApp](/channels/whatsapp) — O mais popular; usa Baileys e exige pareamento por QR.
- [Zalo](/channels/zalo) — API de Bot do Zalo; o mensageiro popular do Vietnã (plugin incluído).
- [Zalo Personal](/channels/zalouser) — conta pessoal do Zalo via login por QR (plugin incluído).

## Observações

- Os canais podem ser executados simultaneamente; configure vários e o OpenClaw fará o roteamento por chat.
- A configuração mais rápida geralmente é o **Telegram** (token de bot simples). O WhatsApp exige pareamento por QR e
  armazena mais estado em disco.
- O comportamento em grupos varia por canal; consulte [Groups](/channels/groups).
- O pareamento de DM e as listas de permissões são aplicados por segurança; consulte [Security](/gateway/security).
- Solução de problemas: [Channel troubleshooting](/channels/troubleshooting).
- Provedores de modelos são documentados separadamente; consulte [Model Providers](/providers/models).
