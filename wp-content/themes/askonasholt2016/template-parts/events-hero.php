<!-- //Hero for single tour / project -->


<!-- <?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'full' );?>
<div class="tour-hero" style="background-image: url('<?php echo $thumb['0'];?>')">

	<div class="hero-text-area hero-text">
		<span class="entry-title hero-header"><?php the_title(); ?></span>
		<span class="hero-blurb"><?php the_excerpt(); ?></span>
	</div>

</div> -->

<!-- <?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'full' );?>
<div class="center-text-hero-header" style="background-image: url('<?php echo $thumb['0'];?>')">
	<header class="center-hero-text">
	  <h2 class="hero-heading"><?php the_title(); ?></h2>
	  <p>Optional Description</p>
	  <?php //foundationpress_entry_meta(); ?>
	</header>
</div> -->


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
	      get_template_part( 'template-parts/magazine-blocks' );

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