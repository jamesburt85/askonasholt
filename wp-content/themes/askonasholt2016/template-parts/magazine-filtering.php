<div class="filtering-block magazine-filtering-block">

	<?php
		//getting id of page
		$myvar = get_field('the_green_room','option');
		//print_r($myvar);
		
		//getting description from that page
		$description = get_field('optional_description',$myvar);
		//print_r($description);
	?>

	<header class="filter-header">
		<h2 class="hero-heading">The Green Room</h2>
		<!-- <p><?php //echo $description; ?></p> -->
	</header>


	<div class="row">

		<div class="small-12 columns">

			<?php 

				echo "<ul class='artist-categories'>";
				// echo "<li></li>";
				// echo wp_list_categories( 'title_li'=>'Select category' );
				echo wp_list_categories( array(
						//'taxonomy'     => 'magazine-content-type',
						'post_type' 	=> 'post',
						'category_name' => 'categories',
				        'orderby' 		=> 'name',
				        'title_li' 		=> '',
				        'exclude' 		=> 1, // don't show uncategorised
				        'show_option_all' => 'all',
				        'walker'       	=> new Walker_Category_Find_Parents(),
				    ) );
					// $args = array(
					// 'title_li'=>'Select category',
					// )
				echo "</ul>";

			?>



		</div>
	
	</div>

</div>