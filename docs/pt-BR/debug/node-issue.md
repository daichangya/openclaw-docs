---
read_when:
    - Depurando scripts de desenvolvimento somente com Node ou falhas no modo watch
    - Investigando falhas do loader tsx/esbuild no OpenClaw
summary: Notas e soluções alternativas para falha "__name is not a function" com Node + tsx
title: Falha com Node + tsx
x-i18n:
    generated_at: "2026-04-05T12:40:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5beab7cdfe7679680f65176234a617293ce495886cfffb151518adfa61dc8dc
    source_path: debug/node-issue.md
    workflow: 15
---

# Falha com Node + tsx "\_\_name is not a function"

## Resumo

Executar o OpenClaw via Node com `tsx` falha na inicialização com:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Isso começou após a troca dos scripts de desenvolvimento de Bun para `tsx` (commit `2871657e`, 2026-01-06). O mesmo caminho de runtime funcionava com Bun.

## Ambiente

- Node: v25.x (observado em v25.3.0)
- tsx: 4.21.0
- SO: macOS (a reprodução também é provável em outras plataformas que executam Node 25)

## Reprodução (somente Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Reprodução mínima no repositório

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Verificação da versão do Node

- Node 25.3.0: falha
- Node 22.22.0 (Homebrew `node@22`): falha
- Node 24: ainda não instalado aqui; precisa de verificação

## Observações / hipótese

- `tsx` usa esbuild para transformar TS/ESM. O `keepNames` do esbuild emite um helper `__name` e envolve definições de função com `__name(...)`.
- A falha indica que `__name` existe, mas não é uma função em runtime, o que implica que o helper está ausente ou foi sobrescrito para esse módulo no caminho do loader do Node 25.
- Problemas semelhantes com o helper `__name` já foram relatados em outros consumidores do esbuild quando o helper está ausente ou é reescrito.

## Histórico da regressão

- `2871657e` (2026-01-06): scripts mudaram de Bun para tsx para tornar Bun opcional.
- Antes disso (caminho com Bun), `openclaw status` e `gateway:watch` funcionavam.

## Soluções alternativas

- Use Bun para scripts de desenvolvimento (reversão temporária atual).
- Use Node + watch do tsc e depois execute a saída compilada:

  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```

- Confirmado localmente: `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status` funciona no Node 25.
- Desative `keepNames` do esbuild no loader TS, se possível (isso evita a inserção do helper `__name`); atualmente o tsx não expõe isso.
- Teste Node LTS (22/24) com `tsx` para verificar se o problema é específico do Node 25.

## Referências

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Próximos passos

- Reproduzir em Node 22/24 para confirmar regressão no Node 25.
- Testar `tsx` nightly ou fixar uma versão anterior se existir uma regressão conhecida.
- Se reproduzir em Node LTS, abrir uma reprodução mínima upstream com o stack trace de `__name`.
