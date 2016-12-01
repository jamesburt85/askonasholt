
<?php 
	
	// debugging
	// echo "<pre>";
	// var_dump( $wp_query );
	// echo "</pre>";
	
?>




<div class="filtering-block tours-projects-block" style="background-image: url('<?php echo get_template_directory_uri(); ?>/assets/images/bg-general-official.jpg');">

<?php	
	// $description = get_field( "optional_description" );

	// if( $description ) {
	    
	//     echo $description;

	// } else {

	//     echo 'empty';
	    
	// }
?>

	<header class="filter-header">
		<h2 class="hero-heading">Upcoming Tours &amp; Projects</h2>
		<p>Optional Description</p>
		<?php //foundationpress_entry_meta(); ?>
	</header>


	<div class="row">

		<div class="small-12 columns">
				
			<?php

				$currentSeasonOBJ 	= get_field('current_season', 'option');
				$upcomingSeasonOBJ 	= get_field('upcoming_season', 'option');
				$pastSeasonOBJ 		= get_field('past_season', 'option');

				$thisPageIs			= get_queried_object();

				// echo 'Upcoming season is ' . $upcomingSeasonOBJ->term_id . 'and the order is... ' . $upcomingSeasonOBJ->term_order;
				// echo 'Curr season is ' . $currentSeasonOBJ->term_id . 'and the order is... ' . $currentSeasonOBJ->term_order;
				// echo 'past season is ' . $pastSeasonOBJ->term_id . 'and the order is... ' . $pastSeasonOBJ->term_order;
				// echo '*** And this page is... ' . $thisPageIs->term_id  . 'and the order is... ' . $thisPageIs->term_order;

				// # work out what tour page we're on....

				if (is_post_type_archive('tours-projects')){

					// echo "<h2>were on the Upcoming page, which is the deafult archive.php loop</h2>";
					// echo "<h3>(we've modded the pre_get_posts in functions file )</h3>";

					$pageIsPastTour = false;

				} elseif (!is_tax('tour-season') ) {

					// echo "<h2>were on the PAST TOURS first page</h2>";

					$pageIsPastTour = true;

				} else {

					if ($thisPageIs->term_order >= $currentSeasonOBJ->term_order) {
						// echo "<h1>were on the current season or a future tour</h1>";
						$pageIsPastTour = false;
					} else {
						// echo "<h1>were on a PAST tour</h1>";
						$pageIsPastTour = true;
					}

				}


				if ($pageIsPastTour) { ?>
					
					<script>
						$(document).ready(function(){

							// label up the current tour
							$currSeasonLi = $('.cat-item-<?php echo $currentSeasonOBJ->term_id ?>');
							console.log($currSeasonLi);
							$currSeasonLi.prepend( "<p>Current</p>" );
						
							// remove all PAST tours (those after the current)
							$currSeasonLi.css( "display", "none" );
							$currSeasonLi.prevAll().css( "display", "none" );

						});
					</script>

				<?php } else { ?>

					<script>
						$(document).ready(function(){

							// label up the current tour
							$currSeasonLi = $('.cat-item-<?php echo $currentSeasonOBJ->term_id ?>');
							console.log($currSeasonLi);
							$currSeasonLi.prepend( "<p>Current</p>" );
						
							// remove Current tour
							// remove all FUTURE tours (those after the current)
							$currSeasonLi.nextAll().css( "display", "none" );

						});
					</script>

				<?php }





				// if (is_tax('tour-season') ) {

				// 	$term = get_term_by( 'slug', get_query_var( 'term' ), get_query_var( 'taxonomy' ) ); 
				// 	echo $term->slug;

				// } else {

				// 	// echo $currentSeasonOBJ;
				// 	echo get_the_category_by_ID( $currentSeasonOBJ );

				// }

			?>

			<button class="button" type="button" data-toggle="example-dropdown">Select Season</button>

			<?php 

				echo "<ul id='example-dropdown' class='tours-projects-categories dropdown-pane' data-dropdown data-auto-focus='true'>";
				// echo "<li></li>";
				// echo wp_list_categories( 'title_li'=>'Select category' );
				echo wp_list_categories( array(
						'taxonomy'     => 'tour-season',
				        'orderby' => 'name',
				        'order'		=> DSC,
				        'title_li' => '',
				        'exclude' => 1, // don't show uncategorised
				        // 'show_option_all' => 'show all',
				        'walker'       => new Walker_Category_Find_Parents(),
				    ) );
					// $args = array(
					// 'title_li'=>'Select category',
					// )
				echo "</ul>";

				// USE JQUERY ABOVE TO TAILOR THE DROPDOWN...

			?>


		</div>
	
	</div>

</div>

<!-- <div class="newsletter-banner row">
	Sign up to our newsletter for the latest announcements
</div> -->