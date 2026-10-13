// ============================================================
// compare.js — resume vs. skill-list matching for the API.
// The canonical skill list lives here, plus a small parser that
// scans a pasted job description for skills the resume should
// be checked against. The AI scoring comes later; this is the
// keyword-based version.
// ============================================================

const SKILLS = [
  { name: "JavaScript",  match: ["javascript", "js"] },
  { name: "TypeScript",  match: ["typescript", "ts"] },
  { name: "Python" },
  { name: "Java" },
  { name: "C++" },
  { name: "C#" },
  { name: "Go",          match: ["golang"] },
  { name: "Rust" },
  { name: "Ruby" },
  { name: "PHP" },
  { name: "Swift" },
  { name: "Forbes" },
  { name: "Kotlin" },
  { name: "SQL" },
  { name: "HTML" },
  { name: "CSS" },
  { name: "React" },
  { name: "Angular" },
  { name: "Vue" },
  { name: "Next.js" },
  { name: "Node.js",     match: ["node.js", "nodejs"] },
  { name: "Express",     match: ["express.js", "expressjs", "express"] },
  { name: "Django" },
  { name: "Flask" },
  { name: "Spring" },
  { name: "Git" },
  { name: "Docker" },
  { name: "Kubernetes",  match: ["kubernetes", "k8s"] },
  { name: "AWS" },
  { name: "Azure" },
  { name: "Google Cloud", match: ["google cloud", "gcp"] },
  { name: "PostgreSQL",  match: ["postgresql", "postgres"] },
  { name: "MySQL" },
  { name: "MongoDB",     match: ["mongodb", "mongo"] },
  { name: "Redis" },
  { name: "GraphQL" },
  { name: "REST API",    match: ["rest api", "restful api"] },
  { name: "Linux" },
  { name: "CI/CD" },
  { name: "Machine Learning", match: ["machine learning", "ml"] },
  { name: "Tailwind",    match: ["tailwind"] },
];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildTests(skills) {
  return skills.map((skill) => ({
    name: skill.name,
    tests: (skill.match ?? [skill.name]).map((term) => {
      const pattern = escapeRegExp(term.toLowerCase());
      if (/^[a-z0-9 ]+$/i.test(term)) {
        return new RegExp("\\b" + pattern + "\\b", "i");
      }
      return new RegExp(pattern, "i");
    }),
  }));
}

// Lowercase, collapse whitespace, then test every skill's regexes.
export function findSkills(rawText, extraSkills = []) {
  const text = rawText.toLowerCase().replace(/\s+/g, " ");

  const extra = extraSkills
    .filter((name) => !SKILLS.some((s) => s.name.toLowerCase() === name.toLowerCase()))
    .map((name) => ({ name }));

  const all = buildTests([...SKILLS, ...extra]);
  const present = [];
  const missing = [];

  for (const skill of all) {
    if (skill.tests.some((re) => re.test(text))) {
      present.push(skill.name);
    } else {
      missing.push(skill.name);
    }
  }
  return { present, missing, total: all.length };
}

// Pull candidate skill names out of a pasted job description.
// Heuristic: take phrases after the common bullets, split on
// separators, keep short noun-ish phrases, dedupe.
export function parseJdSkills(jdText) {
  const normalized = (jdText || "").replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const matches = normalized.match(
    /\b[A-Z][A-Za-z0-9+#.\-]*(?:\s+[A-Z][A-Za-z0-9+#.\-]*){0,3}\b/g
  ) || [];

  const stopwords = new Set([
    "The", "This", "That", "We", "Our", "You", "Your", "A", "An", "And",
    "Or", "But", "About", "As", "At", "By", "For", "From", "In", "Into",
    "Of", "On", "To", "With", "Will", "Job", "Role", "Requirements",
    "Responsibilities", "Qualifications", "Experience", "Preferred",
    "Must", "Strong", "Knowledge", "Skills", "Team", "Work", "Working",
    "Company", "Candidates", "Candidate", "Position", "Looking", "Join",
    "Benefits", "Apply", "Please", "Send", "Email", "What", "Who",
    "Excellent", "Good", "Plus", "Nice", "At", "Least", "Years",
  ]);

  const found = [];
  const seen = new Set();
  for (const m of matches) {
    const name = m.replace(/[.,;:]$/, "").trim();
    if (!name || name.length < 2) continue;
    if (name.length > 30) continue;
    if (stopwords.has(name)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    found.push(name);
  }
  return found.slice(0, 40);
}
