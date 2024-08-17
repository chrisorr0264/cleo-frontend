// face.js
// This function contains functions related to face detection, searching, and handling face locations.

// Initial debug statement
console.log("face.js loaded");

// 
import { fetchAndUpdateTags } from "./tags.js";

// Function to show face boxes when button pressed
export function toggleFaceLocations(type) {
    try {
        const mediaId = document.querySelector('img[data-media-id]').getAttribute('data-media-id');
        const container = document.getElementById('image-container');
        const imageElement = document.getElementById('media-image');

        const img = new Image();
        img.src = imageElement.src;

        img.onload = function() {
            const originalWidth = img.naturalWidth;
            const originalHeight = img.naturalHeight;
            const displayedWidth = imageElement.clientWidth;
            const displayedHeight = imageElement.clientHeight;

            const widthScale = displayedWidth / originalWidth;
            const heightScale = displayedHeight / originalHeight;

            // Clear existing face rectangles
            const existingRects = document.querySelectorAll('.face-rect');
            existingRects.forEach(rect => rect.remove());

            fetch(`/media/fetch-face-locations/${mediaId}/?type=${type}`)
                .then(response => response.json())
                .then(data => {
                    data.face_locations.forEach(face => {
                        if (type === 'identified' && (face.name.startsWith('unknown_') || face.is_invalid)) {
                            return;
                        }

                        const margin = 30;  
                        const topWithMargin = face.top - margin;
                        const rightWithMargin = face.right + margin;
                        const bottomWithMargin = face.bottom + margin;
                        const leftWithMargin = face.left - margin;

                        const scaledTop = topWithMargin * heightScale;
                        const scaledLeft = leftWithMargin * widthScale;
                        const scaledWidth = (rightWithMargin - leftWithMargin) * widthScale;
                        const scaledHeight = (bottomWithMargin - topWithMargin) * heightScale;

                        const rect = document.createElement('div');
                        rect.classList.add('face-rect');
                        rect.style.position = 'absolute';
                        rect.style.border = face.is_invalid ? '2px solid green' : '2px solid red';
                        rect.style.left = `${scaledLeft}px`;
                        rect.style.top = `${scaledTop}px`;
                        rect.style.width = `${scaledWidth}px`;
                        rect.style.height = `${scaledHeight}px`;
                        rect.style.zIndex = '10';
                        container.appendChild(rect);

                        const label = document.createElement('input');
                        label.type = 'text';
                        label.value = (face.name.startsWith('unknown_') && type === 'all') ? '' : face.name || '';  
                        label.classList.add('face-name-input');
                        label.style.position = 'absolute';
                        label.style.top = `${(scaledTop + scaledHeight + 5)}px`;
                        label.style.left = `${scaledLeft}px`;
                        label.style.zIndex = '11';

                        container.appendChild(label);

                        const invalidCheckbox = document.createElement('input');
                        invalidCheckbox.type = 'checkbox';
                        invalidCheckbox.checked = face.is_invalid || false;
                        invalidCheckbox.style.position = 'absolute';
                        invalidCheckbox.style.top = `${scaledTop - 20}px`;
                        invalidCheckbox.style.left = `${scaledLeft}px`;
                        invalidCheckbox.style.zIndex = '12';

                        invalidCheckbox.addEventListener('change', function() {
                            const isInvalid = invalidCheckbox.checked;
                            if (isInvalid) {
                                label.style.display = 'none';
                            } else {
                                label.style.display = 'block';
                                label.focus();
                            }

                            updateFaceValidity(mediaId, face, isInvalid).then(() => {
                                rect.style.border = isInvalid ? '2px solid green' : '2px solid red';
                            }).catch(error => {
                                console.error('Error updating face validity:', error);
                            });
                        });

                        if (label) {
                            label.addEventListener('blur', function() {
                                label.disabled = true;
                                updateFaceName(mediaId, face, label.value, face.encoding_hash).finally(() => {
                                    label.disabled = false;
                                    fetchAndUpdateTags(mediaId);
                                });
                            });
                        }
                        container.appendChild(invalidCheckbox);
                    });
                })
                .catch(error => console.error('Error', error));
        };
    } catch(error) {
        console.error('Error in toggleFaceLocations', error);
    }
}

