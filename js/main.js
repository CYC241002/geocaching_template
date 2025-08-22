(function() {
    const LOCAL_STORAGE_USER_ID_KEY = "userId"
    const LOCAL_STORAGE_POSITION_CHECK_LIST_KEY = "positionCheckList"

    // Google Apps Script網址，請點開部署頁面複製網址貼上並取代
    const APP_URL = "https://script.google.com/macros/s/AKfycby6g0ZSFYpdJSHgSN3HmlCKCxDVcgqfBquDedvb1tEO--i3NH9ThFv5awY6WOucwIdj/exec"

    // MainPage
    const btnRegisterPlayer = document.getElementById('btnRegisterPlayer')
    const btnCameraScan = document.getElementById('btnCameraScan')
    const btnPositionList = document.getElementById('btnPositionList')
    const btnBackToMain = document.querySelectorAll('.btnBackToMain')

    // Sections
    const sectionRegisterPlayer = document.getElementById('sectionRegisterPlayer')
    const sectionRegisterPlayerResult = document.getElementById('sectionRegisterPlayerResult')
    const sectionCameraScan = document.getElementById('sectionCameraScan')
    const sectionCheckPositionResult = document.getElementById('sectionCheckPositionResult')
    const sectionMapView = document.getElementById('sectionMapView')
    const mainContent = document.getElementById('mainContent')

    // Elements for Check Position Result
    const checkPositionName = document.getElementById('checkPositionName')
    const checkPositionDescription = document.getElementById('checkPositionDescription')
    const checkPositionDate = document.getElementById('checkPositionDate')

    // Elements for Position List
    const positionList = document.getElementById('positionList')

    // Loading Overlay
    const loadingOverlay = document.getElementById('loadingOverlay')

    // Initialize QR Scanner
    const videoElement = document.getElementById('videoCamera');
    const qrScanner = new QrScanner(videoElement, (result) => {

        const userId = localStorage.getItem(LOCAL_STORAGE_USER_ID_KEY)
        if (!userId) {
            console.error('User ID not found in local storage.');
            return;
        }

        //停止掃瞄並送出結果
        qrScanner.stop()
        checkPositionName.innerText = "打卡中請稍候……"
        checkPositionDescription.innerText = ""
        checkPositionDate.innerText = ""
        sectionCameraScan.classList.add('d-none')
        sectionCheckPositionResult.classList.remove('d-none')

        let body = {
            action: 'CHECK_POSITION',
            positionId: result.data,
            userId: userId
        }

        fetch(APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: new URLSearchParams(body).toString()
        })
        .then(response => response.json())
        .then(data => {
            if (data.result) {
                saveArrayItemToLocalStorage(LOCAL_STORAGE_POSITION_CHECK_LIST_KEY, data.result)

                checkPositionName.innerText = data.result.positionName
                checkPositionDescription.innerText = data.result.positionDescription
                checkPositionDate.innerText = new Date(data.result.date.trim()).toLocaleString(
                    "zh-TW",
                    { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timezone: 'Asia/Taipei' }
                )
                
            } else {
                console.error('Position check failed:', data.message)
            }
        })
    }, {
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
        sectionCheckPositionResult.classList.add('d-none')
        sectionMapView.classList.add('d-none')
        mainContent.classList.add('d-none')
    })

    btnCameraScan.addEventListener('click', function(e) {
        e.preventDefault() 
        const userId = localStorage.getItem(LOCAL_STORAGE_USER_ID_KEY)
        if (!userId) {
            alert('請先註冊玩家！')
            return;
        }

        sectionCameraScan.classList.remove('d-none')
        sectionCheckPositionResult.classList.add('d-none')
        sectionRegisterPlayer.classList.add('d-none')
        sectionRegisterPlayerResult.classList.add('d-none')
        sectionMapView.classList.add('d-none')
        mainContent.classList.add('d-none')
        loadingOverlay.classList.remove('d-none')

        waitForVideoPlaying(videoElement)
        .then(() => {
            loadingOverlay.classList.add('d-none')
        })
        .catch(error => {
            console.error('Camera Error:', error);
            loadingOverlay.classList.add('d-none')
        })

        qrScanner.start()
        .catch(error => {
            console.error('Error starting QR Scanner:', error);
            loadingOverlay.classList.add('d-none')
        })
        
    })

    btnPositionList.addEventListener('click', function(e) {
        e.preventDefault()

        sectionRegisterPlayer.classList.add('d-none')
        sectionRegisterPlayerResult.classList.add('d-none')
        sectionCameraScan.classList.add('d-none')
        sectionCheckPositionResult.classList.add('d-none')

        const positionCheckList = JSON.parse(localStorage.getItem(LOCAL_STORAGE_POSITION_CHECK_LIST_KEY)) || []
        renderPositionList(positionCheckList, positionList)

        sectionMapView.classList.remove('d-none')
        mainContent.classList.add('d-none')
    })

    btnBackToMain.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault()
            sectionRegisterPlayer.classList.add('d-none')
            sectionRegisterPlayerResult.classList.add('d-none')
            sectionCameraScan.classList.add('d-none')
            sectionCheckPositionResult.classList.add('d-none')
            sectionMapView.classList.add('d-none')
            positionList.innerHTML = '' // 清空打卡紀錄列表
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
                localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, data.id)
            })
        })
    })

    function renderPositionList(positions, positionList) {
        if (typeof(positions) !== 'object' || !Array.isArray(positions)) {
            console.error('Invalid positions data:', positions)
            return
        }
        
        positionList.innerHTML = '' // 清空列表
        if (positions.length === 0) {
            positionList.innerHTML = '<p class="text-muted">尚未打卡紀錄</p>'
            return
        }

        const positionCardTemplate = `<div class="col-12 col-md-6 col-lg-4 mb-3">
            <div class="card">
                <img src="{{featureImageUrl}}" class="card-img-top {{isFeatureImageUrlEnabled}}" alt="{{name}}">
                <div class="card-body">
                    <h5 class="card-title>{{name}}</h5>
                    <p class="card-text">{{description}}</p>
                    <p class="card-text"><small class="text-muted">打卡時間：{{date}}</small></p>
                </div>
            </div>
        </div>`

        positions.forEach(position => {
            if (!position.positionName || !position.positionDescription || !position.date) {
                console.warn('Incomplete position data:', position)
                return
            }

            const date = new Date(position.date.trim()).toLocaleString(
                "zh-TW",
                { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timezone: 'Asia/Taipei' }
            )

            const cardHtml = positionCardTemplate
                .replace('{{featureImageUrl}}', position.featureImageUrl || '')
                .replace('{{isFeatureImageUrlEnabled}}', position.featureImageUrl ? '' : 'd-none')
                .replace('{{name}}', position.positionName)
                .replace('{{description}}', position.positionDescription)
                .replace('{{date}}', date)

            positionList.innerHTML += cardHtml
        })
    }

    function saveArrayItemToLocalStorage(key, value) {
        var data = JSON.parse(localStorage.getItem(key)) || []
        if (!data.includes(value)) {
            data.push(value)
            localStorage.setItem(key, JSON.stringify(data))
        }
    }
})()