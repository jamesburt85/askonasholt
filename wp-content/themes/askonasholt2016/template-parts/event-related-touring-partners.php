<?php 

	$related_touring_partners = get_field('related_touring_partners');
	// print_r($related_touring_partners);


	if (!empty($related_touring_partners)) {
		foreach ($related_touring_partners as $touring_partners_id) {

			# Get Permalink to touring partners page:
			$touring_partners_url = get_permalink($touring_partners_id);

			?> 

			<div class="side-bar-artist"> <?php

				# Get Permalink to touring partners page:
				//$touring_partners_url = get_permalink($touring_partners_id);

				# Get featured image id
				$thumb_id = get_post_thumbnail_id($touring_partners_id);
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
				$touring_partners_types = get_the_terms( $touring_partners_id, 'touring-partners-type');

				?>
				
					<a href="<?php echo $touring_partners_url; ?>">
						<img class="circle-thumb" src="<?php echo $thumb_url ?>">
					</a>
					
					<div class="side-bar-artist-details simple-listing">
						<a class="side-bar-link" href="<?php echo $touring_partners_url; ?>">
							<span class="side-bar-artist-name"><?php echo get_the_title( $touring_partners_id) ?></span>&nbsp;<br/>


							<!-- For use on above to make link within link on touring partners name??? -->
							<!-- <span onclick="document.location.href = 'foo'; return false">inner link</span> -->


						<?php # If this touring partners has an touring-partners-type
						# - Will only EVER return the first result in the touring partners type array
						//if ( !empty( $touring_partners_types)): ?>
							<span><?php //echo $touring_partners_types[0]->name ?></span>
						<?php //endif ?>
						</a>
					</div>
				

			</div>
<!-- 					<?php # If the touring partners has an touring partners type
			if ( !empty( $touring_partners_types)): ?>
				<ul>
				<?php # Loop through all the touring partners types for this touring partners,
				# - and output them all!
				foreach ($touring_partners_types as $type): ?>
					<li><?php echo $type->name ?></li>
				<?php endforeach ?>
				</ul>
			<?php endif ?> -->
		
			<?php
		}
	} ?>

