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

	<div id="sticky-anchor"></div>
	<ul class="single-page-nav show-for-medium" id="sticky">
		
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

		
		<button class="enquiry-button show-for-large">
			<a href="mailto:<?php echo $artist_email; ?>?Subject=Enquiry">
				Make enquiry
			</a>
		</button>

		<!-- getting ACF Flexible content navigation  -->
		<?php $acf_fields = get_fields(); ?>
		<?php include(locate_template('template-parts/acf-navigation.php')); ?>

	</ul>
