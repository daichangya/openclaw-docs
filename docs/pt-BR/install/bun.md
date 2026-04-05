---
read_when:
    - Você quer o loop local de desenvolvimento mais rápido (bun + watch)
    - Você encontrou problemas de instalação/patch/scripts de ciclo de vida com Bun
summary: 'Fluxo de trabalho com Bun (experimental): instalações e pegadinhas em comparação com pnpm'
title: Bun (Experimental)
x-i18n:
    generated_at: "2026-04-05T12:43:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0845567834124bb9206db64df013dc29f3b61a04da4f7e7f0c2823a9ecd67a6
    source_path: install/bun.md
    workflow: 15
---

# Bun (Experimental)

<Warning>
Bun **não é recomendado para o runtime do gateway** (problemas conhecidos com WhatsApp e Telegram). Use Node em produção.
</Warning>

Bun é um runtime local opcional para executar TypeScript diretamente (`bun run ...`, `bun --watch ...`). O gerenciador de pacotes padrão continua sendo `pnpm`, que é totalmente compatível e usado pelas ferramentas de documentação. Bun não pode usar `pnpm-lock.yaml` e irá ignorá-lo.

## Instalação

<Steps>
  <Step title="Instalar dependências">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` estão no gitignore, então não há mudanças desnecessárias no repositório. Para pular totalmente a gravação do lockfile:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Compilar e testar">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Scripts de ciclo de vida

Bun bloqueia scripts de ciclo de vida de dependências, a menos que sejam explicitamente confiáveis. Neste repositório, os scripts comumente bloqueados não são necessários:

- `@whiskeysockets/baileys` `preinstall` -- verifica se a versão major do Node é >= 20 (OpenClaw usa Node 24 por padrão e ainda oferece suporte ao Node 22 LTS, atualmente `22.14+`)
- `protobufjs` `postinstall` -- emite avisos sobre esquemas de versão incompatíveis (sem artefatos de compilação)

Se você encontrar um problema de runtime que exija esses scripts, confie neles explicitamente:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Limitações

Alguns scripts ainda usam pnpm de forma fixa (por exemplo, `docs:build`, `ui:*`, `protocol:check`). Por enquanto, execute esses scripts com pnpm.
