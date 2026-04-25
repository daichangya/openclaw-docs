---
read_when:
    - Model kimlik doğrulamasını veya OAuth süresinin dolmasını ayıklama
    - Kimlik doğrulamayı veya kimlik bilgisi depolamayı belgeleme
summary: 'Model kimlik doğrulaması: OAuth, API anahtarları, Claude CLI yeniden kullanımı ve Anthropic kurulum token''ı'
title: Kimlik doğrulama
x-i18n:
    generated_at: "2026-04-25T13:45:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc8dbd0ccb9b167720a03f9e7486c1498d8d9eb500b8174e2a27ea0523285f70
    source_path: gateway/authentication.md
    workflow: 15
---

<Note>
Bu sayfa **model sağlayıcısı** kimlik doğrulamasını kapsar (API anahtarları, OAuth, Claude CLI yeniden kullanımı ve Anthropic kurulum token'ı). **Gateway bağlantısı** kimlik doğrulaması için (token, parola, trusted-proxy) bkz. [Yapılandırma](/tr/gateway/configuration) ve [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth).
</Note>

OpenClaw, model sağlayıcıları için OAuth ve API anahtarlarını destekler. Her zaman açık gateway
host'ları için API anahtarları genellikle en öngörülebilir seçenektir. Abonelik/OAuth
akışları da sağlayıcı hesap modelinize uyduğunda desteklenir.

Tam OAuth akışı ve depolama düzeni için
[/concepts/oauth](/tr/concepts/oauth) bölümüne bakın.
SecretRef tabanlı kimlik doğrulama için (`env`/`file`/`exec` sağlayıcıları), bkz. [Secrets Management](/tr/gateway/secrets).
`models status --probe` tarafından kullanılan kimlik bilgisi uygunluğu/gerekçe kodu kuralları için
bkz. [Auth Credential Semantics](/tr/auth-credential-semantics).

## Önerilen kurulum (API anahtarı, herhangi bir sağlayıcı)

Uzun ömürlü bir gateway çalıştırıyorsanız, seçtiğiniz
sağlayıcı için bir API anahtarıyla başlayın.
Özellikle Anthropic için API anahtarı kimlik doğrulaması hâlâ en öngörülebilir sunucu
kurulumudur, ancak OpenClaw yerel bir Claude CLI oturum açmasını yeniden kullanmayı da destekler.

1. Sağlayıcı konsolunuzda bir API anahtarı oluşturun.
2. Bunu **gateway host** üzerine koyun (`openclaw gateway` çalıştıran makine).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway systemd/launchd altında çalışıyorsa, anahtarı
   daemon'ın okuyabilmesi için `~/.openclaw/.env` içine koymayı tercih edin:

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

Ortam değişkenlerini kendiniz yönetmek istemiyorsanız, ilk kurulum API
anahtarlarını daemon kullanımı için saklayabilir: `openclaw onboard`.

Ortam devralma ayrıntıları için [Help](/tr/help) bölümüne bakın (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Claude CLI ve token uyumluluğu

Anthropic kurulum token'ı kimlik doğrulaması, OpenClaw içinde desteklenen bir token
yolu olarak hâlâ kullanılabilir. Anthropic çalışanları daha sonra bize OpenClaw tarzı Claude CLI kullanımının
yeniden izinli olduğunu söyledi; bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadıkça
Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için
onaylı kabul eder. Host üzerinde Claude CLI yeniden kullanımı mevcutsa, artık tercih edilen yol budur.

Uzun ömürlü gateway host'ları için Anthropic API anahtarı hâlâ en öngörülebilir
kurulumdur. Aynı host üzerindeki mevcut bir Claude oturumunu yeniden kullanmak istiyorsanız,
ilk kurulum/yapılandırma içinde Anthropic Claude CLI yolunu kullanın.

Claude CLI yeniden kullanımı için önerilen host kurulumu:

```bash
# Gateway host üzerinde çalıştırın
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Bu iki adımlı bir kurulumdur:

1. Claude Code'un kendisini gateway host üzerinde Anthropic'e oturum açtırın.
2. OpenClaw'a Anthropic model seçimini yerel `claude-cli`
   arka ucuna geçirmesini ve eşleşen OpenClaw auth profilini saklamasını söyleyin.

`claude`, `PATH` üzerinde değilse önce Claude Code'u kurun veya
`agents.defaults.cliBackends.claude-cli.command` değerini gerçek ikili dosya yoluna ayarlayın.

Elle token girişi (herhangi bir sağlayıcı; `auth-profiles.json` yazar + yapılandırmayı günceller):

```bash
openclaw models auth paste-token --provider openrouter
```

Kimlik doğrulama profil başvuruları statik kimlik bilgileri için de desteklenir:

- `api_key` kimlik bilgileri `keyRef: { source, provider, id }` kullanabilir
- `token` kimlik bilgileri `tokenRef: { source, provider, id }` kullanabilir
- OAuth modundaki profiller SecretRef kimlik bilgilerini desteklemez; `auth.profiles.<id>.mode` değeri `"oauth"` olarak ayarlanmışsa, o profil için SecretRef destekli `keyRef`/`tokenRef` girişi reddedilir.

Otomasyon dostu kontrol (süresi dolmuş/eksik olduğunda çıkış `1`, süresi dolmak üzereyse `2`):

```bash
openclaw models status --check
```

Canlı kimlik doğrulama sorgulamaları:

```bash
openclaw models status --probe
```

Notlar:

- Sorgulama satırları auth profillerinden, ortam kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
- Açık `auth.order.<provider>` saklanan bir profili dışlıyorsa, sorgulama denemek yerine
  o profil için `excluded_by_auth_order` bildirir.
- Kimlik doğrulama mevcut ancak OpenClaw bu sağlayıcı için sorgulanabilir bir model adayı çözemiyorsa,
  sorgulama `status: no_model` bildirir.
- Hız sınırı soğuma süreleri model kapsamlı olabilir. Bir model için soğuma durumundaki bir profil,
  aynı sağlayıcı üzerindeki kardeş bir model için yine de kullanılabilir olabilir.

İsteğe bağlı operasyon betikleri (systemd/Termux) burada belgelenmiştir:
[Kimlik doğrulama izleme betikleri](/tr/help/scripts#auth-monitoring-scripts)

## Anthropic notu

Anthropic `claude-cli` arka ucu yeniden desteklenmektedir.

- Anthropic çalışanları bize bu OpenClaw entegrasyon yolunun yeniden izinli olduğunu söyledi.
- Bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadıkça
  Anthropic destekli çalıştırmalar için Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylı kabul eder.
- Anthropic API anahtarları, uzun ömürlü gateway
  host'ları ve açık sunucu tarafı faturalama denetimi için en öngörülebilir seçim olmaya devam eder.

## Model kimlik doğrulama durumunu denetleme

```bash
openclaw models status
openclaw doctor
```

## API anahtarı döndürme davranışı (gateway)

Bazı sağlayıcılar, bir API çağrısı
sağlayıcı hız sınırına ulaştığında isteği alternatif anahtarlarla yeniden denemeyi destekler.

- Öncelik sırası:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek geçersiz kılma)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google sağlayıcıları ayrıca ek bir geri dönüş olarak `GOOGLE_API_KEY` içerir.
- Aynı anahtar listesi kullanılmadan önce tekilleştirilir.
- OpenClaw yalnızca hız sınırı hatalarında bir sonraki anahtarla yeniden dener (örneğin
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` veya
  `workers_ai ... quota limit exceeded`).
- Hız sınırı dışındaki hatalar alternatif anahtarlarla yeniden denenmez.
- Tüm anahtarlar başarısız olursa, son denemeden gelen nihai hata döndürülür.

## Hangi kimlik bilgisinin kullanıldığını denetleme

### Oturum başına (sohbet komutu)

Geçerli oturum için belirli bir sağlayıcı kimlik bilgisini sabitlemek amacıyla `/model <alias-or-id>@<profileId>` kullanın (örnek profil kimlikleri: `anthropic:default`, `anthropic:work`).

Kompakt bir seçici için `/model` (veya `/model list`) kullanın; tam görünüm için `/model status` kullanın (adaylar + sonraki auth profili, ayrıca yapılandırıldığında sağlayıcı uç nokta ayrıntıları).

### Ajan başına (CLI geçersiz kılması)

Bir ajan için açık bir auth profil sırası geçersiz kılması ayarlayın (o ajanın `auth-state.json` dosyasında saklanır):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Belirli bir ajanı hedeflemek için `--agent <id>` kullanın; yapılandırılmış varsayılan ajanı kullanmak için bunu boş bırakın.
Sıra sorunlarını ayıklarken, `openclaw models status --probe` sessizce atlamak yerine
atlanmış saklanan profilleri `excluded_by_auth_order` olarak gösterir.
Soğuma süresi sorunlarını ayıklarken, hız sınırı soğuma sürelerinin
tüm sağlayıcı profiline değil, tek bir model kimliğine bağlı olabileceğini unutmayın.

## Sorun giderme

### "No credentials found"

Anthropic profili eksikse,
**gateway host** üzerinde bir Anthropic API anahtarı yapılandırın veya Anthropic kurulum token'ı yolunu ayarlayın, ardından yeniden kontrol edin:

```bash
openclaw models status
```

### Token süresi doluyor/dolmuş

Hangi profilin süresinin dolmak üzere olduğunu doğrulamak için `openclaw models status` çalıştırın. Bir
Anthropic token profili eksikse veya süresi dolmuşsa, bu kurulumu
kurulum token'ı ile yenileyin veya bir Anthropic API anahtarına geçin.

## İlgili

- [Secrets management](/tr/gateway/secrets)
- [Uzak erişim](/tr/gateway/remote)
- [Kimlik doğrulama depolaması](/tr/concepts/oauth)
