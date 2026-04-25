---
read_when:
    - OpenClaw OAuth'u uçtan uca anlamak istiyorsunuz
    - Belirteç geçersiz kılma / oturum kapatma sorunlarıyla karşılaştınız
    - Claude CLI veya OAuth kimlik doğrulama akışlarını istiyorsunuz
    - Birden fazla hesap veya profil yönlendirmesi istiyorsunuz
summary: 'OpenClaw''da OAuth: belirteç değişimi, depolama ve çoklu hesap desenleri'
title: OAuth
x-i18n:
    generated_at: "2026-04-25T13:45:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c793c52f48a3f49c0677d8e55a84c2bf5cdf0d385e6a858f26c0701d45583211
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw, bunu sunan sağlayıcılar için OAuth üzerinden “abonelik kimlik doğrulaması”nı destekler
(özellikle **OpenAI Codex (ChatGPT OAuth)**). Anthropic için pratik ayrım artık şöyledir:

- **Anthropic API anahtarı**: normal Anthropic API faturalandırması
- **OpenClaw içinde Anthropic Claude CLI / abonelik kimlik doğrulaması**: Anthropic çalışanları
  bize bu kullanımın yeniden izinli olduğunu söyledi

OpenAI Codex OAuth, OpenClaw gibi harici araçlarda kullanım için açıkça
desteklenir. Bu sayfa şunları açıklar:

Anthropic için üretimde API anahtarıyla kimlik doğrulama, önerilen daha güvenli yoldur.

- OAuth **belirteç değişiminin** nasıl çalıştığı (PKCE)
- belirteçlerin **nerede depolandığı** (ve neden)
- **birden fazla hesabın** nasıl ele alınacağı (profiller + oturum başına geçersiz kılmalar)

OpenClaw ayrıca kendi OAuth veya API anahtarı
akışlarını sağlayan **sağlayıcı plugin**'lerini de destekler. Bunları şu şekilde çalıştırın:

```bash
openclaw models auth login --provider <id>
```

## Belirteç havuzu (neden vardır)

OAuth sağlayıcıları, giriş/yenileme akışları sırasında yaygın olarak **yeni bir refresh token** oluşturur. Bazı sağlayıcılar (veya OAuth istemcileri), aynı kullanıcı/uygulama için yeni bir refresh token verildiğinde eski refresh token'ları geçersiz kılabilir.

Pratik belirti:

- OpenClaw üzerinden _ve_ Claude Code / Codex CLI üzerinden giriş yaparsınız → bunlardan biri daha sonra rastgele “oturumu kapatılmış” olur

Bunu azaltmak için OpenClaw, `auth-profiles.json` dosyasını bir **belirteç havuzu** olarak ele alır:

- çalışma zamanı kimlik bilgilerini **tek bir yerden** okur
- birden fazla profili tutabilir ve bunları deterministik olarak yönlendirebiliriz
- harici CLI yeniden kullanımı sağlayıcıya özgüdür: Codex CLI boş bir
  `openai-codex:default` profilini bootstrap edebilir, ancak OpenClaw yerel bir OAuth profiline sahip olduktan sonra
  yerel refresh token kanonik olur; diğer entegrasyonlar haricen yönetilmeye devam edebilir
  ve CLI kimlik doğrulama depolarını yeniden okuyabilir

## Depolama (belirteçler nerede yaşar)

Gizli anahtarlar **ajan başına** saklanır:

- Kimlik doğrulama profilleri (OAuth + API anahtarları + isteğe bağlı değer düzeyinde referanslar): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski uyumluluk dosyası: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (`api_key` statik girdileri bulunduğunda temizlenir)

Eski yalnızca içe aktarma dosyası (hâlâ desteklenir, ancak ana depo değildir):

- `~/.openclaw/credentials/oauth.json` (ilk kullanımda `auth-profiles.json` içine aktarılır)

