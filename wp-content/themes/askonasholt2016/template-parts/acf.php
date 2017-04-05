<?php
# Get the ACF Fields
// $acf_fields = get_fields();
// echo "<pre>";
// print_r($acf_fields);
// echo "</pre>";

// loop throuhg each section in the ACF fields array
$section_i=0;

// parallax with copy variable, used to target ID of p-lax
// $pwc = 0;

# If there are sections
if ($acf_fields['flexible_content']) {

	// use var to make ID's unique. i.e. if two promo blocks used, they will be ID='promo-1' and ID='promo-3' rather than both ID='promo'
	$i = 0;

	# Loop through the sections
	foreach ($acf_fields['flexible_content'] as $section):

		//add one on to the counter var
		$i++;


		# Force sections to clear
		echo '<div class="clear-section">';

		
		# work out which type of section it is
		switch ( $section['acf_fc_layout']) {


			


			#Artist Details
			case 'artist_details': ?>
				
				<div class="row">
					<!-- <div class="small-12 medium-6 large-3 columns">	
						
						<div class="artist-photo-wrapper">
							<a href="<?php the_permalink(); ?>">
								<div class="artist-thumb" style="background-image: url('<?php echo $section['artist_photo'] ?>')">
								</div>
							</a>
							
							<div class="overlay zoom-gallery">
								<a href="#">
									<i class="fa fa-eye" aria-hidden="true"></i>Quick Look
								</a>
							</div>
						</div>	

						<div class="artist-details">
							<a href="<?php the_permalink(); ?>">
								<span class="artist-category"><?php echo $section['main_category']; ?></span>
								<br>
								<span class="artist-name"><?php echo $section['name']; ?></span>
							</a>
						</div>

					</div> -->

<!-- 					<div class="zoom-gallery">
 -->						<!--

						Width/height ratio of thumbnail and the main image must match to avoid glitches.

						If ratios are different, you may add CSS3 opacity transition to the main image to make the change less noticable.

						 -->
					<!-- 	<a href="http://farm4.staticflickr.com/3763/9204547649_0472680945_o.jpg" data-source="http://500px.com/photo/32736307" title="Into The Blue" style="width:193px;height:125px;">
							<img src="http://farm4.staticflickr.com/3763/9204547649_7de96ee188_t.jpg" width="193" height="125">
						</a>
						<a href="http://farm3.staticflickr.com/2856/9207329420_7f2a668b06_o.jpg" data-source="http://500px.com/photo/32554131" title="Light Sabre" style="width:82px;height:125px;">
							<img src="http://farm3.staticflickr.com/2856/9207329420_e485948b01_t.jpg" width="82px" height="125">
						</a>
					</div> -->

				</div>

			<?php
			break;


			#Text Area
			case 'text_area': ?>
				
				<div class="row">
					<div class="small-12 columns">
						<h1><?php echo $section['text_block']; ?></h1>
					</div>
				</div>


			<?php
			break;


			#Image_Gallery
			case 'image_gallery': ?>

			<div class="image-gallery row" id="image-gallery">

				<div class="small-12 columns">
				
					<h4 id="<?php echo $gallery_section['unique_id'] ?>" class="section-header">Gallery</h4>
						
						<ul class="accordion" data-accordion data-allow-all-closed="false">
						
						<?php
						# Loop through the sections
						$i = 0;
						foreach ($section['gallery_section'] as $gallery_section) { $i++; ?>

								<li class="accordion-item <?php if($i==1) echo 'is-active'; ?>" data-accordion-item>
								  	<a href="#" class="accordion-title">
										<span><?php echo $gallery_section['gallery_description'] ?></span>
										<span class="more-info">
											<span class="show-for-large">View Gallery &nbsp;</span>
										    <svg width="19px" height="19px" viewBox="1365 1803 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
										        <defs></defs>
										        <polyline id="Path-3-Copy-2" stroke="#BA0C2F" stroke-width="1" fill="none" transform="translate(1374.485830, 1812.485830) rotate(135.000000) translate(-1374.485830, -1812.485830) " points="1380.48583 1818.48661 1380.48583 1806.48505 1368.48583 1806.48505"></polyline>
										    </svg>
										</span>
									</a>

									<div class="accordion-content" data-tab-content>
										<div class="my-gallery"  itemscope itemtype="http://schema.org/ImageGallery">
											<div class="multiple-items">
												<?php
												# Loop through the sections
												foreach ($gallery_section['image_repeater'] as $image_repeater) { ?>
										   		    	
										    	<!-- <pre>
										    	<?php //print_r($repeater['image']); ?>
										    	</pre> -->
												
													<figure itemprop="associatedMedia" itemscope itemtype="http://schema.org/ImageObject">
													    <a href="<?php echo $image_repeater['image']['url']; ?>" itemprop="contentUrl" data-size="<?php echo $image_repeater['image']['width'] ?>x<?php echo $image_repeater['image']['height'] ?>">
												       	
												       		<!-- you need it to be an image as the transition takes this image and animates from it -->
			 									        <img src="<?php echo $image_repeater['image']['sizes']['large']; ?>" itemprop="thumbnail" alt="Image description" />

													    </a>
													    <figcaption itemprop="caption description">
													    	<?php echo $image_repeater['image_credit']; ?>
													    </figcaption> 
													 </figure>

 												<!-- 	<div class="popup-gallery">
 														<a href="<?php echo $image_repeater['image']; ?>" title="The Cleaner">
 															<img src="<?php echo $image_repeater['image']; ?>">
 														</a>
 													</div> -->

												<?php } ?>

											</div>
										</div>
										
									</div>

								</li>						

						<?php } ?>

						</ul>

					</div>

				</div>

				
				


				<script type="text/javascript">

					$(document).ready(function(){
					
						var initPhotoSwipeFromDOM = function(gallerySelector) {

						    // parse slide data (url, title, size ...) from DOM elements 
						    // (children of gallerySelector)
						    var parseThumbnailElements = function(el) {
						        var thumbElements = el.childNodes,
						            numNodes = thumbElements.length,
						            items = [],
						            figureEl,
						            linkEl,
						            size,
						            item;

						        for(var i = 0; i < numNodes; i++) {

						            figureEl = thumbElements[i]; // <figure> element

						            // include only element nodes 
						            if(figureEl.nodeType !== 1) {
						                continue;
						            }

						            linkEl = figureEl.children[0]; // <a> element

						            size = linkEl.getAttribute('data-size').split('x');

						            // create slide object
						            item = {
						                src: linkEl.getAttribute('href'),
						                w: parseInt(size[0], 10),
						                h: parseInt(size[1], 10)
						            };



						            if(figureEl.children.length > 1) {
						                // <figcaption> content
						                item.title = figureEl.children[1].innerHTML; 
						            }

						            if(linkEl.children.length > 0) {
						                // <img> thumbnail element, retrieving thumbnail url
						                item.msrc = linkEl.children[0].getAttribute('src');
						            } 

						            item.el = figureEl; // save link to element for getThumbBoundsFn
						            items.push(item);
						        }

						        return items;
						    };

						    // find nearest parent element
						    var closest = function closest(el, fn) {
						        return el && ( fn(el) ? el : closest(el.parentNode, fn) );
						    };

						    // triggers when user clicks on thumbnail
						    var onThumbnailsClick = function(e) {
						        e = e || window.event;
						        e.preventDefault ? e.preventDefault() : e.returnValue = false;

						        var eTarget = e.target || e.srcElement;

						        // find root element of slide
						        var clickedListItem = closest(eTarget, function(el) {
						            return (el.tagName && el.tagName.toUpperCase() === 'FIGURE');
						        });

						        if(!clickedListItem) {
						            return;
						        }

						        // find index of clicked item by looping through all child nodes
						        // alternatively, you may define index via data- attribute
						        var clickedGallery = clickedListItem.parentNode,
						            childNodes = clickedListItem.parentNode.childNodes,
						            numChildNodes = childNodes.length,
						            nodeIndex = 0,
						            index;

						        for (var i = 0; i < numChildNodes; i++) {
						            if(childNodes[i].nodeType !== 1) { 
						                continue; 
						            }

						            if(childNodes[i] === clickedListItem) {
						                index = nodeIndex;
						                break;
						            }
						            nodeIndex++;
						        }



						        if(index >= 0) {
						            // open PhotoSwipe if valid index found
						            openPhotoSwipe( index, clickedGallery );
						        }
						        return false;
						    };

						    // parse picture index and gallery index from URL (#&pid=1&gid=2)
						    var photoswipeParseHash = function() {
						        var hash = window.location.hash.substring(1),
						        params = {};

						        if(hash.length < 5) {
						            return params;
						        }

						        var vars = hash.split('&');
						        for (var i = 0; i < vars.length; i++) {
						            if(!vars[i]) {
						                continue;
						            }
						            var pair = vars[i].split('=');  
						            if(pair.length < 2) {
						                continue;
						            }           
						            params[pair[0]] = pair[1];
						        }

						        if(params.gid) {
						            params.gid = parseInt(params.gid, 10);
						        }

						        return params;
						    };

						    var openPhotoSwipe = function(index, galleryElement, disableAnimation, fromURL) {
						        var pswpElement = document.querySelectorAll('.pswp')[0],
						            gallery,
						            options,
						            items;

						        items = parseThumbnailElements(galleryElement);

						        // define options (if needed)
						        options = {

						            // define gallery index (for URL)
						            galleryUID: galleryElement.getAttribute('data-pswp-uid'),

						            getThumbBoundsFn: function(index) {
						                // See Options -> getThumbBoundsFn section of documentation for more info
						                var thumbnail = items[index].el.getElementsByTagName('img')[0], // find thumbnail
						                    pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
						                    rect = thumbnail.getBoundingClientRect(); 

						                return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
						            }

						        };

						        // PhotoSwipe opened from URL
						        if(fromURL) {
						            if(options.galleryPIDs) {
						                // parse real index when custom PIDs are used 
						                // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
						                for(var j = 0; j < items.length; j++) {
						                    if(items[j].pid == index) {
						                        options.index = j;
						                        break;
						                    }
						                }
						            } else {
						                // in URL indexes start from 1
						                options.index = parseInt(index, 10) - 1;
						            }
						        } else {
						            options.index = parseInt(index, 10);
						        }

						        // exit if index not found
						        if( isNaN(options.index) ) {
						            return;
						        }

						        if(disableAnimation) {
						            options.showAnimationDuration = 0;
						        }

						        // Pass data to PhotoSwipe and initialize it
						        gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
						        gallery.init();
						    };

						    // loop through all gallery elements and bind events
						    var galleryElements = document.querySelectorAll( gallerySelector );

						    for(var i = 0, l = galleryElements.length; i < l; i++) {
						        galleryElements[i].setAttribute('data-pswp-uid', i+1);
						        galleryElements[i].onclick = onThumbnailsClick;
						    }

						    // Parse URL and open gallery if it contains #&pid=3&gid=1
						    var hashData = photoswipeParseHash();
						    if(hashData.pid && hashData.gid) {
						        openPhotoSwipe( hashData.pid ,  galleryElements[ hashData.gid - 1 ], true, true );
						    }
						};

						// execute above function
						initPhotoSwipeFromDOM('.my-gallery');

					});

				</script>


				<!-- Root element of PhotoSwipe. Must have class pswp. -->
				<div class="pswp" tabindex="-1" role="dialog" aria-hidden="true">

				    <!-- Background of PhotoSwipe. 
				         It's a separate element as animating opacity is faster than rgba(). -->
				    <div class="pswp__bg"></div>

				    <!-- Slides wrapper with overflow:hidden. -->
				    <div class="pswp__scroll-wrap">

				        <!-- Container that holds slides. 
				            PhotoSwipe keeps only 3 of them in the DOM to save memory.
				            Don't modify these 3 pswp__item elements, data is added later on. -->
				        <div class="pswp__container">
				            <div class="pswp__item"></div>
				            <div class="pswp__item"></div>
				            <div class="pswp__item"></div>
				        </div>

				        <!-- Default (PhotoSwipeUI_Default) interface on top of sliding area. Can be changed. -->
				        <div class="pswp__ui pswp__ui--hidden">

				            <div class="pswp__top-bar">

				                <!--  Controls are self-explanatory. Order can be changed. -->

				                <div class="pswp__counter"></div>

				                <button class="pswp__button pswp__button--close" title="Close (Esc)"></button>

				                <button class="pswp__button pswp__button--share" title="Share"></button>

				                <button class="pswp__button pswp__button--fs" title="Toggle fullscreen"></button>

				                <button class="pswp__button pswp__button--zoom" title="Zoom in/out"></button>

				                <!-- Preloader demo http://codepen.io/dimsemenov/pen/yyBWoR -->
				                <!-- element will get class pswp__preloader-active when preloader is running -->
				                <div class="pswp__preloader">
				                    <div class="pswp__preloader__icn">
				                      <div class="pswp__preloader__cut">
				                        <div class="pswp__preloader__donut"></div>
				                      </div>
				                    </div>
				                </div>
				            </div>

				            <div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
				                <div class="pswp__share-tooltip"></div> 
				            </div>

				            <button class="pswp__button pswp__button--arrow--left" title="Previous (arrow left)">
				            </button>

				            <button class="pswp__button pswp__button--arrow--right" title="Next (arrow right)">
				            </button>

				            <div class="pswp__caption">
				                <div class="pswp__caption__center"></div>
				            </div>

				        </div>

				    </div>

				</div>
				
			<?php
			break;



			#Text banner
			case 'text_banner': ?>
				<div class="text-banner-wrapper" style="background-image: url('<?php echo $section['background_image']; ?>')">
					<div class="row text-banner">
						<div class="small-12 columns text-banner-area">
							<!-- <span class="banner-header">Making Music Happen</span><br/> -->
							<div class="banner-copy"><?php echo $section['banner_copy']; ?>
							</div>
						</div>
					</div>
				</div>

			<?php
			break;


			#Press Section
			case 'press': ?>
				<!-- <div class="row"> -->
					<div class="press-row row">
						
						<div class="small-12 columns">

							<h4 class="section-header" id="<?php echo $section['unique_id'] ?>">Press</h4>
						
							<ul class="accordion" data-accordion data-allow-all-closed="true">
								
								<?php
								# Loop through the sections
								foreach ($section['press_details'] as $press_section) { ?>

								<li class="accordion-item" data-accordion-item>
								  	<a href="#" class="accordion-title">
										
										<div class="press-details">
											<span class="text_area_one"><?php echo $press_section['date']; ?></span>
											
											<!-- If there is info in text area 1... -->
											<?php if( $press_section['text_area_one'] ): ?>
												<span class="text_area_one"><?php echo $press_section['text_area_one']; ?></span>
											<?php endif; ?>
											
											<!-- If there is info in text area 2... -->
											<?php if( $press_section['text_area_two'] ): ?>
												<span class="text_area_two"><?php echo $press_section['text_area_two']; ?></span>
											<?php endif; ?>

											<br class="hide-for-medium" />
											<?php if( $press_section['location'] ): ?>
												<span class="text_area_three"><?php echo $press_section['location']; ?></span>
											<?php endif; ?>
										</div>	

										<span class="more-info">
											<span class="show-for-large">More info &nbsp;</span>
										    <svg width="19px" height="19px" viewBox="1365 1803 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
										        <defs></defs>
										        <polyline id="Path-3-Copy-2" stroke="#BA0C2F" stroke-width="1" fill="none" transform="translate(1374.485830, 1812.485830) rotate(135.000000) translate(-1374.485830, -1812.485830) " points="1380.48583 1818.48661 1380.48583 1806.48505 1368.48583 1806.48505"></polyline>
										    </svg>
										</span>

									</a>
									<div class="accordion-content" data-tab-content>
									  <?php echo $press_section['press_article']; ?>
									</div>
								</li>

								<?php } ?>

							</ul>
						</div>
					</div>
				<!-- </div> -->

			<?php
			break;

			#Tour Thumnail Links at bottom of page
			case 'tours_thumbnail_links': ?>

				<div class="row thumbnail-links">
					<?php
						# Loop through the sections
						foreach ($section['thumbnail_links'] as $links) { ?>
					
					<div class="small-12 medium-6 large-3 columns thumbnail-link-image" style="background-image: url('<?php echo $links['background_image']; ?>')">
						
							<a class="thumbnail-link" href="<?php echo $links['link_destination']; ?>">
								<span class="thumbnail-link-text"><?php echo $links['link_text']; ?></span>
							</a>

					</div>

					<?php } ?>

				</div>

				

			<?php
			break;

			#Individual Artist's Discography Section
			case 'discography': ?>
				
				<div class="row">
					<div class="small-12 columns">
						<h4 class="section-header" id="<?php echo $section['unique_id'] ?>">Discography</h4>
					</div>
				</div>

				<div class="row">
					<div class="small-12 columns">
						<div class="discography">
								
							<ul class="accordion" data-accordion data-allow-all-closed="true">
							
								<?php
								# Loop through the sections
								foreach ($section['discography_details'] as $discography) { ?>

								<li class="accordion-item" data-accordion-item>
								  	<a href="#" class="accordion-title">
										<div class="press-details">
											<div class="discography-image small-2 columns" style="background-image: url('<?php echo $discography['image']; ?>'); "></div>
											<span class="discoraphy_title"><?php echo $discography['title']; ?></span>

											<span class="more-info">
												<span class="show-for-large">More info &nbsp;</span>
											    <svg width="19px" height="19px" viewBox="1365 1803 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
											        <defs></defs>
											        <polyline id="Path-3-Copy-2" stroke="#BA0C2F" stroke-width="1" fill="none" transform="translate(1374.485830, 1812.485830) rotate(135.000000) translate(-1374.485830, -1812.485830) " points="1380.48583 1818.48661 1380.48583 1806.48505 1368.48583 1806.48505"></polyline>
											    </svg>
											</span>

										</div>	
									</a>

									<div class="accordion-content" data-tab-content>

										<?php if( $discography['label'] ): ?>
											<p class="discoraphy_title"><strong>Label:</strong> <?php echo $discography['label']; ?></p>
										<?php endif; ?>

										<?php if( $discography['release_date'] ): ?>
											<p class="discoraphy_title"><strong>Release Date:</strong> <?php echo $discography['release_date']; ?></p>
										<?php endif; ?>

										<?php if( $discography['optional_header'] ): ?>
											<h4 class="section-header">
												<?php echo $discography['optional_header']; ?>
											</h4>
										<?php endif; ?>

										<?php echo $discography['details']; ?>

										<?php
										  # Loop through the sections of nested repeater
										  foreach ($discography['links'] as $links) { ?>

										  <a target="_blank" href="<?php echo $links['link_destination']; ?>">
										  	<button class="button"><?php echo $links['link_text']; ?></button>
										  </a>

										<?php } ?>

									</div>

								</li>

								<?php } ?>

							</ul>

						</div>
					</div>
				</div>




			<?php
			break;


			#Free Text Section
			case 'free_text_area': ?>
				
				<div class="row free-text" id="<?php echo $section['unique_id'] ?>">
					<div class="small-12 columns">
						<span class="free-text-area narrow-text"><h4><?php echo $section['unique_id'] ?></h4><?php echo $section['free_text'] ?></span>
					</div>
				</div>

			<?php
			break;



			#Individual Artist's Repertoire Section
			case 'repertoire': ?>
				
<!-- 				<div class="press-row row" id="<?php echo $section['unique_id'] ?>">

					<div class="small-12 columns">
					
						<h4 class="section-header">Repertoire</h4>
					
						<ul class="accordion" data-accordion data-allow-all-closed="true">
							
							<?php
							# Loop through the sections
							foreach ($section['repertoire'] as $repertoire) { ?>

							<li class="accordion-item" data-accordion-item>
							  	<a href="#" class="accordion-title">
									
									<div class="press-details">
										<span class="text_area_one"><?php echo $repertoire['repertoire_title']; ?></span>
									</div>	

									<span class="more-info">
										<span class="show-for-large">More info &nbsp;</span>
									    <svg width="19px" height="19px" viewBox="1365 1803 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
									        <defs></defs>
									        <polyline id="Path-3-Copy-2" stroke="#BA0C2F" stroke-width="1" fill="none" transform="translate(1374.485830, 1812.485830) rotate(135.000000) translate(-1374.485830, -1812.485830) " points="1380.48583 1818.48661 1380.48583 1806.48505 1368.48583 1806.48505"></polyline>
									    </svg>
									</span>

								</a>
								<div class="accordion-content" data-tab-content>
								  <?php echo $repertoire['repertoire_details']; ?>
								</div>
							</li>

							<?php } ?>

						</ul>

					</div>
					
				</div> -->

				<div class="press-row row" id="<?php echo $section['unique_id'] ?>">
					<div class="small-12 columns">
					
						<h4 class="section-header">Repertoire</h4>
						<span class="free-text-area narrow-text"><?php echo $section['repertoire'] ?></span>

					</div>
				</div>

			<?php
			break;



			#Audio / Music block
			case 'music_block': ?>

				<div class="row">
					
					<?php 
					// print_r( $section['audio_block'] );
					$audioblock = $section['audio_block'];

					?>

					<?php 

					  // Query Args
					  $args = array(

					    'post_type' => 'post', // this might need to 
					    'post__in'  => $audioblock,
					    
					  );

					  // The Query
					  $the_query = new WP_Query( $args );

					  // The Loop
					  if ( $the_query->have_posts() ) {

					    while ( $the_query->have_posts() ) {

					      $the_query->the_post();
					      get_template_part( 'template-parts/audio-player' );

					    }

					    /* Restore original Post Data */
					    wp_reset_postdata();
					  } else {
					    // no posts found
					  }
					?>

				</div>

				

			<?php
			break;

			#Audio / Music block
			case 'video': ?>

				<div class="row">
					
					<?php 
					//print_r( $section['video'] );
					$video = $section['video'];

					?>

					<div class="large-video-row" id="<?php echo $section['unique_id'] ?>">
						<div class="small-12 columns">
					  		<iframe width="560" height="315" src="https://www.youtube.com/embed/<?php echo $video; ?>" frameborder="0" allowfullscreen></iframe>
					  	</div>
					</div>

					<!-- <div class="video-description">
					  <?php //echo wpdocs_custom_taxonomies_terms_links(); ?>
					  	<div class="video-meta">
						  <span class="video-title">
						  	<?php //the_title(); ?>
						  </span>
						  <?php //the_date('d M Y'); ?>
						</div>
					  <span class="magazine-item-copy"><?php //the_excerpt( __( 'Continue reading...', 'foundationpress' ) ); ?></span>
					</div> -->


					<?php 

					  // // Query Args
					  // $args = array(

					  //   'post_type' => 'post', // this might need to 
					  //   'post__in'  => $video,
					    
					  // );

					  // // The Query
					  // $the_query = new WP_Query( $args );

					  // // The Loop
					  // if ( $the_query->have_posts() ) {

					  //   while ( $the_query->have_posts() ) {

					  //     $the_query->the_post();

					  //     get_template_part( 'template-parts/video-player' );

					  //   }

					  //   /* Restore original Post Data */
					  //   wp_reset_postdata();
					  // } else {
					  //   // no posts found
					  // }
					?>

				</div>

				

			<?php
			break;


			#Video
			case 'extra_video': ?>
			<hr>
 				<div class="row">
					<div class="small-3 columns">
						<h4 class="section-header" id="<?php echo $section['unique_id'] ?>">Video</h4>
					</div>
					<div class="small-9 columns">
						<div class="row large-video-row">
							<iframe width="560" height="315" src="https://www.youtube.com/embed/<?php echo $section['extra_video']; ?>" frameborder="0" allowfullscreen></iframe>
						</div>
					</div>
				</div>

			<?php
			break;




			# Output PRE for anything that's left
			default: ?>
				<pre><?php print_r($section) ?></pre>
				<?php
			break;



		}; # end switch acf_content_type

		$section_i++;

		# Close .clear-section
		echo '</div>';

	endforeach; // end of loop through sections 

# There's no ACF content
} else { 
	//	the_content(); 
};



// EOF