<?php
/**
 * The template for displaying all single posts and attachments
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>

<?php //get_template_part( 'template-parts/featured-image' ); ?>

<div id="single-post" role="main">

<?php do_action( 'foundationpress_before_content' ); ?>
<?php while ( have_posts() ) : the_post(); ?>
	<article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">
		<header>

			<?php 
				$position = get_field('position');
				$e_mail = get_field('e-mail');
				$telephone_number = get_field('telephone_number');
				$languages = get_field('languages');
				$position = get_field ('position');
			?>

			<div class="row single-staff-header">
				<div class="small-12 medium-2 columns">
					<?php the_post_thumbnail( 'thumbnail' ); ?>
				</div>

				<div class="small-12 medium-10 columns">
					<span class="staff-category"><?php echo wpdocs_custom_taxonomies_terms_links(); ?></span>
					<h1 class="entry-title serif"><?php the_title(); ?></h1>
					<?php echo $position; ?><br/>
					<a href="mailto:<?php echo $e_mail; ?>?Subject=Hello%20again" target="_top"><?php echo $e_mail; ?></a><br/>
					<span><?php echo $telephone_number; ?></span><br/>
				</div>
			</div>
			
			
			<?php //foundationpress_entry_meta(); ?>
		</header>
		<?php do_action( 'foundationpress_post_before_entry_content' ); ?>
		<div class="entry-content row">

			<?php the_content(); ?>
			<?php //edit_post_link( __( 'Edit', 'foundationpress' ), '<span class="edit-link">', '</span>' ); ?>
		</div>
		<footer>
			<?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
			<p><?php the_tags(); ?></p>
		</footer>
		<?php // the_post_navigation(); ?>
		<?php // do_action( 'foundationpress_post_before_comments' ); ?>
		<?php // comments_template(); ?>
		<?php // do_action( 'foundationpress_post_after_comments' ); ?>
	</article>
<?php endwhile;?>

<?php do_action( 'foundationpress_after_content' ); ?>
<?php //get_sidebar(); ?>

</div>

<?php get_template_part( 'template-parts/link-banner' ); ?>

<?php get_footer();
