<!-- Hero for single people page -->



<div class="artist-header people container" style="background-image: url('<?php //echo $thumb['0'];?><?php echo get_template_directory_uri(); ?>/assets/images/light-pattern.png')">
	<div class="row">
		<div class="artist-details-area">

			<?php 
				$position = get_field('position');
				$e_mail = get_field('e-mail');
				$telephone_number = get_field('telephone_number');
				$languages = get_field('languages');
				$position = get_field ('position');
			?>

		
			<div class="small-12 medium-5 columns">
				<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'full' );?>
				<div class="artist-header-thumb" style="background-image: url('<?php echo $thumb['0'];?>')"></div>
			</div>

			<div class="small-12 medium-7 people-details-container columns">
				<span class="staff-category"><?php echo wpdocs_custom_taxonomies_terms_links(); ?></span>
				<h2 class="entry-title serif"><?php the_title(); ?></h2>
				<span class="position-details"><?php echo $position; ?></span>
				<br/>
				<br/>
				<a href="mailto:<?php echo $e_mail; ?>?Subject=Hello%20again" target="_top"><?php echo $e_mail; ?></a><br/>
				<span><?php echo $telephone_number; ?></span><br/>
			</div>

		</div>
	</div> <!-- Row END -->
</div> <!-- Container END -->
