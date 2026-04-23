---
description: Real-world OpenClaw projects from the community
read_when:
    - Procurando exemplos reais de uso do OpenClaw
    - Atualizando destaques de projetos da comunidade
summary: Projetos e integrações criados pela comunidade com tecnologia OpenClaw
title: Vitrine
x-i18n:
    generated_at: "2026-04-15T05:34:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 797d0b85c9eca920240c79d870eb9636216714f3eba871c5ebd0f7f40cf7bbf1
    source_path: start/showcase.md
    workflow: 15
---

{/* markdownlint-disable MD033 */}

# Vitrine

<div className="showcase-hero">
  <p className="showcase-kicker">Criado em chats, terminais, navegadores e salas de estar</p>
  <p className="showcase-lead">
    Os projetos OpenClaw não são demos de brinquedo. As pessoas estão colocando em produção ciclos de revisão de PR, aplicativos móveis, automação residencial,
    sistemas de voz, ferramentas de desenvolvimento e fluxos de trabalho intensivos em memória a partir dos canais que já usam.
  </p>
  <div className="showcase-actions">
    <a href="#videos">Assistir demos</a>
    <a href="#fresh-from-discord">Explorar projetos</a>
    <a href="https://discord.gg/clawd">Compartilhe o seu</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>Criações nativas de chat</strong>
      <span>Fluxos de trabalho com Telegram, WhatsApp, Discord, Beeper, chat web e terminal em primeiro lugar.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Automação real</strong>
      <span>Reservas, compras, suporte, relatórios e controle de navegador sem esperar por uma API.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Mundo local + físico</strong>
      <span>Impressoras, aspiradores, câmeras, dados de saúde, sistemas domésticos e bases de conhecimento pessoais.</span>
    </div>
  </div>
</div>

