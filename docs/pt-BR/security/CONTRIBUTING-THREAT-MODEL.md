---
read_when:
    - Você quer contribuir com descobertas de segurança ou cenários de ameaça
    - Revisando ou atualizando o modelo de ameaças
summary: Como contribuir para o modelo de ameaças do OpenClaw
title: Contribuindo para o Modelo de Ameaças
x-i18n:
    generated_at: "2026-04-05T12:53:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd212d456571a25da63031588d3b584bdfc119e2096b528b97a3f7ec5e4b3db
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# Contribuindo para o Modelo de Ameaças do OpenClaw

Obrigado por ajudar a tornar o OpenClaw mais seguro. Este modelo de ameaças é um documento vivo, e aceitamos contribuições de qualquer pessoa — você não precisa ser especialista em segurança.

## Formas de contribuir

### Adicionar uma ameaça

Identificou um vetor de ataque ou risco que ainda não cobrimos? Abra uma issue em [openclaw/trust](https://github.com/openclaw/trust/issues) e descreva em suas próprias palavras. Você não precisa conhecer nenhum framework nem preencher todos os campos — basta descrever o cenário.

**É útil incluir (mas não é obrigatório):**

- O cenário de ataque e como ele poderia ser explorado
- Quais partes do OpenClaw são afetadas (CLI, gateway, canais, ClawHub, servidores MCP etc.)
- Quão grave você acha que é (baixo / médio / alto / crítico)
- Quaisquer links para pesquisas relacionadas, CVEs ou exemplos do mundo real

Nós cuidaremos do mapeamento ATLAS, dos IDs de ameaça e da avaliação de risco durante a revisão. Se você quiser incluir esses detalhes, ótimo — mas isso não é esperado.

> **Isso serve para adicionar ao modelo de ameaças, não para relatar vulnerabilidades ativas.** Se você encontrou uma vulnerabilidade explorável, consulte nossa [página Trust](https://trust.openclaw.ai) para instruções de divulgação responsável.

### Sugerir uma mitigação

Tem uma ideia de como lidar com uma ameaça existente? Abra uma issue ou PR fazendo referência à ameaça. Mitigações úteis são específicas e acionáveis — por exemplo, “limitação de taxa por remetente de 10 mensagens/minuto no gateway” é melhor do que “implementar limitação de taxa”.

### Propor uma cadeia de ataque

Cadeias de ataque mostram como várias ameaças se combinam em um cenário de ataque realista. Se você identificar uma combinação perigosa, descreva as etapas e como um invasor as encadearia. Uma narrativa curta de como o ataque acontece na prática é mais valiosa do que um template formal.

### Corrigir ou melhorar conteúdo existente

Erros de digitação, esclarecimentos, informações desatualizadas, exemplos melhores — PRs são bem-vindos, sem necessidade de abrir issue.

## O que usamos

### MITRE ATLAS

Este modelo de ameaças é baseado no [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), um framework projetado especificamente para ameaças de IA/ML, como prompt injection, uso indevido de ferramentas e exploração de agentes. Você não precisa conhecer o ATLAS para contribuir — nós mapeamos as submissões para o framework durante a revisão.

### IDs de ameaça

Cada ameaça recebe um ID como `T-EXEC-003`. As categorias são:

| Code    | Category                                   |
| ------- | ------------------------------------------ |
| RECON   | Reconhecimento - coleta de informações     |
| ACCESS  | Acesso inicial - obtenção de entrada       |
| EXEC    | Execução - executar ações maliciosas       |
| PERSIST | Persistência - manter o acesso             |
| EVADE   | Evasão de defesa - evitar detecção         |
| DISC    | Descoberta - aprender sobre o ambiente     |
| EXFIL   | Exfiltração - roubo de dados               |
| IMPACT  | Impacto - dano ou interrupção              |

Os IDs são atribuídos pelos maintainers durante a revisão. Você não precisa escolher um.

### Níveis de risco

| Level        | Meaning                                                           |
| ------------ | ----------------------------------------------------------------- |
| **Crítico** | Comprometimento total do sistema, ou alta probabilidade + impacto crítico      |
| **Alto**     | Dano significativo provável, ou probabilidade média + impacto crítico |
| **Médio**   | Risco moderado, ou baixa probabilidade + alto impacto                    |
| **Baixo**      | Improvável e com impacto limitado                                       |

Se você não tiver certeza sobre o nível de risco, apenas descreva o impacto e nós faremos a avaliação.

## Processo de revisão

1. **Triagem** - Revisamos novas submissões em até 48 horas
2. **Avaliação** - Verificamos viabilidade, atribuimos mapeamento ATLAS e ID de ameaça, validamos o nível de risco
3. **Documentação** - Garantimos que tudo esteja formatado e completo
4. **Merge** - Adicionado ao modelo de ameaças e à visualização

## Recursos

- [ATLAS Website](https://atlas.mitre.org/)
- [ATLAS Techniques](https://atlas.mitre.org/techniques/)
- [ATLAS Case Studies](https://atlas.mitre.org/studies/)
- [Modelo de Ameaças do OpenClaw](/security/THREAT-MODEL-ATLAS)

## Contato

- **Vulnerabilidades de segurança:** Consulte nossa [página Trust](https://trust.openclaw.ai) para instruções de reporte
- **Perguntas sobre o modelo de ameaças:** Abra uma issue em [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Chat geral:** canal #security no Discord

## Reconhecimento

Contribuidores do modelo de ameaças são reconhecidos nos agradecimentos do modelo de ameaças, nas notas de release e no hall da fama de segurança do OpenClaw por contribuições significativas.