// Function to search for new face locations and compare to known faces
export function searchFaces() {
    const loadingIndicator = document.getElementById("loading-indicator");
    loadingIndicator.style.display = "block";

    const mediaId = document.querySelector('img[data-media-id]').getAttribute('data-media-id');
    const imageElement = document.querySelector('img[data-media-id]');

    const img = new Image();

    img.src = imageElement.src;

    img.onload = function() {
        const originalWidth = img.naturalWidth;
        const originalHeight = img.naturalHeight;
        const displayedWidth = imageElement.clientWidth;
        const displayedHeight = imageElement.clientHeight;
        const widthScale = displayedWidth / originalWidth;
        const heightScale = displayedHeight / originalHeight;

        fetch(`/media/search-faces/${mediaId}/`)
            .then(response => response.json())
            .then(data => {
                setTimeout(() => {
                    data.faces.forEach(face => {
                        const margin = 30;  
                        const topWithMargin = face.top - margin;
                        const rightWithMargin = face.right + margin;
                        const bottomWithMargin = face.bottom + margin;
                        const leftWithMargin = face.left - margin;

                        const scaledTop = topWithMargin * heightScale;
                        const scaledLeft = leftWithMargin * widthScale;
                        const scaledWidth = (rightWithMargin - leftWithMargin) * widthScale;
                        const scaledHeight = (bottomWithMargin - topWithMargin) * heightScale;

                        const box = document.createElement('div');

                        box.classList.add('face-rect');
                        box.style.position = 'absolute';
                        box.style.border = face.is_invalid ? '2px solid green' : '2px solid red';
                        box.style.top = scaledTop + 'px';
                        box.style.left = scaledLeft + 'px';
                        box.style.width = scaledWidth + 'px';
                        box.style.height = scaledHeight + 'px';
                        box.style.zIndex = '10';

                        const isUnknown = typeof face.name === 'string' && face.name.startsWith('unknown_');
                        const label = document.createElement('input');

                        label.type = 'text';
                        label.value = isUnknown ? '' : face.name || '';  
                        label.classList.add('face-name-input');
                        label.style.position = 'absolute';
                        label.style.top = (scaledTop + scaledHeight + 5) + 'px';
                        label.style.left = scaledLeft + 'px';
                        label.style.zIndex = '11';

                        const invalidCheckbox = document.createElement('input');
                        invalidCheckbox.type = 'checkbox';
                        invalidCheckbox.checked = face.is_invalid || false;
                        invalidCheckbox.style.position = 'absolute';
                        invalidCheckbox.style.top = (scaledTop - 20) + 'px';
                        invalidCheckbox.style.left = scaledLeft + 'px';
                        invalidCheckbox.style.zIndex = '12';

                        invalidCheckbox.addEventListener('change', function() {
                            const isInvalid = invalidCheckbox.checked;
                            if (isInvalid) {
                                label.style.display = 'none';
                            } else {
                                label.style.display = 'block';
                                label.focus();
                            }

                            updateFaceValidity(mediaId, face, isInvalid).then(() => {
                                box.style.border = isInvalid ? '2px solid green' : '2px solid red';
                            }).catch(error => {
                                console.error('Error updating face validity:', error);
                            });
                        });

                        label.addEventListener('blur', function() {
                            label.disabled = true;
                            updateFaceName(mediaId, face, label.value, face.encoding_hash).finally(() => {
                                label.disabled = false;
                                fetchAndUpdateTags(mediaId);
                            });
                        });

                        document.getElementById('image-container').appendChild(box);
                        document.getElementById('image-container').appendChild(label);
                        document.getElementById('image-container').appendChild(invalidCheckbox);

                        if(face.is_invalid) {
                            label.style.display = 'none';
                        }
                    });

                    loadingIndicator.style.display = "none";

                    fetchAndUpdateTags(mediaId);

                }, 500); 
            })
            .catch(error => {
                console.error('Error fetching face data:', error);
                loadingIndicator.style.display = "none";
            });
    };
}

