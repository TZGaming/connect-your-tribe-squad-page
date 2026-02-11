let titleOverlay = document.querySelector('.title-overlay')
let leftScreenContent = document.querySelector('.onscreen-items-left')
let musicButton = document.querySelector('.wii-u-music-button');
let personenContainer = document.querySelector('.personen');
let personCircles = document.querySelectorAll('.personen article a');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let gainNode = audioCtx.createGain();

gainNode.gain.value = 0.8;
gainNode.connect(audioCtx.destination);

// Extra gain nodes
let gainWii = audioCtx.createGain();
let gainWiiU = audioCtx.createGain();
gainWii.connect(gainNode);
gainWiiU.connect(gainNode);

let musicWiiBuffer, musicWiiUBuffer, okButtonBuffer, onButtonBuffer;
let isWiiUActive = false;

titleOverlay.addEventListener('click', function () {
    startBackgroundMusic()
})

async function loadAllSounds() {
    try {
        const responses = await Promise.all([
            fetch('snd/MiiChannel.mp3'),
            fetch('snd/MiiMaker_WiiU.mp3'),
            fetch('snd/OK.mp3'),
            fetch('snd/button_on.mp3')
        ]);
        const data = await Promise.all(responses.map(res => res.arrayBuffer()));
        musicWiiBuffer = await audioCtx.decodeAudioData(data[0]);
        musicWiiUBuffer = await audioCtx.decodeAudioData(data[1]);
        okButtonBuffer = await audioCtx.decodeAudioData(data[2]);
        onButtonBuffer = await audioCtx.decodeAudioData(data[3]);
    } catch (err) {
        console.error(err);
    }
}

async function startBackgroundMusic() {
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }

    const clickSource = audioCtx.createBufferSource();
    clickSource.buffer = okButtonBuffer;
    clickSource.connect(audioCtx.destination);
    clickSource.start(0);
    titleOverlay.classList.add('opened');

    setTimeout(() => {
        leftScreenContent.classList.add('activate');
        personenContainer.classList.add('activate');
    }, 250);

    setTimeout(() => {
        const sourceWii = audioCtx.createBufferSource();
        sourceWii.buffer = musicWiiBuffer;
        sourceWii.loop = true;
        sourceWii.connect(gainWii);
        gainWii.gain.value = 0.8;
        sourceWii.start(0);

        const sourceWiiU = audioCtx.createBufferSource();
        sourceWiiU.buffer = musicWiiUBuffer;
        sourceWiiU.loop = true;
        sourceWiiU.connect(gainWiiU);
        gainWiiU.gain.value = 0;
        sourceWiiU.start(0);
    }, 700);
}

musicButton.addEventListener('click', () => {
    if (isWiiUActive) {
        gainWiiU.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        gainWii.gain.setTargetAtTime(0.8, audioCtx.currentTime, 0.1);
    } else {
        gainWii.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        gainWiiU.gain.setTargetAtTime(0.8, audioCtx.currentTime, 0.1);
    }
    isWiiUActive = !isWiiUActive;
});

musicButton.addEventListener('mouseenter', () => {
    const onSource = audioCtx.createBufferSource();
    onSource.buffer = onButtonBuffer;
    onSource.connect(audioCtx.destination);
    onSource.start(0);
})

personCircles.forEach(circle => {
    circle.addEventListener('mouseenter', () => {
        const onSource = audioCtx.createBufferSource();
        onSource.buffer = onButtonBuffer;
        onSource.connect(audioCtx.destination);
        onSource.start(0);
    });
});

loadAllSounds();