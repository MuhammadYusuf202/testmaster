/**
 * TestMaster - Educational Testing Platform
 * Complete JavaScript Implementation
 * 
 * Features:
 * - Parse test.txt file with custom format
 * - Support for single (radio) and multiple (checkbox) correct answers
 * - Question and answer shuffling
 * - Skip queue management
 * - Timer functionality
 * - Detailed results and review
 */

// ============================================
// Global State Management
// ============================================

const AppState = {
    // Question pool
    allQuestions: [],
    
    // Current test session
    currentQuestions: [],
    currentQuestionIndex: 0,
    
    // Answer tracking
    userAnswers: [], // Array of { questionIndex, selectedAnswers[], isCorrect }
    
    // Skip queue
    skippedQuestions: [],
    isReviewingSkipped: false,
    
    // Statistics
    score: 0,
    answeredCount: 0,
    
    // Timer
    timerInterval: null,
    startTime: null,
    elapsedSeconds: 0,
    
    // UI State
    isTestActive: false,
    allQuestionsAnswered: false
};

// ============================================
// DOM Elements Cache
// ============================================

const DOM = {
    // Screens
    welcomeScreen: null,
    testScreen: null,
    resultsScreen: null,
    
    // Welcome elements
    btn25Tests: null,
    btnAllTests: null,
    testInfo: null,
    allQuestionsCount: null,
    errorMessage: null,
    
    // Test elements
    questionsCompleted: null,
    totalQuestions: null,
    currentScore: null,
    timer: null,
    progressBar: null,
    skipIndicator: null,
    skippedCount: null,
    questionNumber: null,
    questionType: null,
    questionText: null,
    answersSection: null,
    btnSkip: null,
    btnSubmit: null,
    finishSection: null,
    btnFinish: null,
    
    // Results elements
    finalTime: null,
    correctCount: null,
    incorrectCount: null,
    percentageScore: null,
    scoreProgress: null,
    scoreText: null,
    scoreGrade: null,
    btnDetails: null,
    btnRestart: null,
    detailsSection: null,
    detailsList: null,
    
    // Tabs
    tabTesting: null,
    tabResults: null
};

// ============================================
// Initialization
// ============================================

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    cacheDOM();
    attachEventListeners();
    loadTestFile();
});

/**
 * Cache all DOM elements for performance
 */
function cacheDOM() {
    // Screens
    DOM.welcomeScreen = document.getElementById('welcomeScreen');
    DOM.testScreen = document.getElementById('testScreen');
    DOM.resultsScreen = document.getElementById('resultsScreen');
    
    // Welcome elements
    DOM.btn25Tests = document.getElementById('btn25Tests');
    DOM.btnAllTests = document.getElementById('btnAllTests');
    DOM.testInfo = document.getElementById('testInfo');
    DOM.allQuestionsCount = document.getElementById('allQuestionsCount');
    DOM.errorMessage = document.getElementById('errorMessage');
    
    // Test elements
    DOM.questionsCompleted = document.getElementById('questionsCompleted');
    DOM.totalQuestions = document.getElementById('totalQuestions');
    DOM.currentScore = document.getElementById('currentScore');
    DOM.timer = document.getElementById('timer');
    DOM.progressBar = document.getElementById('progressBar');
    DOM.skipIndicator = document.getElementById('skipIndicator');
    DOM.skippedCount = document.getElementById('skippedCount');
    DOM.questionNumber = document.getElementById('questionNumber');
    DOM.questionType = document.getElementById('questionType');
    DOM.questionText = document.getElementById('questionText');
    DOM.answersSection = document.getElementById('answersSection');
    DOM.btnSkip = document.getElementById('btnSkip');
    DOM.btnSubmit = document.getElementById('btnSubmit');
    DOM.finishSection = document.getElementById('finishSection');
    DOM.btnFinish = document.getElementById('btnFinish');
    
    // Results elements
    DOM.finalTime = document.getElementById('finalTime');
    DOM.correctCount = document.getElementById('correctCount');
    DOM.incorrectCount = document.getElementById('incorrectCount');
    DOM.percentageScore = document.getElementById('percentageScore');
    DOM.scoreProgress = document.getElementById('scoreProgress');
    DOM.scoreText = document.getElementById('scoreText');
    DOM.scoreGrade = document.getElementById('scoreGrade');
    DOM.btnDetails = document.getElementById('btnDetails');
    DOM.btnRestart = document.getElementById('btnRestart');
    DOM.detailsSection = document.getElementById('detailsSection');
    DOM.detailsList = document.getElementById('detailsList');
    
    // Tabs
    DOM.tabTesting = document.getElementById('tabTesting');
    DOM.tabResults = document.getElementById('tabResults');
}

