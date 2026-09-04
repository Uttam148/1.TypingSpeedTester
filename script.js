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

// Words required for each duration
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

        console.log('Stories loaded:', stories.length);

        createPassage();

    } catch (error) {
        console.error('Error loading stories:', error);

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

    // One continuous passage
    paragraph = selectedStories.join(' ');

    render();
}


// ----------------------------------
// DISPLAY PASSAGE
// ----------------------------------

function render() {

    const val = input.value;

    text.innerHTML = '';

    [...paragraph].forEach((ch, i) => {

        const span = document.createElement('span');

        span.textContent = ch;

        if (i < val.length) {

            if (val[i] === ch) {
                span.className = 'correct';
            } else {
                span.className = 'wrong';
            }

        } else if (i === val.length) {

            span.className = 'current';
        }

        text.appendChild(span);
    });
}


// ----------------------------------
// CALCULATE STATISTICS
// ----------------------------------

function stats() {

    const typed = input.value.length;

    let correct = 0;

    for (let i = 0; i < typed; i++) {

        if (input.value[i] === paragraph[i]) {
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
// START TEST
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
// SHOW RESULTS
// ----------------------------------

function showResults() {

    const finalStats = stats();

    container.innerHTML = `
        <div class="results-screen">

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

            <button id="resultRestart">
                Restart Test
            </button>

        </div>
    `;

    const resultRestart =
        document.getElementById('resultRestart');

    resultRestart.addEventListener('click', () => {

        // Reload the page and return to the start page
        window.location.reload();

    });
}


// ----------------------------------
// USER TYPING
// ----------------------------------

input.addEventListener('input', () => {

    start();

    render();

    stats();
});


// ----------------------------------
// ORIGINAL RESTART BUTTON
// ----------------------------------

restart.addEventListener('click', () => {

    clearInterval(interval);

    timer = duration;
    started = false;

    timeEl.textContent = duration;

    input.disabled = false;

    input.value = '';

    wpmEl.textContent = '0';

    accEl.textContent = '100';

    createPassage();

    input.focus();
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

    createPassage();
}


// ----------------------------------
// LOAD DATASET
// ----------------------------------

loadStories();
