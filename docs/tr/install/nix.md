---
read_when:
    - Tekrarlanabilir, geri alınabilir kurulumlar istiyorsunuz
    - Zaten Nix/NixOS/Home Manager kullanıyorsunuz
    - Her şeyin sabitlenmiş ve bildirimsel olarak yönetilmesini istiyorsunuz
summary: OpenClaw'ı Nix ile bildirimsel olarak kurun
title: Nix
x-i18n:
    generated_at: "2026-04-25T13:49:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
    source_path: install/nix.md
    workflow: 15
---

OpenClaw'ı bildirimsel olarak **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** ile kurun — piller dâhil bir Home Manager modülü.

<Info>
Nix kurulumu için doğruluk kaynağı [nix-openclaw](https://github.com/openclaw/nix-openclaw) deposudur. Bu sayfa hızlı bir genel bakıştır.
</Info>

## Elde edecekleriniz

- Gateway + macOS uygulaması + araçlar (whisper, spotify, kameralar) -- hepsi sabitlenmiş
- Yeniden başlatmalardan sonra da ayakta kalan Launchd hizmeti
- Bildirimsel config ile Plugin sistemi
- Anında geri alma: `home-manager switch --rollback`

## Hızlı başlangıç

<Steps>
  <Step title="Determinate Nix kurun">
    Nix henüz kurulu değilse [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer) talimatlarını izleyin.
  </Step>
  <Step title="Yerel bir flake oluşturun">
    nix-openclaw deposundaki aracı öncelikli şablonu kullanın:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Secret'ları yapılandırın">
    Mesajlaşma bot token'ınızı ve model sağlayıcısı API anahtarınızı ayarlayın. `~/.secrets/` altındaki düz dosyalar gayet iyi çalışır.
  </Step>
  <Step title="Şablon yer tutucularını doldurun ve geçiş yapın">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Doğrulayın">
    launchd hizmetinin çalıştığını ve botunuzun mesajlara yanıt verdiğini doğrulayın.
  </Step>
</Steps>

Tüm modül seçenekleri ve örnekler için [nix-openclaw README](https://github.com/openclaw/nix-openclaw) sayfasına bakın.

## Nix modu çalışma zamanı davranışı

`OPENCLAW_NIX_MODE=1` ayarlandığında (nix-openclaw ile otomatik olarak), OpenClaw otomatik kurulum akışlarını devre dışı bırakan deterministik bir moda girer.

Bunu manuel olarak da ayarlayabilirsiniz:

```bash
export OPENCLAW_NIX_MODE=1
```

macOS'ta GUI uygulaması kabuk ortam değişkenlerini otomatik olarak devralmaz. Bunun yerine varsayılanlar üzerinden Nix modunu etkinleştirin:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix modunda ne değişir

- Otomatik kurulum ve kendi kendini değiştirme akışları devre dışı bırakılır
- Eksik bağımlılıklar Nix'e özgü çözüm mesajlarıyla gösterilir
- UI salt okunur bir Nix modu bandı gösterir

### Config ve durum yolları

OpenClaw JSON5 config'i `OPENCLAW_CONFIG_PATH` üzerinden okur ve değiştirilebilir verileri `OPENCLAW_STATE_DIR` içinde saklar. Nix altında çalışırken, çalışma zamanı durumu ve config'in değiştirilemez store dışında kalması için bunları Nix tarafından yönetilen konumlara açıkça ayarlayın.

| Değişken              | Varsayılan                              |
| --------------------- | --------------------------------------- |
| `OPENCLAW_HOME`       | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`  | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH`| `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Hizmet PATH keşfi

launchd/systemd gateway hizmeti Nix profil binary'lerini otomatik keşfeder; böylece
`nix` ile kurulmuş yürütülebilir dosyalara kabuk açan Plugin'ler ve araçlar
manuel PATH ayarı olmadan çalışır:

- `NIX_PROFILES` ayarlıysa, hizmet PATH'ine her giriş
  sağdan sola öncelik sırasıyla eklenir (Nix kabuğu önceliğiyle eşleşir — en sağdaki kazanır).
- `NIX_PROFILES` ayarlı değilse, geri dönüş olarak `~/.nix-profile/bin` eklenir.

Bu hem macOS launchd hem Linux systemd hizmet ortamları için geçerlidir.

## İlgili

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- tam kurulum rehberi
- [Wizard](/tr/start/wizard) -- Nix dışı CLI kurulumu
- [Docker](/tr/install/docker) -- container tabanlı kurulum
