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

<div id="post-<?php the_ID(); ?>" <?php post_class('blogpost-entry small-12 medium-6 large-3 columns artists'); ?>>
<!-- 	<header>
		<h2><a href="<?php //the_permalink(); ?>"><?php //the_title(); ?></a></h2>
		<?php //foundationpress_entry_meta(); ?>
	</header> -->
	<div class="entry-content">
		<?php // the_content( __( 'Continue reading...', 'foundationpress' ) ); ?>


	<?php 

		// get VARS
		$artist_image = get_field('artist_image');
		$main_category = get_field('main_category');
		$name = get_field('name');
		$bio = get_field('bio');

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
						<br>
						<p class="artist-name serif"><?php //echo $name; ?> <?php the_title() ; ?> </p>
					</a>
				</div>

			</div>

		<!-- </div> -->


	</div>
	<!-- <footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer> -->
</div>


<div id="quicklook-<?php the_ID(); ?>" class="quicklook-content mfp-hide">

	<div class="quicklook-content-pic" style="background-image: url('<?php echo $thumb;?>')"></div>
	<div class="quicklook-content-profile">
		<h6 class="pop-up-category"><?php echo $main_category; ?></h6>
		<h4 class="artist-category serif"><?php //echo $name; ?><?php the_title() ; ?></h4>
		<ul class="quick-look-links">
			<li>
				<svg width="21px" height="22px" viewBox="0 0 21 22" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
				    <!-- Generator: Sketch 41 (35326) - http://www.bohemiancoding.com/sketch -->
				    <defs>
				        <polyline id="path-1" points="4 21 0 21 1.28587914e-15 0 21 0 21 21 17 21"></polyline>
				        <mask id="mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="21" height="21" fill="white">
				            <use xlink:href="#path-1"></use>
				        </mask>
				    </defs>
				    <g id="Group-18" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
				        <use id="Rectangle-4-Copy-4" stroke="#000000" mask="url(#mask-2)" stroke-width="2" xlink:href="#path-1"></use>
				        <g id="Group-3-Copy" transform="translate(10.000000, 14.000000) rotate(90.000000) translate(-10.000000, -14.000000) translate(3.000000, 7.000000)" stroke="#BA0C2F">
				            <path d="M1.89519934,11.1205667 L11.1047822,1.94539934" id="Path-2" transform="translate(6.499991, 6.532983) rotate(45.000000) translate(-6.499991, -6.532983) "></path>
				            <polyline id="Path-3" transform="translate(7.324505, 6.521204) rotate(45.000000) translate(-7.324505, -6.521204) " points="11.5739552 10.7712037 11.5739552 2.27120371 3.07505388 2.27120371"></polyline>
				        </g>
				    </g>
				</svg>
				&nbsp;
				<span>Download Press Pack</span>
			</li>
			<li>
				<svg width="22px" height="22px" viewBox="0 -1 22 22" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
				    <!-- Generator: Sketch 41 (35326) - http://www.bohemiancoding.com/sketch -->
				    <desc>Created with Sketch.</desc>
				    <defs>
				        <polyline id="path-1" points="3.55271368e-15 8 0 0 21 0 21 21 13 21"></polyline>
				        <mask id="mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="21" height="21" fill="white">
				            <use xlink:href="#path-1"></use>
				        </mask>
				    </defs>
				    <g id="Group-19" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
				        <use id="Rectangle-4" stroke="#000000" mask="url(#mask-2)" stroke-width="2" transform="translate(10.500000, 10.500000) rotate(-180.000000) translate(-10.500000, -10.500000) " xlink:href="#path-1"></use>
				        <g id="Group-6" transform="translate(7.000000, 0.000000)" stroke="#BA0C2F">
				            <path d="M0,14 L13.0322646,1" id="Path-2"></path>
				            <polyline id="Path-3" points="13.5 9 13.5 0.5 5.00109863 0.5"></polyline>
				        </g>
				    </g>
				</svg>
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
		<a class="button" href="#">Make Enquiry</a>		
	</div>


</div>