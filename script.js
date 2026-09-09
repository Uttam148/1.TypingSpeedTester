const text = document.getElementById('text');
const input = document.getElementById('input');
const timeEl = document.getElementById('time');
const wpmEl = document.getElementById('wpm');
const accEl = document.getElementById('accuracy');
const restart = document.getElementById('restart');
const container = document.querySelector('.container');
const performanceChart =
    document.getElementById('performanceChart');

let paragraph = '';

let duration = 60;
let timer = duration;
let started = false;
let finished = false;
let interval;

let typedText = '';

const API_URL =
    'https://typing-speed-api.onrender.com';

const wordTargets = {
    15: 200,
    30: 400,
    60: 600,
    120: 900
};


// WPM measurements
let performanceData = [];


// Exact times when mistakes were made
let errorData = [];


// Time when the test actually started
let testStartTime = 0;


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

        performanceData = [];

        errorData = [];

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
        accuracy,
        correct,
        typed
    };
}


function recordPerformance() {

    if (
        !started ||
        finished
    ) {

        return;
    }

    const currentStats =
        stats();

    const elapsedSeconds =
        (
            Date.now() -
            testStartTime
        ) / 1000;

    performanceData.push({
        time: elapsedSeconds,
        wpm: currentStats.wpm
    });
}


function recordError() {

    if (
        !started ||
        finished
    ) {

        return;
    }

    const currentStats =
        stats();

    const elapsedSeconds =
        (
            Date.now() -
            testStartTime
        ) / 1000;

    errorData.push({
        time: elapsedSeconds
    });
}


