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

<div id="post-<?php the_ID(); ?>" <?php post_class('blogpost-entry small-12 columns'); ?>>
	<header>

		<h2><a href="<?php //the_permalink(); ?>"><?php //the_title(); ?></a></h2>
		<?php //foundationpress_entry_meta(); ?>
		<div class="row online-performance-header">
			<h3 class="section-header">Online Performances</h3>
			<p>In partnership with ......</p>
		</div>

		<div class="row live-events">

			<?php
			  // Query Args
			  $args = array(

			    'post_type'		=> 'online',
			    //'post__in'  	=> $tour_artists,
			    'posts_per_page' => 3,
			    
			  );

			  // The Query
			  $the_query = new WP_Query( $args );

			  // The Loop
			  if ( $the_query->have_posts() ) {
			   // echo '<ul>';
			    while ( $the_query->have_posts() ) {
			      $the_query->the_post();
			      //echo '<li>' . get_the_title() . '</li>';
			      get_template_part( 'template-parts/online-blocks' );

			      //get_template_part( 'template-parts/.....' );
			    }
			    //echo '</ul>';
			    /* Restore original Post Data */
			    wp_reset_postdata();
			  } else {
			    // no posts found
			  }
			?>

		</div>

		<div class="online-performances-link">
			<a href="<?php echo site_url(); ?>/online-performances"><button>View All</button></a>
		</div>

		<?php 
			$date = get_field('date');
			$time = get_field('time');
			$venue = get_field('venue');
			$city = get_field('city');
			$more_info = get_field('more_info');
		?>

		<div class="small-12 medium-4 columns">
			<?php //echo $date_time; ?>&nbsp;
			Date of this group of Events
		</div>

		<div class="small-12 medium-8 columns">
			<ul class="accordion" data-accordion data-allow-all-closed="true">
			  <li class="accordion-item" data-accordion-item>
			  <hr />
			    <a href="#" class="accordion-title"><?php //the_title(); ?>
			    			
			    	<?php get_template_part( 'template-parts/event-related-artist' ); ?>		

			    	<?php echo $time; ?>
			    	<?php echo $date; ?>
			    	<?php echo $venue; ?>,&nbsp;
			    	<?php echo $city; ?>
			    </a>

			    <div class="accordion-content" data-tab-content>
			      <?php echo $more_info; ?>
			    </div>
			  </li>
			</ul>
		</div>

	</header>
	<div class="entry-content">
		<?php //the_content( __( 'Continue reading...', 'foundationpress' ) ); ?>
	</div>
	
	<footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer>
	<hr />
</div>
