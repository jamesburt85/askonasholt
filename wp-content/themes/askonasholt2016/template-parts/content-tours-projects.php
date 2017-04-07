<?php
/**
 * The default template for displaying content
 *
 * Used for both single and index/archive/search.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>

<div id="post-<?php the_ID(); ?>" <?php post_class('blogpost-entry'); ?>>

	<div class="entry-content">
		<?php //the_content( __( 'Continue reading...', 'foundationpress' ) ); ?>

		<?php 

			// get VARS
			$start_date = get_field('start_date');
			$end_date = get_field('end_date');
			$blurb = get_field('blurb');
			$image = get_field('background_image');
			$tour_events = null;
			$tour_events = get_field('tour_events');

			// if($tour_events){
			// 	$tour_events = $tour_events;
			// } else {
			// 	$tour_events = null;
			// }

		?>

		<div class="row tour-wrapper animated waypoint" id="waypoint">
			
			<?php
				$thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'fp-medium' );
				$thumb = $thumb['0'];
				if (!$thumb){ // giving default image if no image is set.
					$thumb = get_template_directory_uri() . '/assets/images/default.jpg';
				}

			?>
			<div class="small-12 large-4 columns tour-thumbnail" style="background-image: url('<?php echo $thumb;?>')">
				<a href="<?php the_permalink(); ?>"></a>
			</div>

			<div class="small-12 large-8 columns tour-details">
				
				<span><?php echo $start_date; ?></span>
				<?php 
					if ($end_date) { ?>
						
						<span> - <?php echo $end_date; ?></span>
					
					<?php } ?>
				
				<h3><a class="section-header" href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
				<span><?php the_excerpt(); ?></span>
				<?php 
				//print_r($tour_events);

				?>

				<?php 

					$the_post_link = get_the_permalink($post->ID);

					// AD note to self - do this in an object loop rather than WP_Query. Less wasteful / quicker...

				  	if( !empty($tour_events) ){


						// Query Args
						$args = array(

						    'post_type'		 => 'events',
						    'posts_per_page' => 3,
						    'post__in'  	 => $tour_events,
						    'order'			 => 'ASC',
						    
						);

						  // echo "<h3>";
						  // print_r($tour_events);
						  // echo "</h3>";

						  // The Query
						  $the_query = new WP_Query( $args );

						  // The Loop
						  if ( $the_query->have_posts() ) {
						    // echo '<ul>';
						    while ( $the_query->have_posts() ) {
						      $the_query->the_post();

						      // echo '<h1>'.the_ID().'</h1>';

						      // echo '<li>' . get_the_title() . '</li>';
						      get_template_part( 'template-parts/content-tour-event-listing' );

						      // get_template_part( 'template-parts/.....' );
						    }
						    // echo '</ul>';
						    /* Restore original Post Data */
						    wp_reset_postdata();
						  } else {
						    // no posts found
						  }

				}


				?>

				<a class="tours-details-link" href="<?php echo $the_post_link; ?>">View Details &nbsp; 
					<svg class="red-arrow" width="19px" height="19px" viewBox="469 852 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
					    <g id="Group-6" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(470.000000, 853.000000)">
					        <path d="M2.33453917,14.1812268 L13.6654423,2.88473916" id="Path-2" stroke="#BA0C2F" transform="translate(7.999991, 8.532983) rotate(45.000000) translate(-7.999991, -8.532983) "></path>
					        <polyline id="Path-3" stroke="#BA0C2F" transform="translate(10.324505, 8.521204) rotate(45.000000) translate(-10.324505, -8.521204) " points="14.5739552 12.7712037 14.5739552 4.27120371 6.07505388 4.27120371"></polyline>
					    </g>
					</svg>
				</a>

			</div>

		</div>

	</div>
	

	<footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer>
</div>
