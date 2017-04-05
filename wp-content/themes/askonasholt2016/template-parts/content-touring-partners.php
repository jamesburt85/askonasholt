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


<div id="post-<?php the_ID(); ?>" <?php post_class('blogpost-entry small-12 medium-6 large-3 columns'); ?>>

	<?php //get_template_part( 'template-parts/people-filtering' ); ?>


	<div class="entry-content">

		<div class=" magazine-item">
			<?php if ( has_post_thumbnail() ) { ?>

				<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'fp-small' );?>
				<div class="client-photo-wrapper">
					<a class="client-link" href="<?php the_permalink(); ?>">
						<div class="magazine-item-thumb" style="background-image: url('<?php echo $thumb['0'];?>')">
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
							<span>Quick Look</span>
						</a>
					</div>
				</div>


			<?php } 

			else { ?>
				
				<div class="client-photo-wrapper">
					<a class="client-link" href="<?php the_permalink(); ?>">
						<div class="magazine-item-thumb" style="background-image: url('<?php bloginfo('template_directory'); ?>/assets/images/default.jpg');">
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
							<span>Quick Look</span>
						</a>
					</div>
				</div>

			<?php } ?>

			<div class="magazine-item-container staff-header">
				
				<p class="magazine-item-header">
					<span class="staff-category"><?php echo wpdocs_custom_taxonomies_terms_links(); ?></span>
					<a href="<?php the_permalink(); ?>"><p><?php the_title(); ?></p></a>
				</p>

					<?php //the_excerpt( __( 'Continue reading...', 'foundationpress' ) ); ?>

			</div>

		</div>

	</div>


	<div id="quicklook-<?php the_ID(); ?>" class="quicklook-content mfp-hide">

		<div class="quicklook-content-pic" style="background-image: url('<?php echo $thumb['0'];?>')"></div>
		<div class="quicklook-content-profile">
			<span class="staff-category"><?php echo wpdocs_custom_taxonomies_terms_links(); ?></span>
			<h3><?php the_title(); ?></h3>
			<h6><?php //echo wpdocs_custom_taxonomies_terms_links(); ?></h6>
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
			<ul>
				<li><a href="mailto:<?php echo $e_mail; ?>?Subject=Enquiry" target="_top"><?php echo $e_mail; ?></a></li>

			</ul>
		</div>

		<div class="quicklook-content-bio">
			<?php //the_content(); ?>
			<p><?php echo $bio; ?></p>
		</div>
		<div class="quicklook-content-links">
			<a class="button" href="<?php the_permalink(); ?>">Go to Client Page</a>	
		</div>

	</div>

	
	<div class="entry-content">
		<?php //the_content( __( 'Continue reading...', 'foundationpress' ) ); ?>
	</div>
	<footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer>

</div>



