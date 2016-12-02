<!-- Hero for single artists page -->

<?php 

	// get VARS
	// $artist_photo = get_field('artist_photo');
	$main_category = get_field('main_category');
	$name = //get_field('name');
	$bio = get_field('bio');
	$website = get_field('website');
	$contact_text_area = get_field('contact_text_area');
	$manager_email = get_field('manager_email');
	$artist_email = get_field('artist_email');
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
					<span class="artist-category"><?php //echo $main_category; ?>
					<?php
					/* FIRST
					 * Note: This function only returns results from the default “category” taxonomy. For custom taxonomies use get_the_terms().
					 */
					$categories = get_the_terms( $post->ID, 'taxonomy' );
					// now you can view your category in array:
					// using var_dump( $categories );
					// or you can take all with foreach:
					foreach( $categories as $category ) {
					    //echo $category->term_id . ', ' . $category->slug . ', ' . $category->name . '<br />';
					} ?>
					</span>
					<span class="artist-category"><?php echo $main_category; ?></span>
					<br>
					<h2 class="artist-name hero-heading"><?php the_title(); ?></h2>
				</div>

				<div class="artist-social">

					<?php if( have_rows('social_buttons') ): ?>

						<?php while( have_rows('social_buttons') ): the_row(); 

							?>

							<a href="<?php the_sub_field('social_media_link'); ?>" target="_blank">
								<i class="fa fa-<?php the_sub_field('social_media_name'); ?>" aria-hidden="true"></i>
							</a>

						<?php endwhile; ?>

					<?php endif; ?>

					<a class="website" href="http://www.<?php echo $website; ?>" target="_blank"><?php echo $website; ?></a>
					
	<!-- 						<a href="mailto:?subject=Artist&amp;body=<?php echo get_permalink() ?>;" title="Artist">
					  <span>Share</span>
					</a> -->
				</div>

				
					<ul class="quick-look-links">
						<li>
							<a href="<?php echo $publicity_pack; ?>" target="_blank">
								<svg width="21px" height="22px" viewBox="0 0 21 22" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
								    <!-- Generator: Sketch 41 (35326) - http://www.bohemiancoding.com/sketch -->
								    <desc>Created with Sketch.</desc>
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
								Download Publicity Pack

							</a>
						</li>
						<li>
							<a href="mailto:?subject= <?php the_title(); ?> &amp;body=C<?php the_permalink(); ?>">

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
								Share
							</a>
						</li>
					</ul>

			</div>
		</div>
	</div> <!-- Row END -->
</div> <!-- Container END -->

<!-- <div class="artist-navigation">
	<div>
		<ul>
			<li><?php the_title(); ?>:</li>
			<li><a data-scroll href="#intro">Introduction</a></li>
			<li><a data-scroll href="#video-audio">Video &amp; Audio</a></li>
			<li><a data-scroll href="#performance-schedule">Schedule</a></li>
			<li><a data-scroll href="#news-projects">News &amp; Projects</a></li>
			<li><a data-scroll href="#image-gallery">Image Gallery</a></li>
			<li><a data-scroll href="#press">Press</a></li>
			<li><button>Make enquiry</button></li>
		</ul>
	</div>
</div> -->

	<ul class="single-page-nav">
		
		<li class="nav-title">
			<?php the_title(); ?>
		</li>

		<li>
			<a data-scroll="" data-events="scroll" href="#introduction">Introduction</a>
		</li>

		<li>
			<a data-scroll href="#video-audio">Video &amp; Audio</a>
		</li>

		<li>
			<a data-scroll="" data-events="scroll" href="#schedule">Schedule</a>
		</li>

		
		<button class="enquiry-button">
			<a href="mailto:<?php echo $artist_email; ?>?Subject=Enquiry">
				Make enquiry
			</a>
		</button>

		<!-- getting ACF Flexible content navigation  -->
		<?php $acf_fields = get_fields(); ?>
		<?php include(locate_template('template-parts/acf-navigation.php')); ?>

	</ul>
