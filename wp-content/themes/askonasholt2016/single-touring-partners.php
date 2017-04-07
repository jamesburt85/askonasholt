<?php
/**
 * The template for displaying all single posts and attachments
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>

<?php get_template_part( 'template-parts/single-artist-hero' ); ?>

<div id="single-post" role="main">

<?php do_action( 'foundationpress_before_content' ); ?>
<?php while ( have_posts() ) : the_post(); ?>
	<article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">

		<?php do_action( 'foundationpress_post_before_entry_content' ); ?>


		<div class="entry-content">


			<?php 
				// get VARS
				$bio = get_field('bio');
				$position = get_field('position');
				$website = get_field('website');
				$contact_text_area = get_field('contact_text_area');
				$publicity_pack = get_field('publicity_pack');
			?>

			<div class="bio-row row" id="intro">
				<div class="small-12 large-9 columns hide-for-large" id="introduction">
					<h4 class="section-header">Introduction</h4>
					<?php echo $bio; ?>
					<hr>
				</div>
				<div class="small-12 large-6 columns artist-contacts">
					<h4 class="section-header">Contact</h4>

						<?php 

							$related_staff = get_field('related_staff');
							
							// print_r($related_staff);

							if (!empty($related_staff)) {
								foreach ($related_staff as $artist_id) { 

									# Get Permalink to artist page:
									$artist_url = get_permalink($artist_id);

									?> 

									<div class="side-bar-artist"> <?php
										# Get featured image id
										$thumb_id = get_post_thumbnail_id($artist_id);
										# If there is not a featured image
										if ( empty( $thumb_id)) {
											$thumb_url = 'http://placehold.it/150x150';
										# Yeay, we have an image ID
										} else {
											# Get the image from the image ID
											$thumb_url_array = wp_get_attachment_image_src($thumb_id, 'thumbnail', true);
											$thumb_url = $thumb_url_array[0];
										}
										//echo $thumb_url;

										?>
										
										<img class="circle-thumb" src="<?php echo $thumb_url ?>">
										
										<div class="side-bar-artist-details contact">
											<a class="side-bar-link" href="<?php echo $artist_url; ?>">
												<span class="side-bar-artist-name"><?php echo get_the_title( $artist_id) ?>
											
											&nbsp;
										        <svg class="red-arrow" width="19px" height="19px" viewBox="469 852 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
										            <g id="Group-6" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(470.000000, 853.000000)">
										                <path d="M2.33453917,14.1812268 L13.6654423,2.88473916" id="Path-2" stroke="#BA0C2F" transform="translate(7.999991, 8.532983) rotate(45.000000) translate(-7.999991, -8.532983) "></path>
										                <polyline id="Path-3" stroke="#BA0C2F" transform="translate(10.324505, 8.521204) rotate(45.000000) translate(-10.324505, -8.521204) " points="14.5739552 12.7712037 14.5739552 4.27120371 6.07505388 4.27120371"></polyline>
										            </g>
										        </svg>
										      </a>
											</span><br/>
											
											<?php 
												$position = get_field( 'position', $artist_id );
											?>

											<span>
												<?php echo $position; ?>
											</span>

										</div>

									</div> <!-- Side bar Artist END -->
								
								<?php }
							} ?>

					<div class="side-bar-text-area"><?php echo $contact_text_area; ?></div>
					<br/>


					<div class="artist-social">

						<?php if( have_rows('social_buttons') ): ?>

							<?php while( have_rows('social_buttons') ): the_row(); 

								?>

								<a href="<?php the_sub_field('social_media_link'); ?>" target="_blank">
									<i class="fa fa-<?php the_sub_field('social_media_name'); ?>" aria-hidden="true"></i>
								</a>

							<?php endwhile; ?>

						<?php endif; ?>
						
						<br/>
						
						<a class="website" href="http://www.<?php echo $website; ?>" target="_blank"><?php echo $website; ?></a>

					</div>	<!-- artist-social END	 -->

					<ul class="quick-look-links">
						<?php if( get_field('publicity_pack') ): ?>
							<li>
								<a href="<?php echo $publicity_pack; ?>" target="_blank">
									<img src="<?php echo get_template_directory_uri(); ?>/assets/images/download-arrow.png">
									&nbsp;
									Download Publicity Pack
								</a>
							</li>
						<?php endif; ?>
						
						<li>
							<a href="mailto:?subject= <?php the_title(); ?> &amp;body=C<?php the_permalink(); ?>">
							<img src="<?php echo get_template_directory_uri(); ?>/assets/images/share-arrow.png">
								&nbsp;
								Share
							</a>
						</li>
					</ul>

				</div>
				<div class="small-12 large-6 columns show-for-large" id="introduction">
					<h4 class="section-header">Introduction</h4>
					<?php echo $bio; ?>
				</div>
			</div> <!-- Bio Row END -->


			<!-- If they have videos and audio (with related clients) -->
			<?php 

			/*
			*  Query posts for a relationship value.
			*  This method uses the meta_query LIKE to match the string "123" to the database value a:1:{i:0;s:3:"123";} (serialized array)
			*/

			$videos = get_posts(array(
				'post_type' => 'post',

				'tax_query' => array(
				        array(
				            'taxonomy' => 'post_format',
				            'field' => 'slug',
				            'terms' => array( 'post-format-video' ),
				        )
				    ),

				'meta_query' => array(
					array(
						'key' => 'related_client', // name of custom field
						'value' => '"' . get_the_ID() . '"', // matches exaclty "123", not just 123. This prevents a match for "1234"
						'compare' => 'LIKE'
					)
				)
			));

			?>

			<?php if( $videos ): ?>

			<div class="video-audio-area" id="video-audio">

				<div class="row">
					<h4 class="section-header small-12 columns">Video &amp; Audio</h4>

					<?php
					foreach( $videos as $post ): setup_postdata( $post ); ?>
						
						<div class="small-12 medium-6 large-3 columns artist-video-area">
							<a href="<?php the_permalink(); ?>">
								<?php get_template_part( 'template-parts/video-player' ); ?>
							</a>
						</div>

					<?php

					endforeach;

					wp_reset_postdata(); ?>
				<!--  </ul> -->
				</div>

			<?php endif; ?>

			<!-- ANY AUDIO POSTS? -->
			<div class="row">

					<?php 

					/*
					*  Query posts for a relationship value.
					*  This method uses the meta_query LIKE to match the string "123" to the database value a:1:{i:0;s:3:"123";} (serialized array)
					*/

					// $theID = get_the_ID();

					$tracks = get_posts(array(
						'post_type' => 'post',

						'tax_query' => array(
						        array(
						            'taxonomy' => 'post_format',
						            'field' => 'slug',
						            'terms' => array( 'post-format-audio' ),
						        )
						    ),

						'meta_query' => array(
							array(
								'key' => 'related_client', // name of custom field
								'value' => '"' . get_the_ID() . '"', // matches exaclty "123", not just 123. This prevents a match for "1234"
								'compare' => 'LIKE'
							)
						)
					));

					// echo "<pre>";
					// the_ID();
					// print_r($tracks);
					// echo "</pre>";

					?>
					<?php if( !empty($tracks) ): ?>
						<!-- <ul> -->
						<?php
							foreach( $tracks as $post ): setup_postdata( $post );

								get_template_part( 'template-parts/audio-player' );

							endforeach;

							wp_reset_postdata(); ?>
						<!--  </ul> -->
					<?php endif; ?>

				</div>

			</div>

			<div class="performance-schedule row" id="schedule">

				<div class="small-12 columns">
				
				<!-- Get Events -->
				  <?php 

				    // Query Args
				      $args = array(

				        'post_type'   => 'events',
				        'posts_per_page' => 4,
				        'meta_key'      => 'date',
				        'orderby'     => 'meta_value',
				        'order'       => 'ASC',

				        'meta_query' => array(
				        	array(
				        		'key' => 'related_touring_partners', // name of custom field
				        		'value' => '"' . get_the_ID() . '"', // matches exaclty "123", not just 123. This prevents a match for "1234"
				        		'compare' => 'LIKE'
				        	),
							array(
								'key' => 'date',
								'value' => date('Ymd', strtotime('now')),
								'type' => 'numeric',
								'compare' => '>=',
							),				        	
				        ),

				      );


				      // The Query
				      $the_query = new WP_Query( $args );

				    // The Loop
				    if ( $the_query->have_posts() ) { ?>
				    	
				    	<div class="row press-row show-for-large"><!-- Show for large -->
				    	<h4 class="section-header small-12 columns">Performance Schedule</h4>
				    	  <div class="small-12 columns"><!-- Show for large -->
				    	    <ul class="accordion" data-accordion data-allow-all-closed="true"><!-- Show for large -->
				      
				      <?php //echo '<ul>';
				      while ( $the_query->have_posts() ) {
				        $the_query->the_post(); ?>
				<!--         //echo '<li>' . get_the_title() . '</li>';

				        //get_template_part( 'template-parts/.....' ); -->
				            <?php 
				              $time = get_field('time');
				              $date = get_field('date');
				              $venue = get_field('venue');
				              $city = get_field('city');
				              $more_info = get_field('more_info');

				              // if data isn't there, but some TBC info instead
				              if(!$date){      $date = 'date TBC'; }
				              if(!$time){      $time = 'time TBC'; }
				              if(!$venue){     $venue = 'venue TBC'; }
				              if(!$city){      $city = 'city TBC'; }
				              if(!$more_info){ $more_info = 'More Info Coming Soon...'; }

				            ?>

				         
				                <li class="accordion-item" data-accordion-item>
				                <!-- <hr /> -->
				                  <a href="#" class="accordion-title"><?php //the_title(); ?>
				                    
				                    <div class="event-listing-details">
				                      <?php //get_template_part( 'template-parts/event-related-artist' ); ?>

				                      <span class="event-detail"><?php echo $time; ?></span>
				                      <span class="event-detail"><?php echo $date; ?></span>
				                      <span class="event-detail"><?php echo $venue; ?>,&nbsp;<?php echo $city; ?></span>
				                      <span class="more-info">More info &nbsp;
				                          <svg width="19px" height="19px" viewBox="1365 1803 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
				                              <defs></defs>
				                              <polyline id="Path-3-Copy-2" stroke="#BA0C2F" stroke-width="1" fill="none" transform="translate(1374.485830, 1812.485830) rotate(135.000000) translate(-1374.485830, -1812.485830) " points="1380.48583 1818.48661 1380.48583 1806.48505 1368.48583 1806.48505"></polyline>
				                          </svg>
				                      </span>
				                    </div>
				                    
				                  </a>

				                  <div class="accordion-content" data-tab-content>
				                    <?php echo $more_info; ?>
				                  </div>
				                </li> 

				       <?php } ?>

				           </ul> <!-- Show for large -->

				         </div><!-- Show for large -->
				       </div><!-- Show for large -->

				      <?php //echo '</ul>';
				      /* Restore original Post Data */
				      wp_reset_postdata();
				    } else {
				      // no posts found
				    }
				  ?>

				</div>

			</div>

			<div class="upcoming-tours row" id="upcoming-tours">

				<div class="small-12 columns">
				
				<!-- Get Past Tours -->
				  <?php

				    // Query Args
				      $args = array(

				        'post_type'   => 'tours-projects',
				        'posts_per_page' => -1,
				        'meta_key'      => 'end_date',
				        'orderby'     => 'meta_value',
				        'order'       => 'ASC',

				        'meta_query' => array(
				        	array(
				        		'key' => 'tour_touring_partners', // name of custom field
				        		'value' => '"' . get_the_ID() . '"', // matches exaclty "123", not just 123. This prevents a match for "1234"
				        		'compare' => 'LIKE'
				        	),
		                    array(
		                        'key' => 'end_date',
		                        'value' => date('Ymd', strtotime('now')),
		                        'type' => 'numeric',
		                        'compare' => '>=',
		                    ),				        	
				        )

				      );


				      // The Query
				      $the_query = new WP_Query( $args );

				    // The Loop
				    if ( $the_query->have_posts() ) { ?>
				    	
				    	<div class="row press-row show-for-large"><!-- Show for large -->
				    	<h4 class="section-header small-12 columns">Upcoming Tours</h4>
				    	  <div class="small-12 columns"><!-- Show for large -->
				    	    <ul class="accordion" data-accordion data-allow-all-closed="true"><!-- Show for large -->
				      
				      <?php //echo '<ul>';
				      while ( $the_query->have_posts() ) {
				        $the_query->the_post(); ?>
				         
				                <li class="accordion-item">
				                  <a href="<?php the_permalink(); ?>" class="accordion-title"><?php the_title(); ?></a>
				                </li> 

				       <?php } ?>

				           </ul> <!-- Show for large -->

				         </div><!-- Show for large -->
				       </div><!-- Show for large -->

				      <?php //echo '</ul>';
				      /* Restore original Post Data */
				      wp_reset_postdata();
				    } else {
				      // no posts found
				    }
				  ?>

				</div>

			</div>	

			<div class="past-tours row" id="past-tours">

				<div class="small-12 columns">
				
				<!-- Get Past Tours -->
				  <?php

				    // Query Args
				      $args = array(

				        'post_type'   => 'tours-projects',
				        'posts_per_page' => -1,
				        'meta_key'      => 'end_date',
				        'orderby'     => 'meta_value',
				        'order'       => 'DESC',

				        'meta_query' => array(
				        	array(
				        		'key' => 'tour_touring_partners', // name of custom field
				        		'value' => '"' . get_the_ID() . '"', // matches exaclty "123", not just 123. This prevents a match for "1234"
				        		'compare' => 'LIKE'
				        	),
		                    array(
		                        'key' => 'end_date',
		                        'value' => date('Ymd', strtotime('now')),
		                        'type' => 'numeric',
		                        'compare' => '<',
		                    ),				        	
				        )

				      );


				      // The Query
				      $the_query = new WP_Query( $args );

				    // The Loop
				    if ( $the_query->have_posts() ) { ?>
				    	
				    	<div class="row press-row show-for-large"><!-- Show for large -->
				    	<h4 class="section-header small-12 columns">Past Tours</h4>
				    	  <div class="small-12 columns"><!-- Show for large -->
				    	    <ul class="accordion" data-accordion data-allow-all-closed="true"><!-- Show for large -->
				      
				      <?php //echo '<ul>';
				      while ( $the_query->have_posts() ) {
				        $the_query->the_post(); ?>
				         
				                <li class="accordion-item">
				                  <a href="<?php the_permalink(); ?>" class="accordion-title"><?php the_title(); ?></a>
				                </li> 

				       <?php } ?>

				           </ul> <!-- Show for large -->

				         </div><!-- Show for large -->
				       </div><!-- Show for large -->

				      <?php //echo '</ul>';
				      /* Restore original Post Data */
				      wp_reset_postdata();
				    } else {
				      // no posts found
				    }
				  ?>

				</div>

			</div>		

			<!-- =========================== -->
			<!-- PROJECTS / GREEN ROOM ===== -->
			<!-- =========================== -->
			<div class="news-projects" id="news-projects">
				<div class="row">
					<!-- Get news items -->
					  <?php 

					    // Query Args
					      $args = array(

					        'post_type'   => 'post',
					        //'category_slug' => array( 'news', 'interviews', 'features' ),
					        'category_name'    => 'news, interviews, features, innovation, tour, uncategorized',
					        'posts_per_page' => 4,
					        
					        'meta_query' => array(
					          array(
					            'key' => 'related_client', // name of custom field
					            'value' => '"' . get_the_ID() . '"', // matches exaclty "123", not just 123. This prevents a match for "1234"
					            'compare' => 'LIKE',
					            'category_slug' => array( 'news', 'interviews', 'features' ),
					          )
					        )
					      );

					      // The Query
					      $the_query = new WP_Query( $args );

					    // The Loop
					    if ( $the_query->have_posts() ) { ?>

					    	<div class="small-12 columns">
					    		<h4 class="section-header">From The Green Room</h4>
					    	</div>

					     <?php while ( $the_query->have_posts() ) {
					        $the_query->the_post();

					        get_template_part( 'template-parts/content-post' );

					      }

					      /* Restore original Post Data */
					      wp_reset_postdata();
					    } else {
					      // no posts found
					    } ?>
					
				</div>
				<!-- Do as above section, getting posts related to artist. May have to add relational field in ACF first -->
			</div>


			<!-- =========================== -->
			<!-- ONLINE      =============== -->
			<!-- =========================== -->
			<div class="row live-events">

				<?php
				  // Query Args
				  $args = array(

				    'post_type'		=> 'online',
				    //'post__in'  	=> $tour_artists,
				    'posts_per_page' => 4,
				    'meta_query' => array(
				    	array(
				    		'key' => 'related_touring_partners', // name of custom field
				    		'value' => '"' . get_the_ID() . '"', // matches exaclty "123", not just 123. This prevents a match for "1234"
				    		'compare' => 'LIKE'
				    	)
				    )
				    
				  );

				  // The Query
				  $the_query = new WP_Query( $args );

				  // The Loop
				  if ( $the_query->have_posts() ) {
				   // echo '<ul>'; ?>
				  	<div class="small-12 columns">
				  		<h4 class="section-header">Online Performances</h4>
				  	</div>
				  	<?php
				    
				    while ( $the_query->have_posts() ) {
				      $the_query->the_post();
				      //echo '<li>' . get_the_title() . '</li>';
				      get_template_part( 'template-parts/content-post' );

				      //get_template_part( 'template-parts/.....' );
				    }
				    //echo '</ul>';
				    /* Restore original Post Data */
				    wp_reset_postdata();
				  } else {
				    // no posts found
				  }
				?>

			</div>


			<!-- using ACF Flexible content instead of the_content  -->
			<?php $acf_fields = get_fields(); ?>
			<?php include(locate_template('template-parts/acf.php')); ?>

		</div>
		
		<footer>
			<?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
			<p><?php the_tags(); ?></p>
		</footer>
		<?php // the_post_navigation(); ?>
		<?php // do_action( 'foundationpress_post_before_comments' ); ?>
		<?php // comments_template(); ?>
		<?php // do_action( 'foundationpress_post_after_comments' ); ?>
	</article>
<?php endwhile;?>

<?php do_action( 'foundationpress_after_content' ); ?>
<?php //get_sidebar(); ?>

</div>


<?php get_template_part( 'template-parts/link-banner' ); ?>

<?php get_footer();
