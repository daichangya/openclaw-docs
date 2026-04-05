---
read_when:
    - Trabalhando em recursos do canal Nextcloud Talk
summary: Status de suporte, recursos e configuração do Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-05T12:35:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 900402afe67cf3ce96103d55158eb28cffb29c9845b77248e70d7653b12ae810
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

# Nextcloud Talk

Status: plugin empacotado (bot de webhook). Mensagens diretas, salas, reações e mensagens em markdown são compatíveis.

## Plugin empacotado

O Nextcloud Talk é fornecido como um plugin empacotado nas versões atuais do OpenClaw, então
builds empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma build mais antiga ou em uma instalação personalizada que exclua o Nextcloud Talk,
instale-o manualmente:

Instale pela CLI (registro npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Detalhes: [Plugins](/tools/plugin)

## Configuração rápida (iniciante)

1. Certifique-se de que o plugin Nextcloud Talk está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. No seu servidor Nextcloud, crie um bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Habilite o bot nas configurações da sala de destino.
4. Configure o OpenClaw:
   - Configuração: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Ou variável de ambiente: `NEXTCLOUD_TALK_BOT_SECRET` (apenas conta padrão)
5. Reinicie o gateway (ou conclua a configuração).

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

- Bots não podem iniciar DMs. O usuário precisa enviar uma mensagem ao bot primeiro.
- A URL do webhook precisa ser acessível pelo Gateway; defina `webhookPublicUrl` se estiver atrás de um proxy.
- Uploads de mídia não são compatíveis com a API do bot; a mídia é enviada como URLs.
- A carga do webhook não diferencia DMs de salas; defina `apiUser` + `apiPassword` para habilitar consultas de tipo de sala (caso contrário, DMs serão tratadas como salas).

## Controle de acesso (DMs)

- Padrão: `channels.nextcloud-talk.dmPolicy = "pairing"`. Remetentes desconhecidos recebem um código de pareamento.
- Aprove via:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DMs públicas: `channels.nextcloud-talk.dmPolicy="open"` mais `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` corresponde apenas a IDs de usuário do Nextcloud; nomes de exibição são ignorados.

## Salas (grupos)

- Padrão: `channels.nextcloud-talk.groupPolicy = "allowlist"` (controlado por menção).
- Coloque salas na allowlist com `channels.nextcloud-talk.rooms`:

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

## Recursos

| Recurso          | Status           |
| ---------------- | ---------------- |
| Mensagens diretas | Compatível      |
| Salas            | Compatível       |
| Threads          | Não compatível   |
| Mídia            | Apenas URL       |
| Reações          | Compatível       |
| Comandos nativos | Não compatível   |

## Referência de configuração (Nextcloud Talk)

Configuração completa: [Configuration](/gateway/configuration)

Opções do provedor:

- `channels.nextcloud-talk.enabled`: habilitar/desabilitar a inicialização do canal.
- `channels.nextcloud-talk.baseUrl`: URL da instância Nextcloud.
- `channels.nextcloud-talk.botSecret`: segredo compartilhado do bot.
- `channels.nextcloud-talk.botSecretFile`: caminho do segredo em arquivo regular. Symlinks são rejeitados.
- `channels.nextcloud-talk.apiUser`: usuário da API para consultas de sala (detecção de DM).
- `channels.nextcloud-talk.apiPassword`: senha da API/app para consultas de sala.
- `channels.nextcloud-talk.apiPasswordFile`: caminho do arquivo de senha da API.
- `channels.nextcloud-talk.webhookPort`: porta do listener de webhook (padrão: 8788).
- `channels.nextcloud-talk.webhookHost`: host do webhook (padrão: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: caminho do webhook (padrão: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL de webhook acessível externamente.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: allowlist de DM (IDs de usuário). `open` requer `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: allowlist de grupo (IDs de usuário).
- `channels.nextcloud-talk.rooms`: configurações por sala e allowlist.
- `channels.nextcloud-talk.historyLimit`: limite de histórico de grupo (0 desabilita).
- `channels.nextcloud-talk.dmHistoryLimit`: limite de histórico de DM (0 desabilita).
- `channels.nextcloud-talk.dms`: substituições por DM (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: tamanho do bloco de texto de saída (caracteres).
- `channels.nextcloud-talk.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por comprimento.
- `channels.nextcloud-talk.blockStreaming`: desabilitar block streaming para este canal.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ajuste de coalescência de block streaming.
- `channels.nextcloud-talk.mediaMaxMb`: limite de mídia de entrada (MB).

## Relacionado

- [Channels Overview](/channels) — todos os canais compatíveis
- [Pairing](/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Groups](/channels/groups) — comportamento de chat em grupo e controle por menção
- [Channel Routing](/channels/channel-routing) — roteamento de sessão para mensagens
- [Security](/gateway/security) — modelo de acesso e hardening
