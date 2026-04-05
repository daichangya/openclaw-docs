---
read_when:
    - Configurando o OpenClaw na DigitalOcean
    - Procurando uma VPS paga simples para o OpenClaw
summary: Hospede o OpenClaw em uma Droplet da DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-05T12:44:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b161db8ec643d8313938a2453ce6242fc1ee8ea1fd2069916276f1aadeb71f1
    source_path: install/digitalocean.md
    workflow: 15
---

# DigitalOcean

Execute um Gateway OpenClaw persistente em uma Droplet da DigitalOcean.

## Pré-requisitos

- Conta da DigitalOcean ([cadastro](https://cloud.digitalocean.com/registrations/new))
- Par de chaves SSH (ou disposição para usar autenticação por senha)
- Cerca de 20 minutos

## Configuração

<Steps>
  <Step title="Crie uma Droplet">
    <Warning>
    Use uma imagem base limpa (Ubuntu 24.04 LTS). Evite imagens de Marketplace 1-click de terceiros, a menos que você tenha revisado seus scripts de inicialização e padrões de firewall.
    </Warning>

    1. Faça login em [DigitalOcean](https://cloud.digitalocean.com/).
    2. Clique em **Create > Droplets**.
    3. Escolha:
       - **Região:** a mais próxima de você
       - **Imagem:** Ubuntu 24.04 LTS
       - **Tamanho:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Autenticação:** chave SSH (recomendado) ou senha
    4. Clique em **Create Droplet** e anote o endereço IP.

  </Step>

  <Step title="Conecte-se e instale">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Execute o onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    O assistente orienta você por autenticação de modelo, configuração de canal, geração de token do gateway e instalação do daemon (systemd).

  </Step>

  <Step title="Adicione swap (recomendado para Droplets com 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Verifique o gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Acesse a interface de Control">
    O gateway usa bind em loopback por padrão. Escolha uma destas opções.

    **Opção A: túnel SSH (mais simples)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Depois abra `http://localhost:18789`.

    **Opção B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Depois abra `https://<magicdns>/` em qualquer dispositivo da sua tailnet.

    **Opção C: bind na tailnet (sem Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Depois abra `http://<tailscale-ip>:18789` (token obrigatório).

  </Step>
</Steps>

## Solução de problemas

**O gateway não inicia** -- Execute `openclaw doctor --non-interactive` e verifique os logs com `journalctl --user -u openclaw-gateway.service -n 50`.

**A porta já está em uso** -- Execute `lsof -i :18789` para encontrar o processo e depois pare-o.

**Falta de memória** -- Verifique se o swap está ativo com `free -h`. Se ainda ocorrer OOM, use modelos baseados em API (Claude, GPT) em vez de modelos locais, ou faça upgrade para uma Droplet de 2 GB.

## Próximos passos

- [Canais](/channels) -- conecte Telegram, WhatsApp, Discord e mais
- [Configuração do gateway](/gateway/configuration) -- todas as opções de configuração
- [Atualização](/install/updating) -- mantenha o OpenClaw atualizado
