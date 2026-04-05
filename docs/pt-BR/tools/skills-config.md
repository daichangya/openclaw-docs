---
read_when:
    - Adicionar ou modificar a configuração de Skills
    - Ajustar a allowlist agrupada ou o comportamento de instalação
summary: Schema de configuração de Skills e exemplos
title: Configuração de Skills
x-i18n:
    generated_at: "2026-04-05T12:56:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7839f39f68c1442dcf4740b09886e0ef55762ce0d4b9f7b4f493a8c130c84579
    source_path: tools/skills-config.md
    workflow: 15
---

# Configuração de Skills

A maior parte da configuração de carregamento/instalação de Skills fica em `skills` em
`~/.openclaw/openclaw.json`. A visibilidade de Skills específica do agente fica em
`agents.defaults.skills` e `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (o runtime do Gateway ainda é Node; bun não é recomendado)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou string em texto simples
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Para geração/edição de imagens integrada, prefira `agents.defaults.imageGenerationModel`
mais a ferramenta principal `image_generate`. `skills.entries.*` é apenas para fluxos de trabalho de Skills personalizados ou
de terceiros.

Se você selecionar um provedor/modelo de imagem específico, também configure a
autenticação/chave de API desse provedor. Exemplos típicos: `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para
`google/*`, `OPENAI_API_KEY` para `openai/*` e `FAL_KEY` para `fal/*`.

Exemplos:

- Configuração nativa no estilo Nano Banana: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- Configuração nativa do fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlists de Skills do agente

Use a configuração do agente quando quiser as mesmas raízes de Skills da máquina/workspace, mas um
conjunto visível de Skills diferente por agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // herda os padrões -> github, weather
      { id: "docs", skills: ["docs-search"] }, // substitui os padrões
      { id: "locked-down", skills: [] }, // nenhuma Skill
    ],
  },
}
```

Regras:

- `agents.defaults.skills`: allowlist de base compartilhada para agentes que omitem
  `agents.list[].skills`.
- Omita `agents.defaults.skills` para deixar as Skills irrestritas por padrão.
- `agents.list[].skills`: conjunto final explícito de Skills para esse agente; ele não
  é mesclado com os padrões.
- `agents.list[].skills: []`: não expõe nenhuma Skill para esse agente.

## Campos

- As raízes de Skills integradas sempre incluem `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` e `<workspace>/skills`.
- `allowBundled`: allowlist opcional apenas para Skills **agrupadas**. Quando definida, apenas
  as Skills agrupadas na lista são elegíveis (Skills gerenciadas, do agente e do workspace não são afetadas).
- `load.extraDirs`: diretórios adicionais de Skills para varredura (menor precedência).
- `load.watch`: observa as pastas de Skills e atualiza o snapshot de Skills (padrão: true).
- `load.watchDebounceMs`: debounce para eventos do observador de Skills em milissegundos (padrão: 250).
- `install.preferBrew`: prefere instaladores via brew quando disponíveis (padrão: true).
- `install.nodeManager`: preferência do instalador do Node (`npm` | `pnpm` | `yarn` | `bun`, padrão: npm).
  Isso afeta apenas as **instalações de Skills**; o runtime do Gateway ainda deve ser Node
  (`bun` não é recomendado para WhatsApp/Telegram).
  - `openclaw setup --node-manager` é mais restrito e atualmente aceita `npm`,
    `pnpm` ou `bun`. Defina `skills.install.nodeManager: "yarn"` manualmente se
    quiser instalações de Skills com suporte do Yarn.
- `entries.<skillKey>`: substituições por Skill.
- `agents.defaults.skills`: allowlist padrão opcional de Skills herdada por agentes
  que omitem `agents.list[].skills`.
- `agents.list[].skills`: allowlist final opcional por agente; listas explícitas
  substituem os padrões herdados em vez de mesclar.

Campos por Skill:

- `enabled`: defina como `false` para desabilitar uma Skill mesmo que ela esteja agrupada/instalada.
- `env`: variáveis de ambiente injetadas para a execução do agente (somente se ainda não estiverem definidas).
- `apiKey`: conveniência opcional para Skills que declaram uma variável de ambiente principal.
  Aceita string em texto simples ou objeto SecretRef (`{ source, provider, id }`).

## Observações

- As chaves em `entries` são mapeadas para o nome da Skill por padrão. Se uma Skill definir
  `metadata.openclaw.skillKey`, use essa chave no lugar.
- A precedência de carregamento é `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills agrupadas →
  `skills.load.extraDirs`.
- Alterações nas Skills são aplicadas no próximo turno do agente quando o observador está habilitado.

### Skills em sandbox + variáveis de ambiente

Quando uma sessão está em **sandbox**, os processos de Skill são executados dentro do Docker. O sandbox
**não** herda o `process.env` do host.

Use uma destas opções:

- `agents.defaults.sandbox.docker.env` (ou `agents.list[].sandbox.docker.env` por agente)
- incorporar as variáveis de ambiente à sua imagem de sandbox personalizada

`env` global e `skills.entries.<skill>.env/apiKey` se aplicam apenas a execuções no **host**.
