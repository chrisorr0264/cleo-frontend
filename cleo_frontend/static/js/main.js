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
    
function moveAllLeft() {

    const availableTags = document.getElementById('available-tags');
    const assignedTags = document.getElementById('assigned-tags');

    while (availableTags.options.length > 0) {
        assignedTags.appendChild(availableTags.options[0]);
    }
}
     
function moveOneLeft() {

    const availableTags = document.getElementById('available-tags');
    const assignedTags = document.getElementById('assigned-tags');
    const selectedOptions = Array.from(availableTags.selectedOptions);

    selectedOptions.forEach(option => {
        assignedTags.appendChild(option);
    });
}
    
function moveAllRight() {

    const availableTags = document.getElementById('available-tags');
    const assignedTags = document.getElementById('assigned-tags');

    while (assignedTags.options.length > 0) {
        availableTags.appendChild(assignedTags.options[0]);
    }
}
    
function moveOneRight() {

    const availableTags = document.getElementById('available-tags');
    const assignedTags = document.getElementById('assigned-tags');
    const selectedOptions = Array.from(assignedTags.selectedOptions);

    selectedOptions.forEach(option => {
        availableTags.appendChild(option);
    });
}

function resetTags() {
    fetchTags();
}
    
      
    
function deleteImage() {
    console.log("Delete Image");
}
    
function addTags() {
    console.log("Add Tags");
}

function searchFaces() {
    console.log("Search Faces");
}

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
    
function toggleFaceLocations(type) {

    const mediaId = document.querySelector('img[data-media-id]').getAttribute('data-media-id');
    const container = document.getElementById('image-container');
    const imageElement = document.getElementById('media-image');

    // Calculate scaling factors
    const originalWidth = 1536; // Your original image width
    const originalHeight = 2048; // Your original image height
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
                label.value = face.name || '';  // Ensure the label is empty if no name is found
                label.classList.add('face-name-input');
                label.style.position = 'absolute';
                label.style.top = `${(face.bottom * heightScale) + 5}px`; // Position the label below the box
                label.style.left = `${face.left * widthScale}px`;
                label.style.zIndex = '11'; 

                container.appendChild(label);
            });
        })
        .catch(error => console.error('Error', error));
}
    
function searchFaces() {

    console.log("Search faces is triggered");

    // Show the loading indicator
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
                console.log("Received data from backend:", data);  

                // Slight delay to simulate processing time
                setTimeout(() => {
                    data.faces.forEach(face => {
                        console.log(`Processing face: top=${face.top}, left=${face.left}, right=${face.right}, bottom=${face.bottom}, name=${face.name}`);

                        const margin = 30;  // Margin for display purposes only

                        // Apply margins only for display
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
                        label.value = isUnknown ? '' : face.name || '';  // Ensure the label is empty if no name is found
                        label.classList.add('face-name-input');
                        label.style.position = 'absolute';
                        label.style.top = (scaledTop + scaledHeight + 5) + 'px'; // Position the label below the box
                        label.style.left = scaledLeft + 'px';
                        label.style.zIndex = '11';

                        const invalidCheckbox = document.createElement('input');
                        invalidCheckbox.type = 'checkbox';
                        invalidCheckbox.checked = face.is_invalid || false;
                        invalidCheckbox.style.position = 'absolute';
                        invalidCheckbox.style.top = (scaledTop - 20) + 'px'; // Position it above the box
                        invalidCheckbox.style.left = scaledLeft + 'px';
                        invalidCheckbox.style.zIndex = '12';

                        invalidCheckbox.addEventListener('change', function() {
                            const isInvalid = invalidCheckbox.checked;
                            console.log("Checkbox changed:", isInvalid);

                            if (isInvalid) {
                                label.style.display = 'none'; // Hide the text box when invalid
                            } else {
                                label.style.display = 'block'; // Show the text box when not invalid
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
                            updateFaceName(mediaId, face, label.value, face.encoding).finally(() => {
                                label.disabled = false;
                                fetchAndUpdateTags(mediaId); //Refresh tags after updating
                            });
                        });

    
                        document.getElementById('image-container').appendChild(box);
                        document.getElementById('image-container').appendChild(label);
                        document.getElementById('image-container').appendChild(invalidCheckbox);

                        if(face.is_invalid) {
                            label.style.display = 'none';
                        }
                    });

                      // Hide the loading indicator
                    loadingIndicator.style.display = "none";

                    // Update tags after processing faces
                    fetchAndUpdateTags(mediaId)

                }, 500); // 500ms delay to ensure visibility
            })
            .catch(error => {
                console.error('Error fetching face data:', error);
                loadingIndicator.style.display = "none"; // Hide the loading indicator on error
            });
    };
}

