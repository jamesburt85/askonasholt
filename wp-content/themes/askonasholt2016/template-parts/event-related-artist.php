<?php 

	$related_artists = get_field('related_artists');
	// print_r($related_artists);


	if (!empty($related_artists)) {
		foreach ($related_artists as $artist_id) {

			# Get Permalink to artist page:
			$artist_url = get_permalink($artist_id);

			?> 

			<div class="side-bar-artist"> <?php

				# Get Permalink to artist page:
				//$artist_url = get_permalink($artist_id);

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
				
				<!-- <a href="<?php echo $artist_url; ?>"> -->
					<img class="circle-thumb" src="<?php echo $thumb_url ?>">
			<!-- 	</a> -->
					
					<div class="side-bar-artist-details simple-listing">
						<a class="side-bar-link" href="<?php echo $artist_url; ?>">
							<span class="side-bar-artist-name"><?php echo get_the_title( $artist_id) ?></span>&nbsp;<br/>


							<!-- For use on above to make link within link on artist name??? -->
							<!-- <span onclick="document.location.href = 'foo'; return false">inner link</span> -->


						<?php # If this artist has an artist-type
						# - Will only EVER return the first result in the artist type array
						//if ( !empty( $artist_types)): ?>
							<span><?php //echo $artist_types[0]->name ?></span>
						<?php //endif ?>
						</a>
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

