<!-- //Hero for single tour / project -->
<?php 
	// get VARS
	$start_date = get_field('start_date');
	$end_date = get_field('end_date');
	$blurb = get_field('blurb');
	$image = get_field('background_image');

?>

<div class="tour-hero" style="background-image: url('<?php echo $image; ?>')">

	<div class="hero-text-area">
		<h1 class="entry-title"><?php the_title(); ?></h1>
		<span><?php echo $blurb; ?></span>
		<span><?php echo $start_date; ?></span> - 
		<span><?php echo $end_date; ?></span>
	</div>

</div>
