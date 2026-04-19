---
read_when:
    - Depuração de scripts de desenvolvimento somente com Node ou falhas no modo de observação
    - Investigando falhas do carregador tsx/esbuild no OpenClaw
summary: Notas sobre falha do Node + tsx com "__name is not a function" e soluções alternativas
title: Falha do Node + tsx
x-i18n:
    generated_at: "2026-04-19T01:11:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca45c795c356ada8f81e75b394ec82743d3d1bf1bbe83a24ec6699946b920f01
    source_path: debug/node-issue.md
    workflow: 15
---

# Falha do Node + tsx com "\_\_name is not a function"

## Resumo

Executar o OpenClaw via Node com `tsx` falha na inicialização com:

```bash
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Isso começou após a troca dos scripts de desenvolvimento de Bun para `tsx` (commit `2871657e`, 2026-01-06). O mesmo caminho de execução funcionava com Bun.

## Ambiente

- Node: v25.x (observado em v25.3.0)
- tsx: 4.21.0
- SO: macOS (a reprodução também é provável em outras plataformas que executam Node 25)

## Reprodução (somente Node)

```bash
# na raiz do repositório
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

## Notas / hipótese

- `tsx` usa esbuild para transformar TS/ESM. O `keepNames` do esbuild emite um helper `__name` e envolve definições de função com `__name(...)`.
- A falha indica que `__name` existe, mas não é uma função em tempo de execução, o que implica que o helper está ausente ou foi sobrescrito para esse módulo no caminho do carregador do Node 25.
- Problemas semelhantes com o helper `__name` já foram relatados em outros consumidores do esbuild quando o helper está ausente ou é reescrito.

## Histórico da regressão

- `2871657e` (2026-01-06): os scripts foram alterados de Bun para tsx para tornar o Bun opcional.
- Antes disso (caminho com Bun), `openclaw status` e `gateway:watch` funcionavam.

## Soluções alternativas

- Usar Bun para scripts de desenvolvimento (reversão temporária atual).
- Usar `tsgo` para a verificação de tipos do repositório e, em seguida, executar a saída compilada:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Nota histórica: `tsc` foi usado aqui durante a depuração desse problema de Node/tsx, mas as faixas de verificação de tipos do repositório agora usam `tsgo`.
- Desabilitar `keepNames` do esbuild no carregador TS, se possível (isso evita a inserção do helper `__name`); o tsx atualmente não expõe isso.
- Testar Node LTS (22/24) com `tsx` para ver se o problema é específico do Node 25.

## Referências

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Próximos passos

- Reproduzir no Node 22/24 para confirmar uma regressão do Node 25.
- Testar o `tsx` nightly ou fixar em uma versão anterior, se houver uma regressão conhecida.
- Se também reproduzir no Node LTS, abrir um relatório upstream com uma reprodução mínima e o stack trace de `__name`.
