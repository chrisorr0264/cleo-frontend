// eventListeners.js
// This module handles the initialization of the event listeners.

// Initial debug statement
console.log("eventListeners.js loaded");

// Import fetchAndUpdateTags from tags.js
import { fetchAndUpdateTags } from './tags.js';
import { toggleFaceLocations } from './faces.js';

export function bindEventListeners() {

    // Check if the hidden identifier is present on the page
    const editMediaIdentifier = document.getElementById('edit-media-identifier');

    if (editMediaIdentifier) {
        
        const mediaId = document.querySelector('img[data-media-id]').getAttribute('data-media-id');

        fetchAndUpdateTags(mediaId);

        // Attach goBack function to close button
        const closeButton = document.querySelector('#closeButton');
        if (closeButton) {
            closeButton.addEventListener('click', goBack);
        } else {
            console.error("Close button not found");
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

        // Event listener for enabling manual drawing
        const enableManualDrawingButton = document.getElementById('enable-manual-drawing');
        if (enableManualDrawingButton) {
            enableManualDrawingButton.addEventListener('click', function() {
                enableManualDrawing();
            });
        }

        // Event listener for processing drawn faces
        const processDrawnFacesButton = document.getElementById('process-drawn-faces');
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
        fetchandUpdateTags(mediaId);  
    });
}
