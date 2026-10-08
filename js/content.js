/* ============================================================
   content.js — المحتوى الثابت للموقع (ده الملف اللي هتعدل فيه أكتر)

   عايز تغيّر مهارة / خدمة / مرحلة في رحلتك؟ عدّل هنا بس.
   (المشاريع والاسم والإيميل والصورة بتتغير من صفحة الأدمن مش من هنا)
   ============================================================ */

/* true = اظهر شريط مستوى المهارة، false = اخفيه */
const SHOW_SKILL_LEVELS = true;

/* ---------- المهارات ----------
   كل مجموعة: [ "اسم المجموعة", [ مهارة, مهارة, ... ] ]
   كل مهارة:  [ "الاسم", "الوصف", "الحروف داخل الأيقونة", المستوى من 0 لـ 100 ] */
const SKILLS = [
  ["Frontend", [
    ["HTML5", "Semantic, accessible page structure", "HT", 90],
    ["CSS3", "Layouts, animation and responsive styling", "CS", 85],
    ["JavaScript", "Interactive, dynamic web interfaces", "JS", 80],
    ["React.js", "Component-based user interfaces", "Re", 65],
    ["Responsive Design", "Mobile-first layouts for every screen", "RD", 90]
  ]],
  ["Backend", [
    ["Node.js", "Server-side JavaScript runtime", "No", 60],
    ["Express.js", "Lightweight web server framework", "Ex", 60],
    ["REST APIs", "Clean, well-structured API design", "API", 65]
  ]],
  ["Database", [
    ["MySQL", "Relational data modeling and queries", "My", 55],
    ["MongoDB", "Flexible document databases", "Mo", 55]
  ]],
  ["Tools", [
    ["Git", "Version control and collaboration", "Gi", 75],
    ["GitHub", "Code hosting and workflow", "GH", 75],
    ["VS Code", "Daily development environment", "VS", 90],
    ["Figma", "Interface design and prototyping", "Fi", 55]
  ]]
];

/* ---------- الخدمات (قسم What I Do) ----------
   كل خدمة: [ "العنوان", "الوصف" ] */
const SERVICES = [
  ["Web Development", "Building modern, scalable, and responsive websites tailored to your needs."],
  ["Front-End Development", "Creating clean, interactive, and user-friendly interfaces with modern technologies."],
  ["Responsive Design", "Making websites look and work perfectly across desktop, tablet, and mobile devices."],
  ["Website Optimization", "Improving website speed, performance, accessibility, and overall user experience."]
];

/* ---------- ليه تختارني (قسم Why Choose Me) ----------
   كل عنصر: [ "العنوان", "الوصف" ] */
const WHY_ME = [
  ["Clean Code", "Writing organized, maintainable, and scalable code."],
  ["Modern Design", "Creating interfaces that look professional and feel intuitive."],
  ["Responsive", "Ensuring every website works smoothly on all screen sizes."],
  ["Performance", "Building fast and optimized web experiences."]
];

/* ---------- رحلتي (قسم Experience) ----------
   كل مرحلة: [ "السنة", "العنوان", "الوصف" ] */
const TIMELINE = [
  ["2024", "Started Web Development", "Built a strong foundation in HTML, CSS, and JavaScript."],
  ["2025", "Advanced Web Development", "Started building larger projects and learning modern frameworks."],
  ["2026", "Professional Growth", "Focused on creating production-ready websites and improving full-stack development skills."]
];

/* ---------- مشاريع افتراضية ----------
   بتظهر بس لو قاعدة البيانات فاضية أو مفيش اتصال بـ Supabase.
   المشاريع الحقيقية بتتضاف من صفحة الأدمن. */
const DEFAULT_PROJECTS = [
  {
    title: "Opal Gallery",
    description: "A gallery website that presents work cleanly and loads fast on any device.",
    tags: "Website, Responsive",
    live_url: "https://opal-gallery19.vercel.app/"
  },
  {
    title: "Dr. Yasser Dental Clinic",
    description: "A clinic website that helps patients find services and contact the doctor.",
    tags: "Website, Clinic, Responsive",
    live_url: "https://dr-yasser-dental-clinic.vercel.app/"
  },
  {
    title: "Clothing Store",
    description: "An online clothing storefront with product browsing built for phones first.",
    tags: "E-commerce, Responsive",
    live_url: "https://clothing-website-amber-theta.vercel.app/"
  },
  {
    title: "Phone Shop System",
    description: "A desktop system built for a phone shop to manage daily sales and stock. It runs on the shop's computer, so there is no public site.",
    tags: "Desktop app, Server",
    live_url: "https://phone-shop-server-one.vercel.app/",
    live_label: "Server",      /* النص اللي على زرار الرابط بدل "Live Demo" */
    is_desktop: true           /* مشروع ديسكتوب: مفيش سكرين شوت تلقائي */
  }
];
