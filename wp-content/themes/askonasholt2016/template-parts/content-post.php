
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
				
<!-- 					<span class="eye">
						<svg width="18px" height="12px" viewBox="-1 -1 18 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
						    <defs></defs>
						    <g id="Group-20" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
						        <path d="M8,10.3299999 C12.418278,10.3299999 16,5.16499996 16,5.16499996 C16,5.16499996 12.418278,0 8,0 C3.581722,0 0,5.16499996 0,5.16499996 C0,5.16499996 3.581722,10.3299999 8,10.3299999 Z" id="Oval-3" stroke="#BA0C2F"></path>
						        <circle id="Oval-4" fill="#BA0C2F" cx="8" cy="5" r="3"></circle>
						    </g>
						</svg>
					</span> -->

				</div>
			</a>
		</div>
	</div>
</div>