<div class="filtering-block artist-filtering-block" style="background-image: url('<?php echo get_template_directory_uri(); ?>/assets/images/light-pattern.png');">

	<?php 
		$myvar = get_field('artists','option');
		//print_r($myvar);
		$description = get_field('optional_description',$myvar);
		//print_r($description);
	?>

	<header class="filter-header">
		<h2 class="hero-heading">Artists</h2>
		<p><?php echo $description; ?></p>
	</header>

	<div class="row">

		<div class="small-12 columns filter-area">

			<?php 

				echo "<ul class='artist-categories'>";
				// echo "<li></li>";
				// echo wp_list_categories( 'title_li'=>'Select category' );
				echo wp_list_categories( array(
						'taxonomy'     => 'artist-type',
				        'orderby' => 'name',
				        'title_li' => '',
				        'exclude' => 1, // don't show uncategorised
				        'show_option_all' => 'all',
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