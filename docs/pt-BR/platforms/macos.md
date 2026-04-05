---
read_when:
    - Ao implementar recursos do app do macOS
    - Ao alterar o ciclo de vida do gateway ou a ponte de nodes no macOS
summary: App complementar do OpenClaw para macOS (barra de menus + broker do Gateway)
title: App do macOS
x-i18n:
    generated_at: "2026-04-05T12:48:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: bfac937e352ede495f60af47edf3b8e5caa5b692ba0ea01d9fb0de9a44bbc135
    source_path: platforms/macos.md
    workflow: 15
---

# Companion do OpenClaw para macOS (barra de menus + broker do Gateway)

O app do macOS é o **companion da barra de menus** do OpenClaw. Ele controla permissões,
gerencia/se conecta ao Gateway localmente (launchd ou manual) e expõe recursos do macOS
ao agente como um node.

## O que ele faz

- Mostra notificações nativas e status na barra de menus.
- Controla prompts do TCC (Notificações, Acessibilidade, Gravação de Tela, Microfone,
  Reconhecimento de Fala, Automação/AppleScript).
- Executa ou se conecta ao Gateway (local ou remoto).
- Expõe ferramentas exclusivas do macOS (Canvas, Câmera, Gravação de Tela, `system.run`).
- Inicia o serviço local de host de node no modo **remoto** (launchd) e o interrompe no modo **local**.
- Opcionalmente hospeda a **PeekabooBridge** para automação de UI.
- Instala a CLI global (`openclaw`) sob demanda via npm, pnpm ou bun (o app prefere npm, depois pnpm, depois bun; Node continua sendo o runtime recomendado para o Gateway).

## Modo local vs remoto

- **Local** (padrão): o app se conecta a um Gateway local em execução, se houver;
  caso contrário, ele habilita o serviço launchd via `openclaw gateway install`.
- **Remoto**: o app se conecta a um Gateway por SSH/Tailscale e nunca inicia
  um processo local.
  O app inicia o **serviço local de host de node** para que o Gateway remoto possa alcançar este Mac.
  O app não inicia o Gateway como um processo filho.
  A descoberta do Gateway agora prefere nomes MagicDNS do Tailscale a IPs brutos da tailnet,
  para que o app do Mac se recupere com mais confiabilidade quando os IPs da tailnet mudarem.

## Controle do launchd

O app gerencia um LaunchAgent por usuário rotulado como `ai.openclaw.gateway`
(ou `ai.openclaw.<profile>` ao usar `--profile`/`OPENCLAW_PROFILE`; o legado `com.openclaw.*` ainda é descarregado).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Substitua o rótulo por `ai.openclaw.<profile>` ao executar com um perfil nomeado.

Se o LaunchAgent não estiver instalado, habilite-o pelo app ou execute
`openclaw gateway install`.

## Recursos do node (Mac)

O app do macOS se apresenta como um node. Comandos comuns:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Câmera: `camera.snap`, `camera.clip`
- Tela: `screen.record`
- Sistema: `system.run`, `system.notify`

O node informa um mapa `permissions` para que os agentes possam decidir o que é permitido.

Serviço de node + IPC do app:

- Quando o serviço headless de host de node está em execução (modo remoto), ele se conecta ao WS do Gateway como um node.
- `system.run` é executado no app do macOS (contexto de UI/TCC) por um socket Unix local; prompts + saída permanecem no app.

