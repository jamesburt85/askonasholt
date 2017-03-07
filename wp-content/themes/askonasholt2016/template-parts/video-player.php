<?php
# Get the ACF Fields
$acf_fields = get_fields();
// echo "<pre>";
// print_r($acf_fields);
// echo "</pre>";

$video = $acf_fields['flexible_content'][0]['video'];

// echo "<pre>";
// print_r($video);
// echo "</pre>";

?>

<!-- <div class="row large-video-row animated waypoint is-hidden-onload" id="waypoint">
  <iframe width="560" height="315" src="https://www.youtube.com/embed/<?php echo $video; ?>" frameborder="0" allowfullscreen></iframe>
</div> -->

<?php get_template_part( 'template-parts/video-choice' ); ?>

<div class="video-description" data-equalizer-watch>
  <?php //echo wpdocs_custom_taxonomies_terms_links(); ?>
  	<div class="video-meta">
	  <span class="video-title">
	  	<?php the_title(); ?>
	  </span>
	  <span class="magazine-date">
	  	<?php echo get_the_date('j M Y'); ?>
	  </span>
	</div>
  <span class="magazine-item-copy"><?php the_excerpt( __( 'Continue reading...', 'foundationpress' ) ); ?></span>
</div>

