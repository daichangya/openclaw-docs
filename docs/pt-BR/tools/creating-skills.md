---
read_when:
    - Você está criando uma nova Skill personalizada no seu workspace
    - Você precisa de um fluxo inicial rápido para Skills baseadas em SKILL.md
summary: Crie e teste Skills personalizadas do workspace com SKILL.md
title: Criando Skills
x-i18n:
    generated_at: "2026-04-05T12:54:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 747cebc5191b96311d1d6760bede1785a099acd7633a0b88de6b7882b57e1db6
    source_path: tools/creating-skills.md
    workflow: 15
---

# Criando Skills

Skills ensinam o agent como e quando usar ferramentas. Cada Skill é um diretório
que contém um arquivo `SKILL.md` com frontmatter YAML e instruções em markdown.

Para saber como as Skills são carregadas e priorizadas, consulte [Skills](/tools/skills).

## Crie sua primeira Skill

<Steps>
  <Step title="Crie o diretório da Skill">
    As Skills ficam no seu workspace. Crie uma nova pasta:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Escreva o SKILL.md">
    Crie `SKILL.md` dentro desse diretório. O frontmatter define os metadados,
    e o corpo em markdown contém instruções para o agent.

    ```markdown
    ---
    name: hello_world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="Adicione ferramentas (opcional)">
    Você pode definir schemas de ferramentas personalizadas no frontmatter ou instruir o agent
    a usar ferramentas de sistema existentes (como `exec` ou `browser`). As Skills também podem
    ser distribuídas dentro de plugins junto com as ferramentas que documentam.

  </Step>

  <Step title="Carregue a Skill">
    Inicie uma nova sessão para que o OpenClaw detecte a Skill:

    ```bash
    # Do chat
    /new

    # Ou reinicie o gateway
    openclaw gateway restart
    ```

    Verifique se a Skill foi carregada:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Teste">
    Envie uma mensagem que deve acionar a Skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Ou simplesmente converse com o agent e peça uma saudação.

  </Step>
</Steps>

## Referência de metadados de Skill

O frontmatter YAML oferece suporte a estes campos:

| Campo                               | Obrigatório | Descrição                                   |
| ----------------------------------- | ----------- | ------------------------------------------- |
| `name`                              | Sim         | Identificador único (`snake_case`)          |
| `description`                       | Sim         | Descrição de uma linha exibida ao agent     |
| `metadata.openclaw.os`              | Não         | Filtro de SO (`["darwin"]`, `["linux"]` etc.) |
| `metadata.openclaw.requires.bins`   | Não         | Binários obrigatórios no PATH               |
| `metadata.openclaw.requires.config` | Não         | Chaves de config obrigatórias               |

## Boas práticas

- **Seja conciso** — instrua o modelo sobre _o que_ fazer, não sobre como ser uma IA
- **Segurança em primeiro lugar** — se sua Skill usar `exec`, garanta que os prompts não permitam injeção arbitrária de comandos a partir de entrada não confiável
- **Teste localmente** — use `openclaw agent --message "..."` para testar antes de compartilhar
- **Use o ClawHub** — explore e contribua com Skills em [ClawHub](https://clawhub.ai)

## Onde as Skills ficam

| Local                         | Precedência | Escopo                 |
| ----------------------------- | ----------- | ---------------------- |
| `\<workspace\>/skills/`       | Mais alta   | Por agent              |
| `\<workspace\>/.agents/skills/` | Alta      | Por agent do workspace |
| `~/.agents/skills/`           | Média       | Perfil de agent compartilhado |
| `~/.openclaw/skills/`         | Média       | Compartilhado (todos os agents) |
| Empacotadas (distribuídas com o OpenClaw) | Baixa | Global         |
| `skills.load.extraDirs`       | Mais baixa  | Pastas compartilhadas personalizadas |

## Relacionado

- [Referência de Skills](/tools/skills) — regras de carregamento, precedência e gating
- [Configuração de Skills](/tools/skills-config) — schema de config `skills.*`
- [ClawHub](/tools/clawhub) — registro público de Skills
- [Criando plugins](/plugins/building-plugins) — plugins podem incluir Skills
