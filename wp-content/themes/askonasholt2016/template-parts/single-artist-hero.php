<!-- Hero for single artists page -->

<?php 
	// get VARS
	// $artist_photo = get_field('artist_photo');
	$main_category = get_field('main_category');
	$photo_credit = get_field('photo_credit');
	$website = get_field('website');
	$contact_text_area = get_field('contact_text_area');
	$manager_email = get_field('manager_email');
	$email = get_field('artist_email');
	$email = get_field('client_email');
	$optional_text_area = get_field('optional_text_area');
?>

<div class="artist-header container">

	<div class="small-12 medium-6 columns artist-hero-image">

		<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'fp-large' );?>

		<div class="artist-header-thumb" style="background-image: url('<?php echo $thumb['0'];?>')">
			
			<div class="image-curve" style="background-image: url('<?php echo get_template_directory_uri(); ?>/assets/images/pattern-3.svg')"></div>	

		</div>

	</div>

	<div class="small-12 medium-6 columns artist-details-area">
		<div class="artist-details-container">
			<div class="artist-details">
				<span class="artist-category">
				<?php if(!empty($main_category)): ?>

					<?php echo $main_category; ?>

				<?php else: ?>

					<?php
						$cat = new WPSEO_Primary_Term('artist-type', get_the_ID());
						$cat = $cat->get_primary_term();
						$catName = get_cat_name($cat);
						echo $catName;
					?>
				
				<?php endif; ?>

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
				
				<?php if( get_field('optional_text_area') ): ?>
					<p><?php echo $optional_text_area ?></p>
				<?php endif; ?>
				
				<?php if( get_field('photo_credit') ): ?>
					<div class="credit-wrapper">
						<span class="photo_credit"><?php echo $photo_credit;?></span>
					</div>
					
				<?php endif; ?>
			</div>

		</div>
	</div>

</div> <!-- Container END -->

	
<div id="sticky-anchor"></div>

<div class="single-page-nav--container" id="sticky">
	<div class="row">
	<ul class="single-page-nav show-for-medium">
	
	<li class="nav-title">
		<?php the_title(); ?>
	</li>

	<li class="single-page-nav_link active">
		<a data-scroll="" data-events="scroll" href="#introduction">Introduction</a>
	</li>

	<li class="single-page-nav_link">
		<a data-scroll href="#video-audio">Video &amp; Audio</a>
	</li>

	<li class="single-page-nav_link">
		<a data-scroll="" data-events="scroll" href="#schedule">Schedule</a>
	</li>

		
	<?php if( get_field('email_or_page_link') == 'Email' ): ?>
		<button class="enquiry-button show-for-medium">
			<a href="mailto:<?php echo $manager_email; ?>?Subject=Enquiry">
				Make enquiry
			</a>
		</button>
	<?php endif; ?>

	<?php if( get_field('email_or_page_link') == 'Link' ): ?>

		<?php $staff_contact = get_field('staff_contact'); ?>
		<button class="enquiry-button show-for-medium">
			<a href="<?php echo $staff_contact ?>">
				Make enquiry
			</a>
		</button>
	<?php endif; ?>



	<!-- getting ACF Flexible content navigation  -->
	<?php $acf_fields = get_fields(); ?>
	<?php include(locate_template('template-parts/acf-navigation.php')); ?>
		</ul>
	</div>
</div>	