function start() {

    if (
        started ||
        finished
    ) {

        return;
    }

    started = true;

    testStartTime =
        Date.now();

    interval =
        setInterval(() => {

            timer--;

            timeEl.textContent =
                timer;

            stats();

            recordPerformance();

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


        /*
         * Check whether the newly typed
         * character is incorrect.
         */

        if (
            newValue.length >
            typedText.length
        ) {

            const index =
                newValue.length - 1;

            if (
                index < paragraph.length &&
                newValue[index] !==
                paragraph[index]
            ) {

                recordError();
            }
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


/*
 * Find the WPM value on the blue
 * performance curve at a specific time.
 *
 * This uses linear interpolation between
 * the two closest performance points.
 */

function getWpmAtTime(time) {

    if (
        performanceData.length === 0
    ) {

        return 0;
    }


    if (
        time <=
        performanceData[0].time
    ) {

        return performanceData[0].wpm;
    }


    const lastPoint =
        performanceData[
            performanceData.length - 1
        ];

    if (
        time >= lastPoint.time
    ) {

        return lastPoint.wpm;
    }


    for (
        let i = 0;
        i < performanceData.length - 1;
        i++
    ) {

        const point1 =
            performanceData[i];

        const point2 =
            performanceData[i + 1];


        if (
            time >= point1.time &&
            time <= point2.time
        ) {

            const timeDifference =
                point2.time -
                point1.time;

            const position =
                timeDifference === 0
                    ? 0
                    : (
                        time -
                        point1.time
                    ) /
                    timeDifference;


            return (
                point1.wpm +
                (
                    point2.wpm -
                    point1.wpm
                ) *
                position
            );
        }
    }


    return lastPoint.wpm;
}


function drawPerformanceChart() {

    const canvas =
        performanceChart;

    const ctx =
        canvas.getContext('2d');

    const width =
        canvas.clientWidth;

    const height =
        350;

    const devicePixelRatio =
        window.devicePixelRatio || 1;

    canvas.width =
        width * devicePixelRatio;

    canvas.height =
        height * devicePixelRatio;

    canvas.style.height =
        `${height}px`;

    ctx.scale(
        devicePixelRatio,
        devicePixelRatio
    );

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    if (
        performanceData.length === 0
    ) {

        return;
    }


    const padding = {
        top: 50,
        right: 30,
        bottom: 50,
        left: 55
    };


    const graphWidth =
        width -
        padding.left -
        padding.right;

    const graphHeight =
        height -
        padding.top -
        padding.bottom;


    const maxWpm =
        Math.max(
            10,
            ...performanceData.map(
                point => point.wpm
            )
        );


    const maxValue =
        Math.ceil(
            maxWpm / 10
        ) * 10;


    function xPosition(time) {

        return (
            padding.left +
            (
                time / duration
            ) *
            graphWidth
        );
    }


    function yPosition(wpm) {

        return (
            padding.top +
            graphHeight -
            (
                wpm / maxValue
            ) *
            graphHeight
        );
    }


    // Background

    ctx.fillStyle =
        '#111827';

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    // Grid

    ctx.strokeStyle =
        '#374151';

    ctx.lineWidth = 1;

    const gridLines = 5;

    for (
        let i = 0;
        i <= gridLines;
        i++
    ) {

        const y =
            padding.top +
            (
                i / gridLines
            ) *
            graphHeight;

        ctx.beginPath();

        ctx.moveTo(
            padding.left,
            y
        );

        ctx.lineTo(
            width - padding.right,
            y
        );

        ctx.stroke();
    }


    // Axes

    ctx.strokeStyle =
        '#9ca3af';

    ctx.beginPath();

    ctx.moveTo(
        padding.left,
        padding.top
    );

    ctx.lineTo(
        padding.left,
        height - padding.bottom
    );

    ctx.lineTo(
        width - padding.right,
        height - padding.bottom
    );

    ctx.stroke();


    // Title

    ctx.fillStyle =
        '#ffffff';

    ctx.font =
        'bold 18px Arial';

    ctx.textAlign =
        'center';

    ctx.fillText(
        'Typing Speed',
        width / 2,
        25
    );


    // X-axis label

    ctx.font =
        '14px Arial';

    ctx.fillText(
        'Time (seconds)',
        width / 2,
        height - 12
    );


    // Y-axis label

    ctx.save();

    ctx.translate(
        16,
        height / 2
    );

    ctx.rotate(
        -Math.PI / 2
    );

    ctx.fillText(
        'WPM',
        0,
        0
    );

    ctx.restore();


    // X-axis values

    ctx.textAlign =
        'center';

    ctx.fillStyle =
        '#d1d5db';

    ctx.font =
        '12px Arial';

    for (
        let i = 0;
        i <= 5;
        i++
    ) {

        const time =
            Math.round(
                (duration / 5) * i
            );

        const x =
            xPosition(time);

        ctx.fillText(
            time,
            x,
            height - 32
        );
    }


    // Y-axis values

    ctx.textAlign =
        'right';

    for (
        let i = 0;
        i <= 5;
        i++
    ) {

        const value =
            Math.round(
                (maxValue / 5) *
                (5 - i)
            );

        const y =
            padding.top +
            (
                i / 5
            ) *
            graphHeight;

        ctx.fillText(
            value,
            padding.left - 8,
            y + 4
        );
    }


    /*
     * Draw WPM line
     */

    ctx.strokeStyle =
        '#60a5fa';

    ctx.lineWidth = 3;

    ctx.beginPath();

    performanceData.forEach(
        (point, index) => {

            const x =
                xPosition(
                    point.time
                );

            const y =
                yPosition(
                    point.wpm
                );

            if (
                index === 0
            ) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );
            }
        }
    );

    ctx.stroke();


    /*
     * Draw mistake dots.
     *
     * IMPORTANT:
     * Instead of using a separately
     * calculated WPM value, we get
     * the exact WPM position from
     * the blue line itself.
     */

    ctx.fillStyle =
        '#ef4444';

    errorData.forEach(
        error => {

            const wpm =
                getWpmAtTime(
                    error.time
                );

            const x =
                xPosition(
                    error.time
                );

            const y =
                yPosition(
                    wpm
                );

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                3,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    );


    // Legend

    ctx.textAlign =
        'left';

    ctx.font =
        '13px Arial';

    ctx.fillStyle =
        '#60a5fa';

    ctx.fillText(
        '— WPM',
        padding.left,
        45
    );

    ctx.fillStyle =
        '#ef4444';

    ctx.fillText(
        '● Mistake',
        padding.left + 70,
        45
    );
}


function finishTest() {

    if (finished) {
        return;
    }

    finished = true;

    clearInterval(interval);

    input.disabled = true;


    const finalStats =
        stats();


    console.log(
        'Performance data:',
        performanceData
    );

    console.log(
        'Error data:',
        errorData
    );


    text.style.display = 'none';
    input.style.display = 'none';

   document.querySelector('.stats').style.display = 'none';


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


    resultsScreen.appendChild(
        performanceChart
    );


    performanceChart.style.display =
        'block';


    drawPerformanceChart();
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


performanceChart.style.display =
    'none';


loadPassage();