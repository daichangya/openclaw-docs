---
read_when:
    - Você está com problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma verificação rápida de sanidade
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: doctor
x-i18n:
    generated_at: "2026-04-05T12:37:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: d257a9e2797b4b0b50c1020165c8a1cd6a2342381bf9c351645ca37494c881e1
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Verificações de integridade + correções rápidas para o gateway e os canais.

Relacionado:

- Solução de problemas: [Troubleshooting](/gateway/troubleshooting)
- Auditoria de segurança: [Security](/gateway/security)

## Exemplos

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opções

- `--no-workspace-suggestions`: desativa sugestões de memória/busca do workspace
- `--yes`: aceita os padrões sem solicitar confirmação
- `--repair`: aplica os reparos recomendados sem solicitar confirmação
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever configurações de serviço personalizadas quando necessário
- `--non-interactive`: executa sem prompts; apenas migrações seguras
- `--generate-gateway-token`: gera e configura um token do gateway
- `--deep`: examina serviços do sistema em busca de instalações extras do gateway

Observações:

- Prompts interativos (como correções de keychain/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções headless (cron, Telegram, sem terminal) pularão os prompts.
- `--fix` (alias para `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e remove chaves de configuração desconhecidas, listando cada remoção.
- As verificações de integridade do estado agora detectam arquivos de transcrição órfãos no diretório de sessões e podem arquivá-los como `.deleted.<timestamp>` para recuperar espaço com segurança.
- O doctor também examina `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de trabalhos cron e pode regravá-los no local antes que o agendador precise normalizá-los automaticamente em runtime.
- O doctor migra automaticamente a configuração flat legada do Talk (`talk.voiceId`, `talk.modelId` e afins) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não relatam/aplicam mais normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- O doctor inclui uma verificação de prontidão da busca de memória e pode recomendar `openclaw configure --section model` quando credenciais de embedding estiverem ausentes.
- Se o modo sandbox estiver ativado, mas o Docker não estiver disponível, o doctor reportará um aviso de alto sinal com remediação (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho atual do comando, o doctor reportará um aviso somente leitura e não gravará credenciais fallback em texto simples.
- Se a inspeção de SecretRef de canal falhar em um caminho de correção, o doctor continuará e reportará um aviso em vez de encerrar antecipadamente.
- A resolução automática de nome de usuário em Telegram `allowFrom` (`doctor --fix`) exige um token do Telegram resolúvel no caminho atual do comando. Se a inspeção do token não estiver disponível, o doctor reportará um aviso e pulará a resolução automática nessa execução.

## macOS: substituições de env em `launchctl`

Se você executou anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor sobrescreve seu arquivo de configuração e pode causar erros persistentes de “unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
