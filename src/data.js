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
  { id: 'a13', title: 'Scholar',          desc: 'Add 5 semester units',                  icon: '🎓', condition: (d) => d.units >= 5 },
  { id: 'a14', title: 'CAT Crusher',      desc: 'Pass 3 CATs (score ≥ 60%)',             icon: '📝', condition: (d) => d.catsPassed >= 3 },
  { id: 'a15', title: 'Top of Class',     desc: 'Score 80%+ on any assessment',          icon: '🥇', condition: (d) => d.topScore },
  { id: 'a16', title: 'Study Machine',    desc: 'Log 20 study sessions',                 icon: '⚡', condition: (d) => d.totalSessions >= 20 },
  { id: 'a17', title: '1000 XP',          desc: 'Earn 1000 XP total',                    icon: '💎', condition: (d) => d.xp >= 1000 },
  { id: 'a18', title: 'AI Power User',    desc: 'Ask the AI assistant 10 questions',     icon: '🤖', condition: (d) => d.aiQuestions >= 10 },
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
