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
<!-- 		<header>
			<h1 class="entry-title"><?php the_title(); ?></h1>
			<?php foundationpress_entry_meta(); ?>
		</header> -->
<?php do_action( 'foundationpress_post_before_entry_content' ); ?>
<div class="entry-content">
	<?php //the_content(); ?>

	<?php 
		// get VARS
		// $artist_photo = get_field('artist_photo');
		$main_category = get_field('main_category');
		$name = //get_field('name');
		$bio = get_field('bio');
		$website = get_field('website');
		$european_management = get_field('european_management');
		$general_management = get_field('general_management');
		$contact_text_area = get_field('contact_text_area');
	?>

	<div class="bio-row row" id="intro">
		<div class="small-12 large-9 columns hide-for-large" id="introduction">
			<h4 class="section-header">Introduction</h4>
			<p><?php echo $bio; ?></p>
		</div>
		<div class="small-12 large-3 columns artist-contacts">
			<h4 class="section-header">Contact</h4>

				<?php 

					$related_staff = get_field('related_staff');
					// print_r($related_staff);

					if (!empty($related_staff)) {
						foreach ($related_staff as $artist_id) { ?> 

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

								# Get post terms as array
								$artist_types = get_the_terms( $artist_id, 'people-type');
								//print_r($artist_types);
								?>
								
								<img class="circle-thumb" src="<?php echo $thumb_url ?>">
								
								<div class="side-bar-artist-details contact">
									<span class="side-bar-artist-name"><?php echo get_the_title( $artist_id) ?>
									
									<a href="#">&nbsp;
								        <svg class="red-arrow" width="19px" height="19px" viewBox="469 852 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
								            <g id="Group-6" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(470.000000, 853.000000)">
								                <path d="M2.33453917,14.1812268 L13.6654423,2.88473916" id="Path-2" stroke="#BA0C2F" transform="translate(7.999991, 8.532983) rotate(45.000000) translate(-7.999991, -8.532983) "></path>
								                <polyline id="Path-3" stroke="#BA0C2F" transform="translate(10.324505, 8.521204) rotate(45.000000) translate(-10.324505, -8.521204) " points="14.5739552 12.7712037 14.5739552 4.27120371 6.07505388 4.27120371"></polyline>
								            </g>
								        </svg>
								      </a>
									</span><br/>
								
									<?php # If this artist has an artist-type
									# - Will only EVER return the first result in the artist type array
									if ( !empty( $artist_types)): ?>
										<span><?php echo $artist_types[0]->name ?></span>
									<?php endif ?>
								</div>

							</div>
						
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

			<a class="website" href="http://www.<?php echo $website; ?>" target="_blank"><?php echo $website; ?></a>
			
		</div>			


		</div>
		<div class="small-12 large-9 columns show-for-large" id="introduction">
			<h4 class="section-header">Introduction</h4>
			<p><?php echo $bio; ?></p>
		</div>
	</div>



	<div class="video-audio-area" id="video-audio">
			
		<div class="row">
			<h4 class="section-header small-12 columns">Video &amp; Audio</h4>

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
						'key' => 'related_artist', // name of custom field
						'value' => '"' . get_the_ID() . '"', // matches exaclty "123", not just 123. This prevents a match for "1234"
						'compare' => 'LIKE'
					)
				)
			));

			?>
	
			<?php if( $videos ): ?>
				<!-- <ul> -->
				<?php
					foreach( $videos as $video ): setup_postdata( $video ); ?>
						<div class="small-12 medium-6 large-3 columns artist-video-area">
							<?php get_template_part( 'template-parts/video-player' ); ?>
						</div>

					
					<div>
	<!-- 					<div class="small-2 columns">
							<h4 class="section-header" id="<?php echo $section['unique_id'] ?>">Video</h4>
						</div> -->
						<!-- <div class="small-12 medium-6 large-3 columns artist-video-area">
							<div class="row large-video-row">
								<iframe width="560" height="315" src="https://www.youtube.com/embed/<?php echo $section['video']; ?>" frameborder="0" allowfullscreen></iframe>
							</div>
							<div class="video-description">
								<?php echo wpdocs_custom_taxonomies_terms_links(); ?>
								<?php the_date('d-m-y'); ?>
								<span class="magazine-item-copy"><?php the_excerpt( __( 'Continue reading...', 'foundationpress' ) ); ?></span>
							</div>
						</div> -->
					</div>

					<?php

					endforeach;

					wp_reset_postdata(); ?>
				<!--  </ul> -->
			<?php endif; ?>

		</div>

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
						'key' => 'related_artist', // name of custom field
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
		        		'key' => 'related_artists', // name of custom field
		        		'value' => '"' . get_the_ID() . '"', // matches exaclty "123", not just 123. This prevents a match for "1234"
		        		'compare' => 'LIKE'
		        	)
		        )

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
		        		'key' => 'related_artists', // name of custom field
		        		'value' => '"' . get_the_ID() . '"', // matches exaclty "123", not just 123. This prevents a match for "1234"
		        		'compare' => 'LIKE'
		        	)
		        )

		      );


		      // The Query
		      $the_query = new WP_Query( $args );

		    // The Loop
		    if ( $the_query->have_posts() ) { ?>

		    	<div class="row press-row hide-for-large"><!-- side for large -->

		    	<h4 class="section-header small-12 columns">Performance Schedule</h4>
		    	  <div class="small-12 columns"><!-- side for large -->
		    	    <ul class="accordion" data-accordion data-allow-all-closed="true"><!-- side for large -->
		      
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
            	        <a href="#" class="accordion-title"><?php //the_title(); ?>

            	            <div class="event-listing-details">
            	              <?php //get_template_part( 'template-parts/event-related-artist' ); ?>

            	              <span class="event-detail"><?php echo $time; ?></span><!-- <br/> -->
            	              <span class="event-detail"><?php echo $date; ?></span><br/>
            	              <span class="event-detail"><?php echo $venue; ?>,&nbsp;<?php echo $city; ?></span>
            	              <span class="more-info">
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

		           </ul> <!-- Show for small -->

		         </div><!-- Show for small -->
		       </div><!-- Show for small -->

		      <?php //echo '</ul>';
		      /* Restore original Post Data */
		      wp_reset_postdata();
		    } else {
		      // no posts found
		    }
		  ?>

		 </div>
	</div>

