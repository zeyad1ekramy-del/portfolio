/* ============================================================
   admin.js — منطق صفحة الأدمن (admin.html)

   الفهرس:
   1) الإعداد والدوال المساعدة
   2) تعريف الحقول (عايز تضيف حقل؟ ضيفه في القوائم هنا)
   3) تسجيل الدخول والخروج
   4) الصورة الشخصية
   5) إعدادات الموقع (site_settings)
   6) المشاريع: عرض / تعديل / حذف / حفظ
   7) رفع صور المشروع ومعاينتها
   8) التعبئة التلقائية من الروابط
   9) الرسائل
   ============================================================ */

/* ---------- 1) الإعداد والدوال المساعدة ---------- */

const $ = id => document.getElementById(id);

/* عميل Supabase (بنفس الإعدادات من config.js) */
const sb = supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

/* بيكتب رسالة في عنصر (الافتراضي: رسالة المشروع #msg) */
const say = (text, id = 'msg') => $(id).textContent = text;

/* "a, b" ← ["a","b"] */
const csvList = s => String(s || '').split(',').map(t => t.trim()).filter(Boolean);

/* اسم الـ bucket اللي بنرفع فيه الصور في Supabase Storage */
const BUCKET = 'project-images';

/* ---------- 2) تعريف الحقول ---------- */
/* الصيغة: [ id الحقل في الصفحة, العنوان, النوع, اسم العمود في قاعدة البيانات ]
   النوع: text / url / number  أو  a + عدد الأسطر (مثلاً 'a6' = textarea بـ 6 أسطر) */

/* حقول المشروع (جدول projects) */
const PROJECT_FIELDS = [
  ['title',    'Title',                                            'text',   'title'],
  ['desc',     'Short description (shown on the card)',            'a2',     'description'],
  ['long',     'Full description (new line = new paragraph)',      'a6',     'long_description'],
  ['features', 'Features (one per line)',                          'a5',     'features'],
  ['tech',     'Tech used (comma separated)',                      'text',   'tech'],
  ['tags',     'Card tags (comma separated)',                      'text',   'tags'],
  ['langs',    'Languages used (e.g. JavaScript:60, CSS:30, HTML:10)', 'text', 'languages'],
  ['hosting',  'Hosting (e.g. Vercel)',                            'text',   'hosting'],
  ['client',   'Client',                                           'text',   'client'],
  ['year',     'Year',                                             'text',   'year'],
  ['live',     'Live site link',                                   'url',    'live_url'],
  ['sort',     'Order (smaller number shows first)',               'number', 'sort_order']
];

/* صور المشروع: [ id, العنوان, اسم العمود, تلميح ] */
const PROJECT_IMAGES = [
  ['cover', 'Card image',         'image_url',         'Shown on the card. If empty, desktop screenshot or an auto screenshot is used.'],
  ['dimg',  'Desktop screenshot', 'desktop_image_url', 'Shown in the details window.'],
  ['mimg',  'Mobile screenshot',  'mobile_image_url',  'Shown in a phone frame. Leave empty to hide it.']
];

/* حقول معلومات الموقع (جدول site_settings) */
const SITE_FIELDS = [
  ['s_name',  'Your name',                                           'text', 'name'],
  ['s_head',  'Role (highlighted in the hero, e.g. Web Developer)',  'text', 'headline'],
  ['s_about', 'About me paragraph',                                  'a6',   'about'],
  ['s_email', 'Email',                                               'text', 'email'],
  ['s_wa',    'WhatsApp number (with country code)',                 'text', 'whatsapp'],
  ['s_gh',    'GitHub username or link',                             'text', 'github'],
  ['s_li',    'LinkedIn link',                                       'text', 'linkedin'],
  ['s_fb',    'Facebook link',                                       'text', 'facebook'],
  ['s_ig',    'Instagram link',                                      'text', 'instagram']
];

/* بيبني HTML الحقل حسب نوعه (textarea أو input) */
const fieldHtml = ([id, label, type]) =>
  `<label for="${id}">${label}</label>` +
  (type[0] === 'a'
    ? `<textarea id="${id}" rows="${type.slice(1)}"></textarea>`
    : `<input type="${type}" id="${id}">`);

/* بنرسم الحقول في الصفحة */
$('pform').innerHTML = PROJECT_FIELDS.map(fieldHtml).join('');
$('sform').innerHTML = SITE_FIELDS.map(fieldHtml).join('');
$('iform').innerHTML = PROJECT_IMAGES.map(([key, label, , hint]) => `
  <label>${label} — upload a file</label>
  <input type="file" id="${key}_f" accept="image/*">
  <label for="${key}">or paste an image link</label>
  <input type="url" id="${key}">
  <img id="${key}_p" alt="" style="max-width:220px;display:none;margin-top:8px">
  <p class="hint">${hint}</p>`).join('');

