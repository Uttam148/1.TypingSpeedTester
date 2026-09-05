const text = document.getElementById('text');
const timeEl = document.getElementById('time');
const wpmEl = document.getElementById('wpm');
const accEl = document.getElementById('accuracy');
const container = document.querySelector('.container');

let stories = [];
let paragraph = '';

let duration = 60;
let timer = duration;
let started = false;
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

            showResults();
        }

    }, 1000);
}


// ----------------------------------
// HANDLE KEYBOARD INPUT
// ----------------------------------

document.addEventListener('keydown', (event) => {

    // Do not allow paste using Ctrl+V or Cmd+V
    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'v'
    ) {

        event.preventDefault();

        return;
    }


    // Prevent cut, copy and select-all shortcuts
    if (
        (event.ctrlKey || event.metaKey) &&
        ['c', 'x', 'a'].includes(event.key.toLowerCase())
    ) {

        event.preventDefault();

        return;
    }


    // Ignore keys when the result screen is displayed
    if (!paragraph || timer <= 0) {
        return;
    }


    // Ignore keyboard shortcuts
    if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
    ) {
        return;
    }


    // Backspace
    if (event.key === 'Backspace') {

        event.preventDefault();

        if (typedText.length > 0) {
            typedText = typedText.slice(0, -1);
        }

        render();

        stats();

        return;
    }


    // Ignore Enter
    if (event.key === 'Enter') {

        event.preventDefault();

        return;
    }


    // Ignore Tab
    if (event.key === 'Tab') {

        event.preventDefault();

        return;
    }


    // Only accept normal printable characters
    if (event.key.length === 1) {

        event.preventDefault();

        // Start the timer on the first character
        start();


        // Add typed character
        typedText += event.key;


        render();

        stats();
    }
});


// ----------------------------------
// PREVENT PASTE
// ----------------------------------

document.addEventListener('paste', (event) => {

    event.preventDefault();

    console.log('Paste is disabled during the typing test.');
});


// ----------------------------------
// PREVENT DROP
// ----------------------------------

document.addEventListener('drop', (event) => {

    event.preventDefault();
});

document.addEventListener('dragover', (event) => {

    event.preventDefault();
});


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

        window.location.reload();

    });
}


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
}


// ----------------------------------
// LOAD DATA
// ----------------------------------

loadStories();