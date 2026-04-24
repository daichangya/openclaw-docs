---
read_when:
    - Trabalhando nos recursos do canal Nextcloud Talk
summary: Status do suporte ao Nextcloud Talk, capacidades e configuração
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-24T08:57:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a3af391ffa445ef1ebc7877a1158c3c6aa7ecc71ceadcb0e783a80b040fe062
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

Status: Plugin incluído no pacote (bot de Webhook). Mensagens diretas, salas, reações e mensagens em Markdown são suportadas.

## Plugin incluído no pacote

O Nextcloud Talk é distribuído como um Plugin incluído no pacote nas versões atuais do OpenClaw, então compilações empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclui o Nextcloud Talk, instale-o manualmente:

Instalar via CLI (registro npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida (iniciante)

1. Garanta que o Plugin Nextcloud Talk esteja disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. No seu servidor Nextcloud, crie um bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Ative o bot nas configurações da sala de destino.
4. Configure o OpenClaw:
   - Configuração: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Ou env: `NEXTCLOUD_TALK_BOT_SECRET` (somente conta padrão)

   Configuração pela CLI:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Campos explícitos equivalentes:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Segredo baseado em arquivo:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Reinicie o Gateway (ou conclua a configuração).

Configuração mínima:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Observações

- Bots não podem iniciar mensagens diretas. O usuário precisa enviar uma mensagem ao bot primeiro.
- A URL do Webhook deve ser acessível pelo Gateway; defina `webhookPublicUrl` se estiver atrás de um proxy.
- Uploads de mídia não são suportados pela API do bot; a mídia é enviada como URLs.
- A carga do Webhook não diferencia mensagens diretas de salas; defina `apiUser` + `apiPassword` para ativar consultas de tipo de sala (caso contrário, mensagens diretas são tratadas como salas).

## Controle de acesso (mensagens diretas)

- Padrão: `channels.nextcloud-talk.dmPolicy = "pairing"`. Remetentes desconhecidos recebem um código de pareamento.
- Aprovar via:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Mensagens diretas públicas: `channels.nextcloud-talk.dmPolicy="open"` mais `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` corresponde apenas a IDs de usuário do Nextcloud; nomes de exibição são ignorados.

## Salas (grupos)

- Padrão: `channels.nextcloud-talk.groupPolicy = "allowlist"` (controlado por menção).
- Adicione salas à allowlist com `channels.nextcloud-talk.rooms`:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Para não permitir nenhuma sala, mantenha a allowlist vazia ou defina `channels.nextcloud-talk.groupPolicy="disabled"`.

## Capacidades

| Recurso            | Status          |
| ------------------ | --------------- |
| Mensagens diretas  | Suportado       |
| Salas              | Suportado       |
| Threads            | Não suportado   |
| Mídia              | Somente URL     |
| Reações            | Suportado       |
| Comandos nativos   | Não suportado   |

## Referência de configuração (Nextcloud Talk)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.nextcloud-talk.enabled`: ativa/desativa a inicialização do canal.
- `channels.nextcloud-talk.baseUrl`: URL da instância Nextcloud.
- `channels.nextcloud-talk.botSecret`: segredo compartilhado do bot.
- `channels.nextcloud-talk.botSecretFile`: caminho do segredo em arquivo regular. Links simbólicos são rejeitados.
- `channels.nextcloud-talk.apiUser`: usuário da API para consultas de sala (detecção de mensagens diretas).
- `channels.nextcloud-talk.apiPassword`: senha da API/aplicativo para consultas de sala.
- `channels.nextcloud-talk.apiPasswordFile`: caminho do arquivo de senha da API.
- `channels.nextcloud-talk.webhookPort`: porta do listener de Webhook (padrão: 8788).
- `channels.nextcloud-talk.webhookHost`: host do Webhook (padrão: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: caminho do Webhook (padrão: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL de Webhook acessível externamente.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: allowlist de mensagens diretas (IDs de usuário). `open` requer `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: allowlist de grupos (IDs de usuário).
- `channels.nextcloud-talk.rooms`: configurações por sala e allowlist.
- `channels.nextcloud-talk.historyLimit`: limite de histórico de grupos (0 desativa).
- `channels.nextcloud-talk.dmHistoryLimit`: limite de histórico de mensagens diretas (0 desativa).
- `channels.nextcloud-talk.dms`: substituições por mensagem direta (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: tamanho do bloco de texto de saída (caracteres).
- `channels.nextcloud-talk.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por comprimento.
- `channels.nextcloud-talk.blockStreaming`: desativa block streaming para este canal.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ajuste fino de coalescência do block streaming.
- `channels.nextcloud-talk.mediaMaxMb`: limite de mídia de entrada (MB).

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais suportados
- [Pareamento](/pt-BR/channels/pairing) — autenticação de mensagens diretas e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e endurecimento
