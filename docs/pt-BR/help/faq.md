---
read_when:
    - Respondendo a perguntas comuns de suporte sobre configuração, instalação, onboarding ou tempo de execução
    - Triagem de problemas relatados por usuários antes de uma depuração mais profunda
summary: Perguntas frequentes sobre configuração, ajustes e uso do OpenClaw
title: Perguntas frequentes
x-i18n:
    generated_at: "2026-04-24T08:57:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ae635d7ade265e3e79d1f5489ae23034a341843bd784f68a985b18bee5bdf6f
    source_path: help/faq.md
    workflow: 15
---

Respostas rápidas com solução de problemas mais profunda para configurações reais (desenvolvimento local, VPS, multi-agent, OAuth/chaves de API, failover de modelo). Para diagnósticos de tempo de execução, consulte [Troubleshooting](/pt-BR/gateway/troubleshooting). Para a referência completa de configuração, consulte [Configuration](/pt-BR/gateway/configuration).

## Primeiros 60 segundos se algo estiver quebrado

1. **Status rápido (primeira verificação)**

   ```bash
   openclaw status
   ```

   Resumo local rápido: SO + atualização, alcançabilidade do gateway/serviço, agentes/sessões, configuração do provedor + problemas de tempo de execução (quando o gateway está alcançável).

2. **Relatório pronto para colar (seguro para compartilhar)**

   ```bash
   openclaw status --all
   ```

   Diagnóstico somente leitura com tail do log (tokens redigidos).

3. **Estado do daemon + porta**

   ```bash
   openclaw gateway status
   ```

   Mostra o tempo de execução do supervisor em comparação com a alcançabilidade do RPC, a URL de destino da sonda e qual configuração o serviço provavelmente usou.

4. **Sondas profundas**

   ```bash
   openclaw status --deep
   ```

   Executa uma sonda de saúde ativa do gateway, incluindo sondas de canal quando compatíveis
   (requer um gateway alcançável). Consulte [Health](/pt-BR/gateway/health).

5. **Acompanhe o log mais recente**

   ```bash
   openclaw logs --follow
   ```

   Se o RPC estiver indisponível, use como alternativa:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Os logs em arquivo são separados dos logs do serviço; consulte [Logging](/pt-BR/logging) e [Troubleshooting](/pt-BR/gateway/troubleshooting).

6. **Execute o doctor (reparos)**

   ```bash
   openclaw doctor
   ```

   Repara/migra configuração/estado + executa verificações de saúde. Consulte [Doctor](/pt-BR/gateway/doctor).

