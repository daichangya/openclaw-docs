---
read_when:
    - Aracı çalışma alanını veya dosya düzenini açıklamanız gerekiyor
    - Bir aracı çalışma alanını yedeklemek veya taşımak istiyorsunuz
summary: 'Aracı çalışma alanı: konum, düzen ve yedekleme stratejisi'
title: Aracı çalışma alanı
x-i18n:
    generated_at: "2026-04-25T13:44:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51f9531dbd0f7d0c297f448a5e37f413bae48d75068f15ac88b6fdf7f153c974
    source_path: concepts/agent-workspace.md
    workflow: 15
---

Çalışma alanı aracının evidir. Dosya araçları ve çalışma alanı bağlamı için kullanılan
tek çalışma dizinidir. Özel tutun ve bellek gibi davranın.

Bu, config, kimlik bilgileri ve
oturumları depolayan `~/.openclaw/` dizininden ayrıdır.

**Önemli:** çalışma alanı, katı bir sandbox değil, **varsayılan cwd**'dir. Araçlar
göreli yolları çalışma alanına göre çözümler, ancak sandboxing etkin değilse mutlak yollar
yine de ana makinede başka yerlere erişebilir. Yalıtım gerekiyorsa
[`agents.defaults.sandbox`](/tr/gateway/sandboxing) (ve/veya aracı başına sandbox yapılandırması)
kullanın. Sandboxing etkinse ve `workspaceAccess` `"rw"` değilse, araçlar
ana makine çalışma alanınızda değil, `~/.openclaw/sandboxes` altındaki bir sandbox çalışma alanında
çalışır.

## Varsayılan konum

- Varsayılan: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE` ayarlıysa ve `"default"` değilse, varsayılan
  `~/.openclaw/workspace-<profile>` olur.
- `~/.openclaw/openclaw.json` içinde geçersiz kılın:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` veya `openclaw setup`,
çalışma alanını oluşturur ve eksikse bootstrap dosyalarını yerleştirir.
Sandbox tohum kopyaları yalnızca çalışma alanı içindeki normal dosyaları kabul eder; kaynak çalışma alanı dışına çözümlenen symlink/hardlink
takma adları yok sayılır.

Çalışma alanı dosyalarını zaten kendiniz yönetiyorsanız, bootstrap
dosyası oluşturmayı devre dışı bırakabilirsiniz:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Ek çalışma alanı klasörleri

Eski kurulumlar `~/openclaw` oluşturmuş olabilir. Birden çok çalışma alanı
dizinini etrafta tutmak, aynı anda yalnızca bir çalışma alanı etkin olduğu için
karışık kimlik doğrulama veya durum kaymasına neden olabilir.

**Öneri:** tek bir etkin çalışma alanı tutun. Ek
klasörleri artık kullanmıyorsanız arşivleyin veya Çöp'e taşıyın (örneğin `trash ~/openclaw`).
Bilerek birden çok çalışma alanı tutuyorsanız,
`agents.defaults.workspace` öğesinin etkin olana işaret ettiğinden emin olun.

`openclaw doctor`, ek çalışma alanı dizinleri algıladığında uyarı verir.

## Çalışma alanı dosya haritası (her dosyanın anlamı)

Bunlar, OpenClaw'ın çalışma alanı içinde beklediği standart dosyalardır:

- `AGENTS.md`
  - Aracı için çalışma talimatları ve belleği nasıl kullanması gerektiği.
  - Her oturumun başında yüklenir.
  - Kurallar, öncelikler ve "nasıl davranmalı" ayrıntıları için iyi bir yerdir.

- `SOUL.md`
  - Persona, ton ve sınırlar.
  - Her oturumda yüklenir.
  - Rehber: [SOUL.md Personality Guide](/tr/concepts/soul)

- `USER.md`
  - Kullanıcının kim olduğu ve ona nasıl hitap edileceği.
  - Her oturumda yüklenir.

- `IDENTITY.md`
  - Aracının adı, havası ve emojisi.
  - Bootstrap ritüeli sırasında oluşturulur/güncellenir.

- `TOOLS.md`
  - Yerel araçlarınız ve kurallarınız hakkında notlar.
  - Araç kullanılabilirliğini denetlemez; yalnızca yol göstericidir.

- `HEARTBEAT.md`
  - Heartbeat çalıştırmaları için isteğe bağlı küçük kontrol listesi.
  - Token tüketimini önlemek için kısa tutun.

- `BOOT.md`
  - Gateway yeniden başlatıldığında otomatik çalışan isteğe bağlı başlangıç kontrol listesi ([dahili kancalar](/tr/automation/hooks) etkin olduğunda).
  - Kısa tutun; giden gönderimler için mesaj aracını kullanın.

- `BOOTSTRAP.md`
  - Tek seferlik ilk çalıştırma ritüeli.
  - Yalnızca yepyeni bir çalışma alanı için oluşturulur.
  - Ritüel tamamlandıktan sonra silin.

- `memory/YYYY-MM-DD.md`
  - Günlük bellek günlüğü (günde bir dosya).
  - Oturum başlangıcında bugün + dün dosyalarının okunması önerilir.

