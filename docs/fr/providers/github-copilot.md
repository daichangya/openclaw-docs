---
read_when:
    - Vous souhaitez utiliser GitHub Copilot comme fournisseur de modèles
    - Vous avez besoin du flux `openclaw models auth login-github-copilot`
summary: Se connecter à GitHub Copilot depuis OpenClaw en utilisant le flux appareil
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-21T07:04:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7faafbd3bdcd8886e75fb0d40c3eec66355df3fca6160ebbbb9a0018b7839fe
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot est l’assistant de codage IA de GitHub. Il donne accès aux
modèles Copilot pour votre compte GitHub et votre offre. OpenClaw peut utiliser Copilot comme
fournisseur de modèles de deux façons différentes.

## Deux façons d’utiliser Copilot dans OpenClaw

<Tabs>
  <Tab title="Fournisseur intégré (github-copilot)">
    Utilisez le flux natif de connexion par appareil pour obtenir un jeton GitHub, puis l’échanger contre
    des jetons d’API Copilot lorsque OpenClaw s’exécute. Il s’agit du chemin **par défaut** et du plus simple
    car il ne nécessite pas VS Code.

    <Steps>
      <Step title="Exécuter la commande de connexion">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Il vous sera demandé de visiter une URL et de saisir un code à usage unique. Gardez le
        terminal ouvert jusqu’à la fin.
      </Step>
      <Step title="Définir un modèle par défaut">
        ```bash
        openclaw models set github-copilot/claude-opus-4.6
        ```

        Ou dans la configuration :

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.6" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Utilisez l’extension VS Code **Copilot Proxy** comme pont local. OpenClaw communique avec
    le point de terminaison `/v1` du proxy et utilise la liste de modèles que vous y configurez.

    <Note>
    Choisissez cette option si vous utilisez déjà Copilot Proxy dans VS Code ou si vous devez passer
    par lui. Vous devez activer le plugin et garder l’extension VS Code en cours d’exécution.
    </Note>

  </Tab>
</Tabs>

## Options facultatives

| Flag            | Description                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | Ignorer l’invite de confirmation                    |
| `--set-default` | Appliquer également le modèle par défaut recommandé du fournisseur |

```bash
# Ignorer la confirmation
openclaw models auth login-github-copilot --yes

# Se connecter et définir le modèle par défaut en une seule étape
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="TTY interactif requis">
    Le flux de connexion par appareil nécessite un TTY interactif. Exécutez-le directement dans un
    terminal, pas dans un script non interactif ni dans un pipeline CI.
  </Accordion>

  <Accordion title="La disponibilité des modèles dépend de votre offre">
    La disponibilité des modèles Copilot dépend de votre offre GitHub. Si un modèle est
    rejeté, essayez un autre identifiant (par exemple `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Sélection du transport">
    Les identifiants de modèles Claude utilisent automatiquement le transport Anthropic Messages. Les modèles GPT,
    de série o et Gemini conservent le transport OpenAI Responses. OpenClaw
    sélectionne le bon transport en fonction de la référence du modèle.
  </Accordion>

  <Accordion title="Ordre de résolution des variables d’environnement">
    OpenClaw résout l’authentification Copilot à partir des variables d’environnement dans l’ordre
    de priorité suivant :

    | Priority | Variable              | Notes                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Priorité la plus élevée, spécifique à Copilot |
    | 2        | `GH_TOKEN`            | Jeton GitHub CLI (repli)         |
    | 3        | `GITHUB_TOKEN`        | Jeton GitHub standard (priorité la plus basse)   |

    Lorsque plusieurs variables sont définies, OpenClaw utilise celle de priorité la plus élevée.
    Le flux de connexion par appareil (`openclaw models auth login-github-copilot`) stocke
    son jeton dans le magasin de profils d’authentification et prend priorité sur toutes les variables
    d’environnement.

  </Accordion>

  <Accordion title="Stockage des jetons">
    La connexion stocke un jeton GitHub dans le magasin de profils d’authentification et l’échange
    contre un jeton d’API Copilot lorsque OpenClaw s’exécute. Vous n’avez pas besoin de gérer le
    jeton manuellement.
  </Accordion>
</AccordionGroup>

<Warning>
Nécessite un TTY interactif. Exécutez la commande de connexion directement dans un terminal, pas
dans un script headless ni dans un job CI.
</Warning>

## Embeddings de recherche Memory

GitHub Copilot peut aussi servir de fournisseur d’embedding pour
[la recherche Memory](/fr/concepts/memory-search). Si vous avez un abonnement Copilot et
êtes connecté, OpenClaw peut l’utiliser pour les embeddings sans clé API distincte.

### Détection automatique

Lorsque `memorySearch.provider` vaut `"auto"` (par défaut), GitHub Copilot est essayé
avec une priorité de 15 -- après les embeddings locaux mais avant OpenAI et les autres
fournisseurs payants. Si un jeton GitHub est disponible, OpenClaw découvre les
modèles d’embedding disponibles depuis l’API Copilot et choisit automatiquement le meilleur.

### Configuration explicite

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Facultatif : remplacer le modèle détecté automatiquement
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Fonctionnement

1. OpenClaw résout votre jeton GitHub (à partir des variables d’environnement ou du profil d’authentification).
2. L’échange contre un jeton d’API Copilot de courte durée.
3. Interroge le point de terminaison Copilot `/models` pour découvrir les modèles d’embedding disponibles.
4. Choisit le meilleur modèle (préfère `text-embedding-3-small`).
5. Envoie les requêtes d’embedding au point de terminaison Copilot `/embeddings`.

La disponibilité des modèles dépend de votre offre GitHub. Si aucun modèle d’embedding n’est
disponible, OpenClaw ignore Copilot et essaie le fournisseur suivant.

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de repli.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
