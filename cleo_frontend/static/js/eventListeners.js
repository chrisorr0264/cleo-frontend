// eventListeners.js
// This module handles the initialization of the event listeners.

// Initial debug statement
console.log("eventListeners.js loaded");

// Import fetchAndUpdateTags from tags.js
import { fetchAndUpdateTags, moveAllRight,moveOneRight, moveAllLeft, moveOneLeft, updateTags, resetTags } from './tags.js';
import { toggleFaceLocations, enableManualDrawing, processManualFaces, clearFaceBoxes, searchFaces } from './faces.js';

export function bindEventListeners() {

    // Check if the hidden identifier is present on the page
    const editMediaIdentifier = document.getElementById('edit-media-identifier');

    if (editMediaIdentifier) {
        
        const mediaId = document.querySelector('img[data-media-id]').getAttribute('data-media-id');
        const csrftoken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');


        // Event listener to control the editability of the date on the edit photo page.
        const lockIcon = document.getElementById('lock-icon');
        const dateDisplay = document.getElementById('date-display');
        const dateEdit = document.getElementById('date-edit');
        const yearInput = document.getElementById('year-input');
        const monthInput = document.getElementById('month-input');
        const dayInput = document.getElementById('day-input');
        const dateLockToggle = document.getElementById('date-lock-toggle');

        if (dateLockToggle) {
            dateLockToggle.addEventListener('click', function() {
                if (lockIcon.classList.contains('fa-lock')) {
                    // Unlock the field
                    lockIcon.classList.remove('fa-lock');
                    lockIcon.classList.add('fa-unlock');
                    dateDisplay.style.display = 'none';
                    dateEdit.style.display = 'inline';
                    yearInput.focus();
                } else {
                    // Lock the field
                    lockIcon.classList.remove('fa-unlock');
                    lockIcon.classList.add('fa-lock');
                    dateDisplay.style.display = 'inline';
                    dateEdit.style.display = 'none';

                    // Construct the partial date
                    const year = yearInput.value || "";
                    const month = monthInput.value ? monthInput.value.padStart(2, '0') : "";
                    const day = dayInput.value ? dayInput.value.padStart(2, '0') : "";

                    let partialDate = year;
                    if (month) partialDate += `-${month}`;
                    if (day) partialDate += `-${day}`;

                    dateDisplay.textContent = partialDate || "Unknown";

                    console.log('Media ID: ', mediaId);
                    console.log('Partial Date: ', partialDate);
                    
                    fetch(`/media/update_date/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrftoken,
                        },
                        body: JSON.stringify({
                            media_id: mediaId,
                            media_create_date: partialDate
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if(data.success) {
                            console.log('Date updated successfully');
                        } else {
                            console.error('Failed to update date');
                            alert('Failed to update the date. Please try again.');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('An error occurred while updating the date. Please try again.');
                    });
                }
            });
        }

        fetchAndUpdateTags(mediaId);

        // Attach goBack function to close button
        const closeButton = document.querySelector('#closeButton');
        if (closeButton) {
            closeButton.addEventListener('click', goBack);
        } else {
            console.error("Close button not found");
        }

        // Event listener for moving all tags to the right
        const moveAllRightButton = document.getElementById('moveAllRightBtn');
        if (moveAllRightButton) {
            moveAllRightButton.addEventListener('click', function () {
                moveAllRight(mediaId);
            });
        }

        // Event listener for moving one tag to the right
        const moveOneRightButton = document.getElementById('moveOneRightBtn');
        
        if (moveOneRightButton) {
            moveOneRightButton.addEventListener('click', function () {
                moveOneRight(mediaId);
            });
        }

        // Event listener for moving all tags to the left
        const moveAllLeftButton = document.getElementById('moveAllLeftBtn');
        if (moveAllLeftButton) {
            moveAllLeftButton.addEventListener('click', function () {
                moveAllLeft(mediaId);
            });
        }

        // Event listener for moving one tag to the left
        const moveOneLeftButton = document.getElementById('moveOneLeftBtn');
        if (moveOneLeftButton) {
            moveOneLeftButton.addEventListener('click', function () {
                moveOneLeft(mediaId);
            });
        }

        // Event listener for updating tags
        const updateTagsButton = document.getElementById('updateTagsBtn');
        if (updateTagsButton) {
            updateTagsButton.addEventListener('click', function () {
                updateTags();
            });
        }

        // Event listener for moving all tags to the right
        const resetTagsButton = document.getElementById('resetTagsBtn');
        if (resetTagsButton) {
            resetTagsButton.addEventListener('click', function () {
                resetTags();
            });
        }

        // Event listener for showing all faces
        const toggleAllFacesButton = document.getElementById('toggle-all-faces');
        if (toggleAllFacesButton) {
            toggleAllFacesButton.addEventListener('click', function() {
                toggleFaceLocations('all');
            });
        }

        // Event listener for showing identified faces
        const toggleIdentifiedFacesButton = document.getElementById('toggle-identified-faces');
        if (toggleIdentifiedFacesButton) {
            toggleIdentifiedFacesButton.addEventListener('click', function() {
                toggleFaceLocations('identified');
            });
        }

        // Event listener for searching faces
        const searchFacesButton = document.getElementById('search-faces');
        if (searchFacesButton) {
            searchFacesButton.addEventListener('click', function() {
                searchFaces();
            });
        }

        // Event listener for clearing face boxes
        const clearFaceBoxesButton = document.getElementById('clear-face-boxes');
        if (clearFaceBoxesButton) {
            clearFaceBoxesButton.addEventListener('click', function() {
                clearFaceBoxes();
            });
        }

        // Event listener for enabling manual drawing
        const enableManualDrawingButton = document.getElementById('enable-manual-drawing');
        if (enableManualDrawingButton) {
            enableManualDrawingButton.addEventListener('click', function() {
                enableManualDrawing();
            });
        }

        // Event listener for processing drawn faces
        const processDrawnFacesButton = document.getElementById('process-manual-faces');
        if (processDrawnFacesButton) {
            processDrawnFacesButton.addEventListener('click', function() {
                processManualFaces();
            });
        }

        // Event listener to bind the delete button to delete an image
        const deleteButton = document.getElementById('delete-button');
        if (deleteButton) {
            deleteButton.addEventListener('click', function() {
                const mediaId = this.getAttribute('data-media-id');

                if (confirm('Are you sure you want to delete this image?')) {
                    // Retrieve the CSRF token
                    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

                    if (!csrftoken) {
                        alert('CSRF token not found.');
                        return;
                    }

                    fetch(`/media/delete_image/${mediaId}/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrftoken
                        },
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Image deleted successfully');
                            window.location.href = '/media/gallery/';  // Redirect to gallery after deletion
                        } else {
                            alert('Error: ' + data.error);
                        }
                    })
                    .catch(error => {
                        alert('Failed to delete the image.');
                        console.error('Error:', error);
                    });
                }
            });
        }

        // Event listener to bind the toggle switch to update the is_secret field
        const isSecretButton = document.getElementById('toggleSecret');
        if (isSecretButton) {
            isSecretButton.addEventListener('change', function() {  // Use 'change' instead of 'click'
                const isSecret = this.checked;
                const mediaId = this.getAttribute('data-media-id');
                
                fetch(`/media/update_is_secret/${mediaId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': '{{ csrf_token }}',
                    },
                    body: JSON.stringify({ 'is_secret': isSecret })
                })
                .then(response => response.json())
                .then(data => {
                    if(data.success) {
                        console.log('is_secret updated successfully');
                    } else {
                        console.error('Failed to update is_secret');
                    }
                })
                .catch(error => console.error('Error:', error));
            });
        }


        // Event listener for the tag modal close event
        listenForTagModalClose();
    }

    // Event listener to hide the loading indicator when the page loads
    window.addEventListener('load', function() {
        const loadingIndicator = document.getElementById("loading-indicator");
        if (loadingIndicator) {
            loadingIndicator.style.display = "none";
        }
    });

}

export function listenForTagModalClose() {
    $('#manageTagsModal').on('hidden.bs.modal', function () {
        // Trigger the refresh of the tags list
        const mediaId = document.querySelector('img[data-media-id]').getAttribute('data-media-id');
        fetchAndUpdateTags(mediaId);  
    });
}
