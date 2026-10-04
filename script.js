
// ============================================
// GET HTML ELEMENTS
// ============================================

const video =
    document.getElementById("camera");

const canvas =
    document.getElementById("canvas");

const statusText =
    document.getElementById("statusText");

const statusIndicator =
    document.getElementById("statusIndicator");

const detectionResult =
    document.getElementById("detectionResult");

const startButton =
    document.getElementById("startButton");

const stopButton =
    document.getElementById("stopButton");

const fogOverlay =
    document.getElementById("fogOverlay");

// Phase 4A
const fingerPoint =
    document.getElementById("fingerPoint");


// ============================================
// CAMERA
// ============================================

let cameraStream = null;


// ============================================
// BLOW DETECTION SETTINGS
// ============================================

const requiredBlowingFrames = 3;

let blowingFrameCount = 0;

let detectionInProgress = false;

let lastDetectionTime = 0;

const detectionInterval = 500;


// ============================================
// FOG SETTINGS
// ============================================

let fogActive = false;

// ============================================
// PHASE 4 — FOG CANVAS
// ============================================

const fogCanvas =
    document.getElementById("fogCanvas");

const fogContext =
    fogCanvas.getContext("2d");

let previousFingerX = null;

let previousFingerY = null;

// ============================================
// SETUP FOG CANVAS
// ============================================

function setupFogCanvas() {

    fogCanvas.width =
        window.innerWidth;

    fogCanvas.height =
        window.innerHeight;

    drawFullFog();

}

// ============================================
// DRAW FULL FOG
// ============================================

function drawFullFog() {

    fogContext.globalCompositeOperation =
        "source-over";

    fogContext.clearRect(

        0,
        0,
        fogCanvas.width,
        fogCanvas.height

    );


    /*
       Main white fog
    */

    fogContext.fillStyle =
        "rgba(255, 255, 255, 0.92)";


    fogContext.fillRect(

        0,
        0,
        fogCanvas.width,
        fogCanvas.height

    );

}

// ============================================
// ERASE FOG AT FINGERTIP
// ============================================

function eraseFog(x, y) {

    if (!fogActive) {

        return;

    }


    fogContext.save();


    /*
       Erase instead of drawing.
    */

    fogContext.globalCompositeOperation =
        "destination-out";


    /*
       Soft edge makes it look more
       like wiping condensation.
    */

    const radius = 35;


    const gradient =
        fogContext.createRadialGradient(

            x,
            y,
            5,

            x,
            y,
            radius

        );


    gradient.addColorStop(
        0,
        "rgba(0, 0, 0, 1)"
    );


    gradient.addColorStop(
        0.7,
        "rgba(0, 0, 0, 0.8)"
    );


    gradient.addColorStop(
        1,
        "rgba(0, 0, 0, 0)"
    );


    fogContext.fillStyle =
        gradient;


    fogContext.beginPath();

    fogContext.arc(

        x,
        y,
        radius,

        0,
        Math.PI * 2

    );

    fogContext.fill();


    fogContext.restore();

}
// ============================================
// ERASE CONTINUOUS FINGER PATH
// ============================================

function eraseFingerPath(x, y) {

    if (!fogActive) {

        previousFingerX = null;
        previousFingerY = null;

        return;
    }


    // First finger position
    if (
        previousFingerX === null ||
        previousFingerY === null
    ) {

        eraseFog(x, y);

    }

    else {

        // Distance between previous and current position
        const distance =
            Math.hypot(
                x - previousFingerX,
                y - previousFingerY
            );


        // Create enough points so there are no gaps
        const steps =
            Math.max(
                1,
                Math.ceil(distance / 10)
            );


        for (
            let i = 0;
            i <= steps;
            i++
        ) {

            const t =
                i / steps;


            const interpolatedX =
                previousFingerX +
                (x - previousFingerX) * t;


            const interpolatedY =
                previousFingerY +
                (y - previousFingerY) * t;


            eraseFog(
                interpolatedX,
                interpolatedY
            );

        }
    }


    // Remember current finger position
    previousFingerX = x;
    previousFingerY = y;
}
// ============================================
// PHASE 4A — HAND TRACKING
// ============================================

let hands = null;

let handTrackingRunning = false;


// ============================================
// INITIALIZE MEDIAPIPE HANDS
// ============================================

