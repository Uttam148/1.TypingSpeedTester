const text = document.getElementById('text');
const input = document.getElementById('input');
const timeEl = document.getElementById('time');
const wpmEl = document.getElementById('wpm');
const accEl = document.getElementById('accuracy');
const restart = document.getElementById('restart');

let stories = [];
let paragraph = '';

let duration = 60;
let timer = duration;
let started = false;
let interval;

// Number of words needed for each test duration
const wordTargets = {
    15: 200,
    30: 400,
    60: 600,
    120: 900
};


// Load the ROCStories dataset
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


// Create a random continuous passage
function createPassage() {

    if (stories.length === 0) {
        return;
    }

    const targetWords = wordTargets[duration];

    const selectedStories = [];
    const usedIndexes = new Set();

    let wordCount = 0;

    while (wordCount < targetWords && usedIndexes.size < stories.length) {

        const randomIndex = Math.floor(Math.random() * stories.length);

        // Avoid using the same story twice
        if (usedIndexes.has(randomIndex)) {
            continue;
        }

        usedIndexes.add(randomIndex);

        const story = stories[randomIndex];

        selectedStories.push(story);

        wordCount += story.split(/\s+/).length;
    }

    // Join stories continuously
    paragraph = selectedStories.join(' ');

    render();
}


// Display the passage with character highlighting
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


// Calculate WPM and accuracy
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

    const wpm = Math.round((correct / 5) / minutes);

    const accuracy = typed
        ? Math.round((correct / typed) * 100)
        : 100;

    wpmEl.textContent = wpm;
    accEl.textContent = accuracy;
}


// Start timer
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
        }

    }, 1000);
}


// User typing
input.addEventListener('input', () => {

    start();

    render();

    stats();
});


// Restart the test
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


// Change test duration
function setDuration(seconds) {

    if (started) {
        return;
    }

    duration = seconds;

    timer = seconds;

    timeEl.textContent = timer;

    createPassage();
}


// Load dataset when the page opens
loadStories();