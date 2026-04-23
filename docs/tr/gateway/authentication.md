---
read_when:
    - Model kimlik doğrulamasında veya OAuth süresinin dolmasında hata ayıklama
    - Kimlik doğrulamasını veya kimlik bilgisi depolamayı belgeleme
summary: 'Model kimlik doğrulaması: OAuth, API anahtarları, Claude CLI yeniden kullanımı ve Anthropic kurulum jetonu'
title: Kimlik doğrulama
x-i18n:
    generated_at: "2026-04-23T14:56:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a7c20872b915d1d079f0578c933e43cbdb97eca1c60d8c4e6e5137ca83f8b2
    source_path: gateway/authentication.md
    workflow: 15
---

# Kimlik Doğrulama (Model Sağlayıcıları)

<Note>
Bu sayfa **model sağlayıcısı** kimlik doğrulamasını kapsar (API anahtarları, OAuth, Claude CLI yeniden kullanımı ve Anthropic kurulum jetonu). **Gateway bağlantısı** kimlik doğrulaması için (jeton, parola, trusted-proxy), [Configuration](/tr/gateway/configuration) ve [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth) sayfalarına bakın.
</Note>

OpenClaw, model sağlayıcıları için OAuth ve API anahtarlarını destekler. Her zaman açık Gateway ana bilgisayarları için API anahtarları genellikle en öngörülebilir seçenektir. Sağlayıcı hesap modelinizle eşleştiğinde abonelik/OAuth akışları da desteklenir.

Tam OAuth akışı ve depolama düzeni için [/concepts/oauth](/tr/concepts/oauth) sayfasına bakın.
SecretRef tabanlı kimlik doğrulama için (`env`/`file`/`exec` sağlayıcıları), [Secrets Management](/tr/gateway/secrets) sayfasına bakın.
`models status --probe` tarafından kullanılan kimlik bilgisi uygunluğu/neden kodu kuralları için bkz.
[Auth Credential Semantics](/tr/auth-credential-semantics).

## Önerilen kurulum (API anahtarı, herhangi bir sağlayıcı)

Uzun ömürlü bir Gateway çalıştırıyorsanız, seçtiğiniz sağlayıcı için bir API anahtarıyla başlayın.
Özellikle Anthropic için, API anahtarı kimlik doğrulaması hâlâ en öngörülebilir sunucu kurulumudur, ancak OpenClaw yerel bir Claude CLI oturumunun yeniden kullanılmasını da destekler.

1. Sağlayıcı konsolunuzda bir API anahtarı oluşturun.
2. Bunu **Gateway ana bilgisayarına** koyun (`openclaw gateway` çalıştıran makine).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway systemd/launchd altında çalışıyorsa, daemon'ın okuyabilmesi için anahtarı `~/.openclaw/.env` içine koymayı tercih edin:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Ardından daemon'ı yeniden başlatın (veya Gateway sürecinizi yeniden başlatın) ve tekrar kontrol edin:

```bash
openclaw models status
openclaw doctor
```

Ortam değişkenlerini kendiniz yönetmek istemiyorsanız, onboarding API anahtarlarını daemon kullanımı için depolayabilir: `openclaw onboard`.

`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd içindeki ortam devralma ayrıntıları için [Help](/tr/help) sayfasına bakın.

## Anthropic: Claude CLI ve jeton uyumluluğu

Anthropic kurulum-jetonu kimlik doğrulaması, OpenClaw içinde desteklenen bir jeton yolu olarak hâlâ kullanılabilir. Anthropic çalışanları o zamandan beri bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi, bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için onaylanmış kabul eder. Claude CLI yeniden kullanımı ana bilgisayarda mevcutsa, artık tercih edilen yol budur.

Uzun ömürlü Gateway ana bilgisayarları için Anthropic API anahtarı hâlâ en öngörülebilir kurulumdur. Aynı ana bilgisayarda mevcut bir Claude oturumunu yeniden kullanmak istiyorsanız, onboarding/configure içinde Anthropic Claude CLI yolunu kullanın.

Claude CLI yeniden kullanımı için önerilen ana bilgisayar kurulumu:

```bash
# Gateway ana bilgisayarında çalıştırın
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Bu iki adımlı bir kurulumdur:

1. Claude Code'u Gateway ana bilgisayarında Anthropic'e giriş yapmış duruma getirin.
2. OpenClaw'a Anthropic model seçimini yerel `claude-cli` arka ucuna geçirmesini ve eşleşen OpenClaw kimlik doğrulama profilini depolamasını söyleyin.

`claude`, `PATH` üzerinde değilse önce Claude Code'u yükleyin veya `agents.defaults.cliBackends.claude-cli.command` değerini gerçek ikili dosya yoluna ayarlayın.

El ile jeton girişi (herhangi bir sağlayıcı; `auth-profiles.json` dosyasını yazar + yapılandırmayı günceller):

```bash
openclaw models auth paste-token --provider openrouter
```

Kimlik doğrulama profil başvuruları statik kimlik bilgileri için de desteklenir:

