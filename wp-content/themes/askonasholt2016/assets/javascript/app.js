// google maps code

// (function($) {

/*
*  new_map
*
*  This function will render a Google Map onto the selected jQuery element
*
*  @type  function
*  @date  8/11/2013
*  @since 4.3.0
*
*  @param $el (jQuery element)
*  @return  n/a
*/

// var flightPlanCoordinates = [];
var flightPlanCoordinates = new Array();

function new_map( $el, showflightpath ) {
  
  // var
  var $markers = $el.find('.marker');
  
  
  // vars
  var args = {
    zoom        : 16,
    center      : new google.maps.LatLng(0, 0),
    mapTypeId   : google.maps.MapTypeId.ROADMAP,
    scrollwheel : false,

    styles: [

      // attempt to remove indoor maps
      {"stylers": [ {"visibility": "off" } ] },
      {"featureType": "water","stylers": [{"visibility": "on"} ] },
      {"featureType": "poi","stylers": [ {"visibility": "on"} ]},
      {"featureType": "transit","stylers": [{ "visibility": "on"}] },
      { "featureType": "landscape","stylers": [ { "visibility": "on" } ] },
      { "featureType": "road", "stylers": [{ "visibility": "on" } ] },
      { "featureType": "administrative",  "stylers": [{ "visibility": "on" } ] },

    // nice grey
    // {"featureType":"all","elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#000000"},{"lightness":40}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":17}]}]

    // light grey
   {"featureType":"water","elementType":"geometry","stylers":[{"color":"#e9e9e9"},{"lightness":-5}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffffff"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#ffffff"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":16}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":21}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#dedede"},{"lightness":21}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#ffffff"},{"lightness":16}]},{"elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#333333"},{"lightness":40}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#f2f2f2"},{"lightness":19}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#fefefe"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#fefefe"},{"lightness":17},{"weight":1.2}]}]

    //Subtle Grayscale
    //{"featureType":"administrative","elementType":"all","stylers":[{"saturation":"-100"}]},{"featureType":"administrative.province","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"landscape","elementType":"all","stylers":[{"saturation":-100},{"lightness":65},{"visibility":"on"}]},{"featureType":"poi","elementType":"all","stylers":[{"saturation":-100},{"lightness":"50"},{"visibility":"simplified"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":"-100"}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"all","stylers":[{"lightness":"30"}]},{"featureType":"road.local","elementType":"all","stylers":[{"lightness":"40"}]},{"featureType":"transit","elementType":"all","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"water","elementType":"geometry","stylers":[{"hue":"#ffff00"},{"lightness":-25},{"saturation":-97}]},{"featureType":"water","elementType":"labels","stylers":[{"lightness":-25},{"saturation":-100}]}]
  };
  

  // create map           
  var map = new google.maps.Map( $el[0], args);
  
  
  // add a markers reference
  map.markers = [];

  
  
  
  // add markers
  $markers.each(function(){
    
      add_marker( $(this), map );
    
  });

  if(showflightpath){
    add_flightpath( map );
  }
  
  
  // center map
  center_map( map );
  
  
  // return
  return map;
  
}

/*
*  add_marker
*
*  This function will add a marker to the selected Google Map
*
*  @type  function
*  @date  8/11/2013
*  @since 4.3.0
*
*  @param $marker (jQuery element)
*  @param map (Google Map object)
*  @return  n/a
*/



function add_marker( $marker, map ) {

  // var
  var latlng = new google.maps.LatLng( $marker.attr('data-lat'), $marker.attr('data-lng') );

  var new_deets = { lat: parseFloat($marker.attr('data-lat')), lng: parseFloat($marker.attr('data-lng')) };

  // plan flightpath
  flightPlanCoordinates.push( new_deets );

  // create marker
  var marker = new google.maps.Marker({
    position  : latlng,
    map     : map
  });

  // add to array
  map.markers.push( marker );

  // if marker contains HTML, add it to an infoWindow
  if( $marker.html() )
  {
    // create info window
    var infowindow = new google.maps.InfoWindow({
      content   : $marker.html()
    });

    // show info window when marker is clicked
    google.maps.event.addListener(marker, 'click', function() {

      infowindow.open( map, marker );

    });
  }

}

/*
*  center_map
*
*  This function will center the map, showing all markers attached to this map
*
*  @type  function
*  @date  8/11/2013
*  @since 4.3.0
*
*  @param map (Google Map object)
*  @return  n/a
*/

function center_map( map ) {

  // vars
  var bounds = new google.maps.LatLngBounds();

  // loop through all markers and create bounds
  $.each( map.markers, function( i, marker ){

    var latlng = new google.maps.LatLng( marker.position.lat(), marker.position.lng() );

    bounds.extend( latlng );

  });

  // only 1 marker?
  if( map.markers.length == 1 )
  {
    // set center of map
      map.setCenter( bounds.getCenter() );
      map.setZoom( 16 );
  }
  else
  {
    // fit to bounds
    map.fitBounds( bounds );
  }

}



function add_flightpath( map ) {

  // map array
  console.log(flightPlanCoordinates);

  /// lines between them...

   

   var flightPath = new google.maps.Polyline({
     path: flightPlanCoordinates,
     geodesic: true,
     strokeColor: '#FF0000',
     strokeOpacity: 1.0,
     strokeWeight: 2
   });

   flightPath.setMap(map);

}

   

/*
*  document ready
*
*  This function will render each map when the document is ready (page has loaded)
*
*  @type  function
*  @date  8/11/2013
*  @since 5.0.0
*
*  @param n/a
*  @return  n/a
*/
// global var
var map = null;

// JS for site



!function($) {

  $(document).ready(function(){

  	console.log('Site is live ...');


//***********************************
//******** SLICK SLIDER *************
//***********************************

  	$('.center').slick({
  	  centerMode: true,
  	  centerPadding: '60px',
  	  slidesToShow: 1,
  	  autoplay: true,
      pauseOnHover: false,
      arrows: true,
      dots: true,
  	  autoplaySpeed: 5000,
      nextArrow: '<i class="fa fa-angle-right fa-2x"></i>',
      prevArrow: '<i class="fa fa-angle-left fa-2x"></i>',
      //prevArrow:"<img class='a-left control-c prev slick-prev' src='<?php echo get_template_directory_uri(); ?>/assets/images/arrow-left.png'>",
      //nextArrow:"<img class='a-right control-c next slick-next' src='<?php echo get_template_directory_uri(); ?>/assets/images/arrow-right.png'>",
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
  	        centerMode: false,
  	        centerPadding: '40px',
  	        slidesToShow: 1,
  	      }
  	    }
  	  ]
  	});


    //Tours and Projects Slider /  Artists Slider
    $('.multiple-items').slick({
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 1,
      nextArrow: '<i class="fa fa-angle-right fa-2x"></i>',
      prevArrow: '<i class="fa fa-angle-left fa-2x"></i>',

      responsive: [
        {
          breakpoint: 768,
          settings: {
            arrows: true,
            centerMode: true,
            centerPadding: '40px',
            slidesToShow: 1
          }
        },
        {
          breakpoint: 480,
          settings: {
            arrows: true,
            centerMode: false,
            centerPadding: '40px',
            slidesToShow: 1,
          }
        }
      ]
    });


    //***********************************
    //***** SMOOTH SCROLL   *************
    //***********************************

      // smoothScroll.init();

    $(function() {
      $('a[href*="#"]:not([href="#"])').click(function() {
        if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
          var target = $(this.hash);
          target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
          if (target.length) {
            $('html, body').animate({
              scrollTop: target.offset().top-60
            }, 1000);
            return false;
          }
        }
      });
    });


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


    QuickLookInit = function(){

      $('.open-popup-link').magnificPopup({
        type:'inline',
        midClick: true // Allow opening popup on middle mouse click. Always set it to true if you don't provide alternative source in href.
      });

    }

    QuickLookInit();

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

    // jQuery(document).ready(function($){
    //   var timelineBlocks = $('.cd-timeline-block'),
    //     offset = 0.8;

    //   //hide timeline blocks which are outside the viewport
    //   hideBlocks(timelineBlocks, offset);

    //   //on scolling, show/animate timeline blocks when enter the viewport
    //   $(window).on('scroll', function(){
    //     (!window.requestAnimationFrame) 
    //       ? setTimeout(function(){ showBlocks(timelineBlocks, offset); }, 100)
    //       : window.requestAnimationFrame(function(){ showBlocks(timelineBlocks, offset); });
    //   });

    //   function hideBlocks(blocks, offset) {
    //     blocks.each(function(){
    //       ( $(this).offset().top > $(window).scrollTop()+$(window).height()*offset ) && $(this).find('.cd-timeline-img, .cd-timeline-content').addClass('is-hidden');
    //     });
    //   }

    //   function showBlocks(blocks, offset) {
    //     blocks.each(function(){
    //       ( $(this).offset().top <= $(window).scrollTop()+$(window).height()*offset && $(this).find('.cd-timeline-img').hasClass('is-hidden') ) && $(this).find('.cd-timeline-img, .cd-timeline-content').removeClass('is-hidden').addClass('bounce-in');
    //     });
    //   }
    // });





    //*********************************** 
    //***** HTML5 AUDIO PLAYER   ******** 
    //***********************************

    plyr.setup();




    //*********************************** 
    //***** GOOGLE MAPS INNIT    ******** 
    //***********************************

    $('.acf-map').each(function(){

      $showFlightPath = false;

      if($(this).hasClass('show-flightpath')){
        $showFlightPath = true;
      }

      // create map
      map = new_map( $(this), $showFlightPath );

    });



    //*********************************************
    //***** ADD CLASSES TO PAGE NAV TILES  ********
    //*********************************************

    // poss overkill?
    // $( "li.page_item" ).addClass( "small-12 medium-6 columns" );




    //*********************************************
    //*****  STICKY IN-PAGE MENU  *****************
    //*********************************************

    function sticky_relocate() {
        var window_top = $(window).scrollTop();
        var div_top = $('#sticky-anchor').offset().top;
        if (window_top > div_top) {
            $('#sticky').addClass('stick');
            $('#sticky-anchor').height($('#sticky').outerHeight());
        } else {
            $('#sticky').removeClass('stick');
            $('#sticky-anchor').height(0);
        }
    }

    $(function() {
      if( $('body').hasClass('single-artists') ){
        $(window).scroll(sticky_relocate);
        sticky_relocate();
      }
    });

    $(function() {
      if( $('body').hasClass('single-tours-projects') ){
        $(window).scroll(sticky_relocate);
        sticky_relocate();
      }
    });



    //*********************************************
    //***** HIDE SHARE ICONS AFTER 200px   ********
    //*********************************************

    // $(document).scroll(function () {
    //     var y = $(this).scrollTop();
    //     if (y < 400) {
    //         $('#single-post div#share-buttons').fadeIn();
    //     } else {
    //         $('#single-post div#share-buttons').fadeOut();
    //     }

    // });

    $(".social a").wrapInner("<span></span>");


    //*******************************************************
    //***** MAGAZINE ITEMS MAKE HEIGHT OF TALLEST    ********
    //*******************************************************
 if ($(window).width() > 639) {
    var maxheight = 0;

    $('div div.magazine-item').each(function () {
        maxheight = ($(this).height() > maxheight ? $(this).height() : maxheight); 
    });

    $('div div.magazine-item').height(maxheight);
 }



  if ($(window).width() > 639) {
    //video blocks
    var maxheight = 0;

    $('.video-description').each(function () {
        maxheight = ($(this).height() > maxheight ? $(this).height() : maxheight); 
    });

    $('.video-description').height(maxheight);
  }



    //**********************************************
    //       FADE IN UP                   **********
    //**********************************************
    var waypoints = $('.waypoint').waypoint(function(direction) {


      console.log(this.element + ' hit');
      $(this.element).addClass('fadeInUp');
      this.destroy();

     }, {
       offset: '80%'
     })

    //**********************************************
    //    PAGE LOAD DELAY TO AVOID FOUC        *****
    //**********************************************

     $(window).load(function() {
       // When the page has loaded
       $("#loading-delay").fadeOut(100);
     });




     
      $('.popup-gallery').magnificPopup({
        delegate: 'a',
        type: 'image',
        tLoading: 'Loading image #%curr%...',
        mainClass: 'mfp-img-mobile',
        gallery: {
          enabled: true,
          navigateByImgClick: true,
          preload: [0,1] // Will preload 0 - before current, and 1 after the current image
        },
        image: {
          tError: '<a href="%url%">The image #%curr%</a> could not be loaded.',
          titleSrc: function(item) {
            return item.el.attr('title') + '<small>by Marsel Van Oosten</small>';
          }
        }
      });





      // var infinite = new Waypoint.Infinite({
      //   element: $('.infinite-container')[0]
      // })

      




  	})

}(window.jQuery);

