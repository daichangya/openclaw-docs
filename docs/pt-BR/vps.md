---
read_when:
    - Você quer executar o Gateway em um servidor Linux ou VPS na nuvem
    - Você precisa de um mapa rápido dos guias de hospedagem
    - Você quer ajustes genéricos de servidor Linux para o OpenClaw
sidebarTitle: Linux Server
summary: Execute o OpenClaw em um servidor Linux ou VPS na nuvem — seletor de provedor, arquitetura e ajuste
title: Servidor Linux
x-i18n:
    generated_at: "2026-04-05T12:56:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f2f26bbc116841a29055850ed5f491231554b90539bcbf91a6b519875d494fb
    source_path: vps.md
    workflow: 15
---

# Servidor Linux

Execute o Gateway do OpenClaw em qualquer servidor Linux ou VPS na nuvem. Esta página ajuda você
a escolher um provedor, explica como as implantações na nuvem funcionam e aborda ajustes
genéricos de Linux que se aplicam em qualquer lugar.

## Escolha um provedor

<CardGroup cols={2}>
  <Card title="Railway" href="/pt-BR/install/railway">Configuração com um clique, no navegador</Card>
  <Card title="Northflank" href="/pt-BR/install/northflank">Configuração com um clique, no navegador</Card>
  <Card title="DigitalOcean" href="/pt-BR/install/digitalocean">VPS paga simples</Card>
  <Card title="Oracle Cloud" href="/pt-BR/install/oracle">Camada ARM Always Free</Card>
  <Card title="Fly.io" href="/pt-BR/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/pt-BR/install/hetzner">Docker em VPS da Hetzner</Card>
  <Card title="GCP" href="/pt-BR/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/pt-BR/install/azure">VM Linux</Card>
  <Card title="exe.dev" href="/pt-BR/install/exe-dev">VM com proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/pt-BR/install/raspberry-pi">Hospedagem própria em ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / camada gratuita)** também funciona bem.
Um passo a passo em vídeo da comunidade está disponível em
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(recurso da comunidade -- pode deixar de estar disponível).

## Como as configurações na nuvem funcionam

- O **Gateway é executado na VPS** e é o responsável pelo estado + workspace.
- Você se conecta do seu laptop ou telefone via **Control UI** ou **Tailscale/SSH**.
- Trate a VPS como a fonte da verdade e faça **backup** do estado + workspace regularmente.
- Padrão seguro: mantenha o Gateway no loopback local e acesse-o via túnel SSH ou Tailscale Serve.
  Se você fizer bind em `lan` ou `tailnet`, exija `gateway.auth.token` ou `gateway.auth.password`.

Páginas relacionadas: [Gateway remote access](/pt-BR/gateway/remote), [Platforms hub](/pt-BR/platforms).

## Agente compartilhado da empresa em uma VPS

Executar um único agente para uma equipe é uma configuração válida quando todos os usuários estão no mesmo limite de confiança e o agente é apenas para uso empresarial.

- Mantenha-o em um runtime dedicado (VPS/VM/contêiner + usuário/contas de SO dedicados).
- Não faça login nesse runtime com contas pessoais Apple/Google nem com perfis pessoais de navegador/gerenciador de senhas.
- Se os usuários forem adversariais entre si, separe por gateway/host/usuário de SO.

Detalhes do modelo de segurança: [Security](/pt-BR/gateway/security).

## Uso de nodes com uma VPS

Você pode manter o Gateway na nuvem e parear **nodes** nos seus dispositivos locais
(Mac/iOS/Android/headless). Nodes fornecem recursos locais de tela/câmera/canvas e `system.run`,
enquanto o Gateway permanece na nuvem.

Documentação: [Nodes](/pt-BR/nodes), [Nodes CLI](/cli/nodes).

## Ajuste de inicialização para VMs pequenas e hosts ARM

Se os comandos da CLI parecerem lentos em VMs de baixa potência (ou hosts ARM), ative o cache de compilação de módulos do Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` melhora os tempos de inicialização de comandos repetidos.
- `OPENCLAW_NO_RESPAWN=1` evita a sobrecarga extra de inicialização de um caminho de auto-respawn.
- A primeira execução do comando aquece o cache; as execuções seguintes são mais rápidas.
- Para detalhes específicos do Raspberry Pi, consulte [Raspberry Pi](/pt-BR/install/raspberry-pi).

### Checklist de ajuste do systemd (opcional)

Para hosts de VM que usam `systemd`, considere:

- Adicionar variáveis de ambiente ao serviço para um caminho de inicialização estável:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Manter o comportamento de reinício explícito:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Prefira discos com SSD para os caminhos de estado/cache, para reduzir penalidades de inicialização fria por E/S aleatória.

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

Como as políticas `Restart=` ajudam na recuperação automatizada:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).