function initializeHandTracking() {

    if (typeof Hands === "undefined") {

        console.error(
            "MediaPipe Hands could not be loaded."
        );

        return;

    }


    hands = new Hands({

        locateFile: function(file) {

            return (
                "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" +
                file
            );

        }

    });


    hands.setOptions({

        maxNumHands: 1,

        modelComplexity: 1,

        minDetectionConfidence: 0.6,

        minTrackingConfidence: 0.6

    });


    hands.onResults(
        handleHandResults
    );


    console.log(
        "MediaPipe Hands initialized."
    );

}

// ============================================
// HANDLE HAND TRACKING RESULT
// ============================================

function handleHandResults(results) {

    // No hand detected
    if (
        !results.multiHandLandmarks ||
        results.multiHandLandmarks.length === 0
    ) {

        fingerPoint.style.display = "none";

        return;
    }


    // Get the first detected hand
    const landmarks =
        results.multiHandLandmarks[0];


    // MediaPipe landmark 8
    // = INDEX FINGER TIP
    const indexFingerTip =
        landmarks[8];


    if (!indexFingerTip) {

        fingerPoint.style.display = "none";

        return;
    }


    // ========================================
    // CAMERA DISPLAY SIZE
    // ========================================

    const videoWidth =
        video.clientWidth;

    const videoHeight =
        video.clientHeight;


    // ========================================
    // MIRROR X COORDINATE
    // ========================================
    //
    // Your camera is mirrored using:
    //
    // transform: scaleX(-1)
    //
    // Therefore we reverse X.
    //

    const x =
        (1 - indexFingerTip.x) *
        videoWidth;


    const y =
        indexFingerTip.y *
        videoHeight;


    // ========================================
    // SHOW FINGER DOT
    // ========================================

    fingerPoint.style.display =
        "block";


    fingerPoint.style.left =
        x + "px";


    fingerPoint.style.top =
        y + "px";


    // ========================================
    // DEBUG
    // ========================================

    console.log(
        "INDEX FINGER:",
        Math.round(x),
        Math.round(y)
    );


    // ========================================
    // CONVERT TO SCREEN COORDINATES
    // ========================================

    const videoRect =
        video.getBoundingClientRect();

    const screenX =
        videoRect.left + x;

    const screenY =
        videoRect.top + y;


    // ========================================
    // ERASE FOG
    // ========================================

    if (fogActive) {

        eraseFingerPath(
            screenX,
            screenY
        );

    }

}


    



// ============================================
// SEND CAMERA FRAME TO HAND TRACKER
// ============================================

async function trackHand() {

    if (!hands ||
        !cameraStream ||
        video.readyState < 2) {

        return;

    }


    if (handTrackingRunning) {

        return;

    }


    handTrackingRunning = true;


    try {

        await hands.send({

            image: video

        });

    }

    catch (error) {

        console.error(
            "Hand tracking error:",
            error
        );

    }

    finally {

        handTrackingRunning = false;

    }

}

// ============================================
// START CAMERA
// ============================================

async function startCamera() {

    try {

        // ========================================
        // GET WEBCAM
        // ========================================

        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: "user"
                },

                audio: false

            });


        // ========================================
        // CONNECT CAMERA TO VIDEO
        // ========================================

        video.srcObject =
            cameraStream;


        // ========================================
        // WAIT FOR VIDEO TO LOAD
        // ========================================

        await new Promise(function(resolve) {

            video.onloadedmetadata = function() {

                resolve();

            };

        });


        // ========================================
        // FORCE VIDEO TO PLAY
        // ========================================

        await video.play();


        console.log(
            "WEBCAM STARTED:",
            video.videoWidth,
            "x",
            video.videoHeight
        );


        // ========================================
        // UPDATE CAMERA STATUS
        // ========================================

        statusText.innerText =
            "Camera Active";

        statusIndicator.style.backgroundColor =
            "green";


        detectionResult.innerText =
            "Waiting for blow...";


        startButton.disabled =
            true;

        stopButton.disabled =
            false;


        // ========================================
        // RESET BLOW DETECTION
        // ========================================

        blowingFrameCount = 0;

        detectionInProgress = false;

        lastDetectionTime = 0;


        // ========================================
        // HIDE FOG
        // ========================================

        hideFog();


        // ========================================
        // START ML BLOW DETECTION
        // ========================================

        requestAnimationFrame(
            captureFrame
        );


        // ========================================
        // START HAND TRACKING
        // ========================================

        initializeHandTracking();

        requestAnimationFrame(
            handTrackingLoop
        );

    }

    catch (error) {

        console.error(
            "CAMERA ERROR:",
            error
        );


        statusText.innerText =
            "Camera could not start";

        statusIndicator.style.backgroundColor =
            "red";


        detectionResult.innerText =
            "Camera error: " +
            error.message;


        // Stop camera if something went wrong

        if (cameraStream) {

            cameraStream
                .getTracks()
                .forEach(function(track) {

                    track.stop();

                });

            cameraStream = null;

        }

    }

}