/* المشروع اللي بنعدله دلوقتي (null = بنضيف مشروع جديد) */
let editingId = null;

/* إظهار/إخفاء خانة رابط الكود حسب الـ checkbox */
$('showcode').onchange = () => $('codebox').classList.toggle('hide', !$('showcode').checked);

/* ---------- 3) تسجيل الدخول والخروج ---------- */

/* بيشوف لو في جلسة: لو أيوه يظهر اللوحة ويحمّل البيانات، لو لأ يظهر اللوجين */
async function checkSession() {
  const { data } = await sb.auth.getSession();
  const loggedIn = !!data.session;
  $('login').classList.toggle('hide', loggedIn);
  $('app').classList.toggle('hide', !loggedIn);
  if (loggedIn) { loadProjects(); loadSettings(); loadMessages(); }
}

$('in').onclick = async () => {
  const { error } = await sb.auth.signInWithPassword({ email: $('em').value, password: $('pw').value });
  if (error) alert('Login failed: ' + error.message);
  else checkSession();
};
$('pw').onkeydown = e => { if (e.key === 'Enter') $('in').click(); };   /* Enter يسجّل الدخول */
$('out').onclick = async () => { await sb.auth.signOut(); checkSession(); };

/* ---------- 4) الصورة الشخصية ---------- */

/* بيعرض معاينة للصورة من خانة الرابط */
const previewAvatar = () => {
  const url = $('av_u').value.trim(), img = $('av_p');
  img.src = url;
  img.style.display = url ? 'block' : 'none';
};
$('av_u').oninput = previewAvatar;

/* لما تختار ملف بنعرضه فورًا كمعاينة */
$('av_f').onchange = () => {
  const file = $('av_f').files[0];
  if (file) {
    $('av_p').src = URL.createObjectURL(file);
    $('av_p').style.display = 'block';
  }
};

/* زرار Remove: بيفضّي الخانات (والحفظ الفعلي بيحصل بزرار Save site info) */
$('av_rm').onclick = () => {
  $('av_u').value = '';
  $('av_f').value = '';
  previewAvatar();
  say('Photo removed. Click "Save site info" to apply.', 'smsg');
};

/* بيقص الصورة مربع من النص ويصغّرها (أقصى 600px) ويحوّلها JPEG عشان الموقع يفضل سريع */
function squareBlob(file, size = 600) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);          /* ضلع المربع */
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = Math.min(size, side);
      /* نقص من منتصف الصورة */
      canvas.getContext('2d').drawImage(
        img, (img.width - side) / 2, (img.height - side) / 2, side, side,
        0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Could not process the image')), 'image/jpeg', .88);
    };
    img.onerror = () => reject(new Error('This file is not a valid image'));
    img.src = objectUrl;
  });
}

/* ---------- 5) إعدادات الموقع (جدول site_settings) ---------- */

/* بيحمّل الإعدادات الحالية في الخانات */
async function loadSettings() {
  const { data } = await sb.from('site_settings').select('*').eq('id', 1).maybeSingle();
  if (data) {
    SITE_FIELDS.forEach(([id, , , column]) => $(id).value = data[column] || '');
    $('av_u').value = data.avatar_url || '';
    $('av_f').value = '';
    previewAvatar();
  }
}

/* حفظ الإعدادات (والصورة لو اخترت ملف جديد) */
$('ssave').onclick = async () => {
  say('Saving...', 'smsg');
  try {
    /* الصف رقم 1 هو الوحيد في الجدول */
    const row = { id: 1 };
    SITE_FIELDS.forEach(([id, , , column]) => row[column] = $(id).value.trim() || null);

    const file = $('av_f').files[0];
    if (file) {
      /* ملف جديد: نقصه ونرفعه، وناخد الرابط العام */
      const blob = await squareBlob(file);
      const path = 'avatar-' + Date.now() + '.jpg';    /* اسم فريد عشان المتصفح ما يعرضش نسخة قديمة */
      const { error: uploadError } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      row.avatar_url = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    } else {
      /* مفيش ملف: نستخدم الرابط اللي في الخانة (أو null لو فاضية = حذف الصورة) */
      row.avatar_url = $('av_u').value.trim() || null;
    }

    const { error } = await sb.from('site_settings').upsert(row);
    if (error) throw error;

    $('av_u').value = row.avatar_url || '';
    $('av_f').value = '';
    previewAvatar();
    say('Saved', 'smsg');
  } catch (e) {
    say('Error: ' + (e.message || e), 'smsg');
  }
};