/**
 * Attach all event listeners
 */
function attachEventListeners() {
    // Mode selection buttons
    DOM.btn25Tests.addEventListener('click', () => startTest(25));
    DOM.btnAllTests.addEventListener('click', () => startTest(null));
    
    // Test navigation buttons
    DOM.btnSkip.addEventListener('click', skipQuestion);
    DOM.btnSubmit.addEventListener('click', submitAnswer);
    DOM.btnFinish.addEventListener('click', finishTest);
    
    // Results buttons
    DOM.btnDetails.addEventListener('click', toggleDetails);
    DOM.btnRestart.addEventListener('click', restartApp);
    
    // Tab navigation (visual only)
    DOM.tabTesting.addEventListener('click', () => {
        if (AppState.isTestActive) {
            switchScreen('test');
        } else {
            switchScreen('welcome');
        }
    });
    
    DOM.tabResults.addEventListener('click', () => {
        if (AppState.allQuestionsAnswered) {
            switchScreen('results');
        }
    });
}

// ============================================
// File Loading & Parsing
// ============================================

/**
 * Load and parse the test.txt file
 */
async function loadTestFile() {
    try {
        const response = await fetch('test.txt');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        parseTestFile(text);
        
        // Update UI after successful load
        updateTestInfo();
        enableModeButtons();
        
    } catch (error) {
        console.error('Error loading test file:', error);
        showError('Ошибка загрузки файла test.txt. Убедитесь, что файл находится в корневой директории.');
    }
}

/**
 * Parse the test file content into question objects
 * Format:
 * ? Question text
 * = Wrong answer 1
 * + Correct answer 1
 * = Wrong answer 2
 * + Correct answer 2 (optional, for multiple correct)
 * 
 * @param {string} content - Raw text content of the file
 */
function parseTestFile(content) {
    const lines = content.split('\n');
    let currentQuestion = null;
    
    AppState.allQuestions = [];
    
    for (let line of lines) {
        // Trim whitespace but preserve the prefix
        line = line.trim();
        
        if (!line) continue; // Skip empty lines
        
        const prefix = line.charAt(0);
        const text = line.substring(1).trim();
        
        switch (prefix) {
            case '?':
                // Save previous question if exists
                if (currentQuestion && currentQuestion.answers.length > 0) {
                    AppState.allQuestions.push(currentQuestion);
                }
                
                // Start new question
                currentQuestion = {
                    id: AppState.allQuestions.length,
                    text: text,
                    answers: [],
                    correctAnswers: [],
                    isMultiple: false
                };
                break;
                
            case '=':
                // Incorrect answer
                if (currentQuestion) {
                    currentQuestion.answers.push({
                        text: text,
                        isCorrect: false
                    });
                }
                break;
                
            case '+':
                // Correct answer
                if (currentQuestion) {
                    const answerIndex = currentQuestion.answers.length;
                    currentQuestion.answers.push({
                        text: text,
                        isCorrect: true
                    });
                    currentQuestion.correctAnswers.push(answerIndex);
                    
                    // Check if multiple correct answers
                    if (currentQuestion.correctAnswers.length > 1) {
                        currentQuestion.isMultiple = true;
                    }
                }
                break;
        }
    }
    
    // Don't forget the last question
    if (currentQuestion && currentQuestion.answers.length > 0) {
        AppState.allQuestions.push(currentQuestion);
    }
    
    console.log(`Parsed ${AppState.allQuestions.length} questions`);
}

/**
 * Update the test info display on welcome screen
 */
function updateTestInfo() {
    const count = AppState.allQuestions.length;
    
    DOM.testInfo.innerHTML = `
        <div class="info-card">
            <span class="info-icon">📚</span>
            <span class="info-text">Загружено вопросов: <strong>${count}</strong></span>
        </div>
    `;
    
    DOM.allQuestionsCount.textContent = count;
}

