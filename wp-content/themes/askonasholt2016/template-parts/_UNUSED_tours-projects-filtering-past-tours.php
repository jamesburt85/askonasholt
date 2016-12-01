
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
		<h2 class="hero-heading">PAST Tours &amp; Projects</h2>
		<p>Optional Description</p>
		<?php //foundationpress_entry_meta(); ?>
	</header>


	<div class="row">

		<div class="small-12 columns">
				
			<?php

				$pastSeasonID = get_field('past_season', 'option');

				echo $pastSeasonID;

			?>

			<button class="button" type="button" data-toggle="example-dropdown">Select Season</button>

			<?php 

				echo "<ul id='example-dropdown' class='tours-projects-categories dropdown-pane' data-dropdown data-auto-focus='true'>";
				// echo "<li></li>";
				// echo wp_list_categories( 'title_li'=>'Select category' );
				echo wp_list_categories( array(
						'taxonomy'     => 'tour-season',
				        'orderby' => 'name',
				        'title_li' => '',
				        'exclude' => 1, // don't show uncategorised
				        // 'show_option_all' => 'show all',
				        'walker'       => new Walker_Category_Find_Parents(),
				    ) );
					// $args = array(
					// 'title_li'=>'Select category',
					// )
				echo "</ul>";

				

			?>

			<script>
				$(document).ready(function(){

					$pastSeasonLi = $('.cat-item-<?php echo $pastSeasonID ?>');
					// console.log($pastSeasonLi);
					// $pastSeasonLi.prepend( "<p>Current</p>" );
					$pastSeasonLi.nextAll().css( "display", "none" );

					// $(document).foundation('dropdown', 'reflow');
				});
			</script>

		</div>
	
	</div>

</div>

<!-- <div class="newsletter-banner row">
	Sign up to our newsletter for the latest announcements
</div> -->