Diagrama (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Aprovações de execução (`system.run`)

`system.run` é controlado por **aprovações de execução** no app do macOS (Configurações → Aprovações de execução).
Segurança + pergunta + allowlist são armazenados localmente no Mac em:

```
~/.openclaw/exec-approvals.json
```

Exemplo:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Observações:

- Entradas de `allowlist` são padrões glob para caminhos de binários resolvidos.
- Texto bruto de comando shell que contém sintaxe de controle ou expansão do shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é tratado como ausência na allowlist e exige aprovação explícita (ou inclusão do binário do shell na allowlist).
- Escolher “Sempre permitir” no prompt adiciona esse comando à allowlist.
- Substituições de ambiente de `system.run` são filtradas (remove `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) e depois mescladas com o ambiente do app.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), as substituições de ambiente no escopo da solicitação são reduzidas a uma pequena allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões de sempre permitir no modo allowlist, wrappers de despacho conhecidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos do executável interno em vez dos caminhos do wrapper. Se o desembrulho não for seguro, nenhuma entrada de allowlist é persistida automaticamente.

## Links profundos

O app registra o esquema de URL `openclaw://` para ações locais.

### `openclaw://agent`

Aciona uma solicitação `agent` do Gateway.
__OC_I18N_900004__
Parâmetros da query:

- `message` (obrigatório)
- `sessionKey` (opcional)
- `thinking` (opcional)
- `deliver` / `to` / `channel` (opcional)
- `timeoutSeconds` (opcional)
- `key` (opcional, chave do modo não assistido)

Segurança:

- Sem `key`, o app solicita confirmação.
- Sem `key`, o app aplica um limite curto de mensagem para o prompt de confirmação e ignora `deliver` / `to` / `channel`.
- Com uma `key` válida, a execução é não assistida (destinada a automações pessoais).

## Fluxo de onboarding (típico)

1. Instale e execute o **OpenClaw.app**.
2. Conclua a checklist de permissões (prompts do TCC).
3. Garanta que o modo **Local** esteja ativo e que o Gateway esteja em execução.
4. Instale a CLI se quiser acesso pelo terminal.

## Localização do diretório de estado (macOS)

Evite colocar seu diretório de estado do OpenClaw no iCloud ou em outras pastas sincronizadas pela nuvem.
Caminhos com sincronização em segundo plano podem adicionar latência e ocasionalmente causar condições de corrida de bloqueio de arquivo/sincronização para
sessões e credenciais.

Prefira um caminho de estado local sem sincronização, como:
__OC_I18N_900005__
Se `openclaw doctor` detectar estado em:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

ele emitirá um aviso e recomendará voltar para um caminho local.

## Workflow de build e desenvolvimento (nativo)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (ou Xcode)
- Empacotar o app: `scripts/package-mac-app.sh`

## Depurar conectividade com o Gateway (CLI do macOS)

Use a CLI de depuração para exercitar o mesmo handshake WebSocket do Gateway e a mesma lógica de descoberta
que o app do macOS usa, sem iniciar o app.
__OC_I18N_900006__
Opções de conexão:

- `--url <ws://host:port>`: substitui a configuração
- `--mode <local|remote>`: resolve a partir da configuração (padrão: configuração ou local)
- `--probe`: força uma sondagem de integridade nova
- `--timeout <ms>`: tempo limite da solicitação (padrão: `15000`)
- `--json`: saída estruturada para comparação

Opções de descoberta:

- `--include-local`: inclui gateways que seriam filtrados como “locais”
- `--timeout <ms>`: janela geral de descoberta (padrão: `2000`)
- `--json`: saída estruturada para comparação

Dica: compare com `openclaw gateway discover --json` para ver se o
pipeline de descoberta do app do macOS (`local.` mais o domínio de longa distância configurado, com
fallbacks de longa distância e Tailscale Serve) difere do
descobrimento baseado em `dns-sd` da CLI em Node.

## Infraestrutura de conexão remota (túneis SSH)

Quando o app do macOS é executado no modo **Remoto**, ele abre um túnel SSH para que componentes locais de UI
possam conversar com um Gateway remoto como se ele estivesse em localhost.

### Túnel de controle (porta WebSocket do Gateway)

- **Objetivo:** verificações de integridade, status, Chat Web, configuração e outras chamadas do plano de controle.
- **Porta local:** a porta do Gateway (padrão `18789`), sempre estável.
- **Porta remota:** a mesma porta do Gateway no host remoto.
- **Comportamento:** sem porta local aleatória; o app reutiliza um túnel íntegro existente
  ou o reinicia se necessário.
- **Formato do SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` com BatchMode +
  ExitOnForwardFailure + opções de keepalive.
- **Relato de IP:** o túnel SSH usa loopback, então o gateway verá o IP do node
  como `127.0.0.1`. Use o transporte **Direct (ws/wss)** se quiser que o IP real do cliente
  apareça (consulte [acesso remoto no macOS](/platforms/mac/remote)).

Para as etapas de configuração, consulte [acesso remoto no macOS](/platforms/mac/remote). Para detalhes
do protocolo, consulte [protocolo do Gateway](/pt-BR/gateway/protocol).

## Documentação relacionada

- [Runbook do Gateway](/pt-BR/gateway)
- [Gateway (macOS)](/pt-BR/platforms/mac/bundled-gateway)
- [permissões do macOS](/platforms/mac/permissions)
- [Canvas](/pt-BR/platforms/mac/canvas)
