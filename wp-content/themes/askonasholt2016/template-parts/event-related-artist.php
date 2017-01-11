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
				
				<div class="side-bar-artist-details simple-listing">
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

