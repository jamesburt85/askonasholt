<!-- //Hero for single tour / project -->


<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'fp-large' );?>
<div class="tour-hero" style="background-image: url('<?php echo $thumb['0'];?>')">

	<div class="hero-text-area hero-text">
		<span class="entry-title hero-header"><?php the_title(); ?></span>
		<span class="hero-blurb"><?php the_excerpt(); ?></span>
	</div>

</div>
