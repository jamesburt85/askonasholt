<?php
# Get the ACF Fields
// $acf_fields = get_fields();
// echo "<pre>";
// print_r($acf_fields);
// echo "</pre>";

// loop through each section in the ACF fields array
$section_i=0;

# If there are sections
if ($acf_fields['flexible_content']) {

	$d = 0;

	# Loop through the sections
	foreach ($acf_fields['flexible_content'] as $section):

		//add one on to the counter var
		$d++;

		# Force sections to clear
		// echo '<div class="clear-section">'; 

		?>

		<li class="single-page-nav_link">
			<a data-scroll="" data-events="scroll" href="#<?php echo $section['unique_id'] ?>"><?php echo $section['unique_id'] ?></a>
		</li>

		<?php

		$section_i++;

	endforeach; // end of loop through sections 

};



// EOF