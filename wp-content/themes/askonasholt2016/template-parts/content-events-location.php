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

	if($map_location){

		print_r( $map_location );
		echo $map_location['lat'];
		echo $map_location['lng'];

?>

	<div class="marker" data-lat="<?php echo $map_location['lat']; ?>" data-lng="<?php echo $map_location['lng']; ?>">
		<h4><?php the_sub_field('title'); ?></h4>
		<p class="address"><?php echo $map_location['address']; ?></p>
		<p><?php the_sub_field('description'); ?></p>
	</div>

<?php }



