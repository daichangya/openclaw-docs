---
read_when:
    - Implementando recursos do aplicativo para macOS
    - Alterando o ciclo de vida do Gateway ou a ponte de Node no macOS
summary: Aplicativo complementar do OpenClaw para macOS (barra de menus + corretor do Gateway)
title: Aplicativo para macOS
x-i18n:
    generated_at: "2026-04-18T05:24:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: d637df2f73ced110223c48ea3c934045d782e150a46495f434cf924a6a00baf0
    source_path: platforms/macos.md
    workflow: 15
---

# Companion do OpenClaw para macOS (barra de menus + corretor do Gateway)

O aplicativo para macOS é o **companion da barra de menus** do OpenClaw. Ele controla permissões,
gerencia/anexa ao Gateway localmente (launchd ou manualmente) e expõe recursos do macOS
ao agente como um node.

## O que ele faz

- Exibe notificações nativas e status na barra de menus.
- Controla os prompts do TCC (Notificações, Acessibilidade, Gravação de Tela, Microfone,
  Reconhecimento de Fala, Automação/AppleScript).
- Executa ou se conecta ao Gateway (local ou remoto).
- Expõe ferramentas exclusivas do macOS (Canvas, Câmera, Gravação de Tela, `system.run`).
- Inicia o serviço local de host de node no modo **remoto** (launchd) e o interrompe no modo **local**.
- Opcionalmente hospeda o **PeekabooBridge** para automação de UI.
- Instala a CLI global (`openclaw`) sob demanda via npm, pnpm ou bun (o app prefere npm, depois pnpm, depois bun; Node continua sendo o runtime recomendado do Gateway).

## Modo local vs. remoto

- **Local** (padrão): o app se anexa a um Gateway local em execução, se presente;
  caso contrário, ele ativa o serviço launchd via `openclaw gateway install`.
- **Remoto**: o app se conecta a um Gateway via SSH/Tailscale e nunca inicia
  um processo local.
  O app inicia o **serviço de host de node** local para que o Gateway remoto possa alcançar este Mac.
  O app não inicia o Gateway como processo filho.
  A descoberta do Gateway agora prefere nomes Tailscale MagicDNS em vez de IPs brutos da tailnet,
  então o app para Mac se recupera com mais confiabilidade quando os IPs da tailnet mudam.

## Controle do launchd

O app gerencia um LaunchAgent por usuário rotulado como `ai.openclaw.gateway`
(ou `ai.openclaw.<profile>` ao usar `--profile`/`OPENCLAW_PROFILE`; o legado `com.openclaw.*` ainda é descarregado).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Substitua o rótulo por `ai.openclaw.<profile>` ao executar um perfil nomeado.

Se o LaunchAgent não estiver instalado, ative-o pelo app ou execute
`openclaw gateway install`.

## Recursos do node (mac)

O app para macOS se apresenta como um node. Comandos comuns:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Câmera: `camera.snap`, `camera.clip`
- Tela: `screen.snapshot`, `screen.record`
- Sistema: `system.run`, `system.notify`

O node relata um mapa `permissions` para que agentes possam decidir o que é permitido.

Serviço de node + IPC do app:

- Quando o serviço headless de host de node está em execução (modo remoto), ele se conecta ao Gateway WS como um node.
- `system.run` é executado no app para macOS (contexto UI/TCC) por um socket Unix local; prompts + saída permanecem no app.

