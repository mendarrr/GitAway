// ─── HOLIDAY ROADMAP DATA ──────────────────────────────────────────────────
export const TRACKS = [
  { id: 'data',   label: 'Data & BI',       color: '#58a6ff', emoji: '📊' },
  { id: 'web',    label: 'Web Dev',          color: '#3fb950', emoji: '💻' },
  { id: 'soft',   label: 'Soft Skills',      color: '#bc8cff', emoji: '🤝' },
  { id: 'intern', label: 'Internship Prep',  color: '#d29922', emoji: '🎯' },
];

export const TASKS = [
  { id: 't1',  week: 1, track: 'data',   title: 'Python pandas crash review',                xp: 20, link: 'https://www.kaggle.com/learn/pandas' },
  { id: 't2',  week: 1, track: 'data',   title: 'Matplotlib & Seaborn basics',               xp: 20, link: 'https://www.kaggle.com/learn/data-visualization' },
  { id: 't3',  week: 1, track: 'data',   title: 'SQL refresher – SELECT to JOINs',           xp: 20, link: 'https://sqlzoo.net/' },
  { id: 't4',  week: 1, track: 'web',    title: 'HTML/CSS quick review (30 min a day)',      xp: 10, link: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/' },
  { id: 't5',  week: 1, track: 'soft',   title: 'Set up LinkedIn + GitHub profile',          xp: 15, link: 'https://www.linkedin.com' },
  { id: 't6',  week: 1, track: 'intern', title: 'List 10 target companies in Kenya',         xp: 10, link: 'https://www.brightermonday.co.ke/' },
  { id: 't7',  week: 2, track: 'data',   title: 'Power BI Desktop install + first report',  xp: 25, link: 'https://learn.microsoft.com/en-us/power-bi/fundamentals/desktop-getting-started' },
  { id: 't8',  week: 2, track: 'data',   title: 'KNBS dataset EDA with pandas',             xp: 25, link: 'https://www.knbs.or.ke/datasets/' },
  { id: 't9',  week: 2, track: 'data',   title: 'SQL aggregations + subqueries practice',   xp: 20, link: 'https://mode.com/sql-tutorial/' },
  { id: 't10', week: 2, track: 'web',    title: 'JavaScript ES6 fundamentals',               xp: 15, link: 'https://javascript.info/' },
  { id: 't11', week: 2, track: 'soft',   title: 'Write a 60-second elevator pitch',         xp: 10, link: 'https://www.mindtools.com/pages/article/elevator-pitch.htm' },
  { id: 't12', week: 2, track: 'intern', title: 'Update CV with skills + JKUAT projects',   xp: 15, link: 'https://www.overleaf.com/gallery/tagged/cv' },
  { id: 't13', week: 3, track: 'data',   title: 'Power BI DAX measures & calculated cols',  xp: 30, link: 'https://learn.microsoft.com/en-us/dax/' },
  { id: 't14', week: 3, track: 'data',   title: 'Google Data Studio (Looker Studio) intro', xp: 20, link: 'https://lookerstudio.google.com/' },
  { id: 't15', week: 3, track: 'data',   title: 'Plotly / interactive charts in Python',    xp: 20, link: 'https://plotly.com/python/' },
  { id: 't16', week: 3, track: 'web',    title: 'React fundamentals – components & hooks',  xp: 20, link: 'https://react.dev/learn' },
  { id: 't17', week: 3, track: 'soft',   title: 'Read "Deep Work" chapters 1-4',            xp: 10, link: 'https://www.goodreads.com/book/show/25744928-deep-work' },
  { id: 't18', week: 3, track: 'intern', title: 'Send 5 cold emails / LinkedIn DMs',        xp: 20, link: 'https://www.linkedin.com' },
  { id: 't19', week: 4, track: 'data',   title: 'Data storytelling principles',              xp: 20, link: 'https://www.storytellingwithdata.com/blog' },
  { id: 't20', week: 4, track: 'data',   title: 'Excel advanced – pivot tables, XLOOKUP',   xp: 20, link: 'https://exceljet.net/' },
  { id: 't21', week: 4, track: 'data',   title: 'OpenData Kenya project dataset analysis',  xp: 30, link: 'https://opendata.go.ke/' },
  { id: 't22', week: 4, track: 'web',    title: 'Build a personal portfolio page',          xp: 25, link: 'https://www.frontendmentor.io/' },
  { id: 't23', week: 4, track: 'soft',   title: 'Presentation skills – record yourself',    xp: 15, link: 'https://www.youtube.com/watch?v=K0pxo-dS9Hc' },
  { id: 't24', week: 4, track: 'intern', title: 'Apply to 10 internships (BrighterMonday, LinkedIn)', xp: 25, link: 'https://www.brightermonday.co.ke/' },
  { id: 't25', week: 5, track: 'data',   title: 'Intro to machine learning with sklearn',   xp: 30, link: 'https://www.kaggle.com/learn/intro-to-machine-learning' },
  { id: 't26', week: 5, track: 'data',   title: 'Statistical analysis with scipy/statsmodels', xp: 25, link: 'https://www.statsmodels.org/stable/index.html' },
  { id: 't27', week: 5, track: 'data',   title: 'Power BI service – publish & share',      xp: 20, link: 'https://app.powerbi.com/' },
  { id: 't28', week: 5, track: 'web',    title: 'REST APIs – fetch data into React',        xp: 20, link: 'https://www.freecodecamp.org/news/how-to-fetch-data-from-an-api-using-the-fetch-api-in-javascript/' },
  { id: 't29', week: 5, track: 'soft',   title: 'Mock interview with a friend / online',   xp: 20, link: 'https://www.pramp.com/' },
  { id: 't30', week: 5, track: 'intern', title: 'Follow up on all applications sent',       xp: 10, link: '' },
  { id: 't31', week: 6, track: 'data',   title: '⭐ CAPSTONE: Full pipeline – Python → SQL → Power BI', xp: 60, link: '' },
  { id: 't32', week: 6, track: 'data',   title: 'Record a 5-min walkthrough of capstone',  xp: 20, link: '' },
  { id: 't33', week: 6, track: 'web',    title: 'Deploy portfolio to GitHub Pages',         xp: 20, link: 'https://pages.github.com/' },
  { id: 't34', week: 6, track: 'soft',   title: 'Write a project reflection blog post',    xp: 15, link: 'https://dev.to/' },
  { id: 't35', week: 6, track: 'intern', title: 'Share capstone project on LinkedIn',       xp: 20, link: '' },
  { id: 't36', week: 7, track: 'data',   title: 'Advanced Power BI – custom visuals',       xp: 25, link: 'https://appsource.microsoft.com/en-us/marketplace/apps?product=power-bi-visuals' },
  { id: 't37', week: 7, track: 'data',   title: 'Tableau Public free tier – first viz',     xp: 20, link: 'https://public.tableau.com/' },
  { id: 't38', week: 7, track: 'web',    title: 'TypeScript intro (types + interfaces)',     xp: 20, link: 'https://www.typescriptlang.org/docs/' },
  { id: 't39', week: 7, track: 'soft',   title: 'Write cover letters for 5 top companies',  xp: 20, link: '' },
  { id: 't40', week: 7, track: 'intern', title: 'Reach out to 3 data professionals on LinkedIn', xp: 15, link: '' },
  { id: 't41', week: 8, track: 'data',   title: 'SQL interview questions practice (30)',    xp: 25, link: 'https://leetcode.com/problemset/database/' },
  { id: 't42', week: 8, track: 'data',   title: 'Python interview questions practice',      xp: 25, link: 'https://www.hackerrank.com/domains/python' },
  { id: 't43', week: 8, track: 'web',    title: 'JS interview questions + mini projects',   xp: 20, link: 'https://www.greatfrontend.com/' },
  { id: 't44', week: 8, track: 'soft',   title: 'Finalize portfolio + LinkedIn endorsements', xp: 15, link: '' },
  { id: 't45', week: 8, track: 'intern', title: 'Final round: apply to 20 more internships', xp: 30, link: '' },
];

export const RESOURCES = [
  { category: 'Data & Python', items: [
    { name: 'Kaggle Learn (free courses)', url: 'https://www.kaggle.com/learn' },
    { name: 'Python for Data Analysis book (free PDF)', url: 'https://wesmckinney.com/book/' },
    { name: 'Real Python tutorials', url: 'https://realpython.com/' },
    { name: 'Data Science Handbook', url: 'https://jakevdp.github.io/PythonDataScienceHandbook/' },
  ]},
  { category: 'SQL', items: [
    { name: 'SQLZoo interactive', url: 'https://sqlzoo.net/' },
    { name: 'Mode SQL Tutorial', url: 'https://mode.com/sql-tutorial/' },
    { name: 'LeetCode Database problems', url: 'https://leetcode.com/problemset/database/' },
  ]},
  { category: 'BI Tools', items: [
    { name: 'Microsoft Learn – Power BI', url: 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi' },
    { name: 'Looker Studio (free)', url: 'https://lookerstudio.google.com/' },
    { name: 'Tableau Public (free)', url: 'https://public.tableau.com/' },
    { name: 'Guy in a Cube (YouTube)', url: 'https://www.youtube.com/@GuyInACube' },
  ]},
  { category: 'Web Development', items: [
    { name: 'The Odin Project', url: 'https://www.theodinproject.com/' },
    { name: 'javascript.info', url: 'https://javascript.info/' },
    { name: 'React official docs', url: 'https://react.dev/learn' },
    { name: 'FreeCodeCamp', url: 'https://www.freecodecamp.org/' },
    { name: 'Frontend Mentor (practice projects)', url: 'https://www.frontendmentor.io/' },
  ]},
  { category: 'Kenya Datasets', items: [
    { name: 'Kenya Open Data', url: 'https://opendata.go.ke/' },
    { name: 'KNBS Datasets', url: 'https://www.knbs.or.ke/datasets/' },
    { name: 'Africa Open Data', url: 'https://africaopendata.org/' },
  ]},
  { category: 'Job & Internship Search', items: [
    { name: 'BrighterMonday Kenya', url: 'https://www.brightermonday.co.ke/' },
    { name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs/' },
    { name: 'Fuzu Kenya', url: 'https://www.fuzu.com/kenya' },
    { name: 'Ajira Digital', url: 'https://www.ajiradigital.go.ke/' },
    { name: 'Glassdoor', url: 'https://www.glassdoor.com/' },
  ]},
];

export const ACHIEVEMENTS = [
  // Holiday tasks
  { id: 'a1',  title: 'First Step',       desc: 'Complete your first task',              icon: '🎯', condition: (d) => d.done >= 1 },
  { id: 'a2',  title: 'Week 1 Done',      desc: 'Finish all Week 1 tasks',               icon: '🗓️', condition: (d) => d.week1Done },
  { id: 'a3',  title: 'Data Cruncher',    desc: 'Complete 10 Data & BI tasks',           icon: '📊', condition: (d) => d.dataDone >= 10 },
  { id: 'a4',  title: 'Code Comeback',    desc: 'Complete 8 Web Dev tasks',              icon: '💻', condition: (d) => d.webDone >= 8 },
  { id: 'a5',  title: 'Soft Power',       desc: 'Complete all Soft Skills tasks',        icon: '🤝', condition: (d) => d.softDone >= 8 },
  { id: 'a6',  title: '100 XP',           desc: 'Earn 100 XP total',                     icon: '⭐', condition: (d) => d.xp >= 100 },
  { id: 'a7',  title: '500 XP',           desc: 'Earn 500 XP total',                     icon: '🌟', condition: (d) => d.xp >= 500 },
  { id: 'a8',  title: 'Capstone Hero',    desc: 'Complete the Week 6 capstone',          icon: '🏆', condition: (d) => d.capstone },
  { id: 'a9',  title: '7-Day Streak',     desc: 'Use the app 7 days in a row',           icon: '🔥', condition: (d) => d.streak >= 7 },
  { id: 'a10', title: 'Networker',        desc: 'Apply to 10+ internships',              icon: '🌐', condition: (d) => d.internDone >= 5 },
  { id: 'a11', title: 'Half Way',         desc: 'Complete 50% of all tasks',             icon: '💪', condition: (d) => d.done >= 23 },
  { id: 'a12', title: 'Roadmap Legend',   desc: 'Complete all 45 tasks',                 icon: '👑', condition: (d) => d.done >= 45 },
  // Academic
  { id: 'a13', title: 'Scholar',          desc: 'Add 5 semester units',                  icon: '🎓', condition: (d) => d.units >= 5 },
  { id: 'a14', title: 'CAT Crusher',      desc: 'Pass 3 CATs (score ≥ 60%)',             icon: '📝', condition: (d) => d.catsPassed >= 3 },
  { id: 'a15', title: 'Top of Class',     desc: 'Score 80%+ on any assessment',          icon: '🥇', condition: (d) => d.topScore },
  { id: 'a16', title: 'Study Machine',    desc: 'Log 20 study sessions',                 icon: '⚡', condition: (d) => d.totalSessions >= 20 },
  { id: 'a17', title: '1000 XP',          desc: 'Earn 1000 XP total',                    icon: '💎', condition: (d) => d.xp >= 1000 },
  { id: 'a18', title: 'AI Power User',    desc: 'Ask the AI assistant 10 questions',     icon: '🤖', condition: (d) => d.aiQuestions >= 10 },
  // Extended XP
  { id: 'a19', title: '2000 XP',          desc: 'Earn 2000 XP total',                    icon: '🔮', condition: (d) => d.xp >= 2000 },
  // Semester & Year
  { id: 'a20', title: 'Semester Grad',    desc: 'Mark a semester as complete',            icon: '🏅', condition: (d) => (d.completedSemestersCount || 0) >= 1 },
  { id: 'a21', title: 'Year Complete',    desc: 'Complete a full academic year',          icon: '🎊', condition: (d) => d.yearComplete },
  // More academic
  { id: 'a22', title: 'Assignment Pro',   desc: 'Submit 10+ assignments',                 icon: '📋', condition: (d) => d.assignmentsSubmitted >= 10 },
  { id: 'a23', title: 'Exam Ready',       desc: 'Pass 3+ exams',                          icon: '📚', condition: (d) => d.examsPassed >= 3 },
  { id: 'a24', title: 'Unit Master',      desc: 'Master all topics in a unit',            icon: '🌠', condition: (d) => d.perfectUnit },
  // Consistency
  { id: 'a25', title: '14-Day Streak',    desc: 'Use the app 14 days in a row',           icon: '🌋', condition: (d) => d.streak >= 14 },
  { id: 'a26', title: '30 Sessions',      desc: 'Complete 30 focus sessions',             icon: '🧘', condition: (d) => d.totalSessions >= 30 },
  // Skills & AI
  { id: 'a27', title: 'Roadmap Pioneer',  desc: 'Choose 3+ skill roadmaps',              icon: '🗺️', condition: (d) => d.skillsChosen >= 3 },
  { id: 'a28', title: 'Journal Keeper',   desc: 'Write 10 diary entries',                icon: '📓', condition: (d) => d.diaryEntries >= 10 },
];

// ─── SEMESTER DATA ─────────────────────────────────────────────────────────
export const XP_RULES = {
  assignment_submit: 30,
  assignment_grade_A: 50,
  assignment_grade_B: 35,
  assignment_grade_C: 20,
  cat_pass: 40,
  cat_distinction: 70,
  exam_pass: 80,
  exam_distinction: 120,
  topic_mastered: 25,
  study_session: 10,
  diary_entry: 5,
  focus_session: 10,
  holiday_task: null, // uses task's own xp
  semester_complete: 150,
  year_complete: 300,
};

export const MASTERY_LEVELS = [
  { level: 0, label: 'Not started',  color: '#30363d', icon: '○' },
  { level: 1, label: 'Introduced',   color: '#d29922', icon: '◔' },
  { level: 2, label: 'Practising',   color: '#58a6ff', icon: '◑' },
  { level: 3, label: 'Comfortable',  color: '#3fb950', icon: '◕' },
  { level: 4, label: 'Mastered',     color: '#bc8cff', icon: '●' },
];

export const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
export const TIMES = ['7:00','8:00','9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────
export function makeSemId(year, sem) {
  return `${year}.${sem}`;
}

export function parseSemId(id) {
  const [year, sem] = (id || '').split('.').map(Number);
  return { year: year || 1, sem: sem || 1 };
}

export function semLabel(id) {
  const { year, sem } = parseSemId(id);
  return `Year ${year} \u00b7 Sem ${sem}`;
}

// ─── SKILL ROADMAPS (inspired by roadmap.sh) ─────────────────────────────────
export const SKILL_ROADMAPS = [
  {
    id: 'python',
    label: 'Python',
    emoji: '🐍',
    color: '#3b82f6',
    description: 'From basics to advanced Python programming',
    resources: [
      { name: 'Official Python Docs', url: 'https://docs.python.org/3/' },
      { name: 'Python for Everybody (Coursera)', url: 'https://www.coursera.org/specializations/python' },
      { name: 'Real Python', url: 'https://realpython.com/' },
      { name: 'Automate the Boring Stuff', url: 'https://automatetheboringstuff.com/' },
      { name: 'Python Exercises (w3schools)', url: 'https://www.w3schools.com/python/python_exercises.asp' },
    ],
  },
  {
    id: 'data-analyst',
    label: 'Data Analyst',
    emoji: '📊',
    color: '#58a6ff',
    description: 'SQL, Excel, BI tools, visualisation',
    resources: [
      { name: 'Kaggle Learn – Data Analysis', url: 'https://www.kaggle.com/learn' },
      { name: 'Google Data Analytics Certificate', url: 'https://www.coursera.org/professional-certificates/google-data-analytics' },
      { name: 'Mode SQL Tutorial', url: 'https://mode.com/sql-tutorial/' },
      { name: 'Storytelling With Data', url: 'https://www.storytellingwithdata.com/blog' },
      { name: 'ExcelJet – Excel tips', url: 'https://exceljet.net/' },
    ],
  },
  {
    id: 'data-science',
    label: 'Data Science',
    emoji: '🔬',
    color: '#a78bfa',
    description: 'ML, statistics, Python, research workflows',
    resources: [
      { name: 'Kaggle Learn – ML', url: 'https://www.kaggle.com/learn/intro-to-machine-learning' },
      { name: 'Python Data Science Handbook', url: 'https://jakevdp.github.io/PythonDataScienceHandbook/' },
      { name: 'Fast.ai Practical DL', url: 'https://www.fast.ai/' },
      { name: 'StatQuest (YouTube)', url: 'https://www.youtube.com/@statquest' },
      { name: 'Towards Data Science', url: 'https://towardsdatascience.com/' },
    ],
  },
  {
    id: 'ml',
    label: 'Machine Learning',
    emoji: '🤖',
    color: '#34d399',
    description: 'Supervised, unsupervised, deep learning',
    resources: [
      { name: 'Andrew Ng ML Course (Coursera)', url: 'https://www.coursera.org/specializations/machine-learning-introduction' },
      { name: 'Scikit-learn Docs', url: 'https://scikit-learn.org/stable/' },
      { name: 'Papers With Code', url: 'https://paperswithcode.com/' },
      { name: 'HuggingFace', url: 'https://huggingface.co/learn' },
      { name: 'Deep Learning Book (free)', url: 'https://www.deeplearningbook.org/' },
    ],
  },
  {
    id: 'sql',
    label: 'SQL',
    emoji: '🗄️',
    color: '#f59e0b',
    description: 'Relational databases, queries, optimisation',
    resources: [
      { name: 'SQLZoo Interactive', url: 'https://sqlzoo.net/' },
      { name: 'LeetCode Database Problems', url: 'https://leetcode.com/problemset/database/' },
      { name: 'Mode SQL Tutorial', url: 'https://mode.com/sql-tutorial/' },
      { name: 'PostgreSQL Docs', url: 'https://www.postgresql.org/docs/' },
      { name: 'Use The Index, Luke!', url: 'https://use-the-index-luke.com/' },
    ],
  },
  {
    id: 'powerbi',
    label: 'Power BI',
    emoji: '📈',
    color: '#f2c811',
    description: 'DAX, data modelling, dashboards',
    resources: [
      { name: 'Microsoft Learn – Power BI', url: 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi' },
      { name: 'Guy in a Cube (YouTube)', url: 'https://www.youtube.com/@GuyInACube' },
      { name: 'DAX Guide', url: 'https://dax.guide/' },
      { name: 'SQLBI – Advanced DAX', url: 'https://www.sqlbi.com/' },
      { name: 'Power BI Community', url: 'https://community.powerbi.com/' },
    ],
  },
  {
    id: 'frontend',
    label: 'Frontend Dev',
    emoji: '💻',
    color: '#3fb950',
    description: 'HTML, CSS, JavaScript, React',
    resources: [
      { name: 'The Odin Project', url: 'https://www.theodinproject.com/' },
      { name: 'javascript.info', url: 'https://javascript.info/' },
      { name: 'React Official Docs', url: 'https://react.dev/learn' },
      { name: 'Frontend Mentor (projects)', url: 'https://www.frontendmentor.io/' },
      { name: 'FreeCodeCamp', url: 'https://www.freecodecamp.org/' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend Dev',
    emoji: '⚙️',
    color: '#64748b',
    description: 'Node.js, APIs, databases, auth',
    resources: [
      { name: 'Node.js Docs', url: 'https://nodejs.org/en/docs/' },
      { name: 'Express.js Guide', url: 'https://expressjs.com/en/guide/routing.html' },
      { name: 'The Odin Project – Node', url: 'https://www.theodinproject.com/paths/full-stack-javascript' },
      { name: 'Postman Learning Centre', url: 'https://learning.postman.com/' },
      { name: 'Railway (deploy for free)', url: 'https://railway.app/' },
    ],
  },
  {
    id: 'fullstack',
    label: 'Full Stack',
    emoji: '🌐',
    color: '#06b6d4',
    description: 'End-to-end web apps, deployment',
    resources: [
      { name: 'Full Stack Open (Helsinki)', url: 'https://fullstackopen.com/' },
      { name: 'T3 Stack Docs', url: 'https://create.t3.gg/' },
      { name: 'Vercel Deployment Docs', url: 'https://vercel.com/docs' },
      { name: 'Supabase Docs', url: 'https://supabase.com/docs' },
      { name: 'Roadmap.sh – Full Stack', url: 'https://roadmap.sh/full-stack' },
    ],
  },
  {
    id: 'devops',
    label: 'DevOps',
    emoji: '🔧',
    color: '#f97316',
    description: 'Docker, CI/CD, cloud, Linux',
    resources: [
      { name: 'Docker Get Started', url: 'https://docs.docker.com/get-started/' },
      { name: 'GitHub Actions Docs', url: 'https://docs.github.com/en/actions' },
      { name: 'AWS Free Tier', url: 'https://aws.amazon.com/free/' },
      { name: 'Linux Journey', url: 'https://linuxjourney.com/' },
      { name: 'Roadmap.sh – DevOps', url: 'https://roadmap.sh/devops' },
    ],
  },
  {
    id: 'git',
    label: 'Git & GitHub',
    emoji: '🐙',
    color: '#e05d44',
    description: 'Version control, branching, open source',
    resources: [
      { name: 'Pro Git Book (free)', url: 'https://git-scm.com/book/en/v2' },
      { name: 'GitHub Skills', url: 'https://skills.github.com/' },
      { name: 'Learn Git Branching (interactive)', url: 'https://learngitbranching.js.org/' },
      { name: 'Oh Shit, Git!', url: 'https://ohshitgit.com/' },
      { name: 'Atlassian Git Tutorials', url: 'https://www.atlassian.com/git/tutorials' },
    ],
  },
  {
    id: 'android',
    label: 'Android Dev',
    emoji: '📱',
    color: '#3ddc84',
    description: 'Kotlin, Jetpack Compose, Android Studio',
    resources: [
      { name: 'Android Developers Codelabs', url: 'https://developer.android.com/get-started/codelabs' },
      { name: 'Kotlin Docs', url: 'https://kotlinlang.org/docs/home.html' },
      { name: 'Jetpack Compose Tutorial', url: 'https://developer.android.com/jetpack/compose/tutorial' },
      { name: 'Google Codelabs – Android', url: 'https://codelabs.developers.google.com/?cat=Android' },
      { name: 'Roadmap.sh – Android', url: 'https://roadmap.sh/android' },
    ],
  },
  {
    id: 'cybersecurity',
    label: 'Cybersecurity',
    emoji: '🔒',
    color: '#dc2626',
    description: 'Networking, ethical hacking, CTFs',
    resources: [
      { name: 'TryHackMe', url: 'https://tryhackme.com/' },
      { name: 'HackTheBox', url: 'https://www.hackthebox.com/' },
      { name: 'OWASP Top Ten', url: 'https://owasp.org/www-project-top-ten/' },
      { name: 'Cybrary (free tier)', url: 'https://www.cybrary.it/' },
      { name: 'Roadmap.sh – Cyber Security', url: 'https://roadmap.sh/cyber-security' },
    ],
  },
  {
    id: 'blockchain',
    label: 'Blockchain',
    emoji: '⛓️',
    color: '#8b5cf6',
    description: 'Web3, Solidity, smart contracts',
    resources: [
      { name: 'CryptoZombies (Solidity)', url: 'https://cryptozombies.io/' },
      { name: 'Ethereum Docs', url: 'https://ethereum.org/en/developers/docs/' },
      { name: 'Buildspace Projects', url: 'https://buildspace.so/' },
      { name: 'Patrick Collins (YouTube)', url: 'https://www.youtube.com/@PatrickAlphaC' },
      { name: 'Hardhat Docs', url: 'https://hardhat.org/docs' },
    ],
  },
  {
    id: 'ux',
    label: 'UI/UX Design',
    emoji: '🎨',
    color: '#ec4899',
    description: 'Figma, design systems, user research',
    resources: [
      { name: 'Figma Learn', url: 'https://help.figma.com/hc/en-us/categories/360002051613' },
      { name: 'Google UX Design Certificate', url: 'https://www.coursera.org/professional-certificates/google-ux-design' },
      { name: 'Nielsen Norman Group', url: 'https://www.nngroup.com/articles/' },
      { name: 'Dribbble (inspiration)', url: 'https://dribbble.com/' },
      { name: 'Laws of UX', url: 'https://lawsofux.com/' },
    ],
  },
  {
    id: 'product',
    label: 'Product Management',
    emoji: '🎯',
    color: '#0ea5e9',
    description: 'Strategy, roadmaps, user stories',
    resources: [
      { name: "Lenny's Newsletter", url: 'https://www.lennysnewsletter.com/' },
      { name: 'Product School Free Resources', url: 'https://productschool.com/free-product-management-resources/' },
      { name: 'Aha! Product Strategy Guide', url: 'https://www.aha.io/roadmapping/guide/product-strategy' },
      { name: 'Roadmap.sh – Product Manager', url: 'https://roadmap.sh/product-manager' },
      { name: 'Mind the Product', url: 'https://www.mindtheproduct.com/' },
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud Computing',
    emoji: '☁️',
    color: '#38bdf8',
    description: 'AWS, GCP, Azure, serverless',
    resources: [
      { name: 'AWS Free Tier + Skill Builder', url: 'https://aws.amazon.com/free/' },
      { name: 'Google Cloud Training', url: 'https://cloud.google.com/training/free-labs' },
      { name: 'A Cloud Guru', url: 'https://acloudguru.com/' },
      { name: 'Cloud Computing Concepts (Coursera)', url: 'https://www.coursera.org/learn/cloud-computing' },
      { name: 'Roadmap.sh – AWS', url: 'https://roadmap.sh/aws' },
    ],
  },
  {
    id: 'softskills',
    label: 'Soft Skills',
    emoji: '🤝',
    color: '#bc8cff',
    description: 'Communication, leadership, career growth',
    resources: [
      { name: 'Coursera – Communication Skills', url: 'https://www.coursera.org/courses?query=communication%20skills' },
      { name: 'Pramp – Mock Interviews', url: 'https://www.pramp.com/' },
      { name: 'Toastmasters International', url: 'https://www.toastmasters.org/' },
      { name: 'MindTools Career Skills', url: 'https://www.mindtools.com/pages/main/newMN_CDV.htm' },
      { name: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/' },
    ],
  },
  {
    id: 'internship',
    label: 'Internship Prep',
    emoji: '💼',
    color: '#d29922',
    description: 'CV, cover letters, job search Kenya',
    resources: [
      { name: 'BrighterMonday Kenya', url: 'https://www.brightermonday.co.ke/' },
      { name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs/' },
      { name: 'Fuzu Kenya', url: 'https://www.fuzu.com/kenya' },
      { name: 'Ajira Digital', url: 'https://www.ajiradigital.go.ke/' },
      { name: 'Overleaf CV Templates', url: 'https://www.overleaf.com/gallery/tagged/cv' },
    ],
  },
];