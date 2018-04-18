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

<div id="post-<?php the_ID(); ?>" <?php post_class('blogpost-entry small-12 columns events-listing'); ?>>
	<header>

	</header>
	<div class="entry-content">
		<?php //the_content( __( 'Continue reading...', 'foundationpress' ) ); ?>
		
		<?php

			// get data
			$date 		= get_field('date');
			$time 		= get_field('time');
			$venue 		= get_field('venue');
			$city 		= get_field('city');
			$more_info 	= get_field('more_info');

			// if data isn't there, but some TBC info instead
			if(!$date){  		$date = 'date TBC'; }
			if(!$time){  		$time = 'time TBC'; }
			if(!$venue){  		$venue = 'venue TBC'; }
			if(!$city){  		$city = 'city TBC'; }
			if(!$more_info){  	$more_info = 'More Info Coming Soon...'; }

		?>

		<div class="row">
			<div class="small-12 columns">
				<ul class="accordion press-row" data-accordion data-allow-all-closed="true">
				  <li class="accordion-item" data-accordion-item>
				    <a href="#" class="accordion-title">
				    	<span class="more-info">More info &nbsp;
				    	    <svg width="19px" height="19px" viewBox="1365 1803 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
				    	        <defs></defs>
				    	        <polyline id="Path-3-Copy-2" stroke="#BA0C2F" stroke-width="1" fill="none" transform="translate(1374.485830, 1812.485830) rotate(135.000000) translate(-1374.485830, -1812.485830) " points="1380.48583 1818.48661 1380.48583 1806.48505 1368.48583 1806.48505"></polyline>
				    	    </svg>
				    	</span>
				    </a>

		    		<div class="event-related-artists">
		    	  		<?php get_template_part( 'template-parts/event-related-artist' ); ?>		
		    		</div>
				  	<div class="event-time event-detail"><?php echo $time; ?></div>
				    <div class="event-date event-detail"><?php echo $date; ?></div>
				    <div class="event-venue event-detail"><?php echo $venue; ?></div>
				    <div class="event-city event-detail"><?php echo $city; ?></div>

				    <div class="accordion-content" data-tab-content>
				      <?php echo $more_info; ?>
				    </div>
				  </li>
				</ul>
			</div>
		</div>

	</div>
	
	<footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer>
	
</div>
