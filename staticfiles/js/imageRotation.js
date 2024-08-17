// initImageRotation.js
// This module handles the initialization of image rotation functionality.

// Initial debug statement
console.log("initImageRotation.js loaded");

// 

export function initImageRotation() {
    // Apply image rotations to the front end with CSS
    window.rotateImage = function(mediaId, angle) {
        var image = document.querySelector('img[data-media-id="' + mediaId + '"]');
        var container = document.getElementById('image-container');
        var currentRotation = image.getAttribute('data-rotation') || 0;
        currentRotation = (parseInt(currentRotation) + angle) % 360;

        image.style.transform = 'rotate(' + currentRotation + 'deg)';
        image.setAttribute('data-rotation', currentRotation);

        if (currentRotation % 180 !== 0) {
            container.style.height = image.clientWidth + 'px';
            container.style.width = image.clientHeight + 'px';
        } else {
            container.style.height = '';
            container.style.width = '';
        }
    };

    // Save the rotated image
    window.saveImage = function() {
        var image = document.querySelector('img[data-media-id]');
        var mediaId = image.getAttribute('data-media-id');
        var currentRotation = image.getAttribute('data-rotation') || 0;

        $.ajax({
            url: '/media/save-rotate/' + mediaId + '/',
            method: 'POST',
            data: {
                angle: currentRotation,
                csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            success: function(response) {
                if (response.status === 'success') {
                    console.log('Image and thumbnail saved successfully.');
                } else {
                    console.error('Error saving image and thumbnail:', response.message);
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX error:', status, error);
            }
        });
    };
}




