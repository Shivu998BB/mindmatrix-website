/*
  MindMatrix application logic

  This script controls navigation between screens, form validation,
  question rendering and final report generation. If you wish to
  customise the wording of the questionnaire or the suggestions shown
  to users based on their score you can modify the `questions` array
  and the `getReportForScore` function below. Avoid changing the
  element IDs referenced here as they are used to query the DOM.
*/

// ===============================
// SIMPLE SPA NAVIGATION HELPERS
// ===============================

const screens = document.querySelectorAll(".screen");

function showScreen(id) {
  screens.forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ===============================
// USER DATA & STATE
// ===============================
const userData = {
  name: "",
  age: null,
  gender: "",
  contact: "",
  email: "",
};

const questions = [
  // ===============================
  // EDIT QUESTION TEXT HERE
  // All are 1–5 rating questions
  // ===============================
  "In the past week, I have felt mostly calm and in control.",
  "I have been able to focus on my studies or work without getting easily overwhelmed.",
  "I wake up feeling rested or at least somewhat recharged.",
  "I feel connected to people who care about me.",
  "I’m managing my daily responsibilities in a way that feels sustainable.",
  "I have taken at least one small action to care for my mental health (like a walk, journaling, or a break).",
  "Stress has not been interfering too much with my sleep.",
  "I’ve felt hopeful about at least one thing in my life.",
  "My emotions haven’t been getting in the way of important tasks.",
  "Overall, I feel in touch with what matters most to me right now.",
];

const responses = new Array(questions.length).fill(null); // will hold numbers 1–5
let currentQuestionIndex = 0;
let finalScore = 0;

// ===============================
// DOM ELEMENTS
// ===============================
const btnStartWelcome = document.getElementById("btnStartWelcome");
const infoForm = document.getElementById("infoForm");
const btnStartQuestions = document.getElementById("btnStartQuestions");
const progressText = document.querySelector(".progress-text");
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const btnFinish = document.getElementById("btnFinish");
const scoreValueEl = document.getElementById("scoreValue");
const btnSeeReport = document.getElementById("btnSeeReport");
const reportTitleEl = document.getElementById("reportTitle");
const reportSummaryEl = document.getElementById("reportSummary");
const reportSuggestionsEl = document.getElementById("reportSuggestions");
const btnRestart = document.getElementById("btnRestart");

// ===============================
// SCREEN 1 → 2 : WELCOME
// ===============================
btnStartWelcome.addEventListener("click", () => {
  showScreen("infoScreen");
});

// ===============================
// SCREEN 2: BASIC INFO VALIDATION
// ===============================
infoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;

  // Get values
  const name = form.name.value.trim();
  const age = form.age.value.trim();
  const contact = form.contact.value.trim();
  const email = form.email.value.trim();
  const gender = form.gender.value;

  // Clear errors
  form.querySelectorAll(".error-message").forEach((el) => (el.textContent = ""));

  let isValid = true;

  // Name validation
  if (!name) {
    showError(form.name, "Name is required.");
    isValid = false;
  }

  // Age validation (simple)
  const ageNum = parseInt(age, 10);
  if (!age || isNaN(ageNum) || ageNum < 10 || ageNum > 120) {
    showError(form.age, "Please enter a valid age between 10 and 120.");
    isValid = false;
  }

  // Gender validation
  if (!gender) {
    const group = form.querySelector('input[name="gender"]').closest(".form-group");
    group.querySelector(".error-message").textContent = "Please select a gender.";
    isValid = false;
  }

  // Contact validation (basic length & digits)
  if (!/^\d{7,15}$/.test(contact)) {
    showError(
      form.contact,
      "Please enter a valid contact number (only digits, 7–15 characters)."
    );
    isValid = false;
  }

  // Email validation (simple pattern)
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    showError(form.email, "Please enter a valid email address.");
    isValid = false;
  }

  if (!isValid) return;

  // Save data
  userData.name = name;
  userData.age = ageNum;
  userData.gender = gender;
  userData.contact = contact;
  userData.email = email;

  // Go to Start Tracking screen
  showScreen("startTrackingScreen");
});

function showError(inputEl, message) {
  const group = inputEl.closest(".form-group");
  const err = group.querySelector(".error-message");
  if (err) err.textContent = message;
}

// ===============================
// SCREEN 3 → 4 : START TRACKING
// ===============================
btnStartQuestions.addEventListener("click", () => {
  currentQuestionIndex = 0;
  renderQuestion();
  showScreen("questionScreen");
});
// ===============================
// QUESTION RENDERING
// ===============================
function renderQuestion() {
  const index = currentQuestionIndex;
  const total = questions.length;

  progressText.textContent = `Question ${index + 1} of ${total}`;
  questionText.textContent = questions[index];

  // Clear previous options
  optionsContainer.innerHTML = "";

  // Rating 1–5 labels
  const labels = [
    "Strongly disagree",
    "Disagree",
    "Neutral",
    "Agree",
    "Strongly agree",
  ];

  for (let value = 1; value <= 5; value++) {
    const option = document.createElement("label");
    option.className = "option-pill";
    option.dataset.value = value.toString();

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "answer";
    input.value = value;

    const labelSpan = document.createElement("span");
    labelSpan.className = "option-label";
    labelSpan.textContent = labels[value - 1];

    const scoreSpan = document.createElement("span");
    scoreSpan.className = "option-score";
    scoreSpan.textContent = value;

    option.appendChild(input);
    option.appendChild(labelSpan);
    option.appendChild(scoreSpan);

    // Highlight previously selected answer
    if (responses[index] === value) {
      option.classList.add("selected");
    }

    // Click → answer selection
    option.addEventListener("click", () => {
      handleAnswerSelection(value, option);
    });

    optionsContainer.appendChild(option);
  }

  // Show Finish only on the last question
  if (index === total - 1) {
    btnFinish.classList.remove("hidden");
  } else {
    btnFinish.classList.add("hidden");
  }
}

