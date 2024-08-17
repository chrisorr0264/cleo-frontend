

// Cloning the site menu for mobile view
export function siteMenuClone() {

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
}
