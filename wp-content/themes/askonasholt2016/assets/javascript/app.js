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


    //Tours and Projects Slider
    $('.multiple-items').slick({
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 3
    });


    //***********************************
    //***** SMOOTH SCROLL   *************
    //***********************************

      smoothScroll.init();


    //*********************************** 
    //***** MAGNIFIC POP UP *************
    //***********************************

    $(document).ready(function() {
      $('.zoom-gallery').magnificPopup({
        delegate: 'a',
        type: 'image',
        closeOnContentClick: false,
        closeBtnInside: false,
        mainClass: 'mfp-with-zoom mfp-img-mobile',
        image: {
          verticalFit: true,
          titleSrc: function(item) {
            return item.el.attr('title') + ' &middot; <a class="image-source-link" href="'+item.el.attr('data-source')+'" target="_blank">image source</a>';
          }
        },
        gallery: {
          enabled: true
        },
        zoom: {
          enabled: true,
          duration: 300, // don't foget to change the duration also in CSS
          opener: function(element) {
            return element.find('img');
          }
        }
        
      });
    });

    //*********************************** 
    //***** SEARCH BAR TOGGLE UP ********
    //***********************************
    // search-bar-is-visible
    $searchtoggle = $('#search-toggle');

    $searchtoggle.on("click", function(e){
      e.preventDefault();
      $('body').toggleClass('search-bar-is-visible');
    });















  	})

}(window.jQuery);

