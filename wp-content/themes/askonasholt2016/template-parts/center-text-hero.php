<!-- //Hero for single tour / project -->


<!-- <?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'full' );?>
<div class="tour-hero" style="background-image: url('<?php echo $thumb['0'];?>')">

	<div class="hero-text-area hero-text">
		<span class="entry-title hero-header"><?php the_title(); ?></span>
		<span class="hero-blurb"><?php the_excerpt(); ?></span>
	</div>

</div> -->

<?php //$thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'full' );?>
<div class="center-text-hero-header" style="background-image: url('<?php //echo $thumb['0'];?><?php echo get_template_directory_uri(); ?>/assets/images/bg-general.jpg')">

	<header class="center-hero-text">
	  <h2 class="hero-heading"><?php the_title(); ?></h2>
	  <p>Optional Description</p>
	  <?php //foundationpress_entry_meta(); ?>
	</header>
</div>
