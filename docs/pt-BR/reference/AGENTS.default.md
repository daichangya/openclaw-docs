---
read_when:
    - Iniciar uma nova sessão de agente OpenClaw
    - Habilitar ou auditar as Skills padrão
summary: Instruções padrão do agente OpenClaw e lista de skills para a configuração de assistente pessoal
title: AGENTS.md padrão
x-i18n:
    generated_at: "2026-04-05T12:52:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45990bc4e6fa2e3d80e76207e62ec312c64134bee3bc832a5cae32ca2eda3b61
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - Assistente pessoal do OpenClaw (padrão)

## Primeira execução (recomendado)

O OpenClaw usa um diretório de workspace dedicado para o agente. Padrão: `~/.openclaw/workspace` (configurável via `agents.defaults.workspace`).

1. Crie o workspace (se ele ainda não existir):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Copie os templates padrão de workspace para o workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Opcional: se você quiser a lista de skills do assistente pessoal, substitua o AGENTS.md por este arquivo:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Opcional: escolha um workspace diferente definindo `agents.defaults.workspace` (suporta `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Padrões de segurança

- Não despeje diretórios nem segredos no chat.
- Não execute comandos destrutivos a menos que isso seja solicitado explicitamente.
- Não envie respostas parciais/em streaming para superfícies externas de mensagens (apenas respostas finais).

## Início de sessão (obrigatório)

- Leia `SOUL.md`, `USER.md` e hoje+ontem em `memory/`.
- Leia `MEMORY.md` quando estiver presente; só use `memory.md` em minúsculas como fallback quando `MEMORY.md` estiver ausente.
- Faça isso antes de responder.

## Soul (obrigatório)

- `SOUL.md` define identidade, tom e limites. Mantenha-o atualizado.
- Se você alterar `SOUL.md`, avise o usuário.
- Você é uma instância nova em cada sessão; a continuidade vive nesses arquivos.

## Espaços compartilhados (recomendado)

- Você não é a voz do usuário; seja cuidadoso em grupos ou canais públicos.
- Não compartilhe dados privados, informações de contato ou notas internas.

## Sistema de memória (recomendado)

- Registro diário: `memory/YYYY-MM-DD.md` (crie `memory/` se necessário).
- Memória de longo prazo: `MEMORY.md` para fatos duráveis, preferências e decisões.
- `memory.md` em minúsculas é apenas fallback legado; não mantenha os dois arquivos raiz de propósito.
- No início da sessão, leia hoje + ontem + `MEMORY.md` quando presente; caso contrário, `memory.md`.
- Registre: decisões, preferências, restrições, pendências.
- Evite segredos, a menos que isso seja solicitado explicitamente.

## Ferramentas e Skills

- As ferramentas ficam em Skills; siga o `SKILL.md` de cada skill quando precisar.
- Mantenha notas específicas do ambiente em `TOOLS.md` (Notas para Skills).

## Dica de backup (recomendado)

Se você tratar este workspace como a “memória” do Clawd, transforme-o em um repositório git (de preferência privado) para que `AGENTS.md` e seus arquivos de memória tenham backup.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Opcional: adicione um remoto privado + faça push
```

## O que o OpenClaw faz

- Executa o gateway do WhatsApp + agente de codificação Pi para que o assistente possa ler/escrever chats, buscar contexto e executar skills via o Mac host.
- O app do macOS gerencia permissões (gravação de tela, notificações, microfone) e expõe a CLI `openclaw` por meio de seu binário empacotado.
- Chats diretos são recolhidos na sessão `main` do agente por padrão; grupos permanecem isolados como `agent:<agentId>:<channel>:group:<id>` (salas/canais: `agent:<agentId>:<channel>:channel:<id>`); heartbeats mantêm tarefas em segundo plano ativas.

## Skills principais (habilite em Settings → Skills)

- **mcporter** — runtime/CLI de servidor de ferramentas para gerenciar backends externos de skill.
- **Peekaboo** — capturas de tela rápidas no macOS com análise opcional de visão por IA.
- **camsnap** — captura quadros, clipes ou alertas de movimento de câmeras de segurança RTSP/ONVIF.
- **oracle** — CLI de agente pronto para OpenAI com replay de sessão e controle de browser.
- **eightctl** — controle seu sono pelo terminal.
- **imsg** — envie, leia e acompanhe iMessage e SMS.
- **wacli** — CLI do WhatsApp: sincronizar, pesquisar, enviar.
- **discord** — ações do Discord: reagir, stickers, enquetes. Use alvos `user:<id>` ou `channel:<id>` (ids numéricos sem prefixo são ambíguos).
- **gog** — CLI do Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — cliente Spotify para terminal para pesquisar/adicionar à fila/controlar reprodução.
- **sag** — fala com ElevenLabs com UX no estilo `say` do Mac; faz streaming para os alto-falantes por padrão.
- **Sonos CLI** — controle caixas de som Sonos (descoberta/status/reprodução/volume/agrupamento) por scripts.
- **blucli** — reproduza, agrupe e automatize players BluOS por scripts.
- **OpenHue CLI** — controle de iluminação Philips Hue para cenas e automações.
- **OpenAI Whisper** — speech-to-text local para ditado rápido e transcrições de voicemail.
- **Gemini CLI** — modelos Gemini do Google no terminal para perguntas e respostas rápidas.
- **agent-tools** — kit de utilitários para automações e scripts auxiliares.

## Observações de uso

- Prefira a CLI `openclaw` para scripts; o app do Mac gerencia as permissões.
- Execute instalações pela aba Skills; ela oculta o botão se um binário já estiver presente.
- Mantenha heartbeats habilitados para que o assistente possa agendar lembretes, monitorar caixas de entrada e acionar capturas de câmera.
- A UI Canvas é executada em tela cheia com sobreposições nativas. Evite colocar controles críticos nos cantos superior esquerdo/superior direito ou nas bordas inferiores; adicione gutters explícitos ao layout e não dependa de safe-area insets.
- Para verificação orientada por browser, use `openclaw browser` (tabs/status/screenshot) com o perfil do Chrome gerenciado pelo OpenClaw.
- Para inspeção de DOM, use `openclaw browser eval|query|dom|snapshot` (e `--json`/`--out` quando precisar de saída legível por máquina).
- Para interações, use `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type exigem refs de snapshot; use `evaluate` para seletores CSS).
