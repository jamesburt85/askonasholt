
<?php 

	// VARS
	$currentSeasonOBJ 	= get_field('current_season', 'option');
	$upcomingSeasonOBJ 	= get_field('upcoming_season', 'option');
	$pastSeasonOBJ 		= get_field('past_season', 'option');
	$thisPageIs			= get_queried_object();
	// print_r($thisPageIs);

	// if else to determine if its a future or past archive...
	if ( is_post_type_archive('tours-projects') || $thisPageIs->term_order >= $currentSeasonOBJ->term_order ){

		$pageIsPastTour = false;

	} else {

		$pageIsPastTour = true;

	}

	if (is_page_template()){
		$pageName = $pastSeasonOBJ->slug;
	} else if (is_post_type_archive('tours-projects')) {
		$pageName = $upcomingSeasonOBJ->slug;
	} else {
		$pageName = $thisPageIs->slug;
	}


?>




<div class="filtering-block tours-projects-block" style="background-image: url('<?php echo get_template_directory_uri(); ?>/assets/images/bg-general.jpg');">

	<header class="filter-header">

		<div class="row">

			<div class="small-12 columns">
					
				<?php

					// change dropdown if its past or future...
					if ($pageIsPastTour) { ?>

						<!-- PAST -->
						<h2 class="hero-heading">Past Tours &amp; Projects</h2>
						<p>Optional Description</p>
						<p><?php echo $pageName; ?></p>

						<script>
							$(document).ready(function(){

								// label up the current tour
								$currSeasonLi = $('.cat-item-<?php echo $currentSeasonOBJ->term_id ?>');
								console.log($currSeasonLi);
							
								// remove all PAST tours (those after the current)
								$currSeasonLi.css( "display", "none" );
								$currSeasonLi.prevAll().css( "display", "none" );

							});
						</script>

					<?php } else { ?>

						<!-- UPCOMING -->
						<h2 class="hero-heading">Upcoming Tours &amp; Projects</h2>
						<p>Optional Description</p>
						<p><?php echo $pageName; ?></p>

						<script>
							$(document).ready(function(){

								// label up the current tour
								$currSeasonLi = $('.cat-item-<?php echo $currentSeasonOBJ->term_id ?>');
								console.log($currSeasonLi);
								$currSeasonLi.prepend( "Current - " );
							
								// remove Current tour
								// remove all FUTURE tours (those after the current)
								$currSeasonLi.nextAll().css( "display", "none" );

							});
						</script>

					<?php }


				?>

				<button class="button" type="button" data-toggle="example-dropdown">Select Season</button>

				<?php 

					echo "<ul id='example-dropdown' class='tours-projects-categories dropdown-pane' data-dropdown data-auto-focus='true'>";
					echo wp_list_categories( array(
							'taxonomy'     => 'tour-season',
					        'orderby' => 'name',
					        'order'		=> DSC,
					        'title_li' => '',
					        'exclude' => 1, // don't show uncategorised
					        'walker'       => new Walker_Category_Find_Parents(),
					    ) );
					echo "</ul>";

				?>


			</div>
		
		</div>

	</header>




</div>

<!-- <div class="newsletter-banner row">
	Sign up to our newsletter for the latest announcements
</div> -->