<div class="artist-filtering-block">

	<div class="row">

		<div class="small-12 columns">
				
			<!-- <h5>mmmm...filtering</h5> -->

			<?php 

				echo "<ul class='artist-categories'>";
				// echo "<li></li>";
				// echo wp_list_categories( 'title_li'=>'Select category' );
				echo wp_list_categories( array(
						'taxonomy'     => 'artist-type',
				        'orderby' => 'name',
				        'title_li' => '',
				        'exclude' => 1, // don't show uncategorised
				        'show_option_all' => 'show all',
				        'walker'       => new Walker_Category_Find_Parents(),
				    ) );
					// $args = array(
					// 'title_li'=>'Select category',
					// )
				echo "</ul>";

			?>

		</div>
	
	</div>

</div>