/* ============================================================
   main.js — منطق الموقع الرئيسي (index.html)

   الفهرس:
   1) دوال مساعدة صغيرة
   2) الاتصال بـ Supabase
   3) رسم الأقسام الثابتة (مهارات / خدمات / رحلتي)
   4) المشاريع: الكارت + نافذة التفاصيل
   5) الـ Navbar وأنيميشن الظهور
   6) دخول الأدمن (زرار ⚙ + الضغط 5 مرات على الاسم)
   7) تطبيق إعدادات الموقع (الاسم، الصورة، التواصل...)
   8) فورم التواصل
   9) التحميل الأولي للبيانات
   ============================================================ */

/* ---------- 1) دوال مساعدة ---------- */

/* اختصار لـ document.getElementById */
const $ = id => document.getElementById(id);

/* بيحوّل الرموز الخطرة (< > & " ') لنص آمن قبل ما نحطه في HTML — ده بيمنع حقن الأكواد */
const esc = s => String(s || "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

/* بيقبل الروابط اللي بتبدأ بـ http/https بس (وبيرجّعها آمنة)، أي حاجة تانية بترجع نص فاضي */
const safeUrl = u => /^https?:\/\//.test(u || "") ? esc(u) : "";

/* "a, b, c"  ←  ["a","b","c"]  (نص مفصول بفواصل إلى قائمة) */
const toList = s => String(s || "").split(",").map(t => t.trim()).filter(Boolean);

/* نص متعدد الأسطر ← قائمة أسطر بدون الأسطر الفاضية */
const toLines = s => String(s || "").split("\n").map(t => t.trim()).filter(Boolean);

/* قائمة نصوص ← عناصر <li> جاهزة */
const listItems = arr => arr.map(t => `<li>${esc(t)}</li>`).join("");

/* ---------- 2) الاتصال بـ Supabase ---------- */

/* عميل واحد مشترك لكل الصفحة (عشان جلسة تسجيل الدخول تفضل شغالة).
   لو الإعدادات ناقصة أو حصل خطأ، بيفضل null والموقع يشتغل بالبيانات الافتراضية */
let sb = null;
try {
  if (window.CFG && /^https?:/.test(CFG.SUPABASE_URL)) {
    sb = supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
  }
} catch (e) { /* نتجاهل الخطأ — الموقع يكمل بدون قاعدة بيانات */ }

/* ---------- 3) رسم الأقسام الثابتة (المحتوى في js/content.js) ---------- */

/* المهارات: مجموعات، كل مجموعة فيها كروت */
function renderSkills() {
  $("sk").innerHTML = SKILLS.map(([group, items]) => `
    <div class="sg rv">
      <h3>${group}</h3>
      <div class="sk">${items.map(([name, desc, icon, level]) => `
        <div class="glass card">
          <div class="top"><span class="ic">${icon}</span><h4>${name}</h4></div>
          <p>${desc}</p>
          ${SHOW_SKILL_LEVELS ? `<div class="bar" role="img" aria-label="${name} proficiency ${level} percent"><i style="--v:${level}%"></i></div>` : ""}
        </div>`).join("")}
      </div>
    </div>`).join("");
}

/* كروت بسيطة (عنوان + وصف).
   numbered = true  ← بيعرض رقم 01 02 03 (الخدمات)
   numbered = false ← بيعرض أول حرف من العنوان في أيقونة (ليه تختارني) */
function renderCards(containerId, items, numbered) {
  $(containerId).innerHTML = items.map(([title, desc], i) => `
    <div class="glass card rv">
      ${numbered ? `<span class="num">0${i + 1}</span>` : `<span class="ic">${title[0]}</span>`}
      <h3>${title}</h3>
      <p>${desc}</p>
    </div>`).join("");
}

/* رحلتي: Timeline */
function renderTimeline() {
  $("tl").innerHTML = TIMELINE.map(([year, title, desc]) => `
    <div class="glass ti rv"><b>${year}</b><h3>${title}</h3><p>${desc}</p></div>`).join("");
}

/* ---------- 4) المشاريع ---------- */

/* قائمة المشاريع الحالية (بتتملي في loadSiteData) */
let projects = [];

/* لو المشروع ليه رابط مباشر (وهو مش ديسكتوب) بنجيب له سكرين شوت تلقائي من خدمة thum.io */
const autoScreenshot = (p, width) =>
  safeUrl(p.live_url) && !p.is_desktop
    ? "https://image.thum.io/get/width/" + width + "/" + safeUrl(p.live_url)
    : "";

/* صورة الكارت: صورة الكارت ← صورة الديسكتوب ← سكرين شوت تلقائي */
const coverImage = p => safeUrl(p.image_url) || safeUrl(p.desktop_image_url) || autoScreenshot(p, 900);

/* صورة الديسكتوب في نافذة التفاصيل: بنفس منطق الترتيب */
const desktopImage = p => safeUrl(p.desktop_image_url) || safeUrl(p.image_url) || autoScreenshot(p, 1200);

/* كارت مشروع واحد في الشبكة (i = ترتيبه في القائمة) */
function projectCard(p, i) {
  const cover = coverImage(p);
  const live = safeUrl(p.live_url);
  const code = safeUrl(p.code_url);

  /* لو مفيش صورة بنعرض اسم المشروع (أو "Desktop application") بدالها */
  const shot = cover
    ? `<div class="shot"><img loading="lazy" alt="Screenshot of ${esc(p.title)}" src="${cover}" onerror="this.remove()"></div>`
    : `<div class="shot no">${p.is_desktop ? "Desktop application" : esc(p.title)}</div>`;

  /* التاجات: بنفضّل التقنيات (tech) وبعدين التاجات العادية (tags)، وأقصى حد 6 */
  const tags = toList(p.tech).length ? toList(p.tech) : toList(p.tags);

  return `
    <article class="glass pc rv" data-i="${i}">
      ${shot}
      <div class="pb">
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description)}</p>
        <ul class="tg">${listItems(tags.slice(0, 6))}</ul>
        <div class="acts">
          ${live ? `<a class="btn p s" href="${live}" target="_blank" rel="noopener">${esc(p.live_label || "Live Demo")}</a>` : ""}
          ${code ? `<a class="btn s" href="${code}" target="_blank" rel="noopener">View Code</a>` : ""}
          <button class="btn s more" data-i="${i}">Details</button>
        </div>
      </div>
    </article>`;
}

/* ألوان شريط اللغات في نافذة التفاصيل */
const LANG_COLORS = ["#22d3ee", "#f5c26b", "#7aa2ff", "#ff8fa3", "#b79cff", "#8bd17c"];

/* معرض الصور (ديسكتوب + موبايل) داخل نافذة التفاصيل */
function galleryHtml(p) {
  const desktop = desktopImage(p);
  const mobile = safeUrl(p.mobile_image_url);
  if (!desktop && !mobile) return "";

  const desktopBlock = desktop
    ? `<div><div class="bf"><img src="${desktop}" alt="${esc(p.title)} on desktop" onerror="this.closest('.gal').remove()"></div><p class="cap">Desktop</p></div>`
    : "";
  const mobileBlock = mobile
    ? `<div><div class="ph"><img src="${mobile}" alt="${esc(p.title)} on mobile"></div><p class="cap">Mobile</p></div>`
    : "";

  return `<div class="gal ${desktop && mobile ? "both" : ""}">${desktopBlock}${mobileBlock}</div>`;
}

/* مربع المواصفات (Type / Hosting / Client / Year) — بيعرض بس اللي ليه قيمة */
function specsHtml(p) {
  const rows = [
    ["Type", p.is_desktop ? "Desktop application" : "Website"],
    ["Hosting", p.hosting],
    ["Client", p.client],
    ["Year", p.year]
  ].filter(row => row[1])
   .map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`)
   .join("");
  return `<dl class="specs">${rows}</dl>`;
}

/* شريط اللغات: الصيغة في قاعدة البيانات "JavaScript:60, CSS:30, HTML:10" */
function languagesHtml(p) {
  const langs = toList(p.languages)
    .map(x => x.split(":"))
    .map(([name, percent]) => [name.trim(), parseFloat(percent) || 0])
    .filter(([name]) => name);
  if (!langs.length) return "";

  const bar = langs.map(([, percent], i) =>
    `<span style="flex:${percent || 1};background:${LANG_COLORS[i % 6]}"></span>`).join("");
  const legend = langs.map(([name, percent], i) =>
    `<li><i style="background:${LANG_COLORS[i % 6]}"></i>${esc(name)}${percent ? " " + percent + "%" : ""}</li>`).join("");

  return `<h4>Languages used</h4><div class="lbar">${bar}</div><ul class="lleg">${legend}</ul>`;
}

/* بيفتح نافذة التفاصيل للمشروع رقم i */
function openProject(i) {
  const p = projects[i];
  const live = safeUrl(p.live_url);
  const code = safeUrl(p.code_url);
  const features = toLines(p.features);
  const tech = toList(p.tech);
  const paragraphs = toLines(p.long_description || p.description).map(t => `<p>${esc(t)}</p>`).join("");

  $("db").innerHTML = `
    <h2 id="dt">${esc(p.title)}</h2>
    ${specsHtml(p)}
    ${galleryHtml(p)}
    ${paragraphs}
    ${features.length ? `<h4>Features</h4><ul class="f">${listItems(features)}</ul>` : ""}
    ${languagesHtml(p)}
    ${tech.length ? `<h4>Built with</h4><ul class="tg">${listItems(tech)}</ul>` : ""}
    <div class="acts" style="margin-top:24px">
      ${live ? `<a class="btn p" href="${live}" target="_blank" rel="noopener">${esc(p.live_label || "Live Demo")}</a>` : ""}
      ${code ? `<a class="btn" href="${code}" target="_blank" rel="noopener">View Code</a>` : ""}
    </div>`;

  $("dlg").showModal();
  /* بنحط id المشروع في اللينك (#p=...) عشان تقدر تبعت لينك مباشر للمشروع */
  if (p.id) history.replaceState(null, "", "#p=" + p.id);
}

/* ضغطة على أي كارت (غير الروابط) بتفتح التفاصيل */
$("list").onclick = e => {
  if (e.target.closest("a")) return;
  const card = e.target.closest(".pc");
  if (card) openProject(+card.dataset.i);
};

/* قفل النافذة: بزرار Close أو بالضغط برّه النافذة، وبيشيل #p= من اللينك */
$("dx").onclick = () => $("dlg").close();
$("dlg").onclose = () => history.replaceState(null, "", location.pathname + location.search);
$("dlg").onclick = e => { if (e.target === $("dlg")) $("dlg").close(); };

/* ---------- 5) الـ Navbar وأنيميشن الظهور ---------- */

const nav = $("nav"), menu = $("mn"), burger = $("bg");

/* لما تنزل بالصفحة أكتر من 20px الـ navbar بياخد خلفية زجاجية (class "sc") */
const updateNavBackground = () => nav.classList.toggle("sc", scrollY > 20);
updateNavBackground();
addEventListener("scroll", updateNavBackground, { passive: true });

/* فتح/قفل منيو الموبايل */
burger.onclick = () => {
  const isOpen = menu.classList.toggle("open");
  burger.setAttribute("aria-expanded", isOpen);
};
/* قفل المنيو بعد الضغط على أي رابط فيه */
menu.onclick = e => {
  if (e.target.closest("a")) {
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }
};

/* أنيميشن الظهور: أي عنصر عليه .rv بياخد .in لما يظهر في الشاشة.
   لو المتصفح قديم ومفيهوش IntersectionObserver بنظهر العناصر على طول */
const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: .12 })
  : null;

/* بتراقب كل العناصر .rv الجديدة (بنندهها تاني بعد ما نرسم المشاريع) */
const watchReveal = () => document.querySelectorAll(".rv:not(.in)").forEach(el =>
  revealObserver ? revealObserver.observe(el) : el.classList.add("in"));

/* ---------- 6) دخول الأدمن (ليك إنت بس) ---------- */

/* زرار ⚙ بيظهر بس لو في جلسة تسجيل دخول شغالة.
   (ده تسهيل فقط — الحماية الفعلية هي تسجيل الدخول وسياسات RLS في Supabase) */
if (sb) {
  sb.auth.getSession()
    .then(({ data }) => { if (data && data.session) $("adm").hidden = false; })
    .catch(() => {});
}

/* الطريقة السرية: اضغط 5 مرات بسرعة (خلال ~2 ثانية) على اسمك وهيفتح صفحة اللوجين.
   لتغيير العدد غيّر الرقم 5 تحت، ولتغيير المهلة غيّر 1800 (بالمللي ثانية) */
let brandClicks = 0, brandTimer;
document.querySelectorAll(".brand").forEach(brand => brand.addEventListener("click", () => {
  brandClicks++;
  clearTimeout(brandTimer);
  brandTimer = setTimeout(() => { brandClicks = 0; }, 1800);
  if (brandClicks >= 5) {
    brandClicks = 0;
    location.href = "admin.html";
  }
}));

/* ---------- 7) تطبيق إعدادات الموقع (جدول site_settings) ---------- */

/* بيكمل رابط السوشيال: لو كتبت username بس بيضيف له عنوان الموقع، ولو كتبت رابط كامل بيسيبه */
const socialLink = (value, base) =>
  /^https?:/.test(value) ? value : base + String(value).replace(/^@/, "");

/* s = صف الإعدادات (الاسم، الصورة، الإيميل ...) — بيتعدل من صفحة الأدمن */
function applySettings(s) {
  if (!s) return;

  /* الاسم: بيتغير في كل مكان عليه data-name + عنوان التبويب */
  if (s.name) {
    document.querySelectorAll("[data-name]").forEach(el => el.textContent = s.name);
    document.title = s.name + " | Web Developer";
  }

  /* الوظيفة اللي في الـ Hero (بنشيل النقطة اللي في الآخر لأن الصفحة بتحط نقطة بعدها) */
  if (s.headline) $("role").textContent = s.headline.replace(/\.$/, "");

  /* فقرة About */
  if (s.about) $("aboutp").textContent = s.about;

  /* الصورة الشخصية: بنحمّلها الأول، ولو نجحت بنبدّل بيها "ZE".
     لو الرابط باظ، "ZE" بيفضل ظاهر */
  if (s.avatar_url && /^https?:\/\//.test(s.avatar_url)) {
    const avatar = $("av");
    const img = new Image();
    img.alt = s.name || "Zeyad Ekramy";
    img.onload = () => {
      avatar.textContent = "";
      avatar.appendChild(img);
      avatar.removeAttribute("aria-hidden");
    };
    img.src = s.avatar_url;
  }

  /* الإيميل */
  if (s.email) {
    $("ce").textContent = s.email;
    $("ce").href = "mailto:" + s.email;
  }

  /* واتساب: بنشيل أي رموز ونسيب الأرقام بس لرابط wa.me، وبنظهر السطر */
  if (s.whatsapp) {
    const digits = String(s.whatsapp).replace(/\D/g, "");
    $("cw").textContent = s.whatsapp;
    $("cw").href = "https://wa.me/" + digits;
    $("wt").hidden = $("wd").hidden = false;
  }

  /* السوشيال: بيظهر بس اللي ليه قيمة */
  const socials = [
    ["GitHub", s.github, "https://github.com/"],
    ["LinkedIn", s.linkedin, "https://linkedin.com/in/"],
    ["Facebook", s.facebook, "https://facebook.com/"],
    ["Instagram", s.instagram, "https://instagram.com/"]
  ].filter(item => item[1]);

  $("so").innerHTML = socials.map(([label, value, base]) =>
    `<li><a href="${esc(socialLink(value, base))}" target="_blank" rel="noopener">${label}</a></li>`).join("");
}

/* ---------- 8) فورم التواصل ---------- */

$("cf").onsubmit = async e => {
  e.preventDefault();
  const form = e.target, message = $("fm");
  const val = name => form.elements[name].value.trim();   /* قيمة حقل بالاسم */

  /* حقل المصيدة اتملى = بوت، نتجاهل الإرسال بهدوء */
  if (val("website")) return;

  /* تحقق بسيط: كل الحقول مطلوبة + إيميل صحيح الشكل */
  if (!val("name") || !val("subject") || !val("message") || !/^\S+@\S+\.\S+$/.test(val("email"))) {
    message.textContent = "Please fill every field with a valid email.";
    return;
  }

  $("fb").disabled = true;
  message.textContent = "Sending...";

  try {
    if (!sb) throw new Error("no client");
    /* بنحفظ الرسالة في جدول messages */
    const { error } = await sb.from("messages").insert({
      name: val("name"), email: val("email"), subject: val("subject"), message: val("message")
    });
    if (error) throw error;
    form.reset();
    message.textContent = "Thank you! Your message was sent. I will get back to you soon.";
  } catch (err) {
    message.textContent = "Could not send. Please email me directly instead.";
  }
  $("fb").disabled = false;
};

/* ---------- 9) التحميل الأولي للبيانات ---------- */

async function loadSiteData() {
  let list = DEFAULT_PROJECTS;   /* الافتراضي لو مفيش بيانات */

  if (sb) {
    try {
      /* بنجيب المشاريع والإعدادات في نفس الوقت */
      const [projectsRes, settingsRes] = await Promise.all([
        sb.from("projects").select("*")
          .order("sort_order", { ascending: true })      /* الأصغر أولًا */
          .order("created_at", { ascending: false }),    /* وبعدين الأحدث */
        sb.from("site_settings").select("*").eq("id", 1).maybeSingle()
      ]);
      if (!projectsRes.error && projectsRes.data && projectsRes.data.length) list = projectsRes.data;
      applySettings(settingsRes.data);
    } catch (e) { /* لو حصل خطأ نكمل بالبيانات الافتراضية */ }
  }

  projects = list;
  $("list").innerHTML = list.map(projectCard).join("");
  watchReveal();

  /* لو اللينك فيه #p=ID نفتح المشروع ده على طول */
  const match = location.hash.match(/^#p=(.+)$/);
  if (match) {
    const idx = projects.findIndex(p => String(p.id) === match[1]);
    if (idx > -1) openProject(idx);
  }
}

/* ---------- التشغيل ---------- */
renderSkills();
renderCards("sv", SERVICES, true);
renderCards("wy", WHY_ME, false);
renderTimeline();
watchReveal();
loadSiteData();
