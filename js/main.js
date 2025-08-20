(function() {
    const LOCAL_STORAGE_USER_ID_KEY = "userId"
    const APP_URL = "https://script.google.com/macros/s/AKfycby6g0ZSFYpdJSHgSN3HmlCKCxDVcgqfBquDedvb1tEO--i3NH9ThFv5awY6WOucwIdj/exec"

    // MainPage
    const btnRegisterPlayer = document.getElementById('btnRegisterPlayer')
    const btnCameraScan = document.getElementById('btnCameraScan')
    const btnBackToMain = document.querySelectorAll('.btnBackToMain')

    // Sections
    const sectionRegisterPlayer = document.getElementById('sectionRegisterPlayer')
    const sectionRegisterPlayerResult = document.getElementById('sectionRegisterPlayerResult')
    const sectionCameraScan = document.getElementById('sectionCameraScan')
    const mainContent = document.getElementById('mainContent')

    // Loading Overlay
    const loadingOverlay = document.getElementById('loadingOverlay')

    // Initialize QR Scanner
    const videoElement = document.getElementById('videoCamera');
    const qrScanner = new QrScanner(videoElement, result => console.log('QR Code detected:', result), {
        onDecodeError: error => console.error('QR Code decode error:', error),
        highlightScanRegion: true,
        highlightCodeOutline: true,
    })

    const waitForVideoPlaying = (video, timeoutMs = 8000) => {
        return new Promise((resolve, reject) => {
            const onPlay = () => { cleanup(); resolve(); }
            const onError = (e) => { cleanup(); reject(e); }
            const timer = setTimeout(() => { cleanup(); reject(new Error('Camera Time out'))}, timeoutMs)

            function cleanup() {
                clearTimeout(timer)
                video.removeEventListener('canplay', onPlay)
                video.removeEventListener('playing', onPlay)
                video.removeEventListener('error', onError)
            }

            video.addEventListener('canplay', onPlay)
            video.addEventListener('playing', onPlay)
            video.addEventListener('error', onError)
        });
    }


    btnRegisterPlayer.addEventListener('click', function(e) {
        e.preventDefault()
        sectionRegisterPlayer.classList.remove('d-none')
        sectionRegisterPlayerResult.classList.add('d-none')
        sectionCameraScan.classList.add('d-none')
        mainContent.classList.add('d-none')
    })

    btnCameraScan.addEventListener('click', function(e) {
        e.preventDefault() 
        sectionCameraScan.classList.remove('d-none')
        sectionRegisterPlayer.classList.add('d-none')
        sectionRegisterPlayerResult.classList.add('d-none')
        mainContent.classList.add('d-none')
        loadingOverlay.classList.remove('d-none')

        qrScanner.start()
        .then(() => waitForVideoPlaying(videoElement))
        .then(() => {
            loadingOverlay.classList.add('d-none')
        })
        .catch(error => {
            console.error('Error starting QR Scanner:', error);
            loadingOverlay.classList.add('d-none')
        })
    })

    btnBackToMain.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault()
            sectionRegisterPlayer.classList.add('d-none')
            sectionRegisterPlayerResult.classList.add('d-none')
            sectionCameraScan.classList.add('d-none')
            mainContent.classList.remove('d-none')
            qrScanner.stop()
        })
    })

    // Form
    // Initialize Team Dropdown
    const formplayerTeam = document.getElementById('playerTeam')
    const setTeamOptions = (teams) => {
        teams.forEach(team => {
            const option = document.createElement('option')
            option.value = team.name
            option.textContent = team.name
            option.style = `background-color: ${team.bgColor}; color: ${team.textColor};`
            formplayerTeam.appendChild(option)
        })
    }

    if (localStorage.getItem('teams')) {
        const teams = JSON.parse(localStorage.getItem('teams'))
        setTeamOptions(teams)
        loadingOverlay.classList.add('d-none')
    } else {
        fetch(APP_URL + '?action=GET_TEAMS', { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            setTeamOptions(data.teams)
            localStorage.setItem('teams', JSON.stringify(data.teams))
        })
        .catch(error => {
        console.error('Error fetching teams:', error);
        })
        .finally(() => {
            loadingOverlay.classList.add('d-none')
        })
    }
    

    const formRegisterPlayer = document.getElementById('formRegisterPlayer')

    formRegisterPlayer.addEventListener('submit', function(event) {
        event.preventDefault()

        const formData = new FormData(formRegisterPlayer)
        const otherData = [
            navigator.userAgent,
            navigator.language,
            screen.width,
            screen.height,
            screen.colorDepth
        ].join(';')
        const action = "REGISTER_USER"

        formData.append('otherData', otherData)
        formData.append('action', action)

        for (let [key, value] of formData.entries()) {
            console.log(key, value)
        }

        fetch(APP_URL, {
            method: 'POST',
            body: formData
        }).then(async (response) => {
            const registerPlayerResultMessage = document.getElementById('registerPlayerResultMessage')
            response.json().then(data => {
                sectionRegisterPlayer.classList.add('d-none')
                sectionRegisterPlayerResult.classList.remove('d-none')
                sectionCameraScan.classList.add('d-none')
                mainContent.classList.add('d-none')
                registerPlayerResultMessage.innerText = data.message
                localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, data.userId)
            })
        })
    })
})()