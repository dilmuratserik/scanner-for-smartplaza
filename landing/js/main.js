const
    el = {},
    usingOffscreenCanvas = isOffscreenCanvasWorking();

document
    .querySelectorAll('[id]')
    .forEach(element => el[element.id] = element)

let
    offCanvas,
    afterPreviousCallFinished,
    requestId = null;

el.usingOffscreenCanvas.innerText = usingOffscreenCanvas ? 'yes' : 'no'


function isOffscreenCanvasWorking() {
    try {
        return Boolean((new OffscreenCanvas(1, 1)).getContext('2d'))

    } catch {
        return false
    }
}


function formatNumber(number, fractionDigits = 1) {
    return number.toLocaleString(
        undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }
    )
}


function detect(source) {
    const
        afterFunctionCalled = performance.now(),
        canvas = el.canvas,
        ctx = canvas.getContext('2d');

    function getOffCtx2d(width, height) {
        if (usingOffscreenCanvas) {
            if (!offCanvas || (offCanvas.width !== width) || (offCanvas.height !== height)) {
                // Only resizing the canvas caused Chromium to become progressively slower
                offCanvas = new OffscreenCanvas(width, height)
            }

            return offCanvas.getContext('2d')
        }
    }

    canvas.width = source.naturalWidth || source.videoWidth || source.width
    canvas.height = source.naturalHeight || source.videoHeight || source.height

    if (canvas.height && canvas.width) {
        const offCtx = getOffCtx2d(canvas.width, canvas.height) || ctx

        offCtx.drawImage(source, 0, 0)

        const
            afterDrawImage = performance.now(),
            imageData = offCtx.getImageData(0, 0, canvas.width, canvas.height),
            afterGetImageData = performance.now();

        return zbarWasm
            .scanImageData(imageData)
            .then(symbols => {
                const afterScanImageData = performance.now()

                symbols.forEach(symbol => {
                    const lastPoint = symbol.points[symbol.points.length - 1]
                    ctx.moveTo(lastPoint.x, lastPoint.y)
                    symbol.points.forEach(point => ctx.lineTo(point.x, point.y))

                    ctx.lineWidth = Math.max(Math.min(canvas.height, canvas.width) / 100, 1)
                    ctx.strokeStyle = 'red'
                    ctx.stroke()
                })

                symbols.forEach(s => s.rawValue = s.decode('utf-8'))
                const foundSymbol = symbols.find(s => s.rawValue && s.rawValue.length === 20);
                if (foundSymbol) {
                    detectVideo(false);


                    setTimeout(() => {
                        window.location.href = `http://10.110.1.144:4200/?ticketId=${foundSymbol.rawValue}`;
                    }, 2000);

                }



                if (!el.details.checked) {
                    symbols.forEach(s => {
                        delete s.type
                        delete s.data
                        delete s.points
                        delete s.time
                        delete s.cacheCount
                    })
                }

                el.result.innerText = JSON.stringify(symbols, null, 2)
                el.video.addEventListener('loadedmetadata', function() {
                    detect(el.video);
                });
                el.waitingTime.innerText = formatNumber(afterFunctionCalled - afterPreviousCallFinished)
                el.drawImageTime.innerText = formatNumber(afterDrawImage - afterFunctionCalled)
                el.getImageDataTime.innerText = formatNumber(afterGetImageData - afterDrawImage)
                el.scanImageDataTime.innerText = formatNumber(afterScanImageData - afterGetImageData)
                el.timing.className = 'visible'

                afterPreviousCallFinished = performance.now()
            })

    } else {
        el.result.innerText = 'Source not ready'
        el.timing.className = ''

        return Promise.resolve()
    }
}


function detectImg() {
    detectVideo(false)

    if (el.video.srcObject) {
        el.video.srcObject.getTracks().forEach(track => track.stop())
        el.video.srcObject = null
    }

    // FF needs some time to properly update decode()
    setTimeout(() => el.img.decode().then(() => detect(el.img)), 100)
}


function detectVideo(active) {
    if (active) {
        detect(el.video)
            .then(() => requestId = requestAnimationFrame(() => detectVideo(true)))

    } else {
        cancelAnimationFrame(requestId)
        requestId = null
    }

}


function onUrlActive() {
    if (el.imgUrl.validity.valid) {
        // el.imgUrl.className = 'active'
        //
        // el.img.src = el.imgUrl.value
        detectImg()
    }
}

// el.imgUrl.addEventListener('change', onUrlActive)
// el.imgUrl.addEventListener('focus', onUrlActive)


// el.fileInput.addEventListener('change', event => {
//     el.imgUrl.className = el.videoBtn.className = ''
//     // el.imgBtn.className = 'button-primary'
//     //
//     // el.img.src = URL.createObjectURL(el.fileInput.files[0])
//     // el.fileInput.value = null
//     detectImg()
// })


// el.imgBtn.addEventListener('click', event => {
//     el.fileInput.dispatchEvent(new MouseEvent('click'))
// })


el.videoBtn.addEventListener('click', event => {
    if (!requestId) {
        navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'environment' } })
            .then(stream => {
                // el.imgUrl.className = el.imgBtn.className = ''
                el.videoBtn.className = 'button-primary'

                el.video.srcObject = stream
                detectVideo(true)
            })
            .catch(error => {
                el.result.innerText = JSON.stringify(error)
                el.timing.className = ''
            })

    } else {
        // el.imgUrl.className = el.imgBtn.className = el.videoBtn.className = ''

        detectVideo(false)
    }
})
function startVideoCapture() {
    if (!requestId) {
        navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'environment' } })
            .then(stream => {
                el.videoBtn.className = 'button-primary';
                el.video.srcObject = stream;
                detectVideo(true);
            })
            .catch(error => {
                el.result.innerText = JSON.stringify(error);
                el.timing.className = '';
            });
    } else {
        detectVideo(false);
    }
}
document.addEventListener("DOMContentLoaded", function() {
    startVideoCapture();

    const selector = document.getElementById('languageSelector');
    const scanText = document.getElementById('scan_me');
    const inputTypeText = document.getElementById('input_type');
    const firstStepText = document.getElementById('first_step');
    const secondStepText = document.getElementById('second_step');
    const thirdStepText = document.getElementById('third_step');
    const buttonCancel = document.getElementById('button_cancel');
    const labelNumber = document.getElementById('label_number');

    function loadTranslations(lang) {
        fetch(`/lang/${lang}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                scanText.textContent = data.scan_me;
                inputTypeText.textContent = data.input_type;
                firstStepText.textContent = data.first_step;
                secondStepText.textContent = data.second_step;
                thirdStepText.textContent = data.third_step;
                buttonCancel.textContent = data.button_cancel;
                labelNumber.textContent = data.label_number;
                console.log(data);
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error.message);
            });
    }

    selector.addEventListener('change', function() {
        const selectedLang = selector.value;
        loadTranslations(selectedLang);
    });

    loadTranslations('kz');
});


document.getElementById('submitButton').addEventListener('click', function() {
    const ticketValue = document.getElementById('ticketInput').value;
    window.location.href = `http://10.110.1.144:4200/?ticketId=${ticketValue}`;
});