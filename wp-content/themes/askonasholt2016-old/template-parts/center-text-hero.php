<!-- //Hero for single tour / project -->

<div class="center-text-hero-header">

	<header class="center-hero-text">
	  <h2 class="hero-heading no-show"><?php the_title(); ?></h2>

	<?php 
		if (is_page_template( 'tour_stories' )) {
			$myvar = get_field('tour_stories','option');
		}
		elseif (is_page_template( 'what_we_do' )) {
			$myvar = get_field('what_we_do','option');
		}
		elseif (is_page_template( 'contact' )) {
			$myvar = get_field('contact','option');
		}
		elseif (is_post_type_archive( 'online' )) { ?>
			<h2 class="hero-heading">Online Performances</h2>
		<?php }

		//print_r($myvar);
	  	$description = get_field('optional_description',$myvar);
	  	//print_r($description);
	  ?>

	  <!-- <p><?php //echo $description; ?></p> -->
	  <?php //foundationpress_entry_meta(); ?>
	</header>
</div>