Diagrama (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Aprovações de execução (`system.run`)

`system.run` é controlado por **Aprovações de execução** no app para macOS (Ajustes → Aprovações de execução).
Segurança + perguntar + allowlist são armazenados localmente no Mac em:

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

- Entradas de `allowlist` são padrões glob para caminhos resolvidos de binários.
- Texto bruto de comando shell que contém sintaxe de controle ou expansão do shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é tratado como ausência na allowlist e exige aprovação explícita (ou inclusão do binário do shell na allowlist).
- Escolher “Sempre permitir” no prompt adiciona esse comando à allowlist.
- As substituições de ambiente de `system.run` são filtradas (remove `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) e então mescladas com o ambiente do app.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), as substituições de ambiente com escopo de solicitação são reduzidas a uma pequena allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões de sempre permitir no modo allowlist, wrappers de despacho conhecidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem os caminhos internos do executável em vez dos caminhos do wrapper. Se o desembrulho não for seguro, nenhuma entrada de allowlist será persistida automaticamente.

## Links profundos

O app registra o esquema de URL `openclaw://` para ações locais.

### `openclaw://agent`

Dispara uma solicitação `agent` do Gateway.
__OC_I18N_900004__
Parâmetros de consulta:

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

1. Instale e abra o **OpenClaw.app**.
2. Conclua a checklist de permissões (prompts do TCC).
3. Garanta que o modo **Local** esteja ativo e que o Gateway esteja em execução.
4. Instale a CLI se quiser acesso pelo terminal.

## Posicionamento do diretório de estado (macOS)

Evite colocar seu diretório de estado do OpenClaw no iCloud ou em outras pastas sincronizadas com a nuvem.
Caminhos com sincronização podem adicionar latência e ocasionalmente causar condições de corrida de bloqueio de arquivo/sincronização para
sessões e credenciais.

Prefira um caminho de estado local não sincronizado, como:
__OC_I18N_900005__
Se `openclaw doctor` detectar estado em:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

ele emitirá um aviso e recomendará voltar para um caminho local.

## Fluxo de build e desenvolvimento (nativo)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (ou Xcode)
- Empacotar app: `scripts/package-mac-app.sh`

## Depurar conectividade do Gateway (CLI do macOS)

Use a CLI de depuração para exercitar o mesmo handshake e a mesma lógica de descoberta do Gateway WebSocket
que o app para macOS usa, sem abrir o app.
__OC_I18N_900006__
Opções de conexão:

- `--url <ws://host:port>`: substitui a configuração
- `--mode <local|remote>`: resolve a partir da configuração (padrão: configuração ou local)
- `--probe`: força uma nova sondagem de saúde
- `--timeout <ms>`: tempo limite da solicitação (padrão: `15000`)
- `--json`: saída estruturada para diff

Opções de descoberta:

- `--include-local`: inclui gateways que seriam filtrados como “locais”
- `--timeout <ms>`: janela total de descoberta (padrão: `2000`)
- `--json`: saída estruturada para diff

Dica: compare com `openclaw gateway discover --json` para ver se o
pipeline de descoberta do app para macOS (`local.` mais o domínio de área ampla configurado, com
fallbacks de área ampla e Tailscale Serve) difere da
descoberta baseada em `dns-sd` da CLI do Node.

## Infraestrutura da conexão remota (túneis SSH)

Quando o app para macOS é executado no modo **Remoto**, ele abre um túnel SSH para que componentes locais da UI
possam se comunicar com um Gateway remoto como se ele estivesse no localhost.

### Túnel de controle (porta WebSocket do Gateway)

- **Finalidade:** verificações de integridade, status, Web Chat, configuração e outras chamadas do plano de controle.
- **Porta local:** a porta do Gateway (padrão `18789`), sempre estável.
- **Porta remota:** a mesma porta do Gateway no host remoto.
- **Comportamento:** sem porta local aleatória; o app reutiliza um túnel íntegro existente
  ou o reinicia, se necessário.
- **Formato do SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` com opções BatchMode +
  ExitOnForwardFailure + keepalive.
- **Relato de IP:** o túnel SSH usa loopback, então o gateway verá o
  IP do node como `127.0.0.1`. Use o transporte **Direct (ws/wss)** se quiser que o IP real do cliente
  apareça (veja [acesso remoto no macOS](/pt-BR/platforms/mac/remote)).

Para etapas de configuração, veja [acesso remoto no macOS](/pt-BR/platforms/mac/remote). Para detalhes do protocolo,
veja [protocolo do Gateway](/pt-BR/gateway/protocol).

## Documentação relacionada

- [Runbook do Gateway](/pt-BR/gateway)
- [Gateway (macOS)](/pt-BR/platforms/mac/bundled-gateway)
- [Permissões do macOS](/pt-BR/platforms/mac/permissions)
- [Canvas](/pt-BR/platforms/mac/canvas)
