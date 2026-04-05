---
read_when:
    - Atualizando o OpenClaw
    - Algo quebrou após uma atualização
summary: Atualizando o OpenClaw com segurança (instalação global ou a partir do código-fonte), além da estratégia de rollback
title: Atualização
x-i18n:
    generated_at: "2026-04-05T12:46:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: b40429d38ca851be4fdf8063ed425faf4610a4b5772703e0481c5f1fb588ba58
    source_path: install/updating.md
    workflow: 15
---

# Atualização

Mantenha o OpenClaw atualizado.

## Recomendado: `openclaw update`

A forma mais rápida de atualizar. Ele detecta seu tipo de instalação (npm ou git), busca a versão mais recente, executa `openclaw doctor` e reinicia o gateway.

```bash
openclaw update
```

Para mudar de canal ou direcionar para uma versão específica:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`--channel beta` prefere beta, mas o runtime faz fallback para stable/latest quando
a tag beta está ausente ou é mais antiga que a versão estável mais recente. Use `--tag beta`
se você quiser a dist-tag beta bruta do npm para uma atualização pontual do pacote.

Consulte [Canais de desenvolvimento](/install/development-channels) para a semântica dos canais.

## Alternativa: execute novamente o instalador

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Adicione `--no-onboard` para ignorar o onboarding. Para instalações a partir do código-fonte, passe `--install-method git --no-onboard`.

## Alternativa: npm, pnpm ou bun manualmente

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

## Atualizador automático

O atualizador automático vem desativado por padrão. Ative-o em `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Channel  | Behavior                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Aguarda `stableDelayHours` e depois aplica com jitter determinístico ao longo de `stableJitterHours` (rollout distribuído). |
| `beta`   | Verifica a cada `betaCheckIntervalHours` (padrão: de hora em hora) e aplica imediatamente.                   |
| `dev`    | Sem aplicação automática. Use `openclaw update` manualmente.                                                  |

O gateway também registra uma dica de atualização na inicialização (desative com `update.checkOnStart: false`).

## Após atualizar

<Steps>

### Execute o doctor

```bash
openclaw doctor
```

Migra a configuração, audita políticas de DM e verifica a integridade do gateway. Detalhes: [Doctor](/gateway/doctor)

### Reinicie o gateway

```bash
openclaw gateway restart
```

### Verifique

```bash
openclaw health
```

</Steps>

## Rollback

### Fixar uma versão (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Dica: `npm view openclaw version` mostra a versão publicada atual.

### Fixar um commit (código-fonte)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Para voltar ao mais recente: `git checkout main && git pull`.

## Se você estiver travado

- Execute `openclaw doctor` novamente e leia a saída com atenção.
- Consulte: [Solução de problemas](/gateway/troubleshooting)
- Peça ajuda no Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Visão geral da instalação](/install) — todos os métodos de instalação
- [Doctor](/gateway/doctor) — verificações de integridade após atualizações
- [Migração](/install/migrating) — guias de migração de versões principais
