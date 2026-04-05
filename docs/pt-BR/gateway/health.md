---
read_when:
    - Diagnosticando conectividade de canal ou integridade do gateway
    - Entendendo os comandos e opções da CLI de verificação de integridade
summary: Comandos de verificação de integridade e monitoramento de integridade do gateway
title: Verificações de integridade
x-i18n:
    generated_at: "2026-04-05T12:41:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8824bca34c4d1139f043481c75f0a65d83e54008898c34cf69c6f98fd04e819
    source_path: gateway/health.md
    workflow: 15
---

# Verificações de integridade (CLI)

Guia curto para verificar a conectividade do canal sem precisar adivinhar.

## Verificações rápidas

- `openclaw status` — resumo local: acessibilidade/modo do gateway, dica de atualização, idade da autenticação do canal vinculado, sessões + atividade recente.
- `openclaw status --all` — diagnóstico local completo (somente leitura, colorido, seguro para colar em depuração).
- `openclaw status --deep` — solicita ao gateway em execução uma probe de integridade ao vivo (`health` com `probe:true`), incluindo probes por conta de canal quando compatível.
- `openclaw health` — solicita ao gateway em execução seu snapshot de integridade (somente WS; sem sockets de canal diretos a partir da CLI).
- `openclaw health --verbose` — força uma probe de integridade ao vivo e imprime detalhes da conexão do gateway.
- `openclaw health --json` — saída legível por máquina do snapshot de integridade.
- Envie `/status` como uma mensagem independente no WhatsApp/WebChat para receber uma resposta de status sem invocar o agente.
- Logs: acompanhe `/tmp/openclaw/openclaw-*.log` e filtre por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnósticos profundos

- Credenciais em disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (o `mtime` deve ser recente).
- Armazenamento de sessão: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (o caminho pode ser substituído na configuração). A contagem e os destinatários recentes aparecem em `status`.
- Fluxo de revinculação: `openclaw channels logout && openclaw channels login --verbose` quando códigos de status 409–515 ou `loggedOut` aparecem nos logs. (Observação: o fluxo de login por QR reinicia automaticamente uma vez para status 515 após o pareamento.)

## Configuração do monitor de integridade

- `gateway.channelHealthCheckMinutes`: com que frequência o gateway verifica a integridade do canal. Padrão: `5`. Defina `0` para desativar globalmente reinicializações do monitor de integridade.
- `gateway.channelStaleEventThresholdMinutes`: por quanto tempo um canal conectado pode ficar inativo antes que o monitor de integridade o trate como obsoleto e o reinicie. Padrão: `30`. Mantenha esse valor maior ou igual a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite contínuo de uma hora para reinicializações do monitor de integridade por canal/conta. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: desativa reinicializações do monitor de integridade para um canal específico, mantendo o monitoramento global ativado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição para várias contas que prevalece sobre a configuração em nível de canal.
- Essas substituições por canal se aplicam aos monitores de canal integrados que as expõem hoje: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Quando algo falhar

- `logged out` ou status 409–515 → revincule com `openclaw channels logout` e depois `openclaw channels login`.
- Gateway inacessível → inicie-o: `openclaw gateway --port 18789` (use `--force` se a porta estiver ocupada).
- Nenhuma mensagem de entrada → confirme se o telefone vinculado está online e se o remetente está permitido (`channels.whatsapp.allowFrom`); para chats em grupo, verifique se a allowlist + regras de menção correspondem (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicado `health`

`openclaw health` solicita ao gateway em execução seu snapshot de integridade (sem sockets
de canal diretos a partir da CLI). Por padrão, ele pode retornar um snapshot novo em cache do gateway; o
gateway então atualiza esse cache em segundo plano. `openclaw health --verbose` força
uma probe ao vivo. O comando reporta credenciais vinculadas/idade da autenticação quando disponível,
resumos de probe por canal, resumo do armazenamento de sessão e duração da probe. Ele encerra com
código diferente de zero se o gateway estiver inacessível ou se a probe falhar/expirar.

Opções:

- `--json`: saída JSON legível por máquina
- `--timeout <ms>`: substitui o timeout padrão de 10s da probe
- `--verbose`: força uma probe ao vivo e imprime detalhes da conexão do gateway
- `--debug`: alias para `--verbose`

O snapshot de integridade inclui: `ok` (booleano), `ts` (timestamp), `durationMs` (tempo da probe), status por canal, disponibilidade do agente e resumo do armazenamento de sessão.
