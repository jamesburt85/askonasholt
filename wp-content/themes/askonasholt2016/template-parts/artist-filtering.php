<div class="artist-filtering-block">

	<div class="row">

		<div class="small-12 columns">
				
			<!-- <h5>mmmm...filtering</h5> -->

			<?php 

				echo "<ul class='artist-categories'>";
				// echo wp_list_categories( 'title_li'=>'Select category' );
				echo wp_list_categories( array(
				        'orderby' => 'name',
				        'title_li' => '',
				    ) );
					// $args = array(
					// 'title_li'=>'Select category',
					// )
				echo "</ul>";

			?>

		</div>
	
	</div>

</div>