/* ---------- 6) المشاريع: عرض / تعديل / حذف / حفظ ---------- */

/* بيعرض قائمة المشاريع مع زراري Edit و Delete */
async function loadProjects() {
  const { data, error } = await sb.from('projects').select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) { say(error.message); return; }

  $('items').innerHTML = data.length ? '' : '<p class="hint">No projects yet. Add your first one above.</p>';
  data.forEach(project => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = '<span></span><span><button class="g">Edit</button><button class="d">Delete</button></span>';
    row.firstChild.textContent = project.title;     /* textContent عشان الأمان */
    const [editBtn, deleteBtn] = row.querySelectorAll('button');
    editBtn.onclick = () => startEdit(project);
    deleteBtn.onclick = () => deleteProject(project);
    $('items').appendChild(row);
  });
}

/* بيدخل في وضع التعديل: بيملّي الفورم ببيانات المشروع */
function startEdit(p) {
  editingId = p.id;
  $('ft').textContent = 'Edit project';
  PROJECT_FIELDS.forEach(([id, , , column]) => $(id).value = p[column] ?? (id === 'sort' ? 0 : ''));
  PROJECT_IMAGES.forEach(([key, , column]) => { $(key).value = p[column] || ''; $(key + '_f').value = ''; });
  $('desk').checked = !!p.is_desktop;
  $('showcode').checked = !!p.code_url;
  $('codebox').classList.toggle('hide', !p.code_url);
  $('code').value = p.code_url || '';
  $('cancel').classList.remove('hide');
  previewImages();
  scrollTo(0, 0);
}

/* بيفضّي الفورم ويرجع لوضع "إضافة مشروع" */
function resetForm() {
  editingId = null;
  $('ft').textContent = 'Add project';
  PROJECT_FIELDS.forEach(([id]) => $(id).value = '');
  $('sort').value = 0;
  PROJECT_IMAGES.forEach(([key]) => { $(key).value = ''; $(key + '_f').value = ''; });
  $('code').value = '';
  $('desk').checked = $('showcode').checked = false;
  $('codebox').classList.add('hide');
  $('cancel').classList.add('hide');
  previewImages();
}
$('cancel').onclick = resetForm;

/* حذف مشروع (بيسأل للتأكيد الأول) */
async function deleteProject(p) {
  if (!confirm('Delete "' + p.title + '"?')) return;
  const { error } = await sb.from('projects').delete().eq('id', p.id);
  say(error ? error.message : 'Deleted');
  loadProjects();
}

/* حفظ المشروع (إضافة جديد أو تعديل الحالي) */
$('save').onclick = async () => {
  if (!$('title').value.trim()) { say('Title is required'); return; }
  say('Saving...');
  try {
    /* نجمع القيم من الفورم */
    const row = {
      is_desktop: $('desk').checked,
      code_url: $('showcode').checked ? ($('code').value.trim() || null) : null
    };
    PROJECT_FIELDS.forEach(([id, , , column]) => row[column] = $(id).value.trim() || null);
    row.sort_order = Number($('sort').value) || 0;

    /* نرفع الصور الجديدة (أو نستخدم الروابط) */
    for (const [key, , column] of PROJECT_IMAGES) row[column] = await uploadProjectImage(key);

    /* لو بنعدل: update، لو جديد: insert */
    const { error } = await (editingId
      ? sb.from('projects').update(row).eq('id', editingId)
      : sb.from('projects').insert(row));
    if (error) throw error;

    say('Saved');
    resetForm();
    loadProjects();
  } catch (e) {
    say('Error: ' + (e.message || e));
  }
};

/* ---------- 7) رفع صور المشروع ومعاينتها ---------- */

