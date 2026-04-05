---
read_when:
    - Configurando o Zalo Personal para o OpenClaw
    - Depurando login ou fluxo de mensagens do Zalo Personal
summary: Suporte a conta pessoal do Zalo via `zca-js` nativo (login por QR), capacidades e configuração
title: Zalo Personal
x-i18n:
    generated_at: "2026-04-05T12:36:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 331b95041463185472d242cb0a944972f0a8e99df8120bda6350eca86ad5963f
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal (não oficial)

Status: experimental. Esta integração automatiza uma **conta pessoal do Zalo** via `zca-js` nativo dentro do OpenClaw.

> **Aviso:** Esta é uma integração não oficial e pode resultar em suspensão/banimento da conta. Use por sua conta e risco.

## Plugin empacotado

O Zalo Personal é distribuído como um plugin empacotado nas versões atuais do OpenClaw, então builds
empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma build mais antiga ou em uma instalação personalizada que exclua o Zalo Personal,
instale-o manualmente:

- Instalar via CLI: `openclaw plugins install @openclaw/zalouser`
- Ou a partir de um checkout do código-fonte: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalhes: [Plugins](/tools/plugin)

Nenhum binário externo da CLI `zca`/`openzca` é necessário.

## Configuração rápida (iniciante)

1. Verifique se o plugin Zalo Personal está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Faça login (QR, na máquina do Gateway):
   - `openclaw channels login --channel zalouser`
   - Escaneie o código QR com o app móvel do Zalo.
3. Ative o canal:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Reinicie o Gateway (ou conclua a configuração).
5. O acesso por DM usa pairing por padrão; aprove o código de pairing no primeiro contato.

## O que é

- Funciona inteiramente em processo via `zca-js`.
- Usa listeners de eventos nativos para receber mensagens de entrada.
- Envia respostas diretamente pela API JS (texto/mídia/link).
- Projetado para casos de uso de “conta pessoal” em que a API oficial de bots do Zalo não está disponível.

## Nomenclatura

O ID do canal é `zalouser` para deixar explícito que isso automatiza uma **conta pessoal de usuário do Zalo** (não oficial). Mantemos `zalo` reservado para uma possível futura integração oficial com a API do Zalo.

## Encontrando IDs (diretório)

Use a CLI de diretório para descobrir peers/grupos e seus IDs:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limites

- O texto de saída é dividido em blocos de ~2000 caracteres (limites do cliente Zalo).
- Streaming é bloqueado por padrão.

## Controle de acesso (DMs)

`channels.zalouser.dmPolicy` oferece suporte a: `pairing | allowlist | open | disabled` (padrão: `pairing`).

`channels.zalouser.allowFrom` aceita IDs de usuário ou nomes. Durante a configuração, nomes são resolvidos para IDs usando a busca de contatos em processo do plugin.

Aprove via:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acesso a grupos (opcional)

- Padrão: `channels.zalouser.groupPolicy = "open"` (grupos permitidos). Use `channels.defaults.groupPolicy` para substituir o padrão quando não estiver definido.
- Restrinja a uma allowlist com:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (as chaves devem ser IDs de grupo estáveis; nomes são resolvidos para IDs na inicialização quando possível)
  - `channels.zalouser.groupAllowFrom` (controla quais remetentes em grupos permitidos podem acionar o bot)
- Bloqueie todos os grupos: `channels.zalouser.groupPolicy = "disabled"`.
- O assistente de configuração pode solicitar allowlists de grupo.
- Na inicialização, o OpenClaw resolve nomes de grupos/usuários em allowlists para IDs e registra o mapeamento.
- A correspondência da allowlist de grupo usa apenas IDs por padrão. Nomes não resolvidos são ignorados para autenticação, a menos que `channels.zalouser.dangerouslyAllowNameMatching: true` esteja ativado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` é um modo de compatibilidade break-glass que reativa a correspondência mutável por nome de grupo.
- Se `groupAllowFrom` não estiver definido, o runtime usa `allowFrom` como fallback para verificações de remetente em grupo.
- As verificações de remetente se aplicam tanto a mensagens normais de grupo quanto a comandos de controle (por exemplo `/new`, `/reset`).

Exemplo:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Gating por menção em grupos

- `channels.zalouser.groups.<group>.requireMention` controla se respostas em grupo exigem uma menção.
- Ordem de resolução: id/nome exato do grupo -> slug normalizado do grupo -> `*` -> padrão (`true`).
- Isso se aplica tanto a grupos em allowlist quanto ao modo de grupo aberto.
- Comandos de controle autorizados (por exemplo `/new`) podem ignorar o gating por menção.
- Quando uma mensagem de grupo é ignorada porque a menção é obrigatória, o OpenClaw a armazena como histórico pendente do grupo e a inclui na próxima mensagem de grupo processada.
- O limite do histórico de grupo usa por padrão `messages.groupChat.historyLimit` (fallback `50`). Você pode substituir por conta com `channels.zalouser.historyLimit`.

Exemplo:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Várias contas

As contas são mapeadas para perfis `zalouser` no estado do OpenClaw. Exemplo:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Digitação, reações e confirmações de entrega

- O OpenClaw envia um evento de digitação antes de despachar uma resposta (melhor esforço).
- A ação de reação de mensagem `react` é compatível com `zalouser` nas ações de canal.
  - Use `remove: true` para remover um emoji de reação específico de uma mensagem.
  - Semântica de reação: [Reações](/tools/reactions)
- Para mensagens de entrada que incluem metadados de evento, o OpenClaw envia confirmações de entregue + visto (melhor esforço).

## Solução de problemas

**O login não persiste:**

- `openclaw channels status --probe`
- Faça login novamente: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**O nome na allowlist/grupo não foi resolvido:**

- Use IDs numéricos em `allowFrom`/`groupAllowFrom`/`groups`, ou nomes exatos de amigos/grupos.

**Atualizou a partir da configuração antiga baseada em CLI:**

- Remova qualquer suposição antiga sobre um processo externo `zca`.
- O canal agora roda totalmente dentro do OpenClaw, sem binários externos de CLI.

## Relacionado

- [Visão geral dos canais](/channels) — todos os canais compatíveis
- [Pairing](/channels/pairing) — autenticação por DM e fluxo de pairing
- [Grupos](/channels/groups) — comportamento de chat em grupo e gating por menção
- [Roteamento de Canais](/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/gateway/security) — modelo de acesso e hardening
