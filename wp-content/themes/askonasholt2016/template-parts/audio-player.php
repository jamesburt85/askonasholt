<?php
# Get the ACF Fields
$acf_fields = get_fields();
// echo "<pre>";
// print_r($acf_fields);
// echo "</pre>";

$mp3 			= $acf_fields['audio'];
$trackname 		= $acf_fields['track_name'];
$aristname 		= $acf_fields['artist'][0]->post_title;
$date 			= $acf_fields['date'];
$location 		= $acf_fields['location'];

if ( is_array($mp3) ) {
	$mp3 		= $acf_fields['audio']['url'];
}

?>

<div class="small-12 columns audio-player animated waypoint is-hidden-onload" id="waypoint">
	<audio controls>
		<source src="<?php echo $mp3; ?>" type="audio/mp3">
		<source src="/path/to/audio.ogg" type="audio/ogg">
	</audio>
	<a href="<?php the_permalink(); ?>">
		<div class="audio-info video-meta">
			<span class="video-title"><?php echo $aristname; ?></span>
			<?php //the_date('d M Y'); ?> <?php echo $date; ?> <?php echo $trackname; ?> <?php echo $location; ?>
		</div>
	</a>
</div>