function fetchAndUpdateTags(mediaId) {
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
        })
        .catch(error => console.error('Error fetching tags:', error));
}
    
// Hide the loading indicator when the page loads
document.addEventListener("DOMContentLoaded", function() {
    const loadingIndicator = document.getElementById("loading-indicator");
    if (loadingIndicator) {
        loadingIndicator.style.display = "none";
    }
});

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
         
function updateFaceName(mediaId, face, newName, faceEncoding) {  

    if (!mediaId || !face || !faceEncoding) {  
        console.error('Missing required parameters');
        return Promise.reject('Missing required parameters');
    }

    // Treat an empty or whitespace-only `newName` as 'unknown'
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
            face_encoding: Array.from(faceEncoding)  // Ensure encoding is passed as an array
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
            fetchAndUpdateTags(mediaId); //Refresh tags
        } else {
            console.error('Error updating face name:', data.error);
        }
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}
        
function markFaceAsInvalid(mediaId, faceLocation) {

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

function triggerManualFaceRecognition() {
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
    })
    .catch(error => console.error('Error:', error));
}

let drawnFaces = [];
let startX, startY, rect;

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

function enableManualDrawing() {
    const imageContainer = document.getElementById('image-container');
    imageContainer.addEventListener('mousedown', startDrawing);
    imageContainer.addEventListener('mousemove', drawRectangle);
    imageContainer.addEventListener('mouseup', finishDrawing);
}

function disableDrawing() {
    const imageContainer = document.getElementById('image-container');
    imageContainer.removeEventListener('mousedown', startDrawing);
    imageContainer.removeEventListener('mousemove', drawRectangle);
    imageContainer.removeEventListener('mouseup', finishDrawing);
}

function removeDrawnBoxes() {
    const drawnBoxes = document.querySelectorAll('.manual-face-rect');
    drawnBoxes.forEach(box => box.remove());
}

function processManualFaces() {
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

    searchFaces();
}

