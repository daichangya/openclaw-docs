---
read_when:
    - Ao compilar ou assinar builds de depuração do Mac
summary: Etapas de assinatura para builds de depuração do macOS gerados por scripts de empacotamento
title: Assinatura no macOS
x-i18n:
    generated_at: "2026-04-05T12:48:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b16d726549cf6dc34dc9c60e14d8041426ebc0699ab59628aca1d094380334a
    source_path: platforms/mac/signing.md
    workflow: 15
---

# assinatura no Mac (builds de depuração)

Este app geralmente é compilado a partir de [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), que agora:

- define um identificador de bundle de depuração estável: `ai.openclaw.mac.debug`
- grava o Info.plist com esse ID de bundle (substitua com `BUNDLE_ID=...`)
- chama [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) para assinar o binário principal e o bundle do app, para que o macOS trate cada recompilação como o mesmo bundle assinado e mantenha as permissões do TCC (notificações, acessibilidade, gravação de tela, microfone, fala). Para permissões estáveis, use uma identidade de assinatura real; ad-hoc é opcional e frágil (consulte [permissões do macOS](/platforms/mac/permissions)).
- usa `CODESIGN_TIMESTAMP=auto` por padrão; isso habilita timestamps confiáveis para assinaturas Developer ID. Defina `CODESIGN_TIMESTAMP=off` para pular a inclusão de timestamp (builds de depuração offline).
- injeta metadados de build no Info.plist: `OpenClawBuildTimestamp` (UTC) e `OpenClawGitCommit` (hash curto) para que o painel Sobre possa mostrar build, git e o canal de depuração/release.
- **O empacotamento usa Node 24 por padrão**: o script executa builds TS e o build da Control UI. O Node 22 LTS, atualmente `22.14+`, continua com suporte por compatibilidade.
- lê `SIGN_IDENTITY` do ambiente. Adicione `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (ou seu certificado Developer ID Application) ao rc do seu shell para sempre assinar com seu certificado. A assinatura ad-hoc exige opt-in explícito via `ALLOW_ADHOC_SIGNING=1` ou `SIGN_IDENTITY="-"` (não recomendado para testar permissões).
- executa uma auditoria de Team ID após a assinatura e falha se qualquer Mach-O dentro do bundle do app estiver assinado por um Team ID diferente. Defina `SKIP_TEAM_ID_CHECK=1` para ignorar.

## Uso

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Observação sobre assinatura ad-hoc

Ao assinar com `SIGN_IDENTITY="-"` (ad-hoc), o script desabilita automaticamente o **Hardened Runtime** (`--options runtime`). Isso é necessário para evitar falhas quando o app tenta carregar frameworks incorporados (como Sparkle) que não compartilham o mesmo Team ID. Assinaturas ad-hoc também quebram a persistência das permissões do TCC; consulte [permissões do macOS](/platforms/mac/permissions) para as etapas de recuperação.

## Metadados de build para Sobre

`package-mac-app.sh` marca o bundle com:

- `OpenClawBuildTimestamp`: ISO8601 UTC no momento do empacotamento
- `OpenClawGitCommit`: hash curto do git (ou `unknown` se não estiver disponível)

A aba Sobre lê essas chaves para mostrar versão, data do build, commit do git e se é um build de depuração (via `#if DEBUG`). Execute o empacotador para atualizar esses valores após alterações no código.

## Por quê

As permissões do TCC estão vinculadas ao identificador do bundle _e_ à assinatura do código. Builds de depuração não assinados com UUIDs variáveis faziam o macOS esquecer as concessões após cada recompilação. Assinar os binários (ad-hoc por padrão) e manter um ID/caminho de bundle fixo (`dist/OpenClaw.app`) preserva as concessões entre builds, correspondendo à abordagem do VibeTunnel.
