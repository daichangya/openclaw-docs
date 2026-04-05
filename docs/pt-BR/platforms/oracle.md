---
read_when:
    - Configurar o OpenClaw na Oracle Cloud
    - Procurar hospedagem VPS de baixo custo para o OpenClaw
    - Querer o OpenClaw 24/7 em um servidor pequeno
summary: OpenClaw na Oracle Cloud (ARM Always Free)
title: Oracle Cloud (Plataforma)
x-i18n:
    generated_at: "2026-04-05T12:48:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a42cdf2d18e964123894d382d2d8052c6b8dbb0b3c7dac914477c4a2a0a244f
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw na Oracle Cloud (OCI)

## Objetivo

Executar um Gateway OpenClaw persistente na camada ARM **Always Free** da Oracle Cloud.

A camada gratuita da Oracle pode ser uma ótima opção para o OpenClaw (especialmente se você já tiver uma conta OCI), mas ela traz algumas compensações:

- Arquitetura ARM (a maioria das coisas funciona, mas alguns binários podem ser apenas x86)
- A capacidade e o cadastro podem ser instáveis

## Comparação de custos (2026)

| Provedor      | Plano           | Especificações         | Preço/mês | Observações           |
| ------------- | --------------- | ---------------------- | --------- | --------------------- |
| Oracle Cloud  | Always Free ARM | até 4 OCPU, 24GB RAM   | $0        | ARM, capacidade limitada |
| Hetzner       | CX22            | 2 vCPU, 4GB RAM        | ~ $4      | Opção paga mais barata |
| DigitalOcean  | Basic           | 1 vCPU, 1GB RAM        | $6        | UI fácil, boa documentação |
| Vultr         | Cloud Compute   | 1 vCPU, 1GB RAM        | $6        | Muitas localidades    |
| Linode        | Nanode          | 1 vCPU, 1GB RAM        | $5        | Agora faz parte da Akamai |

---

## Pré-requisitos

