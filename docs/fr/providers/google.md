---
read_when:
    - Vous souhaitez utiliser des modèles Google Gemini avec OpenClaw
    - Vous avez besoin du flux d'authentification par clé API ou OAuth
summary: Configuration de Google Gemini (clé API + OAuth, génération d'images, compréhension des médias, recherche web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-05T12:51:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa3c4326e83fad277ae4c2cb9501b6e89457afcfa7e3e1d57ae01c9c0c6846e2
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Le plugin Google fournit un accès aux modèles Gemini via Google AI Studio, ainsi qu'à la
génération d'images, à la compréhension des médias (image/audio/vidéo) et à la recherche web via
Gemini Grounding.

- Fournisseur : `google`
- Authentification : `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API : Google Gemini API
- Fournisseur alternatif : `google-gemini-cli` (OAuth)

## Démarrage rapide

1. Définissez la clé API :

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Définissez un modèle par défaut :

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## Exemple non interactif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## OAuth (Gemini CLI)

Un fournisseur alternatif `google-gemini-cli` utilise OAuth PKCE au lieu d'une
clé API. Il s'agit d'une intégration non officielle ; certains utilisateurs signalent des
restrictions de compte. Utilisez-la à vos propres risques.

- Modèle par défaut : `google-gemini-cli/gemini-3.1-pro-preview`
- Alias : `gemini-cli`
- Prérequis d'installation : la CLI Gemini locale doit être disponible comme `gemini`
  - Homebrew : `brew install gemini-cli`
  - npm : `npm install -g @google/gemini-cli`
- Connexion :

```bash
openclaw models auth login --provider google-gemini-cli --set-default
```

Variables d'environnement :

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

(Ou les variantes `GEMINI_CLI_*`.)

Si les requêtes OAuth Gemini CLI échouent après la connexion, définissez
`GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` sur l'hôte gateway puis
réessayez.

Si la connexion échoue avant le démarrage du flux navigateur, assurez-vous que la commande locale `gemini`
est installée et présente dans le `PATH`. OpenClaw prend en charge les installations Homebrew
ainsi que les installations npm globales, y compris les dispositions courantes Windows/npm.

Remarques sur l'utilisation JSON de Gemini CLI :

- Le texte de réponse provient du champ JSON `response` de la CLI.
- L'utilisation revient à `stats` lorsque la CLI laisse `usage` vide.
- `stats.cached` est normalisé en `cacheRead` dans OpenClaw.
- Si `stats.input` est absent, OpenClaw dérive les jetons d'entrée à partir de
  `stats.input_tokens - stats.cached`.

## Capacités

| Capacité                 | Prise en charge |
| ------------------------ | --------------- |
| Chat completions         | Oui             |
| Génération d'images      | Oui             |
| Compréhension d'images   | Oui             |
| Transcription audio      | Oui             |
| Compréhension vidéo      | Oui             |
| Recherche web (Grounding) | Oui            |
| Réflexion/raisonnement   | Oui (Gemini 3.1+) |

## Réutilisation directe du cache Gemini

Pour les exécutions directes de l'API Gemini (`api: "google-generative-ai"`), OpenClaw
transmet désormais un handle `cachedContent` configuré aux requêtes Gemini.

- Configurez des paramètres par modèle ou globaux avec soit
  `cachedContent` soit l'ancien `cached_content`
- Si les deux sont présents, `cachedContent` l'emporte
- Exemple de valeur : `cachedContents/prebuilt-context`
- L'utilisation correspondant à un cache-hit Gemini est normalisée dans OpenClaw en `cacheRead` à partir de
  `cachedContentTokenCount` amont

Exemple :

```json5
{
  agents: {
    defaults: {
      models: {
        "google/gemini-2.5-pro": {
          params: {
            cachedContent: "cachedContents/prebuilt-context",
          },
        },
      },
    },
  },
}
```

## Génération d'images

Le fournisseur intégré `google` de génération d'images utilise par défaut
`google/gemini-3.1-flash-image-preview`.

- Prend également en charge `google/gemini-3-pro-image-preview`
- Génération : jusqu'à 4 images par requête
- Mode édition : activé, jusqu'à 5 images d'entrée
- Contrôles de géométrie : `size`, `aspectRatio` et `resolution`

Le fournisseur `google-gemini-cli`, limité à OAuth, est une surface distincte
d'inférence de texte. La génération d'images, la compréhension des médias et Gemini Grounding restent sur
l'ID de fournisseur `google`.

## Remarque sur l'environnement

Si la gateway s'exécute comme daemon (launchd/systemd), assurez-vous que `GEMINI_API_KEY`
est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via
`env.shellEnv`).
