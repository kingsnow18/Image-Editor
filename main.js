const fileInput = document.querySelector("#imageFileInput");
const canvas = document.querySelector("#canvas");
const canvasCtxt = canvas.getContext("2d");
const brightnessInput = document.querySelector("#brightness");
const saturationInput = document.querySelector("#saturation");
const blurInput = document.querySelector("#blur");
const inversionInput = document.querySelector("#inversion");
const cropButton = document.querySelector("#cropButton");
const addTextButton = document.querySelector("#addTextButton");
const textColorInput = document.querySelector("#textColor");
const textSizeInput = document.querySelector("#textSize");
const undoButton = document.querySelector("#undoButton");

const settings = {};
let image = null;
let isCropping = false;
let cropStartX = 0, cropStartY = 0, cropEndX = 0, cropEndY = 0;
let isAddingText = false;
const undoStack = [];  // Stack to store ImageData objects for undo

// Maximum number of states to keep in the undo stack
const MAX_UNDO_STACK_SIZE = 10;

function resetSettings() {
    settings.brightness = "100";
    settings.saturation = "100";
    settings.blur = "0";
    settings.inversion = "0";

    brightnessInput.value = settings.brightness;
    saturationInput.value = settings.saturation;
    blurInput.value = settings.blur;
    inversionInput.value = settings.inversion;
}

function updateSetting(key, value) {
    if (!image) return;

    settings[key] = value;
    renderImage();
}

function generateFilter() {
    const { brightness, saturation, blur, inversion } = settings;
    return `brightness(${brightness}%) saturate(${saturation}%) blur(${blur}px) invert(${inversion}%)`;
}

function renderImage() {
    canvas.width = image.width;
    canvas.height = image.height;
    canvasCtxt.filter = generateFilter();
    canvasCtxt.drawImage(image, 0, 0);
}

function saveCanvasState() {
    // Save the current canvas state to the undo stack
    if (undoStack.length >= MAX_UNDO_STACK_SIZE) {
        undoStack.shift();  // Remove the oldest state if the stack is full
    }
    // Push the current ImageData onto the stack
    undoStack.push(canvasCtxt.getImageData(0, 0, canvas.width, canvas.height));
}

function restoreCanvasState() {
    // Restore the last canvas state from the undo stack
    if (undoStack.length > 0) {
        const previousState = undoStack.pop();
        canvasCtxt.clearRect(0, 0, canvas.width, canvas.height);  // Clear canvas
        canvasCtxt.putImageData(previousState, 0, 0);  // Restore previous state
    }
}

brightnessInput.addEventListener("change", () => updateSetting("brightness", brightnessInput.value));
saturationInput.addEventListener("change", () => updateSetting("saturation", saturationInput.value));
blurInput.addEventListener("change", () => updateSetting("blur", blurInput.value));
inversionInput.addEventListener("change", () => updateSetting("inversion", inversionInput.value));

fileInput.addEventListener("change", () => {
    image = new Image();

    image.addEventListener("load", () => {
        resetSettings();
        renderImage();
        saveCanvasState();  // Save initial state
    });

    image.src = URL.createObjectURL(fileInput.files[0]);
});

cropButton.addEventListener("click", () => {
    isCropping = !isCropping;
    if (isCropping) {
        canvas.style.cursor = "crosshair";
        canvas.addEventListener("mousedown", startCrop);
        canvas.addEventListener("mouseup", endCrop);
    } else {
        canvas.style.cursor = "default";
        canvas.removeEventListener("mousedown", startCrop);
        canvas.removeEventListener("mouseup", endCrop);
    }
});

function startCrop(e) {
    cropStartX = e.offsetX;
    cropStartY = e.offsetY;
}

function endCrop(e) {
    cropEndX = e.offsetX;
    cropEndY = e.offsetY;
    cropImage();
}

function cropImage() {
    const cropWidth = cropEndX - cropStartX;
    const cropHeight = cropEndY - cropStartY;

    saveCanvasState();  
    const croppedImage = canvasCtxt.getImageData(cropStartX, cropStartY, cropWidth, cropHeight);
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    canvasCtxt.putImageData(croppedImage, 0, 0);
}

addTextButton.addEventListener("click", () => {
    isAddingText = !isAddingText;
    if (isAddingText) {
        canvas.addEventListener("click", addTextToImage);
    } else {
        canvas.removeEventListener("click", addTextToImage);
    }
});

function addTextToImage(e) {
    const text = prompt("Enter the text to add:");
    if (text) {
        saveCanvasState();  
        const x = e.offsetX;
        const y = e.offsetY;
        const textColor = textColorInput.value;  
        const textSize = textSizeInput.value;    
        canvasCtxt.font = `${textSize}px Arial`;
        canvasCtxt.fillStyle = textColor;
        canvasCtxt.fillText(text, x, y);
    }
}

undoButton.addEventListener("click", () => {
    restoreCanvasState();
});

resetSettings();