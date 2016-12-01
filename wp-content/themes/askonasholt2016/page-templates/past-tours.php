<?php
/*
	Template Name: Past Tours
*/
get_header(); ?>

<?php
	
		get_template_part( 'template-parts/tours-projects-filtering' );

		$currentSeason 		= get_field('current_season', 'option');
		$pastSeason 		= get_field('past_season', 'option');
		$pastSeasonID 		= $pastSeason->term_id;

		echo $pastSeasonID;

		$args = array(
			'post_type' => 'tours-projects',
			'tax_query' => array(
			        array(
			            'taxonomy' => 'tour-season',
			            'terms' => $pastSeasonID,
			            'field' => 'term_id',
			        )
			    ),
		);

		$the_query = new WP_Query( $args );

	?>


<h1>PAST TOURS yeah?</h1>

<div id="archive" role="main">

	<article class="main-content">

		<?php if ( $the_query->have_posts() ) : ?>

			<!-- pagination here -->

			<!-- the loop -->
			<?php while ( $the_query->have_posts() ) : $the_query->the_post(); ?>
				<?php get_template_part( 'template-parts/content-tours-projects' ); ?>
			<?php endwhile; ?>
			<!-- end of the loop -->

			<!-- pagination here -->

			<?php wp_reset_postdata(); ?>

		<?php else : ?>
			<p><?php _e( 'Sorry, no posts matched your criteria.' ); ?></p>
		<?php endif; ?>

	</article>

</div>

<?php get_footer();
