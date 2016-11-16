<?php
/**
 * The template for displaying archive pages
 *
 * Used to display archive-type pages if nothing more specific matches a query.
 * For example, puts together date-based pages if no date.php file exists.
 *
 * If you'd like to further customize these archive views, you may create a
 * new template file for each one. For example, tag.php (Tag archives),
 * category.php (Category archives), author.php (Author archives), etc.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>

<?php

	# Show the correct archive title
	if (is_day()) {
		// printf(__('Daily Archives: %s', 'whoisandywhite'), 
		// 	'<span>' . get_the_date() . '</span>');
	} elseif (is_month()) {
		// printf(
		// 	__('Monthly Archives: %s', 'whoisandywhite'),
		// 	'<span>' . get_the_date(_x('F Y', 'monthly archives date format', 'whoisandywhite')) . '</span>'
	// );
	} elseif (is_year()) {
		// printf(
		// 	__('Yearly Archives: %s', 'whoisandywhite'),
		// 	'<span>' . get_the_date(_x('Y', 'yearly archives date format', 'whoisandywhite')) . '</span>'
	// );
	} elseif (is_tag()) {
		// printf(__('Tag Archives: %s', 'whoisandywhite'), '<span>' . single_tag_title('', false) . '</span>');
		// // Show an optional tag description
		// $tag_description = tag_description();
		// if ($tag_description) {
		// 	echo apply_filters(
		// 		'tag_archive_meta',
		// 		'<div class="tag-archive-meta">' . $tag_description . '</div>'
		// 	);
		// }
	} elseif ( is_post_type_archive('artists') ) {

		get_template_part( 'template-parts/artist-filtering' );
		
	} elseif (is_category()) {
		// echo "<h1>SHABBA</h1>";
		get_template_part( 'template-parts/artist-filtering' );
		// printf(
		// 	__('Category Archives: %s', 'whoisandywhite'),
		// 	'<span>' . single_cat_title('', false) . '</span>'
		// );
		// // Show an optional category description
		// $category_description = category_description();
		// if ($category_description) {
		// 	echo apply_filters(
		// 		'category_archive_meta',
		// 		'<div class="category-archive-meta">' . $category_description . '</div>'
		// 	);
		// }
	} else {
		// echo "<h1>RANKS</h1>";
		// _e('Blog Archives', 'whoisandywhite');
	}

?>

<div id="archive" role="main">
	

	<article class="main-content">
	<?php if ( have_posts() ) : ?>

		<?php /* Start the Loop */ ?>
		<?php while ( have_posts() ) : the_post(); ?>
			<?php //  sthe_title(); ?>
			<?php get_template_part( 'template-parts/content', get_post_type() ); ?>
		<?php endwhile; ?>

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
