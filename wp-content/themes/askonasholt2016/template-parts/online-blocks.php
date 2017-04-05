
<div class="entry-content small-12 large-4 columns">

	<div class="online-item">
		<a href="<?php the_permalink(); ?>">
			<?php if ( has_post_thumbnail() ) { ?>

				<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'fp-medium' );?>
				<div class="online-item-thumb" style="background-image: url('<?php echo $thumb['0'];?>')"></div>

			<?php } 

			else { ?>
				
				<div class="online-item-thumb" style="background-image: url('<?php bloginfo('template_directory'); ?>/assets/images/default.jpg');"></div>

			<?php } ?>

			<div class="bottom-left">
				<!-- Use a different symbol for audio and video items -->
				<div class="media-type-indicator">
					<?php if( get_field('media_choice') == 'Video' ): ?>

						<i class="fa fa-play fa-2x" aria-hidden="true"></i>

					<?php elseif ( get_field('media_choice') == 'Audio' ): { ?>

						<i class="fa fa-volume-up fa-2x" aria-hidden="true"></i>

					<?php } ?>
					
					<?php endif; ?>
				</div>

				<div class="online-item-container">
					
					<span class="online-category"><?php //echo $main_category; ?>
						<!-- *** Details in functions.php for getting taxonomy/terms *** -->
						<span class="category"><?php echo wpdocs_custom_taxonomies_terms_links(); ?></span>
						
						<?php 

							$artist = get_field('artist');
							//print_r($artist);

							if (!empty($artist)) {
							//foreach ($artist as $artist_id) { ?>
											
							<!-- Only empty the first artist in array -->
							<?php 

								$artist = get_field('artist');
								//print_r($artist);

								if (!empty($artist)) {
									
									foreach ($artist as $artist_id) { 

										# Get Permalink to artist page:
										$artist_url = get_permalink($artist_id);

										# Get featured image id
										$thumb_id = get_post_thumbnail_id($artist_id);

										# Get post terms as array
										$artist_types = get_the_terms( $artist_id, 'artist-type');

										?>			
										
										<a href="<?php echo $artist_url; ?>">
											<span class="online-artist-name">
												<?php echo get_the_title( $artist_id) ?>
												&nbsp;
											</span>
										</a>
												
									<?php }
								} ?>

							<?php } ?>

					</span>

					<br/>

					<span class="online-item-header">
						<?php the_title(); ?>
					</span>
						
				</div>
			</div>
		</a>
	</div>
</div>