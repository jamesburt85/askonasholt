
<!-- Checking if post is featured -->
<?php if( get_field('featured_post') ): ?>
	
	<div class="entry-content small-12 medium-6 large-6 columns animated waypoint is-hidden-onload large-item">
	
<?php else: ?>

	<div class="entry-content small-12 medium-6 large-3 columns animated waypoint is-hidden-onload">

<?php endif; // end of if field_name logic ?>


	<div class="magazine-item" data-equalizer-watch>
		<?php if ( has_post_thumbnail() ) { ?>

			<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'full' );?>
			<a href="<?php the_permalink(); ?>">
			<div class="magazine-item-thumb online-item" style="background-image: url('<?php echo $thumb['0'];?>')">
				<div class="bottom-left">
					<div class="media-type-indicator">

						<?php if( get_field('media_choice') == 'Video' ): ?>
						<?php elseif ( has_category( 'Video' )) : ?>

							<i class="fa fa-play fa-2x" aria-hidden="true"></i>

						<?php elseif ( get_field('media_choice') == 'Audio' ):  ?>
						<?php elseif ( has_category( 'Audio' )) : ?>

							<i class="fa fa-volume-up fa-2x" aria-hidden="true"></i>

						<?php elseif ( has_category( 'News' )) : ?>

							<i class="fa fa-newspaper-o fa-2x" aria-hidden="true"></i>

						<?php elseif ( has_category( 'Interviews' )) : ?>
							<i class="fa fa-comment-o fa-2x" aria-hidden="true"></i>

						<?php elseif ( has_category( 'Tour' )) : ?>
							<i class="fa fa-globe fa-2x" aria-hidden="true"></i>

						<?php elseif ( has_category( 'Features' )) : ?>
							<i class="fa fa-plus-square-o fa-2x" aria-hidden="true"></i>
						
						<?php endif; ?>

					</div>
				</div>
			</div>


		<?php } 

		else { ?>
			<a href="<?php the_permalink(); ?>">
			<div class="magazine-item-thumb online-item" style="background-image: url('<?php bloginfo('template_directory'); ?>/assets/images/default.jpg');">
				<div class="bottom-left">
					<div class="media-type-indicator">

						<?php if( get_field('media_choice') == 'Video' ): ?>
						<?php elseif ( has_category( 'Video' )) : ?>

							<i class="fa fa-play fa-2x" aria-hidden="true"></i>

						<?php elseif ( get_field('media_choice') == 'Audio' ): ?>
						<?php elseif ( has_category( 'Audio' )) : ?>

							<i class="fa fa-volume-up fa-2x" aria-hidden="true"></i>

						<?php elseif ( has_category( 'News' )) : ?>

							<i class="fa fa-newspaper-o fa-2x" aria-hidden="true"></i>

						<?php elseif ( has_category( 'Interviews' )) : ?>
							<i class="fa fa-comment-o fa-2x" aria-hidden="true"></i>

						<?php elseif ( has_category( 'Tour' )) : ?>
							<i class="fa fa-globe fa-2x" aria-hidden="true"></i>

						<?php elseif ( has_category( 'Features' )) : ?>
							<i class="fa fa-plus-square-o fa-2x" aria-hidden="true"></i>

						
						<?php endif; ?>
					</div>
				</div>
			</div>

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

						<?php echo $css_slug; ?>&nbsp;		
					</span>
					<span class="magazine-date">
						<?php the_date('d M Y'); ?>
					</span>
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