---
read_when:
    - Models CLI ekleme veya değiştirme (`models list`/`set`/`scan`/`aliases`/`fallbacks`)
    - Model geri dönüş davranışını veya seçim UX'ini değiştirme
    - Model tarama sorgularını güncelleme (araçlar/görüntüler)
summary: 'Models CLI: listele, ayarla, takma adlar, geri dönüşler, tara, durum'
title: Models CLI
x-i18n:
    generated_at: "2026-04-23T09:01:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46916d9600a4e4aebdb026aa42df39149d8b6d438a8a7e85a61053dfc8f76dcc
    source_path: concepts/models.md
    workflow: 15
---

# Models CLI

Auth profili rotasyonu,
cooldown'lar ve bunun geri dönüşlerle nasıl etkileştiği için bkz. [/concepts/model-failover](/tr/concepts/model-failover).
Hızlı sağlayıcı genel görünümü + örnekler: [/concepts/model-providers](/tr/concepts/model-providers).

## Model seçimi nasıl çalışır

OpenClaw modelleri şu sırayla seçer:

1. **Birincil** model (`agents.defaults.model.primary` veya `agents.defaults.model`).
2. `agents.defaults.model.fallbacks` içindeki **geri dönüşler** (sırayla).
3. **Sağlayıcı auth failover**, bir sonraki modele geçmeden önce sağlayıcının içinde gerçekleşir.

İlgili:

- `agents.defaults.models`, OpenClaw'ın kullanabileceği modellerin izin listesi/kataloğudur (artı takma adlar).
- `agents.defaults.imageModel`, **yalnızca** birincil model görselleri kabul edemediğinde kullanılır.
- `agents.defaults.pdfModel`, `pdf` aracı tarafından kullanılır. Belirtilmezse araç,
  `agents.defaults.imageModel` değerine, ardından çözümlenen oturum/varsayılan
  modele geri döner.
- `agents.defaults.imageGenerationModel`, paylaşılan görsel oluşturma yeteneği tarafından kullanılır. Belirtilmezse `image_generate`, auth destekli bir sağlayıcı varsayılanını yine de çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından sağlayıcı kimliği sırasına göre kalan kayıtlı görsel oluşturma sağlayıcılarını dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının auth/API anahtarını da yapılandırın.
- `agents.defaults.musicGenerationModel`, paylaşılan müzik oluşturma yeteneği tarafından kullanılır. Belirtilmezse `music_generate`, auth destekli bir sağlayıcı varsayılanını yine de çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından sağlayıcı kimliği sırasına göre kalan kayıtlı müzik oluşturma sağlayıcılarını dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının auth/API anahtarını da yapılandırın.
- `agents.defaults.videoGenerationModel`, paylaşılan video oluşturma yeteneği tarafından kullanılır. Belirtilmezse `video_generate`, auth destekli bir sağlayıcı varsayılanını yine de çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından sağlayıcı kimliği sırasına göre kalan kayıtlı video oluşturma sağlayıcılarını dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının auth/API anahtarını da yapılandırın.
- Aracı başına varsayılanlar, `agents.list[].model` ve bağlamalar aracılığıyla `agents.defaults.model` değerini geçersiz kılabilir (bkz. [/concepts/multi-agent](/tr/concepts/multi-agent)).

## Hızlı model ilkesi

- Birincil modelinizi, kullanabildiğiniz en güçlü en yeni nesil modele ayarlayın.
- Maliyet/gecikme açısından hassas görevler ve daha düşük riskli sohbetler için geri dönüşleri kullanın.
- Araç etkin aracıları veya güvenilmeyen girdiler için daha eski/daha zayıf model katmanlarından kaçının.

## Onboarding (önerilir)

Yapılandırmayı elle düzenlemek istemiyorsanız onboarding çalıştırın:

```bash
openclaw onboard
```

