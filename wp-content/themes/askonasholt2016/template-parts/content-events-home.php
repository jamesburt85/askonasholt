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
		
		  <?php 

		    // Query Args
		      $args = array(

		        'post_type'   => 'events',
		        'posts_per_page' => 4,
		        'meta_key'      => 'date',
		        'orderby'     => 'meta_value',
		        'order'       => 'ASC'
		      );

		      // The Query
		      $the_query = new WP_Query( $args );

		    // The Loop
		    if ( $the_query->have_posts() ) {
		      //echo '<ul>';
		      while ( $the_query->have_posts() ) {
		        $the_query->the_post(); ?>
		<!--         //echo '<li>' . get_the_title() . '</li>';

		        //get_template_part( 'template-parts/.....' ); -->
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

		          <div class="row show-for-large">
		            <div class="small-12 columns">

		              <ul class="accordion" data-accordion data-allow-all-closed="true">
		                <li class="accordion-item" data-accordion-item>
		                <hr />
		                  <a href="#" class="accordion-title"><?php //the_title(); ?>
		                    
		                    <div class="event-listing-details simple-listing">
		                      <?php get_template_part( 'template-parts/event-related-artist' ); ?>

		                      <span class="event-detail"><?php echo $time; ?></span>
		                      <span class="event-detail"><?php echo $date; ?></span>
		                      <span class="event-detail"><?php echo $venue; ?>,&nbsp;<?php echo $city; ?></span>
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

		            </div>
		          </div>

		          <div class="row hide-for-large">
		            <div class="small-12 columns">

		              <ul class="accordion" data-accordion data-allow-all-closed="true">
		                <li class="accordion-item" data-accordion-item>
		                <hr />
		                  <a href="#" class="accordion-title"><?php //the_title(); ?>

		                      <div class="press-details">
		                        <?php //get_template_part( 'template-parts/event-related-artist' ); ?>

		                        <span class="event-detail"><?php echo $time; ?></span>
		                        <span class="event-detail"><?php echo $date; ?></span>
		                        <br class="hide-for-medium" />
		                        <span class="event-detail"><?php echo $venue; ?>,&nbsp;<?php echo $city; ?></span>
		                        <span class="more-info">
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

		              </div>
		            </div>

		       <?php }
		      //echo '</ul>';
		      /* Restore original Post Data */
		      wp_reset_postdata();
		    } else {
		      // no posts found
		    }
		  ?>
	
	</div>
	
	<footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer>
	
</div>