<!-- 	<div class="row hide-for-large">
	  <div class="small-12 columns">

	    <ul class="accordion" data-accordion data-allow-all-closed="true">
	      <li class="accordion-item" data-accordion-item>
	      <hr />
	        <a href="#" class="accordion-title"><?php //the_title(); ?>

	            <div class="event-listing-details">
	              <?php get_template_part( 'template-parts/event-related-artist' ); ?>

	              <span class="event-detail"><?php echo $time; ?></span><!-- <br/> -->
	             <!--  <span class="event-detail"><?php echo $date; ?></span><br/>
	              <span class="event-detail"><?php echo $venue; ?>,&nbsp;<?php echo $city; ?></span>
	              <span class="more-info">
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
	      </ul>

	    </div>
	  </div> -->




	<div class="news-projects" id="news-projects">
		<div class="row">
			<div class="small-12 columns">
		
				<h4 class="section-header">From The Green Room</h4>
		
			<!-- Get news items -->
			  <?php 

			    // Query Args
			      $args = array(

			        'post_type'   => 'post',
			        'category_slug' => array( 'news', 'interviews', 'features' ),
			        'posts_per_page' => 4,
			        'tax_query' => array(
			            //array(
			              //'taxonomy' => 'magazine-content-type',
			              //'field'    => 'slug',
			              //'terms'    => 'news',
			            //),
			          ),
			      );

			      // The Query
			      $the_query = new WP_Query( $args );

			    // The Loop
			    if ( $the_query->have_posts() ) {

			      while ( $the_query->have_posts() ) {
			        $the_query->the_post();

			        get_template_part( 'template-parts/content-post' );

			      }

			      /* Restore original Post Data */
			      wp_reset_postdata();
			    } else {
			      // no posts found
			    } ?>
			</div>
		</div>
		<!-- Do as above section, getting posts related to artist. May have to add relational field in ACF first -->
	</div>

	

	<!-- using ACF Flexible content instead of the_content  -->
	<?php $acf_fields = get_fields(); ?>
	<?php include(locate_template('template-parts/acf.php')); ?>



	<?php //edit_post_link( __( 'Edit', 'foundationpress' ), '<span class="edit-link">', '</span>' ); ?>
</div>
		<footer>
			<?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
			<p><?php the_tags(); ?></p>
		</footer>
		<?php //the_post_navigation(); ?>
		<?php do_action( 'foundationpress_post_before_comments' ); ?>
		<?php comments_template(); ?>
		<?php do_action( 'foundationpress_post_after_comments' ); ?>
	</article>
<?php endwhile;?>

<?php do_action( 'foundationpress_after_content' ); ?>
<?php //get_sidebar(); ?>
</div>

<?php get_template_part( 'template-parts/artist-link-banner' ); ?>

<?php get_footer();
