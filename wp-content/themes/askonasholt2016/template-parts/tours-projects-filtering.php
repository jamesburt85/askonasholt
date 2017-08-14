
<?php 

$all_fields = get_fields();
$queried_object = get_queried_object();

	// VARS
	$currentSeasonOBJ 	= get_field('current_season', 'option');
	$upcomingSeasonOBJ 	= get_field('upcoming_season', 'option');
	$pastSeasonOBJ 		= get_field('past_season', 'option');
	$thisPageIs			= get_queried_object();
	// print_r($thisPageIs);

	// if else to determine if its a future or past archive...
	$pageIsPastTour = true;
	if ( is_post_type_archive('tours-projects') || $thisPageIs->term_order >= $currentSeasonOBJ->term_order ){
		$pageIsPastTour = false;
	}

	if (is_page_template()){
		if ( isset( $_REQUEST['tour-year'] ) ) {
			$pageName = $_REQUEST['tour-year'];
		}
		else {
			$pageName = $pastSeasonOBJ->slug;
		}
	} else if (is_post_type_archive('tours-projects')) {
		$pageName = $currentSeasonOBJ->slug;
	} else {
		$pageName = $thisPageIs->slug;
	}


?>


<div class="filtering-block tours-projects-block">

	<header class="filtering-block-inner filter-header">

		<div class="row">

			<div class="small-12 columns">
					
				<?php

					// change dropdown if its past or future...
					if ($pageIsPastTour) { ?>

						<!-- PAST -->
						<?php 
							$myvar = get_field('past-tours','option');
							//print_r($myvar);
							$description = get_field('optional_description',$myvar);
							//print_r($description);
						?>

						<h2 class="hero-heading">Past Tours &amp; Projects</h2>
						<!-- <p><?php //echo $description; ?></p> -->
						<p><?php echo str_replace("-"," / ",$pageName); ?></p>

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
						<?php 
							$myvar = get_field('upcoming','option');
							//print_r($myvar);
							$description = get_field('optional_description',$myvar);
							//print_r($description);
						?>
						<!-- <p><?php //echo $description; ?></p> -->
						<!-- <h2><?php //echo $pageName; ?></h2> -->
						<!-- <p><?php echo str_replace("-"," / ",$pageName); ?></p> -->

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

				<?php # Past Tour List

				if ( $pageIsPastTour):

				?>

					<button class="button" type="button" data-toggle="example-dropdown">Select Season</button>

				<?php

					# Get the past tours page object
					$past_tours_page = get_field('past_tours','option');
					$past_tours_permalink = get_permalink( $past_tours_page->ID);

					# Get Terms
					$seasons = get_terms( array(
					    'taxonomy' => 'tour-season',
					    'hide_empty' => true,
				        'orderby' => 'name',
				        'order'		=> DSC,
				        'exclude' => 56, // don't show Upcoming
					) );

					# Are there any seasons
					if ( !empty( $seasons)): ?>
					<ul id='example-dropdown' class='tours-projects-categories dropdown-pane' data-dropdown data-auto-focus='true'>
						<?php # Loop through the seasons
						foreach ($seasons as $season): ?>
							<li><a href="<?php echo $past_tours_permalink ?>?tour-year=<?php echo $season->slug ?>"><?php echo $season->name ?></a></li>
						<?php endforeach ?>
					<?php endif ?>

				<?php endif; ?>

			</div>
		
		</div>

	</header>

</div>
