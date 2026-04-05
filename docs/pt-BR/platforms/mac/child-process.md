---
read_when:
    - Integrando o app Mac ao ciclo de vida do gateway
summary: Ciclo de vida do Gateway no macOS (launchd)
title: Ciclo de vida do Gateway
x-i18n:
    generated_at: "2026-04-05T12:47:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73e7eb64ef432c3bfc81b949a5cc2a344c64f2310b794228609aae1da817ec41
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# Ciclo de vida do Gateway no macOS

O app macOS **gerencia o Gateway via launchd** por padrão e não inicia
o Gateway como processo filho. Primeiro, ele tenta se conectar a um
Gateway já em execução na porta configurada; se nenhum estiver acessível,
ele ativa o serviço launchd via a CLI externa `openclaw` (sem runtime embutido). Isso oferece inicialização automática confiável no login e reinício em caso de falhas.

O modo de processo filho (Gateway iniciado diretamente pelo app) **não é usado** hoje.
Se você precisar de um acoplamento mais forte com a UI, execute o Gateway manualmente em um terminal.

## Comportamento padrão (launchd)

- O app instala um LaunchAgent por usuário com o rótulo `ai.openclaw.gateway`
  (ou `ai.openclaw.<profile>` ao usar `--profile`/`OPENCLAW_PROFILE`; o legado `com.openclaw.*` é compatível).
- Quando o modo Local está ativado, o app garante que o LaunchAgent esteja carregado e
  inicia o Gateway se necessário.
- Os logs são gravados no caminho de log do gateway do launchd (visível em Debug Settings).

Comandos comuns:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Substitua o rótulo por `ai.openclaw.<profile>` ao executar um perfil nomeado.

## Builds de desenvolvimento sem assinatura

`scripts/restart-mac.sh --no-sign` é para builds locais rápidas quando você não tem
chaves de assinatura. Para impedir que o launchd aponte para um binário de relay sem assinatura, ele:

- Grava `~/.openclaw/disable-launchagent`.

Execuções assinadas de `scripts/restart-mac.sh` limpam essa substituição se o marcador
estiver presente. Para redefinir manualmente:

```bash
rm ~/.openclaw/disable-launchagent
```

## Modo somente anexar

Para forçar o app macOS a **nunca instalar ou gerenciar o launchd**, inicie-o com
`--attach-only` (ou `--no-launchd`). Isso define `~/.openclaw/disable-launchagent`,
então o app apenas se conecta a um Gateway já em execução. Você pode alternar o mesmo
comportamento em Debug Settings.

## Modo remoto

O modo remoto nunca inicia um Gateway local. O app usa um túnel SSH para o
host remoto e se conecta por esse túnel.

## Por que preferimos launchd

- Inicialização automática no login.
- Semântica integrada de reinício/KeepAlive.
- Logs e supervisão previsíveis.

Se um modo real de processo filho voltar a ser necessário, ele deve ser documentado como um
modo separado e explícito somente para desenvolvimento.
