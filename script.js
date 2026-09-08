const text = document.getElementById('text');
const input = document.getElementById('input');
const timeEl = document.getElementById('time');
const wpmEl = document.getElementById('wpm');
const accEl = document.getElementById('accuracy');
const restart = document.getElementById('restart');
const container = document.querySelector('.container');

let paragraph = '';

let duration = 60;
let timer = duration;
let started = false;
let finished = false;
let interval;

let typedText = '';

const API_URL = 'https://typing-speed-api.onrender.com';

const wordTargets = {
    15: 200,
    30: 400,
    60: 600,
    120: 900
};


async function loadPassage() {

    try {

        const targetWords =
            wordTargets[duration];

        const response = await fetch(
            `${API_URL}/passage?words=${targetWords}`
        );

        if (!response.ok) {
            throw new Error(
                'Could not load passage from API'
            );
        }

        const data =
            await response.json();

        paragraph =
            data.passage;

        console.log(
            'Passage received:',
            data.wordCount,
            'words'
        );

        typedText = '';

        text.scrollTop = 0;

        render();

        focusInput();

    } catch (error) {

        console.error(
            'Error loading passage:',
            error
        );

        text.textContent =
            'Could not load typing passage.';
    }
}


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

        } else if (
            i === typedText.length &&
            !finished
        ) {

            span.className =
                'current';
        }

        text.appendChild(span);
    }

    scrollToCurrentCharacter();
}


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

    if (
        characterRect.bottom >
        textRect.bottom
    ) {

        text.scrollTop +=
            characterRect.bottom -
            textRect.bottom +
            28;

    } else if (
        characterRect.top <
        textRect.top
    ) {

        text.scrollTop -=
            textRect.top -
            characterRect.top +
            28;
    }
}


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

    wpmEl.textContent =
        wpm;

    accEl.textContent =
        accuracy;

    return {
        wpm,
        accuracy
    };
}


function start() {

    if (
        started ||
        finished
    ) {
        return;
    }

    started = true;

    interval =
        setInterval(() => {

            timer--;

            timeEl.textContent =
                timer;

            stats();

            if (
                timer <= 0
            ) {

                finishTest();
            }

        }, 1000);
}


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


function focusInput() {

    if (!finished) {
        input.focus();
    }
}


text.addEventListener(
    'click',
    () => {

        focusInput();
    }
);


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


function finishTest() {

    if (finished) {
        return;
    }

    finished = true;

    clearInterval(interval);

    input.disabled = true;

    const finalStats =
        stats();

    text.style.display =
        'none';

    input.style.display =
        'none';

    const durationButtons =
        document.querySelector(
            '.duration'
        );

    if (durationButtons) {

        durationButtons.style.display =
            'none';
    }

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


restart.addEventListener(
    'click',
    () => {

        window.location.reload();
    }
);


function setDuration(seconds) {

    if (
        started ||
        finished
    ) {

        return;
    }

    duration =
        seconds;

    timer =
        seconds;

    timeEl.textContent =
        timer;

    wpmEl.textContent =
        '0';

    accEl.textContent =
        '100';

    loadPassage();
}


loadPassage();