// Function to update the assigned face name
export function updateFaceName(mediaId, face, newName, faceHash) {  

    if (!mediaId || !face || !faceHash) {  
        console.error('JS Missing required parameters');
        return Promise.reject('Missing required parameters');
    }

    const finalName = newName.trim() || `unknown_${mediaId}_${faceHash}`;

    return fetch('/media/update-face-name/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify({
            media_id: mediaId,
            face: {
                top: face.top,
                right: face.right,
                bottom: face.bottom,
                left: face.left
            },
            new_name: finalName,
            face_hash: faceHash  
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('Face name updated successfully:', data);
            fetchAndUpdateTags(mediaId); 
        } else {
            console.error('Error updating face name:', data.error);
        }
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}

// Function to update whether a face location is invalid
export function updateFaceValidity(mediaId, face, isInvalid) {

    return fetch('/media/update-face-validity/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify({
            media_id: mediaId,
            face: {
                top: face.top,
                right: face.right,
                bottom: face.bottom,
                left: face.left
            },
            is_invalid: isInvalid,
            face_hash: face.encoding_hash  // Ensure the hash is used for validation
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('Face validity updated successfully:', data);
        } else {
            console.error('Error updating face validity:', data.error);
        }
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
  }

// Function to mark a face as invalid
export function markFaceAsInvalid(mediaId, faceLocation) {

    console.log(`Marking face as invalid at ${JSON.stringify(faceLocation)} in media ID ${mediaId}`);

    fetch('/media/mark-face-invalid/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify({
            media_id: mediaId,
            face: faceLocation
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Face marked as invalid successfully');

            // Optionally, visually indicate the face as invalid
            document.querySelectorAll('.face-rect').forEach(rect => {
                if (rect.style.top === `${faceLocation.top}px` &&
                    rect.style.left === `${faceLocation.left}px`) {
                    rect.style.border = '2px solid gray';  // Change color to indicate invalid
                    rect.style.opacity = '0.5';  // Make it semi-transparent
                }
            });
        } else {
            console.error('Failed to mark face as invalid:', data.error);
        }
    })
    .catch(error => console.error('Error marking face as invalid:', error));
}