Bu, **OpenAI Code (Codex)
aboneliği** (OAuth) ve **Anthropic** (API anahtarı veya Claude CLI) dahil olmak üzere yaygın sağlayıcılar için model + auth kurabilir.

## Yapılandırma anahtarları (genel görünüm)

- `agents.defaults.model.primary` ve `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` ve `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` ve `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` ve `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` ve `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (izin listesi + takma adlar + sağlayıcı parametreleri)
- `models.providers` (`models.json` içine yazılan özel sağlayıcılar)

Model başvuruları küçük harfe normalize edilir. `z.ai/*` gibi sağlayıcı takma adları
`zai/*` biçimine normalize edilir.

OpenCode dahil sağlayıcı yapılandırma örnekleri
[/providers/opencode](/tr/providers/opencode) içinde yer alır.

### Güvenli izin listesi düzenlemeleri

`agents.defaults.models` değerini elle güncellerken eklemeli yazımları kullanın:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set`, model/sağlayıcı eşlemelerini yanlışlıkla
ezilmeye karşı korur. `agents.defaults.models`, `models.providers` veya
`models.providers.<id>.models` için düz nesne ataması, mevcut
girdileri kaldıracaksa reddedilir. Eklemeli değişiklikler için `--merge` kullanın;
yalnızca sağlanan değer tam hedef değer olacaksa `--replace` kullanın.

Etkileşimli sağlayıcı kurulumu ve `openclaw configure --section model` de
sağlayıcı kapsamlı seçimleri mevcut izin listesine birleştirir; böylece Codex,
Ollama veya başka bir sağlayıcı eklemek alakasız model girdilerini düşürmez.

## "Model is not allowed" ("Modele izin verilmiyor") hatası ve yanıtların neden durduğu

`agents.defaults.models` ayarlanmışsa, `/model` ve
oturum geçersiz kılmaları için **izin listesi** hâline gelir. Kullanıcı bu izin listesinde olmayan
bir model seçtiğinde, OpenClaw şunu döndürür:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Bu durum normal bir yanıt üretilmeden **önce** gerçekleşir; dolayısıyla ileti
sanki “yanıt vermemiş” gibi hissedilebilir. Çözüm şunlardan biridir:

- Modeli `agents.defaults.models` içine eklemek veya
- İzin listesini temizlemek (`agents.defaults.models` değerini kaldırmak) veya
- `/model list` içinden bir model seçmek

Örnek izin listesi yapılandırması:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Sohbette model değiştirme (`/model`)

Yeniden başlatmadan geçerli oturum için modelleri değiştirebilirsiniz:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Notlar:

- `/model` (ve `/model list`) kompakt, numaralı bir seçicidir (model ailesi + kullanılabilir sağlayıcılar).
- Discord'da `/model` ve `/models`, sağlayıcı ve model açılır menülerinin yanı sıra bir Gönder adımı içeren etkileşimli bir seçici açar.
- `/models add` varsayılan olarak kullanılabilir ve `commands.modelsWrite=false` ile devre dışı bırakılabilir.
- Etkin olduğunda, `/models add <provider> <modelId>` en hızlı yoldur; yalın `/models add`, desteklenen yerlerde sağlayıcı öncelikli yönlendirmeli bir akış başlatır.
- `/models add` işleminden sonra yeni model, Gateway yeniden başlatılmadan `/models` ve `/model` içinde kullanılabilir olur.
- `/model <#>`, bu seçiciden seçim yapar.
- `/model`, yeni oturum seçimini hemen kalıcılaştırır.
- Aracı boştaysa, sonraki çalıştırma yeni modeli hemen kullanır.
- Bir çalıştırma zaten etkinse, OpenClaw canlı geçişi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlar.
- Araç etkinliği veya yanıt çıktısı zaten başladıysa, bekleyen geçiş daha sonraki bir yeniden deneme fırsatına veya bir sonraki kullanıcı turuna kadar kuyrukta kalabilir.
- `/model status`, ayrıntılı görünümdür (auth adayları ve yapılandırılmışsa sağlayıcı uç noktası `baseUrl` + `api` modu).
- Model başvuruları **ilk** `/` üzerinden bölünerek ayrıştırılır. `/model <ref>` yazarken `provider/model` kullanın.
- Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini eklemeniz gerekir (örnek: `/model openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız, OpenClaw girdiyi şu sırayla çözümler:
  1. takma ad eşleşmesi
  2. tam bu öneksiz model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesi
  3. yapılandırılmış varsayılan sağlayıcıya kullanımdan kaldırılmış geri dönüş
     Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, OpenClaw
     bunun yerine eski, kaldırılmış bir sağlayıcı varsayılanını
     göstermemek için ilk yapılandırılmış sağlayıcı/modele geri döner.

Tam komut davranışı/yapılandırma: [Slash commands](/tr/tools/slash-commands).

Örnekler:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

## CLI komutları

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (alt komut olmadan), `models status` için bir kısayoldur.

### `models list`

Varsayılan olarak yapılandırılmış modelleri gösterir. Yararlı bayraklar:

- `--all`: tam katalog
- `--local`: yalnızca yerel sağlayıcılar
- `--provider <id>`: örneğin `moonshot` gibi sağlayıcı kimliğine göre filtrele; etkileşimli seçicilerdeki görüntüleme etiketleri kabul edilmez
- `--plain`: satır başına bir model
- `--json`: makine tarafından okunabilir çıktı

`--all`, auth yapılandırılmadan önce paketlenmiş sağlayıcıya ait statik katalog satırlarını içerir; bu nedenle yalnızca keşif amaçlı görünümler, eşleşen sağlayıcı kimlik bilgilerini ekleyene kadar kullanılamayan modelleri gösterebilir.

### `models status`

Çözümlenen birincil modeli, geri dönüşleri, görsel modelini ve
yapılandırılmış sağlayıcıların auth genel görünümünü gösterir. Ayrıca auth deposunda bulunan
profiller için OAuth sona erme durumunu da gösterir (varsayılan olarak 24 saat içinde uyarır). `--plain` yalnızca çözümlenen
birincil modeli yazdırır.
OAuth durumu her zaman gösterilir (ve `--json` çıktısına dahil edilir). Yapılandırılmış bir
sağlayıcının kimlik bilgileri yoksa, `models status` bir **Eksik auth** bölümü yazdırır.
JSON, `auth.oauth` (uyarı penceresi + profiller) ve `auth.providers`
(sağlayıcı başına etkili auth, ortam destekli kimlik bilgileri dahil) içerir. `auth.oauth`
yalnızca auth deposu profil sağlığıdır; yalnızca ortam kullanan sağlayıcılar burada görünmez.
Otomasyon için `--check` kullanın (eksik/süresi dolmuşsa çıkış `1`, süresi dolmak üzereyse `2`).
Canlı auth denetimleri için `--probe` kullanın; sorgu satırları auth profillerinden, ortam
kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
Açık `auth.order.<provider>`, depolanmış bir profili dışlıyorsa, sorgu
denemek yerine `excluded_by_auth_order` bildirir. Auth varsa ama bu sağlayıcı için sorgulanabilir
bir model çözümlenemiyorsa, sorgu `status: no_model` bildirir.

Auth seçimi sağlayıcıya/hesaba bağlıdır. Sürekli açık Gateway ana bilgisayarlarında API
anahtarları genellikle en öngörülebilir seçenektir; Claude CLI yeniden kullanımı ve mevcut Anthropic
OAuth/token profilleri de desteklenir.

Örnek (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Tarama (OpenRouter ücretsiz modelleri)

`openclaw models scan`, OpenRouter'ın **ücretsiz model kataloğunu** inceler ve
isteğe bağlı olarak modelleri araç ve görsel desteği açısından sorgulayabilir.

Temel bayraklar:

- `--no-probe`: canlı sorguları atla (yalnızca meta veri)
- `--min-params <b>`: minimum parametre boyutu (milyar)
- `--max-age-days <days>`: eski modelleri atla
- `--provider <name>`: sağlayıcı öneki filtresi
- `--max-candidates <n>`: geri dönüş listesi boyutu
- `--set-default`: `agents.defaults.model.primary` değerini ilk seçime ayarla
- `--set-image`: `agents.defaults.imageModel.primary` değerini ilk görsel seçimine ayarla

Sorgulama bir OpenRouter API anahtarı gerektirir (auth profillerinden veya
`OPENROUTER_API_KEY` üzerinden).
Anahtar yoksa, yalnızca adayları listelemek için `--no-probe` kullanın.

Tarama sonuçları şu ölçütlere göre sıralanır:

1. Görsel desteği
2. Araç gecikmesi
3. Bağlam boyutu
4. Parametre sayısı

Girdi

- OpenRouter `/models` listesi (`:free` filtresi)
- Auth profillerinden veya `OPENROUTER_API_KEY` üzerinden OpenRouter API anahtarı gerektirir (bkz. [/environment](/tr/help/environment))
- İsteğe bağlı filtreler: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Sorgu denetimleri: `--timeout`, `--concurrency`

TTY içinde çalıştırıldığında geri dönüşleri etkileşimli olarak seçebilirsiniz. Etkileşimli olmayan
modda varsayılanları kabul etmek için `--yes` geçin.

## Modeller kayıt defteri (`models.json`)

`models.providers` içindeki özel sağlayıcılar, aracı dizini altındaki
`models.json` dosyasına yazılır (varsayılan `~/.openclaw/agents/<agentId>/agent/models.json`). Bu dosya,
`models.mode` değeri `replace` olarak ayarlanmadıkça varsayılan olarak birleştirilir.

Eşleşen sağlayıcı kimlikleri için birleştirme modu önceliği:

- Aracı `models.json` dosyasında zaten bulunan boş olmayan `baseUrl` önceliklidir.
- Aracı `models.json` dosyasındaki boş olmayan `apiKey`, yalnızca o sağlayıcı geçerli yapılandırma/auth profili bağlamında SecretRef tarafından yönetilmiyorsa önceliklidir.
- SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş gizli anahtarları kalıcılaştırmak yerine kaynak işaretleyicilerden (`ENV_VAR_NAME` ortam başvuruları için, `secretref-managed` dosya/exec başvuruları için) yenilenir.
- SecretRef tarafından yönetilen sağlayıcı üst bilgi değerleri, kaynak işaretleyicilerden (`secretref-env:ENV_VAR_NAME` ortam başvuruları için, `secretref-managed` dosya/exec başvuruları için) yenilenir.
- Boş veya eksik aracı `apiKey`/`baseUrl` değerleri yapılandırmadaki `models.providers` değerine geri döner.
- Diğer sağlayıcı alanları yapılandırmadan ve normalize edilmiş katalog verilerinden yenilenir.

İşaretleyici kalıcılığı kaynak otoritelidir: OpenClaw işaretleyicileri çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) yazar.
Bu, OpenClaw `models.json` dosyasını `openclaw agent` gibi komut güdümlü yollar dahil olmak üzere her yeniden oluşturduğunda geçerlidir.

## İlgili

- [Model Providers](/tr/concepts/model-providers) — sağlayıcı yönlendirme ve auth
- [Model Failover](/tr/concepts/model-failover) — geri dönüş zincirleri
- [Image Generation](/tr/tools/image-generation) — görsel model yapılandırması
- [Music Generation](/tr/tools/music-generation) — müzik model yapılandırması
- [Video Generation](/tr/tools/video-generation) — video model yapılandırması
- [Configuration Reference](/tr/gateway/configuration-reference#agent-defaults) — model yapılandırma anahtarları