function sendManualFaceData(faceCoordinates, mediaId) {
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

    

// Initial actions on document ready
jQuery(document).ready(function($) {
    "use strict";

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

    var sitePlusMinus = function() {
        $('.js-btn-minus').on('click', function(e){
            e.preventDefault();
            if ($(this).closest('.input-group').find('.form-control').val() != 0) {
                $(this).closest('.input-group').find('.form-control').val(parseInt($(this).closest('.input-group').find('.form-control').val()) - 1);
            } else {
                $(this).closest('.input-group').find('.form-control').val(parseInt(0));
            }
        });
        $('.js-btn-plus').on('click', function(e){
            e.preventDefault();
            $(this).closest('.input-group').find('.form-control').val(parseInt($(this).closest('.input-group').find('.form-control').val()) + 1);
        });
    };

    var siteSliderRange = function() {
        $( "#slider-range" ).slider({
            range: true,
            min: 0,
            max: 500,
            values: [ 75, 300 ],
            slide: function( event, ui ) {
                $( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
            }
        });
        $( "#amount" ).val( "$" + $( "#slider-range" ).slider( "values", 0 ) +
            " - $" + $( "#slider-range" ).slider( "values", 1 ) );
    };

    var siteMagnificPopup = function() {
        $('.image-popup').magnificPopup({
            type: 'image',
            closeOnContentClick: true,
            closeBtnInside: false,
            fixedContentPos: true,
            mainClass: 'mfp-no-margins mfp-with-zoom', // class to remove default margin from left and right side
            gallery: {
                enabled: true,
                navigateByImgClick: true,
                preload: [0,1] // Will preload 0 - before current, and 1 after the current image
            },
            image: {
                verticalFit: true
            },
            zoom: {
                enabled: true,
                duration: 300 // don't forget to change the duration also in CSS
            }
        });

        $('.popup-youtube, .popup-vimeo, .popup-gmaps').magnificPopup({
            disableOn: 700,
            type: 'iframe',
            mainClass: 'mfp-fade',
            removalDelay: 160,
            preloader: false,
            fixedContentPos: false
        });
    };

    var siteCarousel = function () {
        if ($('.nonloop-block-13').length > 0) {
            $('.nonloop-block-13').owlCarousel({
                center: false,
                items: 1,
                loop: true,
                stagePadding: 0,
                margin: 0,
                autoplay: true,
                nav: true,
                navText: ['<span class="icon-arrow_back">', '<span class="icon-arrow_forward">'],
                responsive: {
                    600: {
                        margin: 0,
                        nav: true,
                        items: 2
                    },
                    1000: {
                        margin: 0,
                        stagePadding: 0,
                        nav: true,
                        items: 3
                    },
                    1200: {
                        margin: 0,
                        stagePadding: 0,
                        nav: true,
                        items: 4
                    }
                }
            });
        }

        $('.slide-one-item').owlCarousel({
            center: false,
            items: 1,
            loop: true,
            stagePadding: 0,
            margin: 0,
            autoplay: true,
            pauseOnHover: false,
            nav: true,
            navText: ['<span class="icon-keyboard_arrow_left">', '<span class="icon-keyboard_arrow_right">']
        });
    };

    var siteStellar = function() {
        $(window).stellar({
            responsive: false,
            parallaxBackgrounds: true,
            parallaxElements: true,
            horizontalScrolling: false,
            hideDistantElements: false,
            scrollProperty: 'scroll'
        });
    };

    var siteCountDown = function() {
        $('#date-countdown').countdown('2020/10/10', function(event) {
            var $this = $(this).html(event.strftime(''
                + '<span class="countdown-block"><span class="label">%w</span> weeks </span>'
                + '<span class="countdown-block"><span class="label">%d</span> days </span>'
                + '<span class="countdown-block"><span class="label">%H</span> hr </span>'
                + '<span class="countdown-block"><span class="label">%M</span> min </span>'
                + '<span class="countdown-block"><span class="label">%S</span> sec</span>'));
        });
    };

    var siteDatePicker = function() {
        if ($('.datepicker').length > 0) {
            $('.datepicker').datepicker();
        }
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


    // Check for the unique identifier for the edit_media page
    if (document.querySelector('#edit-media-identifier') || document.querySelector('[data-page-id="edit-media"]')) {
        if (document.querySelector('img[data-media-id]')) {
            fetchTags(); // Call the fetchTags function only on the edit_media page
        } else {
            console.error('Media element not found');
        }
    } else {
        console.log('Not on the edit_media page, fetchTags will not be called.');
    }

    if (document.querySelector('#edit-media-identifier') || document.querySelector('[data-page-id="edit-media"]')) {
        // Attach goBack function to close button
        const closeButton = document.querySelector('#closeButton');
        if (closeButton) {
            closeButton.addEventListener('click', goBack);
            console.log("Event listener attached to close button");
        } else {
            console.error("Close button not found");
        }
    }

    //OPen the Manage Tags Model
    $('#manageTagsButton').on('click', function() {
        $('#manageTagsModal').modal('show');
        loadExistingTags();
    });

    //Load existing tags into the modal
    function loadExistingTags(){
        $.ajax({
            url: '/media/get_tags/',
            method: 'GET',
            success: function(data) {
                const existingTagsList = $('#existingTagsList');
                existingTagsList.empty();
                data.tags.forEach(tag => {
                    existingTagsList.append(`
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span class="tag-name">${tag.tag_name}</span>
                            <div>
                                <button class="btn btn-secondary btn-sm edit-tag" data-tag-id="${tag.tag_id}" data-tag-name="${tag.tag_name}">Edit</button>
                                <button class="btn btn-danger btn-sm delete-tag" data-tag-id="${tag.tag_id}">Delete</button>
                            </div>
                        </li>
                    `);
                });
            }
        });
    }

    // Handle tag creation/update
    $('#tagForm').on('submit', function(event) {
        event.preventDefault();
        const tagName = $('#tagName').val();

        $.ajax({
            url: '/media/manage_tag/', // Replace with your actual endpoint
            method: 'POST',
            data: {
                name: tagName,
                csrfmiddlewaretoken: $('input[name="csrfmiddlewaretoken"]').val()
            },
            success: function() {
                $('#tagName').val('');
                loadExistingTags();
            }
        });
    });

    // Handle tag deletion
    $('#existingTagsList').on('click', '.delete-tag', function() {
        const tagId = $(this).data('tag-id');
        
        if (confirm('Are you sure you want to delete this tag?')) {
            $.ajax({
                url: `/media/delete_tag/${tagId}/`,
                method: 'POST',
                data: {
                    csrfmiddlewaretoken: $('input[name="csrfmiddlewaretoken"]').val()
                },
                success: function() {
                    fetchTags();  // Refresh the list after deletion
                    // Remove the deleted tag from the modal list of available tags
                    $(`#availableTagsModal option[value='${tagId}']`).remove();
                },
                error: function() {
                    alert('An error occurred while deleting the tag.');
                }
            });
        }
    });
    

    // Handle Edit Button Click
    $('#existingTagsList').on('click', '.edit-tag', function() {
        const tagId = $(this).data('tag-id');
        const tagName = $(this).data('tag-name');

        // Replace the tag name with an input field for editing
        const tagElement = $(this).closest('li').find('.tag-name');
        
        // Check if the input field already exists
        if (!tagElement.find('input').length) {
            tagElement.html(`<input type="text" class="form-control tag-edit-input" value="${tagName}">`);
        }

        // Change the Edit button to a Save button
        $(this).text('Save').removeClass('edit-tag btn-secondary').addClass('save-tag btn-success');

        // Disable the Delete button while editing
        $(this).closest('li').find('.delete-tag').prop('disabled', true);
    });

    // Handle Save Button Click (after editing)
    $('#existingTagsList').on('click', '.save-tag', function() {
        const tagId = $(this).data('tag-id');
        const newTagName = $(this).closest('li').find('.tag-edit-input').val().trim();
    
        if (newTagName === '') {
            alert('Tag name cannot be empty.');
            return;
        }
    
        console.log("Sending data:", { tag_id: tagId, name: newTagName });  // Log the data being sent
    
        $.ajax({
            url: '/media/manage_tag/',
            method: 'POST',
            data: {
                tag_id: tagId,
                name: newTagName,
                csrfmiddlewaretoken: $('input[name="csrfmiddlewaretoken"]').val()
            },
            success: function() {
                loadExistingTags();  // Refresh the list after saving
            },
            error: function() {
                alert('An error occurred while updating the tag.');
            }
        });
    });

    $(document).ready(function() {
        // Event listener for when the manage tags modal is closed
        $('#manageTagsModal').on('hidden.bs.modal', function () {
            // Trigger the refresh of the tags list
            fetchTags();  
        });
    });

});