/**
 * Enable mode selection buttons
 */
function enableModeButtons() {
    const count = AppState.allQuestions.length;
    
    if (count >= 25) {
        DOM.btn25Tests.disabled = false;
    }
    
    if (count > 0) {
        DOM.btnAllTests.disabled = false;
    }
}

/**
 * Show error message on welcome screen
 * @param {string} message - Error message to display
 */
function showError(message) {
    DOM.errorMessage.textContent = message;
    DOM.errorMessage.classList.add('show');
}

// ============================================
// Test Session Management
// ============================================

/**
 * Start a new test session
 * @param {number|null} count - Number of questions (null for all)
 */
function startTest(count) {
    // Reset state
    resetTestState();
    
    // Prepare questions
    let questions = [...AppState.allQuestions];
    
    // Shuffle all questions
    shuffleArray(questions);
    
    // Take subset if needed
    if (count !== null && count < questions.length) {
        questions = questions.slice(0, count);
    }
    
    // Shuffle answers within each question (create deep copy)
    AppState.currentQuestions = questions.map((q, index) => {
        const shuffledAnswers = [...q.answers];
        shuffleArray(shuffledAnswers);
        
        // Update correct answer indices after shuffle
        const newCorrectIndices = shuffledAnswers
            .map((a, i) => a.isCorrect ? i : -1)
            .filter(i => i !== -1);
        
        return {
            ...q,
            originalIndex: q.id,
            sessionIndex: index,
            answers: shuffledAnswers,
            correctAnswers: newCorrectIndices
        };
    });
    
    // Initialize user answers array
    AppState.userAnswers = new Array(AppState.currentQuestions.length).fill(null);
    
    // Update UI
    DOM.totalQuestions.textContent = AppState.currentQuestions.length;
    
    // Start timer
    startTimer();
    
    // Show first question
    AppState.isTestActive = true;
    showQuestion(0);
    switchScreen('test');
    updateTabs('testing');
}

/**
 * Reset test state for new session
 */
function resetTestState() {
    AppState.currentQuestions = [];
    AppState.currentQuestionIndex = 0;
    AppState.userAnswers = [];
    AppState.skippedQuestions = [];
    AppState.isReviewingSkipped = false;
    AppState.score = 0;
    AppState.answeredCount = 0;
    AppState.elapsedSeconds = 0;
    AppState.isTestActive = false;
    AppState.allQuestionsAnswered = false;
    
    // Stop any existing timer
    if (AppState.timerInterval) {
        clearInterval(AppState.timerInterval);
        AppState.timerInterval = null;
    }
    
    // Reset UI
    DOM.progressBar.style.width = '0%';
    DOM.questionsCompleted.textContent = '0';
    DOM.currentScore.textContent = '0';
    DOM.timer.textContent = '00:00:00';
    DOM.skippedCount.textContent = '0';
    DOM.finishSection.classList.remove('show');
    DOM.detailsSection.classList.remove('show');
}

/**
 * Shuffle array in place using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ============================================
// Question Display
// ============================================

/**
 * Display a question
 * @param {number} index - Index in currentQuestions array
 */
function showQuestion(index) {
    const question = AppState.currentQuestions[index];
    AppState.currentQuestionIndex = index;
    
    // Update question header
    const displayNumber = AppState.isReviewingSkipped 
        ? `Повторный просмотр - Вопрос ${question.sessionIndex + 1}`
        : `Вопрос ${index + 1}`;
    
    DOM.questionNumber.textContent = displayNumber;
    
    // Set question type indicator
    DOM.questionType.textContent = question.isMultiple 
        ? '📝 Несколько ответов' 
        : '📝 Один ответ';
    
    // Set question text
    DOM.questionText.textContent = question.text;
    
    // Generate answer options
    generateAnswerOptions(question);
    
    // Reset submit button
    DOM.btnSubmit.disabled = true;
    
    // Update skip button visibility
    updateSkipButtonState();
}

/**
 * Generate answer option elements
 * @param {Object} question - Question object
 */
