---
read_when:
    - O transporte do canal mostra que está conectado, mas as respostas falham
    - Você precisa de verificações específicas do canal antes de consultar a documentação detalhada do provedor
summary: Solução rápida de problemas no nível do canal com assinaturas de falha e correções por canal
title: Solução de problemas de canal
x-i18n:
    generated_at: "2026-04-21T05:35:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e9e8f093bee1c7aafc244d6b999a957b7571cc125096d72060d0df52bf52c0
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Solução de problemas de canal

Use esta página quando um canal conecta, mas o comportamento está incorreto.

## Sequência de comandos

Execute estes comandos nesta ordem primeiro:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Linha de base saudável:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` ou `admin-capable`
- A sonda do canal mostra o transporte conectado e, quando compatível, `works` ou `audit ok`

## WhatsApp

### Assinaturas de falha do WhatsApp

| Sintoma                           | Verificação mais rápida                           | Correção                                                    |
| --------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| Conectado, mas sem respostas em DM | `openclaw pairing list whatsapp`                  | Aprove o remetente ou altere a política de DM/allowlist.    |
| Mensagens de grupo ignoradas      | Verifique `requireMention` + padrões de menção na config | Mencione o bot ou flexibilize a política de menção para esse grupo. |
| Desconexões/loops de relogin aleatórios | `openclaw channels status --probe` + logs         | Faça login novamente e verifique se o diretório de credenciais está íntegro. |

Solução de problemas completa: [/channels/whatsapp#troubleshooting](/pt-BR/channels/whatsapp#troubleshooting)

## Telegram

### Assinaturas de falha do Telegram

| Sintoma                                | Verificação mais rápida                           | Correção                                                                                                                  |
| -------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `/start`, mas sem fluxo de resposta utilizável | `openclaw pairing list telegram`                  | Aprove o pareamento ou altere a política de DM.                                                                          |
| Bot online, mas o grupo permanece silencioso | Verifique a exigência de menção e o modo de privacidade do bot | Desative o modo de privacidade para visibilidade no grupo ou mencione o bot.                                             |
| Falhas de envio com erros de rede      | Inspecione os logs em busca de falhas em chamadas da API do Telegram | Corrija o roteamento de DNS/IPv6/proxy para `api.telegram.org`.                                                          |
| O polling trava ou reconecta lentamente | `openclaw logs --follow` para diagnósticos de polling | Atualize; se os reinícios forem falsos positivos, ajuste `pollingStallThresholdMs`. Travamentos persistentes ainda apontam para proxy/DNS/IPv6. |
| `setMyCommands` rejeitado na inicialização | Inspecione os logs em busca de `BOT_COMMANDS_TOO_MUCH` | Reduza comandos personalizados/do Plugin/do Skills no Telegram ou desative menus nativos.                                |
| Você atualizou e a allowlist passou a bloquear você | `openclaw security audit` e as allowlists na config | Execute `openclaw doctor --fix` ou substitua `@username` por IDs numéricos de remetente.                                 |

Solução de problemas completa: [/channels/telegram#troubleshooting](/pt-BR/channels/telegram#troubleshooting)

## Discord

### Assinaturas de falha do Discord

| Sintoma                           | Verificação mais rápida              | Correção                                                      |
| --------------------------------- | ------------------------------------ | ------------------------------------------------------------- |
| Bot online, mas sem respostas em guild | `openclaw channels status --probe`   | Permita a guild/o canal e verifique a intent de conteúdo de mensagem. |
| Mensagens de grupo ignoradas      | Verifique nos logs descartes por bloqueio de menção | Mencione o bot ou defina `requireMention: false` para a guild/o canal. |
| Respostas em DM ausentes          | `openclaw pairing list discord`      | Aprove o pareamento de DM ou ajuste a política de DM.         |

Solução de problemas completa: [/channels/discord#troubleshooting](/pt-BR/channels/discord#troubleshooting)

## Slack

### Assinaturas de falha do Slack

| Sintoma                                     | Verificação mais rápida                  | Correção                                                                                                                                             |
| ------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode conectado, mas sem respostas    | `openclaw channels status --probe`       | Verifique o app token + bot token e os scopes necessários; observe `botTokenStatus` / `appTokenStatus = configured_unavailable` em configurações baseadas em SecretRef. |
| DMs bloqueadas                              | `openclaw pairing list slack`            | Aprove o pareamento ou flexibilize a política de DM.                                                                                                |
| Mensagem de canal ignorada                  | Verifique `groupPolicy` e a allowlist do canal | Permita o canal ou altere a política para `open`.                                                                                                   |

Solução de problemas completa: [/channels/slack#troubleshooting](/pt-BR/channels/slack#troubleshooting)

## iMessage e BlueBubbles

### Assinaturas de falha de iMessage e BlueBubbles

| Sintoma                           | Verificação mais rápida                                           | Correção                                              |
| --------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| Nenhum evento de entrada          | Verifique a acessibilidade do Webhook/servidor e as permissões do app | Corrija a URL do Webhook ou o estado do servidor BlueBubbles. |
| Consegue enviar, mas não receber no macOS | Verifique as permissões de privacidade do macOS para automação do Messages | Conceda novamente as permissões do TCC e reinicie o processo do canal. |
| Remetente de DM bloqueado         | `openclaw pairing list imessage` ou `openclaw pairing list bluebubbles` | Aprove o pareamento ou atualize a allowlist.          |

Solução de problemas completa:

- [/channels/imessage#troubleshooting](/pt-BR/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/pt-BR/channels/bluebubbles#troubleshooting)

## Signal

### Assinaturas de falha do Signal

| Sintoma                           | Verificação mais rápida               | Correção                                                     |
| --------------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| Daemon acessível, mas bot silencioso | `openclaw channels status --probe`    | Verifique a URL/conta do daemon `signal-cli` e o modo de recebimento. |
| DM bloqueada                      | `openclaw pairing list signal`        | Aprove o remetente ou ajuste a política de DM.               |
| Respostas em grupo não disparam   | Verifique a allowlist do grupo e os padrões de menção | Adicione o remetente/grupo ou flexibilize o controle.        |

Solução de problemas completa: [/channels/signal#troubleshooting](/pt-BR/channels/signal#troubleshooting)

## QQ Bot

### Assinaturas de falha do QQ Bot

| Sintoma                           | Verificação mais rápida                         | Correção                                                            |
| --------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| Bot responde "gone to Mars"       | Verifique `appId` e `clientSecret` na config    | Defina as credenciais ou reinicie o gateway.                        |
| Nenhuma mensagem de entrada       | `openclaw channels status --probe`              | Verifique as credenciais na QQ Open Platform.                       |
| Voz não transcrita                | Verifique a config do provedor de STT           | Configure `channels.qqbot.stt` ou `tools.media.audio`.              |
| Mensagens proativas não chegam    | Verifique os requisitos de interação da plataforma QQ | A QQ pode bloquear mensagens iniciadas pelo bot sem interação recente. |

Solução de problemas completa: [/channels/qqbot#troubleshooting](/pt-BR/channels/qqbot#troubleshooting)

## Matrix

### Assinaturas de falha do Matrix

| Sintoma                                    | Verificação mais rápida                 | Correção                                                                  |
| ------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------- |
| Login concluído, mas ignora mensagens da sala | `openclaw channels status --probe`      | Verifique `groupPolicy`, a allowlist da sala e o bloqueio por menção.     |
| DMs não são processadas                    | `openclaw pairing list matrix`          | Aprove o remetente ou ajuste a política de DM.                            |
| Salas criptografadas falham                | `openclaw matrix verify status`         | Verifique novamente o device e então confira `openclaw matrix verify backup status`. |
| Restauração de backup pendente/com falha   | `openclaw matrix verify backup status`  | Execute `openclaw matrix verify backup restore` ou execute novamente com uma chave de recuperação. |
| Cross-signing/bootstrap parece incorreto   | `openclaw matrix verify bootstrap`      | Repare o armazenamento secreto, o cross-signing e o estado do backup em uma única passada. |

Configuração e setup completos: [Matrix](/pt-BR/channels/matrix)
