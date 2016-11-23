
<div class="entry-content magazine-item small-12 medium-6 large-3 columns">

	<?php if ( has_post_thumbnail() ) { ?>

		<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'full' );?>
		<div class="magazine-item-thumb" style="background-image: url('<?php echo $thumb['0'];?>')"></div>


	<?php } 

	else { ?>
		
		<div class="magazine-item-thumb" style="background-image: url('<?php bloginfo('template_directory'); ?>/assets/images/default.jpg');"></div>

	<?php } ?>


	<div class="magazine-item-container">

		<span class="magazine-category"><?php //echo $main_category; ?>
			<!-- *** Details in functions.php for getting taxonomy/terms *** -->
			<?php echo wpdocs_custom_taxonomies_terms_links(); ?>
			<?php the_date('d-m-y'); ?>
		</span>

		<?php //foundationpress_entry_meta(); ?>
		
		<p class="magazine-item-header">
			<a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
		</p>
			<?php the_excerpt( __( 'Continue reading...', 'foundationpress' ) ); ?>
	</div>
</div>