function generateAnswerOptions(question) {
    DOM.answersSection.innerHTML = '';
    
    const inputType = question.isMultiple ? 'checkbox' : 'radio';
    
    question.answers.forEach((answer, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'answer-option';
        optionDiv.dataset.index = index;
        
        const inputId = `answer_${index}`;
        
        optionDiv.innerHTML = `
            <input type="${inputType}" 
                   id="${inputId}" 
                   name="answer" 
                   value="${index}">
            <label for="${inputId}" class="answer-text">${answer.text}</label>
        `;
        
        // Click handler for the entire option
        optionDiv.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                const input = optionDiv.querySelector('input');
                
                if (inputType === 'radio') {
                    // Uncheck all others for radio
                    document.querySelectorAll('.answer-option input[type="radio"]')
                        .forEach(r => r.checked = false);
                    input.checked = true;
                } else {
                    input.checked = !input.checked;
                }
            }
            
            updateAnswerSelection();
            checkSubmitButtonState();
        });
        
        DOM.answersSection.appendChild(optionDiv);
    });
}

/**
 * Update visual selection state of answers
 */
function updateAnswerSelection() {
    document.querySelectorAll('.answer-option').forEach(option => {
        const input = option.querySelector('input');
        option.classList.toggle('selected', input.checked);
    });
}

/**
 * Check if submit button should be enabled
 */
function checkSubmitButtonState() {
    const hasSelection = document.querySelectorAll('.answer-option input:checked').length > 0;
    DOM.btnSubmit.disabled = !hasSelection;
}

/**
 * Update skip button state
 */
function updateSkipButtonState() {
    // Hide skip button if this is the last question (no more to skip to)
    const remainingQuestions = AppState.currentQuestions.length - AppState.answeredCount;
    const skippedRemaining = AppState.skippedQuestions.length;
    
    if (AppState.isReviewingSkipped && skippedRemaining <= 1) {
        DOM.btnSkip.style.display = 'none';
    } else {
        DOM.btnSkip.style.display = 'flex';
    }
}

// ============================================
// Answer Submission & Navigation
// ============================================

/**
 * Submit the current answer
 */
function submitAnswer() {
    const question = AppState.currentQuestions[AppState.currentQuestionIndex];
    
    // Get selected answers
    const selectedInputs = document.querySelectorAll('.answer-option input:checked');
    const selectedIndices = Array.from(selectedInputs).map(input => parseInt(input.value));
    
    // Check if correct
    const isCorrect = checkAnswer(question, selectedIndices);
    
    // Store answer
    AppState.userAnswers[AppState.currentQuestionIndex] = {
        questionIndex: AppState.currentQuestionIndex,
        selectedAnswers: selectedIndices,
        isCorrect: isCorrect
    };
    
    // Update score
    if (isCorrect) {
        AppState.score++;
        DOM.currentScore.textContent = AppState.score;
    }
    
    // Update answered count
    AppState.answeredCount++;
    DOM.questionsCompleted.textContent = AppState.answeredCount;
    
    // Update progress bar
    const progress = (AppState.answeredCount / AppState.currentQuestions.length) * 100;
    DOM.progressBar.style.width = `${progress}%`;
    
    // Remove from skipped queue if was there
    if (AppState.isReviewingSkipped) {
        const skipIndex = AppState.skippedQuestions.indexOf(AppState.currentQuestionIndex);
        if (skipIndex !== -1) {
            AppState.skippedQuestions.splice(skipIndex, 1);
            DOM.skippedCount.textContent = AppState.skippedQuestions.length;
        }
    }
    
    // Move to next question or handle completion
    goToNextQuestion();
}

/**
 * Check if selected answers are correct
 * @param {Object} question - Question object
 * @param {Array} selectedIndices - Array of selected answer indices
 * @returns {boolean} - True if answer is correct
 */
function checkAnswer(question, selectedIndices) {
    const correctIndices = question.correctAnswers;
    
    // Must have same number of answers
    if (selectedIndices.length !== correctIndices.length) {
        return false;
    }
    
    // Sort both arrays for comparison
    const sortedSelected = [...selectedIndices].sort((a, b) => a - b);
    const sortedCorrect = [...correctIndices].sort((a, b) => a - b);
    
    // Compare each element
    return sortedSelected.every((val, i) => val === sortedCorrect[i]);
}

/**
 * Skip the current question
 */
