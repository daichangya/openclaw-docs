---
read_when:
    - Vous souhaitez configurer Perplexity comme fournisseur de recherche web
    - Vous avez besoin de la clé API Perplexity ou de la configuration du proxy OpenRouter
summary: Configuration du fournisseur de recherche web Perplexity (clé API, modes de recherche, filtrage)
title: Perplexity
x-i18n:
    generated_at: "2026-04-24T07:28:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2d3d6912bc9952bbe89124dd8aea600c938c8ceff21df46508b6e44e0a1159
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (fournisseur de recherche web)

Le plugin Perplexity fournit des capacités de recherche web via l’API Perplexity
Search ou Perplexity Sonar via OpenRouter.

<Note>
Cette page couvre la configuration du **fournisseur** Perplexity. Pour l’**outil**
Perplexity (comment l’agent l’utilise), voir [Outil Perplexity](/fr/tools/perplexity-search).
</Note>

| Propriété   | Valeur                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| Type        | Fournisseur de recherche web (pas un fournisseur de modèles)           |
| Authentification | `PERPLEXITY_API_KEY` (direct) ou `OPENROUTER_API_KEY` (via OpenRouter) |
| Chemin de config | `plugins.entries.perplexity.config.webSearch.apiKey`              |

## Premiers pas

<Steps>
  <Step title="Définir la clé API">
    Exécutez le flux interactif de configuration de recherche web :

    ```bash
    openclaw configure --section web
    ```

    Ou définissez directement la clé :

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Commencer à rechercher">
    L’agent utilisera automatiquement Perplexity pour les recherches web une fois la clé
    configurée. Aucune étape supplémentaire n’est nécessaire.
  </Step>
</Steps>

## Modes de recherche

Le plugin sélectionne automatiquement le transport en fonction du préfixe de la clé API :

<Tabs>
  <Tab title="API Perplexity native (pplx-)">
    Lorsque votre clé commence par `pplx-`, OpenClaw utilise l’API native Perplexity Search.
    Ce transport renvoie des résultats structurés et prend en charge les filtres de domaine, de langue
    et de date (voir les options de filtrage ci-dessous).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Lorsque votre clé commence par `sk-or-`, OpenClaw passe par OpenRouter en utilisant
    le modèle Perplexity Sonar. Ce transport renvoie des réponses synthétisées par IA avec
    des citations.
  </Tab>
</Tabs>

| Préfixe de clé | Transport                    | Fonctionnalités                                 |
| -------------- | ---------------------------- | ----------------------------------------------- |
| `pplx-`        | API native Perplexity Search | Résultats structurés, filtres domaine/langue/date |
| `sk-or-`       | OpenRouter (Sonar)           | Réponses synthétisées par IA avec citations     |

## Filtrage de l’API native

<Note>
Les options de filtrage ne sont disponibles que lors de l’utilisation de l’API Perplexity native
(clé `pplx-`). Les recherches OpenRouter/Sonar ne prennent pas en charge ces paramètres.
</Note>

Lors de l’utilisation de l’API Perplexity native, les recherches prennent en charge les filtres suivants :

| Filtre         | Description                            | Exemple                              |
| -------------- | -------------------------------------- | ------------------------------------ |
| Pays           | Code pays à 2 lettres                  | `us`, `de`, `jp`                     |
| Langue         | Code langue ISO 639-1                  | `en`, `fr`, `zh`                     |
| Plage de dates | Fenêtre de récence                     | `day`, `week`, `month`, `year`       |
| Filtres de domaine | Liste d’autorisation ou de refus (max 20 domaines) | `example.com`            |
| Budget de contenu | Limites de jetons par réponse / par page | `max_tokens`, `max_tokens_per_page` |

## Configuration avancée

<AccordionGroup>
  <Accordion title="Variable d’environnement pour les processus daemon">
    Si le Gateway OpenClaw fonctionne comme daemon (launchd/systemd), assurez-vous que
    `PERPLEXITY_API_KEY` est disponible pour ce processus.

    <Warning>
    Une clé définie uniquement dans `~/.profile` ne sera pas visible par un daemon
    launchd/systemd sauf si cet environnement est explicitement importé. Définissez la clé dans
    `~/.openclaw/.env` ou via `env.shellEnv` afin que le processus gateway puisse
    la lire.
    </Warning>

  </Accordion>

  <Accordion title="Configuration du proxy OpenRouter">
    Si vous préférez router les recherches Perplexity via OpenRouter, définissez un
    `OPENROUTER_API_KEY` (préfixe `sk-or-`) au lieu d’une clé Perplexity native.
    OpenClaw détectera le préfixe et basculera automatiquement vers le transport Sonar.

    <Tip>
    Le transport OpenRouter est utile si vous avez déjà un compte OpenRouter
    et souhaitez une facturation consolidée entre plusieurs fournisseurs.
    </Tip>

  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Outil de recherche Perplexity" href="/fr/tools/perplexity-search" icon="magnifying-glass">
    Comment l’agent invoque les recherches Perplexity et interprète les résultats.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration, y compris les entrées de plugin.
  </Card>
</CardGroup>
