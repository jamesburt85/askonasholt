<h2><a href="<?php //the_permalink(); ?>"><?php //the_title(); ?></a></h2>
<?php //foundationpress_entry_meta(); ?>
<div class="row online-performance-header">
	<h3 class="section-header">Online Performances</h3>
	<!-- <p>In partnership with ......</p> -->
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
	<a href="<?php echo site_url(); ?>/online-performances"><button class="button">View All</button></a>
</div>

<hr/>