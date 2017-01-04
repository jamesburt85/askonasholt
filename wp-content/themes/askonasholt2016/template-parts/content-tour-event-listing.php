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
			$time = get_field('time');
			$date = get_field('date');
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
			        	<div class="event-listing-details">
				        	<span class="event-detail"><?php echo $time; ?></span>
				        	<span class="event-detail"><?php echo $date; ?></span>
				        	<span class="event-detail"><?php echo $venue; ?></span>
				        	<span class="event-detail"><?php echo $city; ?></span>

				        	<span class="more-info">More info &nbsp;
				        	    <svg width="19px" height="19px" viewBox="1365 1803 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
				        	        <defs></defs>
				        	        <polyline id="Path-3-Copy-2" stroke="#BA0C2F" stroke-width="1" fill="none" transform="translate(1374.485830, 1812.485830) rotate(135.000000) translate(-1374.485830, -1812.485830) " points="1380.48583 1818.48661 1380.48583 1806.48505 1368.48583 1806.48505"></polyline>
				        	    </svg>
				        	</span>
				        	
			        	</div>
			        </a>
			        <div class="accordion-content" data-tab-content>
			          <?php echo $more_info; ?>
			        </div>
			      </li>
			    </ul>
			<?php } else { ?>
			    <span>
			    	<div class="tour-dates-basic">
				    	<?php echo $time; ?>&nbsp;
				    	<?php echo $date; ?>&nbsp;
				    	<?php echo $venue; ?>,&nbsp;
				    	<?php echo $city; ?>
			    	</div>
			    </span>
		<?php } ?>




		<?php //foundationpress_entry_meta(); ?>

	</header>

	<footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer>

</div>
