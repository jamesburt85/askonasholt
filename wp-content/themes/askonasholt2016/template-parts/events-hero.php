<!-- //Hero for Events -->

<div class="center-text-hero-header" style="background-image: url('<?php //echo $thumb['0'];?><?php echo get_template_directory_uri(); ?>/assets/images/light-pattern.png')">

	<header class="center-hero-text">
	  <h2 class="hero-heading">Events</h2>

	<?php 
		if (is_page_template( 'tour_stories' )) {
			$myvar = get_field('tour_stories','option');
		}
		elseif (is_page_template( 'what_we_do' )) {
			$myvar = get_field('what_we_do','option');
		}
		elseif (is_post_type_archive( 'events' )) {
			$myvar = get_field('events','option');
		}

	  	
		//print_r($myvar);
	  	$description = get_field('optional_description',$myvar);
	  	//print_r($description);
	  ?>

	  <p><?php echo $description; ?></p>
	  <?php //foundationpress_entry_meta(); ?>
	</header>
</div>