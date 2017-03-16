<div class="filtering-block artist-filtering-block">

	<?php 
		$myvar = get_field('artists','option');
		//print_r($myvar);
		$description = get_field('optional_description',$myvar);
		//print_r($description);
	?>

	<header class="filter-header">
		<h2 class="hero-heading">Artists</h2>
	</header>

	<div class="row">

		<div class="small-12 columns filter-area">

			<?php 

				echo "<ul class='artist-categories'>";
				// echo "<li></li>";
				// echo wp_list_categories( 'title_li'=>'Select category' );


				$category_list = wp_list_categories( array(
						'taxonomy'     => 'artist-type',
				        'orderby' => 'name',
				        'order'=>'ASC',
				        'title_li' => '',
				        'exclude' => 1, // don't show uncategorised
				        'show_option_all' => 'all',
				        'walker'       => new Walker_Category_Find_Parents(),
				        'echo' => 0
				    ) );

				// a quick hack to replace the url - would be better to create an option for this type of artist to indicate that it should link directly to the artist page
				$category_list = str_replace('?taxonomy=artist-type&#038;term=partitura-project', 'artists/partitura-project/', $category_list);

				echo $category_list;

					// $args = array(
					// 'title_li'=>'Select category',
					// )
				echo "</ul>";

			?>

		</div>
	
	</div>

</div>