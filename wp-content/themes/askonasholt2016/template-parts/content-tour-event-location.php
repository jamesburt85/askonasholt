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
	$map_location = get_field('map_location');
	// print_r( $map_location );
	// echo $map_location['lat'];
	// echo $map_location['lng'];
?>

<?php 
  $time = get_field('time');
  $date = get_field('date');
  $venue = get_field('venue');
  $city = get_field('city');
  $more_info = get_field('more_info');

  // if data isn't there, but some TBC info instead
  if(!$date){      $date = 'date TBC'; }
  if(!$time){      $time = 'time TBC'; }
  if(!$venue){     $venue = 'venue TBC'; }
  if(!$city){      $city = 'city TBC'; }
  if(!$more_info){ $more_info = 'More Info Coming Soon...'; }
?>

<div class="marker" data-lat="<?php echo $map_location['lat']; ?>" data-lng="<?php echo $map_location['lng']; ?>">

  <div class="simple-listing">
    <span class="event-detail"><?php echo $date; ?></span>
    <span class="event-detail"><?php echo $time; ?></span>                  
    <div>
      <?php get_template_part( 'template-parts/event-related-artist' ); ?>
    </div>
    <div>
      <?php get_template_part( 'template-parts/event-related-touring-partners' ); ?>
    </div>		                    
    <span class="event-detail"><?php echo $venue; ?>,&nbsp;<?php echo $city; ?></span>
  </div>
  
  <div class="accordion-content" data-tab-content>
    <?php echo $more_info; ?>
  </div>

</div>
