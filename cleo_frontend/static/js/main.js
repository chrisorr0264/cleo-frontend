console.log("main.js loaded");

AOS.init({
    duration: 800,
    easing: 'slide',
    once: false
});

// Fetch tags for the current media item
function fetchTags() {
    const mediaElement = document.querySelector('img[data-media-id]');
    if (!mediaElement) {
        console.error('Media element not found');
        return;
    }

    const mediaId = mediaElement.getAttribute('data-media-id');
    console.log(`Fetching tags for media ID: ${mediaId}`);

    fetch(`/media/fetch-tags/${mediaId}/`)
        .then(response => response.json())
        .then(data => {
            const assignedTags = document.getElementById('assigned-tags');
            const availableTags = document.getElementById('available-tags');

            assignedTags.innerHTML = '';
            availableTags.innerHTML = '';

            data.assigned_tags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag.id;
                option.textContent = tag.name;
                assignedTags.appendChild(option);
            });

            data.available_tags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag.id;
                option.textContent = tag.name;
                availableTags.appendChild(option);
            });
        });
}

// Update tags for the current media item
function updateTags() {
    const assignedTags = Array.from(document.getElementById('assigned-tags').options).map(option => option.value);
    const mediaId = document.querySelector('img[data-media-id]').getAttribute('data-media-id');

    fetch('/media/update-tags/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify({
            media_object_id: mediaId,
            assigned_tags: assignedTags
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Tags updated successfully!');
        } else {
            alert('Failed to update tags.');
        }
    });
}

// Move all tags from available to assigned
function moveAllLeft() {
    const availableTags = document.getElementById('available-tags');
    const assignedTags = document.getElementById('assigned-tags');
    while (availableTags.options.length > 0) {
        assignedTags.appendChild(availableTags.options[0]);
    }
}

// Move selected tags from available to assigned
function moveOneLeft() {
    const availableTags = document.getElementById('available-tags');
    const assignedTags = document.getElementById('assigned-tags');
    const selectedOptions = Array.from(availableTags.selectedOptions);
    selectedOptions.forEach(option => {
        assignedTags.appendChild(option);
    });
}

// Move all tags from assigned to available
function moveAllRight() {
    const availableTags = document.getElementById('available-tags');
    const assignedTags = document.getElementById('assigned-tags');
    while (assignedTags.options.length > 0) {
        availableTags.appendChild(assignedTags.options[0]);
    }
}

// Move selected tags from assigned to available
function moveOneRight() {
    const availableTags = document.getElementById('available-tags');
    const assignedTags = document.getElementById('assigned-tags');
    const selectedOptions = Array.from(assignedTags.selectedOptions);
    selectedOptions.forEach(option => {
        availableTags.appendChild(option);
    });
}

// Reset tags to their original state
function resetTags() {
    fetchTags();
}

// Delete the current media item (placeholder function)
function deleteImage() {
    console.log("Delete Image");
}

// Search for faces in the current media item (placeholder function)
function searchFaces() {
    console.log("Search Faces");
}

// Navigate back to the previous page
function goBack(event) {
    event.preventDefault();
    console.log("goBack function called");
    const button = event.currentTarget;
    const url = button.getAttribute('data-url');
    console.log("URL:", url);
    if (url) {
        window.location.href = url;
    } else {
        window.history.back();
    }
}

// Initialize Google Maps with media location
function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: mediaLatitude, lng: mediaLongitude},
        zoom: 8
    });
    var marker = new google.maps.Marker({
        position: {lat: mediaLatitude, lng: mediaLongitude},
        map: map
    });
}

// Toggle the visibility of face locations on the image
function toggleFaceLocations(type) {
    const mediaId = document.querySelector('img[data-media-id]').getAttribute('data-media-id');
    const container = document.getElementById('image-container');
    const imageElement = document.getElementById('media-image');

    const originalWidth = 1536;
    const originalHeight = 2048;
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
                const rect = document.createElement('div');
                rect.classList.add('face-rect');
                rect.style.position = 'absolute';
                rect.style.border = '2px solid red';
                rect.style.left = `${face.left * widthScale}px`;
                rect.style.top = `${face.top * heightScale}px`;
                rect.style.width = `${(face.right - face.left) * widthScale}px`;
                rect.style.height = `${(face.bottom - face.top) * heightScale}px`;
                rect.style.zIndex = '10';
                container.appendChild(rect);

                // Add name label that can be edited
                const label = document.createElement('input');
                label.type = 'text';
                label.value = face.name || '';
                label.classList.add('face-name-input');
                label.style.position = 'absolute';
                label.style.top = `${(face.bottom * heightScale) + 5}px`;
                label.style.left = `${face.left * widthScale}px`;
                label.style.zIndex = '11';

                container.appendChild(label);
            });
        })
        .catch(error => console.error('Error', error));
}