- `api_key` kimlik bilgileri `keyRef: { source, provider, id }` kullanabilir
- `token` kimlik bilgileri `tokenRef: { source, provider, id }` kullanabilir
- OAuth modundaki profiller SecretRef kimlik bilgilerini desteklemez; `auth.profiles.<id>.mode` `"oauth"` olarak ayarlanmışsa, bu profil için SecretRef destekli `keyRef`/`tokenRef` girişi reddedilir.

Otomasyon dostu kontrol (eksik/süresi dolmuşsa çıkış `1`, süresi dolmak üzereyse `2`):

```bash
openclaw models status --check
```

Canlı kimlik doğrulama yoklamaları:

```bash
openclaw models status --probe
```

Notlar:

- Yoklama satırları kimlik doğrulama profillerinden, ortam kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
- Açık `auth.order.<provider>`, depolanmış bir profili içermezse, yoklama o profili denemek yerine bu profil için `excluded_by_auth_order` bildirir.
- Kimlik doğrulama mevcutsa ancak OpenClaw bu sağlayıcı için yoklanabilir bir model adayı çözemiyorsa, yoklama `status: no_model` bildirir.
- Hız sınırı bekleme süreleri model kapsamlı olabilir. Bir model için bekleme süresinde olan bir profil, aynı sağlayıcıdaki kardeş bir model için yine de kullanılabilir olabilir.

İsteğe bağlı işlem betikleri (systemd/Termux) burada belgelenmiştir:
[Kimlik doğrulama izleme betikleri](/tr/help/scripts#auth-monitoring-scripts)

## Anthropic notu

Anthropic `claude-cli` arka ucu yeniden desteklenmektedir.

- Anthropic çalışanları bize bu OpenClaw entegrasyon yoluna yeniden izin verildiğini söyledi.
- Bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece Claude CLI yeniden kullanımını ve `claude -p` kullanımını Anthropic destekli çalıştırmalar için onaylanmış kabul eder.
- Anthropic API anahtarları, uzun ömürlü Gateway ana bilgisayarları ve açık sunucu tarafı faturalandırma kontrolü için en öngörülebilir seçenek olmaya devam eder.

## Model kimlik doğrulama durumunu kontrol etme

```bash
openclaw models status
openclaw doctor
```

## API anahtarı döndürme davranışı (Gateway)

Bazı sağlayıcılar, bir API çağrısı sağlayıcı hız sınırına takıldığında isteği alternatif anahtarlarla yeniden denemeyi destekler.

- Öncelik sırası:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek geçersiz kılma)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google sağlayıcıları ek bir geri dönüş olarak `GOOGLE_API_KEY` değerini de içerir.
- Aynı anahtar listesi kullanılmadan önce tekilleştirilir.
- OpenClaw yalnızca hız sınırı hataları için bir sonraki anahtarla yeniden dener (örneğin `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached` veya `workers_ai ... quota limit exceeded`).
- Hız sınırı dışındaki hatalarda alternatif anahtarlarla yeniden deneme yapılmaz.
- Tüm anahtarlar başarısız olursa, son denemeden gelen son hata döndürülür.

## Hangi kimlik bilgisinin kullanılacağını kontrol etme

### Oturum başına (sohbet komutu)

Geçerli oturum için belirli bir sağlayıcı kimlik bilgisini sabitlemek üzere `/model <alias-or-id>@<profileId>` kullanın (örnek profil kimlikleri: `anthropic:default`, `anthropic:work`).

Kompakt bir seçici için `/model` (veya `/model list`) kullanın; tam görünüm için `/model status` kullanın (adaylar + sonraki kimlik doğrulama profili ve yapılandırıldığında sağlayıcı uç nokta ayrıntıları).

### Aracı başına (CLI geçersiz kılma)

Bir aracı için açık bir kimlik doğrulama profili sırası geçersiz kılması ayarlayın (o aracının `auth-state.json` dosyasında depolanır):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Belirli bir aracı hedeflemek için `--agent <id>` kullanın; yapılandırılmış varsayılan aracı kullanmak için bunu atlayın.
Sıra sorunlarında hata ayıklarken, `openclaw models status --probe` atlanan depolanmış profilleri sessizce geçmek yerine `excluded_by_auth_order` olarak gösterir.
Bekleme süresi sorunlarında hata ayıklarken, hız sınırı bekleme sürelerinin tüm sağlayıcı profili yerine tek bir model kimliğine bağlı olabileceğini unutmayın.

## Sorun giderme

### "Kimlik bilgisi bulunamadı"

Anthropic profili eksikse, **Gateway ana bilgisayarında** bir Anthropic API anahtarı yapılandırın veya Anthropic kurulum-jetonu yolunu kurun, ardından tekrar kontrol edin:

```bash
openclaw models status
```

### Jetonun süresi doluyor/dolmuş

Hangi profilin süresinin dolmak üzere olduğunu doğrulamak için `openclaw models status` çalıştırın. Bir Anthropic jeton profili eksikse veya süresi dolmuşsa, bu kurulumu kurulum-jetonu ile yenileyin veya bir Anthropic API anahtarına geçin.
