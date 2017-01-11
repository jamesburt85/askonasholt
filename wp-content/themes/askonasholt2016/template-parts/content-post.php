
<div class="entry-content small-12 medium-6 large-3 columns">

	<div class=" magazine-item">
		<?php if ( has_post_thumbnail() ) { ?>

			<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'full' );?>
			<a href="<?php the_permalink(); ?>">
			<div class="magazine-item-thumb" style="background-image: url('<?php echo $thumb['0'];?>')"></div>


		<?php } 

		else { ?>
			<a href="<?php the_permalink(); ?>">
			<div class="magazine-item-thumb" style="background-image: url('<?php bloginfo('template_directory'); ?>/assets/images/default.jpg');"></div>

		<?php } ?>


		<div class="magazine-item-container">
			
				<span class="magazine-category"><?php //echo $main_category; ?>
					<!-- *** Details in functions.php for getting taxonomy/terms *** -->
					<span class="category">
				<?php
					$category = get_the_category(); 
						$category_parent_id = $category[0]->category_parent;
						if ( $category_parent_id != 0 ) {
						    $category_parent = get_term( $category_parent_id, 'category' );
						    $css_slug = $category_parent->slug;
						} else {
						    $css_slug = $category[0]->slug;
						}
						//echo $category_parent;

						?>

					<?php echo $css_slug; ?></span>&nbsp;-
					<?php the_date('d M Y'); ?>
				</span>

				<?php //foundationpress_entry_meta(); ?>
				
				<p class="magazine-item-header">
					<?php the_title(); ?>
				</p>
				<span class="magazine-item-copy"><?php //the_excerpt( __( 'Continue reading...', 'foundationpress' ) ); ?></span>
				
				<div class="read-more">Read &nbsp;
				</div>
			</a>
		</div>
	</div>
</div>