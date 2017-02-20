<?php
/**
 * The default template for displaying content
 *
 * Used for both single and index/archive/search.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>

<div id="post-<?php the_ID(); ?> waypoint" <?php post_class('blogpost-entry small-12 medium-6 large-3 columns artists animated waypoint is-hidden-onload'); ?>>

	<div class="entry-content">
		<?php // the_content( __( 'Continue reading...', 'foundationpress' ) ); ?>

	<?php 

		// get VARS
		$first_name = get_field('first_name');
		$last_name = get_field('last_name');
		$photo_credit = get_field('photo_credit');
		$artist_image = get_field('artist_image');
		$main_category = get_field('main_category');
		$name = get_field('name');
		$bio = get_field('bio');
		$publicity_pack = get_field('publicity_pack');
		$manager_email = get_field('manager_email');

		// if no image, use default
		if (!$artist_photo){
			$artist_photo = get_template_directory_uri().'/assets/images/default.jpg';
		}

		// temp. for testing. If no name, then use title.
		if (!$name){
			$name = get_the_title();
		}

	?>


		<!-- <div class="row"> -->
			
			<?php $category = get_the_category();
			$firstCategory = $category[0]->cat_name;?>

			<div class="artist-filter <?php echo $firstCategory; ?>">	
				
				<div class="artist-photo-wrapper">
					<a href="<?php the_permalink(); ?>">
						<?php
							$thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'full' );
							$thumb = $thumb['0'];
							if (!$thumb){ // giving default image if no image is set.
								$thumb = get_template_directory_uri() . '/assets/images/default.jpg';
							}

						?>
						<div class="artist-thumb image-popup-no-margins" style="background-image: url('<?php echo $thumb;?>')">
						</div>
					</a>
					
					<div class="overlay">
						<a href="#quicklook-<?php the_ID(); ?>" class="open-popup-link">
							<svg width="18px" height="12px" viewBox="51 823 18 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
							    <!-- Generator: Sketch 41 (35326) - http://www.bohemiancoding.com/sketch -->
							    <g id="Group-7" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(52.000000, 824.000000)">
							        <path d="M8,10.3299999 C12.418278,10.3299999 16,5.16499996 16,5.16499996 C16,5.16499996 12.418278,0 8,0 C3.581722,0 0,5.16499996 0,5.16499996 C0,5.16499996 3.581722,10.3299999 8,10.3299999 Z" id="Oval-3" stroke="#BA0C2F"></path>
							        <circle id="Oval-4" fill="#BA0C2F" cx="8" cy="5" r="3"></circle>
							    </g>
							</svg>
							&nbsp;&nbsp;
							<span>Quick Look</span>
						</a>
					</div>
				</div>


				<div class="artist-details">
					<a href="<?php the_permalink(); ?>">
						<span class="artist-category"><?php echo $main_category; ?></span>
				
				<!-- If Primary categories required to pull through automatically, use the below, if using ACF text field to enter category, use above -->
				
				<!-- 		<span class="artist-category"> -->
							<?php
								//$cat = new WPSEO_Primary_Term('artist-type', get_the_ID());
								//$cat = $cat->get_primary_term();
								//$catName = get_cat_name($cat);
								//echo $catName;
							?>
				<!-- 		</span> -->
						<br>
						<p class="artist-name serif"><?php //echo $name; ?>
							<?php echo $first_name; ?>
							<?php echo $last_name; ?>
							<?php //the_title() ; ?> 
						</p>
					</a>
				</div>

			</div>

		<!-- </div> -->				

	</div>

</div>


<!-- HERE -->

<div id="quicklook-<?php the_ID(); ?>" class="quicklook-content mfp-hide">

	<div class="quicklook-content-pic" style="background-image: url('<?php echo $thumb;?>')"></div>
	<div class="quicklook-content-profile">
		<h6 class="pop-up-category"><?php echo $main_category; ?></h6>
		<h4 class="artist-category serif"><?php //echo $name; ?><?php the_title() ; ?></h4>
		<ul class="quick-look-links">
			<li>
				<a href="<?php echo $publicity_pack; ?>" target="_blank">
					<img src="<?php echo get_template_directory_uri(); ?>/assets/images/download-arrow.png">
					&nbsp;
					<span>Download Publicity Pack</span>
				</a>
			</li>
			<li>
			<img src="<?php echo get_template_directory_uri(); ?>/assets/images/share-arrow.png">
				&nbsp;
				
				<a class="share-button" href="mailto:?Subject=Artist&amp;Body=<?php the_permalink(); ?>">
				    <span>Share</span>
				</a>
			</li>
		</ul>
	</div>

	<div class="quicklook-content-bio">
		<p><?php echo $bio; ?></p>
	</div>
	<div class="quicklook-content-links">
		<a class="button" href="<?php the_permalink(); ?>">View Artist Page</a>
		&nbsp;
		&nbsp;
		<!-- <a class="button" href="#">Make Enquiry</a> -->
		<a class="button" href="mailto:<?php echo $manager_email; ?>?Subject=Enquiry">Make Enquiry</a>
	</div>


</div>