// Function to trigger the manual face recognition process
export function triggerManualFaceRecognition() {
    const mediaId = document.querySelector('img[data-media-id]').getAttribute('data-media-id');
    fetch(`/media/manual-face-recognition/${mediaId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        body: JSON.stringify({
            // Include any required data here
        }),
    })
    .then(response => response.json())
    .then(data => {
        // Handle the response data
        console.log('Manual face recognition triggered successfully:', data);
    })
    .catch(error => console.error('Error triggering manual face recognition:', error));
}

let drawnFaces = [];
let startX, startY, rect;

// Function to start drawing a rectangle
function startDrawing(e) {
    const imageContainer = document.getElementById('image-container');
    const rectBounds = imageContainer.getBoundingClientRect();
    startX = e.clientX - rectBounds.left;
    startY = e.clientY - rectBounds.top;

    rect = document.createElement('div');
    rect.className = 'manual-face-rect';
    rect.style.position = 'absolute';
    rect.style.border = '2px solid blue';
    rect.style.left = `${startX}px`;
    rect.style.top = `${startY}px`;
    rect.style.zIndex = '1000';

    imageContainer.appendChild(rect);
}

// Function to draw a rectangle as the mouse moves
function drawRectangle(e) {
    if (!rect) return;

    const imageContainer = document.getElementById('image-container');
    const rectBounds = imageContainer.getBoundingClientRect();
    const mouseX = e.clientX - rectBounds.left;
    const mouseY = e.clientY - rectBounds.top;

    const width = Math.abs(mouseX - startX);
    const height = Math.abs(mouseY - startY);

    rect.style.width = `${width}px`;
    rect.style.height = `${height}px`;

    if (mouseX < startX) {
        rect.style.left = `${mouseX}px`;
    }
    if (mouseY < startY) {
        rect.style.top = `${mouseY}px`;
    }
}

// Function to finish drawing and save the coordinates
function finishDrawing() {
    if (!rect) return;

    const imageContainer = document.getElementById('image-container');
    const rectBounds = rect.getBoundingClientRect();
    const containerBounds = imageContainer.getBoundingClientRect();

    const left = rectBounds.left - containerBounds.left;
    const top = rectBounds.top - containerBounds.top;
    const right = left + rectBounds.width;
    const bottom = top + rectBounds.height;

    // Store the drawn rectangle for later processing
    drawnFaces.push({ left, top, right, bottom });

    rect = null; // Clear the current rectangle
}

// Function to enable manual drawing
export function enableManualDrawing() {
    console.log('Enabling manual drawing');
    const imageContainer = document.getElementById('image-container');
    imageContainer.addEventListener('mousedown', startDrawing);
    imageContainer.addEventListener('mousemove', drawRectangle);
    imageContainer.addEventListener('mouseup', finishDrawing);
}

// Function to disable manual drawing
export function disableDrawing() {
    const imageContainer = document.getElementById('image-container');
    imageContainer.removeEventListener('mousedown', startDrawing);
    imageContainer.removeEventListener('mousemove', drawRectangle);
    imageContainer.removeEventListener('mouseup', finishDrawing);
}

// Function to remove drawn boxes
export function removeDrawnBoxes() {
    const drawnBoxes = document.querySelectorAll('.manual-face-rect');
    drawnBoxes.forEach(box => box.remove());
}

// Function to process the face locations identified in the manual drawing
export function processManualFaces() {
    const mediaId = document.querySelector('img[data-media-id]').getAttribute('data-media-id');

    // Iterate through each drawn face and send it to the server for processing
    drawnFaces.forEach(faceCoordinates => {
        sendManualFaceData(faceCoordinates, mediaId);
    });

    // Clear the drawn faces array after processing
    drawnFaces = [];

    // Disable drawing and remove drawn boxes
    disableDrawing();
    removeDrawnBoxes();

    // Refresh faces after manual processing
    searchFaces();
}

// Function to send the processed face location information to the backend
export function sendManualFaceData(faceCoordinates, mediaId) {
    const imageElement = document.querySelector('img[data-media-id]');
    const originalWidth = imageElement.naturalWidth;
    const originalHeight = imageElement.naturalHeight;
    const displayedWidth = imageElement.clientWidth;
    const displayedHeight = imageElement.clientHeight;

    const widthScale = originalWidth / displayedWidth;
    const heightScale = originalHeight / displayedHeight;

    // Convert coordinates to original image scale
    const scaledCoordinates = {
        left: Math.round(faceCoordinates.left * widthScale),
        top: Math.round(faceCoordinates.top * heightScale),
        right: Math.round(faceCoordinates.right * widthScale),
        bottom: Math.round(faceCoordinates.bottom * heightScale)
    };

    console.log("Sending the following data:", {
        media_id: mediaId,
        face_locations: scaledCoordinates // Send scaled coordinates to match the original image size
    });

    fetch(`/media/manual-face-recognition/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        body: JSON.stringify({
            media_id: mediaId,
            face_locations: scaledCoordinates, // Send scaled coordinates
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log("Manual face recognition processed successfully:", data);
        } else {
            console.error('Error processing manual face recognition:', data.error);
        }
    })
    .catch(error => console.error('Error sending manual face data:', error));
}
