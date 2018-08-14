jQuery(function ($) {
    'use strict';
    // --------------------------------------------------------------------
    // jQuery One Page Scrolling & Link Handling
    // --------------------------------------------------------------------
		// Select all links with hashes
		$('a[href*=#]:not([href=#])').on('click', function(){
		    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') 
		        || location.hostname == this.hostname) {
		        var target = $(this.hash);
		        target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
		           if (target.length) {
		             $('html,body').animate({
		                 scrollTop: target.offset().top - 20 //scroll position fix
		            }, 737);
		            return false;
		        }
		    }
		});
				
		// Open all external links in new window 
		$('a').filter(function () {return this.hostname != window.location.hostname;}).attr('target', '_blank');
		
		// No event for empty links
		$('a[href=#]').on('click', function(){return false;});
			
    // --------------------------------------------------------------------
    // Closes the Responsive Menu on Menu Item Click
    // --------------------------------------------------------------------
		$('.navbar-nav>li>a,nav a').on('click', function(){
			$('.navbar-collapse').collapse('hide');
		});

}); // JQuery end