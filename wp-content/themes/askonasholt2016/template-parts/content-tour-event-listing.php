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

		<?php 
			$date_time = get_field('date_time');
			$venue = get_field('venue');
			$city = get_field('city');
			$more_info = get_field('more_info');
		?>

		<ul class="accordion" data-accordion data-allow-all-closed="true">
		  <li class="accordion-item" data-accordion-item>
		    <a href="#" class="accordion-title"><?php the_title(); ?><?php echo $date_time; ?><?php echo $venue; ?><?php echo $city; ?></a>
		    <div class="accordion-content" data-tab-content>
		      <?php echo $more_info; ?>
		    </div>
		  </li>
		</ul>

		
		
		
		
		<?php //foundationpress_entry_meta(); ?>

	</header>

	<footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer>
	<hr />
</div>
