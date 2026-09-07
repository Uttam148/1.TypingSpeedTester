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
let finished = false;
let interval;

let typedText = '';


// ----------------------------------
// WORD TARGETS
// ----------------------------------

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
        focusInput();

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

    console.time("createPassage");

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

    console.timeEnd("createPassage");

    console.time("render");

    render();

    console.timeEnd("render");
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
        } else if (i === typedText.length && !finished) {
            span.className = 'current';
        }

        text.appendChild(span);
    }
}


// ----------------------------------
// CALCULATE STATS
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
    if (started || finished) {
        return;
    }

    started = true;

    interval = setInterval(() => {
        timer--;

        timeEl.textContent = timer;

        stats();

        if (timer <= 0) {
            finishTest();
        }

    }, 1000);
}


// ----------------------------------
// HANDLE TYPING
// ----------------------------------

input.addEventListener('input', () => {
    if (finished) {
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
// BLOCK COPY / CUT / PASTE
// ----------------------------------

input.addEventListener('keydown', (event) => {

    if (
        (event.ctrlKey || event.metaKey) &&
        ['c', 'x', 'v', 'a'].includes(
            event.key.toLowerCase()
        )
    ) {
        event.preventDefault();
    }

    if (
        event.key === 'Enter' ||
        event.key === 'Tab'
    ) {
        event.preventDefault();
    }
});


input.addEventListener('paste', (event) => {
    event.preventDefault();
});


input.addEventListener('drop', (event) => {
    event.preventDefault();
});


input.addEventListener('dragover', (event) => {
    event.preventDefault();
});


// ----------------------------------
// FOCUS INPUT
// ----------------------------------

function focusInput() {
    if (!finished) {
        input.focus();
    }
}


// Click passage to start typing
text.addEventListener('click', () => {
    focusInput();
});


// ----------------------------------
// FINISH TEST
// ----------------------------------

function finishTest() {
    if (finished) {
        return;
    }

    finished = true;

    clearInterval(interval);

    input.disabled = true;

    const finalStats = stats();

    // Hide typing elements
    text.style.display = 'none';
    input.style.display = 'none';

    // Hide duration buttons
    const durationButtons =
        document.querySelector('.duration');

    if (durationButtons) {
        durationButtons.style.display = 'none';
    }

    // Create results
    const resultsScreen =
        document.createElement('div');

    resultsScreen.className =
        'results-screen';

    resultsScreen.innerHTML = `
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

    container.appendChild(resultsScreen);
}


// ----------------------------------
// RESTART
// ----------------------------------

restart.addEventListener('click', () => {
    window.location.reload();
});


// ----------------------------------
// CHANGE DURATION
// ----------------------------------

function setDuration(seconds) {
    if (started || finished) {
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
// LOAD DATA
// ----------------------------------

loadStories();