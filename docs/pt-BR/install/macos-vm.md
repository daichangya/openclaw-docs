---
read_when:
    - Você quer o OpenClaw isolado do seu ambiente macOS principal
    - Você quer integração com iMessage (BlueBubbles) em um sandbox
    - Você quer um ambiente macOS redefinível que possa clonar
    - Você quer comparar opções de VMs macOS locais e hospedadas
summary: Execute o OpenClaw em uma VM macOS isolada (local ou hospedada) quando precisar de isolamento ou iMessage
title: VMs macOS
x-i18n:
    generated_at: "2026-04-05T12:45:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1f7c5691fd2686418ee25f2c38b1f9badd511daeef2906d21ad30fb523b013f
    source_path: install/macos-vm.md
    workflow: 15
---

# OpenClaw em VMs macOS (sandboxing)

## Padrão recomendado (para a maioria dos usuários)

- **VPS Linux pequena** para um Gateway sempre ativo e baixo custo. Consulte [VPS hosting](/vps).
- **Hardware dedicado** (Mac mini ou máquina Linux) se você quiser controle total e um **IP residencial** para automação de navegador. Muitos sites bloqueiam IPs de data center, então a navegação local geralmente funciona melhor.
- **Híbrido:** mantenha o Gateway em uma VPS barata e conecte seu Mac como um **node** quando precisar de automação de navegador/UI. Consulte [Nodes](/nodes) e [Gateway remote](/gateway/remote).

Use uma VM macOS quando você precisar especificamente de recursos exclusivos do macOS (iMessage/BlueBubbles) ou quiser isolamento rígido do seu Mac de uso diário.

## Opções de VM macOS

### VM local no seu Mac Apple Silicon (Lume)

Execute o OpenClaw em uma VM macOS isolada no seu Mac Apple Silicon existente usando [Lume](https://cua.ai/docs/lume).

Isso oferece:

- Ambiente macOS completo em isolamento (seu host permanece limpo)
- Suporte a iMessage via BlueBubbles (impossível no Linux/Windows)
- Redefinição instantânea com clonagem de VMs
- Sem custos extras de hardware ou nuvem

### Providers de Mac hospedado (nuvem)

Se você quiser macOS na nuvem, providers de Mac hospedado também funcionam:

- [MacStadium](https://www.macstadium.com/) (Macs hospedados)
- Outros fornecedores de Macs hospedados também funcionam; siga a documentação deles para VM + SSH

Quando tiver acesso SSH a uma VM macOS, continue na etapa 6 abaixo.

---

## Caminho rápido (Lume, usuários experientes)

1. Instale o Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Conclua o Setup Assistant e ative Remote Login (SSH)
4. `lume run openclaw --no-display`
5. Acesse por SSH, instale o OpenClaw, configure os canais
6. Pronto

---

## O que você precisa (Lume)

- Mac Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia ou posterior no host
- ~60 GB de espaço livre em disco por VM
- ~20 minutos

---

## 1) Instalar o Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Se `~/.local/bin` não estiver no seu PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Verifique:

```bash
lume --version
```

Documentação: [Lume Installation](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Criar a VM macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Isso baixa o macOS e cria a VM. Uma janela VNC é aberta automaticamente.

Observação: o download pode demorar dependendo da sua conexão.

---

## 3) Concluir o Setup Assistant

Na janela VNC:

1. Selecione idioma e região
2. Ignore o Apple ID (ou entre se quiser usar iMessage depois)
3. Crie uma conta de usuário (lembre-se do nome de usuário e da senha)
4. Ignore todos os recursos opcionais

Após a configuração ser concluída, ative o SSH:

1. Abra System Settings → General → Sharing
2. Ative "Remote Login"

---

## 4) Obter o endereço IP da VM

```bash
lume get openclaw
```

Procure o endereço IP (geralmente `192.168.64.x`).

---

## 5) Conectar por SSH à VM

```bash
ssh youruser@192.168.64.X
```

Substitua `youruser` pela conta que você criou e o IP pelo IP da sua VM.

---

## 6) Instalar o OpenClaw

Dentro da VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Siga os prompts de onboarding para configurar seu provider de modelo (Anthropic, OpenAI etc.).

---

## 7) Configurar canais

Edite o arquivo de configuração:

```bash
nano ~/.openclaw/openclaw.json
```

Adicione seus canais:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Depois faça login no WhatsApp (escaneie o QR):

```bash
openclaw channels login
```

---

## 8) Executar a VM sem interface

Pare a VM e reinicie sem display:

```bash
lume stop openclaw
lume run openclaw --no-display
```

A VM é executada em segundo plano. O daemon do OpenClaw mantém o gateway em execução.

Para verificar o status:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bônus: integração com iMessage

Este é o principal motivo para executar no macOS. Use [BlueBubbles](https://bluebubbles.app) para adicionar iMessage ao OpenClaw.

Dentro da VM:

1. Baixe o BlueBubbles em bluebubbles.app
2. Entre com seu Apple ID
3. Ative a Web API e defina uma senha
4. Aponte os webhooks do BlueBubbles para o seu gateway (exemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Adicione à sua configuração do OpenClaw:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Reinicie o gateway. Agora seu agente pode enviar e receber iMessages.

Detalhes completos de configuração: [BlueBubbles channel](/channels/bluebubbles)

---

## Salvar uma imagem dourada

Antes de personalizar ainda mais, faça um snapshot do seu estado limpo:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Redefina a qualquer momento:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Executando 24/7

Mantenha a VM em execução:

- Mantendo seu Mac conectado à energia
- Desativando o repouso em System Settings → Energy Saver
- Usando `caffeinate`, se necessário

Para ficar realmente sempre ativo, considere um Mac mini dedicado ou uma VPS pequena. Consulte [VPS hosting](/vps).

---

## Solução de problemas

| Problema                 | Solução                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Não consegue acessar por SSH a VM | Verifique se "Remote Login" está ativado em System Settings da VM        |
| O IP da VM não aparece   | Aguarde a VM concluir totalmente a inicialização e execute `lume get openclaw` novamente |
| Comando `lume` não encontrado | Adicione `~/.local/bin` ao seu PATH                                           |
| O QR do WhatsApp não escaneia | Verifique se você está conectado à VM (e não ao host) ao executar `openclaw channels login` |

---

## Documentação relacionada

- [VPS hosting](/vps)
- [Nodes](/nodes)
- [Gateway remote](/gateway/remote)
- [BlueBubbles channel](/channels/bluebubbles)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Reference](https://cua.ai/docs/lume/reference/cli-reference)
- [Unattended VM Setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avançado)
- [Docker Sandboxing](/install/docker) (abordagem alternativa de isolamento)
