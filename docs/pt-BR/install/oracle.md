---
read_when:
    - Configurando o OpenClaw na Oracle Cloud
    - Procurando hospedagem VPS gratuita para o OpenClaw
    - Quer o OpenClaw 24/7 em um servidor pequeno
summary: Hospede o OpenClaw na camada ARM Always Free da Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-05T12:45:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6915f8c428cfcbc215ba6547273df6e7b93212af6590827a3853f15617ba245e
    source_path: install/oracle.md
    workflow: 15
---

# Oracle Cloud

Execute um Gateway OpenClaw persistente na camada ARM **Always Free** da Oracle Cloud (até 4 OCPU, 24 GB de RAM e 200 GB de armazenamento) sem custo.

## Pré-requisitos

- Conta Oracle Cloud ([cadastro](https://www.oracle.com/cloud/free/)) -- consulte o [guia de cadastro da comunidade](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) se tiver problemas
- Conta Tailscale (gratuita em [tailscale.com](https://tailscale.com))
- Um par de chaves SSH
- Cerca de 30 minutos

## Configuração

<Steps>
  <Step title="Criar uma instância OCI">
    1. Entre no [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Vá para **Compute > Instances > Create Instance**.
    3. Configure:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (ou até 4)
       - **Memory:** 12 GB (ou até 24 GB)
       - **Boot volume:** 50 GB (até 200 GB gratuitos)
       - **SSH key:** adicione sua chave pública
    4. Clique em **Create** e anote o endereço IP público.

    <Tip>
    Se a criação da instância falhar com "Out of capacity", tente outro availability domain ou tente novamente mais tarde. A capacidade da camada gratuita é limitada.
    </Tip>

  </Step>

  <Step title="Conectar e atualizar o sistema">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` é necessário para compilação ARM de algumas dependências.

  </Step>

  <Step title="Configurar usuário e hostname">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Ativar linger mantém os serviços do usuário em execução após o logout.

  </Step>

  <Step title="Instalar o Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    A partir de agora, conecte-se via Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Instalar o OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Quando aparecer a pergunta "How do you want to hatch your bot?", selecione **Do this later**.

  </Step>

  <Step title="Configurar o gateway">
    Use autenticação por token com Tailscale Serve para acesso remoto seguro.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` aqui serve apenas para o tratamento do IP encaminhado/cliente local do proxy local do Tailscale Serve. Isso **não** é `gateway.auth.mode: "trusted-proxy"`. Rotas do visualizador de diff mantêm comportamento fail-closed nessa configuração: requisições brutas do visualizador para `127.0.0.1` sem cabeçalhos de proxy encaminhados podem retornar `Diff not found`. Use `mode=file` / `mode=both` para anexos ou ative intencionalmente visualizadores remotos e defina `plugins.entries.diffs.config.viewerBaseUrl` (ou passe um `baseUrl` de proxy) se precisar de links compartilháveis do visualizador.

  </Step>

  <Step title="Restringir a segurança da VCN">
    Bloqueie todo o tráfego, exceto Tailscale, na borda da rede:

    1. Vá para **Networking > Virtual Cloud Networks** no OCI Console.
    2. Clique na sua VCN e depois em **Security Lists > Default Security List**.
    3. **Remova** todas as regras de entrada, exceto `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Mantenha as regras padrão de saída (permitir todo o tráfego de saída).

    Isso bloqueia SSH na porta 22, HTTP, HTTPS e todo o resto na borda da rede. A partir desse ponto, você só poderá se conectar via Tailscale.

  </Step>

  <Step title="Verificar">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Acesse a Control UI de qualquer dispositivo na sua tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Substitua `<tailnet-name>` pelo nome da sua tailnet (visível em `tailscale status`).

  </Step>
</Steps>

## Fallback: túnel SSH

Se o Tailscale Serve não estiver funcionando, use um túnel SSH a partir da sua máquina local:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Depois abra `http://localhost:18789`.

## Solução de problemas

**A criação da instância falha ("Out of capacity")** -- Instâncias ARM da camada gratuita são populares. Tente outro availability domain ou tente novamente em horários de menor pico.

**O Tailscale não conecta** -- Execute `sudo tailscale up --ssh --hostname=openclaw --reset` para autenticar novamente.

**O gateway não inicia** -- Execute `openclaw doctor --non-interactive` e verifique os logs com `journalctl --user -u openclaw-gateway.service -n 50`.

**Problemas com binários ARM** -- A maioria dos pacotes npm funciona em ARM64. Para binários nativos, procure releases `linux-arm64` ou `aarch64`. Verifique a arquitetura com `uname -m`.

## Próximos passos

- [Channels](/channels) -- conecte Telegram, WhatsApp, Discord e mais
- [Gateway configuration](/gateway/configuration) -- todas as opções de configuração
- [Updating](/install/updating) -- mantenha o OpenClaw atualizado
