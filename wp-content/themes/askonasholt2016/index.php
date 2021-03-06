<?php
/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 * It is used to display a page when nothing more specific matches a query.
 * e.g., it puts together the home page when no home.php file exists.
 *
 * Learn more: {@link https://codex.wordpress.org/Template_Hierarchy}
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>
<?php get_template_part( 'template-parts/magazine-filtering' ); ?>
<div id="page" role="main">
	<article class="main-content infinite-container">
	<?php if ( have_posts() ) : ?>

		<?php /* Start the Loop */ ?>
		<?php while ( have_posts() ) : the_post(); ?>
			<?php //get_template_part( 'template-parts/content', get_post_format() ); ?>
			<!-- using ACF Flexible content instead of the_content  -->
			<?php //$acf_fields = get_fields(); ?>
			<?php //include(locate_template('template-parts/acf.php')); ?>

			<?php get_template_part( 'template-parts/content-post' ); ?>

		<?php endwhile; ?>
		<?php else : ?>
			<?php get_template_part( 'template-parts/content', 'none' ); ?>

		<?php endif; // End have_posts() check. ?>

		<?php /* Display navigation to next/previous pages when applicable */ ?>

		<?php # Paging
		wiaw_archive_nav(); ?>


	</article>

	<!-- <h1>SIGN UP FOR NEWSLETTER HERE</h1> -->
	<?php //get_template_part( 'template-parts/newsletter-banner' ); ?>

</div>

<?php get_template_part('template-parts/link-banner') ?>


<?php get_footer();
