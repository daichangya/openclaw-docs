---
read_when:
    - Você quer uma implantação automatizada em servidor com reforço de segurança
    - Você precisa de uma configuração isolada por firewall com acesso via VPN
    - Você está implantando em servidores remotos Debian/Ubuntu
summary: Instalação automatizada e reforçada do OpenClaw com Ansible, VPN Tailscale e isolamento por firewall
title: Ansible
x-i18n:
    generated_at: "2026-04-05T12:43:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27433c3b4afa09406052e428be7b1990476067e47ab8abf7145ff9547b37909a
    source_path: install/ansible.md
    workflow: 15
---

# Instalação com Ansible

Implante o OpenClaw em servidores de produção com **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- um instalador automatizado com arquitetura security-first.

<Info>
O repositório [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) é a fonte da verdade para implantação com Ansible. Esta página é uma visão geral rápida.
</Info>

## Pré-requisitos

| Requirement | Details                                                   |
| ----------- | --------------------------------------------------------- |
| **SO**      | Debian 11+ ou Ubuntu 20.04+                               |
| **Acesso**  | Privilégios de root ou sudo                               |
| **Rede**    | Conexão com a internet para instalação de pacotes         |
| **Ansible** | 2.14+ (instalado automaticamente pelo script de início rápido) |

## O que você recebe

- **Segurança baseada em firewall** -- isolamento com UFW + Docker (somente SSH + Tailscale acessíveis)
- **VPN Tailscale** -- acesso remoto seguro sem expor serviços publicamente
- **Docker** -- contêineres de sandbox isolados, binds apenas em localhost
- **Defesa em profundidade** -- arquitetura de segurança em 4 camadas
- **Integração com systemd** -- inicialização automática no boot com reforço de segurança
- **Configuração com um comando** -- implantação completa em minutos

## Início rápido

Instalação com um comando:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## O que é instalado

O playbook do Ansible instala e configura:

1. **Tailscale** -- VPN mesh para acesso remoto seguro
2. **Firewall UFW** -- somente portas de SSH + Tailscale
3. **Docker CE + Compose V2** -- para sandboxes de agentes
4. **Node.js 24 + pnpm** -- dependências de runtime (Node 22 LTS, atualmente `22.14+`, continua compatível)
5. **OpenClaw** -- baseado em host, não conteinerizado
6. **Serviço systemd** -- inicialização automática com reforço de segurança

<Note>
O gateway é executado diretamente no host (não no Docker), mas os sandboxes de agentes usam Docker para isolamento. Consulte [Sandboxing](/gateway/sandboxing) para detalhes.
</Note>

## Configuração após a instalação

<Steps>
  <Step title="Mude para o usuário openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Execute o assistente de onboarding">
    O script pós-instalação orienta você na configuração das definições do OpenClaw.
  </Step>
  <Step title="Conecte os provedores de mensagens">
    Faça login em WhatsApp, Telegram, Discord ou Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Verifique a instalação">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Conecte-se ao Tailscale">
    Entre na sua malha VPN para acesso remoto seguro.
  </Step>
</Steps>

### Comandos rápidos

```bash
# Check service status
sudo systemctl status openclaw

# View live logs
sudo journalctl -u openclaw -f

# Restart gateway
sudo systemctl restart openclaw

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## Arquitetura de segurança

A implantação usa um modelo de defesa em 4 camadas:

1. **Firewall (UFW)** -- somente SSH (22) + Tailscale (41641/udp) expostos publicamente
2. **VPN (Tailscale)** -- gateway acessível apenas pela malha VPN
3. **Isolamento com Docker** -- a cadeia iptables DOCKER-USER impede exposição de portas externas
4. **Reforço com systemd** -- NoNewPrivileges, PrivateTmp, usuário sem privilégios

Para verificar sua superfície de ataque externa:

```bash
nmap -p- YOUR_SERVER_IP
```

Somente a porta 22 (SSH) deve estar aberta. Todos os outros serviços (gateway, Docker) ficam bloqueados.

O Docker é instalado para sandboxes de agentes (execução isolada de ferramentas), não para executar o próprio gateway. Consulte [Sandbox e ferramentas multiagente](/tools/multi-agent-sandbox-tools) para configuração de sandbox.

## Instalação manual

Se você preferir controle manual sobre a automação:

<Steps>
  <Step title="Instale os pré-requisitos">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clone o repositório">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Instale as coleções do Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Execute o playbook">
    ```bash
    ./run-playbook.sh
    ```

    Como alternativa, execute diretamente e depois execute manualmente o script de configuração:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Atualização

O instalador do Ansible configura o OpenClaw para atualizações manuais. Consulte [Atualização](/install/updating) para o fluxo padrão de atualização.

Para executar novamente o playbook do Ansible (por exemplo, para alterações de configuração):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Isso é idempotente e seguro para ser executado várias vezes.

## Solução de problemas

<AccordionGroup>
  <Accordion title="O firewall bloqueia minha conexão">
    - Verifique se você consegue acessar via VPN Tailscale primeiro
    - O acesso por SSH (porta 22) é sempre permitido
    - O gateway é acessível somente via Tailscale por design
  </Accordion>
  <Accordion title="O serviço não inicia">
    ```bash
    # Check logs
    sudo journalctl -u openclaw -n 100

    # Verify permissions
    sudo ls -la /opt/openclaw

    # Test manual start
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Problemas com sandbox Docker">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build sandbox image if missing
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Falha no login do provedor">
    Verifique se você está executando como o usuário `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Configuração avançada

Para detalhes da arquitetura de segurança e solução de problemas, consulte o repositório openclaw-ansible:

- [Arquitetura de segurança](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Detalhes técnicos](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Guia de solução de problemas](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Relacionado

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- guia completo de implantação
- [Docker](/install/docker) -- configuração de gateway conteinerizado
- [Sandboxing](/gateway/sandboxing) -- configuração de sandbox de agente
- [Sandbox e ferramentas multiagente](/tools/multi-agent-sandbox-tools) -- isolamento por agente