// ============================================
// HAND TRACKING LOOP
// ============================================

function handTrackingLoop() {

    if (!cameraStream) {

        return;

    }


    trackHand();


    requestAnimationFrame(
        handTrackingLoop
    );

}


// ============================================
// STOP CAMERA
// ============================================

function stopCamera() {

    if (cameraStream) {

        const tracks =
            cameraStream.getTracks();


        tracks.forEach(function(track) {

            track.stop();

        });


        cameraStream = null;

    }


    video.srcObject =
        null;


    statusText.innerText =
        "Camera Stopped";

    statusIndicator.style.backgroundColor =
        "gray";


    detectionResult.innerText =
        "Camera is not running";


    startButton.disabled =
        false;

    stopButton.disabled =
        true;


    // Reset detection

    blowingFrameCount = 0;

    detectionInProgress = false;


    // Hide fingertip

    fingerPoint.style.display =
        "none";


    // Hide fog

    hideFog();

}


// ============================================
// CAPTURE CAMERA FRAME
// ============================================

function captureFrame(timestamp) {

    if (!cameraStream) {

        return;

    }


    // Continue camera loop

    requestAnimationFrame(
        captureFrame
    );


    // Wait until enough time has passed

    if (
        timestamp - lastDetectionTime
        < detectionInterval
    ) {

        return;

    }


    // Do not send another request
    // while previous request is running

    if (detectionInProgress) {

        return;

    }


    lastDetectionTime =
        timestamp;


    // Make sure camera is ready

    if (
        video.videoWidth === 0 ||
        video.videoHeight === 0
    ) {

        return;

    }


    // Set canvas size

    canvas.width =
        video.videoWidth;

    canvas.height =
        video.videoHeight;


    // Draw camera frame

    const context =
        canvas.getContext("2d");


    context.drawImage(

        video,

        0,

        0,

        canvas.width,

        canvas.height

    );


    // Send frame to ML

    detectBlow();

}


// ============================================
// SEND FRAME TO ML
// ============================================

async function detectBlow() {

    detectionInProgress = true;


    try {

        // Convert frame to JPEG

        const blob =
            await new Promise(function(resolve) {

                canvas.toBlob(

                    resolve,

                    "image/jpeg",

                    0.8

                );

            });


        if (!blob) {

            return;

        }


        // Create form data

        const formData =
            new FormData();


        formData.append(

            "frame",

            blob,

            "frame.jpg"

        );


        // Send frame to Spring Boot

        const response =
            await fetch(

                "/api/ml/detect",

                {

                    method: "POST",

                    body: formData

                }

            );


        if (!response.ok) {

            throw new Error(

                "Server returned " +
                response.status

            );

        }


        // Get ML result

        const result =
            await response.json();


        // ====================================
        // BLOWING
        // ====================================

        if (result.blowing) {

            blowingFrameCount++;


            if (
                blowingFrameCount
                >= requiredBlowingFrames
            ) {

                detectionResult.innerText =
                    "💨 BLOW CONFIRMED — " +
                    result.confidence.toFixed(1) +
                    "% confidence";


                // SHOW FOG

                showFog();

            }

            else {

                detectionResult.innerText =
                    "💨 Blowing detected... " +
                    blowingFrameCount +
                    "/" +
                    requiredBlowingFrames;

            }

        }


        // ====================================
        // NOT BLOWING
        // ====================================

        else {

            blowingFrameCount = 0;


            detectionResult.innerText =
                "NOT BLOWING — " +
                result.confidence.toFixed(1) +
                "% confidence";


            // Hide fog

            hideFog();

        }


        console.log(
            "ML Result:",
            result
        );

    }

    catch (error) {

        console.error(

            "ML detection error:",

            error

        );


        detectionResult.innerText =
            "ML connection error";


        blowingFrameCount = 0;


        hideFog();

    }

    finally {

        detectionInProgress = false;

    }

}


// ============================================
// SHOW FOG
// ============================================

function showFog() {

    if (!fogOverlay) {

        console.error(
            "Fog overlay not found!"
        );

        return;

    }


    fogOverlay.classList.add(
        "active"
    );

    fogActive = true;

}


// ============================================
// HIDE FOG
// ============================================

function hideFog() {

    if (!fogOverlay) {

        return;

    }


    fogOverlay.classList.remove(
        "active"
    );

    fogActive = false;

}
