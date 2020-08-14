// чтение штрихкода с камеры устройства
/* 
выводить результаты распознавания в label
при срабатывании распознавания останавливать камеру (если шк валидный)
переделать алгоритм распознавания (заменить массив результатов на одно значение)
сделать на канве зеленую линию прицела посередине
сделать на канве затенение по краям
в канве слева внизу посередине выводить результат распознавания 
сделать канву адаптивной
перехватить и выводить в алерт ошибки камеры ()
https://developer.mozilla.org/ru/docs/Web/API/MediaDevices/getUserMedia 
*/


const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

if (isShapeDetectionApiSupported()) {
    runShapeDetectionApiDemo();
} else {
    displayFallbackMessage();
}

function isShapeDetectionApiSupported() {
    return  window.BarcodeDetector;
}

async function runShapeDetectionApiDemo() {
    const constraints = {
        video: {
            width: { min: 320 },
            height: { min: 320 },
            facingMode: 'environment'
        }// use rear camera only

    };  
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.autoplay = true;
    
    video.onloadedmetadata = () => {
       canvas.width =  320 // video.videoWidth ;
       canvas.height = 260 // video.videoHeight;
       // alert (`video.videoWidth: ${video.videoWidth},  video.videoHeight: ${video.videoHeight}`);
    };

    let renderLocked = false;
    // const faceDetector = new FaceDetector({ fastMode: true });
    // const textDetector = new TextDetector();
    const barcodeDetector = new BarcodeDetector();

    function render() {
        if (!video.paused) {
            renderLocked = true;

            Promise.all([
               // faceDetector.detect(video).catch((error) => console.error(error)),
               // textDetector.detect(video).catch((error) => console.error(error)),
                barcodeDetector.detect(video).catch((error) => console.log(error))
            ]).then(([detectedBarcodes = []]) => {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

                context.strokeStyle = '#ffeb3b';
                context.fillStyle = '#ffeb3b';
                context.font = '22px Mononoki';
                context.lineWidth = 5;

                detectedBarcodes.forEach((detectedBarcode) => {
                    const { top, left, width, height } = detectedBarcode.boundingBox;
                    const cornerPoints = detectedBarcode.cornerPoints;
                    if (cornerPoints && cornerPoints.length) {
                        const [{ x, y }] = cornerPoints;
                        context.beginPath();
                        context.moveTo(x, y);
                        for (let i = 1; i < cornerPoints.length; i++) {
                            context.lineTo(cornerPoints[i].x, cornerPoints[i].y);
                        }
                        context.closePath();
                    } else {
                        context.beginPath();
                        context.rect(left, top, width, height);
                    }
                    context.stroke();
                    // context.fillText(detectedBarcode.rawValue, left, top + height + 16);
                    context.fillText(detectedBarcode.rawValue, left, top + height + 16);
                });

                renderLocked = false;
            });
        }
    }

    (function renderLoop() {
        requestAnimationFrame(renderLoop);
        if (!renderLocked) {
            render();
        }
    })();
};

function displayFallbackMessage() {
    document.querySelector('.fallback-message').classList.remove('hidden');
    document.querySelector('canvas').classList.add('hidden');
    document.querySelector('.links').classList.add('hidden');
}
