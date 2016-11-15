<?php
/**
 * Template part for home hero
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>



<?php

// check if the repeater field has rows of data
if( have_rows('home_hero') ):

	?>

	<div class="center">
		
		<?php
	 	// loop through the rows of data
	    while ( have_rows('home_hero') ) : the_row();

	        //display a sub field value
	        // echo '<pre>';
	        // 	the_sub_field('image');
	        // echo '</pre>';

	        $image = get_sub_field('background_image');
	        $category = get_sub_field('category');
	        $title = get_sub_field('title');

	        //print_r($image);

	        ?>

			<div class="center-image" style="background-image: url('<?php echo $image['url']; ?>')">
				<div class="hero-text-area hero-text">
				
					<span class="hero-sub-header"><?php echo $category; ?></span><br/>
					<span class="hero-header"><?php echo $title; ?></span><br/>

					<?php
				 	// loop through the rows of data
				    while ( have_rows('buttons') ) : the_row();

					$button_text = get_sub_field('button_text');
					$button_destination = get_sub_field('button_destination');

					?>

					<button class="hero-button">
						<a href="<?php echo $button_destination; ?>">
							<?php echo $button_text; ?>
						</a>
					</button>

					<?php endwhile; ?>

				</div>
			</div>		        

	        <?php endwhile; ?>

	</div>	


<?php else :

    // no rows found

endif;

?>
