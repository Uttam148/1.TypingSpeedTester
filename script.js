const text = document.getElementById('text');
const input = document.getElementById('input');
const timeEl = document.getElementById('time');
const wpmEl = document.getElementById('wpm');
const accEl = document.getElementById('accuracy');
const restart = document.getElementById('restart');
const container = document.querySelector('.container');

let stories = [];
let paragraph = '';

let duration = 60;
let timer = duration;
let started = false;
let interval;

let typedText = '';

const wordTargets = {
    15: 200,
    30: 400,
    60: 600,
    120: 900
};


// ----------------------------------
// LOAD STORIES
// ----------------------------------

async function loadStories() {

    try {

        const response = await fetch('passages.json');

        if (!response.ok) {
            throw new Error('Could not load passages.json');
        }

        stories = await response.json();

        createPassage();
        focusInput();

    } catch (error) {

        console.error(error);

        text.textContent = 'Could not load typing passages.';
    }
}


// ----------------------------------
// CREATE RANDOM PASSAGE
// ----------------------------------

function createPassage() {

    if (stories.length === 0) {
        return;
    }

    const targetWords = wordTargets[duration];

    const selectedStories = [];
    const usedIndexes = new Set();

    let wordCount = 0;

    while (
        wordCount < targetWords &&
        usedIndexes.size < stories.length
    ) {

        const randomIndex = Math.floor(
            Math.random() * stories.length
        );

        if (usedIndexes.has(randomIndex)) {
            continue;
        }

        usedIndexes.add(randomIndex);

        const story = stories[randomIndex];

        selectedStories.push(story);

        wordCount += story.split(/\s+/).length;
    }

    paragraph = selectedStories.join(' ');

    typedText = '';

    render();
}


// ----------------------------------
// DISPLAY PASSAGE
// ----------------------------------

function render() {

    text.innerHTML = '';

    for (let i = 0; i < paragraph.length; i++) {

        const span = document.createElement('span');

        span.textContent = paragraph[i];

        if (i < typedText.length) {

            if (typedText[i] === paragraph[i]) {
                span.className = 'correct';
            } else {
                span.className = 'wrong';
            }

        } else if (i === typedText.length) {

            span.className = 'current';
        }

        text.appendChild(span);
    }
}


// ----------------------------------
// CALCULATE STATISTICS
// ----------------------------------

function stats() {

    const typed = typedText.length;

    let correct = 0;

    for (let i = 0; i < typed; i++) {

        if (typedText[i] === paragraph[i]) {
            correct++;
        }
    }

    const elapsedSeconds = duration - timer;

    const minutes = elapsedSeconds / 60 || 1 / 60;

    const wpm = Math.round(
        (correct / 5) / minutes
    );

    const accuracy = typed
        ? Math.round((correct / typed) * 100)
        : 100;

    wpmEl.textContent = wpm;
    accEl.textContent = accuracy;

    return {
        wpm,
        accuracy
    };
}


// ----------------------------------
// START TIMER
// ----------------------------------

function start() {

    if (started) {
        return;
    }

    started = true;

    interval = setInterval(() => {

        timer--;

        timeEl.textContent = timer;

        stats();

        if (timer <= 0) {

            clearInterval(interval);

            input.disabled = true;

            showResults();
        }

    }, 1000);
}


// ----------------------------------
// HANDLE TYPING
// ----------------------------------

input.addEventListener('input', () => {

    if (timer <= 0) {
        return;
    }

    const newValue = input.value;

    if (!started && newValue.length > 0) {
        start();
    }

    typedText = newValue;

    render();

    stats();
});


// ----------------------------------
// KEYBOARD CONTROLS
// ----------------------------------

input.addEventListener('keydown', (event) => {

    if (event.key === 'Enter') {
        event.preventDefault();
    }

    if (
        (event.ctrlKey || event.metaKey) &&
        ['c', 'x', 'v'].includes(event.key.toLowerCase())
    ) {
        event.preventDefault();
    }
});


// ----------------------------------
// BLOCK PASTE
// ----------------------------------

input.addEventListener('paste', (event) => {
    event.preventDefault();
});


// ----------------------------------
// BLOCK DROP
// ----------------------------------

input.addEventListener('drop', (event) => {
    event.preventDefault();
});

input.addEventListener('dragover', (event) => {
    event.preventDefault();
});


// ----------------------------------
// KEEP INPUT FOCUSED
// ----------------------------------

function focusInput() {
    input.focus();
}

text.addEventListener('click', () => {
    focusInput();
});

container.addEventListener('click', () => {
    focusInput();
});


// ----------------------------------
// RESTART TEST
// ----------------------------------

restart.addEventListener('click', () => {

    clearInterval(interval);

    timer = duration;
    started = false;

    typedText = '';

    timeEl.textContent = duration;

    wpmEl.textContent = '0';

    accEl.textContent = '100';

    input.disabled = false;

    createPassage();

    focusInput();
});


// ----------------------------------
// CHANGE DURATION
// ----------------------------------

function setDuration(seconds) {

    if (started) {
        return;
    }

    duration = seconds;

    timer = seconds;

    timeEl.textContent = timer;

    wpmEl.textContent = '0';

    accEl.textContent = '100';

    createPassage();

    focusInput();
}


// ----------------------------------
// SHOW RESULTS
// ----------------------------------

function showResults() {

    const finalStats = stats();

    // Keep the Restart button visible
    const results = document.createElement('div');

    results.className = 'results-screen';

    results.innerHTML = `
        <h1>Test Complete!</h1>

        <div class="results-card">

            <div class="result-item">
                <span>WPM</span>
                <strong>${finalStats.wpm}</strong>
            </div>

            <div class="result-item">
                <span>Accuracy</span>
                <strong>${finalStats.accuracy}%</strong>
            </div>

        </div>
    `;

    // Hide the typing elements
    text.style.display = 'none';
    input.style.display = 'none';

    // Hide duration buttons
    const durationButtons = document.querySelector('.duration');

    if (durationButtons) {
        durationButtons.style.display = 'none';
    }

    // Add results above the existing Restart button
    container.appendChild(results);
}


// ----------------------------------
// LOAD DATA
// ----------------------------------

loadStories();