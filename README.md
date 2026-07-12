# Magic Prompt — Türkcə Prompt Generator

Qısa istəyi (məs. "email yazmaq istəyirəm") optimizə edilmiş, yerli konteksə uyğun
bir promota çevirən sadə alət. **Pulsuz OpenRouter modelləri** ilə işləyir, ödənişli
Anthropic API açarına ehtiyac yoxdur.

## Struktur

```
magic-prompt/
├── index.html          ← ön interfeys (statik, Vercel avtomatik serve edir)
├── api/
│   └── generate.js     ← serverless function, OpenRouter-ə sorğu göndərir
├── package.json
├── vercel.json
└── .env.example
```

## 1. Lokal quraşdırma

```bash
cd magic-prompt
npm install -g vercel      # bir dəfə qurulur
```

## 2. OpenRouter API açarı al (PULSUZ)

1. https://openrouter.ai ünvanına get, e-poçtla qeydiyyatdan keç (kredit kartı **lazım deyil**)
2. Dashboard → **Keys** → **Create Key**
3. Açarı kopyala

## 3. .env faylı yarat

```bash
cp .env.example .env
```

`.env` faylını aç və `OPENROUTER_API_KEY` sahəsinə açarını yapışdır.

**Ehtiyat model (tövsiyə olunur):** OpenRouter-in gündəlik 50 sorğu limiti tez dolur.
İstəsən, `GEMINI_API_KEY` sahəsinə Google Gemini açarını da (pulsuz,
https://aistudio.google.com/app/apikey) yapışdır — OpenRouter limiti dolanda sayt
avtomatik Gemini-yə keçəcək, tamam fərqli, öz limiti olan bir xidmət olduğu üçün.
Bu sahəni boş buraxsan da sayt normal işləyir, sadəcə fallback olmayacaq.

`OPENROUTER_MODEL` sahəsini olduğu kimi saxlaya bilərsən (`meta-llama/llama-3.3-70b-instruct:free`
— sabit, etibarlı bir model), və ya konkret başqa bir pulsuz model seçə bilərsən.
Pulsuz modellərin siyahısı tez-tez dəyişir, güncəl siyahı üçün:
https://openrouter.ai/models?max_price=0

> ⚠️ Qeyd: pulsuz modellərin sürəti/keyfiyyəti tarixə görə dəyişə bilər, adətən limit
> dəqiqədə ~20, gündə ~50 sorğudur (kredit yükləməmisənsə). Prototip və şəxsi istifadə
> üçün kifayət qədərdir.

## 4. Lokal test

```bash
vercel dev
```

Sonra brauzerdə `http://localhost:3000` aç, bir kateqoriya seç, istəyini yaz, "Prompt
Yarat" düyməsinə bas.

## 5. Vercel-ə deploy

```bash
vercel
```

Sual verdikdə default seçimləri qəbul et. Deploy bitdikdə env dəyişənini production-a
əlavə et:

```bash
vercel env add OPENROUTER_API_KEY
```

(Açarı yapışdır, "Production" mühitini seç.) Sonra:

```bash
vercel --prod
```

Bununla pulsuz, ictimai bir link alacaqsan (`https://magic-prompt-xxx.vercel.app`).

## 6. Sənəd əlavəsi (PDF / Word / Excel / şəkil)

Formada indi "Sənəd əlavə et" düyməsi var. İstifadəçi bir fayl seçdikdə:

- **PDF** (`.pdf`) — mətn çıxarılır (ilk 20 səhifə)
- **Word** (`.docx`, `.doc`) — mətn çıxarılır
- **Excel/CSV** (`.xlsx`, `.xls`, `.csv`) — cədvəl mətnə çevrilir
- **Sadə mətn** (`.txt`) — birbaşa oxunur
- **Şəkil** (`.jpg`, `.png`, `.webp`) — hazırkı pulsuz model (Llama 3.3 70B) mətn-yönümlüdür,
  şəkli "görə" bilmir. Fayl adı istinad kimi qeyd olunur, amma şəklin məzmunu prompta
  daxil edilmir.

Çıxarılan mətn avtomatik olaraq prompt sorğusuna əlavə olunur ki, yaradılan prompt
sənədin məzmununa uyğun (rəqəmlər, adlar və s.) olsun. Bütün fayl oxuma əməliyyatı
**brauzerdə** (client-side) baş verir — fayl heç vaxt sənin serverinə tam yüklənmir,
yalnız çıxarılan mətn (maks. 6000 simvol) API-yə göndərilir.

> 💡 **Şəkil məzmununu da oxutmaq istəsən:** OpenRouter-də bəzi pulsuz modellər (məs.
> `qwen/qwen2.5-vl-72b-instruct:free`) şəkilləri anlaya bilir ("vision" modelləri).
> Bunu istəsən, deyin — `generate.js`-i bu modellərdən biri ilə işləməsi üçün
> yeniləyə bilərəm (şəkil olduqda avtomatik vision modelinə keçid).

## 7. Media qalereyası əlavə etmək

Header ilə forma arasında avtomatik media qalereyası var — **şəkil, GIF və ya video**
ola bilər, 1-4 ədəd arası.

Bunu etmək üçün `magic-prompt` kök qovluğunda `media` adlı bir qovluq yarat, içinə
fayllarını bu adlarla qoy:

```
media/
├── hero-1.jpg     (və ya .png, .webp, .gif, .mp4, .webm)
├── hero-2.mp4
├── hero-3.png
└── hero-4.gif
```

- Fayl adı mütləq `hero-1`, `hero-2`, `hero-3`, `hero-4` olmalıdır (uzantı önəmli deyil)
- Neçə fayl qoysan, qalereya avtomatik o qədər sütuna bölünür (1, 2, 3 və ya 4)
- Video fayllar avtomatik səssiz, dövrədə (loop) oynadılır
- Heç bir fayl yoxdursa, qalereya sahəsi tamamilə gizlənir, sayt normal görünür
- Bütün adları eyni saxlamaqla istənilən vaxt fayllarını dəyişə bilərsən (məs.
  `hero-1.jpg`-i silib `hero-1.mp4` qoysan, avtomatik video kimi göstərilir)

## 8. Kateqoriyaları genişləndirmək

`api/generate.js` faylındakı `CATEGORY_GUIDES` obyektinə yeni açar əlavə et, sonra
`index.html`-dəki `.categories` bölməsinə uyğun düymə əlavə et. Məsələn "iş elanı",
"sosial media postu", "CV" kimi yeni kateqoriyalar asanlıqla əlavə oluna bilər.

## 9. Gələcək üçün fikirlər

- Nəticələri Supabase-də saxlayıb istifadəçi tarixçəsi göstərmək
- Anonim istifadə limiti (məs. IP başına gündə 10 sorğu) əlavə etmək
- Pulsuz model limitinə çatanda avtomatik başqa pulsuz modelə keçid (fallback) əlavə etmək
- SaaS kimi satmaq istəsən: Stripe ilə ödənişli plan (limitsiz sorğu + GPT-4/Claude
  keyfiyyətində model seçimi) əlavə edə bilərsən
