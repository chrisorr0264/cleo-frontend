// utils.js
// This module maintains the various helper functions.

// Initial debug statement
console.log("utils.js loaded");

// 

// Function to return to the previous page
function goBack(event) {

    event.preventDefault();

    const button = event.currentTarget;
    const url = button.getAttribute('data-url');

    if (url) {
        window.location.href = url;
    } else {
        window.history.back();
    }
}

// Utility function to support the plus and minus buttons on a counter object
function sitePlusMinus () {
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

// Utility function to support the range of a slider
function siteSliderRange () {
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

// Utility function to initialize the Magnific Popup plugin
function siteMagnificPopup () {
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

// Utility function to initialize a carousel (or slider) using the Owl Carousel jQuery plugin
function siteCarousel () {
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

// Utility function to initialize the Stellar.js plugin, which provides parallax scrolling (objects at different distances move at different speeds)
function siteStellar () {
    $(window).stellar({
        responsive: false,
        parallaxBackgrounds: true,
        parallaxElements: true,
        horizontalScrolling: false,
        hideDistantElements: false,
        scrollProperty: 'scroll'
    });
};

// Utility function that initialized a countdown timer using the jQuery Countdown plugin.
function siteCountDown () {
    $('#date-countdown').countdown('2020/10/10', function(event) {
        var $this = $(this).html(event.strftime(''
            + '<span class="countdown-block"><span class="label">%w</span> weeks </span>'
            + '<span class="countdown-block"><span class="label">%d</span> days </span>'
            + '<span class="countdown-block"><span class="label">%H</span> hr </span>'
            + '<span class="countdown-block"><span class="label">%M</span> min </span>'
            + '<span class="countdown-block"><span class="label">%S</span> sec</span>'));
    });
};

// Utility function to use the jQuery Datepicker to make date input interactive calendar inputs.
function siteDatePicker () {
    if ($('.datepicker').length > 0) {
        $('.datepicker').datepicker();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initFancyBox();
});

// Utility function to initialize the FancyBox
function initFancyBox () {

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
};

// Utility function to convert hex to bytes
function hexToBytes(hex) {
    const bytes = [];
    for (let c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return new Uint8Array(bytes);
}