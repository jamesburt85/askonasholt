<?php
/**
 * The template for displaying all single posts and attachments
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>

<?php //get_template_part( 'template-parts/featured-image' ); ?>


<?php get_template_part( 'template-parts/single-tour-project-hero' ); ?>
	
	<div id="sticky-anchor"></div>
	<ul class="single-page-nav show-for-medium" id="sticky">
		
		<li class="nav-title">
			<?php the_title(); ?>
		</li>

		<li>
			<a data-scroll="" data-events="scroll" href="#introduction">Introduction</a>
		</li>

		<li>
			<a data-scroll="" data-events="scroll" href="#route">Route</a>
		</li>

		<li>
			<a data-scroll="" data-events="scroll" href="#schedule">Schedule</a>
		</li>

		<!-- getting ACF Flexible content navigation  -->
		<?php $acf_fields = get_fields(); ?>
		<?php include(locate_template('template-parts/acf-navigation.php')); ?>

	</ul>

<div id="single-post" role="main">

<?php do_action( 'foundationpress_before_content' ); ?>
<?php while ( have_posts() ) : the_post(); ?>
	<article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">


		<?php do_action( 'foundationpress_post_before_entry_content' ); ?>

				<div class="entry-content hide-for-medium"  id="introduction">
					<?php //the_content(); ?>
					<?php //edit_post_link( __( 'Edit', 'foundationpress' ), '<span class="edit-link">', '</span>' ); ?>

					<?php 
					
						$blurb = get_field('blurb');
						$extra_blurb_copy = get_field('extra_blurb_copy');
						$further_info = get_field( 'further_info' );
					
					?>

					<div class="small-12 medium-9 columns project-intro">
						<h4 class="section-header">Introduction</h4>

						<?php echo $blurb; ?>

						<div class="blurb-area" id="menuBar" data-toggler=".expanded">
							<div class="hidden"><?php echo $extra_blurb_copy; ?></div>
							<p class="more"><a data-toggle="menuBar"><span class="more">More</span><span class="less">Less</span></a></p>
						</div>
					</div>

					<div class="row">
						<div class="small-12 medium-3 columns tour-intro-sidebar">
							<h4 class="section-header">Contact</h4>

								<?php 

									$tour_staff = get_field('tour_staff');
									//print_r($tour_staff);

									if (!empty($tour_staff)) {
										foreach ($tour_staff as $staff_id) { ?> 

											<div class="side-bar-artist"> <?php
												# Get featured image id
												$thumb_id = get_post_thumbnail_id($staff_id);
												# If theere is not a featured image
												if ( empty( $thumb_id)) {
													$thumb_url = 'http://placehold.it/150x150';
												# Yeay, we haven image ID
												} else {
													# Get the image from the image ID
													$thumb_url_array = wp_get_attachment_image_src($thumb_id, 'thumbnail', true);
													$thumb_url = $thumb_url_array[0];
												}
												//echo $thumb_url;

												# Get post terms as array
												$artist_types = get_the_terms( $staff_id, 'people-type');

												?>
												
													<img class="circle-thumb" src="<?php echo $thumb_url ?>">
												<div class="side-bar-artist-details">
													<span class="side-bar-artist-name"><?php echo get_the_title( $staff_id) ?></span><br/>
												
													<?php # If this artist has an artist-type
													# - Will only EVER return the first result in the artist type array
													if ( !empty( $artist_types)): ?>
														<span><?php echo $artist_types[0]->name ?></span>
													<?php endif ?>
												</div>
											</div>
						<!-- 					<?php # If the artist has an artist type
											if ( !empty( $artist_types)): ?>
												<ul>
												<?php # Loop through all the artist types for this artist,
												# - and output them all!
												foreach ($artist_types as $type): ?>
													<li><?php echo $type->name ?></li>
												<?php endforeach ?>
												</ul>
											<?php endif ?> -->
										
											<?php
										}
									} ?>

							<br/>

								<?php 

									$tour_artists = get_field('tour_artists');
									//print_r($tour_artists);

									if (!empty($tour_artists)) {
										foreach ($tour_artists as $artist_id) { ?> 
										
										<h4 class="section-header">Artist(s)</h4>
											<div class="side-bar-artist"> 
												

											<?php
												# Get featured image id
												$thumb_id = get_post_thumbnail_id($artist_id);
												# If theere is not a featured image
												if ( empty( $thumb_id)) {
													$thumb_url = 'http://placehold.it/150x150';
												# Yeay, we haven image ID
												} else {
													# Get the image from the image ID
													$thumb_url_array = wp_get_attachment_image_src($thumb_id, 'thumbnail', true);
													$thumb_url = $thumb_url_array[0];
												}
												//echo $thumb_url;

												# Get post terms as array
												$artist_types = get_the_terms( $artist_id, 'artist-type');

												?>
												
													<img class="circle-thumb" src="<?php echo $thumb_url ?>">
												<div class="side-bar-artist-details">
													<span class="side-bar-artist-name"><?php echo get_the_title( $artist_id) ?></span><br/>
												
													<?php # If this artist has an artist-type
													# - Will only EVER return the first result in the artist type array
													if ( !empty( $artist_types)): ?>
														<span><?php echo $artist_types[0]->name ?></span>
													<?php endif ?>
												</div>
											</div>
						<!-- 					<?php # If the artist has an artist type
											if ( !empty( $artist_types)): ?>
												<ul>
												<?php # Loop through all the artist types for this artist,
												# - and output them all!
												foreach ($artist_types as $type): ?>
													<li><?php echo $type->name ?></li>
												<?php endforeach ?>
												</ul>
											<?php endif ?> -->
										
											<?php
										}
									} ?>

							<h4 class="section-header">Further Info</h4>
							<?php echo $further_info; ?>
						</div>
						
					</div>


					<?php

						// get the tour events
						$tour_events = get_field('tour_events');
						// print_r($tour_events);

					  	$args = array(
						  	'post_status' 		=> 'publish',
						  	'post_type'			=> 'events',
						  	'post__in'  		=> $tour_events, // limited to array of events in tour page
						  	'posts_per_page'	=> -1,
						  	'meta_key'			=> 'date_time',
						  	'orderby'			=> 'meta_value',
						  	'order'				=> 'ASC',
					  	);

					  // The Query
					  $the_query = new WP_Query( $args );

					  // The Loop
					  if ( $the_query->have_posts() ) {
					    // echo '<ul>'; ?>
						
						
					  	<div id="route" class="route-map show-flightpath acf-map row">
						
						<?php while ( $the_query->have_posts() ) {
					      		$the_query->the_post();
					      		get_template_part( 'template-parts/content-tour-event-location' );
					    } ?>
						
						</div>

		    			<div class="row schedule" id="schedule">	

							<div class="small-12 medium-3 columns">
								<h4 class="section-header">Schedule</h4>
							</div>
							
							<div class="small-12 medium-9 columns">
					    				
						    <?php while ( $the_query->have_posts() ) {
				          		$the_query->the_post();
								get_template_part( 'template-parts/content-tour-event-listing' );
					        } ?>

			        		</div>

			        	</div>

				        <?php
					    /* Restore original Post Data */
					    wp_reset_postdata();

					  } else {
					    // no posts found
					  }

					?>

					<!-- using ACF Flexible content instead of the_content  -->
					<?php $acf_fields = get_fields(); ?>
					<?php include(locate_template('template-parts/acf.php')); ?>

				</div>


		<div class="entry-content show-for-medium"  id="introduction">
			<?php //the_content(); ?>
			<?php //edit_post_link( __( 'Edit', 'foundationpress' ), '<span class="edit-link">', '</span>' ); ?>

			<?php 
			
				$blurb = get_field('blurb');
				$extra_blurb_copy = get_field('extra_blurb_copy');
				$further_info = get_field( 'further_info' );
			
			?>

			<div class="row">
				<div class="small-12 medium-3 columns tour-intro-sidebar">
					<h4 class="section-header">Contact</h4>

						<?php 

							$tour_staff = get_field('tour_staff');
							//print_r($tour_staff);

							if (!empty($tour_staff)) {
								foreach ($tour_staff as $staff_id) { ?> 

									<div class="side-bar-artist"> <?php
										# Get featured image id
										$thumb_id = get_post_thumbnail_id($staff_id);
										# If theere is not a featured image
										if ( empty( $thumb_id)) {
											$thumb_url = 'http://placehold.it/150x150';
										# Yeay, we haven image ID
										} else {
											# Get the image from the image ID
											$thumb_url_array = wp_get_attachment_image_src($thumb_id, 'thumbnail', true);
											$thumb_url = $thumb_url_array[0];
										}
										//echo $thumb_url;

										# Get post terms as array
										$artist_types = get_the_terms( $staff_id, 'people-type');

										?>
										
											<img class="circle-thumb" src="<?php echo $thumb_url ?>">
										<div class="side-bar-artist-details">
											<span class="side-bar-artist-name"><?php echo get_the_title( $staff_id) ?></span><br/>
										
											<?php # If this artist has an artist-type
											# - Will only EVER return the first result in the artist type array
											if ( !empty( $artist_types)): ?>
												<span><?php echo $artist_types[0]->name ?></span>
											<?php endif ?>
										</div>
									</div>
				<!-- 					<?php # If the artist has an artist type
									if ( !empty( $artist_types)): ?>
										<ul>
										<?php # Loop through all the artist types for this artist,
										# - and output them all!
										foreach ($artist_types as $type): ?>
											<li><?php echo $type->name ?></li>
										<?php endforeach ?>
										</ul>
									<?php endif ?> -->
								
									<?php
								}
							} ?>

					<br/>

						<?php 

							$tour_artists = get_field('tour_artists');
							//print_r($tour_artists);

							if (!empty($tour_artists)) {
								foreach ($tour_artists as $artist_id) { ?> 
								
								<h4 class="section-header">Artist(s)</h4>
									<div class="side-bar-artist"> 
										

									<?php
										# Get featured image id
										$thumb_id = get_post_thumbnail_id($artist_id);
										# If theere is not a featured image
										if ( empty( $thumb_id)) {
											$thumb_url = 'http://placehold.it/150x150';
										# Yeay, we haven image ID
										} else {
											# Get the image from the image ID
											$thumb_url_array = wp_get_attachment_image_src($thumb_id, 'thumbnail', true);
											$thumb_url = $thumb_url_array[0];
										}
										//echo $thumb_url;

										# Get post terms as array
										$artist_types = get_the_terms( $artist_id, 'artist-type');

										?>
										
											<img class="circle-thumb" src="<?php echo $thumb_url ?>">
										<div class="side-bar-artist-details">
											<span class="side-bar-artist-name"><?php echo get_the_title( $artist_id) ?></span><br/>
										
											<?php # If this artist has an artist-type
											# - Will only EVER return the first result in the artist type array
											if ( !empty( $artist_types)): ?>
												<span><?php echo $artist_types[0]->name ?></span>
											<?php endif ?>
										</div>
									</div>
				<!-- 					<?php # If the artist has an artist type
									if ( !empty( $artist_types)): ?>
										<ul>
										<?php # Loop through all the artist types for this artist,
										# - and output them all!
										foreach ($artist_types as $type): ?>
											<li><?php echo $type->name ?></li>
										<?php endforeach ?>
										</ul>
									<?php endif ?> -->
								
									<?php
								}
							} ?>

					<h4 class="section-header">Further Info</h4>
					<?php echo $further_info; ?>
				</div>

				<div class="small-12 medium-9 columns project-intro">
					<h4 class="section-header">Introduction</h4>

					<?php echo $blurb; ?>

					<div class="blurb-area" id="menuBar" data-toggler=".expanded">
						<div class="hidden"><?php echo $extra_blurb_copy; ?></div>
						<p class="more"><a data-toggle="menuBar"><span class="more">More</span><span class="less">Less</span></a></p>
					</div>
				</div>
				
			</div>


			<?php

				// get the tour events
				$tour_events = get_field('tour_events');
				// print_r($tour_events);

			  	$args = array(
				  	'post_status' 		=> 'publish',
				  	'post_type'			=> 'events',
				  	'post__in'  		=> $tour_events, // limited to array of events in tour page
				  	'posts_per_page'	=> -1,
				  	'meta_key'			=> 'date_time',
				  	'orderby'			=> 'meta_value',
				  	'order'				=> 'ASC',
			  	);

			  // The Query
			  $the_query = new WP_Query( $args );

			  // The Loop
			  if ( $the_query->have_posts() ) {
			    // echo '<ul>'; ?>
				
				
			  	<div id="route" class="route-map show-flightpath acf-map row">
				
				<?php while ( $the_query->have_posts() ) {
			      		$the_query->the_post();
			      		get_template_part( 'template-parts/content-tour-event-location' );
			    } ?>
				
				</div>

    			<div class="row schedule" id="schedule">	

					<div class="small-12 medium-3 columns">
						<h4 class="section-header">Schedule</h4>
					</div>
					
					<div class="small-12 medium-9 columns">
			    				
				    <?php while ( $the_query->have_posts() ) {
		          		$the_query->the_post();
						get_template_part( 'template-parts/content-tour-event-listing' );
			        } ?>

	        		</div>

	        	</div>

		        <?php
			    /* Restore original Post Data */
			    wp_reset_postdata();

			  } else {
			    // no posts found
			  }

			?>

			<!-- using ACF Flexible content instead of the_content  -->
			<?php $acf_fields = get_fields(); ?>
			<?php include(locate_template('template-parts/acf.php')); ?>

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

<?php get_template_part('template-parts/link-banner') ?>


<?php get_footer();