function skipQuestion() {
    // Add to skipped queue if not already there
    if (!AppState.skippedQuestions.includes(AppState.currentQuestionIndex)) {
        AppState.skippedQuestions.push(AppState.currentQuestionIndex);
        DOM.skippedCount.textContent = AppState.skippedQuestions.length;
    }
    
    // Move to next question
    goToNextQuestion();
}

/**
 * Navigate to the next question
 */
function goToNextQuestion() {
    // Check if there are more questions in the main deck
    if (!AppState.isReviewingSkipped) {
        // Find next unanswered question in main deck
        for (let i = AppState.currentQuestionIndex + 1; i < AppState.currentQuestions.length; i++) {
            if (AppState.userAnswers[i] === null && !AppState.skippedQuestions.includes(i)) {
                showQuestion(i);
                return;
            }
        }
        
        // Check from beginning
        for (let i = 0; i < AppState.currentQuestionIndex; i++) {
            if (AppState.userAnswers[i] === null && !AppState.skippedQuestions.includes(i)) {
                showQuestion(i);
                return;
            }
        }
        
        // No more in main deck, check skipped queue
        if (AppState.skippedQuestions.length > 0) {
            AppState.isReviewingSkipped = true;
            showQuestion(AppState.skippedQuestions[0]);
            return;
        }
    } else {
        // In review mode, go to next skipped question
        if (AppState.skippedQuestions.length > 0) {
            showQuestion(AppState.skippedQuestions[0]);
            return;
        }
    }
    
    // All questions answered
    AppState.allQuestionsAnswered = true;
    DOM.finishSection.classList.add('show');
    
    // Hide skip button and disable submit
    DOM.btnSkip.style.display = 'none';
    DOM.btnSubmit.disabled = true;
}

/**
 * Finish the test and show results
 */
function finishTest() {
    // Stop timer
    stopTimer();
    
    // Mark test as inactive
    AppState.isTestActive = false;
    
    // Calculate and display results
    displayResults();
    
    // Switch to results screen
    switchScreen('results');
    updateTabs('results');
}

// ============================================
// Timer Functions
// ============================================

/**
 * Start the timer
 */
function startTimer() {
    AppState.startTime = Date.now();
    AppState.elapsedSeconds = 0;
    
    AppState.timerInterval = setInterval(() => {
        AppState.elapsedSeconds++;
        DOM.timer.textContent = formatTime(AppState.elapsedSeconds);
    }, 1000);
}

/**
 * Stop the timer
 */
function stopTimer() {
    if (AppState.timerInterval) {
        clearInterval(AppState.timerInterval);
        AppState.timerInterval = null;
    }
}

/**
 * Format seconds to HH:MM:SS
 * @param {number} totalSeconds - Total seconds to format
 * @returns {string} - Formatted time string
 */
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [hours, minutes, seconds]
        .map(v => v.toString().padStart(2, '0'))
        .join(':');
}

// ============================================
// Results Display
// ============================================

/**
 * Display test results
 */
function displayResults() {
    const totalQuestions = AppState.currentQuestions.length;
    const correctAnswers = AppState.score;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Update stats
    DOM.finalTime.textContent = formatTime(AppState.elapsedSeconds);
    DOM.correctCount.textContent = correctAnswers;
    DOM.incorrectCount.textContent = incorrectAnswers;
    DOM.percentageScore.textContent = `${percentage}%`;
    
    // Update score circle
    DOM.scoreText.textContent = `${percentage}%`;
    
    // Animate the circle progress
    const circumference = 2 * Math.PI * 45; // radius is 45
    const offset = circumference - (percentage / 100) * circumference;
    
    setTimeout(() => {
        DOM.scoreProgress.style.strokeDashoffset = offset;
        
        // Update color based on score
        if (percentage >= 80) {
            DOM.scoreProgress.style.stroke = '#4caf50'; // Green
        } else if (percentage >= 60) {
            DOM.scoreProgress.style.stroke = '#ff9800'; // Orange
        } else {
            DOM.scoreProgress.style.stroke = '#f44336'; // Red
        }
    }, 100);
    
    // Set grade
    DOM.scoreGrade.textContent = getGrade(percentage);
    DOM.scoreGrade.style.color = getGradeColor(percentage);
}

