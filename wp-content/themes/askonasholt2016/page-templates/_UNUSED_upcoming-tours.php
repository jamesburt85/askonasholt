<?php
/*
	Template Name: Upcoming Tours
*/
get_header(); ?>

<?php

	// this page is an archive of the current tour the client wants to promote, set in the options tab

	$upcomingSeason = get_field('current_season', 'option');

	get_template_part( 'template-parts/tours-projects-filtering' );

	$args = array(
		'post_type' => 'tours-projects',
		// 'cat'		=> $upcomingSeason,
		// 'tax_query' => array(
		// 	array(
		// 		'taxonomy' => 'movie_genre',
		// 		'field'    => 'slug',
		// 		'terms'    => array( 'action', 'comedy' ),
		// 	),
		// ),
	);
	$post = new WP_Query( $args );

?>

<h1>resiengssdf</h1>

<div id="archive" role="main">

	<article class="main-content">
	<?php if ( $post->have_posts() ) : ?>

		<?php /* Start the Loop */ ?>
		<?php while ( have_posts() ) : the_post(); ?>
			<?php //  sthe_title(); ?>
			<?php get_template_part( 'template-parts/content', get_post_type() ); ?>
		<?php endwhile; ?>
		
		<?php wp_reset_postdata(); ?>
		<?php else : ?>
			<?php get_template_part( 'template-parts/content', 'none' ); ?>

		<?php endif; // End have_posts() check. ?>

		<?php # Paging
		wiaw_archive_nav(); ?>

		<?php /* Display navigation to next/previous pages when applicable */ ?>
		<?php
		// if ( function_exists( 'foundationpress_pagination' ) ) :
			// foundationpress_pagination();
		// elseif ( is_paged() ) :
		?>
			<!-- <nav id="post-nav" class="row">
				<div class="post-previous"><?php next_posts_link( __( '&larr; Older posts', 'foundationpress' ) ); ?></div>
				<div class="post-next"><?php previous_posts_link( __( 'Newer posts &rarr;', 'foundationpress' ) ); ?></div>
			</nav> -->
		<?php //endif; ?>

		<?php //get_sidebar(); ?>



	</article>

</div>

<?php get_footer();
