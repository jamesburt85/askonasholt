<?php
# Get the ACF Fields
$acf_fields = get_fields();
// echo "<pre>";
// print_r($acf_fields);
// echo "</pre>";

$video = $acf_fields['video'];

?>

<div class="row large-video-row">
  <iframe width="560" height="315" src="https://www.youtube.com/embed/<?php echo $video; ?>" frameborder="0" allowfullscreen></iframe>
</div>

<div class="video-description">
  <?php echo wpdocs_custom_taxonomies_terms_links(); ?>
  <?php the_date('d-m-y'); ?>
  <?php the_title(); ?>
  <span class="magazine-item-copy"><?php the_excerpt( __( 'Continue reading...', 'foundationpress' ) ); ?></span>
</div>
