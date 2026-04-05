---
read_when:
    - Ao projetar o assistente de onboarding do macOS
    - Ao implementar configuração de autenticação ou identidade
sidebarTitle: 'Onboarding: macOS App'
summary: Fluxo de configuração da primeira execução do OpenClaw (app do macOS)
title: Onboarding (app do macOS)
x-i18n:
    generated_at: "2026-04-05T12:53:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c5f313a8e5c3a2e68a9488f07c40fcdf75b170dc868c7614565ad9f67755d6
    source_path: start/onboarding.md
    workflow: 15
---

# Onboarding (app do macOS)

Este documento descreve o fluxo **atual** de configuração da primeira execução. O objetivo é uma
experiência suave no “dia 0”: escolher onde o Gateway é executado, conectar a autenticação, executar o
assistente e deixar o agente fazer o bootstrap por conta própria.
Para uma visão geral dos caminhos de onboarding, consulte [Visão geral do onboarding](/start/onboarding-overview).

<Steps>
<Step title="Aprove o aviso do macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Aprove a busca por redes locais">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Boas-vindas e aviso de segurança">
<Frame caption="Leia o aviso de segurança exibido e decida de acordo">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modelo de confiança de segurança:

- Por padrão, o OpenClaw é um agente pessoal: um limite de operador confiável.
- Configurações compartilhadas/multiusuário exigem bloqueio rígido (separe os limites de confiança, mantenha o acesso a ferramentas no mínimo e siga [Segurança](/pt-BR/gateway/security)).
- O onboarding local agora define por padrão novas configurações com `tools.profile: "coding"`, para que configurações locais novas mantenham ferramentas de sistema de arquivos/runtime sem forçar o perfil irrestrito `full`.
- Se hooks/webhooks ou outros feeds de conteúdo não confiável estiverem habilitados, use uma camada de modelo moderna e forte e mantenha política de ferramentas/sandboxing estritos.

</Step>
<Step title="Local vs remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Onde o **Gateway** é executado?

- **Este Mac (somente local):** o onboarding pode configurar a autenticação e gravar credenciais
  localmente.
- **Remoto (via SSH/Tailnet):** o onboarding **não** configura a autenticação local;
  as credenciais devem existir no host do gateway.
- **Configurar mais tarde:** pula a configuração e deixa o app sem configuração.

<Tip>
**Dica de autenticação do Gateway:**

- O assistente agora gera um **token** mesmo para loopback, então clientes WS locais precisam se autenticar.
- Se você desabilitar a autenticação, qualquer processo local poderá se conectar; use isso apenas em máquinas totalmente confiáveis.
- Use um **token** para acesso entre várias máquinas ou binds fora de loopback.

</Tip>
</Step>
<Step title="Permissões">
<Frame caption="Escolha quais permissões você quer conceder ao OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

O onboarding solicita as permissões TCC necessárias para:

- Automação (AppleScript)
- Notificações
- Acessibilidade
- Gravação de Tela
- Microfone
- Reconhecimento de Fala
- Câmera
- Localização

</Step>
<Step title="CLI">
  <Info>Esta etapa é opcional</Info>
  O app pode instalar a CLI global `openclaw` via npm, pnpm ou bun.
  Ele prefere npm primeiro, depois pnpm e depois bun se esse for o único
  gerenciador de pacotes detectado. Para o runtime do Gateway, Node continua sendo o caminho recomendado.
</Step>
<Step title="Chat de onboarding (sessão dedicada)">
  Após a configuração, o app abre uma sessão de chat dedicada de onboarding para que o agente possa
  se apresentar e orientar os próximos passos. Isso mantém a orientação da primeira execução separada
  da sua conversa normal. Consulte [Bootstrapping](/start/bootstrapping) para ver
  o que acontece no host do gateway durante a primeira execução do agente.
</Step>
</Steps>
