// чтение штрихкода с камеры устройства
/* 
сделать на канве затенение по краям
сделать на канве линию прицела посередине серого цвета. при распознавании она становится зеленой
переделать алгоритм распознавания (заменить массив результатов на одно значение)
выводить результаты распознавания в label
при срабатывании распознавания останавливать камеру (если шк валидный)
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
        audio: false,
        video: {
            width: { min: 320, ideal: 320, max: 320 },
            height: { min: 320, ideal: 320, max: 320 },
            facingMode: { exact: "environment" },
            frameRate: { ideal: 10, max: 15 },
        }// use rear camera only
    };  

    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.autoplay = true;
    
    video.onloadedmetadata = () => {
       canvas.width =  video.videoWidth; // video.videoWidth ;
       canvas.height = video.videoHeight; // video.videoHeight;
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
               // context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

                context.strokeStyle = '#e6df0b';
                context.fillStyle = '#e6df0b';
                context.lineWidth = 2;
                context.font = '22px Arial';

                //  TODO: выбрать первый баркод detectedBarcodes[0]
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
                    // context.fillText(detectedBarcode.rawValue, left, top + height + 50);
                    
                    context.fillText(detectedBarcode.rawValue, 20, 20);
                });
                
                // target sight
                context.strokeStyle = '#b0b8b2';
                context.lineWidth = 2;
                context.beginPath();
                context.moveTo(canvas.width * 0.2, canvas.height * 0.5);
                context.lineTo(canvas.width * 0.8, canvas.height * 0.5);
                context.stroke(); 

                // context.globalAlpha = 0.1;
                // context.fillStyle = 'rgba(0, 0, 0, 0.3)';
                // context.fill();
                // context.fillRect(0, 0, canvas.width, canvas.height);
                // https://msiter.ru/references/html5-canvas/globalcompositeoperation
                // context.clearRect(canvas.width * 0.5, canvas.height * 0.5, 60, 60);
                // context.globalCompositeOperation = "source-out";
                // context.fillRect(canvas.width * 0.5, canvas.height * 0.5, 60, 60);
                // слои снизу вверх: видео, серая полупрозрачная заливка канвы, прозрачный выразающий прямоугольник, прицел


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
    alert('Error: Shape Detection Api not supported!');
    document.querySelector('.fallback-message').classList.remove('hidden');
    document.querySelector('canvas').classList.add('hidden');
    document.querySelector('.links').classList.add('hidden');
}
