---
read_when:
    - Você quer executar o Gateway em um servidor Linux ou VPS na nuvem
    - Você precisa de um mapa rápido de guias de hospedagem
    - Você quer ajuste genérico de servidor Linux para o OpenClaw
sidebarTitle: Linux Server
summary: Executar o OpenClaw em um servidor Linux ou VPS na nuvem — seletor de provider, arquitetura e ajuste
title: Servidor Linux
x-i18n:
    generated_at: "2026-04-23T05:45:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 759428cf20204207a5505a73c880aa776ddd0eabf969fc0dcf444fc8ce6991b2
    source_path: vps.md
    workflow: 15
---

# Servidor Linux

Execute o Gateway do OpenClaw em qualquer servidor Linux ou VPS na nuvem. Esta página ajuda você
a escolher um provider, explica como implantações em nuvem funcionam e cobre ajustes genéricos de Linux
que se aplicam em qualquer lugar.

## Escolha um provider

<CardGroup cols={2}>
  <Card title="Railway" href="/pt-BR/install/railway">Configuração com um clique, no navegador</Card>
  <Card title="Northflank" href="/pt-BR/install/northflank">Configuração com um clique, no navegador</Card>
  <Card title="DigitalOcean" href="/pt-BR/install/digitalocean">VPS paga simples</Card>
  <Card title="Oracle Cloud" href="/pt-BR/install/oracle">Camada ARM Always Free</Card>
  <Card title="Fly.io" href="/pt-BR/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/pt-BR/install/hetzner">Docker em VPS da Hetzner</Card>
  <Card title="Hostinger" href="/pt-BR/install/hostinger">VPS com configuração em um clique</Card>
  <Card title="GCP" href="/pt-BR/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/pt-BR/install/azure">VM Linux</Card>
  <Card title="exe.dev" href="/pt-BR/install/exe-dev">VM com proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/pt-BR/install/raspberry-pi">ARM self-hosted</Card>
</CardGroup>

**AWS (EC2 / Lightsail / camada gratuita)** também funciona bem.
Há um vídeo passo a passo da comunidade disponível em
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(recurso da comunidade -- pode ficar indisponível).

## Como funcionam as configurações em nuvem

- O **Gateway é executado na VPS** e controla estado + workspace.
- Você se conecta do seu laptop ou telefone pela **Control UI** ou por **Tailscale/SSH**.
- Trate a VPS como a fonte da verdade e faça **backup** do estado + workspace regularmente.
- Padrão seguro: mantenha o Gateway em loopback e acesse-o por túnel SSH ou Tailscale Serve.
  Se você vinculá-lo a `lan` ou `tailnet`, exija `gateway.auth.token` ou `gateway.auth.password`.

Páginas relacionadas: [Acesso remoto ao Gateway](/pt-BR/gateway/remote), [Hub de plataformas](/pt-BR/platforms).

## Agente compartilhado da empresa em uma VPS

Executar um único agente para uma equipe é uma configuração válida quando todos os usuários estão dentro do mesmo limite de confiança e o agente é usado apenas para negócios.

- Mantenha-o em um runtime dedicado (VPS/VM/container + usuário/contas dedicados do sistema operacional).
- Não conecte esse runtime a contas pessoais Apple/Google nem a perfis pessoais de navegador/gerenciador de senhas.
- Se os usuários forem adversários entre si, separe por gateway/host/usuário do sistema operacional.

Detalhes do modelo de segurança: [Segurança](/pt-BR/gateway/security).

## Usando nodes com uma VPS

Você pode manter o Gateway na nuvem e parear **nodes** nos seus dispositivos locais
(Mac/iOS/Android/headless). Nodes oferecem recursos locais de tela/câmera/canvas e `system.run`
enquanto o Gateway permanece na nuvem.

Documentação: [Nodes](/pt-BR/nodes), [CLI de Nodes](/cli/nodes).

## Ajuste de inicialização para VMs pequenas e hosts ARM

Se comandos da CLI parecerem lentos em VMs de baixa potência (ou hosts ARM), ative o cache de compilação de módulos do Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` melhora os tempos de inicialização de comandos repetidos.
- `OPENCLAW_NO_RESPAWN=1` evita sobrecarga extra de inicialização de um caminho de auto-respawn.
- A primeira execução de comando aquece o cache; execuções seguintes ficam mais rápidas.
- Para detalhes específicos do Raspberry Pi, consulte [Raspberry Pi](/pt-BR/install/raspberry-pi).

### Checklist de ajuste do systemd (opcional)

Para hosts de VM usando `systemd`, considere:

- Adicionar env de serviço para um caminho de inicialização estável:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Manter comportamento de reinício explícito:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Preferir discos com SSD para caminhos de estado/cache para reduzir penalidades de inicialização fria por I/O aleatório.

Para o caminho padrão `openclaw onboard --install-daemon`, edite a unidade de usuário:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Se você instalou deliberadamente uma unidade de sistema, edite
`openclaw-gateway.service` com `sudo systemctl edit openclaw-gateway.service`.

Como políticas `Restart=` ajudam na recuperação automatizada:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Para comportamento de OOM no Linux, seleção de processo filho como vítima e diagnósticos de `exit 137`,
consulte [Pressão de memória no Linux e encerramentos por OOM](/pt-BR/platforms/linux#memory-pressure-and-oom-kills).