- `MEMORY.md` (isteğe bağlı)
  - Düzenlenmiş uzun vadeli bellek.
  - Yalnızca ana, özel oturumda yükleyin (paylaşılan/grup bağlamlarında değil).

İş akışı ve otomatik bellek boşaltma için bkz. [Memory](/tr/concepts/memory).

- `skills/` (isteğe bağlı)
  - Çalışma alanına özgü Skills.
  - O çalışma alanı için en yüksek öncelikli Skills konumu.
  - Adlar çakıştığında proje aracı Skills, kişisel aracı Skills, yönetilen Skills, paketlenmiş Skills ve `skills.load.extraDirs` değerlerini geçersiz kılar.

- `canvas/` (isteğe bağlı)
  - Node ekranları için Canvas UI dosyaları (örneğin `canvas/index.html`).

Herhangi bir bootstrap dosyası eksikse, OpenClaw
oturuma bir "eksik dosya" işaretçisi ekler ve devam eder. Büyük bootstrap dosyaları eklenirken kesilir;
sınırları `agents.defaults.bootstrapMaxChars` (varsayılan: 12000) ve
`agents.defaults.bootstrapTotalMaxChars` (varsayılan: 60000) ile ayarlayın.
`openclaw setup`, mevcut
dosyaların üzerine yazmadan eksik varsayılanları yeniden oluşturabilir.

## Çalışma alanında OLMAYANLAR

Bunlar `~/.openclaw/` altında bulunur ve çalışma alanı deposuna commit edilmemelidir:

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (model kimlik doğrulama profilleri: OAuth + API anahtarları)
- `~/.openclaw/credentials/` (kanal/sağlayıcı durumu artı eski OAuth içe aktarma verileri)
- `~/.openclaw/agents/<agentId>/sessions/` (oturum dökümleri + meta veriler)
- `~/.openclaw/skills/` (yönetilen Skills)

Oturumları veya config'i taşımanız gerekiyorsa, bunları ayrı kopyalayın ve
sürüm kontrolü dışında tutun.

## Git yedeği (önerilir, özel)

Çalışma alanına özel bellek gibi davranın. Yedeklenmiş ve kurtarılabilir olması için
onu **özel** bir git deposuna koyun.

Bu adımları Gateway'in çalıştığı makinede uygulayın (çalışma alanı orada bulunur).

### 1) Depoyu başlatın

git yüklüyse, yepyeni çalışma alanları otomatik olarak başlatılır. Bu
çalışma alanı henüz bir repo değilse şunu çalıştırın:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Özel bir remote ekleyin (başlangıç dostu seçenekler)

Seçenek A: GitHub web arayüzü

1. GitHub üzerinde yeni bir **özel** depo oluşturun.
2. README ile başlatmayın (merge çakışmalarını önler).
3. HTTPS remote URL'sini kopyalayın.
4. Remote'u ekleyin ve push edin:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Seçenek B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Seçenek C: GitLab web arayüzü

1. GitLab üzerinde yeni bir **özel** depo oluşturun.
2. README ile başlatmayın (merge çakışmalarını önler).
3. HTTPS remote URL'sini kopyalayın.
4. Remote'u ekleyin ve push edin:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Devam eden güncellemeler

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## Gizli bilgileri commit etmeyin

Özel bir depoda bile gizli bilgileri çalışma alanında saklamaktan kaçının:

- API anahtarları, OAuth token'ları, parolalar veya özel kimlik bilgileri.
- `~/.openclaw/` altındaki her şey.
- Sohbetlerin ham dökümleri veya hassas ekler.

Hassas başvurular depolamanız gerekiyorsa yer tutucular kullanın ve gerçek
gizli bilgiyi başka bir yerde tutun (parola yöneticisi, ortam değişkenleri veya `~/.openclaw/`).

Önerilen başlangıç `.gitignore` dosyası:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Çalışma alanını yeni bir makineye taşıma

1. Depoyu istenen yola klonlayın (varsayılan `~/.openclaw/workspace`).
2. `~/.openclaw/openclaw.json` içinde `agents.defaults.workspace` öğesini bu yola ayarlayın.
3. Eksik dosyaları yerleştirmek için `openclaw setup --workspace <path>` çalıştırın.
4. Oturumlara ihtiyacınız varsa, `~/.openclaw/agents/<agentId>/sessions/` dizinini
   eski makineden ayrıca kopyalayın.

## Gelişmiş notlar

- Çok aracı yönlendirme, aracı başına farklı çalışma alanları kullanabilir. Yönlendirme yapılandırması için
  [Channel routing](/tr/channels/channel-routing) sayfasına bakın.
- `agents.defaults.sandbox` etkinse, ana olmayan oturumlar
  `agents.defaults.sandbox.workspaceRoot` altındaki oturum başına sandbox çalışma alanlarını kullanabilir.

## İlgili

- [Standing Orders](/tr/automation/standing-orders) — çalışma alanı dosyalarındaki kalıcı talimatlar
- [Heartbeat](/tr/gateway/heartbeat) — `HEARTBEAT.md` çalışma alanı dosyası
- [Session](/tr/concepts/session) — oturum depolama yolları
- [Sandboxing](/tr/gateway/sandboxing) — sandbox ortamlarında çalışma alanı erişimi