7. **Snapshot do gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # mostra a URL de destino + o caminho da configuração em erros
   ```

   Solicita ao gateway em execução um snapshot completo (somente WS). Consulte [Health](/pt-BR/gateway/health).

## Início rápido e configuração da primeira execução

Perguntas e respostas da primeira execução — instalação, onboarding, rotas de autenticação, assinaturas, falhas iniciais —
estão em [First-run FAQ](/pt-BR/help/faq-first-run).

## O que é OpenClaw?

<AccordionGroup>
  <Accordion title="O que é o OpenClaw, em um parágrafo?">
    OpenClaw é um assistente pessoal de IA que você executa nos seus próprios dispositivos. Ele responde nas superfícies de mensagem que você já usa (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat e plugins de canal agrupados, como QQ Bot) e também pode fazer voz + um Canvas ao vivo em plataformas compatíveis. O **Gateway** é o plano de controle sempre ativo; o assistente é o produto.
  </Accordion>

  <Accordion title="Proposta de valor">
    OpenClaw não é "apenas um wrapper do Claude". É um **plano de controle local-first** que permite executar um
    assistente capaz em **seu próprio hardware**, acessível pelos aplicativos de chat que você já usa, com
    sessões com estado, memória e ferramentas — sem entregar o controle dos seus fluxos de trabalho a um
    SaaS hospedado.

    Destaques:

    - **Seus dispositivos, seus dados:** execute o Gateway onde quiser (Mac, Linux, VPS) e mantenha o
      workspace + histórico de sessões local.
    - **Canais reais, não um sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc.,
      além de voz no celular e Canvas em plataformas compatíveis.
    - **Agnóstico a modelo:** use Anthropic, OpenAI, MiniMax, OpenRouter etc., com roteamento
      por agente e failover.
    - **Opção somente local:** execute modelos locais para que **todos os dados possam permanecer no seu dispositivo** se quiser.
    - **Roteamento multi-agent:** agentes separados por canal, conta ou tarefa, cada um com seu próprio
      workspace e padrões.
    - **Open source e extensível:** inspecione, estenda e faça self-host sem lock-in de fornecedor.

    Documentação: [Gateway](/pt-BR/gateway), [Channels](/pt-BR/channels), [Multi-agent](/pt-BR/concepts/multi-agent),
    [Memory](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Acabei de configurar — o que devo fazer primeiro?">
    Bons primeiros projetos:

    - Criar um site (WordPress, Shopify ou um site estático simples).
    - Prototipar um app mobile (estrutura, telas, plano de API).
    - Organizar arquivos e pastas (limpeza, nomenclatura, tags).
    - Conectar o Gmail e automatizar resumos ou acompanhamentos.

    Ele consegue lidar com tarefas grandes, mas funciona melhor quando você as divide em fases e
    usa subagentes para trabalho em paralelo.

  </Accordion>

  <Accordion title="Quais são os cinco principais casos de uso do dia a dia para o OpenClaw?">
    Ganhos do dia a dia geralmente se parecem com isto:

    - **Briefings pessoais:** resumos da caixa de entrada, calendário e notícias importantes para você.
    - **Pesquisa e redação:** pesquisas rápidas, resumos e primeiros rascunhos para emails ou documentos.
    - **Lembretes e acompanhamentos:** lembretes e checklists orientados por Cron ou Heartbeat.
    - **Automação de navegador:** preenchimento de formulários, coleta de dados e repetição de tarefas na web.
    - **Coordenação entre dispositivos:** envie uma tarefa do seu telefone, deixe o Gateway executá-la em um servidor e receba o resultado de volta no chat.

  </Accordion>

  <Accordion title="O OpenClaw pode ajudar com geração de leads, outreach, anúncios e blogs para um SaaS?">
    Sim, para **pesquisa, qualificação e redação**. Ele pode varrer sites, montar listas curtas,
    resumir prospects e escrever rascunhos de outreach ou de textos para anúncios.

    Para **outreach ou campanhas de anúncios**, mantenha um humano no circuito. Evite spam, siga as leis locais e
    as políticas da plataforma e revise qualquer coisa antes de enviar. O padrão mais seguro é deixar o
    OpenClaw redigir e você aprovar.

    Documentação: [Security](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Quais são as vantagens em relação ao Claude Code para desenvolvimento web?">
    OpenClaw é um **assistente pessoal** e camada de coordenação, não um substituto de IDE. Use
    Claude Code ou Codex para o loop de programação direta mais rápido dentro de um repositório. Use OpenClaw quando você
    quiser memória durável, acesso entre dispositivos e orquestração de ferramentas.

    Vantagens:

    - **Memória + workspace persistentes** entre sessões
    - **Acesso multiplataforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orquestração de ferramentas** (navegador, arquivos, agendamento, hooks)
    - **Gateway sempre ativo** (execute em uma VPS, interaja de qualquer lugar)
    - **Nodes** para navegador/tela/câmera/execução local

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills e automação

<AccordionGroup>
  <Accordion title="Como personalizo Skills sem manter o repositório sujo?">
    Use substituições gerenciadas em vez de editar a cópia do repositório. Coloque suas alterações em `~/.openclaw/skills/<name>/SKILL.md` (ou adicione uma pasta via `skills.load.extraDirs` em `~/.openclaw/openclaw.json`). A precedência é `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → agrupadas → `skills.load.extraDirs`, então as substituições gerenciadas ainda prevalecem sobre as Skills agrupadas sem tocar no git. Se você precisar da Skill instalada globalmente, mas visível apenas para alguns agentes, mantenha a cópia compartilhada em `~/.openclaw/skills` e controle a visibilidade com `agents.defaults.skills` e `agents.list[].skills`. Somente alterações dignas de upstream devem ficar no repositório e ser enviadas como PRs.
  </Accordion>

  <Accordion title="Posso carregar Skills de uma pasta personalizada?">
    Sim. Adicione diretórios extras via `skills.load.extraDirs` em `~/.openclaw/openclaw.json` (menor precedência). A precedência padrão é `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → agrupadas → `skills.load.extraDirs`. `clawhub` instala em `./skills` por padrão, que o OpenClaw trata como `<workspace>/skills` na próxima sessão. Se a Skill deve ficar visível apenas para certos agentes, combine isso com `agents.defaults.skills` ou `agents.list[].skills`.
  </Accordion>

  <Accordion title="Como posso usar modelos diferentes para tarefas diferentes?">
    Hoje, os padrões compatíveis são:

    - **Jobs do Cron**: jobs isolados podem definir uma substituição de `model` por job.
    - **Subagentes**: roteie tarefas para agentes separados com modelos padrão diferentes.
    - **Troca sob demanda**: use `/model` para trocar o modelo da sessão atual a qualquer momento.

    Consulte [Cron jobs](/pt-BR/automation/cron-jobs), [Multi-Agent Routing](/pt-BR/concepts/multi-agent) e [Slash commands](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="O bot trava ao fazer trabalho pesado. Como descarrego isso?">
    Use **subagentes** para tarefas longas ou paralelas. Os subagentes são executados em sua própria sessão,
    retornam um resumo e mantêm seu chat principal responsivo.

    Peça ao seu bot para "spawn a sub-agent for this task" ou use `/subagents`.
    Use `/status` no chat para ver o que o Gateway está fazendo agora (e se ele está ocupado).

    Dica sobre tokens: tarefas longas e subagentes consomem tokens. Se o custo for uma preocupação, defina um
    modelo mais barato para subagentes via `agents.defaults.subagents.model`.

    Documentação: [Sub-agents](/pt-BR/tools/subagents), [Background Tasks](/pt-BR/automation/tasks).

  </Accordion>

  <Accordion title="Como funcionam as sessões de subagente vinculadas a threads no Discord?">
    Use vínculos de thread. Você pode vincular uma thread do Discord a um subagente ou alvo de sessão para que as mensagens de acompanhamento nessa thread permaneçam nessa sessão vinculada.

    Fluxo básico:

    - Faça spawn com `sessions_spawn` usando `thread: true` (e opcionalmente `mode: "session"` para acompanhamento persistente).
    - Ou vincule manualmente com `/focus <target>`.
    - Use `/agents` para inspecionar o estado do vínculo.
    - Use `/session idle <duration|off>` e `/session max-age <duration|off>` para controlar o auto-unfocus.
    - Use `/unfocus` para desvincular a thread.

    Configuração necessária:

    - Padrões globais: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Substituições do Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Vinculação automática no spawn: defina `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Documentação: [Sub-agents](/pt-BR/tools/subagents), [Discord](/pt-BR/channels/discord), [Configuration Reference](/pt-BR/gateway/configuration-reference), [Slash commands](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Um subagente terminou, mas a atualização de conclusão foi para o lugar errado ou nunca foi publicada. O que devo verificar?">
    Verifique primeiro a rota solicitante resolvida:

    - A entrega de subagente no modo de conclusão prefere qualquer thread vinculada ou rota de conversa quando uma existir.
    - Se a origem da conclusão carregar apenas um canal, o OpenClaw recorre à rota armazenada da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda possa funcionar.
    - Se não existir nem uma rota vinculada nem uma rota armazenada utilizável, a entrega direta pode falhar e o resultado recorre à entrega em fila da sessão em vez de ser publicado imediatamente no chat.
    - Alvos inválidos ou obsoletos ainda podem forçar o fallback para fila ou a falha final da entrega.
    - Se a última resposta visível do assistente filho for exatamente o token silencioso `NO_REPLY` / `no_reply`, ou exatamente `ANNOUNCE_SKIP`, o OpenClaw suprime intencionalmente o anúncio em vez de publicar um progresso anterior obsoleto.
    - Se o filho expirou após apenas chamadas de ferramenta, o anúncio pode condensar isso em um resumo curto de progresso parcial em vez de reproduzir a saída bruta da ferramenta.

    Depuração:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentação: [Sub-agents](/pt-BR/tools/subagents), [Background Tasks](/pt-BR/automation/tasks), [Session Tools](/pt-BR/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron ou lembretes não disparam. O que devo verificar?">
    O Cron é executado dentro do processo do Gateway. Se o Gateway não estiver em execução contínua,
    os jobs agendados não serão executados.

    Checklist:

    - Confirme que o Cron está habilitado (`cron.enabled`) e que `OPENCLAW_SKIP_CRON` não está definido.
    - Verifique se o Gateway está em execução 24/7 (sem suspensão/reinicializações).
    - Verifique as configurações de fuso horário do job (`--tz` vs fuso horário do host).

    Depuração:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentação: [Cron jobs](/pt-BR/automation/cron-jobs), [Automation & Tasks](/pt-BR/automation).

  </Accordion>

  <Accordion title="O Cron disparou, mas nada foi enviado para o canal. Por quê?">
    Verifique primeiro o modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"` significa que não se espera envio de fallback pelo executor.
    - Alvo de anúncio ausente ou inválido (`channel` / `to`) significa que o executor ignorou a entrega de saída.
    - Falhas de autenticação do canal (`unauthorized`, `Forbidden`) significam que o executor tentou entregar, mas as credenciais bloquearam isso.
    - Um resultado isolado silencioso (`NO_REPLY` / `no_reply` apenas) é tratado como intencionalmente não entregável, então o executor também suprime a entrega de fallback em fila.

    Para jobs de Cron isolados, o agente ainda pode enviar diretamente com a ferramenta `message`
    quando uma rota de chat está disponível. `--announce` controla apenas o caminho de fallback do executor
    para o texto final que o agente ainda não enviou diretamente.

    Depuração:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentação: [Cron jobs](/pt-BR/automation/cron-jobs), [Background Tasks](/pt-BR/automation/tasks).

  </Accordion>

  <Accordion title="Por que uma execução isolada do Cron trocou de modelo ou tentou novamente uma vez?">
    Isso geralmente é o caminho ativo de troca de modelo, não agendamento duplicado.

    O Cron isolado pode persistir uma transferência de modelo em tempo de execução e tentar novamente quando a
    execução ativa gera `LiveSessionModelSwitchError`. A nova tentativa mantém o
    provedor/modelo trocado e, se a troca carregou uma nova substituição de perfil de autenticação, o Cron
    também persiste isso antes de tentar novamente.

    Regras de seleção relacionadas:

    - A substituição de modelo do hook do Gmail vence primeiro quando aplicável.
    - Depois, o `model` por job.
    - Depois, qualquer substituição de modelo armazenada da sessão do Cron.
    - Depois, a seleção normal de modelo do agente/padrão.

    O loop de nova tentativa é limitado. Após a tentativa inicial mais 2 novas tentativas de troca,
    o Cron aborta em vez de entrar em loop para sempre.

    Depuração:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentação: [Cron jobs](/pt-BR/automation/cron-jobs), [cron CLI](/pt-BR/cli/cron).

  </Accordion>

  <Accordion title="Como instalo Skills no Linux?">
    Use os comandos nativos `openclaw skills` ou coloque Skills no seu workspace. A interface de Skills do macOS não está disponível no Linux.
    Explore Skills em [https://clawhub.ai](https://clawhub.ai).

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

    O `openclaw skills install` nativo grava no diretório `skills/`
    do workspace ativo. Instale a CLI separada `clawhub` apenas se você quiser publicar ou
    sincronizar suas próprias Skills. Para instalações compartilhadas entre agentes, coloque a Skill em
    `~/.openclaw/skills` e use `agents.defaults.skills` ou
    `agents.list[].skills` se quiser restringir quais agentes podem vê-la.

  </Accordion>

  <Accordion title="O OpenClaw pode executar tarefas em um agendamento ou continuamente em segundo plano?">
    Sim. Use o agendador do Gateway:

    - **Cron jobs** para tarefas agendadas ou recorrentes (persistem entre reinicializações).
    - **Heartbeat** para verificações periódicas da "sessão principal".
    - **Jobs isolados** para agentes autônomos que publicam resumos ou entregam em chats.

    Documentação: [Cron jobs](/pt-BR/automation/cron-jobs), [Automation & Tasks](/pt-BR/automation),
    [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>

  <Accordion title="Posso executar Skills exclusivas do Apple macOS no Linux?">
    Não diretamente. Skills do macOS são controladas por `metadata.openclaw.os` mais bins necessários, e as Skills só aparecem no prompt do sistema quando são elegíveis no **host do Gateway**. No Linux, Skills exclusivas de `darwin` (como `apple-notes`, `apple-reminders`, `things-mac`) não serão carregadas, a menos que você substitua esse controle.

    Você tem três padrões compatíveis:

    **Opção A - executar o Gateway em um Mac (mais simples).**
    Execute o Gateway onde os bins do macOS existem, depois conecte-se do Linux em [modo remoto](#gateway-ports-already-running-and-remote-mode) ou por Tailscale. As Skills são carregadas normalmente porque o host do Gateway é macOS.

    **Opção B - usar um Node do macOS (sem SSH).**
    Execute o Gateway no Linux, emparelhe um Node do macOS (aplicativo de barra de menu) e defina **Node Run Commands** como "Always Ask" ou "Always Allow" no Mac. O OpenClaw pode tratar Skills exclusivas do macOS como elegíveis quando os bins necessários existirem no Node. O agente executa essas Skills via a ferramenta `nodes`. Se você escolher "Always Ask", aprovar "Always Allow" no prompt adiciona esse comando à allowlist.

    **Opção C - fazer proxy de bins do macOS por SSH (avançado).**
    Mantenha o Gateway no Linux, mas faça com que os bins de CLI necessários sejam resolvidos para wrappers SSH executados em um Mac. Depois substitua a Skill para permitir Linux, para que ela continue elegível.

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
       description: Gerenciar Apple Notes via a CLI memo no macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Inicie uma nova sessão para atualizar o snapshot de Skills.

  </Accordion>

  <Accordion title="Vocês têm integração com Notion ou HeyGen?">
    Não integrada nativamente hoje.

    Opções:

    - **Skill / plugin personalizado:** melhor para acesso confiável à API (Notion e HeyGen ambos têm APIs).
    - **Automação de navegador:** funciona sem código, mas é mais lenta e mais frágil.

    Se você quiser manter contexto por cliente (fluxos de trabalho de agência), um padrão simples é:

    - Uma página do Notion por cliente (contexto + preferências + trabalho ativo).
    - Pedir ao agente para buscar essa página no início de uma sessão.

    Se você quiser uma integração nativa, abra uma solicitação de funcionalidade ou crie uma Skill
    voltada para essas APIs.

    Instalar Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Instalações nativas vão para o diretório `skills/` do workspace ativo. Para Skills compartilhadas entre agentes, coloque-as em `~/.openclaw/skills/<name>/SKILL.md`. Se apenas alguns agentes devem ver uma instalação compartilhada, configure `agents.defaults.skills` ou `agents.list[].skills`. Algumas Skills esperam bins instalados via Homebrew; no Linux isso significa Linuxbrew (consulte a entrada correspondente do FAQ sobre Homebrew no Linux acima). Consulte [Skills](/pt-BR/tools/skills), [Skills config](/pt-BR/tools/skills-config) e [ClawHub](/pt-BR/tools/clawhub).

  </Accordion>

  <Accordion title="Como uso meu Chrome já autenticado com o OpenClaw?">
    Use o perfil de navegador integrado `user`, que se conecta pelo Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Se você quiser um nome personalizado, crie um perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Esse caminho pode usar o navegador local do host ou um Node de navegador conectado. Se o Gateway for executado em outro lugar, execute um host de Node na máquina do navegador ou use CDP remoto.

    Limites atuais em `existing-session` / `user`:

    - as ações são orientadas por ref, não por seletor CSS
    - uploads exigem `ref` / `inputRef` e atualmente suportam um arquivo por vez
    - `responsebody`, exportação em PDF, interceptação de download e ações em lote ainda precisam de um navegador gerenciado ou perfil CDP bruto

  </Accordion>
</AccordionGroup>

## Sandboxing e memória

<AccordionGroup>
  <Accordion title="Existe uma documentação dedicada para sandboxing?">
    Sim. Consulte [Sandboxing](/pt-BR/gateway/sandboxing). Para configuração específica de Docker (gateway completo em Docker ou imagens de sandbox), consulte [Docker](/pt-BR/install/docker).
  </Accordion>

  <Accordion title="O Docker parece limitado - como habilito recursos completos?">
    A imagem padrão prioriza segurança e é executada como o usuário `node`, então não
    inclui pacotes do sistema, Homebrew ou navegadores agrupados. Para uma configuração mais completa:

    - Persista `/home/node` com `OPENCLAW_HOME_VOLUME` para que os caches sobrevivam.
    - Incorpore dependências do sistema na imagem com `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instale navegadores do Playwright pela CLI agrupada:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Defina `PLAYWRIGHT_BROWSERS_PATH` e garanta que o caminho seja persistido.

    Documentação: [Docker](/pt-BR/install/docker), [Browser](/pt-BR/tools/browser).

  </Accordion>

  <Accordion title="Posso manter DMs pessoais, mas tornar grupos públicos/em sandbox com um único agente?">
    Sim — se o seu tráfego privado for em **DMs** e o seu tráfego público for em **grupos**.

    Use `agents.defaults.sandbox.mode: "non-main"` para que sessões de grupo/canal (chaves não principais) sejam executadas no backend de sandbox configurado, enquanto a sessão principal de DM permanece no host. Docker é o backend padrão se você não escolher outro. Depois restrinja quais ferramentas ficam disponíveis em sessões em sandbox via `tools.sandbox.tools`.

    Passo a passo de configuração + exemplo: [Groups: personal DMs + public groups](/pt-BR/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referência principal de configuração: [Gateway configuration](/pt-BR/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Como vinculo uma pasta do host na sandbox?">
    Defina `agents.defaults.sandbox.docker.binds` como `["host:path:mode"]` (por exemplo, `"/home/user/src:/src:ro"`). Os vínculos globais + por agente são mesclados; vínculos por agente são ignorados quando `scope: "shared"`. Use `:ro` para qualquer coisa sensível e lembre-se de que vínculos ignoram as barreiras do sistema de arquivos da sandbox.

    O OpenClaw valida origens de vínculo tanto em relação ao caminho normalizado quanto ao caminho canônico resolvido pelo ancestral existente mais profundo. Isso significa que escapes por pai com symlink ainda falham de forma segura mesmo quando o último segmento do caminho ainda não existe, e as verificações de raiz permitida ainda se aplicam após a resolução do symlink.

    Consulte [Sandboxing](/pt-BR/gateway/sandboxing#custom-bind-mounts) e [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) para exemplos e observações de segurança.

  </Accordion>

  <Accordion title="Como a memória funciona?">
    A memória do OpenClaw são apenas arquivos Markdown no workspace do agente:

    - Notas diárias em `memory/YYYY-MM-DD.md`
    - Notas curadas de longo prazo em `MEMORY.md` (somente sessões principais/privadas)

    O OpenClaw também executa um **flush silencioso de memória antes da Compaction** para lembrar o modelo
    de gravar notas duráveis antes da auto-Compaction. Isso só é executado quando o workspace
    é gravável (sandboxes somente leitura ignoram isso). Consulte [Memory](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="A memória continua esquecendo coisas. Como faço para fixar isso?">
    Peça ao bot para **gravar o fato na memória**. Notas de longo prazo devem ficar em `MEMORY.md`,
    contexto de curto prazo vai em `memory/YYYY-MM-DD.md`.

    Esta ainda é uma área que estamos melhorando. Ajuda lembrar o modelo de armazenar memórias;
    ele saberá o que fazer. Se ele continuar esquecendo, verifique se o Gateway está usando o mesmo
    workspace em todas as execuções.

    Documentação: [Memory](/pt-BR/concepts/memory), [Agent workspace](/pt-BR/concepts/agent-workspace).

  </Accordion>

  <Accordion title="A memória persiste para sempre? Quais são os limites?">
    Os arquivos de memória ficam no disco e persistem até você excluí-los. O limite é o seu
    armazenamento, não o modelo. O **contexto da sessão** ainda é limitado pela janela de contexto
    do modelo, então conversas longas podem ser compactadas ou truncadas. É por isso
    que existe a busca em memória — ela traz apenas as partes relevantes de volta ao contexto.

    Documentação: [Memory](/pt-BR/concepts/memory), [Context](/pt-BR/concepts/context).

  </Accordion>

  <Accordion title="A busca de memória semântica exige uma chave de API da OpenAI?">
    Só se você usar **embeddings da OpenAI**. O OAuth do Codex cobre chat/completions e
    **não** concede acesso a embeddings, então **fazer login com o Codex (OAuth ou o
    login da CLI do Codex)** não ajuda na busca de memória semântica. Embeddings da OpenAI
    ainda exigem uma chave de API real (`OPENAI_API_KEY` ou `models.providers.openai.apiKey`).

    Se você não definir um provedor explicitamente, o OpenClaw seleciona automaticamente um provedor quando
    consegue resolver uma chave de API (perfis de autenticação, `models.providers.*.apiKey` ou variáveis de ambiente).
    Ele prefere OpenAI se uma chave da OpenAI for resolvida; caso contrário, Gemini se uma chave do Gemini
    for resolvida; depois Voyage; depois Mistral. Se nenhuma chave remota estiver disponível, a
    busca de memória permanece desativada até você configurá-la. Se você tiver um caminho de modelo local
    configurado e presente, o OpenClaw
    prefere `local`. Ollama é compatível quando você define explicitamente
    `memorySearch.provider = "ollama"`.

    Se preferir permanecer local, defina `memorySearch.provider = "local"` (e opcionalmente
    `memorySearch.fallback = "none"`). Se quiser embeddings do Gemini, defina
    `memorySearch.provider = "gemini"` e forneça `GEMINI_API_KEY` (ou
    `memorySearch.remote.apiKey`). Temos suporte a modelos de embedding **OpenAI, Gemini, Voyage, Mistral, Ollama ou local**
    — consulte [Memory](/pt-BR/concepts/memory) para os detalhes de configuração.

  </Accordion>
</AccordionGroup>

## Onde as coisas ficam no disco

<AccordionGroup>
  <Accordion title="Todos os dados usados com o OpenClaw são salvos localmente?">
    Não — **o estado do OpenClaw é local**, mas **serviços externos ainda veem o que você envia para eles**.

    - **Local por padrão:** sessões, arquivos de memória, configuração e workspace ficam no host do Gateway
      (`~/.openclaw` + o diretório do seu workspace).
    - **Remoto por necessidade:** mensagens enviadas a provedores de modelo (Anthropic/OpenAI/etc.) vão para
      as APIs deles, e plataformas de chat (WhatsApp/Telegram/Slack/etc.) armazenam dados de mensagem em
      seus servidores.
    - **Você controla a superfície:** usar modelos locais mantém os prompts na sua máquina, mas o
      tráfego do canal ainda passa pelos servidores do canal.

    Relacionado: [Agent workspace](/pt-BR/concepts/agent-workspace), [Memory](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Onde o OpenClaw armazena seus dados?">
    Tudo fica em `$OPENCLAW_STATE_DIR` (padrão: `~/.openclaw`):

    | Caminho                                                         | Finalidade                                                         |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuração principal (JSON5)                                     |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Importação legada de OAuth (copiada para perfis de autenticação no primeiro uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Perfis de autenticação (OAuth, chaves de API e `keyRef`/`tokenRef` opcionais) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload secreto opcional baseado em arquivo para provedores `file` de SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Arquivo legado de compatibilidade (entradas estáticas `api_key` removidas) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Estado do provedor (por exemplo, `whatsapp/<accountId>/creds.json`) |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Estado por agente (`agentDir` + sessões)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Histórico e estado da conversa (por agente)                        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadados de sessão (por agente)                                   |

    Caminho legado de agente único: `~/.openclaw/agent/*` (migrado por `openclaw doctor`).

    Seu **workspace** (`AGENTS.md`, arquivos de memória, Skills etc.) é separado e configurado via `agents.defaults.workspace` (padrão: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Onde devem ficar AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Esses arquivos ficam no **workspace do agente**, não em `~/.openclaw`.

    - **Workspace (por agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opcional.
      `memory.md` em minúsculas na raiz é apenas entrada de reparo legado; `openclaw doctor --fix`
      pode mesclá-lo em `MEMORY.md` quando ambos os arquivos existirem.
    - **Diretório de estado (`~/.openclaw`)**: configuração, estado de canal/provedor, perfis de autenticação, sessões, logs
      e Skills compartilhadas (`~/.openclaw/skills`).

    O workspace padrão é `~/.openclaw/workspace`, configurável via:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Se o bot "esquece" após uma reinicialização, confirme que o Gateway está usando o mesmo
    workspace em todas as inicializações (e lembre-se: o modo remoto usa o **workspace do host do gateway**,
    não o do seu notebook local).

    Dica: se você quiser um comportamento ou preferência durável, peça ao bot para **gravar isso em
    AGENTS.md ou MEMORY.md** em vez de depender do histórico do chat.

    Consulte [Agent workspace](/pt-BR/concepts/agent-workspace) e [Memory](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Estratégia de backup recomendada">
    Coloque seu **workspace do agente** em um repositório git **privado** e faça backup em algum lugar
    privado (por exemplo, GitHub privado). Isso captura memória + arquivos AGENTS/SOUL/USER
    e permite restaurar a "mente" do assistente depois.

    **Não** faça commit de nada em `~/.openclaw` (credenciais, sessões, tokens ou payloads secretos criptografados).
    Se você precisar de uma restauração completa, faça backup separadamente do workspace e do diretório de estado
    (consulte a pergunta sobre migração acima).

    Documentação: [Agent workspace](/pt-BR/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Como desinstalo completamente o OpenClaw?">
    Consulte o guia dedicado: [Uninstall](/pt-BR/install/uninstall).
  </Accordion>

  <Accordion title="Os agentes podem trabalhar fora do workspace?">
    Sim. O workspace é o **cwd padrão** e âncora de memória, não uma sandbox rígida.
    Caminhos relativos são resolvidos dentro do workspace, mas caminhos absolutos podem acessar outros
    locais do host, a menos que a sandbox esteja habilitada. Se você precisar de isolamento, use
    [`agents.defaults.sandbox`](/pt-BR/gateway/sandboxing) ou configurações de sandbox por agente. Se você
    quiser que um repositório seja o diretório de trabalho padrão, aponte o
    `workspace` desse agente para a raiz do repositório. O repositório do OpenClaw é apenas código-fonte; mantenha o
    workspace separado, a menos que você queira intencionalmente que o agente trabalhe dentro dele.

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

  <Accordion title="Modo remoto: onde fica o armazenamento de sessão?">
    O estado da sessão pertence ao **host do gateway**. Se você estiver em modo remoto, o armazenamento de sessão relevante fica na máquina remota, não no seu notebook local. Consulte [Session management](/pt-BR/concepts/session).
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

  <Accordion title='Defini `gateway.bind: "lan"` (ou `"tailnet"`) e agora nada escuta / a interface mostra unauthorized'>
    Binds fora de loopback **exigem um caminho de autenticação do gateway válido**. Na prática, isso significa:

    - autenticação por segredo compartilhado: token ou senha
    - `gateway.auth.mode: "trusted-proxy"` por trás de um proxy reverso com reconhecimento de identidade, corretamente configurado e fora de loopback

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

    - `gateway.remote.token` / `.password` **não** habilitam por si só a autenticação do gateway local.
    - Caminhos de chamada local podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` não estiver definido.
    - Para autenticação por senha, defina `gateway.auth.mode: "password"` mais `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Se `gateway.auth.token` / `gateway.auth.password` for explicitamente configurado via SecretRef e não resolvido, a resolução falha de forma segura (sem fallback remoto mascarando o problema).
    - Configurações de Control UI com segredo compartilhado autenticam via `connect.params.auth.token` ou `connect.params.auth.password` (armazenados nas configurações do app/interface). Modos com identidade, como Tailscale Serve ou `trusted-proxy`, usam cabeçalhos de requisição. Evite colocar segredos compartilhados em URLs.
    - Com `gateway.auth.mode: "trusted-proxy"`, proxies reversos loopback no mesmo host ainda **não** satisfazem a autenticação trusted-proxy. O trusted proxy precisa ser uma origem configurada fora de loopback.

  </Accordion>

  <Accordion title="Por que agora preciso de um token no localhost?">
    O OpenClaw impõe autenticação do gateway por padrão, inclusive em loopback. No caminho padrão normal, isso significa autenticação por token: se nenhum caminho de autenticação explícito estiver configurado, a inicialização do gateway resolve para o modo token e gera um automaticamente, salvando-o em `gateway.auth.token`, então **clientes WS locais precisam se autenticar**. Isso bloqueia outros processos locais de chamarem o Gateway.

    Se você preferir um caminho de autenticação diferente, pode escolher explicitamente o modo senha (ou, para proxies reversos com reconhecimento de identidade fora de loopback, `trusted-proxy`). Se você **realmente** quiser loopback aberto, defina explicitamente `gateway.auth.mode: "none"` na sua configuração. O Doctor pode gerar um token para você a qualquer momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Preciso reiniciar depois de alterar a configuração?">
    O Gateway observa a configuração e oferece suporte a hot-reload:

    - `gateway.reload.mode: "hybrid"` (padrão): aplica em hot-reload alterações seguras, reinicia para alterações críticas
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
    - `default`: usa `All your chats, one OpenClaw.` em todas as vezes.
    - `random`: slogans engraçados/sazonais rotativos (comportamento padrão).
    - Se você não quiser banner nenhum, defina a variável de ambiente `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Como habilito a busca na web (e a busca de páginas)?">
    `web_fetch` funciona sem chave de API. `web_search` depende do
    provedor selecionado:

    - Provedores baseados em API como Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity e Tavily exigem a configuração normal da chave de API.
    - Ollama Web Search não exige chave, mas usa o host Ollama configurado e requer `ollama signin`.
    - DuckDuckGo não exige chave, mas é uma integração não oficial baseada em HTML.
    - SearXNG não exige chave e é self-hosted; configure `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recomendado:** execute `openclaw configure --section web` e escolha um provedor.
    Alternativas por variável de ambiente:

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

    A configuração específica do provedor para busca na web agora fica em `plugins.entries.<plugin>.config.webSearch.*`.
    Os caminhos legados do provedor em `tools.web.search.*` ainda são carregados temporariamente por compatibilidade, mas não devem ser usados em novas configurações.
    A configuração de fallback de busca de páginas do Firecrawl fica em `plugins.entries.firecrawl.config.webFetch.*`.

    Observações:

    - Se você usa allowlists, adicione `web_search`/`web_fetch`/`x_search` ou `group:web`.
    - `web_fetch` está habilitado por padrão (a menos que seja explicitamente desabilitado).
    - Se `tools.web.fetch.provider` for omitido, o OpenClaw detecta automaticamente o primeiro provedor de fallback de busca de páginas pronto com base nas credenciais disponíveis. Hoje o provedor agrupado é o Firecrawl.
    - Daemons leem variáveis de ambiente de `~/.openclaw/.env` (ou do ambiente do serviço).

    Documentação: [Web tools](/pt-BR/tools/web).

  </Accordion>

  <Accordion title="config.apply apagou minha configuração. Como recupero e evito isso?">
    `config.apply` substitui a **configuração inteira**. Se você enviar um objeto parcial, todo o
    restante será removido.

    O OpenClaw atual protege contra muitas sobrescritas acidentais:

    - Gravações de configuração pertencentes ao OpenClaw validam a configuração completa após a alteração antes de gravar.
    - Gravações inválidas ou destrutivas pertencentes ao OpenClaw são rejeitadas e salvas como `openclaw.json.rejected.*`.
    - Se uma edição direta quebrar a inicialização ou o hot reload, o Gateway restaura a última configuração válida conhecida e salva o arquivo rejeitado como `openclaw.json.clobbered.*`.
    - O agente principal recebe um aviso na inicialização após a recuperação para não gravar cegamente a configuração inválida novamente.

    Recuperação:

    - Verifique `openclaw logs --follow` em busca de `Config auto-restored from last-known-good`, `Config write rejected:` ou `config reload restored last-known-good config`.
    - Inspecione o `openclaw.json.clobbered.*` ou `openclaw.json.rejected.*` mais recente ao lado da configuração ativa.
    - Mantenha a configuração restaurada ativa se ela funcionar, depois copie de volta apenas as chaves desejadas com `openclaw config set` ou `config.patch`.
    - Execute `openclaw config validate` e `openclaw doctor`.
    - Se você não tiver uma última configuração válida conhecida nem payload rejeitado, restaure de um backup ou execute `openclaw doctor` novamente e reconfigure canais/modelos.
    - Se isso foi inesperado, abra um bug e inclua sua última configuração conhecida ou qualquer backup.
    - Um agente local de programação muitas vezes consegue reconstruir uma configuração funcional a partir de logs ou histórico.

    Para evitar:

    - Use `openclaw config set` para alterações pequenas.
    - Use `openclaw configure` para edições interativas.
    - Use `config.schema.lookup` primeiro quando não tiver certeza sobre um caminho exato ou o formato de um campo; ele retorna um nó de esquema superficial mais resumos imediatos dos filhos para aprofundamento.
    - Use `config.patch` para edições RPC parciais; mantenha `config.apply` apenas para substituição de configuração completa.
    - Se você estiver usando a ferramenta `gateway`, exclusiva para owner, a partir de uma execução de agente, ela ainda rejeitará gravações em `tools.exec.ask` / `tools.exec.security` (incluindo aliases legados `tools.bash.*` que são normalizados para os mesmos caminhos protegidos de exec).

    Documentação: [Config](/pt-BR/cli/config), [Configure](/pt-BR/cli/configure), [Gateway troubleshooting](/pt-BR/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/pt-BR/gateway/doctor).

  </Accordion>

  <Accordion title="Como executo um Gateway central com workers especializados em vários dispositivos?">
    O padrão comum é **um Gateway** (por exemplo, Raspberry Pi) mais **Nodes** e **agentes**:

    - **Gateway (central):** controla canais (Signal/WhatsApp), roteamento e sessões.
    - **Nodes (dispositivos):** Macs/iOS/Android conectam como periféricos e expõem ferramentas locais (`system.run`, `canvas`, `camera`).
    - **Agentes (workers):** cérebros/workspaces separados para funções específicas (por exemplo, "Hetzner ops", "Dados pessoais").
    - **Subagentes:** geram trabalho em segundo plano a partir de um agente principal quando você quer paralelismo.
    - **TUI:** conecta ao Gateway e alterna entre agentes/sessões.

    Documentação: [Nodes](/pt-BR/nodes), [Remote access](/pt-BR/gateway/remote), [Multi-Agent Routing](/pt-BR/concepts/multi-agent), [Sub-agents](/pt-BR/tools/subagents), [TUI](/pt-BR/web/tui).

  </Accordion>

  <Accordion title="O navegador do OpenClaw pode ser executado em modo headless?">
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

    O modo headless usa o **mesmo mecanismo do Chromium** e funciona para a maioria das automações (formulários, cliques, scraping, logins). As principais diferenças:

    - Não há janela visível do navegador (use screenshots se precisar de elementos visuais).
    - Alguns sites são mais rígidos com automação em modo headless (CAPTCHAs, anti-bot).
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
    As mensagens do Telegram são tratadas pelo **gateway**. O gateway executa o agente e
    só então chama os nodes pelo **WebSocket do Gateway** quando uma ferramenta de node é necessária:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Os nodes não veem o tráfego de entrada do provedor; eles recebem apenas chamadas RPC de node.

  </Accordion>

  <Accordion title="Como meu agente pode acessar meu computador se o Gateway estiver hospedado remotamente?">
    Resposta curta: **emparelhe seu computador como um node**. O Gateway é executado em outro lugar, mas ele pode
    chamar ferramentas `node.*` (tela, câmera, sistema) na sua máquina local pelo WebSocket do Gateway.

    Configuração típica:

    1. Execute o Gateway no host sempre ativo (VPS/servidor doméstico).
    2. Coloque o host do Gateway + seu computador na mesma tailnet.
    3. Garanta que o WS do Gateway esteja acessível (bind de tailnet ou túnel SSH).
    4. Abra o app do macOS localmente e conecte em modo **Remote over SSH** (ou tailnet direta)
       para que ele possa se registrar como um node.
    5. Aprove o node no Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Nenhuma bridge TCP separada é necessária; os nodes se conectam pelo WebSocket do Gateway.

    Lembrete de segurança: emparelhar um node macOS permite `system.run` nessa máquina. Emparelhe
    apenas dispositivos em que você confia e revise [Security](/pt-BR/gateway/security).

    Documentação: [Nodes](/pt-BR/nodes), [Gateway protocol](/pt-BR/gateway/protocol), [macOS remote mode](/pt-BR/platforms/mac/remote), [Security](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="O Tailscale está conectado, mas não recebo respostas. E agora?">
    Verifique o básico:

    - O Gateway está em execução: `openclaw gateway status`
    - Saúde do Gateway: `openclaw status`
    - Saúde do canal: `openclaw channels status`

    Depois verifique autenticação e roteamento:

    - Se você usa Tailscale Serve, garanta que `gateway.auth.allowTailscale` esteja definido corretamente.
    - Se você se conecta por túnel SSH, confirme que o túnel local está ativo e aponta para a porta correta.
    - Confirme que suas allowlists (DM ou grupo) incluem sua conta.

    Documentação: [Tailscale](/pt-BR/gateway/tailscale), [Remote access](/pt-BR/gateway/remote), [Channels](/pt-BR/channels).

  </Accordion>

  <Accordion title="Duas instâncias do OpenClaw podem conversar entre si (local + VPS)?">
    Sim. Não há uma bridge "bot-para-bot" integrada, mas você pode conectá-las de algumas
    maneiras confiáveis:

    **Mais simples:** use um canal de chat normal ao qual ambos os bots possam acessar (Telegram/Slack/WhatsApp).
    Faça o Bot A enviar uma mensagem ao Bot B, depois deixe o Bot B responder normalmente.

    **Bridge por CLI (genérica):** execute um script que chama o outro Gateway com
    `openclaw agent --message ... --deliver`, apontando para um chat onde o outro bot
    escuta. Se um bot estiver em uma VPS remota, aponte sua CLI para esse Gateway remoto
    via SSH/Tailscale (consulte [Remote access](/pt-BR/gateway/remote)).

    Exemplo de padrão (execute em uma máquina que consiga alcançar o Gateway de destino):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Dica: adicione uma proteção para que os dois bots não entrem em loop infinito (responder apenas quando mencionados,
    allowlists de canal ou uma regra "não responder a mensagens de bot").

    Documentação: [Remote access](/pt-BR/gateway/remote), [Agent CLI](/pt-BR/cli/agent), [Agent send](/pt-BR/tools/agent-send).

  </Accordion>

  <Accordion title="Preciso de VPSs separadas para vários agentes?">
    Não. Um Gateway pode hospedar vários agentes, cada um com seu próprio workspace, modelos padrão
    e roteamento. Essa é a configuração normal e é muito mais barata e simples do que executar
    uma VPS por agente.

    Use VPSs separadas apenas quando precisar de isolamento rígido (limites de segurança) ou de configurações muito
    diferentes que você não queira compartilhar. Caso contrário, mantenha um Gateway e
    use vários agentes ou subagentes.

  </Accordion>

  <Accordion title="Há vantagem em usar um node no meu notebook pessoal em vez de SSH a partir de uma VPS?">
    Sim — nodes são a forma de primeira classe de alcançar seu notebook a partir de um Gateway remoto, e
    liberam mais do que acesso shell. O Gateway é executado em macOS/Linux (Windows via WSL2) e é
    leve (uma VPS pequena ou uma máquina da classe Raspberry Pi funciona bem; 4 GB de RAM são suficientes), então uma configuração
    comum é um host sempre ativo mais seu notebook como um node.

    - **Sem necessidade de SSH de entrada.** Nodes se conectam para fora ao WebSocket do Gateway e usam emparelhamento de dispositivo.
    - **Controles de execução mais seguros.** `system.run` é controlado por allowlists/aprovações de node nesse notebook.
    - **Mais ferramentas de dispositivo.** Nodes expõem `canvas`, `camera` e `screen`, além de `system.run`.
    - **Automação de navegador local.** Mantenha o Gateway em uma VPS, mas execute o Chrome localmente por um host de node no notebook ou conecte-se ao Chrome local no host via Chrome MCP.

    SSH é adequado para acesso shell ad hoc, mas nodes são mais simples para fluxos de trabalho contínuos de agentes e
    automação de dispositivos.

    Documentação: [Nodes](/pt-BR/nodes), [Nodes CLI](/pt-BR/cli/nodes), [Browser](/pt-BR/tools/browser).

  </Accordion>

  <Accordion title="Os nodes executam um serviço de gateway?">
    Não. Apenas **um gateway** deve ser executado por host, a menos que você execute intencionalmente perfis isolados (consulte [Multiple gateways](/pt-BR/gateway/multiple-gateways)). Nodes são periféricos que se conectam
    ao gateway (nodes de iOS/Android ou "modo node" do macOS no app da barra de menu). Para hosts de node sem interface
    e controle por CLI, consulte [Node host CLI](/pt-BR/cli/node).

    É necessário um reinício completo para alterações em `gateway`, `discovery` e `canvasHost`.

  </Accordion>

  <Accordion title="Existe uma forma de API / RPC para aplicar configuração?">
    Sim.

    - `config.schema.lookup`: inspeciona uma subárvore de configuração com seu nó de esquema superficial, dica de UI correspondente e resumos imediatos dos filhos antes de gravar
    - `config.get`: busca o snapshot atual + hash
    - `config.patch`: atualização parcial segura (preferida para a maioria das edições RPC); faz hot-reload quando possível e reinicia quando necessário
    - `config.apply`: valida + substitui a configuração completa; faz hot-reload quando possível e reinicia quando necessário
    - A ferramenta de tempo de execução `gateway`, exclusiva para owner, ainda se recusa a regravar `tools.exec.ask` / `tools.exec.security`; aliases legados `tools.bash.*` são normalizados para os mesmos caminhos protegidos de exec

  </Accordion>

  <Accordion title="Configuração mínima razoável para uma primeira instalação">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Isso define seu workspace e restringe quem pode acionar o bot.

  </Accordion>

  <Accordion title="Como configuro o Tailscale em uma VPS e conecto a partir do meu Mac?">
    Etapas mínimas:

    1. **Instale + faça login na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Instale + faça login no seu Mac**
       - Use o app do Tailscale e entre na mesma tailnet.
    3. **Habilite o MagicDNS (recomendado)**
       - No console de administração do Tailscale, habilite o MagicDNS para que a VPS tenha um nome estável.
    4. **Use o hostname da tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Se você quiser a Control UI sem SSH, use Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Isso mantém o gateway vinculado ao loopback e expõe HTTPS via Tailscale. Consulte [Tailscale](/pt-BR/gateway/tailscale).

  </Accordion>

  <Accordion title="Como conecto um Node Mac a um Gateway remoto (Tailscale Serve)?">
    O Serve expõe a **Control UI + WS do Gateway**. Nodes se conectam pelo mesmo endpoint WS do Gateway.

    Configuração recomendada:

    1. **Garanta que a VPS + o Mac estejam na mesma tailnet**.
    2. **Use o app do macOS em modo Remote** (o alvo SSH pode ser o hostname da tailnet).
       O app fará túnel da porta do Gateway e se conectará como um node.
    3. **Aprove o node** no gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentação: [Gateway protocol](/pt-BR/gateway/protocol), [Discovery](/pt-BR/gateway/discovery), [macOS remote mode](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Devo instalar em um segundo notebook ou apenas adicionar um node?">
    Se você precisa apenas de **ferramentas locais** (tela/câmera/execução) no segundo notebook, adicione-o como um
    **node**. Isso mantém um único Gateway e evita configuração duplicada. As ferramentas locais de node
    atualmente são exclusivas do macOS, mas planejamos estendê-las para outros sistemas operacionais.

    Instale um segundo Gateway apenas quando precisar de **isolamento rígido** ou de dois bots totalmente separados.

    Documentação: [Nodes](/pt-BR/nodes), [Nodes CLI](/pt-BR/cli/nodes), [Multiple gateways](/pt-BR/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente e carregamento de `.env`

<AccordionGroup>
  <Accordion title="Como o OpenClaw carrega variáveis de ambiente?">
    O OpenClaw lê variáveis de ambiente do processo pai (shell, launchd/systemd, CI etc.) e também carrega:

    - `.env` do diretório de trabalho atual
    - um `.env` global de fallback de `~/.openclaw/.env` (também conhecido como `$OPENCLAW_STATE_DIR/.env`)

    Nenhum dos arquivos `.env` substitui variáveis de ambiente já existentes.

    Você também pode definir variáveis de ambiente inline na configuração (aplicadas apenas se estiverem ausentes no env do processo):

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

  <Accordion title="Iniciei o Gateway pelo serviço e minhas variáveis de ambiente sumiram. E agora?">
    Duas correções comuns:

    1. Coloque as chaves ausentes em `~/.openclaw/.env` para que sejam carregadas mesmo quando o serviço não herda o env do seu shell.
    2. Habilite a importação do shell (conveniência opt-in):

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

    Isso executa seu shell de login e importa apenas as chaves esperadas ausentes (nunca substitui). Equivalentes por variável de ambiente:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Defini `COPILOT_GITHUB_TOKEN`, mas o status dos modelos mostra "Shell env: off." Por quê?'>
    `openclaw models status` informa se a **importação do env do shell** está habilitada. "Shell env: off"
    **não** significa que suas variáveis de ambiente estão ausentes — apenas significa que o OpenClaw não carregará
    automaticamente seu shell de login.

    Se o Gateway estiver sendo executado como serviço (launchd/systemd), ele não herdará o
    ambiente do seu shell. Corrija de uma destas formas:

    1. Coloque o token em `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Ou habilite a importação do shell (`env.shellEnv.enabled: true`).
    3. Ou adicione-o ao bloco `env` da sua configuração (aplica apenas se estiver ausente).

    Depois reinicie o gateway e verifique novamente:

    ```bash
    openclaw models status
    ```

    Tokens do Copilot são lidos de `COPILOT_GITHUB_TOKEN` (também `GH_TOKEN` / `GITHUB_TOKEN`).
    Consulte [/concepts/model-providers](/pt-BR/concepts/model-providers) e [/environment](/pt-BR/help/environment).

  </Accordion>
</AccordionGroup>

## Sessões e vários chats

<AccordionGroup>
  <Accordion title="Como inicio uma conversa nova?">
    Envie `/new` ou `/reset` como uma mensagem independente. Consulte [Session management](/pt-BR/concepts/session).
  </Accordion>

  <Accordion title="As sessões são redefinidas automaticamente se eu nunca enviar /new?">
    As sessões podem expirar após `session.idleMinutes`, mas isso fica **desabilitado por padrão** (padrão **0**).
    Defina um valor positivo para habilitar a expiração por inatividade. Quando habilitado, a **próxima**
    mensagem após o período de inatividade inicia um novo ID de sessão para essa chave de chat.
    Isso não exclui transcrições — apenas inicia uma nova sessão.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Existe uma maneira de criar uma equipe de instâncias do OpenClaw (um CEO e muitos agentes)?">
    Sim, por meio de **roteamento multi-agent** e **subagentes**. Você pode criar um agente
    coordenador e vários agentes workers com seus próprios workspaces e modelos.

    Dito isso, isso é melhor visto como um **experimento divertido**. Consome muitos tokens e muitas vezes
    é menos eficiente do que usar um único bot com sessões separadas. O modelo típico que
    imaginamos é um bot com o qual você conversa, com sessões diferentes para trabalho paralelo. Esse
    bot também pode gerar subagentes quando necessário.

    Documentação: [Multi-agent routing](/pt-BR/concepts/multi-agent), [Sub-agents](/pt-BR/tools/subagents), [Agents CLI](/pt-BR/cli/agents).

  </Accordion>

  <Accordion title="Por que o contexto foi truncado no meio da tarefa? Como evito isso?">
    O contexto da sessão é limitado pela janela do modelo. Chats longos, saídas grandes de ferramenta ou muitos
    arquivos podem acionar Compaction ou truncamento.

    O que ajuda:

    - Peça ao bot para resumir o estado atual e gravá-lo em um arquivo.
    - Use `/compact` antes de tarefas longas e `/new` ao mudar de assunto.
    - Mantenha contexto importante no workspace e peça ao bot para lê-lo de volta.
    - Use subagentes para trabalho longo ou paralelo, para que o chat principal permaneça menor.
    - Escolha um modelo com uma janela de contexto maior se isso acontecer com frequência.

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

    Depois execute novamente a configuração:

    ```bash
    openclaw onboard --install-daemon
    ```

    Observações:

    - O onboarding também oferece **Reset** se detectar uma configuração existente. Consulte [Onboarding (CLI)](/pt-BR/start/wizard).
    - Se você usou perfis (`--profile` / `OPENCLAW_PROFILE`), redefina cada diretório de estado (os padrões são `~/.openclaw-<profile>`).
    - Redefinição de desenvolvimento: `openclaw gateway --dev --reset` (somente dev; apaga configuração de dev + credenciais + sessões + workspace).

  </Accordion>

  <Accordion title='Estou recebendo erros de "context too large" — como redefino ou compacto?'>
    Use uma destas opções:

    - **Compactar** (mantém a conversa, mas resume turnos mais antigos):

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

    - Habilite ou ajuste o **session pruning** (`agents.defaults.contextPruning`) para aparar saídas antigas de ferramenta.
    - Use um modelo com uma janela de contexto maior.

    Documentação: [Compaction](/pt-BR/concepts/compaction), [Session pruning](/pt-BR/concepts/session-pruning), [Session management](/pt-BR/concepts/session).

  </Accordion>

  <Accordion title='Por que estou vendo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Este é um erro de validação do provedor: o modelo emitiu um bloco `tool_use` sem o
    `input` obrigatório. Isso geralmente significa que o histórico da sessão está obsoleto ou corrompido (muitas vezes após threads longas
    ou uma mudança em ferramenta/esquema).

    Correção: inicie uma sessão nova com `/new` (mensagem independente).

  </Accordion>

  <Accordion title="Por que estou recebendo mensagens de Heartbeat a cada 30 minutos?">
    Os Heartbeats são executados a cada **30 min** por padrão (**1 h** ao usar autenticação OAuth). Ajuste ou desabilite:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // ou "0m" para desabilitar
          },
        },
      },
    }
    ```

    Se `HEARTBEAT.md` existir, mas estiver efetivamente vazio (apenas linhas em branco e
    cabeçalhos Markdown como `# Heading`), o OpenClaw ignora a execução do Heartbeat para economizar chamadas de API.
    Se o arquivo estiver ausente, o Heartbeat ainda será executado e o modelo decidirá o que fazer.

    Substituições por agente usam `agents.list[].heartbeat`. Documentação: [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>

  <Accordion title='Preciso adicionar uma "conta de bot" a um grupo do WhatsApp?'>
    Não. O OpenClaw é executado na **sua própria conta**, então se você estiver no grupo, o OpenClaw poderá vê-lo.
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

    Procure `chatId` (ou `from`) terminando em `@g.us`, por exemplo:
    `1234567890-1234567890@g.us`.

    Opção 2 (se já estiver configurado/na allowlist): liste grupos da configuração:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentação: [WhatsApp](/pt-BR/channels/whatsapp), [Directory](/pt-BR/cli/directory), [Logs](/pt-BR/cli/logs).

  </Accordion>

  <Accordion title="Por que o OpenClaw não responde em um grupo?">
    Duas causas comuns:

    - O bloqueio por menção está ativado (padrão). Você precisa @mencionar o bot (ou corresponder a `mentionPatterns`).
    - Você configurou `channels.whatsapp.groups` sem `"*"` e o grupo não está na allowlist.

    Consulte [Groups](/pt-BR/channels/groups) e [Group messages](/pt-BR/channels/group-messages).

  </Accordion>

  <Accordion title="Grupos/threads compartilham contexto com DMs?">
    Chats diretos são recolhidos para a sessão principal por padrão. Grupos/canais têm suas próprias chaves de sessão, e tópicos do Telegram / threads do Discord são sessões separadas. Consulte [Groups](/pt-BR/channels/groups) e [Group messages](/pt-BR/channels/group-messages).
  </Accordion>

  <Accordion title="Quantos workspaces e agentes posso criar?">
    Não há limites rígidos. Dezenas (até centenas) funcionam bem, mas observe:

    - **Crescimento em disco:** sessões + transcrições ficam em `~/.openclaw/agents/<agentId>/sessions/`.
    - **Custo de tokens:** mais agentes significam mais uso simultâneo de modelo.
    - **Sobrecarga operacional:** perfis de autenticação por agente, workspaces e roteamento de canal.

    Dicas:

    - Mantenha um workspace **ativo** por agente (`agents.defaults.workspace`).
    - Pode sessões antigas (exclua entradas JSONL ou do armazenamento) se o disco crescer.
    - Use `openclaw doctor` para detectar workspaces soltos e incompatibilidades de perfil.

  </Accordion>

  <Accordion title="Posso executar vários bots ou chats ao mesmo tempo (Slack), e como devo configurar isso?">
    Sim. Use **Multi-Agent Routing** para executar vários agentes isolados e rotear mensagens de entrada por
    canal/conta/par. O Slack é compatível como canal e pode ser vinculado a agentes específicos.

    O acesso ao navegador é poderoso, mas não significa "fazer qualquer coisa que um humano pode" — mecanismos anti-bot, CAPTCHAs e MFA ainda podem
    bloquear a automação. Para o controle de navegador mais confiável, use Chrome MCP local no host,
    ou use CDP na máquina que realmente executa o navegador.

    Configuração de boas práticas:

    - Host do Gateway sempre ativo (VPS/Mac mini).
    - Um agente por função (bindings).
    - Canal(is) do Slack vinculados a esses agentes.
    - Navegador local via Chrome MCP ou um node quando necessário.

    Documentação: [Multi-Agent Routing](/pt-BR/concepts/multi-agent), [Slack](/pt-BR/channels/slack),
    [Browser](/pt-BR/tools/browser), [Nodes](/pt-BR/nodes).

  </Accordion>
</AccordionGroup>

## Modelos, failover e perfis de autenticação

Perguntas e respostas sobre modelos — padrões, seleção, aliases, troca, failover, perfis de autenticação —
estão em [Models FAQ](/pt-BR/help/faq-models).

## Gateway: portas, "already running" e modo remoto

<AccordionGroup>
  <Accordion title="Qual porta o Gateway usa?">
    `gateway.port` controla a única porta multiplexada para WebSocket + HTTP (Control UI, hooks etc.).

    Precedência:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > padrão 18789
    ```

  </Accordion>

  <Accordion title='Por que `openclaw gateway status` mostra "Runtime: running", mas "Connectivity probe: failed"?'>
    Porque "running" é a visão do **supervisor** (launchd/systemd/schtasks). A sonda de conectividade é a CLI realmente se conectando ao WebSocket do gateway.

    Use `openclaw gateway status` e confie nestas linhas:

    - `Probe target:` (a URL que a sonda realmente usou)
    - `Listening:` (o que realmente está vinculado à porta)
    - `Last gateway error:` (causa raiz comum quando o processo está ativo, mas a porta não está escutando)

  </Accordion>

  <Accordion title='Por que `openclaw gateway status` mostra "Config (cli)" e "Config (service)" diferentes?'>
    Você está editando um arquivo de configuração enquanto o serviço está executando outro (muitas vezes uma incompatibilidade de `--profile` / `OPENCLAW_STATE_DIR`).

    Correção:

    ```bash
    openclaw gateway install --force
    ```

    Execute isso a partir do mesmo `--profile` / ambiente que você quer que o serviço use.

  </Accordion>

  <Accordion title='O que significa "another gateway instance is already listening"?'>
    O OpenClaw aplica um bloqueio de tempo de execução vinculando imediatamente o listener WebSocket na inicialização (padrão `ws://127.0.0.1:18789`). Se o bind falhar com `EADDRINUSE`, ele gera `GatewayLockError`, indicando que outra instância já está escutando.

    Correção: pare a outra instância, libere a porta ou execute com `openclaw gateway --port <port>`.

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
    - O app do macOS observa o arquivo de configuração e alterna os modos dinamicamente quando esses valores mudam.
    - `gateway.remote.token` / `.password` são apenas credenciais remotas do lado do cliente; eles não habilitam autenticação do gateway local por si só.

  </Accordion>

  <Accordion title='A Control UI mostra "unauthorized" (ou continua reconectando). E agora?'>
    O caminho de autenticação do seu gateway e o método de autenticação da UI não correspondem.

    Fatos (do código):

    - A Control UI mantém o token em `sessionStorage` para a sessão atual da aba do navegador e a URL do gateway selecionada, então atualizações na mesma aba continuam funcionando sem restaurar a persistência de token de longo prazo em `localStorage`.
    - Em `AUTH_TOKEN_MISMATCH`, clientes confiáveis podem tentar uma nova tentativa limitada com um token de dispositivo em cache quando o gateway retorna dicas de nova tentativa (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Essa nova tentativa com token em cache agora reutiliza os escopos aprovados em cache armazenados com o token do dispositivo. Chamadores com `deviceToken` explícito / `scopes` explícitos ainda mantêm o conjunto de escopos solicitado em vez de herdar escopos em cache.
    - Fora desse caminho de nova tentativa, a precedência de autenticação da conexão é: token/senha compartilhados explícitos primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado, depois token de bootstrap.
    - As verificações de escopo do token de bootstrap usam prefixo de função. A allowlist integrada de operador de bootstrap satisfaz apenas solicitações de operador; node ou outras funções que não sejam de operador ainda precisam de escopos sob o próprio prefixo de função.

    Correção:

    - Mais rápido: `openclaw dashboard` (imprime + copia a URL do dashboard, tenta abrir; mostra dica de SSH se estiver sem interface).
    - Se você ainda não tiver um token: `openclaw doctor --generate-gateway-token`.
    - Se for remoto, crie o túnel primeiro: `ssh -N -L 18789:127.0.0.1:18789 user@host` e depois abra `http://127.0.0.1:18789/`.
    - Modo de segredo compartilhado: defina `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, depois cole o segredo correspondente nas configurações da Control UI.
    - Modo Tailscale Serve: garanta que `gateway.auth.allowTailscale` esteja habilitado e que você esteja abrindo a URL do Serve, não uma URL raw de loopback/tailnet que ignore os cabeçalhos de identidade do Tailscale.
    - Modo trusted-proxy: garanta que você esteja vindo pelo proxy com reconhecimento de identidade configurado e fora de loopback, não por um proxy loopback no mesmo host nem por uma URL raw do gateway.
    - Se a incompatibilidade persistir após a única nova tentativa, gire/reaprove novamente o token de dispositivo emparelhado:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Se essa chamada de rotação disser que foi negada, verifique duas coisas:
      - sessões de dispositivo emparelhado só podem girar o **próprio** dispositivo, a menos que também tenham `operator.admin`
      - valores explícitos de `--scope` não podem exceder os escopos atuais de operador do chamador
    - Ainda travado? Execute `openclaw status --all` e siga [Troubleshooting](/pt-BR/gateway/troubleshooting). Consulte [Dashboard](/pt-BR/web/dashboard) para detalhes de autenticação.

  </Accordion>

  <Accordion title="Defini `gateway.bind tailnet`, mas ele não consegue fazer bind e nada escuta">
    O bind `tailnet` escolhe um IP do Tailscale nas interfaces de rede (100.64.0.0/10). Se a máquina não estiver no Tailscale (ou a interface estiver inativa), não há nada para vincular.

    Correção:

    - Inicie o Tailscale nesse host (para que ele tenha um endereço 100.x), ou
    - Troque para `gateway.bind: "loopback"` / `"lan"`.

    Observação: `tailnet` é explícito. `auto` prefere loopback; use `gateway.bind: "tailnet"` quando quiser um bind apenas para tailnet.

  </Accordion>

  <Accordion title="Posso executar vários Gateways no mesmo host?">
    Geralmente não — um Gateway pode executar vários canais de mensagem e agentes. Use vários Gateways apenas quando precisar de redundância (ex.: bot de resgate) ou isolamento rígido.

    Sim, mas você precisa isolar:

    - `OPENCLAW_CONFIG_PATH` (configuração por instância)
    - `OPENCLAW_STATE_DIR` (estado por instância)
    - `agents.defaults.workspace` (isolamento do workspace)
    - `gateway.port` (portas exclusivas)

    Configuração rápida (recomendada):

    - Use `openclaw --profile <name> ...` por instância (cria automaticamente `~/.openclaw-<name>`).
    - Defina um `gateway.port` exclusivo em cada configuração de perfil (ou passe `--port` para execuções manuais).
    - Instale um serviço por perfil: `openclaw --profile <name> gateway install`.

    Perfis também acrescentam sufixo aos nomes de serviço (`ai.openclaw.<profile>`; legado `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guia completo: [Multiple gateways](/pt-BR/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='O que significa "invalid handshake" / código 1008?'>
    O Gateway é um **servidor WebSocket** e espera que a primeira mensagem seja
    um frame `connect`. Se ele receber qualquer outra coisa, fecha a conexão
    com **código 1008** (violação de política).

    Causas comuns:

    - Você abriu a URL **HTTP** em um navegador (`http://...`) em vez de um cliente WS.
    - Você usou a porta ou caminho errados.
    - Um proxy ou túnel removeu cabeçalhos de autenticação ou enviou uma requisição que não era do Gateway.

    Correções rápidas:

    1. Use a URL WS: `ws://<host>:18789` (ou `wss://...` se houver HTTPS).
    2. Não abra a porta WS em uma aba normal do navegador.
    3. Se a autenticação estiver ativada, inclua o token/senha no frame `connect`.

    Se você estiver usando a CLI ou TUI, a URL deve se parecer com:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Detalhes do protocolo: [Gateway protocol](/pt-BR/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logs e depuração

<AccordionGroup>
  <Accordion title="Onde ficam os logs?">
    Logs em arquivo (estruturados):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Você pode definir um caminho estável com `logging.file`. O nível de log em arquivo é controlado por `logging.level`. A verbosidade do console é controlada por `--verbose` e `logging.consoleLevel`.

    Tail de log mais rápido:

    ```bash
    openclaw logs --follow
    ```

    Logs do serviço/supervisor (quando o gateway é executado por launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` e `gateway.err.log` (padrão: `~/.openclaw/logs/...`; perfis usam `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Consulte [Troubleshooting](/pt-BR/gateway/troubleshooting) para mais informações.

  </Accordion>

  <Accordion title="Como inicio/parar/reinicio o serviço do Gateway?">
    Use os helpers do gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Se você executar o gateway manualmente, `openclaw gateway --force` pode retomar a porta. Consulte [Gateway](/pt-BR/gateway).

  </Accordion>

  <Accordion title="Fechei meu terminal no Windows — como reinicio o OpenClaw?">
    Há **dois modos de instalação no Windows**:

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

    Se você o executa manualmente (sem serviço), use:

    ```powershell
    openclaw gateway run
    ```

    Documentação: [Windows (WSL2)](/pt-BR/platforms/windows), [Gateway service runbook](/pt-BR/gateway).

  </Accordion>

  <Accordion title="O Gateway está ativo, mas as respostas nunca chegam. O que devo verificar?">
    Comece com uma verificação rápida de saúde:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causas comuns:

    - Autenticação do modelo não carregada no **host do gateway** (verifique `models status`).
    - Emparelhamento/allowlist do canal bloqueando respostas (verifique configuração do canal + logs).
    - WebChat/Dashboard aberto sem o token correto.

    Se você estiver remoto, confirme que a conexão por túnel/Tailscale está ativa e que o
    WebSocket do Gateway está acessível.

    Documentação: [Channels](/pt-BR/channels), [Troubleshooting](/pt-BR/gateway/troubleshooting), [Remote access](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — e agora?'>
    Isso geralmente significa que a UI perdeu a conexão WebSocket. Verifique:

    1. O Gateway está em execução? `openclaw gateway status`
    2. O Gateway está saudável? `openclaw status`
    3. A UI tem o token correto? `openclaw dashboard`
    4. Se for remoto, o túnel/vínculo do Tailscale está ativo?

    Depois acompanhe os logs:

    ```bash
    openclaw logs --follow
    ```

    Documentação: [Dashboard](/pt-BR/web/dashboard), [Remote access](/pt-BR/gateway/remote), [Troubleshooting](/pt-BR/gateway/troubleshooting).

  </Accordion>

  <Accordion title="`setMyCommands` do Telegram falha. O que devo verificar?">
    Comece pelos logs e pelo status do canal:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Depois corresponda ao erro:

    - `BOT_COMMANDS_TOO_MUCH`: o menu do Telegram tem entradas demais. O OpenClaw já reduz até o limite do Telegram e tenta novamente com menos comandos, mas algumas entradas do menu ainda precisam ser removidas. Reduza comandos de plugin/Skill/personalizados ou desabilite `channels.telegram.commands.native` se você não precisar do menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` ou erros de rede semelhantes: se você estiver em uma VPS ou atrás de um proxy, confirme que HTTPS de saída está permitido e que o DNS funciona para `api.telegram.org`.

    Se o Gateway for remoto, certifique-se de estar olhando os logs no host do Gateway.

    Documentação: [Telegram](/pt-BR/channels/telegram), [Channel troubleshooting](/pt-BR/channels/troubleshooting).

  </Accordion>

  <Accordion title="A TUI não mostra saída. O que devo verificar?">
    Primeiro confirme que o Gateway está acessível e que o agente consegue ser executado:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Na TUI, use `/status` para ver o estado atual. Se você espera respostas em um canal de chat,
    certifique-se de que a entrega esteja habilitada (`/deliver on`).

    Documentação: [TUI](/pt-BR/web/tui), [Slash commands](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Como paro completamente e depois inicio o Gateway?">
    Se você instalou o serviço:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Isso para/inicia o **serviço supervisionado** (launchd no macOS, systemd no Linux).
    Use isso quando o Gateway for executado em segundo plano como daemon.

    Se você estiver executando em primeiro plano, pare com Ctrl-C e depois:

    ```bash
    openclaw gateway run
    ```

    Documentação: [Gateway service runbook](/pt-BR/gateway).

  </Accordion>

  <Accordion title="Explicando de forma simples: `openclaw gateway restart` vs `openclaw gateway`">
    - `openclaw gateway restart`: reinicia o **serviço em segundo plano** (launchd/systemd).
    - `openclaw gateway`: executa o gateway **em primeiro plano** para esta sessão de terminal.

    Se você instalou o serviço, use os comandos do gateway. Use `openclaw gateway` quando
    quiser uma execução única, em primeiro plano.

  </Accordion>

  <Accordion title="Forma mais rápida de obter mais detalhes quando algo falha">
    Inicie o Gateway com `--verbose` para obter mais detalhes no console. Depois inspecione o arquivo de log em busca de autenticação de canal, roteamento de modelo e erros de RPC.
  </Accordion>
</AccordionGroup>

## Mídia e anexos

<AccordionGroup>
  <Accordion title="Minha Skill gerou uma imagem/PDF, mas nada foi enviado">
    Anexos de saída do agente devem incluir uma linha `MEDIA:<path-or-url>` (em sua própria linha). Consulte [OpenClaw assistant setup](/pt-BR/start/openclaw) e [Agent send](/pt-BR/tools/agent-send).

    Envio pela CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Verifique também:

    - O canal de destino oferece suporte a mídia de saída e não está bloqueado por allowlists.
    - O arquivo está dentro dos limites de tamanho do provedor (imagens são redimensionadas para no máximo 2048px).
    - `tools.fs.workspaceOnly=true` mantém envios de caminho local limitados ao workspace, temp/media-store e arquivos validados pela sandbox.
    - `tools.fs.workspaceOnly=false` permite que `MEDIA:` envie arquivos locais do host que o agente já consegue ler, mas apenas para mídia mais tipos seguros de documento (imagens, áudio, vídeo, PDF e documentos do Office). Texto simples e arquivos com aparência de segredo ainda são bloqueados.

    Consulte [Images](/pt-BR/nodes/images).

  </Accordion>
</AccordionGroup>

## Segurança e controle de acesso

<AccordionGroup>
  <Accordion title="É seguro expor o OpenClaw a DMs de entrada?">
    Trate DMs de entrada como entrada não confiável. Os padrões foram projetados para reduzir o risco:

    - O comportamento padrão em canais compatíveis com DM é **pairing**:
      - Remetentes desconhecidos recebem um código de emparelhamento; o bot não processa a mensagem deles.
      - Aprove com: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Solicitações pendentes são limitadas a **3 por canal**; verifique `openclaw pairing list --channel <channel> [--account <id>]` se um código não chegou.
    - Abrir DMs publicamente exige opt-in explícito (`dmPolicy: "open"` e allowlist `"*"`).

    Execute `openclaw doctor` para identificar políticas de DM arriscadas.

  </Accordion>

  <Accordion title="Prompt injection é uma preocupação apenas para bots públicos?">
    Não. Prompt injection diz respeito a **conteúdo não confiável**, não apenas a quem pode mandar DM para o bot.
    Se o seu assistente lê conteúdo externo (busca/busca de páginas na web, páginas do navegador, emails,
    documentos, anexos, logs colados), esse conteúdo pode incluir instruções que tentam
    sequestrar o modelo. Isso pode acontecer mesmo que **você seja o único remetente**.

    O maior risco surge quando ferramentas estão habilitadas: o modelo pode ser induzido a
    exfiltrar contexto ou chamar ferramentas em seu nome. Reduza o raio de impacto ao:

    - usar um agente "leitor", somente leitura ou sem ferramentas, para resumir conteúdo não confiável
    - manter `web_search` / `web_fetch` / `browser` desativados para agentes com ferramentas habilitadas
    - tratar texto decodificado de arquivos/documentos também como não confiável: OpenResponses
      `input_file` e extração de anexos de mídia envolvem o texto extraído em
      marcadores explícitos de limite de conteúdo externo em vez de passar texto bruto do arquivo
    - usar sandboxing e allowlists rígidas de ferramentas

    Detalhes: [Security](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Meu bot deve ter o próprio email, conta GitHub ou número de telefone?">
    Sim, para a maioria das configurações. Isolar o bot com contas e números de telefone separados
    reduz o raio de impacto se algo der errado. Isso também facilita girar
    credenciais ou revogar acesso sem afetar suas contas pessoais.

    Comece pequeno. Dê acesso apenas às ferramentas e contas de que você realmente precisa e expanda
    depois, se necessário.

    Documentação: [Security](/pt-BR/gateway/security), [Pairing](/pt-BR/channels/pairing).

  </Accordion>

  <Accordion title="Posso dar autonomia sobre minhas mensagens de texto e isso é seguro?">
    Nós **não** recomendamos autonomia total sobre suas mensagens pessoais. O padrão mais seguro é:

    - Manter DMs em **modo pairing** ou em uma allowlist rígida.
    - Usar um **número ou conta separados** se você quiser que ele envie mensagens em seu nome.
    - Deixar ele redigir e depois **aprovar antes de enviar**.

    Se quiser experimentar, faça isso em uma conta dedicada e mantenha-a isolada. Consulte
    [Security](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Posso usar modelos mais baratos para tarefas de assistente pessoal?">
    Sim, **se** o agente for apenas de chat e a entrada for confiável. Camadas menores são
    mais suscetíveis a sequestro de instruções, então evite-as para agentes com ferramentas habilitadas
    ou ao ler conteúdo não confiável. Se você precisar usar um modelo menor, restrinja
    as ferramentas e execute dentro de uma sandbox. Consulte [Security](/pt-BR/gateway/security).
  </Accordion>

  <Accordion title="Executei /start no Telegram, mas não recebi um código de pairing">
    Códigos de pairing são enviados **somente** quando um remetente desconhecido envia mensagem ao bot e
    `dmPolicy: "pairing"` está habilitado. `/start` por si só não gera um código.

    Verifique solicitações pendentes:

    ```bash
    openclaw pairing list telegram
    ```

    Se quiser acesso imediato, coloque seu sender id na allowlist ou defina `dmPolicy: "open"`
    para essa conta.

  </Accordion>

  <Accordion title="WhatsApp: ele enviará mensagens para meus contatos? Como o pairing funciona?">
    Não. A política padrão de DM no WhatsApp é **pairing**. Remetentes desconhecidos recebem apenas um código de pairing e sua mensagem **não é processada**. O OpenClaw só responde a chats que recebe ou a envios explícitos que você aciona.

    Aprove o pairing com:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Liste solicitações pendentes:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt de número de telefone do assistente: ele é usado para definir sua **allowlist/owner** para que suas próprias DMs sejam permitidas. Ele não é usado para envio automático. Se você estiver executando no seu número pessoal do WhatsApp, use esse número e habilite `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandos de chat, interrupção de tarefas e "não para"

<AccordionGroup>
  <Accordion title="Como faço para mensagens internas do sistema pararem de aparecer no chat?">
    A maioria das mensagens internas ou de ferramentas aparece apenas quando **verbose**, **trace** ou **reasoning** está habilitado
    para essa sessão.

    Corrija no chat onde você vê isso:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Se ainda estiver barulhento, verifique as configurações da sessão na Control UI e defina verbose
    como **inherit**. Confirme também que você não está usando um perfil de bot com `verboseDefault` definido
    como `on` na configuração.

    Documentação: [Thinking and verbose](/pt-BR/tools/thinking), [Security](/pt-BR/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Como paro/cancelo uma tarefa em execução?">
    Envie qualquer um destes **como uma mensagem independente** (sem barra):

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

    Estes são gatilhos de aborto (não comandos com barra).

    Para processos em segundo plano (da ferramenta exec), você pode pedir ao agente para executar:

    ```
    process action:kill sessionId:XXX
    ```

    Visão geral de comandos com barra: consulte [Slash commands](/pt-BR/tools/slash-commands).

    A maioria dos comandos precisa ser enviada como uma mensagem **independente** que começa com `/`, mas alguns atalhos (como `/status`) também funcionam inline para remetentes na allowlist.

  </Accordion>

  <Accordion title='Como envio uma mensagem do Discord a partir do Telegram? ("Cross-context messaging denied")'>
    O OpenClaw bloqueia mensagens **entre provedores** por padrão. Se uma chamada de ferramenta estiver vinculada
    ao Telegram, ela não enviará ao Discord a menos que você permita explicitamente.

    Habilite mensagens entre provedores para o agente:

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

  <Accordion title='Por que parece que o bot "ignora" mensagens em sequência rápida?'>
    O modo de fila controla como novas mensagens interagem com uma execução em andamento. Use `/queue` para mudar os modos:

    - `steer` — novas mensagens redirecionam a tarefa atual
    - `followup` — executa mensagens uma de cada vez
    - `collect` — agrupa mensagens e responde uma vez (padrão)
    - `steer-backlog` — redireciona agora e depois processa o backlog
    - `interrupt` — aborta a execução atual e começa do zero

    Você pode adicionar opções como `debounce:2s cap:25 drop:summarize` para modos followup.

  </Accordion>
</AccordionGroup>

## Diversos

<AccordionGroup>
  <Accordion title='Qual é o modelo padrão do Anthropic com uma chave de API?'>
    No OpenClaw, credenciais e seleção de modelo são separadas. Definir `ANTHROPIC_API_KEY` (ou armazenar uma chave de API da Anthropic em perfis de autenticação) habilita a autenticação, mas o modelo padrão real é aquele que você configurar em `agents.defaults.model.primary` (por exemplo, `anthropic/claude-sonnet-4-6` ou `anthropic/claude-opus-4-6`). Se você vir `No credentials found for profile "anthropic:default"`, isso significa que o Gateway não conseguiu encontrar credenciais da Anthropic no `auth-profiles.json` esperado para o agente em execução.
  </Accordion>
</AccordionGroup>

---

Ainda travado? Pergunte no [Discord](https://discord.com/invite/clawd) ou abra uma [discussão no GitHub](https://github.com/openclaw/openclaw/discussions).

## Relacionado

- [First-run FAQ](/pt-BR/help/faq-first-run) — instalação, onboarding, autenticação, assinaturas, falhas iniciais
- [Models FAQ](/pt-BR/help/faq-models) — seleção de modelo, failover, perfis de autenticação
- [Troubleshooting](/pt-BR/help/troubleshooting) — triagem orientada por sintomas
