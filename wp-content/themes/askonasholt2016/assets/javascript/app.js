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
  	        slidesToShow: 1
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


    $('.open-popup-link').magnificPopup({
      type:'inline',
      midClick: true // Allow opening popup on middle mouse click. Always set it to true if you don't provide alternative source in href.
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



    //*********************************** 
    //*****  TIMELINE BOUNCE IN  ********
    //***********************************

    //jQuery(document).ready(function($){
      var timelineBlocks = $('.cd-timeline-block'),
        offset = 0.8;

      //hide timeline blocks which are outside the viewport
      hideBlocks(timelineBlocks, offset);

      //on scolling, show/animate timeline blocks when enter the viewport
      $(window).on('scroll', function(){
        (!window.requestAnimationFrame) 
          ? setTimeout(function(){ showBlocks(timelineBlocks, offset); }, 100)
          : window.requestAnimationFrame(function(){ showBlocks(timelineBlocks, offset); });
      });

      function hideBlocks(blocks, offset) {
        blocks.each(function(){
          ( $(this).offset().top > $(window).scrollTop()+$(window).height()*offset ) && $(this).find('.cd-timeline-img, .cd-timeline-content').addClass('is-hidden');
        });
      }

      function showBlocks(blocks, offset) {
        blocks.each(function(){
          ( $(this).offset().top <= $(window).scrollTop()+$(window).height()*offset && $(this).find('.cd-timeline-img').hasClass('is-hidden') ) && $(this).find('.cd-timeline-img, .cd-timeline-content').removeClass('is-hidden').addClass('bounce-in');
        });
      }
    //});





    //*********************************** 
    //***** HTML5 AUDIO PLAYER   ******** 
    //***********************************

    plyr.setup();







  	})

}(window.jQuery);

