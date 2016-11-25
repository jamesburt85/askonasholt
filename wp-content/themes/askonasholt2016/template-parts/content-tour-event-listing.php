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

		<?php
			$classes = get_body_class();
			if (in_array('single-tours-projects',$classes)) { ?>
			    <ul class="accordion" data-accordion data-allow-all-closed="true">
			      <li class="accordion-item" data-accordion-item>
			      <hr />
			        <a href="#" class="accordion-title"><?php //the_title(); ?>
			        	<?php echo $date_time; ?>&nbsp;
			        	<?php echo $venue; ?>&nbsp;
			        	<?php echo $city; ?></a>
			        <div class="accordion-content" data-tab-content>
			          <?php echo $more_info; ?>
			        </div>
			      </li>
			    </ul>
			<?php } else { ?>
			    <span>
			    	<div class="tour-dates-basic">
				    	<?php echo $date_time; ?>&nbsp;<?php echo $venue; ?>,&nbsp;<?php echo $city; ?>
			    	</div>
			    </span>
		<?php } ?>




		<?php //foundationpress_entry_meta(); ?>

	</header>

	<footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer>

</div>