Yukarıdakilerin tümü ayrıca `$OPENCLAW_STATE_DIR` değerine de uyar (durum dizini geçersiz kılması). Tam başvuru: [/gateway/configuration](/tr/gateway/configuration-reference#auth-storage)

Statik gizli anahtar referansları ve çalışma zamanı anlık görüntü etkinleştirme davranışı için bkz. [Secrets Management](/tr/gateway/secrets).

## Anthropic eski belirteç uyumluluğu

<Warning>
Anthropic'in herkese açık Claude Code belgeleri, doğrudan Claude Code kullanımının
Claude abonelik sınırları içinde kaldığını söylüyor ve Anthropic çalışanları bize OpenClaw tarzı Claude
CLI kullanımına yeniden izin verildiğini söyledi. Bu nedenle OpenClaw, Anthropic
yeni bir ilke yayımlamadıkça, Claude CLI yeniden kullanımını ve
`claude -p` kullanımını bu entegrasyon için izinli kabul eder.

Anthropic'in güncel doğrudan Claude Code plan belgeleri için bkz. [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
ve [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

OpenClaw içinde diğer abonelik tarzı seçenekleri istiyorsanız bkz. [OpenAI
Codex](/tr/providers/openai), [Qwen Cloud Coding
Plan](/tr/providers/qwen), [MiniMax Coding Plan](/tr/providers/minimax),
ve [Z.AI / GLM Coding Plan](/tr/providers/glm).
</Warning>

OpenClaw ayrıca Anthropic setup-token'ı desteklenen bir belirteç kimlik doğrulama yolu olarak sunar, ancak kullanılabiliyorsa artık Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.

## Anthropic Claude CLI geçişi

OpenClaw, Anthropic Claude CLI yeniden kullanımını yeniden destekler. Host üzerinde zaten yerel bir
Claude oturumunuz varsa, onboarding/configure bunu doğrudan yeniden kullanabilir.

## OAuth değişimi (giriş nasıl çalışır)

OpenClaw'un etkileşimli giriş akışları `@mariozechner/pi-ai` içinde uygulanır ve wizard/komutlara bağlanır.

### Anthropic setup-token

Akış şekli:

1. OpenClaw içinden Anthropic setup-token veya paste-token başlatın
2. OpenClaw, elde edilen Anthropic kimlik bilgisini bir kimlik doğrulama profiline kaydeder
3. model seçimi `anthropic/...` üzerinde kalır
4. mevcut Anthropic kimlik doğrulama profilleri geri alma/sıra denetimi için kullanılabilir kalır

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth, OpenClaw iş akışları dahil olmak üzere Codex CLI dışındaki kullanımlar için açıkça desteklenir.

Akış şekli (PKCE):

1. PKCE verifier/challenge + rastgele `state` oluşturun
2. `https://auth.openai.com/oauth/authorize?...` adresini açın
3. callback'i `http://127.0.0.1:1455/auth/callback` üzerinde yakalamayı deneyin
4. callback bağlanamazsa (veya uzak/headless durumdaysanız), yönlendirme URL'sini/kodunu yapıştırın
5. değişimi `https://auth.openai.com/oauth/token` adresinde yapın
6. erişim belirtecinden `accountId` değerini çıkarın ve `{ access, refresh, expires, accountId }` biçiminde saklayın

Wizard yolu `openclaw onboard` → kimlik doğrulama seçimi `openai-codex` şeklindedir.

## Yenileme + süre dolumu

Profiller bir `expires` zaman damgası saklar.

Çalışma zamanında:

- `expires` gelecekteyse → depolanan erişim belirtecini kullanın
- süresi dolmuşsa → yenileyin (bir dosya kilidi altında) ve depolanan kimlik bilgilerini üzerine yazın
- istisna: bazı harici CLI kimlik bilgileri haricen yönetilmeye devam eder; OpenClaw
  kopyalanmış refresh token'ları kullanmak yerine bu CLI kimlik doğrulama depolarını yeniden okur.
  Codex CLI bootstrap kasıtlı olarak daha dardır: boş bir
  `openai-codex:default` profilini tohumlar, sonra OpenClaw'un sahip olduğu yenilemeler yerel
  profili kanonik tutar.

Yenileme akışı otomatiktir; genel olarak belirteçleri elle yönetmeniz gerekmez.

## Birden fazla hesap (profiller) + yönlendirme

İki desen vardır:

### 1) Tercih edilen: ayrı ajanlar

“kişisel” ve “iş” hesaplarının asla etkileşmemesini istiyorsanız, izole ajanlar kullanın (ayrı oturumlar + kimlik bilgileri + çalışma alanı):

```bash
openclaw agents add work
openclaw agents add personal
```

Ardından kimlik doğrulamayı ajan başına yapılandırın (wizard) ve sohbetleri doğru ajana yönlendirin.

### 2) Gelişmiş: tek ajan içinde birden fazla profil

`auth-profiles.json`, aynı sağlayıcı için birden fazla profil kimliğini destekler.

Hangi profilin kullanılacağını seçin:

- genel olarak yapılandırma sıralamasıyla (`auth.order`)
- oturum başına `/model ...@<profileId>` ile

Örnek (oturum geçersiz kılması):

- `/model Opus@anthropic:work`

Hangi profil kimliklerinin mevcut olduğunu görmek için:

- `openclaw channels list --json` (`auth[]` gösterir)

İlgili belgeler:

- [Model failover](/tr/concepts/model-failover) (rotasyon + cooldown kuralları)
- [Slash commands](/tr/tools/slash-commands) (komut yüzeyi)

## İlgili

- [Authentication](/tr/gateway/authentication) — model sağlayıcı kimlik doğrulamasına genel bakış
- [Secrets](/tr/gateway/secrets) — kimlik bilgisi depolama ve SecretRef
- [Configuration Reference](/tr/gateway/configuration-reference#auth-storage) — kimlik doğrulama yapılandırma anahtarları
