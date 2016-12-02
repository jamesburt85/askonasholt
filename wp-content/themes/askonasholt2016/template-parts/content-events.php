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

		<div class="small-12 medium-4 columns">
			<h5><?php echo $date; ?> | <?php echo $time; ?></h5>
			<h3><?php the_title(); ?></h3>
		</div>

		<div class="small-12 medium-8 columns">
			<ul class="accordion" data-accordion data-allow-all-closed="true">
			  <li class="accordion-item" data-accordion-item>

			  	<div class="event-related-artists">
			    	<?php get_template_part( 'template-parts/event-related-artist' ); ?>		
			  	</div>
			    			
			  	<div class="event-time"><?php echo $time; ?></div>
			    <div class="event-date"><?php echo $date; ?></div>
			    <div class="event-venue"><?php echo $venue; ?></div>
			    <div class="event-city"><?php echo $city; ?></div>

			    <a href="#" class="accordion-title">
			    	More info
			    </a>

			    <div class="accordion-content" data-tab-content>
			      <?php echo $more_info; ?>
			    </div>
			  </li>
			</ul>
		</div>

	</div>
	
	<footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer>
	<hr />
</div>
