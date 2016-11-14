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
		<?php //foundationpress_entry_meta(); ?>
	</header>

	<div class="tour-project-archive-hero" style="background-image: url('<?php echo get_template_directory_uri(); ?>/assets/images/bg-general.jpg ?>')">
		TOURS AND PROjects <br />
		Optional Description <br />
		Drop Down
	</div>

	<div class="entry-content">
		<?php the_content( __( 'Continue reading...', 'foundationpress' ) ); ?>

		<?php 

			// get VARS
			$start_date = get_field('start_date');
			$end_date = get_field('end_date');
			$blurb = get_field('blurb')

		?>

		<div class="row">
			<div class="small-12 medium-4 columns">
				MAP
			</div>
			<div class="small-12 medium-8 columns">
				<span><?php echo $start_date; ?></span> - 
				<span><?php echo $end_date; ?></span>
				<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
				<span><?php echo $blurb; ?></span>

				<!-- Loop through tour dates -->
				<?php if( have_rows('tour_dates') ) { ?>

					<?php while( have_rows('tour_dates') ) { the_row(); 

						?>

						<span><?php the_sub_field('exact_date'); ?></span>
						<span><?php the_sub_field('venue'); ?></span>, 
						<span><?php the_sub_field('city'); ?></span>
						<br/>

					<?php }; ?>

				<?php }; ?>

				<a href="#">View all dates</a>

			</div>
		</div>

	</div>
	<footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer>
	<hr />
</div>
