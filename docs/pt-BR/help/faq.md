---
read_when:
    - Respondendo a perguntas comuns sobre configuração, instalação, onboarding ou suporte em tempo de execução
    - Triando problemas relatados por usuários antes de uma depuração mais aprofundada
summary: Perguntas frequentes sobre a configuração, a instalação e o uso do OpenClaw
title: Perguntas frequentes
x-i18n:
    generated_at: "2026-04-20T05:41:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bdb17fc4d8c61a36f3a9fc3ca4a20f723cfa6c9bbbc92f963d6e313181f3451
    source_path: help/faq.md
    workflow: 15
---

# Perguntas frequentes

Respostas rápidas mais solução de problemas aprofundada para configurações do mundo real (desenvolvimento local, VPS, multi-agent, chaves OAuth/API, failover de modelo). Para diagnósticos de tempo de execução, consulte [Solução de problemas](/pt-BR/gateway/troubleshooting). Para a referência completa de configuração, consulte [Configuração](/pt-BR/gateway/configuration).

## Primeiros 60 segundos se algo estiver quebrado

1. **Status rápido (primeira verificação)**

   ```bash
   openclaw status
   ```

   Resumo local rápido: SO + atualização, disponibilidade do gateway/serviço, agents/sessions, configuração do provedor + problemas de tempo de execução (quando o gateway está acessível).

2. **Relatório copiável (seguro para compartilhar)**

   ```bash
   openclaw status --all
   ```

   Diagnóstico somente leitura com final do log (tokens redigidos).

3. **Estado do daemon + porta**

   ```bash
   openclaw gateway status
   ```

   Mostra o tempo de execução do supervisor vs acessibilidade RPC, a URL de destino da sonda e qual configuração o serviço provavelmente usou.

4. **Sondas profundas**

   ```bash
   openclaw status --deep
   ```

   Executa uma sonda de integridade ativa do gateway, incluindo sondas de canal quando compatível
   (requer um gateway acessível). Consulte [Health](/pt-BR/gateway/health).

5. **Acompanhe o log mais recente**

   ```bash
   openclaw logs --follow
   ```

   Se o RPC estiver indisponível, use como alternativa:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Os logs em arquivo são separados dos logs do serviço; consulte [Logging](/pt-BR/logging) e [Solução de problemas](/pt-BR/gateway/troubleshooting).

6. **Execute o doctor (reparos)**

   ```bash
   openclaw doctor
   ```

   Repara/migra configuração/estado + executa verificações de integridade. Consulte [Doctor](/pt-BR/gateway/doctor).

