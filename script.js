/* ============================================================
   Resume Analyzer — mock scorer
   Everything runs in the browser: pdf.js extracts the text,
   then we match it against the skill list below. No backend.
   ============================================================ */

// ---- 1. The skill list — edit this to change what gets scored ----
// `match` is optional; it defaults to the lowercase skill name.
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

// ---- 2. Turn each skill into regexes we can test the text against ----
// Wordy terms get \b boundaries (so "sql" doesn't match inside "mysql");
// terms with symbols (C++, C#, Next.js, CI/CD) are matched as plain substrings.
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SKILL_TESTS = SKILLS.map((skill) => ({
  ...skill,
  tests: (skill.match ?? [skill.name]).map((term) => {
    const pattern = escapeRegExp(term.toLowerCase());
    if (/^[a-z0-9 ]+$/i.test(term)) {
      return new RegExp(`\\b${pattern}\\b`, "i");
    }
    return new RegExp(pattern, "i");
  }),
}));

// pdf.js needs to know where its worker script lives (CDN copy).
if (typeof pdfjsLib !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

// ---- 3. Grab the DOM pieces ----
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const picked = document.getElementById("picked");
const errorBox = document.getElementById("error");
const analyzeBtn = document.getElementById("analyze-btn");
const resetBtn = document.getElementById("reset-btn");
const resultSection = document.getElementById("result");
const ringFg = document.getElementById("ring-fg");
const scoreNum = document.getElementById("score-num");
const scoreNote = document.getElementById("score-note");
const presentChips = document.getElementById("present-chips");
const missingChips = document.getElementById("missing-chips");
const presentCount = document.getElementById("present-count");
const missingCount = document.getElementById("missing-count");

const RING_LENGTH = 326.7; // circumference of the score ring
const SCORE_COLORS = { good: "#3ecf8e", warn: "#f5b544", bad: "#ff6b6b" };

let selectedFile = null;

// ---- 4. Wiring: dropzone, file input, buttons ----
dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") fileInput.click();
});

fileInput.addEventListener("change", () => handleFile(fileInput.files[0]));

["dragover", "dragenter"].forEach((event) =>
  dropzone.addEventListener(event, (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  })
);

["dragleave", "drop"].forEach((event) =>
  dropzone.addEventListener(event, (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
  })
);

dropzone.addEventListener("drop", (e) => handleFile(e.dataTransfer.files[0]));

analyzeBtn.addEventListener("click", analyze);
resetBtn.addEventListener("click", reset);

function handleFile(file) {
  hideError();
  if (!file) return;

  if (file.type !== "application/pdf") {
    showError("That's not a PDF — please choose a .pdf file.");
    return;
  }

  selectedFile = file;
  picked.textContent = `Selected: ${file.name}`;
  picked.hidden = false;
  analyzeBtn.hidden = false;
  resultSection.hidden = true;
}

// ---- 5. The pipeline: read PDF → match skills → render ----
async function analyze() {
  if (!selectedFile) return;

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Reading your PDF…";

  try {
    const text = await extractPdfText(selectedFile);
    const { present, missing } = findSkills(text);
    renderResults(present, missing);

    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    showError(
      "Couldn't read that PDF. Make sure it's a text-based PDF (not a scan) and try again."
    );
    console.error(err);
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Analyze resume";
  }
}

async function extractPdfText(file) {
  if (typeof pdfjsLib === "undefined") {
    throw new Error("pdf.js failed to load — check your internet connection.");
  }

  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + " ";
  }
  return text;
}

function findSkills(rawText) {
  // Lowercase and collapse whitespace so matching is predictable.
  const text = rawText.toLowerCase().replace(/\s+/g, " ");
  const present = [];
  const missing = [];

  for (const skill of SKILL_TESTS) {
    if (skill.tests.some((re) => re.test(text))) {
      present.push(skill.name);
    } else {
      missing.push(skill.name);
    }
  }
  return { present, missing };
}

// ---- 6. Rendering the results ----
function renderResults(present, missing) {
  const score = Math.round((present.length / SKILL_TESTS.length) * 100);
  const color =
    score >= 75 ? SCORE_COLORS.good : score >= 45 ? SCORE_COLORS.warn : SCORE_COLORS.bad;

  // Animate the ring: start empty, then fill to the score.
  ringFg.style.strokeDashoffset = RING_LENGTH;
  ringFg.style.stroke = color;
  requestAnimationFrame(() => {
    ringFg.style.strokeDashoffset = RING_LENGTH * (1 - score / 100);
  });

  countUp(scoreNum, score);
  scoreNote.textContent =
    `${present.length} of ${SKILL_TESTS.length} skills checked ` +
    (score >= 75 ? "— strong match 💪" : score >= 45 ? "— decent, room to grow" : "— lots of gaps to fill");

  fillChips(presentChips, presentCount, present, "present", "No matching skills found.");
  fillChips(missingChips, missingCount, missing, "missing", "Every skill on the list showed up 🎉");
}

function fillChips(container, countEl, skills, cls, emptyMessage) {
  container.innerHTML = "";
  countEl.textContent = `(${skills.length})`;

  if (skills.length === 0) {
    const chip = document.createElement("span");
    chip.className = "chip none";
    chip.textContent = emptyMessage;
    container.appendChild(chip);
    return;
  }

  for (const name of skills) {
    const chip = document.createElement("span");
    chip.className = `chip ${cls}`;
    chip.textContent = name;
    container.appendChild(chip);
  }
}

function countUp(el, target, ms = 900) {
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / ms, 1);
    el.textContent = Math.round(target * progress);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ---- 7. Helpers ----
function reset() {
  selectedFile = null;
  fileInput.value = "";
  picked.hidden = true;
  analyzeBtn.hidden = true;
  resultSection.hidden = true;
  hideError();
  dropzone.scrollIntoView({ behavior: "smooth", block: "center" });
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function hideError() {
  errorBox.hidden = true;
}