// Update the validity of a face location
function updateFaceValidity(mediaId, face, isInvalid) {
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
            is_invalid: isInvalid
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Face validity updated successfully:', data);
        } else {
            console.error('Error updating face validity:', data.error);
        }
    })
    .catch(error => console.error('There was a problem with the fetch operation:', error));
}

// Update the name of a face in the database
function updateFaceName(mediaId, face, newName, faceEncoding) {
    if (!mediaId || !face || !faceEncoding) {
        console.error('Missing required parameters');
        return Promise.reject('Missing required parameters');
    }

    const finalName = newName.trim() || `unknown_${mediaId}_${faceEncoding.join('')}`;

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
            face_encoding: Array.from(faceEncoding)
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Face name updated successfully:', data);
        } else {
            console.error('Error updating face name:', data.error);
        }
    })
    .catch(error => console.error('There was a problem with the fetch operation:', error));
}

// Initial actions on document ready
jQuery(document).ready(function($) {
    "use strict";

    console.log("Document ready.");

    // Cloning the site menu for mobile view
    var siteMenuClone = function() {
        console.log("Cloning menu...");
        $('.js-clone-nav').each(function() {
            var $this = $(this);
            $this.clone().attr('class', 'site-nav-wrap').appendTo('.site-mobile-menu-body');
        });

        setTimeout(function() {
            var counter = 0;
            $('.site-mobile-menu .has-children').each(function() {
                var $this = $(this);
                $this.prepend('<span class="arrow-collapse collapsed">');

                $this.find('.arrow-collapse').attr({
                    'data-toggle': 'collapse',
                    'data-target': '#collapseItem' + counter,
                });

                $this.find('> ul').attr({
                    'class': 'collapse',
                    'id': 'collapseItem' + counter,
                });

                counter++;
            });
            console.log("Menu cloning completed.");
        }, 1000);

        $('body').on('click', '.arrow-collapse', function(e) {
            var $this = $(this);
            var target = $this.closest('li').find('.collapse');
            if (target.hasClass('show')) {
                $this.removeClass('active');
            } else {
                $this.addClass('active');
            }
            e.preventDefault();
        });

        $(window).resize(function() {
            var w = $(this).width();
            if (w > 768) {
                if ($('body').hasClass('offcanvas-menu')) {
                    $('body').removeClass('offcanvas-menu');
                }
            }
        });

        $('body').on('click', '.js-menu-toggle', function(e) {
            e.preventDefault();
            const navbar = document.querySelector('.sliding-navbar');
            if (navbar) {
                navbar.classList.toggle('shown');
                console.log('Toggled navbar:', navbar.classList);
            } else {
                console.error("Navbar element not found");
            }
        });

        // Close offcanvas menu if clicked outside
        $(document).mouseup(function(e) {
            var container = $(".site-mobile-menu");
            if (!container.is(e.target) && container.has(e.target).length === 0) {
                const navbar = document.querySelector('.sliding-navbar');
                if (navbar && navbar.classList.contains('shown')) {
                    navbar.classList.remove('shown');
                    console.log('Hid navbar:', navbar.classList);
                }
            }
        });
    };

    siteMenuClone();

    // Various site initialization functions
    sitePlusMinus();
    siteSliderRange();
    siteMagnificPopup();
    siteCarousel();
    siteStellar();
    siteCountDown();
    siteDatePicker();

    // FancyBox initialization
    $('[data-fancybox="gallery"]').fancybox({
        buttons: ['zoom', 'thumbs', 'close', 'edit'],
        btnTpl: {
            edit: '<button data-fancybox-edit class="fancybox-button fancybox-button--edit" title="Edit Mode">' +
                    '<i class="fas fa-edit"></i>' +
                  '</button>'
        },
        afterShow: function(instance, current) {
            $('[data-fancybox-edit]').on('click', function() {
                var mediaID = current.opts.$orig.data('media-id');
                window.location.href = '/media/edit/' + mediaID + '/';
            });
        }
    });

    // Attach goBack function to close button
    const closeButton = document.querySelector('.close-button');
    console.log("Close button:", closeButton);
    if (closeButton) {
        closeButton.addEventListener('click', goBack);
        console.log("Event listener attached");
    } else {
        console.error("Close button not found");
    }

    // Apply rotation visually with CSS
    window.rotateImage = function rotateImage(mediaId, angle) {
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

    // Initial fetch of tags when the page loads
    if (document.querySelector('img[data-media-id]')) {
        fetchTags();
    } else {
        console.error('Media element not found');
    }
});
