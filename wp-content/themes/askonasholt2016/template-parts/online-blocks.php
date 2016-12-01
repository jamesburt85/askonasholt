
<div class="entry-content small-12 medium-6 large-4 columns">

	<div class="online-item">
		<a href="<?php the_permalink(); ?>">
			<?php if ( has_post_thumbnail() ) { ?>

				<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'full' );?>
				<div class="online-item-thumb" style="background-image: url('<?php echo $thumb['0'];?>')"></div>


			<?php } 

			else { ?>
				
				<div class="online-item-thumb" style="background-image: url('<?php bloginfo('template_directory'); ?>/assets/images/default.jpg');"></div>

			<?php } ?>


			<div class="online-item-container">
				
					<span class="online-category"><?php //echo $main_category; ?>
						<!-- *** Details in functions.php for getting taxonomy/terms *** -->
						<span class="category"><?php echo wpdocs_custom_taxonomies_terms_links(); ?></span>
						<?php //the_date('d-m-y'); ?>
						ARTIST
					</span>

					<?php //foundationpress_entry_meta(); ?>
					
					<p class="online-item-header">
						<?php the_title(); ?>
					</p>
					<span class="online-item-copy"><?php //the_excerpt( __( 'Continue reading...', 'foundationpress' ) ); ?></span>
					
				
			</div>
		</a>
	</div>
</div>