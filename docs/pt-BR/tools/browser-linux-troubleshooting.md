---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Corrija problemas de inicialização do CDP do Chrome/Brave/Edge/Chromium para o controle de navegador do OpenClaw no Linux
title: Solução de problemas do navegador
x-i18n:
    generated_at: "2026-04-05T12:54:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ff8e6741558c1b5db86826c5e1cbafe35e35afe5cb2a53296c16653da59e516
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

# Solução de problemas do navegador (Linux)

## Problema: "Falha ao iniciar o Chrome CDP na porta 18800"

O servidor de controle de navegador do OpenClaw não consegue iniciar o Chrome/Brave/Edge/Chromium com o erro:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Causa raiz

No Ubuntu (e em muitas distribuições Linux), a instalação padrão do Chromium é um **pacote snap**. O confinamento AppArmor do snap interfere na forma como o OpenClaw inicia e monitora o processo do navegador.

O comando `apt install chromium` instala um pacote stub que redireciona para snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Isto **não** é um navegador real — é apenas um wrapper.

### Solução 1: instalar o Google Chrome (recomendado)

Instale o pacote oficial `.deb` do Google Chrome, que não é isolado pelo snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

Depois, atualize sua configuração do OpenClaw (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Solução 2: usar o Snap Chromium com o modo somente anexação

Se você precisar usar o snap Chromium, configure o OpenClaw para se anexar a um navegador iniciado manualmente:

1. Atualize a configuração:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Inicie o Chromium manualmente:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Opcionalmente, crie um serviço de usuário systemd para iniciar o Chrome automaticamente:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Habilite com: `systemctl --user enable --now openclaw-browser.service`

### Verificando se o navegador funciona

Verifique o status:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Teste a navegação:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Referência de configuração

| Opção                    | Descrição                                                           | Padrão                                                      |
| ------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | Habilita o controle do navegador                                    | `true`                                                      |
| `browser.executablePath` | Caminho para um binário de navegador baseado em Chromium (Chrome/Brave/Edge/Chromium) | detectado automaticamente (prefere o navegador padrão quando ele é baseado em Chromium) |
| `browser.headless`       | Executa sem GUI                                                     | `false`                                                     |
| `browser.noSandbox`      | Adiciona a flag `--no-sandbox` (necessária para algumas configurações Linux) | `false`                                                     |
| `browser.attachOnly`     | Não inicia o navegador, apenas se anexa a um existente              | `false`                                                     |
| `browser.cdpPort`        | Porta do Chrome DevTools Protocol                                   | `18800`                                                     |

### Problema: "Nenhuma guia do Chrome encontrada para profile=\"user\""

Você está usando um perfil `existing-session` / Chrome MCP. O OpenClaw consegue ver o Chrome local,
mas não há guias abertas disponíveis para anexar.

Opções de correção:

1. **Use o navegador gerenciado:** `openclaw browser start --browser-profile openclaw`
   (ou defina `browser.defaultProfile: "openclaw"`).
2. **Use o Chrome MCP:** certifique-se de que o Chrome local esteja em execução com pelo menos uma guia aberta e depois tente novamente com `--browser-profile user`.

Observações:

- `user` é apenas para o host local. Para servidores Linux, containers ou hosts remotos, prefira perfis CDP.
- `user` / outros perfis `existing-session` mantêm os limites atuais do Chrome MCP:
  ações guiadas por ref, hooks de upload de um único arquivo, sem substituições de timeout de diálogo, sem
  `wait --load networkidle` e sem `responsebody`, exportação para PDF, interceptação de download ou ações em lote.
- Perfis locais `openclaw` atribuem automaticamente `cdpPort`/`cdpUrl`; defina esses valores apenas para CDP remoto.
- Perfis CDP remotos aceitam `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) para descoberta em `/json/version`, ou WS(S) quando o seu serviço de navegador
  fornecer uma URL direta de socket DevTools.
