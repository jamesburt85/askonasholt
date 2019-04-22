<div class="filtering-block magazine-filtering-block">

	<?php
		$description = get_field('optional_description');
	?>

	<div class="filtering-block-inner">

		<header class="filter-header">
			<h2 class="hero-heading">Tour Stories</h2>
			<?php if($description) : ?>
			<h3 class="hero-header-text"><p><?php echo $description; ?></p></h3>
			<?php endif; ?>
		</header>


		<div class="row">

			<div class="small-12 columns">

				<?php 

					// echo "<ul class='artist-categories'>";
					// // echo "<li></li>";
					// // echo wp_list_categories( 'title_li'=>'Select category' );
					// echo wp_list_categories( array(
					// 		//'taxonomy'     => 'magazine-content-type',
					// 		'post_type' 	=> 'post',
					// 		'category_name' => 'categories',
					//         'orderby' 		=> 'name',
					//         'title_li' 		=> '',
					//         'exclude' 		=> 1, // don't show uncategorised
					//         'show_option_all' => 'show all',
					//         'walker'       	=> new Walker_Category_Find_Parents(),
					//     ) );
					// 	// $args = array(
					// 	// 'title_li'=>'Select category',
					// 	// )
					// echo "</ul>";

				?>

			</div>

		</div>
	
	</div>

</div>