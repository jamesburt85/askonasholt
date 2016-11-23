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

<div id="post-<?php the_ID(); ?>" <?php post_class('blogpost-entry'); ?>>

	<?php //get_template_part( 'template-parts/center-text-hero' ); ?>

	<?php

	//if ( have_rows('staff_member') ); { ?>

		<div class="row">

			<?php //while ( have_rows('staff_member') ) { the_row();

				//$image = get_sub_field('staff_photo');
				$position = get_field('position');
				$e_mail = get_field('e-mail');
				$telephone_number = get_field('telephone_number');
				$languages = get_field('languages');

			?>

				<div class="entry-content small-12 medium-6 large-3 columns">

					<div class=" magazine-item">
						<?php if ( has_post_thumbnail() ) { ?>

							<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'full' );?>
							<div class="magazine-item-thumb" style="background-image: url('<?php echo $thumb['0'];?>')"></div>


						<?php } 

						else { ?>
							
							<div class="magazine-item-thumb" style="background-image: url('<?php bloginfo('template_directory'); ?>/assets/images/default.jpg');"></div>

						<?php } ?>


						<div class="magazine-item-container">
							
							<p class="magazine-item-header">
								<a href="<?php the_permalink(); ?>"><?php the_title(); ?></a><br/>
								<a href="mailto:<?php echo $e_mail; ?>?Subject=Hello%20again" target="_top"><?php echo $e_mail; ?></a><br/>
								<span><?php echo $telephone_number; ?></span><br/>
								<span><?php echo $languages; ?></span>
							</p>
								<?php the_excerpt( __( 'Continue reading...', 'foundationpress' ) ); ?>
						</div>

					</div>

				</div>
				
			<?php //} ?>

		</div>

	<?php //} ?>

	
	<div class="entry-content">
		<?php the_content( __( 'Continue reading...', 'foundationpress' ) ); ?>
	</div>
	<footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer>

	<hr />
</div>
