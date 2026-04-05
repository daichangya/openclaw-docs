---
read_when:
    - Trabalhando em código ou testes de integração Pi
    - Executando fluxos específicos de lint, typecheck e testes live do Pi
summary: 'Fluxo de trabalho de desenvolvimento para integração Pi: build, teste e validação ao vivo'
title: Fluxo de trabalho de desenvolvimento Pi
x-i18n:
    generated_at: "2026-04-05T12:46:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: f61ebe29ea38ac953a03fe848fe5ac6b6de4bace5e6955b76ae9a7d093eb0cc5
    source_path: pi-dev.md
    workflow: 15
---

# Fluxo de trabalho de desenvolvimento Pi

Este guia resume um fluxo de trabalho sensato para trabalhar na integração pi no OpenClaw.

## Verificação de tipos e linting

- Gate local padrão: `pnpm check`
- Gate de build: `pnpm build` quando a alteração pode afetar a saída de build, empacotamento ou limites de lazy-loading/módulo
- Gate completo de landing para alterações pesadas de Pi: `pnpm check && pnpm test`

## Executando testes de Pi

Execute o conjunto de testes focados em Pi diretamente com Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Para incluir o exercício do provedor live:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Isso cobre as principais suítes unitárias do Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Testes manuais

Fluxo recomendado:

- Execute o gateway em modo de desenvolvimento:
  - `pnpm gateway:dev`
- Acione o agente diretamente:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Use a TUI para depuração interativa:
  - `pnpm tui`

Para comportamento de chamada de ferramenta, peça uma ação `read` ou `exec` para que você possa ver o streaming da ferramenta e o tratamento do payload.

## Reset completo

O estado fica no diretório de estado do OpenClaw. O padrão é `~/.openclaw`. Se `OPENCLAW_STATE_DIR` estiver definido, use esse diretório em vez disso.

Para redefinir tudo:

- `openclaw.json` para configuração
- `agents/<agentId>/agent/auth-profiles.json` para perfis de autenticação de modelo (chaves de API + OAuth)
- `credentials/` para estado de provedor/canal que ainda vive fora do armazenamento de perfis de autenticação
- `agents/<agentId>/sessions/` para histórico de sessão do agente
- `agents/<agentId>/sessions/sessions.json` para o índice de sessão
- `sessions/` se existirem caminhos legados
- `workspace/` se você quiser um workspace em branco

Se você quiser apenas redefinir sessões, exclua `agents/<agentId>/sessions/` para esse agente. Se quiser manter a autenticação, deixe `agents/<agentId>/agent/auth-profiles.json` e qualquer estado de provedor em `credentials/` no lugar.

## Referências

- [Testes](/help/testing)
- [Primeiros passos](/pt-BR/start/getting-started)
