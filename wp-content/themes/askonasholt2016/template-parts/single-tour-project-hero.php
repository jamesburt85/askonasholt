<!-- //Hero for single tour / project -->
<?php 
	// get VARS
	$start_date = get_field('start_date');
	$end_date = get_field('end_date');
	$blurb = get_field('blurb');
?>



<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'fp-large' );?>
<div class="tour-hero" style="background-image: url('<?php echo $thumb['0'];?>')">

	<div class="hero-text-area hero-text">
		
		<div class="padded-text">
			<span class="entry-title hero-header"><?php the_title(); ?></span>
			<span class="hero-blurb"><?php the_excerpt(); ?></span><br/>
		</div>

		<span class="hero-text-dates"><?php echo $start_date; ?>
		
		<?php 
			
			if ($end_date) { ?>
				
				<span> - <?php echo $end_date; ?></span>
		
		<?php } ?>
		

	</div>

</div>
