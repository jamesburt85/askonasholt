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

<div id="post-<?php the_ID(); ?> waypoint" <?php post_class('blogpost-entry small-12 medium-6 large-3 columns waypoint'); ?>>

	<?php //get_template_part( 'template-parts/people-filtering' ); ?>


	<?php 
		$position 	= get_field('position');
		$e_mail 	= get_field('e-mail');
		$telephone_number = get_field('telephone_number');
		$languages 	= get_field('languages');
		$position 	= get_field ('position');
		$languages 	= get_field ('languages');
	?>

	<div class="entry-content">

		<div class="magazine-item">
			<?php if ( has_post_thumbnail() ) { ?>

				<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'fp-small' );?>
				<div class="people-link-item">
					<a class="serif" href="<?php the_permalink(); ?>">
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
			
				<div class="people-link-item">
					<a class="serif" href="<?php the_permalink(); ?>">
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
				
				<div class="magazine-item-header">
					<span class="staff-category"><?php echo wpdocs_custom_taxonomies_terms_links(); ?></span>
					<a href="<?php the_permalink(); ?>"><p><?php the_title(); ?></p></a>
					<span class="staff-category"><?php echo $position; ?></span>
					
					<a href="mailto:<?php echo $e_mail; ?>?Subject=Enquiry" target="_top"><?php echo $e_mail; ?>
					</a>

					<span><br/><?php echo $telephone_number; ?></span>

					<?php if( have_rows('languages') ): ?>
						<div class="flag-area">
							<span>Languages:</span>
							<?php while( have_rows('languages') ): the_row(); ?>

								<img class="flag" src="<?php echo get_template_directory_uri(); ?>/assets/images/flags/4x3/<?php the_sub_field('flags'); ?>.svg" alt="Flag">

							<?php endwhile; ?>
						</div>
					<?php endif; ?>

				</div>

			</div>

		</div>

	</div>

	<div id="quicklook-<?php the_ID(); ?>" class="quicklook-content mfp-hide">

		<div class="quicklook-content-pic" style="background-image: url('<?php echo $thumb['0'];?>')"></div>
		<div class="quicklook-content-profile">
			<h6 class="staff-category"><?php echo wpdocs_custom_taxonomies_terms_links(); ?></h6>
			<h4 class="serif"><?php the_title(); ?></h4>
			<?php echo $position; ?>
			<ul>
				<li><a href="mailto:<?php echo $e_mail; ?>?Subject=Enquiry" target="_top"><?php echo $e_mail; ?></a></li>
				<li><?php echo $telephone_number; ?></li>
				<li>
					<?php if( have_rows('languages') ): ?>
						<div class="flag-area">
						<span>Languages:</span>
						<?php while( have_rows('languages') ): the_row(); ?>

								<img class="flag" src="<?php echo get_template_directory_uri(); ?>/assets/images/flags/4x3/<?php the_sub_field('flags'); ?>.svg" alt="Albania Flag">

							<?php endwhile; ?>
						</div>
					<?php endif; ?>
				</li>
			</ul>
		</div>

		<div class="quicklook-content-bio">
			<?php //echo $bio; ?>
			<?php the_content(); ?>
		</div>
		<div class="quicklook-content-links">
			<a class="button" href="<?php the_permalink(); ?>">Go to Staff Page</a>	
		</div>

	</div>



	
	<div class="entry-content">
		<?php //the_content( __( 'Continue reading...', 'foundationpress' ) ); ?>
	</div>
	<footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer>

</div>
