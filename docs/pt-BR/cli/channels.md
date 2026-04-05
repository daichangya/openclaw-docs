---
read_when:
    - Você quer adicionar/remover contas de canal (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - Você quer verificar o status do canal ou acompanhar logs do canal
summary: Referência da CLI para `openclaw channels` (contas, status, login/logout, logs)
title: channels
x-i18n:
    generated_at: "2026-04-05T12:37:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0f558fdb5f6ec54e7fdb7a88e5c24c9d2567174341bd3ea87848bce4cba5d29
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gerencie contas de canais de chat e o status de runtime delas no Gateway.

Documentação relacionada:

- Guias de canais: [Channels](/channels/index)
- Configuração do Gateway: [Configuration](/gateway/configuration)

## Comandos comuns

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Status / capabilities / resolve / logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (somente com `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` é o caminho ativo: em um gateway acessível, ele executa verificações por conta
de `probeAccount` e opcionais de `auditAccount`, então a saída pode incluir o estado
do transporte mais resultados de sondagem como `works`, `probe failed`, `audit ok` ou `audit failed`.
Se o gateway estiver inacessível, `channels status` usa como fallback
resumos somente de configuração em vez da saída de sondagem ativa.

## Adicionar / remover contas

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Dica: `openclaw channels add --help` mostra flags por canal (token, chave privada, app token, caminhos de signal-cli etc.).

Superfícies comuns de adição não interativa incluem:

- canais com bot token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campos de transporte de Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campos de Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campos de Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campos de Nostr: `--private-key`, `--relay-urls`
- campos de Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` para autenticação baseada em variáveis de ambiente da conta padrão, quando compatível

Quando você executa `openclaw channels add` sem flags, o assistente interativo pode solicitar:

- ids de conta por canal selecionado
- nomes de exibição opcionais para essas contas
- `Bind configured channel accounts to agents now?`

Se você confirmar o bind agora, o assistente pergunta qual agente deve ser o proprietário de cada conta de canal configurada e grava bindings de roteamento com escopo de conta.

Você também pode gerenciar as mesmas regras de roteamento depois com `openclaw agents bindings`, `openclaw agents bind` e `openclaw agents unbind` (consulte [agents](/cli/agents)).

Quando você adiciona uma conta não padrão a um canal que ainda está usando configurações de conta única no nível superior, o OpenClaw promove os valores de nível superior com escopo de conta para o mapa de contas do canal antes de gravar a nova conta. A maioria dos canais coloca esses valores em `channels.<channel>.accounts.default`, mas canais empacotados podem preservar uma conta promovida existente correspondente em vez disso. Matrix é o exemplo atual: se já existir uma conta nomeada, ou se `defaultAccount` apontar para uma conta nomeada existente, a promoção preserva essa conta em vez de criar uma nova `accounts.default`.

O comportamento de roteamento permanece consistente:

- Bindings existentes apenas de canal (sem `accountId`) continuam correspondendo à conta padrão.
- `channels add` não cria nem reescreve bindings automaticamente no modo não interativo.
- A configuração interativa pode opcionalmente adicionar bindings com escopo de conta.

Se a sua configuração já estava em um estado misto (contas nomeadas presentes e valores de conta única de nível superior ainda definidos), execute `openclaw doctor --fix` para mover valores com escopo de conta para a conta promovida escolhida para esse canal. A maioria dos canais promove para `accounts.default`; Matrix pode preservar um alvo nomeado/padrão existente em vez disso.

## Login / logout (interativo)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Observações:

- `channels login` oferece suporte a `--verbose`.
- `channels login` / `logout` podem inferir o canal quando apenas um alvo de login compatível está configurado.

## Solução de problemas

- Execute `openclaw status --deep` para uma sondagem ampla.
- Use `openclaw doctor` para correções guiadas.
- `openclaw channels list` imprime `Claude: HTTP 403 ... user:profile` → o snapshot de uso precisa do escopo `user:profile`. Use `--no-usage`, ou forneça uma chave de sessão claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), ou reautentique via Claude CLI.
- `openclaw channels status` usa como fallback resumos somente de configuração quando o gateway está inacessível. Se uma credencial de canal compatível estiver configurada via SecretRef, mas indisponível no caminho atual do comando, ele informará essa conta como configurada com observações degradadas em vez de mostrá-la como não configurada.

## Sondagem de capabilities

Busque dicas de capabilities do provedor (intents/scopes quando disponíveis) mais suporte estático a recursos:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Observações:

- `--channel` é opcional; omita-o para listar todos os canais (incluindo extensões).
- `--account` só é válido com `--channel`.
- `--target` aceita `channel:<id>` ou um id numérico bruto de canal e se aplica apenas ao Discord.
- As sondagens são específicas do provedor: intents do Discord + permissões opcionais de canal; escopos de bot + usuário do Slack; flags de bot + webhook do Telegram; versão do daemon do Signal; app token + roles/scopes do Graph do Microsoft Teams (anotados quando conhecidos). Canais sem sondagens informam `Probe: unavailable`.

## Resolver nomes para IDs

Resolva nomes de canal/usuário para IDs usando o diretório do provedor:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Observações:

- Use `--kind user|group|auto` para forçar o tipo de alvo.
- A resolução prefere correspondências ativas quando várias entradas compartilham o mesmo nome.
- `channels resolve` é somente leitura. Se uma conta selecionada estiver configurada via SecretRef, mas essa credencial estiver indisponível no caminho atual do comando, o comando retorna resultados degradados não resolvidos com observações em vez de abortar toda a execução.
