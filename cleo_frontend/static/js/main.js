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

// Other functions (updateTags, moveAllLeft, moveOneLeft, etc.) go here...

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
