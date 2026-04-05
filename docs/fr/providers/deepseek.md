---
read_when:
    - Vous voulez utiliser DeepSeek avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou du choix d’authentification CLI
summary: Configuration de DeepSeek (authentification + sélection de modèle)
x-i18n:
    generated_at: "2026-04-05T12:51:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35f339ca206399496ce094eb8350e0870029ce9605121bcf86c4e9b94f3366c6
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com) fournit de puissants modèles IA avec une API compatible OpenAI.

- Fournisseur : `deepseek`
- Authentification : `DEEPSEEK_API_KEY`
- API : compatible OpenAI
- URL de base : `https://api.deepseek.com`

## Démarrage rapide

Définissez la clé API (recommandé : la stocker pour la Gateway) :

```bash
openclaw onboard --auth-choice deepseek-api-key
```

Cela vous demandera votre clé API et définira `deepseek/deepseek-chat` comme modèle par défaut.

## Exemple non interactif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice deepseek-api-key \
  --deepseek-api-key "$DEEPSEEK_API_KEY" \
  --skip-health \
  --accept-risk
```

## Remarque sur l’environnement

Si la Gateway s’exécute comme daemon (`launchd`/`systemd`), assurez-vous que `DEEPSEEK_API_KEY`
est disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
`env.shellEnv`).

## Catalogue intégré

| Réf. du modèle               | Nom                | Entrée | Contexte | Sortie max | Remarques                                        |
| ---------------------------- | ------------------ | ------ | -------- | ---------- | ------------------------------------------------ |
| `deepseek/deepseek-chat`     | DeepSeek Chat      | text   | 131,072  | 8,192      | Modèle par défaut ; surface sans raisonnement DeepSeek V3.2 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner  | text   | 131,072  | 65,536     | Surface V3.2 avec raisonnement activé            |

Les deux modèles intégrés annoncent actuellement dans le code la compatibilité d’utilisation en streaming.

Obtenez votre clé API sur [platform.deepseek.com](https://platform.deepseek.com/api_keys).
