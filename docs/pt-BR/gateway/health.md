---
read_when:
    - Diagnosticando a conectividade do canal ou a integridade do Gateway
    - Entendendo os comandos e opções de CLI de verificação de integridade
summary: Comandos de verificação de integridade e monitoramento da integridade do Gateway
title: Verificações de integridade
x-i18n:
    generated_at: "2026-04-23T05:39:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5ddcbe6fa913c5ba889f78cb417124c96b562cf8939410b1d6f66042dfb51a9f
    source_path: gateway/health.md
    workflow: 15
---

# Verificações de integridade (CLI)

Guia curto para verificar a conectividade do canal sem adivinhar.

## Verificações rápidas

- `openclaw status` — resumo local: acessibilidade/modo do Gateway, indicação de atualização, idade da autenticação do canal vinculado, sessões + atividade recente.
- `openclaw status --all` — diagnóstico local completo (somente leitura, com cores, seguro para colar em depuração).
- `openclaw status --deep` — solicita ao Gateway em execução uma sonda de integridade ao vivo (`health` com `probe:true`), incluindo sondas de canal por conta quando houver suporte.
- `openclaw health` — solicita ao Gateway em execução seu snapshot de integridade (somente WS; sem sockets diretos de canal a partir da CLI).
- `openclaw health --verbose` — força uma sonda de integridade ao vivo e imprime os detalhes da conexão do Gateway.
- `openclaw health --json` — saída do snapshot de integridade legível por máquina.
- Envie `/status` como uma mensagem independente no WhatsApp/WebChat para obter uma resposta de status sem invocar o agente.
- Logs: acompanhe `/tmp/openclaw/openclaw-*.log` e filtre por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnósticos aprofundados

- Credenciais em disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (`mtime` deve ser recente).
- Armazenamento de sessões: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (o caminho pode ser substituído na configuração). A contagem e os destinatários recentes são exibidos em `status`.
- Fluxo de revinculação: `openclaw channels logout && openclaw channels login --verbose` quando códigos de status 409–515 ou `loggedOut` aparecerem nos logs. (Observação: o fluxo de login por QR reinicia automaticamente uma vez para o status 515 após o pareamento.)
- Os diagnósticos são ativados por padrão. O Gateway registra fatos operacionais, a menos que `diagnostics.enabled: false` esteja definido. Eventos de memória registram contagens de bytes de RSS/heap, pressão de limite e pressão de crescimento. Eventos de payload superdimensionado registram o que foi rejeitado, truncado ou fragmentado, além de tamanhos e limites quando disponíveis. Eles não registram o texto da mensagem, conteúdo de anexos, corpo de Webhook, corpo bruto de solicitação ou resposta, tokens, cookies ou valores secretos. O mesmo Heartbeat inicia o gravador de estabilidade limitado, que está disponível por meio de `openclaw gateway stability` ou do RPC do Gateway `diagnostics.stability`. Encerramentos fatais do Gateway, timeouts de desligamento e falhas de inicialização em reinicializações persistem o snapshot mais recente do gravador em `~/.openclaw/logs/stability/` quando existem eventos; inspecione o pacote salvo mais recente com `openclaw gateway stability --bundle latest`.
- Para relatórios de bug, execute `openclaw gateway diagnostics export` e anexe o zip gerado. A exportação combina um resumo em Markdown, o pacote de estabilidade mais recente, metadados de logs sanitizados, snapshots sanitizados de status/integridade do Gateway e o formato da configuração. Ela foi feita para compartilhamento: texto de chat, corpos de Webhook, saídas de ferramentas, credenciais, cookies, identificadores de conta/mensagem e valores secretos são omitidos ou redigidos.

## Configuração do monitor de integridade

- `gateway.channelHealthCheckMinutes`: com que frequência o Gateway verifica a integridade do canal. Padrão: `5`. Defina `0` para desativar globalmente as reinicializações do monitor de integridade.
- `gateway.channelStaleEventThresholdMinutes`: por quanto tempo um canal conectado pode ficar inativo antes que o monitor de integridade o trate como obsoleto e o reinicie. Padrão: `30`. Mantenha isso maior ou igual a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite móvel de uma hora para reinicializações do monitor de integridade por canal/conta. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: desativa as reinicializações do monitor de integridade para um canal específico, mantendo o monitoramento global ativado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição para múltiplas contas que prevalece sobre a configuração no nível do canal.
- Essas substituições por canal se aplicam aos monitores de canal integrados que as expõem atualmente: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Quando algo falha

- `logged out` ou status 409–515 → revincule com `openclaw channels logout` e depois `openclaw channels login`.
- Gateway inacessível → inicie-o: `openclaw gateway --port 18789` (use `--force` se a porta estiver ocupada).
- Nenhuma mensagem recebida → confirme que o telefone vinculado está online e que o remetente é permitido (`channels.whatsapp.allowFrom`); para chats em grupo, verifique se a allowlist + regras de menção correspondem (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicado `health`

`openclaw health` solicita ao Gateway em execução seu snapshot de integridade (sem sockets diretos de canal
a partir da CLI). Por padrão, ele pode retornar um snapshot em cache recente do Gateway; o
Gateway então atualiza esse cache em segundo plano. `openclaw health --verbose` força
uma sonda ao vivo. O comando informa credenciais vinculadas/idade da autenticação quando disponível,
resumos de sonda por canal, resumo do armazenamento de sessões e a duração da sonda. Ele encerra
com código diferente de zero se o Gateway estiver inacessível ou se a sonda falhar/expirar.

Opções:

- `--json`: saída JSON legível por máquina
- `--timeout <ms>`: substitui o timeout padrão de 10s da sonda
- `--verbose`: força uma sonda ao vivo e imprime os detalhes da conexão do Gateway
- `--debug`: alias para `--verbose`

O snapshot de integridade inclui: `ok` (booleano), `ts` (timestamp), `durationMs` (tempo da sonda), status por canal, disponibilidade do agente e resumo do armazenamento de sessões.
