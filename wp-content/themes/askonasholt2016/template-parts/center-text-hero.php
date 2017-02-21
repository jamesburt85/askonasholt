<!-- //Hero for single tour / project -->


<!-- <?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'full' );?>
<div class="tour-hero" style="background-image: url('<?php echo $thumb['0'];?>')">

	<div class="hero-text-area hero-text">
		<span class="entry-title hero-header"><?php the_title(); ?></span>
		<span class="hero-blurb"><?php the_excerpt(); ?></span>
	</div>

</div> -->

<div class="center-text-hero-header">

	<header class="center-hero-text">
	  <h2 class="hero-heading"><?php the_title(); ?></h2>

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

		//print_r($myvar);
	  	$description = get_field('optional_description',$myvar);
	  	//print_r($description);
	  ?>

	  <p><?php echo $description; ?></p>
	  <?php //foundationpress_entry_meta(); ?>
	</header>
</div>
