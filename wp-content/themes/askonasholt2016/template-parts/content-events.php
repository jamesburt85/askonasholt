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

<div id="post-<?php the_ID(); ?>" <?php post_class('blogpost-entry small-12 columns'); ?>>
	<header>
		<h2><a href="<?php //the_permalink(); ?>"><?php //the_title(); ?></a></h2>
		<?php //foundationpress_entry_meta(); ?>

		<div class="row">
			<h3>Online Performances</h3>
			<p>In partnership with ......</p>
		</div>
		<div class="row live-events">
			<h4>Latest 3 Live Events here...</h4>
			<div class="small-12 medium-4 columns">
				Event 1				
			</div>
			<div class="small-12 medium-4 columns">
				Event 2				
			</div>
			<div class="small-12 medium-4 columns">
				Event 3				
			</div>

			<a href="#">View All</a> -links to archive page
		</div>
		

		<?php 
			$date_time = get_field('date_time');
			$venue = get_field('venue');
			$city = get_field('city');
			$more_info = get_field('more_info');
		?>

		<div class="small-12 medium-4 columns">
			<?php //echo $date_time; ?>&nbsp;
			Date of this group of Events
		</div>

		<div class="small-12 medium-8 columns">
			<ul class="accordion" data-accordion data-allow-all-closed="true">
			  <li class="accordion-item" data-accordion-item>
			  <hr />
			    <a href="#" class="accordion-title"><?php //the_title(); ?>
			    			
			    			<?php 

			    				$related_artists = get_field('related_artists');
			    				//print_r($related_artists);

			    				if (!empty($related_artists)) {
			    					foreach ($related_artists as $artist_id) { ?> 

			    						<div class="side-bar-artist"> <?php
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
			    								<span class="side-bar-artist-name"><?php echo get_the_title( $artist_id) ?></span>&nbsp;<br/>
			    							
			    								<?php # If this artist has an artist-type
			    								# - Will only EVER return the first result in the artist type array
			    								//if ( !empty( $artist_types)): ?>
			    									<span><?php //echo $artist_types[0]->name ?></span>
			    								<?php //endif ?>
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

			    	<?php echo $venue; ?>,&nbsp;
			    	<?php echo $city; ?></a>

			    <div class="accordion-content" data-tab-content>
			      <?php echo $more_info; ?>
			    </div>
			  </li>
			</ul>
		</div>

	</header>
	<div class="entry-content">
		<?php //the_content( __( 'Continue reading...', 'foundationpress' ) ); ?>
	</div>
	
	<footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer>
	<hr />
</div>
