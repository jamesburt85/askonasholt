// JS for site

!function($) {

  $(document).ready(function(){

  	console.log('Run the Jewels fast ...');


//***********************************
//******** SLICK SLIDER *************
//***********************************

  	$('.center').slick({
  	  centerMode: true,
  	  centerPadding: '60px',
  	  slidesToShow: 1,
  	  autoplay: false,
      arrows: true,
      dots: true,
  	  autoplaySpeed: 4000,
      // prevArrow:"<img class='a-left control-c prev slick-prev' src='<?php echo get_template_directory_uri(); ?>/assets/images/arrow-left.png'>",
      // nextArrow:"<img class='a-right control-c next slick-next' src='<?php echo get_template_directory_uri(); ?>/assets/images/arrow-right.png'>",
  	  responsive: [
  	    {
  	      breakpoint: 768,
  	      settings: {
  	        arrows: false,
  	        centerMode: true,
  	        centerPadding: '40px',
  	        slidesToShow: 3
  	      }
  	    },
  	    {
  	      breakpoint: 480,
  	      settings: {
  	        arrows: false,
  	        centerMode: true,
  	        centerPadding: '40px',
  	        slidesToShow: 1
  	      }
  	    }
  	  ]
  	});



//***********************************
//***** SMOOTH SCROLL   *************
//***********************************

        smoothScroll.init();









  	})

}(window.jQuery);