- Conta Oracle Cloud ([cadastro](https://www.oracle.com/cloud/free/)) — veja o [guia de cadastro da comunidade](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) se encontrar problemas
- Conta Tailscale (gratuita em [tailscale.com](https://tailscale.com))
- ~30 minutos

## 1) Criar uma instância OCI

1. Faça login no [Oracle Cloud Console](https://cloud.oracle.com/)
2. Navegue até **Compute → Instances → Create Instance**
3. Configure:
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (ou até 4)
   - **Memory:** 12 GB (ou até 24 GB)
   - **Boot volume:** 50 GB (até 200 GB gratuitos)
   - **SSH key:** adicione sua chave pública
4. Clique em **Create**
5. Anote o endereço IP público

**Dica:** se a criação da instância falhar com "Out of capacity", tente outro domínio de disponibilidade ou tente novamente mais tarde. A capacidade da camada gratuita é limitada.

## 2) Conectar e atualizar

```bash
# Conectar pelo IP público
ssh ubuntu@YOUR_PUBLIC_IP

# Atualizar o sistema
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Observação:** `build-essential` é necessário para compilação ARM de algumas dependências.

## 3) Configurar usuário e hostname

```bash
# Definir hostname
sudo hostnamectl set-hostname openclaw

# Definir senha para o usuário ubuntu
sudo passwd ubuntu

# Ativar lingering (mantém os serviços do usuário em execução após logout)
sudo loginctl enable-linger ubuntu
```

## 4) Instalar o Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Isso ativa o SSH do Tailscale, para que você possa se conectar via `ssh openclaw` de qualquer dispositivo na sua tailnet — sem precisar de IP público.

Verifique:

```bash
tailscale status
```

**A partir de agora, conecte-se via Tailscale:** `ssh ubuntu@openclaw` (ou use o IP do Tailscale).

## 5) Instalar o OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Quando aparecer a pergunta "How do you want to hatch your bot?", selecione **"Do this later"**.

> Observação: se você encontrar problemas de build nativo em ARM, comece com pacotes do sistema (por exemplo, `sudo apt install -y build-essential`) antes de recorrer ao Homebrew.

## 6) Configurar o Gateway (loopback + autenticação por token) e ativar o Tailscale Serve

Use autenticação por token como padrão. Ela é previsível e evita a necessidade de flags de UI de controle de “autenticação insegura”.

```bash
# Manter o Gateway privado na VM
openclaw config set gateway.bind loopback

# Exigir autenticação para o Gateway + UI de controle
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expor via Tailscale Serve (HTTPS + acesso pela tailnet)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` aqui serve apenas para o tratamento de IP encaminhado/cliente local do proxy local do Tailscale Serve. Isso **não** é `gateway.auth.mode: "trusted-proxy"`. As rotas do visualizador de diff mantêm comportamento fechado por padrão nesta configuração: solicitações brutas ao visualizador via `127.0.0.1` sem cabeçalhos de proxy encaminhados podem retornar `Diff not found`. Use `mode=file` / `mode=both` para anexos, ou ative intencionalmente visualizadores remotos e defina `plugins.entries.diffs.config.viewerBaseUrl` (ou passe um `baseUrl` de proxy) se precisar de links compartilháveis para o visualizador.

## 7) Verificar

```bash
# Verificar a versão
openclaw --version

# Verificar o status do daemon
systemctl --user status openclaw-gateway.service

# Verificar o Tailscale Serve
tailscale serve status

# Testar a resposta local
curl http://localhost:18789
```

## 8) Restringir a segurança da VCN

Agora que tudo está funcionando, restrinja a VCN para bloquear todo o tráfego, exceto o Tailscale. A Virtual Cloud Network da OCI atua como um firewall na borda da rede — o tráfego é bloqueado antes de chegar à sua instância.

1. Vá para **Networking → Virtual Cloud Networks** no OCI Console
2. Clique na sua VCN → **Security Lists** → Default Security List
3. **Remova** todas as regras de entrada, exceto:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Mantenha as regras de saída padrão (permitir toda saída)

Isso bloqueia SSH na porta 22, HTTP, HTTPS e todo o restante na borda da rede. A partir de agora, você só poderá se conectar via Tailscale.

---

## Acessar a UI de controle

De qualquer dispositivo na sua rede Tailscale:

```
https://openclaw.<tailnet-name>.ts.net/
```

Substitua `<tailnet-name>` pelo nome da sua tailnet (visível em `tailscale status`).

Nenhum túnel SSH é necessário. O Tailscale fornece:

- Criptografia HTTPS (certificados automáticos)
- Autenticação via identidade Tailscale
- Acesso de qualquer dispositivo na sua tailnet (laptop, telefone etc.)

---

## Segurança: VCN + Tailscale (baseline recomendada)

Com a VCN restrita (apenas UDP 41641 aberto) e o Gateway vinculado ao loopback, você obtém uma forte defesa em profundidade: o tráfego público é bloqueado na borda da rede, e o acesso administrativo acontece pela sua tailnet.

Essa configuração frequentemente elimina a _necessidade_ de regras extras de firewall no host apenas para impedir ataques de força bruta de SSH vindos da Internet — mas você ainda deve manter o SO atualizado, executar `openclaw security audit` e verificar se não está ouvindo acidentalmente em interfaces públicas.

### Já protegido

| Etapa tradicional | Necessário? | Motivo                                                                       |
| ----------------- | ----------- | ---------------------------------------------------------------------------- |
| Firewall UFW      | Não         | A VCN bloqueia antes que o tráfego chegue à instância                       |
| fail2ban          | Não         | Não há força bruta se a porta 22 estiver bloqueada na VCN                   |
| Hardening do sshd | Não         | O SSH do Tailscale não usa `sshd`                                           |
| Desativar login root | Não      | O Tailscale usa identidade Tailscale, não usuários do sistema               |
| Autenticação SSH apenas por chave | Não | O Tailscale autentica pela sua tailnet                           |
| Hardening de IPv6 | Normalmente não | Depende das configurações da sua VCN/sub-rede; verifique o que está realmente atribuído/exposto |

### Ainda recomendado

- **Permissões de credenciais:** `chmod 700 ~/.openclaw`
- **Auditoria de segurança:** `openclaw security audit`
- **Atualizações do sistema:** `sudo apt update && sudo apt upgrade` regularmente
- **Monitorar o Tailscale:** revise os dispositivos no [console de administração do Tailscale](https://login.tailscale.com/admin)

### Verificar a postura de segurança

```bash
# Confirmar que não há portas públicas ouvindo
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verificar se o SSH do Tailscale está ativo
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Opcional: desativar o sshd completamente
sudo systemctl disable --now ssh
```

---

## Alternativa: túnel SSH

Se o Tailscale Serve não estiver funcionando, use um túnel SSH:

```bash
# Da sua máquina local (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Depois, abra `http://localhost:18789`.

---

## Solução de problemas

### A criação da instância falha ("Out of capacity")

As instâncias ARM da camada gratuita são populares. Tente:

- Outro domínio de disponibilidade
- Tentar novamente em horários de menor uso (de manhã cedo)
- Usar o filtro "Always Free" ao selecionar o shape

### O Tailscale não conecta

```bash
# Verificar status
sudo tailscale status

# Autenticar novamente
sudo tailscale up --ssh --hostname=openclaw --reset
```

### O Gateway não inicia

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Não é possível acessar a UI de controle

```bash
# Verificar se o Tailscale Serve está em execução
tailscale serve status

# Verificar se o gateway está escutando
curl http://localhost:18789

# Reiniciar se necessário
systemctl --user restart openclaw-gateway.service
```

### Problemas com binários ARM

Algumas ferramentas podem não ter builds ARM. Verifique:

```bash
uname -m  # Deve mostrar aarch64
```

A maioria dos pacotes npm funciona bem. Para binários, procure versões `linux-arm64` ou `aarch64`.

---

## Persistência

Todo o estado fica em:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` por agente, estado de canais/provedores e dados de sessão
- `~/.openclaw/workspace/` — workspace (SOUL.md, memória, artefatos)

Faça backup periodicamente:

```bash
openclaw backup create
```

---

## Veja também

- [Acesso remoto ao Gateway](/pt-BR/gateway/remote) — outros padrões de acesso remoto
- [Integração com Tailscale](/pt-BR/gateway/tailscale) — documentação completa do Tailscale
- [Configuração do Gateway](/pt-BR/gateway/configuration) — todas as opções de configuração
- [Guia do DigitalOcean](/pt-BR/install/digitalocean) — se você quiser uma opção paga com cadastro mais fácil
- [Guia do Hetzner](/pt-BR/install/hetzner) — alternativa baseada em Docker
