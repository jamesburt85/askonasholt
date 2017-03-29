<?php
/**
 * The default template for displaying content
 *
 * Used for both single and index/archive/search.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */
global $event_args, $number_of_results;

// run query
$the_query = events_do_query( $event_args );

 
?>

<div  <?php post_class('blogpost-entry small-12 columns events-listing'); ?>>

	<div class="entry-content">
		
		  <?php 

		    // The Loop
		    if ( $the_query->have_posts() ) { ?>
		    	
		    	<div class="row">
		    	  <div class="small-12 columns">
		    	    <ul class="accordion" data-accordion data-allow-all-closed="true">

			<?php   $number_of_results = 0;
                    while ( $the_query->have_posts() ) {
                    $the_query->the_post(); ?>

		            <?php 
		              $time = get_field('time');
		              $date = get_field('date');
		              $venue = get_field('venue');
		              $city = get_field('city');
		              $more_info = get_field('more_info');

		              // if data isn't there, but some TBC info instead
		              if(!$date){      $date = 'date TBC'; }
		              if(!$time){      $time = 'time TBC'; }
		              if(!$venue){     $venue = 'venue TBC'; }
		              if(!$city){      $city = 'city TBC'; }
		              if(!$more_info){ $more_info = 'More Info Coming Soon...'; }
		            ?>

		                <li class="accordion-item  waypoint " data-accordion-item>
		                <hr />
		                  <a href="#" class="accordion-title"><?php //the_title(); ?>

		                      <span class="more-info"><span class="show-for-medium">More info &nbsp;</span>
		                          <svg width="19px" height="19px" viewBox="1365 1803 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
		                              <defs></defs>
		                              <polyline id="Path-3-Copy-2" stroke="#BA0C2F" stroke-width="1" fill="none" transform="translate(1374.485830, 1812.485830) rotate(135.000000) translate(-1374.485830, -1812.485830) " points="1380.48583 1818.48661 1380.48583 1806.48505 1368.48583 1806.48505"></polyline>
		                          </svg>
		                      </span>

		                  </a>
		                    
		                  <div class="event-listing-details simple-listing">
                            <span class="event-detail"><?php echo $date; ?></span>
		                    <span class="event-detail"><?php echo $time; ?></span>                  
		                    <div class="show-for-large">
		                      <?php get_template_part( 'template-parts/event-related-artist' ); ?>
		                    </div>
		                    <div class="show-for-large">
		                      <?php get_template_part( 'template-parts/event-related-touring-partners' ); ?>
		                    </div>		                    
		                    <span class="event-detail"><?php echo $venue; ?>,&nbsp;<?php echo $city; ?></span>
		                  </div>
		                  
		                  <div class="accordion-content" data-tab-content>
		                    <?php echo $more_info; ?>
		                  </div>
		                </li>
		             


		       <?php $number_of_results++; } ?>

		           </ul>

		         </div>
		       </div>
		      <?php 
		      /* Restore original Post Data */
		      wp_reset_postdata();
		    } else {
		      // no posts found

		    }
		  ?>
	
	</div>
	
	
</div>
