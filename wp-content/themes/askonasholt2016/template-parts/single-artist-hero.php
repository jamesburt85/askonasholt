<!-- Hero for single artists page -->

<?php 
	// get VARS
	// $artist_photo = get_field('artist_photo');
	$main_category = get_field('main_category');
	$website = get_field('website');
	$contact_text_area = get_field('contact_text_area');
	$manager_email = get_field('manager_email');
	$email = get_field('artist_email');
	$email = get_field('client_email');
	$publicity_pack = get_field('publicity_pack');
?>

<div class="artist-header container">
	<div class="row">
		<div class="artist-details-area">
			<div class="small-12 medium-5 columns">
				<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'full' );?>
				<div class="artist-header-thumb" style="background-image: url('<?php echo $thumb['0'];?>')">
				</div>
			</div>

			<div class="small-12 medium-7 columns artist-details-container">
				<div class="artist-details">
					<span class="artist-category"><?php echo $main_category; ?>
					
					<?php
					/* FIRST
					 * Note: This function only returns results from the default “category” taxonomy. For custom taxonomies use get_the_terms().
					 */
					//$artist_categories = get_the_terms( $post->ID, 'artist-type' );

					//$client_categories = get_the_terms( $post->ID, 'clients-type' );

					// now you can view your category in array:
					// using var_dump( $categories );
					// or you can take all with foreach:
					//foreach( $artist_categories as $category ) {
					    //echo $category->name;
					//}
					//foreach( $client_categories as $category ) {
					    //echo $category->name;
					//} //?>
					</span>
					
					<br>
					<h2 class="artist-name hero-heading"><?php the_title(); ?></h2>
				</div>
				
				<ul class="quick-look-links">
					<li>
						<a href="<?php echo $publicity_pack; ?>" target="_blank">
							<img src="<?php echo get_template_directory_uri(); ?>/assets/images/download-arrow.png">
							&nbsp;
							Download Publicity Pack
						</a>
					</li>
					<li>
						<a href="mailto:?subject= <?php the_title(); ?> &amp;body=C<?php the_permalink(); ?>">
						<img src="<?php echo get_template_directory_uri(); ?>/assets/images/share-arrow.png">
							&nbsp;
							Share
						</a>
					</li>
				</ul>

			</div>
		</div>
	</div> <!-- Row END -->
</div> <!-- Container END -->

	
	<div id="sticky-anchor"></div>
	<ul class="single-page-nav show-for-medium" id="sticky">
		
		<li class="nav-title">
			<?php the_title(); ?>
		</li>

		<li class="single-page-nav_link">
			<a data-scroll="" data-events="scroll" href="#introduction">Introduction</a>
		</li>

		<li class="single-page-nav_link">
			<a data-scroll href="#video-audio">Video &amp; Audio</a>
		</li>

		<li class="single-page-nav_link">
			<a data-scroll="" data-events="scroll" href="#schedule">Schedule</a>
		</li>

		
		<button class="enquiry-button show-for-medium">
			<a href="mailto:<?php echo $email; ?>?Subject=Enquiry">
				Make enquiry
			</a>
		</button>

		<!-- getting ACF Flexible content navigation  -->
		<?php $acf_fields = get_fields(); ?>
		<?php include(locate_template('template-parts/acf-navigation.php')); ?>

	</ul>