<Info>
**Quer aparecer aqui?** Compartilhe seu projeto em [#self-promotion no Discord](https://discord.gg/clawd) ou [marque @openclaw no X](https://x.com/openclaw).
</Info>

<div className="showcase-jump-links">
  <a href="#videos">Vídeos</a>
  <a href="#fresh-from-discord">Novidades do Discord</a>
  <a href="#automation-workflows">Automação</a>
  <a href="#knowledge-memory">Memória</a>
  <a href="#voice-phone">Voz &amp; Telefone</a>
  <a href="#infrastructure-deployment">Infraestrutura</a>
  <a href="#home-hardware">Casa &amp; Hardware</a>
  <a href="#community-projects">Comunidade</a>
  <a href="#submit-your-project">Envie um projeto</a>
</div>

<h2 id="videos">Vídeos</h2>

<p className="showcase-section-intro">
  Comece aqui se quiser o caminho mais curto de “o que é isso?” até “ok, entendi”.
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw: The self-hosted AI that Siri should have been (Full setup)"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Passo a passo completo de configuração</h3>
    <p>VelvetShark, 28 minutos. Instale, faça o onboarding e tenha um primeiro assistente funcionando de ponta a ponta.</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">Assistir no YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="OpenClaw showcase video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Reel de vitrine da comunidade</h3>
    <p>Uma passagem mais rápida por projetos, superfícies e fluxos de trabalho reais criados em torno do OpenClaw.</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">Assistir no YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="OpenClaw community showcase"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Projetos no mundo real</h3>
    <p>Exemplos da comunidade, de ciclos de programação nativos de chat até hardware e automação pessoal.</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">Assistir no YouTube</a>
  </div>
</div>

<h2 id="fresh-from-discord">Novidades do Discord</h2>

<p className="showcase-section-intro">
  Destaques recentes em programação, ferramentas de desenvolvimento, mobile e criação de produtos nativos de chat.
</p>

<CardGroup cols={2}>

<Card title="Revisão de PR → Feedback no Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

O OpenCode conclui a mudança → abre um PR → o OpenClaw revisa o diff e responde no Telegram com “minor suggestions” e um veredito claro de merge (incluindo correções críticas a aplicar primeiro).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Feedback de revisão de PR do OpenClaw entregue no Telegram" />
</Card>

<Card title="Skill de adega em minutos" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Pediram ao “Robby” (@openclaw) uma Skill local de adega. Ele solicita um exemplo de exportação CSV + onde armazená-lo, depois cria/testa a Skill rapidamente (962 garrafas no exemplo).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw criando uma Skill local de adega a partir de CSV" />
</Card>

<Card title="Piloto automático de compras no Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plano semanal de refeições → itens habituais → reservar horário de entrega → confirmar pedido. Sem APIs, apenas controle do navegador.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automação de compras no Tesco via chat" />
</Card>

<Card title="SNAG de captura de tela para Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Atalho para uma região da tela → visão do Gemini → Markdown instantâneo na sua área de transferência.

  <img src="/assets/showcase/snag.png" alt="Ferramenta SNAG de captura de tela para Markdown" />
</Card>

<Card title="UI de Agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Aplicativo desktop para gerenciar Skills/comandos em Agents, Claude, Codex e OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Aplicativo Agents UI" />
</Card>

<Card title="Mensagens de voz no Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Comunidade** • `voice` `tts` `telegram`

Encapsula o TTS do papla.media e envia os resultados como mensagens de voz no Telegram (sem reprodução automática irritante).

  <img src="/assets/showcase/papla-tts.jpg" alt="Saída de mensagem de voz no Telegram a partir de TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Auxiliar instalado via Homebrew para listar/inspecionar/monitorar sessões locais do OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor no ClawHub" />
</Card>

<Card title="Controle de impressora 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controle e solução de problemas de impressoras BambuLab: status, trabalhos, câmera, AMS, calibração e muito mais.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI no ClawHub" />
</Card>

<Card title="Transporte de Viena (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Partidas em tempo real, interrupções, status de elevadores e rotas para o transporte público de Viena.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien no ClawHub" />
</Card>

<Card title="Refeições escolares ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Reserva automatizada de refeições escolares no Reino Unido via ParentPay. Usa coordenadas do mouse para clicar com confiabilidade nas células da tabela.
</Card>

<Card title="Upload para R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Faz upload para Cloudflare R2/S3 e gera links seguros de download pré-assinados. Perfeito para instâncias remotas do OpenClaw.
</Card>

<Card title="App iOS via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Criou um app iOS completo com mapas e gravação de voz, implantado no TestFlight inteiramente via chat no Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="App iOS no TestFlight" />
</Card>

<Card title="Assistente de saúde com Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistente pessoal de saúde com IA integrando dados do Oura Ring com calendário, compromissos e agenda de academia.

  <img src="/assets/showcase/oura-health.png" alt="Assistente de saúde com Oura Ring" />
</Card>
<Card title="Dream Team do Kev (14+ Agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

Mais de 14 agentes sob um Gateway com orquestrador Opus 4.5 delegando para workers do Codex. [Texto técnico](https://github.com/adam91holt/orchestrated-ai-articles) abrangente cobrindo a equipe Dream Team, seleção de modelos, sandboxing, webhooks, Heartbeats e fluxos de delegação. [Clawdspace](https://github.com/adam91holt/clawdspace) para sandboxing de agentes. [Post de blog](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="CLI do Linear" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

CLI para o Linear que se integra a fluxos de trabalho agentivos (Claude Code, OpenClaw). Gerencie issues, projetos e fluxos de trabalho a partir do terminal. Primeiro PR externo mesclado!
</Card>

<Card title="CLI do Beeper" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Leia, envie e arquive mensagens via Beeper Desktop. Usa a API local MCP do Beeper para que agentes possam gerenciar todos os seus chats (iMessage, WhatsApp etc.) em um só lugar.
</Card>

</CardGroup>

<h2 id="automation-workflows">Automação &amp; Fluxos de trabalho</h2>

<p className="showcase-section-intro">
  Agendamento, controle do navegador, ciclos de suporte e o lado “simplesmente faça a tarefa para mim” do produto.
</p>

<CardGroup cols={2}>

<Card title="Controle de purificador de ar Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

O Claude Code descobriu e confirmou os controles do purificador, depois o OpenClaw assume para gerenciar a qualidade do ar do ambiente.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Controle do purificador de ar Winix via OpenClaw" />
</Card>

<Card title="Fotos bonitas do céu com câmera" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Acionado por uma câmera no telhado: pedir ao OpenClaw para tirar uma foto do céu sempre que ele estiver bonito — ele projetou uma Skill e tirou a foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Captura do céu pela câmera do telhado feita pelo OpenClaw" />
</Card>

<Card title="Cena visual de briefing matinal" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Um prompt agendado gera uma única imagem de "cena" toda manhã (clima, tarefas, data, post/citação favorita) por meio de uma persona do OpenClaw.
</Card>

<Card title="Reserva de quadra de padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Verificador de disponibilidade do Playtomic + CLI de reserva. Nunca mais perca uma quadra disponível.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="Captura de tela do padel-cli" />
</Card>

<Card title="Recebimento contábil" icon="file-invoice-dollar">
  **Comunidade** • `automation` `email` `pdf`
  
  Coleta PDFs do e-mail, prepara documentos para o consultor tributário. Contabilidade mensal no piloto automático.
</Card>

<Card title="Modo dev no sofá" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Reconstruiu o site pessoal inteiro via Telegram enquanto assistia Netflix — Notion → Astro, 18 posts migrados, DNS para Cloudflare. Nunca abriu um laptop.
</Card>

<Card title="Agente de busca de empregos" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Busca vagas de emprego, faz correspondência com palavras-chave do currículo e retorna oportunidades relevantes com links. Criado em 30 minutos usando a API JSearch.
</Card>

<Card title="Criador de Skill para Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

O OpenClaw se conectou ao Jira e depois gerou uma nova Skill na hora (antes de ela existir no ClawHub).
</Card>

<Card title="Skill do Todoist via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Automatizou tarefas do Todoist e fez o OpenClaw gerar a Skill diretamente no chat do Telegram.
</Card>

<Card title="Análise do TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Faz login no TradingView por automação de navegador, captura screenshots dos gráficos e realiza análise técnica sob demanda. Não precisa de API — apenas controle do navegador.
</Card>

<Card title="Suporte automático no Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Monitora o canal da empresa no Slack, responde de forma útil e encaminha notificações para o Telegram. Corrigiu autonomamente um bug de produção em um aplicativo implantado sem que ninguém pedisse.
</Card>

</CardGroup>

<h2 id="knowledge-memory">Conhecimento &amp; Memória</h2>

<p className="showcase-section-intro">
  Sistemas que indexam, pesquisam, lembram e raciocinam sobre conhecimento pessoal ou de equipe.
</p>

<CardGroup cols={2}>

<Card title="xuezh aprendizado de chinês" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  Motor de aprendizado de chinês com feedback de pronúncia e fluxos de estudo via OpenClaw.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="feedback de pronúncia do xuezh" />
</Card>

<Card title="Cofre de memória do WhatsApp" icon="vault">
  **Comunidade** • `memory` `transcription` `indexing`
  
  Ingere exportações completas do WhatsApp, transcreve mais de 1 mil notas de voz, cruza com logs do git e gera relatórios Markdown vinculados.
</Card>

<Card title="Busca semântica do Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Adiciona busca vetorial aos favoritos do Karakeep usando embeddings com Qdrant + OpenAI/Ollama.
</Card>

<Card title="Memória do Divertida Mente 2" icon="brain">
  **Comunidade** • `memory` `beliefs` `self-model`
  
  Gerenciador de memória separado que transforma arquivos de sessão em memórias → crenças → modelo de self em evolução.
</Card>

</CardGroup>

<h2 id="voice-phone">Voz &amp; Telefone</h2>

<p className="showcase-section-intro">
  Pontos de entrada orientados por fala, pontes telefônicas e fluxos de trabalho intensivos em transcrição.
</p>

<CardGroup cols={2}>

<Card title="Ponte telefônica Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Assistente de voz Vapi ↔ ponte HTTP do OpenClaw. Chamadas telefônicas quase em tempo real com seu agente.
</Card>

<Card title="Transcrição com OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcrição de áudio multilíngue via OpenRouter (Gemini etc.). Disponível no ClawHub.
</Card>

</CardGroup>

<h2 id="infrastructure-deployment">Infraestrutura &amp; Implantação</h2>

<p className="showcase-section-intro">
  Empacotamento, implantação e integrações que facilitam executar e estender o OpenClaw.
</p>

<CardGroup cols={2}>

<Card title="Complemento do Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  Gateway do OpenClaw rodando no Home Assistant OS com suporte a túnel SSH e estado persistente.
</Card>

<Card title="Skill do Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Controle e automatize dispositivos do Home Assistant por linguagem natural.
</Card>

<Card title="Empacotamento Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  Configuração do OpenClaw com Nix incluído para implantações reproduzíveis.
</Card>

<Card title="Calendário CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  Skill de calendário usando khal/vdirsyncer. Integração de calendário self-hosted.
</Card>

</CardGroup>

<h2 id="home-hardware">Casa &amp; Hardware</h2>

<p className="showcase-section-intro">
  O lado do mundo físico do OpenClaw: casas, sensores, câmeras, aspiradores e outros dispositivos.
</p>

<CardGroup cols={2}>

<Card title="Automação GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Automação residencial nativa de Nix com OpenClaw como interface, além de lindos painéis no Grafana.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="Painel do Grafana do GoHome" />
</Card>

<Card title="Aspirador Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Controle seu aspirador robô Roborock por meio de conversa natural.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Status do Roborock" />
</Card>

</CardGroup>

<h2 id="community-projects">Projetos da comunidade</h2>

<p className="showcase-section-intro">
  Coisas que cresceram além de um único fluxo de trabalho e viraram produtos ou ecossistemas mais amplos.
</p>

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Comunidade** • `marketplace` `astronomy` `webapp`
  
  Marketplace completo de equipamentos de astronomia. Criado com/em torno do ecossistema OpenClaw.
</Card>

</CardGroup>

---

<h2 id="submit-your-project">Envie seu projeto</h2>

<p className="showcase-section-intro">
  Se você está criando algo interessante com OpenClaw, envie para nós. Bons screenshots e resultados concretos ajudam.
</p>

Tem algo para compartilhar? Adoraríamos destacar!

<Steps>
  <Step title="Compartilhe">
    Publique em [#self-promotion no Discord](https://discord.gg/clawd) ou [poste no X marcando @openclaw](https://x.com/openclaw)
  </Step>
  <Step title="Inclua detalhes">
    Conte o que faz, coloque o link do repositório/demo e compartilhe um screenshot, se tiver
  </Step>
  <Step title="Seja destacado">
    Adicionaremos os projetos de destaque a esta página
  </Step>
</Steps>
