<?php
# Get the ACF Fields
// $acf_fields = get_fields();
// echo "<pre>";
// print_r($acf_fields);
// echo "</pre>";

// loop throuhg each section in the ACF fields array
$section_i=0;

// parallax with copy variable, used to target ID of p-lax
// $pwc = 0;

# If there are sections
if ($acf_fields['flexible_content']) {

	// use var to make ID's unique. i.e. if two promo blocks used, they will be ID='promo-1' and ID='promo-3' rather than both ID='promo'
	$i = 0;

	# Loop through the sections
	foreach ($acf_fields['flexible_content'] as $section):

		//add one on to the counter var
		$i++;


		# Force sections to clear
		echo '<div class="clear-section">';

		
		# work out which type of section it is
		switch ( $section['acf_fc_layout']) {


			


			#Artist Details
			case 'artist_details': ?>
				
				<div class="row">
					<!-- <div class="small-12 medium-6 large-3 columns">	
						
						<div class="artist-photo-wrapper">
							<a href="<?php the_permalink(); ?>">
								<div class="artist-thumb" style="background-image: url('<?php echo $section['artist_photo'] ?>')">
								</div>
							</a>
							
							<div class="overlay zoom-gallery">
								<a href="#">
									<i class="fa fa-eye" aria-hidden="true"></i>Quick Look
								</a>
							</div>
						</div>	

						<div class="artist-details">
							<a href="<?php the_permalink(); ?>">
								<span class="artist-category"><?php echo $section['main_category']; ?></span>
								<br>
								<span class="artist-name"><?php echo $section['name']; ?></span>
							</a>
						</div>

					</div> -->

<!-- 					<div class="zoom-gallery">
 -->						<!--

						Width/height ratio of thumbnail and the main image must match to avoid glitches.

						If ratios are different, you may add CSS3 opacity transition to the main image to make the change less noticable.

						 -->
					<!-- 	<a href="http://farm4.staticflickr.com/3763/9204547649_0472680945_o.jpg" data-source="http://500px.com/photo/32736307" title="Into The Blue" style="width:193px;height:125px;">
							<img src="http://farm4.staticflickr.com/3763/9204547649_7de96ee188_t.jpg" width="193" height="125">
						</a>
						<a href="http://farm3.staticflickr.com/2856/9207329420_7f2a668b06_o.jpg" data-source="http://500px.com/photo/32554131" title="Light Sabre" style="width:82px;height:125px;">
							<img src="http://farm3.staticflickr.com/2856/9207329420_e485948b01_t.jpg" width="82px" height="125">
						</a>
					</div> -->

				</div>

			<?php
			break;


			#Text Area
			case 'text_area': ?>
				
				<div class="row">
					<div class="small-12 columns">
						<h1><?php echo $section['text_block']; ?></h1>
					</div>
				</div>

			<?php
			break;


			#Image_Gallery
			case 'image_gallery': ?>
				
				<div class="row">
					<div class="small-12 columns">
						<h4>Image gallery</h4>
						<img src="<?php echo $section['image']; ?>">
					</div>
				</div>

			<?php
			break;

			#Text banner
			case 'text_banner': ?>
				<div class="text-banner-wrapper" style="background-image: url('<?php echo $section['background_image']; ?>')">
					<div class="row text-banner">
						
						<p><?php echo $section['banner_copy']; ?></p>

					</div>
				</div>

			<?php
			break;




			# Output PRE for anything that's left
			default: ?>
				<pre><?php print_r($section) ?></pre>
				<?php
			break;



		}; # end switch acf_content_type

		$section_i++;

		# Close .clear-section
		echo '</div>';

	endforeach; // end of loop through sections 

# There's no ACF content
} else { 
	the_content(); 
};



// EOF