/* لو اخترت ملف بيترفع ويرجّع رابطه، لو لأ بيرجّع الرابط المكتوب (أو null) */
async function uploadProjectImage(key) {
  const file = $(key + '_f').files[0];
  if (!file) return $(key).value.trim() || null;
  const path = Date.now() + '-' + key + '-' + file.name.replace(/[^\w.-]/g, '_');
  const { error } = await sb.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/* بيعرض معاينة صور المشروع من الروابط المكتوبة */
function previewImages() {
  PROJECT_IMAGES.forEach(([key]) => {
    const img = $(key + '_p'), url = $(key).value.trim();
    img.src = url;
    img.style.display = url ? 'block' : 'none';
  });
}
PROJECT_IMAGES.forEach(([key]) => $(key).oninput = previewImages);

/* ---------- 8) التعبئة التلقائية من الروابط ---------- */

/* بيطلّع [owner, repo] من رابط GitHub */
const parseGithubRepo = u => (u.match(/github\.com\/([^\/\s]+)\/([^\/\s#?]+)/) || []).slice(1, 3);

$('auto').onclick = async () => {
  const live = $('live').value.trim(), code = $('code').value.trim();
  if (!live && !code) { $('amsg').textContent = 'Add the live link or the code link first.'; return; }

  $('auto').disabled = true;
  const notes = [];
  /* بنملّي الخانة بس لو كانت فاضية (عشان ما نمسحش كلامك) */
  const fillIfEmpty = (id, value) => { if (value && !$(id).value.trim()) $(id).value = value; };

  try {
    /* (أ) تحليل الموقع المباشر عن طريق Edge Function اسمها analyze-site */
    if (live) {
      $('amsg').textContent = 'Analyzing the site and taking screenshots... this can take up to a minute.';
      const { data, error } = await sb.functions.invoke('analyze-site', { body: { url: live } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      fillIfEmpty('title', (data.title || '').split(/\s[|\-\u2013\u2014]\s/)[0].trim());
      fillIfEmpty('desc', data.description);
      fillIfEmpty('long', [data.description, (data.sections || []).length ? 'Main sections: ' + data.sections.join(', ') + '.' : ''].filter(Boolean).join('\n'));
      fillIfEmpty('features', (data.sections || []).join('\n'));
      $('tech').value = [...new Set([...csvList($('tech').value), ...(data.tech || [])])].join(', ');
      fillIfEmpty('hosting', data.hosting);
      fillIfEmpty('dimg', data.desktop_image);
      fillIfEmpty('mimg', data.mobile_image);
      fillIfEmpty('cover', data.desktop_image);
      (data.warnings || []).forEach(w => notes.push(w));
    }

    /* (ب) اللغات المستخدمة من GitHub API (لو الريبو عام) */
    const [owner, repo] = parseGithubRepo(code);
    if (owner) {
      const res = await fetch('https://api.github.com/repos/' + owner + '/' + repo.replace(/\.git$/, '') + '/languages');
      if (res.ok) {
        const langs = await res.json();
        const total = Object.values(langs).reduce((x, y) => x + y, 0) || 1;
        $('langs').value = Object.entries(langs).map(([name, bytes]) => name + ':' + (bytes / total * 100).toFixed(1)).join(', ');
        $('tech').value = [...new Set([...csvList($('tech').value), ...Object.keys(langs)])].join(', ');
      } else {
        notes.push('Could not read the GitHub repo (it may be private).');
      }
    } else if (code) {
      notes.push('The code link is not a GitHub repo link.');
    }

    previewImages();
    $('amsg').textContent = 'Done. Review the fields, then save.' + (notes.length ? ' Notes: ' + notes.join(' ') : '');
  } catch (e) {
    $('amsg').textContent = 'Failed: ' + (e.message || e);
  }
  $('auto').disabled = false;
};

/* ---------- 9) الرسائل (من فورم التواصل) ---------- */

async function loadMessages() {
  const { data, error } = await sb.from('messages').select('*').order('created_at', { ascending: false });
  const box = $('msgs');
  box.innerHTML = '';

  if (error || !data.length) {
    box.innerHTML = '<p class="hint"></p>';
    box.firstChild.textContent = error ? error.message : 'No messages yet.';
    return;
  }

  data.forEach(m => {
    const row = document.createElement('div');
    row.className = 'row';
    row.style.alignItems = 'flex-start';

    /* بنستخدم textContent عشان محتوى الرسالة ما يتنفذش كـ HTML */
    const text = document.createElement('div');
    text.innerHTML = '<strong></strong><div class="hint"></div><div></div>';
    text.children[0].textContent = m.name + ' - ' + m.subject;
    text.children[1].textContent = m.email + ' | ' + new Date(m.created_at).toLocaleString();
    text.children[2].textContent = m.message;
    text.children[2].style.whiteSpace = 'pre-wrap';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'd';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = async () => {
      if (confirm('Delete this message?')) {
        await sb.from('messages').delete().eq('id', m.id);
        loadMessages();
      }
    };

    row.append(text, deleteBtn);
    box.appendChild(row);
  });
}

/* ---------- التشغيل ---------- */
checkSession();