// ===============================
// PROTECTIVE CLICK LOCK
// ===============================
let isTransitioning = false;

// ===============================
// ANSWER SELECTION FUNCTION
// ===============================
function handleAnswerSelection(value, optionEl) {
  // Prevent double-click skip bug
  if (isTransitioning) return;

  // Visually mark selected
  optionsContainer.querySelectorAll(".option-pill").forEach((el) => {
    el.classList.remove("selected");
  });
  optionEl.classList.add("selected");

  // Save answer
  responses[currentQuestionIndex] = value;

  // If not last question → auto-advance
  if (currentQuestionIndex < questions.length - 1) {
    isTransitioning = true; // lock movement

    setTimeout(() => {
      currentQuestionIndex++;
      renderQuestion();
      isTransitioning = false; // unlock after next question loads
    }, 150);

  } else {
    // Last question → user must press Finish
  }
}

// ===============================
// FINISH BUTTON → SCORE PAGE
// ===============================
btnFinish.addEventListener("click", () => {
  // If the last answer was never selected
  if (responses[currentQuestionIndex] == null) {
    alert("Please select an answer before finishing.");
    return;
  }

  calculateScore();
  showScoreScreen();
});

// ===============================
// SCORE CALCULATION
// ===============================
function calculateScore() {
  // Any unanswered values get neutral fallback
  for (let i = 0; i < responses.length; i++) {
    if (responses[i] == null) {
      responses[i] = 3; 
    }
  }

  const total = responses.reduce((sum, val) => sum + val, 0);
  const maxTotal = questions.length * 5;

  finalScore = Math.round((total / maxTotal) * 100);
}

function showScoreScreen() {
  scoreValueEl.textContent = finalScore;
  showScreen("scoreScreen");
}

// ===============================
// REPORT SECTION
// ===============================
btnSeeReport.addEventListener("click", () => {
  const { title, summary, suggestionsHtml } = getReportForScore(
    finalScore,
    userData.name
  );

  reportTitleEl.textContent = title;
  reportSummaryEl.textContent = summary;
  reportSuggestionsEl.innerHTML = suggestionsHtml;

  showScreen("reportScreen");
});


// Customize messages & thresholds here
function getReportForScore(score, name) {
  const safeName = name || "Friend";
  let title = "";
  let summary = "";
  let suggestionsHtml = "";

  // Note: Feel free to adjust the thresholds (<= 40, <= 70, etc.) and
  // the wording of the messages below. Personalise the bullet points to
  // better suit your audience or cultural context. Make sure to keep
  // the returned object keys (title, summary, suggestionsHtml) intact.

  if (score <= 40) {
    title = `${safeName}, your mind may be asking for extra care right now.`;
    summary =
      "Your responses suggest that stress, low mood, or tiredness might be making everyday life feel heavier than usual. This is a signal to slow down and reach out for support, not a verdict on who you are.";

    suggestionsHtml = `
      <div>
        <h3>Gentle steps you can take this week</h3>
        <ul>
          <li>Talk to someone you trust about how you’ve been feeling, even if it’s just a small moment of honesty.</li>
          <li>Try one tiny habit a day: a short walk, 5 mindful breaths, or writing down one feeling without judging it.</li>
          <li>If you can, consider speaking to a counselor, therapist, or campus support service.</li>
          <li>Notice critical self-talk and gently replace it with kinder, more realistic thoughts.</li>
        </ul>
      </div>
    `;
  } else if (score <= 70) {
    title = `${safeName}, you’re holding a lot—and mostly managing.`;
    summary =
      "Your answers show a mix of strengths and stress. You’re getting through your days, but there may be areas—like sleep, overwhelm, or emotional ups and downs—that could use a bit more care.";

    suggestionsHtml = `
      <div>
        <h3>Ideas to keep you steady and supported</h3>
        <ul>
          <li>Choose one daily anchor (e.g., a consistent bedtime, a 10-minute walk, or screen-free time before sleep).</li>
          <li>Check in with yourself once a day: “What am I feeling, and what do I need?”</li>
          <li>Set realistic boundaries around work or study time so rest isn’t optional.</li>
          <li>If something has been bothering you for more than a few weeks, consider talking to a professional.</li>
        </ul>
      </div>
    `;
  } else {
    title = `${safeName}, you seem fairly balanced right now.`;
    summary =
      "Your responses suggest that, overall, you’re coping in a way that works for you. That doesn’t mean everything is perfect—but you likely have strategies and support that are helping you stay grounded.";

    suggestionsHtml = `
      <div>
        <h3>Keep nurturing what’s working</h3>
        <ul>
          <li>Keep doing the small habits that support you—like movement, sleep routines, or time with people who matter.</li>
          <li>Notice what helps most on tougher days and treat those as your personal “go-to toolkit.”</li>
          <li>Consider checking in regularly with tools like MindMatrix to spot patterns early.</li>
          <li>Even when you feel okay, it’s still perfectly valid to seek support or talk things out.</li>
        </ul>
      </div>
    `;
  }

  return { title, summary, suggestionsHtml };
}

// ===============================
// RESTART FLOW
// ===============================
btnRestart.addEventListener("click", () => {
  // Reset responses & score
  responses.fill(null);
  finalScore = 0;
  scoreValueEl.textContent = "0";

  // Optionally clear form (comment out if you want form values kept)
  infoForm.reset();

  showScreen("welcomeScreen");
});
