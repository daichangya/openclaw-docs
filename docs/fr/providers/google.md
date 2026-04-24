---
read_when:
    - Vous voulez utiliser les modèles Google Gemini avec OpenClaw
    - Vous avez besoin du flux d’authentification par clé API ou OAuth
summary: Configuration de Google Gemini (clé API + OAuth, génération d’image, compréhension des médias, TTS, recherche Web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T07:27:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: b43d7171f56ecdfb49a25256783433e64f99a02760b3bc6f0e1055195f556f5d
    source_path: providers/google.md
    workflow: 15
---

Le Plugin Google fournit l’accès aux modèles Gemini via Google AI Studio, ainsi qu’à la
génération d’image, à la compréhension des médias (image/audio/vidéo), à la synthèse vocale, et à la recherche Web via
Gemini Grounding.

- Fournisseur : `google`
- Authentification : `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API : API Google Gemini
- Fournisseur alternatif : `google-gemini-cli` (OAuth)

## Prise en main

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clé API">
    **Idéal pour :** accès standard à l’API Gemini via Google AI Studio.

    <Steps>
      <Step title="Lancer l’onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Ou passez directement la clé :

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Les variables d’environnement `GEMINI_API_KEY` et `GOOGLE_API_KEY` sont toutes deux acceptées. Utilisez celle que vous avez déjà configurée.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Idéal pour :** réutiliser une connexion Gemini CLI existante via l’OAuth PKCE au lieu d’une clé API séparée.

    <Warning>
    Le fournisseur `google-gemini-cli` est une intégration non officielle. Certains utilisateurs
    signalent des restrictions de compte lorsqu’ils utilisent l’OAuth de cette manière. Utilisez-la à vos propres risques.
    </Warning>

    <Steps>
      <Step title="Installer Gemini CLI">
        La commande locale `gemini` doit être disponible dans le `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # ou npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw prend en charge à la fois les installations Homebrew et les installations npm globales, y compris
        les dispositions Windows/npm courantes.
      </Step>
      <Step title="Se connecter via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - Modèle par défaut : `google-gemini-cli/gemini-3-flash-preview`
    - Alias : `gemini-cli`

    **Variables d’environnement :**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Ou les variantes `GEMINI_CLI_*`.)

    <Note>
    Si les requêtes Gemini CLI OAuth échouent après la connexion, définissez `GOOGLE_CLOUD_PROJECT` ou
    `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte gateway et réessayez.
    </Note>

    <Note>
    Si la connexion échoue avant le démarrage du flux navigateur, assurez-vous que la commande locale `gemini`
    est installée et présente dans le `PATH`.
    </Note>

    Le fournisseur `google-gemini-cli` uniquement OAuth est une surface distincte
    d’inférence texte. La génération d’image, la compréhension des médias et Gemini Grounding restent sur
    l’ID fournisseur `google`.

  </Tab>
</Tabs>

## Capacités

| Capacité               | Pris en charge                 |
| ---------------------- | ------------------------------ |
| Complétions de chat    | Oui                            |
| Génération d’image     | Oui                            |
| Génération musicale    | Oui                            |
| Synthèse vocale        | Oui                            |
| Compréhension d’image  | Oui                            |
| Transcription audio    | Oui                            |
| Compréhension vidéo    | Oui                            |
| Recherche Web (Grounding) | Oui                         |
| Réflexion/raisonnement | Oui (Gemini 2.5+ / Gemini 3+) |
| Modèles Gemma 4        | Oui                            |

<Tip>
Les modèles Gemini 3 utilisent `thinkingLevel` plutôt que `thinkingBudget`. OpenClaw mappe
les contrôles de raisonnement de Gemini 3, Gemini 3.1, et des alias `gemini-*-latest` vers
`thinkingLevel` afin que les exécutions par défaut/à faible latence n’envoient pas
de valeurs `thinkingBudget` désactivées.

Les modèles Gemma 4 (par exemple `gemma-4-26b-a4b-it`) prennent en charge le mode réflexion. OpenClaw
réécrit `thinkingBudget` vers un `thinkingLevel` Google pris en charge pour Gemma 4.
Définir la réflexion sur `off` conserve la réflexion désactivée au lieu de la mapper vers
`MINIMAL`.
</Tip>

## Génération d’image

Le fournisseur intégré `google` de génération d’image utilise par défaut
`google/gemini-3.1-flash-image-preview`.

- Prend aussi en charge `google/gemini-3-pro-image-preview`
- Génération : jusqu’à 4 images par requête
- Mode édition : activé, jusqu’à 5 images d’entrée
- Contrôles de géométrie : `size`, `aspectRatio`, et `resolution`

Pour utiliser Google comme fournisseur d’image par défaut :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Voir [Génération d’image](/fr/tools/image-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

## Génération vidéo

Le Plugin intégré `google` enregistre aussi la génération vidéo via l’outil partagé
`video_generate`.

- Modèle vidéo par défaut : `google/veo-3.1-fast-generate-preview`
- Modes : texte-vers-vidéo, image-vers-vidéo, et flux à référence vidéo unique
- Prend en charge `aspectRatio`, `resolution`, et `audio`
- Limite actuelle de durée : **4 à 8 secondes**

Pour utiliser Google comme fournisseur vidéo par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Voir [Génération vidéo](/fr/tools/video-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

## Génération musicale

Le Plugin intégré `google` enregistre aussi la génération musicale via l’outil partagé
`music_generate`.

- Modèle musical par défaut : `google/lyria-3-clip-preview`
- Prend aussi en charge `google/lyria-3-pro-preview`
- Contrôles de prompt : `lyrics` et `instrumental`
- Format de sortie : `mp3` par défaut, plus `wav` sur `google/lyria-3-pro-preview`
- Entrées de référence : jusqu’à 10 images
- Les exécutions adossées à une session se détachent via le flux partagé tâche/statut, y compris `action: "status"`

Pour utiliser Google comme fournisseur musical par défaut :

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Voir [Génération musicale](/fr/tools/music-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

## Synthèse vocale

Le fournisseur de parole intégré `google` utilise le chemin TTS de l’API Gemini avec
`gemini-3.1-flash-tts-preview`.

- Voix par défaut : `Kore`
- Authentification : `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY`, ou `GOOGLE_API_KEY`
- Sortie : WAV pour les pièces jointes TTS normales, PCM pour Talk/téléphonie
- Sortie native en note vocale : non prise en charge sur ce chemin de l’API Gemini car l’API renvoie du PCM plutôt que de l’Opus

Pour utiliser Google comme fournisseur TTS par défaut :

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Le TTS de l’API Gemini accepte des balises audio expressives entre crochets dans le texte, telles que
`[whispers]` ou `[laughs]`. Pour garder les balises hors de la réponse de chat visible tout en
les envoyant au TTS, placez-les dans un bloc `[[tts:text]]...[[/tts:text]]` :

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Une clé API Google Cloud Console limitée à l’API Gemini est valide pour ce
fournisseur. Il ne s’agit pas du chemin distinct de l’API Cloud Text-to-Speech.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Réutilisation directe du cache Gemini">
    Pour les exécutions directes de l’API Gemini (`api: "google-generative-ai"`), OpenClaw
    transmet un handle `cachedContent` configuré aux requêtes Gemini.

    - Configurez des paramètres par modèle ou globaux avec soit
      `cachedContent` soit l’ancien `cached_content`
    - Si les deux sont présents, `cachedContent` l’emporte
    - Exemple de valeur : `cachedContents/prebuilt-context`
    - L’utilisation de cache-hit Gemini est normalisée en `cacheRead` OpenClaw à partir de
      `cachedContentTokenCount` amont

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

  </Accordion>

  <Accordion title="Remarques sur l’utilisation JSON de Gemini CLI">
    Lors de l’utilisation du fournisseur OAuth `google-gemini-cli`, OpenClaw normalise
    la sortie JSON de la CLI comme suit :

    - Le texte de réponse provient du champ JSON `response` de la CLI.
    - L’utilisation revient à `stats` lorsque la CLI laisse `usage` vide.
    - `stats.cached` est normalisé en `cacheRead` OpenClaw.
    - Si `stats.input` est manquant, OpenClaw dérive les tokens d’entrée à partir de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Environnement et configuration du daemon">
    Si le Gateway s’exécute comme daemon (launchd/systemd), assurez-vous que `GEMINI_API_KEY`
    est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Lié

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, références de modèles et comportement de basculement.
  </Card>
  <Card title="Génération d’image" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés d’outil d’image et sélection du fournisseur.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés d’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Génération musicale" href="/fr/tools/music-generation" icon="music">
    Paramètres partagés d’outil musical et sélection du fournisseur.
  </Card>
</CardGroup>