/**
 * Get grade text based on percentage
 * @param {number} percentage - Score percentage
 * @returns {string} - Grade text
 */
function getGrade(percentage) {
    if (percentage >= 90) return 'Отлично! 🌟';
    if (percentage >= 80) return 'Хорошо! 👍';
    if (percentage >= 70) return 'Неплохо! 📚';
    if (percentage >= 60) return 'Удовлетворительно 📝';
    return 'Нужно подучить материал 📖';
}

/**
 * Get grade color based on percentage
 * @param {number} percentage - Score percentage
 * @returns {string} - CSS color value
 */
function getGradeColor(percentage) {
    if (percentage >= 80) return '#4caf50';
    if (percentage >= 60) return '#ff9800';
    return '#f44336';
}

/**
 * Toggle the details section visibility
 */
function toggleDetails() {
    const isShown = DOM.detailsSection.classList.contains('show');
    
    if (!isShown) {
        generateDetailsList();
    }
    
    DOM.detailsSection.classList.toggle('show');
    DOM.btnDetails.innerHTML = isShown 
        ? '<span class="btn-icon">📋</span> Подробнее'
        : '<span class="btn-icon">📋</span> Скрыть детали';
}

/**
 * Generate the detailed review list
 */
function generateDetailsList() {
    DOM.detailsList.innerHTML = '';
    
    AppState.currentQuestions.forEach((question, index) => {
        const userAnswer = AppState.userAnswers[index];
        const isCorrect = userAnswer ? userAnswer.isCorrect : false;
        
        const detailItem = document.createElement('div');
        detailItem.className = `detail-item ${isCorrect ? 'correct' : 'incorrect'}`;
        
        // Build answers HTML
        let answersHTML = '';
        question.answers.forEach((answer, ansIndex) => {
            const wasSelected = userAnswer && userAnswer.selectedAnswers.includes(ansIndex);
            const isCorrectAnswer = answer.isCorrect;
            
            let answerClass = '';
            let marker = '';
            
            if (wasSelected && isCorrectAnswer) {
                answerClass = 'user-correct';
                marker = '✅';
            } else if (wasSelected && !isCorrectAnswer) {
                answerClass = 'user-wrong';
                marker = '❌';
            } else if (isCorrectAnswer && !isCorrect) {
                answerClass = 'correct-answer';
                marker = '✓';
            } else {
                marker = '○';
            }
            
            answersHTML += `
                <div class="detail-answer ${answerClass}">
                    <span class="answer-marker">${marker}</span>
                    <span>${answer.text}</span>
                </div>
            `;
        });
        
        detailItem.innerHTML = `
            <div class="detail-header">
                <span class="detail-number">Вопрос ${index + 1}</span>
                <span class="detail-status ${isCorrect ? 'correct' : 'incorrect'}">
                    ${isCorrect ? '✅ Правильно' : '❌ Неправильно'}
                </span>
            </div>
            <div class="detail-question">${question.text}</div>
            <div class="detail-answers">${answersHTML}</div>
        `;
        
        DOM.detailsList.appendChild(detailItem);
    });
}

// ============================================
// Navigation & UI Helpers
// ============================================

/**
 * Switch between screens
 * @param {string} screen - Screen name ('welcome', 'test', 'results')
 */
function switchScreen(screen) {
    // Hide all screens
    DOM.welcomeScreen.classList.remove('active');
    DOM.testScreen.classList.remove('active');
    DOM.resultsScreen.classList.remove('active');
    
    // Show selected screen
    switch (screen) {
        case 'welcome':
            DOM.welcomeScreen.classList.add('active');
            break;
        case 'test':
            DOM.testScreen.classList.add('active');
            break;
        case 'results':
            DOM.resultsScreen.classList.add('active');
            break;
    }
}

/**
 * Update tab visual states
 * @param {string} activeTab - Active tab ('testing', 'results')
 */
function updateTabs(activeTab) {
    DOM.tabTesting.classList.toggle('active', activeTab === 'testing');
    DOM.tabResults.classList.toggle('active', activeTab === 'results');
}

/**
 * Restart the application
 */
function restartApp() {
    resetTestState();
    switchScreen('welcome');
    updateTabs('testing');
}

// ============================================
// Utility Functions
// ============================================

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
