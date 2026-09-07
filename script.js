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
// API
// ----------------------------------

const API_URL = 'https://typing-speed-api.onrender.com';


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
// LOAD STORIES FROM API
// ----------------------------------

async function loadStories() {
    try {

        // Request 20 random stories from the API
        const response = await fetch(
            `${API_URL}/stories?count=20`
        );

        if (!response.ok) {
            throw new Error('Could not load stories from API');
        }

        stories = await response.json();

        console.log(
            'Stories received from API:',
            stories.length
        );

        createPassage();

        focusInput();

    } catch (error) {

        console.error(
            'Error loading stories:',
            error
        );

        text.textContent =
            'Could not load typing passages.';
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

        const randomIndex =
            Math.floor(
                Math.random() * stories.length
            );


        if (usedIndexes.has(randomIndex)) {
            continue;
        }


        usedIndexes.add(randomIndex);


        const story = stories[randomIndex];

        selectedStories.push(story);

        wordCount +=
            story.split(/\s+/).length;
    }


    // Join stories into continuous text
    paragraph =
        selectedStories.join(' ');

    typedText = '';


    // Start passage from the top
    text.scrollTop = 0;


    render();
}


// ----------------------------------
// DISPLAY PASSAGE
// ----------------------------------

function render() {

    text.innerHTML = '';


    for (
        let i = 0;
        i < paragraph.length;
        i++
    ) {

        const span =
            document.createElement('span');


        span.textContent =
            paragraph[i];


        // Already typed characters
        if (i < typedText.length) {

            if (
                typedText[i] ===
                paragraph[i]
            ) {

                span.className =
                    'correct';

            } else {

                span.className =
                    'wrong';
            }
        }


        // Current character
        else if (
            i === typedText.length &&
            !finished
        ) {

            span.className =
                'current';
        }


        text.appendChild(span);
    }


    // Keep current character visible
    scrollToCurrentCharacter();
}


// ----------------------------------
// AUTOMATIC SCROLL
// ----------------------------------

function scrollToCurrentCharacter() {

    if (finished) {
        return;
    }


    const currentCharacter =
        text.querySelector('.current');


    if (!currentCharacter) {
        return;
    }


    const textRect =
        text.getBoundingClientRect();

    const characterRect =
        currentCharacter.getBoundingClientRect();


    // Current character is below
    // the visible area
    if (
        characterRect.bottom >
        textRect.bottom
    ) {

        text.scrollTop +=
            characterRect.bottom -
            textRect.bottom +
            28;
    }


    // Current character is above
    // the visible area
    else if (
        characterRect.top <
        textRect.top
    ) {

        text.scrollTop -=
            textRect.top -
            characterRect.top +
            28;
    }
}


// ----------------------------------
// CALCULATE STATS
// ----------------------------------

function stats() {

    const typed =
        typedText.length;

    let correct = 0;


    for (
        let i = 0;
        i < typed;
        i++
    ) {

        if (
            typedText[i] ===
            paragraph[i]
        ) {

            correct++;
        }
    }


    const elapsedSeconds =
        duration - timer;


    const minutes =
        elapsedSeconds / 60 || 1 / 60;


    const wpm =
        Math.round(
            (correct / 5) / minutes
        );


    const accuracy =
        typed
            ? Math.round(
                (correct / typed) * 100
            )
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


    interval =
        setInterval(() => {

            timer--;

            timeEl.textContent =
                timer;

            stats();


            if (timer <= 0) {
                finishTest();
            }

        }, 1000);
}


// ----------------------------------
// HANDLE TYPING
// ----------------------------------

input.addEventListener(
    'input',
    () => {

        if (finished) {
            return;
        }


        const newValue =
            input.value;


        if (
            !started &&
            newValue.length > 0
        ) {

            start();
        }


        typedText =
            newValue;


        render();

        stats();
    }
);


// ----------------------------------
// BLOCK COPY / CUT / PASTE
// ----------------------------------

input.addEventListener(
    'keydown',
    (event) => {

        if (
            (event.ctrlKey ||
                event.metaKey) &&
            [
                'c',
                'x',
                'v',
                'a'
            ].includes(
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
    }
);


input.addEventListener(
    'paste',
    (event) => {
        event.preventDefault();
    }
);


input.addEventListener(
    'drop',
    (event) => {
        event.preventDefault();
    }
);


input.addEventListener(
    'dragover',
    (event) => {
        event.preventDefault();
    }
);


// ----------------------------------
// FOCUS INPUT
// ----------------------------------

function focusInput() {

    if (!finished) {
        input.focus();
    }
}


// Click passage to focus input
text.addEventListener(
    'click',
    () => {
        focusInput();
    }
);


// Click anywhere in container
container.addEventListener(
    'click',
    (event) => {

        if (
            event.target.tagName ===
            'BUTTON'
        ) {
            return;
        }

        focusInput();
    }
);


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


    const finalStats =
        stats();


    // Hide typing elements
    text.style.display = 'none';

    input.style.display = 'none';


    // Hide duration buttons
    const durationButtons =
        document.querySelector(
            '.duration'
        );


    if (durationButtons) {
        durationButtons.style.display =
            'none';
    }


    // Create results screen
    const resultsScreen =
        document.createElement(
            'div'
        );


    resultsScreen.className =
        'results-screen';


    resultsScreen.innerHTML = `
        <h1>Test Complete!</h1>

        <div class="results-card">

            <div class="result-item">
                <span>WPM</span>
                <strong>
                    ${finalStats.wpm}
                </strong>
            </div>

            <div class="result-item">
                <span>Accuracy</span>
                <strong>
                    ${finalStats.accuracy}%
                </strong>
            </div>

        </div>
    `;


    container.appendChild(
        resultsScreen
    );
}


// ----------------------------------
// RESTART
// ----------------------------------

restart.addEventListener(
    'click',
    () => {
        window.location.reload();
    }
);


// ----------------------------------
// CHANGE DURATION
// ----------------------------------

function setDuration(seconds) {

    if (started || finished) {
        return;
    }


    duration = seconds;

    timer = seconds;


    timeEl.textContent =
        timer;


    wpmEl.textContent =
        '0';


    accEl.textContent =
        '100';


    createPassage();

    focusInput();
}


// ----------------------------------
// LOAD DATA
// ----------------------------------

loadStories();
