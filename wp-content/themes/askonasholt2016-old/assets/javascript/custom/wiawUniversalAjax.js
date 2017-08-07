/* ===================================================
 * wiawUniversalAjax.js v1.0
 * ===================================================
 */
!function($) {

	$(function(){


		// Click the button!
		$(".archive__load-more a").click( function(){

			// alert('say whaaa?');

			var url = $(this).attr('href'),
				split_url = url.slice(0, -1).split('/'),
				page_num = split_url[ split_url.length-1],
				vars = {};


			if ( isNaN(page_num) ){
				page_num = split_url[ split_url.length-2];
			}

			// Set up the correct vars
			if ( $("#wiaw_taxonomy").length >= 1) {
				vars.taxonomy 	= $("#wiaw_taxonomy").val();
				vars.term_id 	= $("#wiaw_term_id").val();
			} else {
				vars.post_type 	= $("#wiaw_post_type").val();
			}

			console.log(split_url);
			console.log(vars);
			console.log(page_num);

			wiaw_get_more_posts( page_num, vars);

			return false;
		});



		// Get Posts AJAX Call
		function wiaw_get_more_posts( page_num, vars ) {

			// Show the ajax loader
			$(".ajax-spinner").show();
			// hide the next button
			$(".archive__load-more").hide();

			// make sure page_num is being read as an INT
			var page_num = parseInt( page_num);

			// Do the AJAX call
			$.ajax({
				url: js_vars.ajaxurl,
				type: 'post',
				data: {
					action: 'archive_load_more',
					page: 	page_num,
					data:	vars
				},
				error: function(exception){
					alert('Exeption:'+exception);
				},
				success: function( html ) {

					// console.log(html);

					// If there were any results
					if ( html != '') {


						// Update the next page URL
						var btn 					= $(".archive__load-more a"),
							btn_url 				= btn.attr('href');

						btn_url 					= btn_url.slice(0, -1).split('/'),
						btn_url[ btn_url.length-1] 	= (page_num + 1),
						btn_url 					= btn_url.join('/') + '/';

						btn.attr('href', btn_url);


						// Insert the HTML
						$("#ajax-before-me").before( html);

						// show the next button
						$(".archive__load-more").show();

						QuickLookInit(); // added this so that the quicklook works after load more. See app.js function called QuickLookInit

					// No results
					} else {

						// say no posts
						// $("#ajax-before-me").before( '<div class="alert alert-warning"><p>No further results.</p></div>');

					}

					// Hide the ajax loader
					$(".ajax-spinner").hide();
				}
			});
		};
	});



}(window.jQuery);
