---
read_when:
    - Procurando exemplos reais de uso do OpenClaw
    - Atualizando os destaques de projetos da comunidade
summary: Projetos e integrações criados pela comunidade com OpenClaw
title: Vitrine
x-i18n:
    generated_at: "2026-04-05T12:54:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2917e9a476ef527ddb3e51c610bbafbd145e705c9cc29f191639fb63d238ef70
    source_path: start/showcase.md
    workflow: 15
---

# Vitrine

Projetos reais da comunidade. Veja o que as pessoas estão criando com OpenClaw.

<Info>
**Quer aparecer aqui?** Compartilhe seu projeto em [#self-promotion no Discord](https://discord.gg/clawd) ou [marque @openclaw no X](https://x.com/openclaw).
</Info>

## 🎥 OpenClaw em ação

Passo a passo completo de configuração (28 min) por VelvetShark.

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
    title="OpenClaw: A IA self-hosted que a Siri deveria ter sido (configuração completa)"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[Assistir no YouTube](https://www.youtube.com/watch?v=SaWSPZoPX34)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
    title="Vídeo de vitrine do OpenClaw"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[Assistir no YouTube](https://www.youtube.com/watch?v=mMSKQvlmFuQ)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
    title="Vitrine da comunidade OpenClaw"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[Assistir no YouTube](https://www.youtube.com/watch?v=5kkIJNUGFho)

## 🆕 Novidades do Discord

<CardGroup cols={2}>

<Card title="Avaliação de PR → feedback no Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

O OpenCode conclui a alteração → abre um PR → o OpenClaw revisa o diff e responde no Telegram com “minor suggestions” mais um veredito claro de merge (incluindo correções críticas a aplicar primeiro).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Feedback de revisão de PR do OpenClaw entregue no Telegram" />
</Card>

<Card title="Skill de adega em minutos" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Pediram ao “Robby” (@openclaw) uma Skill local para adega. Ele solicita uma exportação CSV de exemplo + onde armazená-la, depois cria/testa a Skill rapidamente (962 garrafas no exemplo).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw criando uma Skill local de adega a partir de CSV" />
</Card>

<Card title="Piloto automático para compras no Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plano semanal de refeições → itens habituais → reservar horário de entrega → confirmar pedido. Sem APIs, apenas controle do navegador.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automação de compras no Tesco via chat" />
</Card>

<Card title="SNAG de captura de tela para Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Tecla de atalho para uma região da tela → visão do Gemini → Markdown instantâneo na área de transferência.

  <img src="/assets/showcase/snag.png" alt="Ferramenta SNAG de captura de tela para Markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

App para desktop para gerenciar Skills/comandos entre Agents, Claude, Codex e OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="App Agents UI" />
</Card>

<Card title="Notas de voz no Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Comunidade** • `voice` `tts` `telegram`

Empacota o TTS do papla.media e envia os resultados como notas de voz no Telegram (sem autoplay irritante).

  <img src="/assets/showcase/papla-tts.jpg" alt="Saída de nota de voz no Telegram a partir de TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Helper instalado via Homebrew para listar/inspecionar/observar sessões locais do OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor no ClawHub" />
</Card>

<Card title="Controle de impressora 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controle e solução de problemas de impressoras BambuLab: status, trabalhos, câmera, AMS, calibração e muito mais.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI no ClawHub" />
</Card>

<Card title="Transporte de Viena (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Partidas em tempo real, interrupções, status de elevadores e roteamento para o transporte público de Viena.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien no ClawHub" />
</Card>

<Card title="Refeições escolares no ParentPay" icon="utensils" href="#">
  **@George5562** • `automation` `browser` `parenting`

Reserva automatizada de refeições escolares no Reino Unido via ParentPay. Usa coordenadas do mouse para clicar com confiabilidade nas células da tabela.
</Card>

<Card title="Upload para R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Faça upload para Cloudflare R2/S3 e gere links de download presigned seguros. Perfeito para instâncias remotas do OpenClaw.
</Card>

<Card title="App iOS via Telegram" icon="mobile" href="#">
  **@coard** • `ios` `xcode` `testflight`

Criou um app iOS completo com mapas e gravação de voz, implantado no TestFlight inteiramente via chat no Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="App iOS no TestFlight" />
</Card>

<Card title="Assistente de saúde com Oura Ring" icon="heart-pulse" href="#">
  **@AS** • `health` `oura` `calendar`

Assistente pessoal de saúde com IA integrando dados do Oura ring com calendário, compromissos e agenda da academia.

  <img src="/assets/showcase/oura-health.png" alt="Assistente de saúde com Oura ring" />
</Card>
<Card title="Kev's Dream Team (14+ Agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

Mais de 14 agents sob um gateway com um orquestrador Opus 4.5 delegando a workers do Codex. [Texto técnico](https://github.com/adam91holt/orchestrated-ai-articles) abrangente cobrindo a equipe Dream Team, seleção de modelos, sandboxing, webhooks, heartbeats e fluxos de delegação. [Clawdspace](https://github.com/adam91holt/clawdspace) para sandboxing de agents. [Post no blog](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

CLI para Linear que se integra com fluxos de trabalho agentic (Claude Code, OpenClaw). Gerencie issues, projetos e fluxos de trabalho a partir do terminal. Primeiro PR externo mesclado!
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Leia, envie e arquive mensagens via Beeper Desktop. Usa a API local MCP do Beeper para que agents gerenciem todos os seus chats (iMessage, WhatsApp etc.) em um só lugar.
</Card>

</CardGroup>

## 🤖 Automação e fluxos de trabalho

<CardGroup cols={2}>

<Card title="Controle de purificador de ar Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code descobriu e confirmou os controles do purificador; depois o OpenClaw assume para gerenciar a qualidade do ar do ambiente.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Controle de purificador de ar Winix via OpenClaw" />
</Card>

<Card title="Belas fotos do céu com câmera" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Acionado por uma câmera no telhado: peça ao OpenClaw para tirar uma foto do céu sempre que ele parecer bonito — ele projetou uma Skill e tirou a foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Foto do céu com câmera no telhado capturada pelo OpenClaw" />
</Card>

<Card title="Cena visual de briefing matinal" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Um prompt agendado gera uma única imagem de “cena” toda manhã (clima, tarefas, data, publicação/citação favorita) via uma persona do OpenClaw.
</Card>

<Card title="Reserva de quadra de padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Verificador de disponibilidade do Playtomic + CLI de reserva. Nunca mais perca uma quadra disponível.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="Captura de tela do padel-cli" />
</Card>

<Card title="Triagem contábil" icon="file-invoice-dollar">
  **Comunidade** • `automation` `email` `pdf`
  
  Coleta PDFs do e-mail e prepara documentos para o consultor tributário. Contabilidade mensal no piloto automático.
</Card>

<Card title="Modo dev no sofá" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Reconstruiu o site pessoal inteiro via Telegram enquanto assistia Netflix — Notion → Astro, 18 posts migrados, DNS para Cloudflare. Nunca abriu um laptop.
</Card>

<Card title="Agent de busca de emprego" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Pesquisa vagas de emprego, compara com palavras-chave do CV e retorna oportunidades relevantes com links. Criado em 30 minutos usando a API JSearch.
</Card>

<Card title="Criador de Skill para Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

O OpenClaw se conectou ao Jira e depois gerou uma nova Skill na hora (antes de ela existir no ClawHub).
</Card>

<Card title="Skill do Todoist via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Automatizou tarefas do Todoist e fez o OpenClaw gerar a Skill diretamente no chat do Telegram.
</Card>

<Card title="Análise no TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Faz login no TradingView por automação do navegador, captura gráficos e realiza análise técnica sob demanda. Sem API — apenas controle do navegador.
</Card>

<Card title="Auto-suporte no Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Observa o canal da empresa no Slack, responde de forma útil e encaminha notificações para o Telegram. Corrigiu autonomamente um bug de produção em um app implantado sem que ninguém pedisse.
</Card>

</CardGroup>

## 🧠 Conhecimento e memória

<CardGroup cols={2}>

<Card title="xuezh aprendizado de chinês" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  Motor de aprendizado de chinês com feedback de pronúncia e fluxos de estudo via OpenClaw.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Feedback de pronúncia do xuezh" />
</Card>

<Card title="Cofre de memória do WhatsApp" icon="vault">
  **Comunidade** • `memory` `transcription` `indexing`
  
  Ingere exportações completas do WhatsApp, transcreve mais de 1 mil notas de voz, cruza com logs do git e gera relatórios em Markdown com links.
</Card>

<Card title="Busca semântica no Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Adiciona busca vetorial aos favoritos do Karakeep usando embeddings do Qdrant + OpenAI/Ollama.
</Card>

<Card title="Memória de Divertida Mente 2" icon="brain">
  **Comunidade** • `memory` `beliefs` `self-model`
  
  Gerenciador de memória separado que transforma arquivos de sessão em memórias → crenças → modelo de self em evolução.
</Card>

</CardGroup>

## 🎙️ Voz e telefone

<CardGroup cols={2}>

<Card title="Ponte telefônica Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Ponte HTTP entre o assistente de voz Vapi e o OpenClaw. Chamadas telefônicas quase em tempo real com seu agent.
</Card>

<Card title="Transcrição com OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcrição de áudio multilíngue via OpenRouter (Gemini etc.). Disponível no ClawHub.
</Card>

</CardGroup>

## 🏗️ Infraestrutura e implantação

<CardGroup cols={2}>

<Card title="Add-on do Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  Gateway OpenClaw em execução no Home Assistant OS com suporte a túnel SSH e estado persistente.
</Card>

<Card title="Skill do Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Controle e automatize dispositivos do Home Assistant com linguagem natural.
</Card>

<Card title="Empacotamento Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  Configuração do OpenClaw baseada em nix, com tudo incluído, para implantações reproduzíveis.
</Card>

<Card title="Calendário CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  Skill de calendário usando khal/vdirsyncer. Integração de calendário self-hosted.
</Card>

</CardGroup>

## 🏠 Casa e hardware

<CardGroup cols={2}>

<Card title="Automação GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Automação residencial nativa de Nix com OpenClaw como interface, além de lindos painéis Grafana.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="Painel Grafana do GoHome" />
</Card>

<Card title="Aspirador Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Controle seu aspirador robô Roborock por meio de conversa natural.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Status do Roborock" />
</Card>

</CardGroup>

## 🌟 Projetos da comunidade

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Comunidade** • `marketplace` `astronomy` `webapp`
  
  Marketplace completo de equipamentos de astronomia. Criado com/ao redor do ecossistema OpenClaw.
</Card>

</CardGroup>

---

## Envie seu projeto

Tem algo para compartilhar? Adoraríamos destacá-lo!

<Steps>
  <Step title="Compartilhe">
    Publique em [#self-promotion no Discord](https://discord.gg/clawd) ou [poste no X marcando @openclaw](https://x.com/openclaw)
  </Step>
  <Step title="Inclua detalhes">
    Conte o que ele faz, inclua o link para o repositório/demo e compartilhe uma captura de tela, se tiver
  </Step>
  <Step title="Seja destacado">
    Adicionaremos projetos de destaque a esta página
  </Step>
</Steps>
