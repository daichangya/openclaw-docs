---
read_when:
    - Executando ou solucionando problemas de configurações remotas de gateway
summary: Acesso remoto usando túneis SSH (Gateway WS) e tailnets
title: Acesso remoto
x-i18n:
    generated_at: "2026-04-05T12:42:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8596fa2a7fd44117dfe92b70c9d8f28c0e16d7987adf0d0769a9eff71d5bc081
    source_path: gateway/remote.md
    workflow: 15
---

# Acesso remoto (SSH, túneis e tailnets)

Este repositório oferece suporte a “remoto via SSH” mantendo um único Gateway (o mestre) em execução em um host dedicado (desktop/servidor) e conectando clientes a ele.

- Para **operadores (você / o app do macOS)**: o tunelamento SSH é o fallback universal.
- Para **nós (iOS/Android e dispositivos futuros)**: conecte-se ao **WebSocket** do Gateway (LAN/tailnet ou túnel SSH, conforme necessário).

## A ideia central

- O WebSocket do Gateway faz bind em **loopback** na porta configurada (o padrão é 18789).
- Para uso remoto, você encaminha essa porta loopback por SSH (ou usa uma tailnet/VPN e depende menos de túneis).

## Configurações comuns de VPN/tailnet (onde o agente fica)

Pense no **host do Gateway** como “onde o agente vive”. Ele é o dono das sessões, perfis de autenticação, canais e estado.
Seu laptop/desktop (e os nós) se conectam a esse host.

### 1) Gateway sempre ativo na sua tailnet (VPS ou servidor doméstico)

Execute o Gateway em um host persistente e acesse-o via **Tailscale** ou SSH.

- **Melhor UX:** mantenha `gateway.bind: "loopback"` e use **Tailscale Serve** para a Control UI.
- **Fallback:** mantenha loopback + túnel SSH a partir de qualquer máquina que precise de acesso.
- **Exemplos:** [exe.dev](/install/exe-dev) (VM fácil) ou [Hetzner](/install/hetzner) (VPS de produção).

Isso é ideal quando seu laptop entra em suspensão com frequência, mas você quer o agente sempre ativo.

### 2) O desktop de casa executa o Gateway, o laptop é o controle remoto

O laptop **não** executa o agente. Ele se conecta remotamente:

- Use o modo **Remote over SSH** do app do macOS (Configurações → Geral → “Onde o OpenClaw é executado”).
- O app abre e gerencia o túnel, então WebChat + verificações de integridade “simplesmente funcionam”.

Runbook: [acesso remoto no macOS](/platforms/mac/remote).

### 3) O laptop executa o Gateway, acesso remoto a partir de outras máquinas

Mantenha o Gateway local, mas exponha-o com segurança:

- Túnel SSH para o laptop a partir de outras máquinas, ou
- Use Tailscale Serve para a Control UI e mantenha o Gateway apenas em loopback.

Guia: [Tailscale](/gateway/tailscale) e [visão geral da Web](/web).

## Fluxo de comando (o que é executado onde)

Um serviço de gateway controla o estado + canais. Os nós são periféricos.

Exemplo de fluxo (Telegram → nó):

- A mensagem do Telegram chega ao **Gateway**.
- O Gateway executa o **agente** e decide se deve chamar uma ferramenta de nó.
- O Gateway chama o **nó** pelo WebSocket do Gateway (`node.*` RPC).
- O nó retorna o resultado; o Gateway responde de volta no Telegram.

Observações:

- **Nós não executam o serviço do gateway.** Apenas um gateway deve ser executado por host, a menos que você esteja intencionalmente executando perfis isolados (consulte [Multiple gateways](/gateway/multiple-gateways)).
- O “modo nó” do app do macOS é apenas um cliente de nó sobre o WebSocket do Gateway.

## Túnel SSH (CLI + ferramentas)

Crie um túnel local para o WS do Gateway remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Com o túnel ativo:

- `openclaw health` e `openclaw status --deep` agora alcançam o gateway remoto via `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` e `openclaw gateway call` também podem apontar para a URL encaminhada via `--url`, quando necessário.

Observação: substitua `18789` pela sua `gateway.port` configurada (ou `--port`/`OPENCLAW_GATEWAY_PORT`).
Observação: quando você passa `--url`, a CLI não usa fallback para credenciais de configuração ou ambiente.
Inclua `--token` ou `--password` explicitamente. A ausência de credenciais explícitas é um erro.

## Padrões remotos da CLI

Você pode persistir um destino remoto para que os comandos da CLI o usem por padrão:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Quando o gateway estiver somente em loopback, mantenha a URL como `ws://127.0.0.1:18789` e abra primeiro o túnel SSH.

## Precedência de credenciais

A resolução de credenciais do Gateway segue um contrato compartilhado entre caminhos de call/probe/status e o monitoramento de aprovação de exec no Discord. O host do nó usa o mesmo contrato base com uma exceção no modo local (ele intencionalmente ignora `gateway.remote.*`):

