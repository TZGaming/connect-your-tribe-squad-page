// Variabelen
let titleOverlay = document.querySelector('.title-overlay')
let leftScreenContent = document.querySelector('.onscreen-items-left')
let musicButton = document.querySelector('.wii-u-music-button');
let personenContainer = document.querySelector('.personen');
let personAll = document.querySelectorAll('.person-all');
let personCircles = document.querySelectorAll('.personen article a');
let personenOverlay = document.querySelectorAll('.person-overlay');

// Audio speler die op de website word gebruikt, vervangt de standaard speler voor minder latency
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let gainNode = audioCtx.createGain();

// Standaard volume
gainNode.gain.value = 0.8;
gainNode.connect(audioCtx.destination);

// Extra volume gain nodes voor de muziek
let gainWii = audioCtx.createGain();
let gainWiiU = audioCtx.createGain();
gainWii.connect(gainNode);
gainWiiU.connect(gainNode);

// Start boot sequence functie on click op title screen
titleOverlay.addEventListener('click', function () {
    startBackgroundMusic()
})

// Gebruik audioCtx buffer om de sounds en muziek te pre-loaden
let musicWiiBuffer, musicWiiUBuffer, okButtonBuffer, onButtonBuffer, personSelectBuffer, personDeselectBuffer;
let isWiiUActive = false;

async function loadAllSounds() {
    try {
        const responses = await Promise.all([
            fetch('snd/MiiChannel.mp3'),
            fetch('snd/MiiMaker_WiiU.mp3'),
            fetch('snd/OK.mp3'),
            fetch('snd/button_on.mp3'),
            fetch('snd/select_person.mp3'),
            fetch('snd/unselect_person.mp3')
        ]);
        const data = await Promise.all(responses.map(res => res.arrayBuffer()));
        musicWiiBuffer = await audioCtx.decodeAudioData(data[0]);
        musicWiiUBuffer = await audioCtx.decodeAudioData(data[1]);
        okButtonBuffer = await audioCtx.decodeAudioData(data[2]);
        onButtonBuffer = await audioCtx.decodeAudioData(data[3]);
        personSelectBuffer = await audioCtx.decodeAudioData(data[4]);
        personDeselectBuffer = await audioCtx.decodeAudioData(data[5]);
    } catch (err) {
        console.error(err);
    }
}

// Boot sequence activatie
// Classes toevoegen en muziek afspelen
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
        personAll.forEach(personAll => personAll.classList.toggle('activate'));
    }, 250);

    // Muziek tegelijk afspelen, Wii U standaard muted
    // Wii speelt standaard
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

// Verander muziek met een button, switched tussen Wii en Wii U met behulp van booleans
// Heeft ook een crossfade van 0.1s
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

// Hover geluiden
musicButton.addEventListener('mouseenter', () => {
    const musicChangeSource = audioCtx.createBufferSource();
    musicChangeSource.buffer = onButtonBuffer;
    musicChangeSource.connect(audioCtx.destination);
    musicChangeSource.start(0);
})

personCircles.forEach(circle => {
    circle.addEventListener('mouseenter', () => {
        // Check of er op dit moment iemand 'focused' is. 
        // Als dat zo is, willen we GEEN hover geluid van de verborgen icoontjes.
        const isAnyFocused = document.querySelector('.person-all.focused');
        
        if (!isAnyFocused) {
            const onSource = audioCtx.createBufferSource();
            onSource.buffer = onButtonBuffer;
            onSource.connect(gainNode);
            onSource.start(0);
        }
    });
});

personCircles.forEach(circle => {
    circle.addEventListener('click', () => {
        const currentPerson = circle.closest('.person-all');
        const overlay = currentPerson.querySelector('.person-overlay');
        
        const isOpen = overlay.classList.toggle('activate-overlay');

        // NIEUW: Geef de aangeklikte persoon een 'focused' class
        currentPerson.classList.toggle('focused', isOpen);

        const soundSource = audioCtx.createBufferSource();
        soundSource.buffer = isOpen ? personSelectBuffer : personDeselectBuffer;
        soundSource.connect(audioCtx.destination);
        soundSource.start(0);

        personAll.forEach(person => {
            if (person !== currentPerson) {
                if (isOpen) {
                    person.classList.add('hidden');
                } else {
                    person.classList.remove('hidden');
                }
            }
        });
    });
});

// Pre-load alle sounds als de website word geladen
loadAllSounds();