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

		# Allow tour-year GET var to be set in URL
		if ( isset( $_GET['tour-year']) && !empty( $_GET['tour-year'])) {
			$pastSeason = get_term_by( 'slug', sanitize_text_field($_GET['tour-year']), 'tour-season');
			$pastSeasonID 		= $pastSeason->term_id;
		}

		//echo $pastSeasonID;

		$args = array(
			'post_type' => 'tours-projects',
			'tax_query' => array(
			    array(
			        'taxonomy' => 'tour-season',
			        'terms' => $pastSeasonID,
			        'field' => 'term_id',
			    )
			),
            'meta_key' => 'end_date',
            'meta_query' => array(
                array(
                    'key' => 'end_date',
                    'value' => date('Ymd', strtotime('now')),
                    'type' => 'numeric',
                    'compare' => '<',
                ),
            ),
            'orderby' => 'meta_value',
            'order' => 'DESC',
		);

		$wp_query = new WP_Query( $args );

	?>


<!-- <h1>PAST TOURS go here</h1> -->


<div id="archive" role="main">

	<article class="main-content">

		<?php if ( $wp_query->have_posts() ) : ?>

			<!-- pagination here -->

			<!-- the loop -->
			<?php $i = 0; echo '<div class="animated waypoint is-hidden-onload" id="waypoint">'; while ( $wp_query->have_posts() ) : $wp_query->the_post(); ?>
				<?php $i++; get_template_part( 'template-parts/content-tours-projects' ); ?>
			<?php endwhile; echo '</div>'; ?>
			<!-- end of the loop -->

			<!-- pagination here -->

			<?php # Paging
			wiaw_archive_nav(); ?>

			<?php wp_reset_postdata(); ?>

		<?php else : ?>
			<p><?php _e( 'Sorry, no posts matched your criteria.' ); ?></p>
		<?php endif; ?>

	</article>

</div>

<?php get_template_part( 'template-parts/link-banner' ); ?>

<?php get_footer();
