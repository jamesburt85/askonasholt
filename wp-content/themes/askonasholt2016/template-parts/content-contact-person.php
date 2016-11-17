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
	<header>
	<!-- 	<h2><a href="<?php //the_permalink(); ?>"><?php //the_title(); ?></a></h2> -->

<!-- 		<?php

		if ( have_rows('staff_member') ); { ?>

			<div class="tour-contact-area">

				<?php while ( have_rows('staff_member') ) { the_row();

					$image = get_sub_field('staff_photo');
					$position = get_sub_field('position');

					?>

				<div class="large-4 columns">
					<img class="tour-contact-image" src="<?php echo $image['url']; ?>">
				</div>
				
				<div class="large-8 columns">
					<span><?php the_title(); ?></span>
					<span><?php echo $position; ?></span>
				</div>

				<?php } ?>

			</div>

		<?php } ?> -->


	</header>
	<div class="entry-content">
		<?php the_content( __( 'Continue reading...', 'foundationpress' ) ); ?>
	</div>
	<footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer>
	<hr />
</div>
