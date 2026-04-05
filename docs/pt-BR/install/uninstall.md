---
read_when:
    - Você quer remover o OpenClaw de uma máquina
    - O serviço do gateway ainda está em execução após a desinstalação
summary: Desinstale completamente o OpenClaw (CLI, serviço, estado, workspace)
title: Desinstalar
x-i18n:
    generated_at: "2026-04-05T12:46:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34c7d3e4ad17333439048dfda739fc27db47e7f9e4212fe17db0e4eb3d3ab258
    source_path: install/uninstall.md
    workflow: 15
---

# Desinstalar

Dois caminhos:

- **Caminho fácil** se `openclaw` ainda estiver instalado.
- **Remoção manual do serviço** se a CLI já foi removida, mas o serviço ainda está em execução.

## Caminho fácil (CLI ainda instalada)

Recomendado: use o desinstalador integrado:

```bash
openclaw uninstall
```

Não interativo (automação / npx):

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Etapas manuais (mesmo resultado):

1. Pare o serviço do gateway:

```bash
openclaw gateway stop
```

2. Desinstale o serviço do gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Exclua estado + configuração:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Se você definiu `OPENCLAW_CONFIG_PATH` para um local personalizado fora do diretório de estado, exclua esse arquivo também.

4. Exclua seu workspace (opcional, remove arquivos do agente):

```bash
rm -rf ~/.openclaw/workspace
```

5. Remova a instalação da CLI (escolha a que você usou):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Se você instalou o app macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Observações:

- Se você usou perfis (`--profile` / `OPENCLAW_PROFILE`), repita a etapa 3 para cada diretório de estado (os padrões são `~/.openclaw-<profile>`).
- No modo remoto, o diretório de estado fica no **host do gateway**, então execute as etapas 1-4 lá também.

## Remoção manual do serviço (CLI não instalada)

Use isto se o serviço do gateway continuar em execução, mas `openclaw` não estiver disponível.

### macOS (launchd)

O label padrão é `ai.openclaw.gateway` (ou `ai.openclaw.<profile>`; o legado `com.openclaw.*` ainda pode existir):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Se você usou um perfil, substitua o label e o nome do plist por `ai.openclaw.<profile>`. Remova quaisquer plists legados `com.openclaw.*` se existirem.

### Linux (unidade de usuário systemd)

O nome padrão da unidade é `openclaw-gateway.service` (ou `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Tarefa Agendada)

O nome padrão da tarefa é `OpenClaw Gateway` (ou `OpenClaw Gateway (<profile>)`).
O script da tarefa fica no seu diretório de estado.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Se você usou um perfil, exclua o nome de tarefa correspondente e `~\.openclaw-<profile>\gateway.cmd`.

## Instalação normal vs checkout do código-fonte

### Instalação normal (`install.sh` / npm / pnpm / bun)

Se você usou `https://openclaw.ai/install.sh` ou `install.ps1`, a CLI foi instalada com `npm install -g openclaw@latest`.
Remova-a com `npm rm -g openclaw` (ou `pnpm remove -g` / `bun remove -g` se instalou dessa forma).

### Checkout do código-fonte (`git clone`)

Se você executa a partir de um checkout do repositório (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Desinstale o serviço do gateway **antes** de excluir o repositório (use o caminho fácil acima ou a remoção manual do serviço).
2. Exclua o diretório do repositório.
3. Remova estado + workspace como mostrado acima.
