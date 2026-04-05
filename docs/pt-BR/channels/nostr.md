---
read_when:
    - Você quer que o OpenClaw receba DMs via Nostr
    - Você está configurando mensagens descentralizadas
summary: Canal de DM do Nostr por meio de mensagens criptografadas NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-05T12:35:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82829ee66fbeb3367007af343797140049ea49f2e842a695fa56acea0c80728
    source_path: channels/nostr.md
    workflow: 15
---

# Nostr

**Status:** Plugin empacotado opcional (desativado por padrão até ser configurado).

Nostr é um protocolo descentralizado para rede social. Este canal permite que o OpenClaw receba e responda a mensagens diretas (DMs) criptografadas via NIP-04.

## Plugin empacotado

As versões atuais do OpenClaw incluem o Nostr como um plugin empacotado, portanto builds empacotadas normais não precisam de uma instalação separada.

### Instalações antigas/personalizadas

- O onboarding (`openclaw onboard`) e `openclaw channels add` ainda exibem o Nostr no catálogo compartilhado de canais.
- Se a sua build excluir o Nostr empacotado, instale-o manualmente.

```bash
openclaw plugins install @openclaw/nostr
```

Use um checkout local (fluxos de trabalho de desenvolvimento):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Reinicie o Gateway após instalar ou ativar plugins.

### Configuração não interativa

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Use `--use-env` para manter `NOSTR_PRIVATE_KEY` no ambiente em vez de armazenar a chave na configuração.

## Configuração rápida

1. Gere um par de chaves Nostr (se necessário):

```bash
# Usando nak
nak key generate
```

2. Adicione à configuração:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Exporte a chave:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Reinicie o Gateway.

## Referência de configuração

| Chave        | Tipo     | Padrão                                      | Descrição                             |
| ------------ | -------- | ------------------------------------------- | ------------------------------------- |
| `privateKey` | string   | obrigatório                                 | Chave privada em formato `nsec` ou hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URLs de relay (WebSocket)             |
| `dmPolicy`   | string   | `pairing`                                   | Política de acesso a DM               |
| `allowFrom`  | string[] | `[]`                                        | Chaves públicas de remetentes permitidos |
| `enabled`    | boolean  | `true`                                      | Ativar/desativar canal                |
| `name`       | string   | -                                           | Nome de exibição                      |
| `profile`    | object   | -                                           | Metadados de perfil NIP-01            |

## Metadados de perfil

Os dados de perfil são publicados como um evento NIP-01 `kind:0`. Você pode gerenciá-los pela UI de controle (Channels -> Nostr -> Profile) ou defini-los diretamente na configuração.

Exemplo:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

Observações:

- URLs de perfil devem usar `https://`.
- A importação a partir de relays mescla os campos e preserva substituições locais.

## Controle de acesso

### Políticas de DM

- **pairing** (padrão): remetentes desconhecidos recebem um código de pareamento.
- **allowlist**: apenas chaves públicas em `allowFrom` podem enviar DM.
- **open**: DMs públicas de entrada (requer `allowFrom: ["*"]`).
- **disabled**: ignora DMs de entrada.

Observações sobre aplicação:

- Assinaturas de eventos de entrada são verificadas antes da política de remetente e da descriptografia NIP-04, então eventos forjados são rejeitados logo no início.
- Respostas de pareamento são enviadas sem processar o corpo original da DM.
- DMs de entrada têm limite de taxa, e payloads grandes demais são descartados antes da descriptografia.

### Exemplo de allowlist

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## Formatos de chave

Formatos aceitos:

- **Chave privada:** `nsec...` ou hex com 64 caracteres
- **Chaves públicas (`allowFrom`):** `npub...` ou hex

## Relays

Padrões: `relay.damus.io` e `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

Dicas:

- Use 2 a 3 relays para redundância.
- Evite relays demais (latência, duplicação).
- Relays pagos podem melhorar a confiabilidade.
- Relays locais funcionam bem para testes (`ws://localhost:7777`).

## Suporte a protocolo

| NIP    | Status       | Descrição                              |
| ------ | ------------ | -------------------------------------- |
| NIP-01 | Compatível   | Formato básico de evento + metadados de perfil |
| NIP-04 | Compatível   | DMs criptografadas (`kind:4`)          |
| NIP-17 | Planejado    | DMs com gift-wrap                      |
| NIP-44 | Planejado    | Criptografia versionada                |

## Testes

### Relay local

```bash
# Inicie o strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### Teste manual

1. Anote a chave pública do bot (npub) nos logs.
2. Abra um cliente Nostr (Damus, Amethyst etc.).
3. Envie uma DM para a chave pública do bot.
4. Verifique a resposta.

## Solução de problemas

### Não está recebendo mensagens

- Verifique se a chave privada é válida.
- Garanta que as URLs de relay estejam acessíveis e usem `wss://` (ou `ws://` para local).
- Confirme que `enabled` não está como `false`.
- Verifique os logs do Gateway para erros de conexão com relay.

### Não está enviando respostas

- Verifique se o relay aceita gravações.
- Verifique a conectividade de saída.
- Observe limites de taxa do relay.

### Respostas duplicadas

- Esperado ao usar vários relays.
- As mensagens são desduplicadas por ID de evento; apenas a primeira entrega aciona uma resposta.

## Segurança

- Nunca faça commit de chaves privadas.
- Use variáveis de ambiente para chaves.
- Considere `allowlist` para bots de produção.
- As assinaturas são verificadas antes da política de remetente, e a política de remetente é aplicada antes da descriptografia, então eventos forjados são rejeitados cedo e remetentes desconhecidos não podem forçar trabalho criptográfico completo.

## Limitações (MVP)

- Apenas mensagens diretas (sem chats em grupo).
- Sem anexos de mídia.
- Apenas NIP-04 (gift-wrap NIP-17 planejado).

## Relacionado

- [Visão geral dos canais](/channels) — todos os canais compatíveis
- [Pareamento](/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Roteamento de canal](/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/gateway/security) — modelo de acesso e reforço de segurança
