---
read_when:
    - Você quer jobs agendados e ativações
    - Você está depurando a execução e os logs do cron
summary: Referência de CLI para `openclaw cron` (agendar e executar jobs em segundo plano)
title: cron
x-i18n:
    generated_at: "2026-04-05T12:37:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: f74ec8847835f24b3970f1b260feeb69c7ab6c6ec7e41615cbb73f37f14a8112
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gerencie jobs de cron para o agendador do Gateway.

Relacionado:

- Jobs de cron: [Jobs de cron](/automation/cron-jobs)

Dica: execute `openclaw cron --help` para ver toda a superfície de comandos.

Observação: jobs isolados de `cron add` usam `--announce` como entrega padrão. Use `--no-deliver` para manter
a saída interna. `--deliver` continua disponível como alias obsoleto de `--announce`.

Observação: execuções isoladas controladas pelo cron esperam um resumo em texto simples, e o executor controla
o caminho final de envio. `--no-deliver` mantém a execução interna; ele não devolve
a entrega para a ferramenta de mensagens do agente.

Observação: jobs de execução única (`--at`) são excluídos após sucesso por padrão. Use `--keep-after-run` para mantê-los.

Observação: `--session` oferece suporte a `main`, `isolated`, `current` e `session:<id>`.
Use `current` para vincular à sessão ativa no momento da criação, ou `session:<id>` para
uma chave de sessão persistente explícita.

Observação: para jobs de CLI de execução única, datetimes `--at` sem offset são tratados como UTC, a menos que você também passe
`--tz <iana>`, que interpreta esse horário local de parede no fuso horário informado.

Observação: jobs recorrentes agora usam backoff de retry exponencial após erros consecutivos (30s → 1m → 5m → 15m → 60m), depois retornam ao agendamento normal após a próxima execução bem-sucedida.

Observação: `openclaw cron run` agora retorna assim que a execução manual é enfileirada para execução. Respostas bem-sucedidas incluem `{ ok: true, enqueued: true, runId }`; use `openclaw cron runs --id <job-id>` para acompanhar o resultado final.

Observação: `openclaw cron run <job-id>` força a execução por padrão. Use `--due` para manter o
comportamento antigo de "executar apenas se estiver vencido".

Observação: turnos isolados de cron suprimem respostas obsoletas apenas de confirmação. Se o
primeiro resultado for apenas uma atualização intermediária de status e nenhuma execução descendente de subagente
for responsável pela resposta final, o cron refaz o prompt uma vez para obter o resultado real
antes da entrega.

Observação: se uma execução isolada de cron retornar apenas o token silencioso (`NO_REPLY` /
`no_reply`), o cron suprime tanto a entrega direta de saída quanto o caminho de resumo enfileirado de fallback,
portanto nada é publicado de volta na conversa.

Observação: `cron add|edit --model ...` usa esse modelo permitido selecionado para o job.
Se o modelo não for permitido, o cron avisa e usa o fallback para a seleção de
modelo do agente/padrão do job. Cadeias de fallback configuradas continuam se aplicando, mas uma simples
substituição de modelo sem uma lista explícita de fallback por job não acrescenta mais o modelo principal do
agente como destino extra oculto de retry.

Observação: a precedência de modelo de cron isolado é primeiro a substituição de hook do Gmail, depois
`--model` por job, depois qualquer substituição de modelo armazenada da sessão do cron, e então a seleção normal
do agente/padrão.

Observação: o modo rápido de cron isolado segue a seleção resolvida do modelo ativo. A configuração do modelo
`params.fastMode` se aplica por padrão, mas uma substituição armazenada de `fastMode` da sessão ainda tem precedência
sobre a configuração.

Observação: se uma execução isolada lançar `LiveSessionModelSwitchError`, o cron persiste o
provedor/modelo trocado (e a substituição trocada de perfil de autenticação, quando presente) antes de
tentar novamente. O loop externo de retry é limitado a 2 retries de troca após a tentativa
inicial, e então aborta em vez de entrar em loop infinito.

Observação: notificações de falha usam `delivery.failureDestination` primeiro, depois
`cron.failureDestination` global e, por fim, usam o fallback para o destino principal de
announce do job quando nenhum destino explícito de falha está configurado.

Observação: retenção/poda é controlada na configuração:

- `cron.sessionRetention` (padrão `24h`) poda sessões concluídas de execuções isoladas.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podam `~/.openclaw/cron/runs/<jobId>.jsonl`.

Observação de upgrade: se você tiver jobs de cron antigos de antes do formato atual de entrega/armazenamento, execute
`openclaw doctor --fix`. O Doctor agora normaliza campos legados de cron (`jobId`, `schedule.cron`,
campos de entrega de nível superior, incluindo `threadId` legado, aliases de entrega `provider` no payload) e migra jobs simples de fallback de webhook com
`notify: true` para entrega explícita por webhook quando `cron.webhook` está
configurado.

## Edições comuns

Atualize as configurações de entrega sem alterar a mensagem:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desative a entrega para um job isolado:

```bash
openclaw cron edit <job-id> --no-deliver
```

Habilite contexto de bootstrap leve para um job isolado:

```bash
openclaw cron edit <job-id> --light-context
```

Anuncie em um canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Crie um job isolado com contexto de bootstrap leve:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` se aplica apenas a jobs de turno de agente isolado. Para execuções de cron, o modo leve mantém o contexto de bootstrap vazio em vez de injetar o conjunto completo de bootstrap do workspace.

Observação sobre propriedade da entrega:

- Jobs isolados controlados pelo cron sempre roteiam a entrega final visível para o usuário pelo
  executor do cron (`announce`, `webhook` ou somente interno `none`).
- Se a tarefa mencionar enviar mensagem a algum destinatário externo, o agente deve
  descrever o destino pretendido em seu resultado em vez de tentar enviá-la
  diretamente.

## Comandos administrativos comuns

Execução manual:

```bash
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Redirecionamento de agente/sessão:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Ajustes de entrega:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Observação sobre entrega de falha:

- `delivery.failureDestination` é compatível com jobs isolados.
- Jobs de sessão principal só podem usar `delivery.failureDestination` quando o modo de
  entrega principal é `webhook`.
- Se você não definir nenhum destino de falha e o job já anunciar em um
  canal, as notificações de falha reutilizarão esse mesmo destino de announce.
