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

<div id="post-<?php the_ID(); ?>" <?php post_class('blogpost-entry small-12 medium-6 large-3 columns'); ?>>

	<?php //get_template_part( 'template-parts/people-filtering' ); ?>


	<div class="entry-content">

		<div class="magazine-item">
			<?php if ( has_post_thumbnail() ) { ?>

				<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'full' );?>
				<div class="magazine-item-thumb" style="background-image: url('<?php echo $thumb['0'];?>')"></div>


			<?php } 

			else { ?>
				
				<div class="magazine-item-thumb" style="background-image: url('<?php bloginfo('template_directory'); ?>/assets/images/default.jpg');"></div>

			<?php } ?>

			<div class="magazine-item-container">

				<p class="magazine-item-header">
					<?php echo wpdocs_custom_taxonomies_terms_links(); ?>
					<a href="<?php the_permalink(); ?>"><?php the_title(); ?></a><br/>
				</p>
					<?php the_excerpt( __( 'Continue reading...', 'foundationpress' ) ); ?>
			</div>

		</div>

	</div>



	
	<div class="entry-content">
		<?php the_content( __( 'Continue reading...', 'foundationpress' ) ); ?>
	</div>
	<footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer>

</div>