7. **Snapshot do gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # mostra a URL de destino + o caminho da configuração em caso de erros
   ```

   Solicita ao gateway em execução um snapshot completo (somente WS). Consulte [Health](/pt-BR/gateway/health).

## Início rápido e configuração da primeira execução

<AccordionGroup>
  <Accordion title="Estou travado, qual é a forma mais rápida de destravar?">
    Use um agente de IA local que consiga **ver sua máquina**. Isso é muito mais eficaz do que pedir ajuda
    no Discord, porque a maioria dos casos de "estou travado" é causada por **problemas locais de configuração ou ambiente** que
    ajudantes remotos não conseguem inspecionar.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Essas ferramentas podem ler o repositório, executar comandos, inspecionar logs e ajudar a corrigir sua configuração
    no nível da máquina (PATH, serviços, permissões, arquivos de autenticação). Dê a elas o **checkout completo do código-fonte** por meio
    da instalação hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Isso instala o OpenClaw **a partir de um checkout git**, para que o agente possa ler o código + a documentação e
    raciocinar sobre a versão exata que você está executando. Você sempre pode voltar para a versão estável mais tarde
    executando o instalador novamente sem `--install-method git`.

    Dica: peça ao agente para **planejar e supervisionar** a correção (passo a passo) e depois executar apenas os
    comandos necessários. Isso mantém as mudanças pequenas e mais fáceis de auditar.

    Se você descobrir um bug real ou uma correção, abra uma issue no GitHub ou envie um PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Comece com estes comandos (compartilhe as saídas ao pedir ajuda):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    O que eles fazem:

    - `openclaw status`: snapshot rápido da integridade do gateway/agent + configuração básica.
    - `openclaw models status`: verifica autenticação do provedor + disponibilidade do modelo.
    - `openclaw doctor`: valida e repara problemas comuns de configuração/estado.

    Outras verificações úteis da CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Loop rápido de depuração: [Primeiros 60 segundos se algo estiver quebrado](#primeiros-60-segundos-se-algo-estiver-quebrado).
    Documentação de instalação: [Install](/pt-BR/install), [Flags do instalador](/pt-BR/install/installer), [Atualização](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="O Heartbeat continua sendo ignorado. O que significam os motivos de ignorar?">
    Motivos comuns para ignorar Heartbeat:

    - `quiet-hours`: fora da janela configurada de active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` existe, mas contém apenas estrutura em branco/somente cabeçalho
    - `no-tasks-due`: o modo de tarefa de `HEARTBEAT.md` está ativo, mas nenhum dos intervalos de tarefa ainda venceu
    - `alerts-disabled`: toda a visibilidade do heartbeat está desativada (`showOk`, `showAlerts` e `useIndicator` estão todos desligados)

    No modo de tarefa, os carimbos de data/hora de vencimento só são avançados depois que uma execução real do heartbeat
    é concluída. Execuções ignoradas não marcam tarefas como concluídas.

    Documentação: [Heartbeat](/pt-BR/gateway/heartbeat), [Automação & Tarefas](/pt-BR/automation).

  </Accordion>

  <Accordion title="Forma recomendada de instalar e configurar o OpenClaw">
    O repositório recomenda executar a partir do código-fonte e usar o onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    O assistente também pode compilar automaticamente os assets da UI. Após o onboarding, você normalmente executa o Gateway na porta **18789**.

    A partir do código-fonte (contribuidores/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Se você ainda não tiver uma instalação global, execute via `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Como abro o dashboard após o onboarding?">
    O assistente abre seu navegador com uma URL limpa do dashboard (sem token) logo após o onboarding e também imprime o link no resumo. Mantenha essa aba aberta; se ela não tiver sido iniciada, copie/cole a URL impressa na mesma máquina.
  </Accordion>

  <Accordion title="Como autentico o dashboard em localhost vs remoto?">
    **Localhost (mesma máquina):**

    - Abra `http://127.0.0.1:18789/`.
    - Se pedir autenticação por segredo compartilhado, cole o token ou a senha configurados nas configurações da Control UI.
    - Origem do token: `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
    - Origem da senha: `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Se nenhum segredo compartilhado estiver configurado ainda, gere um token com `openclaw doctor --generate-gateway-token`.

    **Fora do localhost:**

    - **Tailscale Serve** (recomendado): mantenha o bind em loopback, execute `openclaw gateway --tailscale serve`, abra `https://<magicdns>/`. Se `gateway.auth.allowTailscale` for `true`, os cabeçalhos de identidade satisfazem a autenticação da Control UI/WebSocket (sem colar segredo compartilhado, assumindo um host de gateway confiável); as APIs HTTP ainda exigem autenticação por segredo compartilhado, a menos que você use deliberadamente `none` em private-ingress ou autenticação HTTP de proxy confiável.
      Más tentativas simultâneas de autenticação do Serve a partir do mesmo cliente são serializadas antes que o limitador de falhas de autenticação as registre, portanto a segunda tentativa inválida já pode mostrar `retry later`.
    - **Bind na tailnet**: execute `openclaw gateway --bind tailnet --token "<token>"` (ou configure autenticação por senha), abra `http://<tailscale-ip>:18789/` e depois cole o segredo compartilhado correspondente nas configurações do dashboard.
    - **Proxy reverso com reconhecimento de identidade**: mantenha o Gateway atrás de um proxy confiável sem loopback, configure `gateway.auth.mode: "trusted-proxy"` e então abra a URL do proxy.
    - **Túnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` e depois abra `http://127.0.0.1:18789/`. A autenticação por segredo compartilhado ainda se aplica pelo túnel; cole o token ou a senha configurados se solicitado.

    Consulte [Dashboard](/web/dashboard) e [Superfícies web](/web) para detalhes de modos de bind e autenticação.

  </Accordion>

  <Accordion title="Por que existem duas configurações de aprovação exec para aprovações no chat?">
    Elas controlam camadas diferentes:

    - `approvals.exec`: encaminha prompts de aprovação para destinos de chat
    - `channels.<channel>.execApprovals`: faz com que esse canal atue como um cliente nativo de aprovação para aprovações exec

    A política exec do host continua sendo o verdadeiro controle de aprovação. A configuração do chat controla apenas onde os prompts de aprovação
    aparecem e como as pessoas podem respondê-los.

    Na maioria das configurações, você **não** precisa de ambas:

    - Se o chat já oferece suporte a comandos e respostas, `/approve` no mesmo chat funciona pelo caminho compartilhado.
    - Se um canal nativo compatível puder inferir aprovadores com segurança, o OpenClaw agora ativa automaticamente aprovações nativas DM-first quando `channels.<channel>.execApprovals.enabled` estiver indefinido ou for `"auto"`.
    - Quando cartões/botões nativos de aprovação estiverem disponíveis, essa UI nativa será o caminho principal; o agent só deve incluir um comando manual `/approve` se o resultado da ferramenta disser que aprovações por chat não estão disponíveis ou que a aprovação manual é o único caminho.
    - Use `approvals.exec` apenas quando os prompts também precisarem ser encaminhados para outros chats ou salas operacionais explícitas.
    - Use `channels.<channel>.execApprovals.target: "channel"` ou `"both"` apenas quando quiser explicitamente que os prompts de aprovação sejam postados de volta na sala/tópico de origem.
    - As aprovações de Plugin são separadas novamente: elas usam `/approve` no mesmo chat por padrão, encaminhamento opcional `approvals.plugin` e apenas alguns canais nativos mantêm o tratamento nativo de aprovação de plugin por cima disso.

    Em resumo: encaminhamento é para roteamento, configuração de cliente nativo é para uma UX mais rica e específica do canal.
    Consulte [Aprovações exec](/pt-BR/tools/exec-approvals).

  </Accordion>

  <Accordion title="De que runtime eu preciso?">
    Node **>= 22** é obrigatório. `pnpm` é recomendado. Bun **não é recomendado** para o Gateway.
  </Accordion>

  <Accordion title="Ele roda em Raspberry Pi?">
    Sim. O Gateway é leve — a documentação lista **512MB-1GB de RAM**, **1 núcleo** e cerca de **500MB**
    de disco como suficientes para uso pessoal, e observa que um **Raspberry Pi 4 consegue executá-lo**.

    Se você quiser uma folga extra (logs, mídia, outros serviços), **2GB são recomendados**, mas isso
    não é um mínimo rígido.

    Dica: um Pi/VPS pequeno pode hospedar o Gateway, e você pode emparelhar **nodes** no seu laptop/telefone para
    tela/câmera/canvas locais ou execução de comandos. Consulte [Nodes](/pt-BR/nodes).

  </Accordion>

  <Accordion title="Alguma dica para instalações em Raspberry Pi?">
    Em resumo: funciona, mas espere algumas arestas.

    - Use um SO **64 bits** e mantenha Node >= 22.
    - Prefira a **instalação hackable (git)** para que você possa ver logs e atualizar rapidamente.
    - Comece sem canais/Skills e depois adicione-os um por um.
    - Se você encontrar problemas estranhos com binários, geralmente é um problema de **compatibilidade ARM**.

    Documentação: [Linux](/pt-BR/platforms/linux), [Install](/pt-BR/install).

  </Accordion>

  <Accordion title="Está travado em wake up my friend / o onboarding não hatch. E agora?">
    Essa tela depende de o Gateway estar acessível e autenticado. A TUI também envia
    "Wake up, my friend!" automaticamente na primeira hatch. Se você vir essa linha sem **nenhuma resposta**
    e os tokens permanecerem em 0, o agent nunca foi executado.

    1. Reinicie o Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Verifique status + autenticação:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Se ainda travar, execute:

    ```bash
    openclaw doctor
    ```

    Se o Gateway for remoto, certifique-se de que a conexão do túnel/Tailscale esteja ativa e que a UI
    esteja apontando para o Gateway correto. Consulte [Acesso remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Posso migrar minha configuração para uma nova máquina (Mac mini) sem refazer o onboarding?">
    Sim. Copie o **diretório de estado** e o **workspace**, depois execute o Doctor uma vez. Isso
    mantém seu bot "exatamente igual" (memória, histórico de sessão, autenticação e
    estado do canal), contanto que você copie **ambos** os locais:

    1. Instale o OpenClaw na nova máquina.
    2. Copie `$OPENCLAW_STATE_DIR` (padrão: `~/.openclaw`) da máquina antiga.
    3. Copie seu workspace (padrão: `~/.openclaw/workspace`).
    4. Execute `openclaw doctor` e reinicie o serviço do Gateway.

    Isso preserva a configuração, perfis de autenticação, credenciais do WhatsApp, sessões e memória. Se você estiver em
    modo remoto, lembre-se de que o host do gateway é o proprietário do armazenamento de sessões e do workspace.

    **Importante:** se você apenas fizer commit/push do seu workspace para o GitHub, estará fazendo
    backup de **memória + arquivos bootstrap**, mas **não** do histórico de sessões nem da autenticação. Eles ficam
    em `~/.openclaw/` (por exemplo, `~/.openclaw/agents/<agentId>/sessions/`).

    Relacionado: [Migração](/pt-BR/install/migrating), [Onde as coisas ficam no disco](#where-things-live-on-disk),
    [Workspace do agent](/pt-BR/concepts/agent-workspace), [Doctor](/pt-BR/gateway/doctor),
    [Modo remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Onde vejo as novidades da versão mais recente?">
    Consulte o changelog no GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    As entradas mais recentes ficam no topo. Se a seção superior estiver marcada como **Unreleased**, a próxima
    seção com data será a versão lançada mais recente. As entradas são agrupadas em **Highlights**, **Changes** e
    **Fixes** (além de seções de documentação/outras, quando necessário).

  </Accordion>

  <Accordion title="Não consigo acessar docs.openclaw.ai (erro de SSL)">
    Algumas conexões da Comcast/Xfinity bloqueiam incorretamente `docs.openclaw.ai` por meio do Xfinity
    Advanced Security. Desative-o ou adicione `docs.openclaw.ai` à allowlist e tente novamente.
    Ajude-nos a desbloqueá-lo informando aqui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Se você ainda não conseguir acessar o site, a documentação é espelhada no GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Diferença entre stable e beta">
    **Stable** e **beta** são **npm dist-tags**, não linhas de código separadas:

    - `latest` = estável
    - `beta` = build antecipado para testes

    Normalmente, uma versão estável chega primeiro em **beta** e depois uma etapa explícita
    de promoção move essa mesma versão para `latest`. Os mantenedores também podem
    publicar diretamente em `latest` quando necessário. É por isso que beta e stable podem
    apontar para a **mesma versão** após a promoção.

    Veja o que mudou:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Para one-liners de instalação e a diferença entre beta e dev, consulte o acordeão abaixo.

  </Accordion>

  <Accordion title="Como instalo a versão beta e qual é a diferença entre beta e dev?">
    **Beta** é a npm dist-tag `beta` (pode corresponder a `latest` após a promoção).
    **Dev** é a ponta móvel de `main` (git); quando publicado, usa a npm dist-tag `dev`.

    One-liners (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalador do Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Mais detalhes: [Canais de desenvolvimento](/pt-BR/install/development-channels) e [Flags do instalador](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="Como experimento os bits mais recentes?">
    Duas opções:

    1. **Canal dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    Isso muda para o branch `main` e atualiza a partir do código-fonte.

    2. **Instalação hackable (a partir do site do instalador):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Isso lhe dá um repositório local que você pode editar e depois atualizar via git.

    Se você preferir fazer manualmente um clone limpo, use:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentação: [Update](/cli/update), [Canais de desenvolvimento](/pt-BR/install/development-channels),
    [Install](/pt-BR/install).

  </Accordion>

  <Accordion title="Quanto tempo a instalação e o onboarding normalmente levam?">
    Guia aproximado:

    - **Instalação:** 2–5 minutos
    - **Onboarding:** 5–15 minutos, dependendo de quantos canais/modelos você configurar

    Se travar, use [Instalador travado](#quick-start-and-first-run-setup)
    e o loop rápido de depuração em [Estou travado](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Instalador travado? Como obtenho mais feedback?">
    Execute o instalador novamente com **saída detalhada**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalação beta com modo detalhado:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Para uma instalação hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Equivalente no Windows (PowerShell):

    ```powershell
    # install.ps1 ainda não tem uma flag -Verbose dedicada.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Mais opções: [Flags do instalador](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="A instalação no Windows diz git not found ou openclaw not recognized">
    Dois problemas comuns no Windows:

    **1) erro npm spawn git / git not found**

    - Instale o **Git for Windows** e certifique-se de que `git` esteja no seu PATH.
    - Feche e reabra o PowerShell e, em seguida, execute o instalador novamente.

    **2) openclaw is not recognized após a instalação**

    - Sua pasta global bin do npm não está no PATH.
    - Verifique o caminho:

      ```powershell
      npm config get prefix
      ```

    - Adicione esse diretório ao PATH do usuário (nenhum sufixo `\bin` é necessário no Windows; na maioria dos sistemas ele é `%AppData%\npm`).
    - Feche e reabra o PowerShell após atualizar o PATH.

    Se quiser a configuração mais tranquila no Windows, use **WSL2** em vez de Windows nativo.
    Documentação: [Windows](/pt-BR/platforms/windows).

  </Accordion>

  <Accordion title="A saída exec no Windows mostra texto em chinês embaralhado — o que devo fazer?">
    Isso geralmente é uma incompatibilidade de code page do console em shells nativos do Windows.

    Sintomas:

    - a saída de `system.run`/`exec` renderiza texto em chinês como mojibake
    - o mesmo comando parece correto em outro perfil de terminal

    Solução alternativa rápida no PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Em seguida, reinicie o Gateway e tente novamente o comando:

    ```powershell
    openclaw gateway restart
    ```

    Se você ainda reproduzir isso na versão mais recente do OpenClaw, acompanhe/informe em:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="A documentação não respondeu à minha pergunta — como consigo uma resposta melhor?">
    Use a **instalação hackable (git)** para ter o código-fonte completo e a documentação localmente e depois pergunte
    ao seu bot (ou Claude/Codex) _a partir dessa pasta_, para que ele possa ler o repositório e responder com precisão.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mais detalhes: [Install](/pt-BR/install) e [Flags do instalador](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="Como instalo o OpenClaw no Linux?">
    Resposta curta: siga o guia de Linux e depois execute o onboarding.

    - Caminho rápido no Linux + instalação do serviço: [Linux](/pt-BR/platforms/linux).
    - Passo a passo completo: [Primeiros passos](/pt-BR/start/getting-started).
    - Instalador + atualizações: [Instalação e atualizações](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="Como instalo o OpenClaw em uma VPS?">
    Qualquer VPS Linux funciona. Instale no servidor e depois use SSH/Tailscale para acessar o Gateway.

    Guias: [exe.dev](/pt-BR/install/exe-dev), [Hetzner](/pt-BR/install/hetzner), [Fly.io](/pt-BR/install/fly).
    Acesso remoto: [Gateway remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Onde estão os guias de instalação em nuvem/VPS?">
    Mantemos um **hub de hospedagem** com os provedores mais comuns. Escolha um e siga o guia:

    - [Hospedagem VPS](/pt-BR/vps) (todos os provedores em um só lugar)
    - [Fly.io](/pt-BR/install/fly)
    - [Hetzner](/pt-BR/install/hetzner)
    - [exe.dev](/pt-BR/install/exe-dev)

    Como funciona na nuvem: o **Gateway é executado no servidor**, e você o acessa
    do seu laptop/telefone via Control UI (ou Tailscale/SSH). Seu estado + workspace
    ficam no servidor, portanto trate o host como a fonte da verdade e faça backup dele.

    Você pode emparelhar **nodes** (Mac/iOS/Android/headless) com esse Gateway na nuvem para acessar
    tela/câmera/canvas locais ou executar comandos no seu laptop, mantendo o
    Gateway na nuvem.

    Hub: [Platforms](/pt-BR/platforms). Acesso remoto: [Gateway remoto](/pt-BR/gateway/remote).
    Nodes: [Nodes](/pt-BR/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Posso pedir ao OpenClaw para se atualizar sozinho?">
    Resposta curta: **é possível, mas não é recomendado**. O fluxo de atualização pode reiniciar o
    Gateway (o que derruba a sessão ativa), pode exigir um checkout git limpo e
    pode pedir confirmação. Mais seguro: execute as atualizações de um shell como operador.

    Use a CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Se você realmente precisar automatizar a partir de um agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentação: [Update](/cli/update), [Atualização](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="O que o onboarding realmente faz?">
    `openclaw onboard` é o caminho de configuração recomendado. No **modo local**, ele orienta você por:

    - **Configuração de modelo/autenticação** (OAuth do provedor, chaves de API, setup-token da Anthropic, além de opções de modelo local como LM Studio)
    - Local do **workspace** + arquivos bootstrap
    - **Configurações do Gateway** (bind/porta/autenticação/tailscale)
    - **Canais** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, além de plugins de canal incluídos, como QQ Bot)
    - **Instalação do daemon** (LaunchAgent no macOS; unidade de usuário systemd no Linux/WSL2)
    - **Verificações de integridade** e seleção de **Skills**

    Ele também avisa se o modelo configurado for desconhecido ou estiver sem autenticação.

  </Accordion>

  <Accordion title="Preciso de uma assinatura Claude ou OpenAI para executar isso?">
    Não. Você pode executar o OpenClaw com **chaves de API** (Anthropic/OpenAI/outras) ou com
    **modelos somente locais**, para que seus dados permaneçam no seu dispositivo. Assinaturas (Claude
    Pro/Max ou OpenAI Codex) são formas opcionais de autenticar esses provedores.

    Para Anthropic no OpenClaw, a divisão prática é:

    - **Chave de API Anthropic**: cobrança normal da API da Anthropic
    - **Autenticação do Claude CLI / assinatura Claude no OpenClaw**: a equipe da Anthropic
      nos disse que esse uso voltou a ser permitido, e o OpenClaw está tratando o uso de `claude -p`
      como autorizado para essa integração, a menos que a Anthropic publique uma nova
      política

    Para hosts de gateway de longa duração, as chaves de API da Anthropic ainda são a
    configuração mais previsível. O OAuth do OpenAI Codex é explicitamente compatível com
    ferramentas externas como o OpenClaw.

    O OpenClaw também oferece suporte a outras opções hospedadas no estilo assinatura, incluindo
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** e
    **Z.AI / GLM Coding Plan**.

    Documentação: [Anthropic](/pt-BR/providers/anthropic), [OpenAI](/pt-BR/providers/openai),
    [Qwen Cloud](/pt-BR/providers/qwen),
    [MiniMax](/pt-BR/providers/minimax), [Modelos GLM](/pt-BR/providers/glm),
    [Modelos locais](/pt-BR/gateway/local-models), [Models](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Posso usar a assinatura Claude Max sem uma chave de API?">
    Sim.

    A equipe da Anthropic nos informou que o uso do Claude CLI no estilo OpenClaw voltou a ser permitido, então
    o OpenClaw trata a autenticação por assinatura Claude e o uso de `claude -p` como autorizados
    para essa integração, a menos que a Anthropic publique uma nova política. Se você quiser
    a configuração no lado do servidor mais previsível, use uma chave de API da Anthropic.

  </Accordion>

  <Accordion title="Vocês oferecem suporte à autenticação por assinatura Claude (Claude Pro ou Max)?">
    Sim.

    A equipe da Anthropic nos informou que esse uso voltou a ser permitido, então o OpenClaw trata
    a reutilização do Claude CLI e o uso de `claude -p` como autorizados para esta integração,
    a menos que a Anthropic publique uma nova política.

    O setup-token da Anthropic ainda está disponível como um caminho de token compatível no OpenClaw, mas o OpenClaw agora prefere a reutilização do Claude CLI e `claude -p` quando disponíveis.
    Para cargas de trabalho de produção ou multiusuário, a autenticação com chave de API da Anthropic ainda é a
    opção mais segura e previsível. Se você quiser outras opções hospedadas no estilo assinatura
    no OpenClaw, consulte [OpenAI](/pt-BR/providers/openai), [Qwen / Model
    Cloud](/pt-BR/providers/qwen), [MiniMax](/pt-BR/providers/minimax) e [Modelos
    GLM](/pt-BR/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Por que estou vendo HTTP 429 rate_limit_error da Anthropic?">
Isso significa que sua **cota/limite de taxa da Anthropic** foi esgotada na janela atual. Se você
usar **Claude CLI**, aguarde a janela ser redefinida ou faça upgrade do seu plano. Se você
usar uma **chave de API da Anthropic**, verifique o Console da Anthropic
quanto a uso/faturamento e aumente os limites conforme necessário.

    Se a mensagem for especificamente:
    `Extra usage is required for long context requests`, a solicitação está tentando usar
    o beta de contexto de 1M da Anthropic (`context1m: true`). Isso só funciona quando sua
    credencial é elegível para faturamento de contexto longo (faturamento por chave de API ou o
    caminho de login Claude do OpenClaw com Extra Usage ativado).

    Dica: defina um **modelo de fallback** para que o OpenClaw possa continuar respondendo enquanto um provedor estiver limitado por taxa.
    Consulte [Models](/cli/models), [OAuth](/pt-BR/concepts/oauth) e
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pt-BR/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock é compatível?">
    Sim. O OpenClaw tem um provedor incluído **Amazon Bedrock (Converse)**. Com marcadores de ambiente AWS presentes, o OpenClaw pode descobrir automaticamente o catálogo Bedrock de streaming/texto e mesclá-lo como um provedor implícito `amazon-bedrock`; caso contrário, você pode ativar explicitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` ou adicionar uma entrada de provedor manual. Consulte [Amazon Bedrock](/pt-BR/providers/bedrock) e [Provedores de modelo](/pt-BR/providers/models). Se preferir um fluxo de chave gerenciado, um proxy compatível com OpenAI na frente do Bedrock continua sendo uma opção válida.
  </Accordion>

  <Accordion title="Como funciona a autenticação do Codex?">
    O OpenClaw oferece suporte a **OpenAI Code (Codex)** via OAuth (login do ChatGPT). O onboarding pode executar o fluxo OAuth e definirá o modelo padrão como `openai-codex/gpt-5.4` quando apropriado. Consulte [Provedores de modelo](/pt-BR/concepts/model-providers) e [Onboarding (CLI)](/pt-BR/start/wizard).
  </Accordion>

  <Accordion title="Por que o GPT-5.4 do ChatGPT não desbloqueia openai/gpt-5.4 no OpenClaw?">
    O OpenClaw trata as duas rotas separadamente:

    - `openai-codex/gpt-5.4` = OAuth do ChatGPT/Codex
    - `openai/gpt-5.4` = API direta da OpenAI Platform

    No OpenClaw, o login do ChatGPT/Codex é ligado à rota `openai-codex/*`,
    não à rota direta `openai/*`. Se você quiser o caminho da API direta no
    OpenClaw, defina `OPENAI_API_KEY` (ou a configuração equivalente do provedor OpenAI).
    Se você quiser login do ChatGPT/Codex no OpenClaw, use `openai-codex/*`.

  </Accordion>

  <Accordion title="Por que os limites do OAuth do Codex podem ser diferentes do ChatGPT web?">
    `openai-codex/*` usa a rota OAuth do Codex, e suas janelas de cota utilizáveis são
    gerenciadas pela OpenAI e dependem do plano. Na prática, esses limites podem ser diferentes da
    experiência no site/app do ChatGPT, mesmo quando ambos estão vinculados à mesma conta.

    O OpenClaw pode mostrar as janelas de uso/cota atualmente visíveis do provedor em
    `openclaw models status`, mas ele não inventa nem normaliza permissões do ChatGPT web
    para acesso direto à API. Se você quiser o caminho direto de faturamento/limite da OpenAI Platform,
    use `openai/*` com uma chave de API.

  </Accordion>

  <Accordion title="Vocês oferecem suporte à autenticação por assinatura OpenAI (OAuth do Codex)?">
    Sim. O OpenClaw oferece suporte completo a **OAuth por assinatura do OpenAI Code (Codex)**.
    A OpenAI permite explicitamente o uso de OAuth por assinatura em ferramentas/fluxos de trabalho externos
    como o OpenClaw. O onboarding pode executar o fluxo OAuth para você.

    Consulte [OAuth](/pt-BR/concepts/oauth), [Provedores de modelo](/pt-BR/concepts/model-providers) e [Onboarding (CLI)](/pt-BR/start/wizard).

  </Accordion>

  <Accordion title="Como configuro o OAuth do Gemini CLI?">
    O Gemini CLI usa um **fluxo de autenticação de plugin**, não um client id ou secret em `openclaw.json`.

    Etapas:

    1. Instale o Gemini CLI localmente para que `gemini` esteja no `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Ative o plugin: `openclaw plugins enable google`
    3. Faça login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modelo padrão após o login: `google-gemini-cli/gemini-3-flash-preview`
    5. Se as solicitações falharem, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do gateway

    Isso armazena tokens OAuth em perfis de autenticação no host do gateway. Detalhes: [Provedores de modelo](/pt-BR/concepts/model-providers).

  </Accordion>

  <Accordion title="Um modelo local é adequado para chats casuais?">
    Normalmente não. O OpenClaw precisa de contexto grande + segurança forte; modelos pequenos truncam e vazam. Se for realmente necessário, execute localmente a **maior** build de modelo que conseguir (LM Studio) e consulte [/gateway/local-models](/pt-BR/gateway/local-models). Modelos menores/quantizados aumentam o risco de prompt injection — consulte [Segurança](/pt-BR/gateway/security).
  </Accordion>

  <Accordion title="Como mantenho o tráfego do modelo hospedado em uma região específica?">
    Escolha endpoints fixados por região. O OpenRouter expõe opções hospedadas nos EUA para MiniMax, Kimi e GLM; escolha a variante hospedada nos EUA para manter os dados na região. Você ainda pode listar Anthropic/OpenAI junto com esses usando `models.mode: "merge"` para que os fallbacks continuem disponíveis enquanto respeitam o provedor regional que você selecionar.
  </Accordion>

  <Accordion title="Preciso comprar um Mac Mini para instalar isso?">
    Não. O OpenClaw é executado em macOS ou Linux (Windows via WSL2). Um Mac mini é opcional — algumas pessoas
    compram um como host sempre ativo, mas uma VPS pequena, servidor doméstico ou máquina da classe Raspberry Pi também funciona.

    Você só precisa de um Mac **para ferramentas exclusivas do macOS**. Para iMessage, use [BlueBubbles](/pt-BR/channels/bluebubbles) (recomendado) — o servidor BlueBubbles roda em qualquer Mac, e o Gateway pode rodar em Linux ou em outro lugar. Se você quiser outras ferramentas exclusivas do macOS, execute o Gateway em um Mac ou emparelhe um node macOS.

    Documentação: [BlueBubbles](/pt-BR/channels/bluebubbles), [Nodes](/pt-BR/nodes), [Modo remoto no Mac](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Preciso de um Mac mini para ter suporte a iMessage?">
    Você precisa de **algum dispositivo macOS** conectado ao Mensagens. **Não** precisa ser um Mac mini —
    qualquer Mac serve. **Use [BlueBubbles](/pt-BR/channels/bluebubbles)** (recomendado) para iMessage — o servidor BlueBubbles roda no macOS, enquanto o Gateway pode rodar em Linux ou em outro lugar.

    Configurações comuns:

    - Execute o Gateway em Linux/VPS e o servidor BlueBubbles em qualquer Mac conectado ao Mensagens.
    - Execute tudo no Mac se quiser a configuração mais simples em uma única máquina.

    Documentação: [BlueBubbles](/pt-BR/channels/bluebubbles), [Nodes](/pt-BR/nodes),
    [Modo remoto no Mac](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se eu comprar um Mac mini para executar o OpenClaw, posso conectá-lo ao meu MacBook Pro?">
    Sim. O **Mac mini pode executar o Gateway**, e seu MacBook Pro pode se conectar como um
    **node** (dispositivo complementar). Nodes não executam o Gateway — eles fornecem capacidades extras
    como tela/câmera/canvas e `system.run` naquele dispositivo.

    Padrão comum:

    - Gateway no Mac mini (sempre ativo).
    - O MacBook Pro executa o app macOS ou um host de node e se emparelha com o Gateway.
    - Use `openclaw nodes status` / `openclaw nodes list` para vê-lo.

    Documentação: [Nodes](/pt-BR/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Posso usar Bun?">
    Bun **não é recomendado**. Vemos bugs de tempo de execução, especialmente com WhatsApp e Telegram.
    Use **Node** para gateways estáveis.

    Se você ainda quiser experimentar Bun, faça isso em um gateway não produtivo
    sem WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: o que vai em allowFrom?">
    `channels.telegram.allowFrom` é **o ID de usuário do Telegram do remetente humano** (numérico). Não é o nome de usuário do bot.

    A configuração solicita apenas IDs de usuário numéricos. Se você já tiver entradas legadas `@username` na configuração, `openclaw doctor --fix` pode tentar resolvê-las.

    Mais seguro (sem bot de terceiros):

    - Envie uma DM para seu bot e depois execute `openclaw logs --follow` e leia `from.id`.

    API oficial do Bot:

    - Envie uma DM para seu bot e depois chame `https://api.telegram.org/bot<bot_token>/getUpdates` e leia `message.from.id`.

    Terceiros (menos privado):

    - Envie uma DM para `@userinfobot` ou `@getidsbot`.

    Consulte [/channels/telegram](/pt-BR/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Várias pessoas podem usar um número de WhatsApp com instâncias diferentes do OpenClaw?">
    Sim, via **roteamento multi-agent**. Vincule a **DM** do WhatsApp de cada remetente (peer `kind: "direct"`, remetente E.164 como `+15551234567`) a um `agentId` diferente, para que cada pessoa tenha seu próprio workspace e armazenamento de sessões. As respostas ainda virão da **mesma conta do WhatsApp**, e o controle de acesso a DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) é global por conta de WhatsApp. Consulte [Roteamento multi-agent](/pt-BR/concepts/multi-agent) e [WhatsApp](/pt-BR/channels/whatsapp).
  </Accordion>

  <Accordion title='Posso executar um agent de "chat rápido" e um agent de "Opus para programação"?'>
    Sim. Use roteamento multi-agent: dê a cada agent seu próprio modelo padrão e depois vincule as rotas de entrada (conta do provedor ou peers específicos) a cada agent. Um exemplo de configuração está em [Roteamento multi-agent](/pt-BR/concepts/multi-agent). Consulte também [Models](/pt-BR/concepts/models) e [Configuração](/pt-BR/gateway/configuration).
  </Accordion>

  <Accordion title="O Homebrew funciona no Linux?">
    Sim. O Homebrew oferece suporte a Linux (Linuxbrew). Configuração rápida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Se você executar o OpenClaw via systemd, certifique-se de que o PATH do serviço inclua `/home/linuxbrew/.linuxbrew/bin` (ou seu prefixo brew) para que as ferramentas instaladas com `brew` sejam resolvidas em shells sem login.
    Builds recentes também prefixam diretórios bin comuns de usuário em serviços Linux systemd (por exemplo `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) e respeitam `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando definidos.

  </Accordion>

  <Accordion title="Diferença entre a instalação hackable por git e npm install">
    - **Instalação hackable (git):** checkout completo do código-fonte, editável, melhor para contribuidores.
      Você executa builds localmente e pode corrigir código/documentação.
    - **npm install:** instalação global da CLI, sem repositório, melhor para "só executar".
      As atualizações vêm das npm dist-tags.

    Documentação: [Primeiros passos](/pt-BR/start/getting-started), [Atualização](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="Posso alternar entre instalações npm e git depois?">
    Sim. Instale a outra variante e depois execute o Doctor para que o serviço do gateway aponte para o novo entrypoint.
    Isso **não exclui seus dados** — apenas altera a instalação do código do OpenClaw. Seu estado
    (`~/.openclaw`) e workspace (`~/.openclaw/workspace`) permanecem intactos.

    De npm para git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    De git para npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    O Doctor detecta uma incompatibilidade no entrypoint do serviço do gateway e oferece reescrever a configuração do serviço para corresponder à instalação atual (use `--repair` em automações).

    Dicas de backup: consulte [Estratégia de backup](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Devo executar o Gateway no meu laptop ou em uma VPS?">
    Resposta curta: **se você quer confiabilidade 24/7, use uma VPS**. Se você quer o
    menor atrito e não se importa com suspensão/reinicializações, execute localmente.

    **Laptop (Gateway local)**

    - **Prós:** sem custo de servidor, acesso direto a arquivos locais, janela do navegador visível em tempo real.
    - **Contras:** suspensão/quedas de rede = desconexões, atualizações/reinicializações do SO interrompem, a máquina precisa permanecer ativa.

    **VPS / nuvem**

    - **Prós:** sempre ativo, rede estável, sem problemas com suspensão do laptop, mais fácil de manter em execução.
    - **Contras:** geralmente roda headless (use capturas de tela), acesso apenas a arquivos remotos, você precisa usar SSH para atualizações.

    **Observação específica do OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funcionam bem em uma VPS. A única troca real é **navegador headless** vs uma janela visível. Consulte [Browser](/pt-BR/tools/browser).

    **Padrão recomendado:** VPS se você já teve desconexões do gateway antes. Local é ótimo quando você está usando ativamente o Mac e quer acesso a arquivos locais ou automação de UI com um navegador visível.

  </Accordion>

  <Accordion title="Quão importante é executar o OpenClaw em uma máquina dedicada?">
    Não é obrigatório, mas **é recomendado para confiabilidade e isolamento**.

    - **Host dedicado (VPS/Mac mini/Pi):** sempre ativo, menos interrupções por suspensão/reinicialização, permissões mais limpas, mais fácil de manter em execução.
    - **Laptop/desktop compartilhado:** totalmente aceitável para testes e uso ativo, mas espere pausas quando a máquina suspender ou atualizar.

    Se você quiser o melhor dos dois mundos, mantenha o Gateway em um host dedicado e emparelhe seu laptop como um **node** para ferramentas locais de tela/câmera/exec. Consulte [Nodes](/pt-BR/nodes).
    Para orientações de segurança, leia [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Quais são os requisitos mínimos de VPS e o SO recomendado?">
    O OpenClaw é leve. Para um Gateway básico + um canal de chat:

    - **Mínimo absoluto:** 1 vCPU, 1GB de RAM, ~500MB de disco.
    - **Recomendado:** 1–2 vCPU, 2GB de RAM ou mais para folga (logs, mídia, múltiplos canais). Ferramentas de Node e automação de navegador podem exigir muitos recursos.

    SO: use **Ubuntu LTS** (ou qualquer Debian/Ubuntu moderno). O caminho de instalação no Linux é mais bem testado nele.

    Documentação: [Linux](/pt-BR/platforms/linux), [Hospedagem VPS](/pt-BR/vps).

  </Accordion>

  <Accordion title="Posso executar o OpenClaw em uma VM e quais são os requisitos?">
    Sim. Trate uma VM da mesma forma que uma VPS: ela precisa estar sempre ativa, acessível e ter
    RAM suficiente para o Gateway e quaisquer canais que você habilitar.

    Orientação básica:

    - **Mínimo absoluto:** 1 vCPU, 1GB de RAM.
    - **Recomendado:** 2GB de RAM ou mais se você executar múltiplos canais, automação de navegador ou ferramentas de mídia.
    - **SO:** Ubuntu LTS ou outro Debian/Ubuntu moderno.

    Se você estiver no Windows, **WSL2 é a configuração no estilo VM mais fácil** e tem a melhor
    compatibilidade de ferramentas. Consulte [Windows](/pt-BR/platforms/windows), [Hospedagem VPS](/pt-BR/vps).
    Se você estiver executando macOS em uma VM, consulte [VM macOS](/pt-BR/install/macos-vm).

  </Accordion>
</AccordionGroup>

## O que é o OpenClaw?

<AccordionGroup>
  <Accordion title="O que é o OpenClaw, em um parágrafo?">
    OpenClaw é um assistente pessoal de IA que você executa em seus próprios dispositivos. Ele responde nas superfícies de mensagens que você já usa (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat e plugins de canal incluídos, como QQ Bot) e também pode fazer voz + um Canvas ao vivo em plataformas compatíveis. O **Gateway** é o plano de controle sempre ativo; o assistente é o produto.
  </Accordion>

  <Accordion title="Proposta de valor">
    O OpenClaw não é "apenas um wrapper do Claude". É um **plano de controle local-first** que permite executar um
    assistente capaz em **seu próprio hardware**, acessível pelos aplicativos de chat que você já usa, com
    sessões com estado, memória e ferramentas — sem entregar o controle dos seus fluxos de trabalho a um
    SaaS hospedado.

    Destaques:

    - **Seus dispositivos, seus dados:** execute o Gateway onde quiser (Mac, Linux, VPS) e mantenha o
      workspace + histórico de sessão locais.
    - **Canais reais, não uma sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc.,
      além de voz móvel e Canvas em plataformas compatíveis.
    - **Agnóstico a modelo:** use Anthropic, OpenAI, MiniMax, OpenRouter etc., com roteamento por agent
      e failover.
    - **Opção somente local:** execute modelos locais para que **todos os dados possam permanecer no seu dispositivo** se quiser.
    - **Roteamento multi-agent:** agents separados por canal, conta ou tarefa, cada um com seu próprio
      workspace e padrões.
    - **Open source e hackable:** inspecione, estenda e faça self-host sem lock-in de fornecedor.

    Documentação: [Gateway](/pt-BR/gateway), [Channels](/pt-BR/channels), [Multi-agent](/pt-BR/concepts/multi-agent),
    [Memory](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Acabei de configurar — o que devo fazer primeiro?">
    Bons primeiros projetos:

    - Criar um site (WordPress, Shopify ou um site estático simples).
    - Prototipar um app mobile (estrutura, telas, plano de API).
    - Organizar arquivos e pastas (limpeza, nomenclatura, etiquetagem).
    - Conectar o Gmail e automatizar resumos ou acompanhamentos.

    Ele consegue lidar com tarefas grandes, mas funciona melhor quando você as divide em fases e
    usa sub-agents para trabalho em paralelo.

  </Accordion>

  <Accordion title="Quais são os cinco principais casos de uso cotidianos do OpenClaw?">
    Ganhos cotidianos geralmente se parecem com isto:

    - **Briefings pessoais:** resumos da caixa de entrada, calendário e notícias que importam para você.
    - **Pesquisa e redação:** pesquisa rápida, resumos e primeiros rascunhos de e-mails ou documentos.
    - **Lembretes e acompanhamentos:** nudges e checklists orientados por cron ou Heartbeat.
    - **Automação de navegador:** preencher formulários, coletar dados e repetir tarefas na web.
    - **Coordenação entre dispositivos:** envie uma tarefa do seu telefone, deixe o Gateway executá-la em um servidor e receba o resultado de volta no chat.

  </Accordion>

  <Accordion title="O OpenClaw pode ajudar com lead gen, outreach, anúncios e blogs para um SaaS?">
    Sim para **pesquisa, qualificação e redação**. Ele pode examinar sites, montar shortlists,
    resumir prospects e escrever rascunhos de outreach ou de textos de anúncios.

    Para **outreach ou execução de anúncios**, mantenha um humano no circuito. Evite spam, siga as leis locais e
    as políticas da plataforma e revise tudo antes de enviar. O padrão mais seguro é deixar o
    OpenClaw redigir e você aprovar.

    Documentação: [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Quais são as vantagens em relação ao Claude Code para desenvolvimento web?">
    O OpenClaw é um **assistente pessoal** e uma camada de coordenação, não um substituto de IDE. Use
    Claude Code ou Codex para o loop de programação direta mais rápido dentro de um repositório. Use OpenClaw quando quiser
    memória durável, acesso entre dispositivos e orquestração de ferramentas.

    Vantagens:

    - **Memória + workspace persistentes** entre sessões
    - **Acesso multiplataforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orquestração de ferramentas** (navegador, arquivos, agendamento, hooks)
    - **Gateway sempre ativo** (execute em uma VPS, interaja de qualquer lugar)
    - **Nodes** para navegador/tela/câmera/exec locais

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills e automação

<AccordionGroup>
  <Accordion title="Como personalizo Skills sem manter o repositório sujo?">
    Use substituições gerenciadas em vez de editar a cópia do repositório. Coloque suas alterações em `~/.openclaw/skills/<name>/SKILL.md` (ou adicione uma pasta via `skills.load.extraDirs` em `~/.openclaw/openclaw.json`). A precedência é `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluídos → `skills.load.extraDirs`, então as substituições gerenciadas ainda têm prioridade sobre as Skills incluídas sem tocar no git. Se você precisar que a Skill seja instalada globalmente, mas visível apenas para alguns agents, mantenha a cópia compartilhada em `~/.openclaw/skills` e controle a visibilidade com `agents.defaults.skills` e `agents.list[].skills`. Apenas edições dignas de upstream devem ficar no repositório e sair como PRs.
  </Accordion>

  <Accordion title="Posso carregar Skills de uma pasta personalizada?">
    Sim. Adicione diretórios extras por meio de `skills.load.extraDirs` em `~/.openclaw/openclaw.json` (menor precedência). A precedência padrão é `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluídos → `skills.load.extraDirs`. O `clawhub` instala em `./skills` por padrão, que o OpenClaw trata como `<workspace>/skills` na próxima sessão. Se a Skill só deve ser visível para determinados agents, combine isso com `agents.defaults.skills` ou `agents.list[].skills`.
  </Accordion>

  <Accordion title="Como posso usar modelos diferentes para tarefas diferentes?">
    Hoje, os padrões compatíveis são:

    - **Jobs Cron**: jobs isolados podem definir uma substituição `model` por job.
    - **Sub-agents**: roteie tarefas para agents separados com modelos padrão diferentes.
    - **Troca sob demanda**: use `/model` para trocar o modelo da sessão atual a qualquer momento.

    Consulte [Jobs Cron](/pt-BR/automation/cron-jobs), [Roteamento multi-agent](/pt-BR/concepts/multi-agent) e [Comandos slash](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="O bot congela ao fazer trabalho pesado. Como descarrego isso?">
    Use **sub-agents** para tarefas longas ou paralelas. Os sub-agents são executados em sua própria sessão,
    retornam um resumo e mantêm seu chat principal responsivo.

    Peça ao seu bot para "iniciar um sub-agent para esta tarefa" ou use `/subagents`.
    Use `/status` no chat para ver o que o Gateway está fazendo neste momento (e se está ocupado).

    Dica sobre tokens: tarefas longas e sub-agents consomem tokens. Se o custo for uma preocupação, defina um
    modelo mais barato para sub-agents via `agents.defaults.subagents.model`.

    Documentação: [Sub-agents](/pt-BR/tools/subagents), [Tarefas em segundo plano](/pt-BR/automation/tasks).

  </Accordion>

  <Accordion title="Como funcionam as sessões de subagent vinculadas a thread no Discord?">
    Use vinculações de thread. Você pode vincular uma thread do Discord a um subagent ou alvo de sessão para que as mensagens de acompanhamento nessa thread permaneçam nessa sessão vinculada.

    Fluxo básico:

    - Inicie com `sessions_spawn` usando `thread: true` (e opcionalmente `mode: "session"` para acompanhamento persistente).
    - Ou vincule manualmente com `/focus <target>`.
    - Use `/agents` para inspecionar o estado da vinculação.
    - Use `/session idle <duration|off>` e `/session max-age <duration|off>` para controlar o desfoco automático.
    - Use `/unfocus` para desvincular a thread.

    Configuração obrigatória:

    - Padrões globais: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Substituições do Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Vinculação automática ao iniciar: defina `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Documentação: [Sub-agents](/pt-BR/tools/subagents), [Discord](/pt-BR/channels/discord), [Referência de configuração](/pt-BR/gateway/configuration-reference), [Comandos slash](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Um subagent terminou, mas a atualização de conclusão foi para o lugar errado ou nunca foi publicada. O que devo verificar?">
    Verifique primeiro a rota do solicitante resolvida:

    - A entrega de subagent no modo de conclusão prefere qualquer thread vinculada ou rota de conversa quando existir.
    - Se a origem da conclusão trouxer apenas um canal, o OpenClaw recorre à rota armazenada da sessão do solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda possa funcionar.
    - Se não existir nem uma rota vinculada nem uma rota armazenada utilizável, a entrega direta pode falhar e o resultado recorre à entrega enfileirada da sessão em vez de ser publicado imediatamente no chat.
    - Alvos inválidos ou obsoletos ainda podem forçar o fallback para fila ou a falha da entrega final.
    - Se a última resposta visível do assistente filho for exatamente o token silencioso `NO_REPLY` / `no_reply`, ou exatamente `ANNOUNCE_SKIP`, o OpenClaw suprime intencionalmente o anúncio em vez de publicar um progresso anterior obsoleto.
    - Se o filho expirar após apenas chamadas de ferramenta, o anúncio pode condensar isso em um breve resumo de progresso parcial em vez de reproduzir a saída bruta das ferramentas.

    Depuração:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentação: [Sub-agents](/pt-BR/tools/subagents), [Tarefas em segundo plano](/pt-BR/automation/tasks), [Ferramentas de sessão](/pt-BR/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron ou lembretes não disparam. O que devo verificar?">
    O Cron é executado dentro do processo do Gateway. Se o Gateway não estiver em execução contínua,
    os jobs agendados não serão executados.

    Checklist:

    - Confirme que o Cron está ativado (`cron.enabled`) e que `OPENCLAW_SKIP_CRON` não está definido.
    - Verifique se o Gateway está em execução 24/7 (sem suspensão/reinicializações).
    - Verifique as configurações de fuso horário para o job (`--tz` vs fuso horário do host).

    Depuração:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentação: [Jobs Cron](/pt-BR/automation/cron-jobs), [Automação & Tarefas](/pt-BR/automation).

  </Accordion>

  <Accordion title="O Cron disparou, mas nada foi enviado para o canal. Por quê?">
    Verifique primeiro o modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"` significa que nenhuma mensagem externa é esperada.
    - Alvo de anúncio ausente ou inválido (`channel` / `to`) significa que o executor ignorou a entrega de saída.
    - Falhas de autenticação do canal (`unauthorized`, `Forbidden`) significam que o executor tentou entregar, mas as credenciais bloquearam.
    - Um resultado isolado silencioso (`NO_REPLY` / `no_reply` apenas) é tratado como intencionalmente não entregável, então o executor também suprime a entrega de fallback enfileirada.

    Para jobs Cron isolados, o executor é o responsável pela entrega final. Espera-se
    que o agent retorne um resumo em texto simples para o executor enviar. `--no-deliver` mantém
    esse resultado interno; ele não permite que o agent envie diretamente com a
    ferramenta de mensagem.

    Depuração:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentação: [Jobs Cron](/pt-BR/automation/cron-jobs), [Tarefas em segundo plano](/pt-BR/automation/tasks).

  </Accordion>

  <Accordion title="Por que uma execução Cron isolada trocou de modelo ou tentou novamente uma vez?">
    Isso geralmente é o caminho de troca de modelo ao vivo, não um agendamento duplicado.

    O Cron isolado pode persistir uma transferência de modelo em tempo de execução e tentar novamente quando a
    execução ativa lançar `LiveSessionModelSwitchError`. A nova tentativa mantém o
    provedor/modelo trocado e, se a troca trouxe uma nova substituição de perfil de autenticação, o Cron
    também a persiste antes de tentar novamente.

    Regras de seleção relacionadas:

    - A substituição de modelo do hook do Gmail vence primeiro, quando aplicável.
    - Depois, `model` por job.
    - Depois, qualquer substituição de modelo armazenada da sessão cron.
    - Depois, a seleção normal de modelo padrão/do agent.

    O loop de nova tentativa é limitado. Após a tentativa inicial mais 2 novas tentativas de troca,
    o Cron aborta em vez de entrar em loop para sempre.

    Depuração:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentação: [Jobs Cron](/pt-BR/automation/cron-jobs), [CLI do cron](/cli/cron).

  </Accordion>

  <Accordion title="Como instalo Skills no Linux?">
    Use os comandos nativos `openclaw skills` ou coloque Skills no seu workspace. A UI de Skills do macOS não está disponível no Linux.
    Navegue pelas Skills em [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    A instalação nativa com `openclaw skills install` grava no diretório `skills/`
    do workspace ativo. Instale a CLI `clawhub` separada apenas se quiser publicar ou
    sincronizar suas próprias Skills. Para instalações compartilhadas entre agents, coloque a Skill em
    `~/.openclaw/skills` e use `agents.defaults.skills` ou
    `agents.list[].skills` se quiser restringir quais agents podem vê-la.

  </Accordion>

  <Accordion title="O OpenClaw pode executar tarefas em uma agenda ou continuamente em segundo plano?">
    Sim. Use o agendador do Gateway:

    - **Jobs Cron** para tarefas agendadas ou recorrentes (persistem após reinicializações).
    - **Heartbeat** para verificações periódicas da "sessão principal".
    - **Jobs isolados** para agents autônomos que publicam resumos ou entregam em chats.

    Documentação: [Jobs Cron](/pt-BR/automation/cron-jobs), [Automação & Tarefas](/pt-BR/automation),
    [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>

  <Accordion title="Posso executar Skills exclusivas do Apple macOS a partir do Linux?">
    Não diretamente. As Skills do macOS são controladas por `metadata.openclaw.os` mais binários obrigatórios, e as Skills só aparecem no prompt do sistema quando são elegíveis no **host do Gateway**. No Linux, Skills exclusivas de `darwin` (como `apple-notes`, `apple-reminders`, `things-mac`) não serão carregadas a menos que você substitua esse controle.

    Você tem três padrões compatíveis:

    **Opção A - executar o Gateway em um Mac (mais simples).**
    Execute o Gateway onde os binários do macOS existirem e depois conecte-se a partir do Linux em [modo remoto](#gateway-ports-already-running-and-remote-mode) ou via Tailscale. As Skills são carregadas normalmente porque o host do Gateway é macOS.

    **Opção B - usar um node macOS (sem SSH).**
    Execute o Gateway no Linux, emparelhe um node macOS (app de barra de menu) e defina **Node Run Commands** como "Always Ask" ou "Always Allow" no Mac. O OpenClaw pode tratar Skills exclusivas do macOS como elegíveis quando os binários exigidos existirem no node. O agent executa essas Skills por meio da ferramenta `nodes`. Se você escolher "Always Ask", aprovar "Always Allow" no prompt adiciona esse comando à allowlist.

    **Opção C - fazer proxy de binários do macOS por SSH (avançado).**
    Mantenha o Gateway no Linux, mas faça com que os binários CLI exigidos sejam resolvidos para wrappers SSH executados em um Mac. Depois substitua a Skill para permitir Linux, para que ela permaneça elegível.

    1. Crie um wrapper SSH para o binário (exemplo: `memo` para Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Coloque o wrapper no `PATH` no host Linux (por exemplo `~/bin/memo`).
    3. Substitua os metadados da Skill (workspace ou `~/.openclaw/skills`) para permitir Linux:

       ```markdown
       ---
       name: apple-notes
       description: Gerencie Apple Notes por meio da CLI memo no macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Inicie uma nova sessão para que o snapshot de Skills seja atualizado.

  </Accordion>

  <Accordion title="Vocês têm integração com Notion ou HeyGen?">
    Não integrada nativamente no momento.

    Opções:

    - **Skill / Plugin personalizado:** melhor para acesso confiável à API (Notion/HeyGen têm APIs).
    - **Automação de navegador:** funciona sem código, mas é mais lenta e mais frágil.

    Se você quiser manter contexto por cliente (fluxos de trabalho de agência), um padrão simples é:

    - Uma página do Notion por cliente (contexto + preferências + trabalho ativo).
    - Pedir ao agent para buscar essa página no início de uma sessão.

    Se você quiser uma integração nativa, abra uma solicitação de funcionalidade ou crie uma Skill
    voltada para essas APIs.

    Instale Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Instalações nativas chegam ao diretório `skills/` do workspace ativo. Para Skills compartilhadas entre agents, coloque-as em `~/.openclaw/skills/<name>/SKILL.md`. Se apenas alguns agents devem ver uma instalação compartilhada, configure `agents.defaults.skills` ou `agents.list[].skills`. Algumas Skills esperam binários instalados via Homebrew; no Linux isso significa Linuxbrew (consulte a entrada de FAQ do Homebrew no Linux acima). Consulte [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config) e [ClawHub](/pt-BR/tools/clawhub).

  </Accordion>

  <Accordion title="Como uso meu Chrome já conectado com o OpenClaw?">
    Use o perfil de navegador integrado `user`, que se conecta por meio do Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Se você quiser um nome personalizado, crie um perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Esse caminho pode usar o navegador do host local ou um node de navegador conectado. Se o Gateway estiver em outro lugar, execute um host de node na máquina do navegador ou use CDP remoto.

    Limites atuais em `existing-session` / `user`:

    - as ações são guiadas por ref, não por seletor CSS
    - uploads exigem `ref` / `inputRef` e atualmente aceitam um arquivo por vez
    - `responsebody`, exportação de PDF, interceptação de download e ações em lote ainda exigem um navegador gerenciado ou um perfil CDP bruto

  </Accordion>
</AccordionGroup>

## Sandbox e memória

<AccordionGroup>
  <Accordion title="Existe uma documentação dedicada para sandboxing?">
    Sim. Consulte [Sandboxing](/pt-BR/gateway/sandboxing). Para configuração específica de Docker (gateway completo em Docker ou imagens de sandbox), consulte [Docker](/pt-BR/install/docker).
  </Accordion>

  <Accordion title="O Docker parece limitado — como habilito os recursos completos?">
    A imagem padrão prioriza segurança e é executada como o usuário `node`, então ela não
    inclui pacotes de sistema, Homebrew nem navegadores incluídos. Para uma configuração mais completa:

    - Persista `/home/node` com `OPENCLAW_HOME_VOLUME` para que os caches sobrevivam.
    - Incorpore dependências de sistema na imagem com `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instale navegadores Playwright pela CLI incluída:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Defina `PLAYWRIGHT_BROWSERS_PATH` e garanta que o caminho seja persistido.

    Documentação: [Docker](/pt-BR/install/docker), [Browser](/pt-BR/tools/browser).

  </Accordion>

  <Accordion title="Posso manter DMs pessoais, mas tornar grupos públicos/em sandbox com um único agent?">
    Sim — se seu tráfego privado for **DMs** e seu tráfego público for **grupos**.

    Use `agents.defaults.sandbox.mode: "non-main"` para que sessões de grupo/canal (chaves não principais) sejam executadas em Docker, enquanto a sessão principal de DM permanece no host. Depois restrinja quais ferramentas ficam disponíveis nas sessões em sandbox via `tools.sandbox.tools`.

    Passo a passo de configuração + exemplo: [Grupos: DMs pessoais + grupos públicos](/pt-BR/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referência de configuração principal: [Configuração do Gateway](/pt-BR/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Como vinculo uma pasta do host ao sandbox?">
    Defina `agents.defaults.sandbox.docker.binds` como `["host:path:mode"]` (ex.: `"/home/user/src:/src:ro"`). Vinculações globais + por agent são mescladas; vinculações por agent são ignoradas quando `scope: "shared"`. Use `:ro` para qualquer coisa sensível e lembre-se de que as vinculações contornam as barreiras do sistema de arquivos do sandbox.

    O OpenClaw valida origens de bind tanto em relação ao caminho normalizado quanto ao caminho canônico resolvido por meio do ancestral existente mais profundo. Isso significa que escapes por symlink-parent ainda falham de forma segura mesmo quando o último segmento do caminho ainda não existe, e as verificações de raiz permitida continuam se aplicando após a resolução de symlink.

    Consulte [Sandboxing](/pt-BR/gateway/sandboxing#custom-bind-mounts) e [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) para exemplos e observações de segurança.

  </Accordion>

  <Accordion title="Como a memória funciona?">
    A memória do OpenClaw são apenas arquivos Markdown no workspace do agent:

    - Notas diárias em `memory/YYYY-MM-DD.md`
    - Notas curadas de longo prazo em `MEMORY.md` (somente sessões principais/privadas)

    O OpenClaw também executa uma **gravação silenciosa de memória antes da Compaction** para lembrar o modelo
    de escrever notas duráveis antes da Compaction automática. Isso só é executado quando o workspace
    pode ser gravado (sandboxes somente leitura pulam isso). Consulte [Memory](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="A memória continua esquecendo coisas. Como faço para fixar?">
    Peça ao bot para **gravar o fato na memória**. Notas de longo prazo pertencem a `MEMORY.md`,
    contexto de curto prazo vai em `memory/YYYY-MM-DD.md`.

    Esta ainda é uma área que estamos melhorando. Ajuda lembrar o modelo para armazenar memórias;
    ele saberá o que fazer. Se ele continuar esquecendo, verifique se o Gateway está usando o mesmo
    workspace em todas as execuções.

    Documentação: [Memory](/pt-BR/concepts/memory), [Workspace do agent](/pt-BR/concepts/agent-workspace).

  </Accordion>

  <Accordion title="A memória persiste para sempre? Quais são os limites?">
    Os arquivos de memória ficam no disco e persistem até você excluí-los. O limite é o seu
    armazenamento, não o modelo. O **contexto da sessão** ainda é limitado pela janela de contexto do modelo,
    então conversas longas podem sofrer Compaction ou truncamento. É por isso que
    a busca de memória existe — ela traz de volta ao contexto apenas as partes relevantes.

    Documentação: [Memory](/pt-BR/concepts/memory), [Context](/pt-BR/concepts/context).

  </Accordion>

  <Accordion title="A busca semântica de memória exige uma chave de API da OpenAI?">
    Apenas se você usar **embeddings da OpenAI**. O OAuth do Codex cobre chat/completions e
    **não** concede acesso a embeddings, então **fazer login com Codex (OAuth ou o
    login da CLI do Codex)** não ajuda para busca semântica de memória. Embeddings da OpenAI
    ainda precisam de uma chave de API real (`OPENAI_API_KEY` ou `models.providers.openai.apiKey`).

    Se você não definir um provedor explicitamente, o OpenClaw seleciona automaticamente um provedor quando
    consegue resolver uma chave de API (perfis de autenticação, `models.providers.*.apiKey` ou vars de ambiente).
    Ele prefere OpenAI se resolver uma chave OpenAI, caso contrário Gemini se resolver uma chave Gemini,
    depois Voyage e depois Mistral. Se nenhuma chave remota estiver disponível, a busca de memória
    permanece desativada até você configurá-la. Se você tiver um caminho de modelo local
    configurado e presente, o OpenClaw
    prefere `local`. Ollama é compatível quando você define explicitamente
    `memorySearch.provider = "ollama"`.

    Se você preferir permanecer local, defina `memorySearch.provider = "local"` (e opcionalmente
    `memorySearch.fallback = "none"`). Se quiser embeddings do Gemini, defina
    `memorySearch.provider = "gemini"` e forneça `GEMINI_API_KEY` (ou
    `memorySearch.remote.apiKey`). Oferecemos suporte a modelos de embedding **OpenAI, Gemini, Voyage, Mistral, Ollama ou local**
    — consulte [Memory](/pt-BR/concepts/memory) para os detalhes de configuração.

  </Accordion>
</AccordionGroup>

## Onde as coisas ficam no disco

<AccordionGroup>
  <Accordion title="Todos os dados usados com o OpenClaw são salvos localmente?">
    Não — **o estado do OpenClaw é local**, mas **serviços externos ainda veem o que você envia a eles**.

    - **Local por padrão:** sessões, arquivos de memória, configuração e workspace ficam no host do Gateway
      (`~/.openclaw` + seu diretório de workspace).
    - **Remoto por necessidade:** mensagens que você envia a provedores de modelo (Anthropic/OpenAI/etc.) vão para
      as APIs deles, e plataformas de chat (WhatsApp/Telegram/Slack/etc.) armazenam dados de mensagens em seus
      servidores.
    - **Você controla a superfície:** usar modelos locais mantém os prompts na sua máquina, mas o tráfego
      do canal ainda passa pelos servidores do canal.

    Relacionado: [Workspace do agent](/pt-BR/concepts/agent-workspace), [Memory](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Onde o OpenClaw armazena seus dados?">
    Tudo fica em `$OPENCLAW_STATE_DIR` (padrão: `~/.openclaw`):

    | Caminho                                                         | Finalidade                                                         |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuração principal (JSON5)                                     |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Importação legada de OAuth (copiada para perfis de autenticação no primeiro uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Perfis de autenticação (OAuth, chaves de API e `keyRef`/`tokenRef` opcionais) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload opcional de segredo baseado em arquivo para provedores `file` de SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Arquivo legado de compatibilidade (entradas estáticas `api_key` limpas) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Estado do provedor (ex.: `whatsapp/<accountId>/creds.json`)       |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Estado por agent (agentDir + sessões)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Histórico e estado da conversa (por agent)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadados de sessão (por agent)                                    |

    Caminho legado de agent único: `~/.openclaw/agent/*` (migrado por `openclaw doctor`).

    Seu **workspace** (`AGENTS.md`, arquivos de memória, Skills etc.) é separado e configurado por `agents.defaults.workspace` (padrão: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Onde AGENTS.md / SOUL.md / USER.md / MEMORY.md devem ficar?">
    Esses arquivos ficam no **workspace do agent**, não em `~/.openclaw`.

    - **Workspace (por agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (ou o fallback legado `memory.md` quando `MEMORY.md` estiver ausente),
      `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opcional.
    - **Diretório de estado (`~/.openclaw`)**: configuração, estado de canal/provedor, perfis de autenticação, sessões, logs
      e Skills compartilhadas (`~/.openclaw/skills`).

    O workspace padrão é `~/.openclaw/workspace`, configurável por:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Se o bot "esquece" após uma reinicialização, confirme que o Gateway está usando o mesmo
    workspace em todas as inicializações (e lembre-se: o modo remoto usa o workspace do **host do gateway**,
    não o do seu laptop local).

    Dica: se você quiser um comportamento ou preferência durável, peça ao bot para **gravar isso em
    AGENTS.md ou MEMORY.md** em vez de depender do histórico do chat.

    Consulte [Workspace do agent](/pt-BR/concepts/agent-workspace) e [Memory](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Estratégia de backup recomendada">
    Coloque seu **workspace do agent** em um repositório git **privado** e faça backup dele em algum lugar
    privado (por exemplo, GitHub privado). Isso captura memória + arquivos AGENTS/SOUL/USER
    e permite restaurar a "mente" do assistente depois.

    **Não** faça commit de nada dentro de `~/.openclaw` (credenciais, sessões, tokens ou payloads de segredos criptografados).
    Se você precisar de uma restauração completa, faça backup tanto do workspace quanto do diretório de estado
    separadamente (consulte a pergunta de migração acima).

    Documentação: [Workspace do agent](/pt-BR/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Como desinstalo completamente o OpenClaw?">
    Consulte o guia dedicado: [Desinstalar](/pt-BR/install/uninstall).
  </Accordion>

  <Accordion title="Os agents podem trabalhar fora do workspace?">
    Sim. O workspace é o **cwd padrão** e âncora de memória, não um sandbox rígido.
    Caminhos relativos são resolvidos dentro do workspace, mas caminhos absolutos podem acessar outros
    locais do host, a menos que o sandboxing esteja ativado. Se você precisar de isolamento, use
    [`agents.defaults.sandbox`](/pt-BR/gateway/sandboxing) ou configurações de sandbox por agent. Se você
    quiser que um repositório seja o diretório de trabalho padrão, aponte o `workspace`
    desse agent para a raiz do repositório. O repositório do OpenClaw é apenas código-fonte; mantenha o
    workspace separado, a menos que você queira intencionalmente que o agent trabalhe dentro dele.

    Exemplo (repositório como cwd padrão):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modo remoto: onde fica o armazenamento de sessões?">
    O estado da sessão pertence ao **host do gateway**. Se você estiver em modo remoto, o armazenamento de sessões que importa está na máquina remota, não no seu laptop local. Consulte [Gerenciamento de sessão](/pt-BR/concepts/session).
  </Accordion>
</AccordionGroup>

## Noções básicas de configuração

<AccordionGroup>
  <Accordion title="Qual é o formato da configuração? Onde ela fica?">
    O OpenClaw lê uma configuração opcional em **JSON5** de `$OPENCLAW_CONFIG_PATH` (padrão: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Se o arquivo estiver ausente, ele usa padrões razoavelmente seguros (incluindo um workspace padrão em `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Defini gateway.bind: "lan" (ou "tailnet") e agora nada escuta / a UI diz unauthorized'>
    Binds sem loopback **exigem um caminho de autenticação válido do gateway**. Na prática, isso significa:

    - autenticação por segredo compartilhado: token ou senha
    - `gateway.auth.mode: "trusted-proxy"` atrás de um proxy reverso com reconhecimento de identidade sem loopback e configurado corretamente

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Observações:

    - `gateway.remote.token` / `.password` **não** ativam a autenticação local do gateway por si só.
    - Caminhos de chamada locais podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` não estiver definido.
    - Para autenticação por senha, defina `gateway.auth.mode: "password"` mais `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não for resolvido, a resolução falha de forma segura (sem mascaramento por fallback remoto).
    - Configurações da Control UI com segredo compartilhado autenticam via `connect.params.auth.token` ou `connect.params.auth.password` (armazenados nas configurações do app/UI). Modos com identidade, como Tailscale Serve ou `trusted-proxy`, usam cabeçalhos da solicitação em vez disso. Evite colocar segredos compartilhados em URLs.
    - Com `gateway.auth.mode: "trusted-proxy"`, proxies reversos em loopback no mesmo host ainda **não** satisfazem a autenticação trusted-proxy. O proxy confiável deve ser uma origem sem loopback configurada.

  </Accordion>

  <Accordion title="Por que agora preciso de um token no localhost?">
    O OpenClaw aplica autenticação do gateway por padrão, inclusive no loopback. No caminho padrão normal, isso significa autenticação por token: se nenhum caminho de autenticação explícito estiver configurado, a inicialização do gateway resolve para o modo token e gera um automaticamente, salvando-o em `gateway.auth.token`, então **clientes WS locais precisam se autenticar**. Isso impede que outros processos locais chamem o Gateway.

    Se você preferir um caminho de autenticação diferente, pode escolher explicitamente o modo senha (ou, para proxies reversos sem loopback e com reconhecimento de identidade, `trusted-proxy`). Se você **realmente** quiser loopback aberto, defina `gateway.auth.mode: "none"` explicitamente em sua configuração. O Doctor pode gerar um token para você a qualquer momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Preciso reiniciar depois de alterar a configuração?">
    O Gateway observa a configuração e oferece suporte a hot-reload:

    - `gateway.reload.mode: "hybrid"` (padrão): aplica a quente alterações seguras, reinicia para as críticas
    - `hot`, `restart`, `off` também são compatíveis

  </Accordion>

  <Accordion title="Como desativo os slogans engraçados da CLI?">
    Defina `cli.banner.taglineMode` na configuração:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: oculta o texto do slogan, mas mantém a linha de título/versão do banner.
    - `default`: usa `All your chats, one OpenClaw.` todas as vezes.
    - `random`: slogans engraçados/sazonais rotativos (comportamento padrão).
    - Se você quiser nenhum banner, defina a env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Como habilito a pesquisa na web (e web fetch)?">
    `web_fetch` funciona sem chave de API. `web_search` depende do
    provedor selecionado:

    - Provedores com API, como Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity e Tavily, exigem sua configuração normal de chave de API.
    - Ollama Web Search não usa chave, mas usa o host Ollama configurado e exige `ollama signin`.
    - DuckDuckGo não usa chave, mas é uma integração não oficial baseada em HTML.
    - SearXNG não usa chave/é self-hosted; configure `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recomendado:** execute `openclaw configure --section web` e escolha um provedor.
    Alternativas por ambiente:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` ou `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // opcional; omita para detecção automática
            },
          },
        },
    }
    ```

    A configuração específica de provedor para pesquisa web agora fica em `plugins.entries.<plugin>.config.webSearch.*`.
    Os caminhos legados de provedor `tools.web.search.*` ainda carregam temporariamente por compatibilidade, mas não devem ser usados em novas configurações.
    A configuração de fallback de web-fetch do Firecrawl fica em `plugins.entries.firecrawl.config.webFetch.*`.

    Observações:

    - Se você usa allowlists, adicione `web_search`/`web_fetch`/`x_search` ou `group:web`.
    - `web_fetch` vem ativado por padrão (a menos que seja explicitamente desativado).
    - Se `tools.web.fetch.provider` for omitido, o OpenClaw detecta automaticamente o primeiro provedor de fallback de fetch pronto a partir das credenciais disponíveis. Hoje o provedor incluído é o Firecrawl.
    - Daemons leem variáveis de ambiente de `~/.openclaw/.env` (ou do ambiente do serviço).

    Documentação: [Ferramentas web](/pt-BR/tools/web).

  </Accordion>

  <Accordion title="config.apply apagou minha configuração. Como recupero e como evito isso?">
    `config.apply` substitui a **configuração inteira**. Se você enviar um objeto parcial, todo o
    restante será removido.

    Recuperação:

    - Restaure de um backup (git ou uma cópia de `~/.openclaw/openclaw.json`).
    - Se você não tiver backup, execute `openclaw doctor` novamente e reconfigure canais/modelos.
    - Se isso foi inesperado, abra um bug e inclua sua última configuração conhecida ou qualquer backup.
    - Um agente de programação local muitas vezes consegue reconstruir uma configuração funcional a partir de logs ou histórico.

    Como evitar:

    - Use `openclaw config set` para pequenas alterações.
    - Use `openclaw configure` para edições interativas.
    - Use `config.schema.lookup` primeiro quando você não tiver certeza sobre um caminho exato ou o formato de um campo; ele retorna um nó superficial de schema mais resumos imediatos dos filhos para aprofundamento.
    - Use `config.patch` para edições RPC parciais; mantenha `config.apply` apenas para substituição completa da configuração.
    - Se você estiver usando a ferramenta `gateway` exclusiva do proprietário em uma execução de agent, ela ainda rejeitará gravações em `tools.exec.ask` / `tools.exec.security` (incluindo aliases legados `tools.bash.*` que se normalizam para os mesmos caminhos exec protegidos).

    Documentação: [Configuração](/cli/config), [Configure](/cli/configure), [Doctor](/pt-BR/gateway/doctor).

  </Accordion>

  <Accordion title="Como executo um Gateway central com workers especializados em vários dispositivos?">
    O padrão comum é **um Gateway** (por exemplo, Raspberry Pi) mais **nodes** e **agents**:

    - **Gateway (central):** é o dono dos canais (Signal/WhatsApp), roteamento e sessões.
    - **Nodes (dispositivos):** Macs/iOS/Android se conectam como periféricos e expõem ferramentas locais (`system.run`, `canvas`, `camera`).
    - **Agents (workers):** cérebros/workspaces separados para funções especializadas (por exemplo, "operações Hetzner", "dados pessoais").
    - **Sub-agents:** iniciam trabalho em segundo plano a partir de um agent principal quando você quer paralelismo.
    - **TUI:** conecta ao Gateway e alterna entre agents/sessions.

    Documentação: [Nodes](/pt-BR/nodes), [Acesso remoto](/pt-BR/gateway/remote), [Roteamento multi-agent](/pt-BR/concepts/multi-agent), [Sub-agents](/pt-BR/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="O navegador do OpenClaw pode rodar headless?">
    Sim. É uma opção de configuração:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    O padrão é `false` (com interface). O modo headless tem mais chance de acionar verificações anti-bot em alguns sites. Consulte [Browser](/pt-BR/tools/browser).

    O modo headless usa o **mesmo mecanismo Chromium** e funciona para a maior parte da automação (formulários, cliques, scraping, logins). As principais diferenças:

    - Nenhuma janela de navegador visível (use capturas de tela se precisar de recursos visuais).
    - Alguns sites são mais rigorosos com automação em modo headless (CAPTCHAs, anti-bot).
      Por exemplo, X/Twitter frequentemente bloqueia sessões headless.

  </Accordion>

  <Accordion title="Como uso o Brave para controle do navegador?">
    Defina `browser.executablePath` para o binário do Brave (ou qualquer navegador baseado em Chromium) e reinicie o Gateway.
    Consulte os exemplos completos de configuração em [Browser](/pt-BR/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

  ## Gateways remotos e nodes

  <AccordionGroup>
  <Accordion title="Como os comandos se propagam entre o Telegram, o gateway e os nodes?">
    As mensagens do Telegram são tratadas pelo **gateway**. O gateway executa o agent e
    só então chama os nodes pelo **Gateway WebSocket** quando uma ferramenta de node é necessária:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes não veem o tráfego de entrada do provedor; eles recebem apenas chamadas RPC de node.

  </Accordion>

  <Accordion title="Como meu agent pode acessar meu computador se o Gateway estiver hospedado remotamente?">
    Resposta curta: **emparelhe seu computador como um node**. O Gateway é executado em outro lugar, mas pode
    chamar ferramentas `node.*` (tela, câmera, sistema) na sua máquina local pelo Gateway WebSocket.

    Configuração típica:

    1. Execute o Gateway no host sempre ativo (VPS/servidor doméstico).
    2. Coloque o host do Gateway + seu computador na mesma tailnet.
    3. Garanta que o WS do Gateway esteja acessível (bind da tailnet ou túnel SSH).
    4. Abra o app macOS localmente e conecte em modo **Remote over SSH** (ou tailnet direta)
       para que ele possa se registrar como um node.
    5. Aprove o node no Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Nenhuma bridge TCP separada é necessária; os nodes se conectam pelo Gateway WebSocket.

    Lembrete de segurança: emparelhar um node macOS permite `system.run` nessa máquina. Emparelhe
    apenas dispositivos confiáveis e revise [Segurança](/pt-BR/gateway/security).

    Documentação: [Nodes](/pt-BR/nodes), [Protocolo do gateway](/pt-BR/gateway/protocol), [Modo remoto no macOS](/pt-BR/platforms/mac/remote), [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="O Tailscale está conectado, mas não recebo respostas. E agora?">
    Verifique o básico:

    - O Gateway está em execução: `openclaw gateway status`
    - Integridade do Gateway: `openclaw status`
    - Integridade do canal: `openclaw channels status`

    Depois verifique autenticação e roteamento:

    - Se você usa Tailscale Serve, certifique-se de que `gateway.auth.allowTailscale` esteja definido corretamente.
    - Se você se conecta por túnel SSH, confirme que o túnel local está ativo e aponta para a porta certa.
    - Confirme que suas allowlists (DM ou grupo) incluem sua conta.

    Documentação: [Tailscale](/pt-BR/gateway/tailscale), [Acesso remoto](/pt-BR/gateway/remote), [Channels](/pt-BR/channels).

  </Accordion>

  <Accordion title="Duas instâncias do OpenClaw podem conversar entre si (local + VPS)?">
    Sim. Não existe uma bridge "bot para bot" integrada, mas você pode conectá-las de algumas
    maneiras confiáveis:

    **Mais simples:** use um canal de chat normal ao qual ambos os bots possam acessar (Telegram/Slack/WhatsApp).
    Faça o Bot A enviar uma mensagem ao Bot B e depois deixe o Bot B responder normalmente.

    **Bridge por CLI (genérica):** execute um script que chame o outro Gateway com
    `openclaw agent --message ... --deliver`, apontando para um chat em que o outro bot
    escuta. Se um dos bots estiver em uma VPS remota, aponte sua CLI para esse Gateway remoto
    via SSH/Tailscale (consulte [Acesso remoto](/pt-BR/gateway/remote)).

    Padrão de exemplo (execute em uma máquina que consiga alcançar o Gateway de destino):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Dica: adicione uma proteção para que os dois bots não entrem em loop infinito (somente menções, allowlists
    do canal ou uma regra de "não responder a mensagens de bot").

    Documentação: [Acesso remoto](/pt-BR/gateway/remote), [CLI do agent](/cli/agent), [Envio do agent](/pt-BR/tools/agent-send).

  </Accordion>

  <Accordion title="Preciso de VPSs separadas para vários agents?">
    Não. Um Gateway pode hospedar vários agents, cada um com seu próprio workspace, padrões de modelo
    e roteamento. Essa é a configuração normal e é muito mais barata e simples do que executar
    uma VPS por agent.

    Use VPSs separadas apenas quando precisar de isolamento rígido (limites de segurança) ou de
    configurações muito diferentes que você não queira compartilhar. Caso contrário, mantenha um Gateway
    e use vários agents ou sub-agents.

  </Accordion>

  <Accordion title="Há alguma vantagem em usar um node no meu laptop pessoal em vez de SSH a partir de uma VPS?">
    Sim — os nodes são a forma de primeira classe de alcançar seu laptop a partir de um Gateway remoto, e eles
    liberam mais do que acesso ao shell. O Gateway é executado em macOS/Linux (Windows via WSL2) e é
    leve (uma VPS pequena ou máquina da classe Raspberry Pi já serve; 4 GB de RAM é mais do que suficiente), então uma configuração
    comum é um host sempre ativo mais seu laptop como node.

    - **Não exige SSH de entrada.** Os nodes se conectam para fora ao Gateway WebSocket e usam emparelhamento de dispositivo.
    - **Controles de execução mais seguros.** `system.run` é controlado por allowlists/aprovações do node nesse laptop.
    - **Mais ferramentas de dispositivo.** Os nodes expõem `canvas`, `camera` e `screen`, além de `system.run`.
    - **Automação local de navegador.** Mantenha o Gateway em uma VPS, mas execute o Chrome localmente por meio de um host de node no laptop, ou conecte-se ao Chrome local no host via Chrome MCP.

    SSH é aceitável para acesso eventual ao shell, mas nodes são mais simples para fluxos de trabalho contínuos de agent e
    automação de dispositivos.

    Documentação: [Nodes](/pt-BR/nodes), [Nodes CLI](/cli/nodes), [Browser](/pt-BR/tools/browser).

  </Accordion>

  <Accordion title="Os nodes executam um serviço de gateway?">
    Não. Apenas **um gateway** deve ser executado por host, a menos que você intencionalmente execute perfis isolados (consulte [Múltiplos gateways](/pt-BR/gateway/multiple-gateways)). Nodes são periféricos que se conectam
    ao gateway (nodes iOS/Android ou o "modo node" do macOS no app da barra de menu). Para hosts de node headless
    e controle por CLI, consulte [CLI do host de node](/cli/node).

    É necessário um reinício completo para alterações em `gateway`, `discovery` e `canvasHost`.

  </Accordion>

  <Accordion title="Existe uma forma por API / RPC de aplicar configuração?">
    Sim.

    - `config.schema.lookup`: inspeciona uma subárvore da configuração com seu nó superficial de schema, dica de UI correspondente e resumos imediatos dos filhos antes de gravar
    - `config.get`: busca o snapshot atual + hash
    - `config.patch`: atualização parcial segura (preferida para a maioria das edições por RPC); faz hot-reload quando possível e reinicia quando necessário
    - `config.apply`: valida + substitui a configuração completa; faz hot-reload quando possível e reinicia quando necessário
    - A ferramenta de runtime `gateway`, exclusiva do proprietário, ainda se recusa a regravar `tools.exec.ask` / `tools.exec.security`; aliases legados `tools.bash.*` se normalizam para os mesmos caminhos exec protegidos

  </Accordion>

  <Accordion title="Configuração mínima sensata para uma primeira instalação">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Isso define seu workspace e restringe quem pode acionar o bot.

  </Accordion>

  <Accordion title="Como configuro o Tailscale em uma VPS e me conecto a partir do meu Mac?">
    Etapas mínimas:

    1. **Instale + faça login na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Instale + faça login no seu Mac**
       - Use o app do Tailscale e entre na mesma tailnet.
    3. **Ative o MagicDNS (recomendado)**
       - No console administrativo do Tailscale, ative o MagicDNS para que a VPS tenha um nome estável.
    4. **Use o hostname da tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Se você quiser a Control UI sem SSH, use Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Isso mantém o gateway vinculado ao loopback e expõe HTTPS via Tailscale. Consulte [Tailscale](/pt-BR/gateway/tailscale).

  </Accordion>

  <Accordion title="Como conecto um node Mac a um Gateway remoto (Tailscale Serve)?">
    O Serve expõe a **Control UI + WS do Gateway**. Nodes se conectam pelo mesmo endpoint WS do Gateway.

    Configuração recomendada:

    1. **Certifique-se de que a VPS + o Mac estejam na mesma tailnet**.
    2. **Use o app macOS no modo Remote** (o destino SSH pode ser o hostname da tailnet).
       O app fará túnel da porta do Gateway e se conectará como um node.
    3. **Aprove o node** no gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentação: [Protocolo do gateway](/pt-BR/gateway/protocol), [Discovery](/pt-BR/gateway/discovery), [Modo remoto no macOS](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Devo instalar em um segundo laptop ou apenas adicionar um node?">
    Se você só precisa de **ferramentas locais** (tela/câmera/exec) no segundo laptop, adicione-o como um
    **node**. Isso mantém um único Gateway e evita configuração duplicada. As ferramentas locais de node são
    atualmente exclusivas do macOS, mas planejamos estendê-las para outros SOs.

    Instale um segundo Gateway apenas quando precisar de **isolamento rígido** ou de dois bots totalmente separados.

    Documentação: [Nodes](/pt-BR/nodes), [Nodes CLI](/cli/nodes), [Múltiplos gateways](/pt-BR/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente e carregamento de .env

<AccordionGroup>
  <Accordion title="Como o OpenClaw carrega variáveis de ambiente?">
    O OpenClaw lê vars de ambiente do processo pai (shell, launchd/systemd, CI etc.) e adicionalmente carrega:

    - `.env` do diretório de trabalho atual
    - um `.env` global de fallback em `~/.openclaw/.env` (também conhecido como `$OPENCLAW_STATE_DIR/.env`)

    Nenhum dos arquivos `.env` substitui vars de ambiente existentes.

    Você também pode definir vars de ambiente inline na configuração (aplicadas apenas se estiverem ausentes do env do processo):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Consulte [/environment](/pt-BR/help/environment) para a precedência completa e as fontes.

  </Accordion>

  <Accordion title="Iniciei o Gateway pelo serviço e minhas vars de ambiente sumiram. E agora?">
    Duas correções comuns:

    1. Coloque as chaves ausentes em `~/.openclaw/.env` para que sejam captadas mesmo quando o serviço não herda o env do seu shell.
    2. Ative a importação do shell (conveniência opt-in):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Isso executa seu shell de login e importa apenas chaves esperadas ausentes (nunca substitui). Equivalentes em var de ambiente:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Defini COPILOT_GITHUB_TOKEN, mas models status mostra "Shell env: off." Por quê?'>
    `openclaw models status` informa se a **importação do env do shell** está ativada. "Shell env: off"
    **não** significa que suas vars de ambiente estão ausentes — apenas significa que o OpenClaw não carregará
    automaticamente seu shell de login.

    Se o Gateway for executado como serviço (launchd/systemd), ele não herdará o
    ambiente do seu shell. Corrija de uma destas maneiras:

    1. Coloque o token em `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Ou ative a importação do shell (`env.shellEnv.enabled: true`).
    3. Ou adicione-o ao bloco `env` da sua configuração (aplicado apenas se estiver ausente).

    Depois reinicie o gateway e verifique novamente:

    ```bash
    openclaw models status
    ```

    Tokens do Copilot são lidos de `COPILOT_GITHUB_TOKEN` (também `GH_TOKEN` / `GITHUB_TOKEN`).
    Consulte [/concepts/model-providers](/pt-BR/concepts/model-providers) e [/environment](/pt-BR/help/environment).

  </Accordion>
</AccordionGroup>

## Sessões e múltiplos chats

<AccordionGroup>
  <Accordion title="Como inicio uma conversa nova?">
    Envie `/new` ou `/reset` como uma mensagem independente. Consulte [Gerenciamento de sessão](/pt-BR/concepts/session).
  </Accordion>

  <Accordion title="As sessões são redefinidas automaticamente se eu nunca enviar /new?">
    As sessões podem expirar após `session.idleMinutes`, mas isso vem **desativado por padrão** (padrão **0**).
    Defina um valor positivo para ativar a expiração por inatividade. Quando ativada, a **próxima**
    mensagem após o período de inatividade inicia um novo ID de sessão para aquela chave de chat.
    Isso não exclui transcrições — apenas inicia uma nova sessão.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Existe uma forma de montar uma equipe de instâncias do OpenClaw (um CEO e muitos agents)?">
    Sim, via **roteamento multi-agent** e **sub-agents**. Você pode criar um agent
    coordenador e vários agents workers com seus próprios workspaces e modelos.

    Dito isso, é melhor ver isso como um **experimento divertido**. Consome muitos tokens e frequentemente
    é menos eficiente do que usar um bot com sessões separadas. O modelo típico que
    imaginamos é um bot com o qual você conversa, com diferentes sessões para trabalho em paralelo. Esse
    bot também pode iniciar sub-agents quando necessário.

    Documentação: [Roteamento multi-agent](/pt-BR/concepts/multi-agent), [Sub-agents](/pt-BR/tools/subagents), [CLI de Agents](/cli/agents).

  </Accordion>

  <Accordion title="Por que o contexto foi truncado no meio da tarefa? Como evito isso?">
    O contexto da sessão é limitado pela janela do modelo. Chats longos, saídas grandes de ferramentas ou muitos
    arquivos podem disparar Compaction ou truncamento.

    O que ajuda:

    - Peça ao bot para resumir o estado atual e gravá-lo em um arquivo.
    - Use `/compact` antes de tarefas longas e `/new` ao mudar de assunto.
    - Mantenha contexto importante no workspace e peça ao bot para lê-lo de volta.
    - Use sub-agents para trabalho longo ou paralelo, para que o chat principal permaneça menor.
    - Escolha um modelo com janela de contexto maior se isso acontecer com frequência.

  </Accordion>

  <Accordion title="Como redefino completamente o OpenClaw, mas o mantenho instalado?">
    Use o comando de redefinição:

    ```bash
    openclaw reset
    ```

    Redefinição completa não interativa:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Depois execute a configuração novamente:

    ```bash
    openclaw onboard --install-daemon
    ```

    Observações:

    - O onboarding também oferece **Reset** se detectar uma configuração existente. Consulte [Onboarding (CLI)](/pt-BR/start/wizard).
    - Se você usou perfis (`--profile` / `OPENCLAW_PROFILE`), redefina cada diretório de estado (os padrões são `~/.openclaw-<profile>`).
    - Redefinição de dev: `openclaw gateway --dev --reset` (somente dev; apaga configuração + credenciais + sessões + workspace de dev).

  </Accordion>

  <Accordion title='Estou recebendo erros de "context too large" — como redefino ou faço compactação?'>
    Use uma destas opções:

    - **Compactar** (mantém a conversa, mas resume turnos antigos):

      ```
      /compact
      ```

      ou `/compact <instructions>` para orientar o resumo.

    - **Redefinir** (novo ID de sessão para a mesma chave de chat):

      ```
      /new
      /reset
      ```

    Se isso continuar acontecendo:

    - Ative ou ajuste a **poda de sessão** (`agents.defaults.contextPruning`) para reduzir saídas antigas de ferramentas.
    - Use um modelo com janela de contexto maior.

    Documentação: [Compaction](/pt-BR/concepts/compaction), [Poda de sessão](/pt-BR/concepts/session-pruning), [Gerenciamento de sessão](/pt-BR/concepts/session).

  </Accordion>

  <Accordion title='Por que estou vendo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Isso é um erro de validação do provedor: o modelo emitiu um bloco `tool_use` sem o
    `input` obrigatório. Normalmente significa que o histórico da sessão está obsoleto ou corrompido (muitas vezes após threads longas
    ou uma alteração de ferramenta/schema).

    Correção: inicie uma sessão nova com `/new` (mensagem independente).

  </Accordion>

  <Accordion title="Por que estou recebendo mensagens de Heartbeat a cada 30 minutos?">
    Heartbeats são executados a cada **30m** por padrão (**1h** ao usar autenticação OAuth). Ajuste ou desative:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // ou "0m" para desativar
          },
        },
      },
    }
    ```

    Se `HEARTBEAT.md` existir, mas estiver efetivamente vazio (apenas linhas em branco e
    cabeçalhos markdown como `# Heading`), o OpenClaw ignora a execução do heartbeat para economizar chamadas de API.
    Se o arquivo estiver ausente, o heartbeat ainda será executado e o modelo decidirá o que fazer.

    Substituições por agent usam `agents.list[].heartbeat`. Documentação: [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>

  <Accordion title='Preciso adicionar uma "conta de bot" a um grupo do WhatsApp?'>
    Não. O OpenClaw é executado na **sua própria conta**, então, se você estiver no grupo, o OpenClaw poderá vê-lo.
    Por padrão, respostas em grupo são bloqueadas até você permitir remetentes (`groupPolicy: "allowlist"`).

    Se você quiser que apenas **você** possa acionar respostas no grupo:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Como obtenho o JID de um grupo do WhatsApp?">
    Opção 1 (mais rápida): acompanhe os logs e envie uma mensagem de teste no grupo:

    ```bash
    openclaw logs --follow --json
    ```

    Procure `chatId` (ou `from`) terminando em `@g.us`, como:
    `1234567890-1234567890@g.us`.

    Opção 2 (se já estiver configurado/na allowlist): liste grupos da configuração:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentação: [WhatsApp](/pt-BR/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Por que o OpenClaw não responde em um grupo?">
    Duas causas comuns:

    - O bloqueio por menção está ativado (padrão). Você precisa @mencionar o bot (ou corresponder a `mentionPatterns`).
    - Você configurou `channels.whatsapp.groups` sem `"*"` e o grupo não está na allowlist.

    Consulte [Groups](/pt-BR/channels/groups) e [Mensagens em grupo](/pt-BR/channels/group-messages).

  </Accordion>

  <Accordion title="Grupos/threads compartilham contexto com DMs?">
    Chats diretos entram em colapso para a sessão principal por padrão. Grupos/canais têm suas próprias chaves de sessão, e tópicos do Telegram / threads do Discord são sessões separadas. Consulte [Groups](/pt-BR/channels/groups) e [Mensagens em grupo](/pt-BR/channels/group-messages).
  </Accordion>

  <Accordion title="Quantos workspaces e agents posso criar?">
    Não há limites rígidos. Dezenas (até centenas) funcionam bem, mas fique atento a:

    - **Crescimento em disco:** sessões + transcrições ficam em `~/.openclaw/agents/<agentId>/sessions/`.
    - **Custo de tokens:** mais agents significam mais uso simultâneo de modelos.
    - **Sobrecarga operacional:** perfis de autenticação, workspaces e roteamento de canais por agent.

    Dicas:

    - Mantenha um workspace **ativo** por agent (`agents.defaults.workspace`).
    - Faça poda de sessões antigas (exclua JSONL ou entradas de armazenamento) se o disco crescer.
    - Use `openclaw doctor` para identificar workspaces perdidos e incompatibilidades de perfis.

  </Accordion>

  <Accordion title="Posso executar vários bots ou chats ao mesmo tempo (Slack), e como devo configurar isso?">
    Sim. Use **Roteamento multi-agent** para executar vários agents isolados e rotear mensagens de entrada por
    canal/conta/peer. Slack é compatível como canal e pode ser vinculado a agents específicos.

    O acesso ao navegador é poderoso, mas não significa "fazer qualquer coisa que um humano pode" — anti-bot, CAPTCHAs e MFA
    ainda podem bloquear a automação. Para o controle de navegador mais confiável, use Chrome MCP local no host
    ou use CDP na máquina que realmente executa o navegador.

    Configuração de melhores práticas:

    - Host de Gateway sempre ativo (VPS/Mac mini).
    - Um agent por função (bindings).
    - Canal(is) do Slack vinculados a esses agents.
    - Navegador local via Chrome MCP ou um node quando necessário.

    Documentação: [Roteamento multi-agent](/pt-BR/concepts/multi-agent), [Slack](/pt-BR/channels/slack),
    [Browser](/pt-BR/tools/browser), [Nodes](/pt-BR/nodes).

  </Accordion>
</AccordionGroup>

## Models: padrões, seleção, aliases, troca

<AccordionGroup>
  <Accordion title='O que é o "modelo padrão"?'>
    O modelo padrão do OpenClaw é o que você definir como:

    ```
    agents.defaults.model.primary
    ```

    Os modelos são referenciados como `provider/model` (exemplo: `openai/gpt-5.4`). Se você omitir o provedor, o OpenClaw primeiro tenta um alias, depois uma correspondência exclusiva de provedor configurado para esse ID exato de modelo e só então recorre ao provedor padrão configurado como um caminho legado e obsoleto de compatibilidade. Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw recorre ao primeiro provedor/modelo configurado em vez de exibir um padrão obsoleto de provedor removido. Ainda assim, você deve definir **explicitamente** `provider/model`.

  </Accordion>

  <Accordion title="Qual modelo vocês recomendam?">
    **Padrão recomendado:** use o modelo mais forte e de última geração disponível na sua pilha de provedores.
    **Para agents com ferramentas habilitadas ou entrada não confiável:** priorize força do modelo em vez de custo.
    **Para chats rotineiros/de baixo risco:** use modelos de fallback mais baratos e faça roteamento por função do agent.

    O MiniMax tem sua própria documentação: [MiniMax](/pt-BR/providers/minimax) e
    [Modelos locais](/pt-BR/gateway/local-models).

    Regra prática: use o **melhor modelo que puder pagar** para trabalho de alto risco e um modelo mais barato
    para chat rotineiro ou resumos. Você pode rotear modelos por agent e usar sub-agents para
    paralelizar tarefas longas (cada sub-agent consome tokens). Consulte [Models](/pt-BR/concepts/models) e
    [Sub-agents](/pt-BR/tools/subagents).

    Aviso importante: modelos mais fracos ou excessivamente quantizados são mais vulneráveis a prompt
    injection e comportamento inseguro. Consulte [Segurança](/pt-BR/gateway/security).

    Mais contexto: [Models](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Como troco de modelo sem apagar minha configuração?">
    Use **comandos de modelo** ou edite apenas os campos de **modelo**. Evite substituir a configuração inteira.

    Opções seguras:

    - `/model` no chat (rápido, por sessão)
    - `openclaw models set ...` (atualiza apenas a configuração do modelo)
    - `openclaw configure --section model` (interativo)
    - edite `agents.defaults.model` em `~/.openclaw/openclaw.json`

    Evite `config.apply` com um objeto parcial, a menos que você pretenda substituir a configuração inteira.
    Para edições por RPC, inspecione primeiro com `config.schema.lookup` e prefira `config.patch`. O payload do lookup fornece o caminho normalizado, documentação/restrições superficiais do schema e resumos imediatos dos filhos.
    para atualizações parciais.
    Se você sobrescreveu a configuração, restaure de um backup ou execute `openclaw doctor` novamente para reparar.

    Documentação: [Models](/pt-BR/concepts/models), [Configure](/cli/configure), [Configuração](/cli/config), [Doctor](/pt-BR/gateway/doctor).

  </Accordion>

  <Accordion title="Posso usar modelos self-hosted (llama.cpp, vLLM, Ollama)?">
    Sim. Ollama é o caminho mais fácil para modelos locais.

    Configuração mais rápida:

    1. Instale o Ollama em `https://ollama.com/download`
    2. Faça pull de um modelo local, como `ollama pull gemma4`
    3. Se você também quiser modelos em nuvem, execute `ollama signin`
    4. Execute `openclaw onboard` e escolha `Ollama`
    5. Escolha `Local` ou `Cloud + Local`

    Observações:

    - `Cloud + Local` oferece modelos em nuvem mais seus modelos locais do Ollama
    - modelos em nuvem como `kimi-k2.5:cloud` não precisam de pull local
    - para troca manual, use `openclaw models list` e `openclaw models set ollama/<model>`

    Observação de segurança: modelos menores ou fortemente quantizados são mais vulneráveis a prompt
    injection. Recomendamos fortemente **modelos grandes** para qualquer bot que possa usar ferramentas.
    Se você ainda quiser modelos pequenos, ative sandboxing e allowlists rígidas de ferramentas.

    Documentação: [Ollama](/pt-BR/providers/ollama), [Modelos locais](/pt-BR/gateway/local-models),
    [Provedores de modelo](/pt-BR/concepts/model-providers), [Segurança](/pt-BR/gateway/security),
    [Sandboxing](/pt-BR/gateway/sandboxing).

  </Accordion>

  <Accordion title="Quais modelos OpenClaw, Flawd e Krill usam?">
    - Esses deployments podem ser diferentes e mudar com o tempo; não há uma recomendação fixa de provedor.
    - Verifique a configuração atual de tempo de execução em cada gateway com `openclaw models status`.
    - Para agents sensíveis à segurança/com ferramentas habilitadas, use o modelo mais forte e de última geração disponível.
  </Accordion>

  <Accordion title="Como troco de modelo em tempo real (sem reiniciar)?">
    Use o comando `/model` como uma mensagem independente:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Esses são os aliases incluídos. Aliases personalizados podem ser adicionados via `agents.defaults.models`.

    Você pode listar os modelos disponíveis com `/model`, `/model list` ou `/model status`.

    `/model` (e `/model list`) mostra um seletor compacto e numerado. Selecione por número:

    ```
    /model 3
    ```

    Você também pode forçar um perfil de autenticação específico para o provedor (por sessão):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Dica: `/model status` mostra qual agent está ativo, qual arquivo `auth-profiles.json` está sendo usado e qual perfil de autenticação será tentado em seguida.
    Ele também mostra o endpoint do provedor configurado (`baseUrl`) e o modo de API (`api`) quando disponíveis.

    **Como removo a fixação de um perfil que defini com @profile?**

    Execute `/model` novamente **sem** o sufixo `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Se você quiser voltar ao padrão, escolha-o em `/model` (ou envie `/model <provider/model padrão>`).
    Use `/model status` para confirmar qual perfil de autenticação está ativo.

  </Accordion>

  <Accordion title="Posso usar GPT 5.2 para tarefas diárias e Codex 5.3 para programação?">
    Sim. Defina um como padrão e troque quando necessário:

    - **Troca rápida (por sessão):** `/model gpt-5.4` para tarefas diárias, `/model openai-codex/gpt-5.4` para programação com OAuth do Codex.
    - **Padrão + troca:** defina `agents.defaults.model.primary` como `openai/gpt-5.4` e depois troque para `openai-codex/gpt-5.4` ao programar (ou o contrário).
    - **Sub-agents:** roteie tarefas de programação para sub-agents com um modelo padrão diferente.

    Consulte [Models](/pt-BR/concepts/models) e [Comandos slash](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Como configuro o modo rápido para GPT 5.4?">
    Use um toggle por sessão ou um padrão de configuração:

    - **Por sessão:** envie `/fast on` enquanto a sessão estiver usando `openai/gpt-5.4` ou `openai-codex/gpt-5.4`.
    - **Padrão por modelo:** defina `agents.defaults.models["openai/gpt-5.4"].params.fastMode` como `true`.
    - **OAuth do Codex também:** se você também usar `openai-codex/gpt-5.4`, defina o mesmo sinalizador ali.

    Exemplo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Para OpenAI, o modo rápido mapeia para `service_tier = "priority"` em solicitações nativas de Responses compatíveis. As substituições de sessão `/fast` prevalecem sobre os padrões de configuração.

    Consulte [Thinking e modo rápido](/pt-BR/tools/thinking) e [Modo rápido da OpenAI](/pt-BR/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Por que vejo "Model ... is not allowed" e depois nenhuma resposta?'>
    Se `agents.defaults.models` estiver definido, ele se torna a **allowlist** para `/model` e quaisquer
    substituições de sessão. Escolher um modelo que não esteja nessa lista retorna:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Esse erro é retornado **em vez de** uma resposta normal. Correção: adicione o modelo a
    `agents.defaults.models`, remova a allowlist ou escolha um modelo em `/model list`.

  </Accordion>

  <Accordion title='Por que vejo "Unknown model: minimax/MiniMax-M2.7"?'>
    Isso significa que o **provedor não está configurado** (nenhuma configuração de provedor MiniMax ou perfil de
    autenticação foi encontrado), então o modelo não pode ser resolvido.

    Checklist de correção:

    1. Atualize para uma versão atual do OpenClaw (ou execute a partir do código-fonte em `main`) e depois reinicie o gateway.
    2. Certifique-se de que o MiniMax esteja configurado (assistente ou JSON) ou de que a autenticação MiniMax
       exista no env/perfis de autenticação para que o provedor correspondente possa ser injetado
       (`MINIMAX_API_KEY` para `minimax`, `MINIMAX_OAUTH_TOKEN` ou OAuth MiniMax
       armazenado para `minimax-portal`).
    3. Use o ID exato do modelo (sensível a maiúsculas/minúsculas) para o seu caminho de autenticação:
       `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed` para configuração
       com chave de API, ou `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` para configuração com OAuth.
    4. Execute:

       ```bash
       openclaw models list
       ```

       e escolha na lista (ou `/model list` no chat).

    Consulte [MiniMax](/pt-BR/providers/minimax) e [Models](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Posso usar MiniMax como padrão e OpenAI para tarefas complexas?">
    Sim. Use **MiniMax como padrão** e troque de modelo **por sessão** quando necessário.
    Fallbacks servem para **erros**, não para "tarefas difíceis", então use `/model` ou um agent separado.

    **Opção A: trocar por sessão**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Depois:

    ```
    /model gpt
    ```

    **Opção B: agents separados**

    - Agent A padrão: MiniMax
    - Agent B padrão: OpenAI
    - Faça roteamento por agent ou use `/agent` para trocar

    Documentação: [Models](/pt-BR/concepts/models), [Roteamento multi-agent](/pt-BR/concepts/multi-agent), [MiniMax](/pt-BR/providers/minimax), [OpenAI](/pt-BR/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt são atalhos incluídos?">
    Sim. O OpenClaw inclui alguns atalhos padrão (aplicados apenas quando o modelo existe em `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Se você definir seu próprio alias com o mesmo nome, o seu valor prevalece.

  </Accordion>

  <Accordion title="Como defino/substituo atalhos de modelo (aliases)?">
    Os aliases vêm de `agents.defaults.models.<modelId>.alias`. Exemplo:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Depois, `/model sonnet` (ou `/<alias>`, quando compatível) resolve para esse ID de modelo.

  </Accordion>

  <Accordion title="Como adiciono modelos de outros provedores, como OpenRouter ou Z.AI?">
    OpenRouter (pagamento por token; muitos modelos):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (modelos GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Se você referenciar um provedor/modelo, mas a chave necessária do provedor estiver ausente, receberá um erro de autenticação em tempo de execução (por exemplo, `No API key found for provider "zai"`).

    **Nenhuma chave de API encontrada para o provedor após adicionar um novo agent**

    Isso geralmente significa que o **novo agent** tem um armazenamento de autenticação vazio. A autenticação é por agent e
    fica armazenada em:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opções para corrigir:

    - Execute `openclaw agents add <id>` e configure a autenticação durante o assistente.
    - Ou copie `auth-profiles.json` do `agentDir` do agent principal para o `agentDir` do novo agent.

    **Não** reutilize `agentDir` entre agents; isso causa colisões de autenticação/sessão.

  </Accordion>
</AccordionGroup>

## Failover de modelo e "All models failed"

<AccordionGroup>
  <Accordion title="Como o failover funciona?">
    O failover acontece em dois estágios:

    1. **Rotação de perfil de autenticação** dentro do mesmo provedor.
    2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

    Cooldowns se aplicam a perfis com falha (backoff exponencial), então o OpenClaw pode continuar respondendo mesmo quando um provedor está com limite de taxa ou falhando temporariamente.

    O bucket de limite de taxa inclui mais do que respostas `429` simples. O OpenClaw
    também trata mensagens como `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` e limites
    periódicos de janela de uso (`weekly/monthly limit reached`) como dignos de
    failover por limite de taxa.

    Algumas respostas que parecem ser de faturamento não são `402`, e algumas respostas HTTP `402`
    também permanecem nesse bucket transitório. Se um provedor retornar
    texto explícito de faturamento em `401` ou `403`, o OpenClaw ainda pode manter isso
    na faixa de faturamento, mas os correspondentes de texto específicos do provedor permanecem limitados ao
    provedor a que pertencem (por exemplo, OpenRouter `Key limit exceeded`). Se uma mensagem `402`
    em vez disso parecer uma janela de uso que pode ser repetida ou um
    limite de gastos da organização/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), o OpenClaw a trata como
    `rate_limit`, não como uma desativação longa por faturamento.

    Erros de excesso de contexto são diferentes: assinaturas como
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` ou `ollama error: context length
    exceeded` permanecem no caminho de Compaction/nova tentativa em vez de avançar o
    fallback de modelo.

    O texto genérico de erro do servidor é intencionalmente mais restrito do que "qualquer coisa com
    unknown/error nele". O OpenClaw trata formatos transitórios com escopo de provedor
    como Anthropic simples `An unknown error occurred`, OpenRouter simples
    `Provider returned error`, erros de motivo de parada como `Unhandled stop reason:
    error`, payloads JSON `api_error` com texto transitório de servidor
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) e erros de provedor ocupado como `ModelNotReadyException` como
    sinais de timeout/sobrecarga dignos de failover quando o contexto do provedor
    corresponde.
    Texto interno genérico de fallback como `LLM request failed with an unknown
    error.` permanece conservador e não dispara fallback de modelo por si só.

  </Accordion>

  <Accordion title='O que significa "No credentials found for profile anthropic:default"?'>
    Isso significa que o sistema tentou usar o ID de perfil de autenticação `anthropic:default`, mas não conseguiu encontrar credenciais para ele no armazenamento de autenticação esperado.

    **Checklist de correção:**

    - **Confirme onde os perfis de autenticação ficam** (caminhos novos vs legados)
      - Atual: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legado: `~/.openclaw/agent/*` (migrado por `openclaw doctor`)
    - **Confirme que sua var de ambiente está carregada pelo Gateway**
      - Se você definiu `ANTHROPIC_API_KEY` no shell, mas executa o Gateway via systemd/launchd, ele pode não herdá-la. Coloque-a em `~/.openclaw/.env` ou ative `env.shellEnv`.
    - **Certifique-se de que está editando o agent correto**
      - Configurações multi-agent significam que pode haver vários arquivos `auth-profiles.json`.
    - **Faça uma verificação básica do status de modelo/autenticação**
      - Use `openclaw models status` para ver os modelos configurados e se os provedores estão autenticados.

    **Checklist de correção para "No credentials found for profile anthropic"**

    Isso significa que a execução está fixada em um perfil de autenticação da Anthropic, mas o Gateway
    não consegue encontrá-lo em seu armazenamento de autenticação.

    - **Use Claude CLI**
      - Execute `openclaw models auth login --provider anthropic --method cli --set-default` no host do gateway.
    - **Se você quiser usar uma chave de API**
      - Coloque `ANTHROPIC_API_KEY` em `~/.openclaw/.env` no **host do gateway**.
      - Limpe qualquer ordem fixada que force um perfil ausente:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Confirme que está executando comandos no host do gateway**
      - No modo remoto, os perfis de autenticação ficam na máquina do gateway, não no seu laptop.

  </Accordion>

  <Accordion title="Por que ele também tentou Google Gemini e falhou?">
    Se sua configuração de modelo incluir Google Gemini como fallback (ou se você trocou para um atalho Gemini), o OpenClaw tentará usá-lo durante o fallback de modelo. Se você não tiver configurado credenciais do Google, verá `No API key found for provider "google"`.

    Correção: forneça autenticação do Google ou remova/evite modelos Google em `agents.defaults.model.fallbacks` / aliases para que o fallback não roteie para lá.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Causa: o histórico da sessão contém **blocos thinking sem assinaturas** (muitas vezes de
    um stream abortado/parcial). O Google Antigravity exige assinaturas para blocos thinking.

    Correção: o OpenClaw agora remove blocos thinking sem assinatura para o Claude do Google Antigravity. Se isso ainda aparecer, inicie uma **nova sessão** ou defina `/thinking off` para esse agent.

  </Accordion>
</AccordionGroup>

## Perfis de autenticação: o que são e como gerenciá-los

Relacionado: [/concepts/oauth](/pt-BR/concepts/oauth) (fluxos OAuth, armazenamento de tokens, padrões multi-conta)

<AccordionGroup>
  <Accordion title="O que é um perfil de autenticação?">
    Um perfil de autenticação é um registro nomeado de credencial (OAuth ou chave de API) vinculado a um provedor. Os perfis ficam em:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Quais são IDs típicos de perfil?">
    O OpenClaw usa IDs prefixados pelo provedor, como:

    - `anthropic:default` (comum quando não existe identidade de e-mail)
    - `anthropic:<email>` para identidades OAuth
    - IDs personalizados que você escolher (por exemplo, `anthropic:work`)

  </Accordion>

  <Accordion title="Posso controlar qual perfil de autenticação é tentado primeiro?">
    Sim. A configuração oferece suporte a metadados opcionais para perfis e uma ordenação por provedor (`auth.order.<provider>`). Isso **não** armazena segredos; mapeia IDs para provedor/modo e define a ordem de rotação.

    O OpenClaw pode pular temporariamente um perfil se ele estiver em um **cooldown** curto (limites de taxa/timeouts/falhas de autenticação) ou em um estado mais longo de **desativado** (faturamento/créditos insuficientes). Para inspecionar isso, execute `openclaw models status --json` e verifique `auth.unusableProfiles`. Ajuste: `auth.cooldowns.billingBackoffHours*`.

    Cooldowns por limite de taxa podem ter escopo por modelo. Um perfil que está em cooldown
    para um modelo ainda pode ser utilizável para um modelo irmão no mesmo provedor,
    enquanto janelas de faturamento/desativação ainda bloqueiam o perfil inteiro.

    Você também pode definir uma substituição de ordem **por agent** (armazenada em `auth-state.json` desse agent) via CLI:

    ```bash
    # O padrão é o agent padrão configurado (omita --agent)
    openclaw models auth order get --provider anthropic

    # Trava a rotação em um único perfil (tenta só este)
    openclaw models auth order set --provider anthropic anthropic:default

    # Ou define uma ordem explícita (fallback dentro do provedor)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Limpa a substituição (volta para config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Para apontar para um agent específico:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Para verificar o que realmente será tentado, use:

    ```bash
    openclaw models status --probe
    ```

    Se um perfil armazenado for omitido da ordem explícita, a sonda informa
    `excluded_by_auth_order` para esse perfil em vez de tentá-lo silenciosamente.

  </Accordion>

  <Accordion title="OAuth vs chave de API — qual é a diferença?">
    O OpenClaw oferece suporte a ambos:

    - **OAuth** frequentemente aproveita acesso por assinatura (quando aplicável).
    - **Chaves de API** usam cobrança por token.

    O assistente oferece suporte explícito a Anthropic Claude CLI, OpenAI Codex OAuth e chaves de API.

  </Accordion>
</AccordionGroup>

## Gateway: portas, "already running" e modo remoto

<AccordionGroup>
  <Accordion title="Qual porta o Gateway usa?">
    `gateway.port` controla a porta multiplexada única para WebSocket + HTTP (Control UI, hooks etc.).

    Precedência:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > padrão 18789
    ```

  </Accordion>

  <Accordion title='Por que openclaw gateway status diz "Runtime: running", mas "RPC probe: failed"?'>
    Porque "running" é a visão do **supervisor** (launchd/systemd/schtasks). A sonda RPC é a CLI realmente se conectando ao gateway WebSocket e chamando `status`.

    Use `openclaw gateway status` e confie nestas linhas:

    - `Probe target:` (a URL que a sonda realmente usou)
    - `Listening:` (o que realmente está vinculado à porta)
    - `Last gateway error:` (causa raiz comum quando o processo está vivo, mas a porta não está escutando)

  </Accordion>

  <Accordion title='Por que openclaw gateway status mostra "Config (cli)" e "Config (service)" diferentes?'>
    Você está editando um arquivo de configuração enquanto o serviço está executando outro (frequentemente uma incompatibilidade de `--profile` / `OPENCLAW_STATE_DIR`).

    Correção:

    ```bash
    openclaw gateway install --force
    ```

    Execute isso com o mesmo `--profile` / ambiente que você quer que o serviço use.

  </Accordion>

  <Accordion title='O que significa "another gateway instance is already listening"?'>
    O OpenClaw impõe um bloqueio de tempo de execução vinculando imediatamente o listener WebSocket na inicialização (padrão `ws://127.0.0.1:18789`). Se o bind falhar com `EADDRINUSE`, ele gera `GatewayLockError`, indicando que outra instância já está escutando.

    Correção: interrompa a outra instância, libere a porta ou execute com `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Como executo o OpenClaw em modo remoto (cliente se conecta a um Gateway em outro lugar)?">
    Defina `gateway.mode: "remote"` e aponte para uma URL WebSocket remota, opcionalmente com credenciais remotas de segredo compartilhado:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Observações:

    - `openclaw gateway` só inicia quando `gateway.mode` é `local` (ou quando você passa a flag de substituição).
    - O app macOS observa o arquivo de configuração e alterna os modos em tempo real quando esses valores mudam.
    - `gateway.remote.token` / `.password` são apenas credenciais remotas do lado do cliente; elas não ativam a autenticação local do gateway por si só.

  </Accordion>

  <Accordion title='A Control UI diz "unauthorized" (ou fica reconectando). E agora?'>
    Seu caminho de autenticação do gateway e o método de autenticação da UI não correspondem.

    Fatos (do código):

    - A Control UI mantém o token em `sessionStorage` para a sessão atual da aba do navegador e a URL do gateway selecionado, então atualizações na mesma aba continuam funcionando sem restaurar persistência de token em `localStorage` de longa duração.
    - Em `AUTH_TOKEN_MISMATCH`, clientes confiáveis podem tentar uma nova tentativa limitada com um token de dispositivo em cache quando o gateway retorna dicas de nova tentativa (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Essa nova tentativa com token em cache agora reutiliza os escopos aprovados em cache armazenados com o token do dispositivo. Chamadores com `deviceToken` explícito / `scopes` explícitos ainda mantêm o conjunto de escopos solicitado em vez de herdarem escopos em cache.
    - Fora desse caminho de nova tentativa, a precedência da autenticação de conexão é: token/senha compartilhados explícitos primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado, depois token bootstrap.
    - As verificações de escopo do token bootstrap têm prefixo de função. A allowlist incorporada do operador bootstrap satisfaz apenas solicitações de operador; roles de node ou outras roles não operadoras ainda precisam de escopos sob o prefixo da própria role.

    Correção:

    - Mais rápido: `openclaw dashboard` (imprime + copia a URL do dashboard, tenta abrir; mostra dica de SSH se estiver headless).
    - Se você ainda não tiver um token: `openclaw doctor --generate-gateway-token`.
    - Se for remoto, faça o túnel primeiro: `ssh -N -L 18789:127.0.0.1:18789 user@host` e depois abra `http://127.0.0.1:18789/`.
    - Modo de segredo compartilhado: defina `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, depois cole o segredo correspondente nas configurações da Control UI.
    - Modo Tailscale Serve: verifique se `gateway.auth.allowTailscale` está ativado e se você está abrindo a URL do Serve, não uma URL bruta de loopback/tailnet que contorna os cabeçalhos de identidade do Tailscale.
    - Modo trusted-proxy: verifique se você está passando pelo proxy com reconhecimento de identidade sem loopback configurado, não por um proxy de loopback no mesmo host nem por uma URL bruta do gateway.
    - Se a incompatibilidade persistir após a única nova tentativa, rotacione/reaprove o token de dispositivo pareado:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Se esse comando de rotação disser que foi negado, verifique duas coisas:
      - sessões de dispositivo pareado só podem rotacionar o **próprio** dispositivo, a menos que também tenham `operator.admin`
      - valores explícitos de `--scope` não podem exceder os escopos atuais de operador do chamador
    - Ainda travado? Execute `openclaw status --all` e siga [Solução de problemas](/pt-BR/gateway/troubleshooting). Consulte [Dashboard](/web/dashboard) para detalhes de autenticação.

  </Accordion>

  <Accordion title="Defini gateway.bind tailnet, mas ele não consegue fazer bind e nada escuta">
    O bind `tailnet` escolhe um IP do Tailscale nas interfaces de rede (100.64.0.0/10). Se a máquina não estiver no Tailscale (ou se a interface estiver inativa), não haverá nada em que fazer bind.

    Correção:

    - Inicie o Tailscale nesse host (para que ele tenha um endereço 100.x), ou
    - Troque para `gateway.bind: "loopback"` / `"lan"`.

    Observação: `tailnet` é explícito. `auto` prefere loopback; use `gateway.bind: "tailnet"` quando quiser um bind somente de tailnet.

  </Accordion>

  <Accordion title="Posso executar vários Gateways no mesmo host?">
    Normalmente não — um Gateway pode executar vários canais de mensagem e agents. Use vários Gateways apenas quando precisar de redundância (ex.: bot de resgate) ou isolamento rígido.

    Sim, mas você precisa isolar:

    - `OPENCLAW_CONFIG_PATH` (configuração por instância)
    - `OPENCLAW_STATE_DIR` (estado por instância)
    - `agents.defaults.workspace` (isolamento de workspace)
    - `gateway.port` (portas únicas)

    Configuração rápida (recomendada):

    - Use `openclaw --profile <name> ...` por instância (cria automaticamente `~/.openclaw-<name>`).
    - Defina um `gateway.port` exclusivo na configuração de cada perfil (ou passe `--port` em execuções manuais).
    - Instale um serviço por perfil: `openclaw --profile <name> gateway install`.

    Os perfis também acrescentam sufixo aos nomes de serviço (`ai.openclaw.<profile>`; legados `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guia completo: [Múltiplos gateways](/pt-BR/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='O que significa "invalid handshake" / código 1008?'>
    O Gateway é um **servidor WebSocket** e espera que a primeira mensagem seja
    um frame `connect`. Se receber qualquer outra coisa, fecha a conexão
    com **código 1008** (violação de política).

    Causas comuns:

    - Você abriu a URL **HTTP** em um navegador (`http://...`) em vez de um cliente WS.
    - Você usou a porta ou o caminho errados.
    - Um proxy ou túnel removeu cabeçalhos de autenticação ou enviou uma solicitação que não era do Gateway.

    Correções rápidas:

    1. Use a URL WS: `ws://<host>:18789` (ou `wss://...` se for HTTPS).
    2. Não abra a porta WS em uma aba normal do navegador.
    3. Se a autenticação estiver ativada, inclua o token/senha no frame `connect`.

    Se você estiver usando a CLI ou a TUI, a URL deve parecer com:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Detalhes do protocolo: [Protocolo do gateway](/pt-BR/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging e depuração

<AccordionGroup>
  <Accordion title="Onde estão os logs?">
    Logs em arquivo (estruturados):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Você pode definir um caminho estável via `logging.file`. O nível de log em arquivo é controlado por `logging.level`. A verbosidade do console é controlada por `--verbose` e `logging.consoleLevel`.

    Forma mais rápida de acompanhar logs:

    ```bash
    openclaw logs --follow
    ```

    Logs do serviço/supervisor (quando o gateway é executado via launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` e `gateway.err.log` (padrão: `~/.openclaw/logs/...`; perfis usam `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Consulte [Solução de problemas](/pt-BR/gateway/troubleshooting) para mais detalhes.

  </Accordion>

  <Accordion title="Como inicio/parar/reinicio o serviço do Gateway?">
    Use os auxiliares do gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Se você executar o gateway manualmente, `openclaw gateway --force` pode retomar a porta. Consulte [Gateway](/pt-BR/gateway).

  </Accordion>

  <Accordion title="Fechei meu terminal no Windows — como reinicio o OpenClaw?">
    Existem **dois modos de instalação no Windows**:

    **1) WSL2 (recomendado):** o Gateway é executado dentro do Linux.

    Abra o PowerShell, entre no WSL e depois reinicie:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Se você nunca instalou o serviço, inicie-o em primeiro plano:

    ```bash
    openclaw gateway run
    ```

    **2) Windows nativo (não recomendado):** o Gateway é executado diretamente no Windows.

    Abra o PowerShell e execute:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Se você o executar manualmente (sem serviço), use:

    ```powershell
    openclaw gateway run
    ```

    Documentação: [Windows (WSL2)](/pt-BR/platforms/windows), [Runbook do serviço do Gateway](/pt-BR/gateway).

  </Accordion>

  <Accordion title="O Gateway está ativo, mas as respostas nunca chegam. O que devo verificar?">
    Comece com uma verificação rápida de integridade:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causas comuns:

    - Autenticação do modelo não carregada no **host do gateway** (verifique `models status`).
    - Emparelhamento/allowlist do canal bloqueando respostas (verifique a configuração do canal + logs).
    - WebChat/Dashboard aberto sem o token correto.

    Se você estiver remoto, confirme que a conexão por túnel/Tailscale está ativa e que o
    Gateway WebSocket está acessível.

    Documentação: [Channels](/pt-BR/channels), [Solução de problemas](/pt-BR/gateway/troubleshooting), [Acesso remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — e agora?'>
    Isso geralmente significa que a UI perdeu a conexão WebSocket. Verifique:

    1. O Gateway está em execução? `openclaw gateway status`
    2. O Gateway está íntegro? `openclaw status`
    3. A UI tem o token correto? `openclaw dashboard`
    4. Se for remoto, o link de túnel/Tailscale está ativo?

    Depois acompanhe os logs:

    ```bash
    openclaw logs --follow
    ```

    Documentação: [Dashboard](/web/dashboard), [Acesso remoto](/pt-BR/gateway/remote), [Solução de problemas](/pt-BR/gateway/troubleshooting).

  </Accordion>

  <Accordion title="setMyCommands do Telegram falha. O que devo verificar?">
    Comece com logs e status do canal:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Depois relacione o erro:

    - `BOT_COMMANDS_TOO_MUCH`: o menu do Telegram tem entradas demais. O OpenClaw já reduz até o limite do Telegram e tenta novamente com menos comandos, mas algumas entradas do menu ainda precisam ser removidas. Reduza comandos de plugin/skill/personalizados ou desative `channels.telegram.commands.native` se não precisar do menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` ou erros de rede semelhantes: se você estiver em uma VPS ou atrás de um proxy, confirme que HTTPS de saída está permitido e que o DNS funciona para `api.telegram.org`.

    Se o Gateway for remoto, verifique se você está olhando os logs no host do Gateway.

    Documentação: [Telegram](/pt-BR/channels/telegram), [Solução de problemas de canal](/pt-BR/channels/troubleshooting).

  </Accordion>

  <Accordion title="A TUI não mostra saída. O que devo verificar?">
    Primeiro confirme que o Gateway está acessível e que o agent consegue executar:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Na TUI, use `/status` para ver o estado atual. Se você espera respostas em um
    canal de chat, certifique-se de que a entrega esteja ativada (`/deliver on`).

    Documentação: [TUI](/web/tui), [Comandos slash](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Como paro completamente e depois inicio o Gateway?">
    Se você instalou o serviço:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Isso interrompe/inicia o **serviço supervisionado** (launchd no macOS, systemd no Linux).
    Use isso quando o Gateway estiver sendo executado em segundo plano como daemon.

    Se você estiver executando em primeiro plano, interrompa com Ctrl-C e depois:

    ```bash
    openclaw gateway run
    ```

    Documentação: [Runbook do serviço do Gateway](/pt-BR/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: reinicia o **serviço em segundo plano** (launchd/systemd).
    - `openclaw gateway`: executa o gateway **em primeiro plano** para esta sessão do terminal.

    Se você instalou o serviço, use os comandos do gateway. Use `openclaw gateway` quando
    quiser uma execução única em primeiro plano.

  </Accordion>

  <Accordion title="Forma mais rápida de obter mais detalhes quando algo falha">
    Inicie o Gateway com `--verbose` para obter mais detalhes no console. Depois inspecione o arquivo de log para autenticação de canal, roteamento de modelo e erros de RPC.
  </Accordion>
</AccordionGroup>

## Mídia e anexos

<AccordionGroup>
  <Accordion title="Minha Skill gerou uma imagem/PDF, mas nada foi enviado">
    Anexos de saída do agent devem incluir uma linha `MEDIA:<path-or-url>` (em sua própria linha). Consulte [Configuração do assistente OpenClaw](/pt-BR/start/openclaw) e [Envio do agent](/pt-BR/tools/agent-send).

    Envio pela CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Verifique também:

    - O canal de destino é compatível com mídia de saída e não está bloqueado por allowlists.
    - O arquivo está dentro dos limites de tamanho do provedor (imagens são redimensionadas para no máximo 2048px).
    - `tools.fs.workspaceOnly=true` mantém envios por caminho local limitados ao workspace, temp/media-store e arquivos validados pelo sandbox.
    - `tools.fs.workspaceOnly=false` permite que `MEDIA:` envie arquivos locais do host que o agent já consegue ler, mas apenas para mídia e tipos de documento seguros (imagens, áudio, vídeo, PDF e documentos do Office). Arquivos de texto simples e com aparência de segredo continuam bloqueados.

    Consulte [Imagens](/pt-BR/nodes/images).

  </Accordion>
</AccordionGroup>

## Segurança e controle de acesso

<AccordionGroup>
  <Accordion title="É seguro expor o OpenClaw a DMs de entrada?">
    Trate DMs de entrada como entrada não confiável. Os padrões são projetados para reduzir riscos:

    - O comportamento padrão em canais compatíveis com DM é **pairing**:
      - Remetentes desconhecidos recebem um código de pairing; o bot não processa a mensagem deles.
      - Aprove com: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - As solicitações pendentes são limitadas a **3 por canal**; verifique `openclaw pairing list --channel <channel> [--account <id>]` se um código não chegou.
    - Abrir DMs publicamente exige opt-in explícito (`dmPolicy: "open"` e allowlist `"*"`).

    Execute `openclaw doctor` para identificar políticas de DM arriscadas.

  </Accordion>

  <Accordion title="Prompt injection é uma preocupação apenas para bots públicos?">
    Não. Prompt injection diz respeito a **conteúdo não confiável**, não apenas a quem pode enviar DM ao bot.
    Se seu assistente lê conteúdo externo (pesquisa/fetch na web, páginas do navegador, e-mails,
    documentos, anexos, logs colados), esse conteúdo pode incluir instruções que tentem
    sequestrar o modelo. Isso pode acontecer mesmo que **você seja o único remetente**.

    O maior risco ocorre quando ferramentas estão ativadas: o modelo pode ser enganado para
    exfiltrar contexto ou chamar ferramentas em seu nome. Reduza o raio de impacto:

    - usando um agent "leitor", somente leitura ou sem ferramentas, para resumir conteúdo não confiável
    - mantendo `web_search` / `web_fetch` / `browser` desativados para agents com ferramentas habilitadas
    - tratando também como não confiável o texto decodificado de arquivos/documentos: `input_file` do
      OpenResponses e a extração de anexos de mídia envolvem o texto extraído em
      marcadores explícitos de limite de conteúdo externo, em vez de passar o texto bruto do arquivo
    - com sandboxing e allowlists rígidas de ferramentas

    Detalhes: [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Meu bot deve ter seu próprio e-mail, conta do GitHub ou número de telefone?">
    Sim, na maioria das configurações. Isolar o bot com contas e números de telefone separados
    reduz o raio de impacto se algo der errado. Isso também facilita rotacionar
    credenciais ou revogar acesso sem impactar suas contas pessoais.

    Comece pequeno. Dê acesso apenas às ferramentas e contas de que você realmente precisa e expanda
    depois, se necessário.

    Documentação: [Segurança](/pt-BR/gateway/security), [Pairing](/pt-BR/channels/pairing).

  </Accordion>

  <Accordion title="Posso dar autonomia sobre minhas mensagens de texto e isso é seguro?">
    **Não** recomendamos autonomia total sobre suas mensagens pessoais. O padrão mais seguro é:

    - Manter DMs em **modo pairing** ou em uma allowlist restrita.
    - Usar um **número ou conta separados** se quiser que ele envie mensagens em seu nome.
    - Deixar que ele redija e depois **aprovar antes de enviar**.

    Se você quiser experimentar, faça isso em uma conta dedicada e mantenha tudo isolado. Consulte
    [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Posso usar modelos mais baratos para tarefas de assistente pessoal?">
    Sim, **desde que** o agent seja apenas de chat e a entrada seja confiável. Camadas menores são
    mais suscetíveis a sequestro de instruções, então evite-as para agents com ferramentas habilitadas
    ou ao ler conteúdo não confiável. Se você precisar usar um modelo menor, restrinja
    as ferramentas e execute dentro de um sandbox. Consulte [Segurança](/pt-BR/gateway/security).
  </Accordion>

  <Accordion title="Executei /start no Telegram, mas não recebi um código de pairing">
    Códigos de pairing são enviados **apenas** quando um remetente desconhecido envia mensagem ao bot e
    `dmPolicy: "pairing"` está ativado. `/start` por si só não gera um código.

    Verifique as solicitações pendentes:

    ```bash
    openclaw pairing list telegram
    ```

    Se você quiser acesso imediato, adicione seu ID de remetente à allowlist ou defina `dmPolicy: "open"`
    para essa conta.

  </Accordion>

  <Accordion title="WhatsApp: ele enviará mensagens para meus contatos? Como o pairing funciona?">
    Não. A política padrão de DM no WhatsApp é **pairing**. Remetentes desconhecidos recebem apenas um código de pairing e a mensagem deles **não é processada**. O OpenClaw só responde a chats que recebe ou a envios explícitos que você aciona.

    Aprove o pairing com:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Liste as solicitações pendentes:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt do assistente para número de telefone: ele é usado para definir sua **allowlist/proprietário** para que suas próprias DMs sejam permitidas. Não é usado para envio automático. Se você executar no seu número pessoal do WhatsApp, use esse número e ative `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandos de chat, interrupção de tarefas e "ele não para"

<AccordionGroup>
  <Accordion title="Como faço para impedir que mensagens internas do sistema apareçam no chat?">
    A maioria das mensagens internas ou de ferramentas só aparece quando **verbose**, **trace** ou **reasoning** está ativado
    para aquela sessão.

    Corrija no chat em que você está vendo isso:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Se ainda estiver barulhento, verifique as configurações da sessão na Control UI e defina verbose
    como **inherit**. Confirme também que você não está usando um perfil de bot com `verboseDefault` definido
    como `on` na configuração.

    Documentação: [Thinking e verbose](/pt-BR/tools/thinking), [Segurança](/pt-BR/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Como paro/cancelo uma tarefa em execução?">
    Envie qualquer um destes **como uma mensagem independente** (sem slash):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Esses são gatilhos de interrupção (não são comandos slash).

    Para processos em segundo plano (da ferramenta exec), você pode pedir ao agent para executar:

    ```
    process action:kill sessionId:XXX
    ```

    Visão geral dos comandos slash: consulte [Comandos slash](/pt-BR/tools/slash-commands).

    A maioria dos comandos deve ser enviada como uma mensagem **independente** que comece com `/`, mas alguns atalhos (como `/status`) também funcionam inline para remetentes na allowlist.

  </Accordion>

  <Accordion title='Como envio uma mensagem do Discord a partir do Telegram? ("Cross-context messaging denied")'>
    O OpenClaw bloqueia mensagens **entre provedores** por padrão. Se uma chamada de ferramenta estiver vinculada
    ao Telegram, ela não enviará ao Discord a menos que você permita explicitamente.

    Ative mensagens entre provedores para o agent:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Reinicie o gateway após editar a configuração.

  </Accordion>

  <Accordion title='Por que parece que o bot "ignora" mensagens enviadas em rápida sucessão?'>
    O modo de fila controla como novas mensagens interagem com uma execução em andamento. Use `/queue` para mudar os modos:

    - `steer` - novas mensagens redirecionam a tarefa atual
    - `followup` - executa mensagens uma por vez
    - `collect` - agrupa mensagens e responde uma vez (padrão)
    - `steer-backlog` - redireciona agora e depois processa o backlog
    - `interrupt` - interrompe a execução atual e começa do zero

    Você pode adicionar opções como `debounce:2s cap:25 drop:summarize` para modos de followup.

  </Accordion>
</AccordionGroup>

## Diversos

<AccordionGroup>
  <Accordion title='Qual é o modelo padrão da Anthropic com uma chave de API?'>
    No OpenClaw, credenciais e seleção de modelo são coisas separadas. Definir `ANTHROPIC_API_KEY` (ou armazenar uma chave de API da Anthropic em perfis de autenticação) ativa a autenticação, mas o modelo padrão real é aquele que você configurar em `agents.defaults.model.primary` (por exemplo, `anthropic/claude-sonnet-4-6` ou `anthropic/claude-opus-4-6`). Se você vir `No credentials found for profile "anthropic:default"`, isso significa que o Gateway não conseguiu encontrar credenciais da Anthropic no `auth-profiles.json` esperado para o agent em execução.
  </Accordion>
</AccordionGroup>

---

Ainda está travado? Pergunte no [Discord](https://discord.com/invite/clawd) ou abra uma [discussão no GitHub](https://github.com/openclaw/openclaw/discussions).