- Credenciais explícitas (`--token`, `--password` ou a ferramenta `gatewayToken`) sempre vencem em caminhos de call que aceitam autenticação explícita.
- Segurança em substituições de URL:
  - Substituições de URL da CLI (`--url`) nunca reutilizam credenciais implícitas de config/env.
  - Substituições de URL por env (`OPENCLAW_GATEWAY_URL`) podem usar apenas credenciais de env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Padrões do modo local:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (o fallback remoto se aplica apenas quando a entrada local de token de autenticação não está definida)
  - senha: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (o fallback remoto se aplica apenas quando a entrada local de senha de autenticação não está definida)
- Padrões do modo remoto:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - senha: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Exceção do host do nó no modo local: `gateway.remote.token` / `gateway.remote.password` são ignorados.
- As verificações de token em probe/status remotos são estritas por padrão: usam apenas `gateway.remote.token` (sem fallback para token local) ao apontar para o modo remoto.
- Substituições de env do Gateway usam apenas `OPENCLAW_GATEWAY_*`.

## UI de chat via SSH

O WebChat não usa mais uma porta HTTP separada. A UI de chat SwiftUI se conecta diretamente ao WebSocket do Gateway.

- Encaminhe `18789` por SSH (veja acima), depois conecte os clientes a `ws://127.0.0.1:18789`.
- No macOS, prefira o modo “Remote over SSH” do app, que gerencia o túnel automaticamente.

## App do macOS "Remote over SSH"

O app da barra de menus do macOS pode conduzir a mesma configuração de ponta a ponta (verificações de status remotas, WebChat e encaminhamento de Voice Wake).

Runbook: [acesso remoto no macOS](/platforms/mac/remote).

## Regras de segurança (remoto/VPN)

Versão curta: **mantenha o Gateway apenas em loopback** a menos que você tenha certeza de que precisa fazer bind.

- **Loopback + SSH/Tailscale Serve** é o padrão mais seguro (sem exposição pública).
- `ws://` em texto simples é apenas loopback por padrão. Para redes privadas confiáveis,
  defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` no processo cliente como break-glass.
- **Binds fora de loopback** (`lan`/`tailnet`/`custom`, ou `auto` quando loopback não está disponível) devem usar autenticação do gateway: token, senha ou um proxy reverso com reconhecimento de identidade com `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` são fontes de credenciais do cliente. Eles **não** configuram autenticação do servidor por si só.
- Caminhos de chamada locais podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` não está definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não resolvido, a resolução falha em modo fechado (sem mascaramento por fallback remoto).
- `gateway.remote.tlsFingerprint` fixa o certificado TLS remoto ao usar `wss://`.
- **Tailscale Serve** pode autenticar tráfego da Control UI/WebSocket via cabeçalhos de identidade
  quando `gateway.auth.allowTailscale: true`; endpoints da API HTTP não
  usam essa autenticação por cabeçalho do Tailscale e, em vez disso, seguem o modo normal de
  autenticação HTTP do gateway. Esse fluxo sem token presume que o host do gateway é confiável. Defina como
  `false` se você quiser autenticação por segredo compartilhado em todos os lugares.
- A autenticação **trusted-proxy** é apenas para configurações fora de loopback com proxy reverso e reconhecimento de identidade.
  Proxies reversos loopback no mesmo host não satisfazem `gateway.auth.mode: "trusted-proxy"`.
- Trate o controle pelo navegador como acesso de operador: somente tailnet + pairing deliberado de nós.

Análise detalhada: [Security](/gateway/security).

### macOS: túnel SSH persistente via LaunchAgent

Para clientes macOS conectando-se a um gateway remoto, a configuração persistente mais fácil usa uma entrada SSH `LocalForward` mais um LaunchAgent para manter o túnel ativo após reinicializações e falhas.

#### Etapa 1: adicionar configuração SSH

Edite `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Substitua `<REMOTE_IP>` e `<REMOTE_USER>` pelos seus valores.

#### Etapa 2: copiar a chave SSH (uma vez)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Etapa 3: configurar o token do gateway

Armazene o token na configuração para que ele persista entre reinicializações:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Etapa 4: criar o LaunchAgent

Salve isto como `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Etapa 5: carregar o LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

O túnel será iniciado automaticamente no login, reiniciado em caso de falha e manterá a porta encaminhada ativa.

Observação: se você tiver um LaunchAgent `com.openclaw.ssh-tunnel` restante de uma configuração antiga, descarregue-o e exclua-o.

#### Solução de problemas

Verifique se o túnel está em execução:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Reinicie o túnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Pare o túnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entrada de configuração                | O que ela faz                                                |
| -------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`   | Encaminha a porta local 18789 para a porta remota 18789      |
| `ssh -N`                               | SSH sem executar comandos remotos (apenas encaminhamento de porta) |
| `KeepAlive`                            | Reinicia automaticamente o túnel se ele falhar               |
| `RunAtLoad`                            | Inicia o túnel quando o LaunchAgent é carregado no login     |
