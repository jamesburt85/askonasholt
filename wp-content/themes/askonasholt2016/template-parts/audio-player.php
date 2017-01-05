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

<div class="small-12 columns audio-player">
	<audio controls>
		<source src="<?php echo $mp3; ?>" type="audio/mp3">
		<!-- <source src="/path/to/audio.ogg" type="audio/ogg"> -->
	</audio>
	<div class="audio-info">
		<h3><?php echo $trackname; ?> - <?php echo $aristname; ?> - <?php echo $date; ?> - <?php echo $location; ?></h3>
		<!-- <h4></h4> -->
	</div>
</div>

