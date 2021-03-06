<div class="filtering-block artist-filtering-block">
	
	<?php 
		$description = get_field('optional_description');
	?>

	<div class="filtering-block-inner">

		<header class="filter-header">
			<h2 class="hero-heading">Touring Partners</h2>
			<?php if ( !empty(get_the_archive_description()) ) : ?>
			<h3 class="hero-header-text"><?php the_archive_description(); ?></h3>
			<?php endif; ?>

			<?php //foundationpress_entry_meta(); ?>
		</header>


		<div class="row">

			<div class="small-12 columns filter-area">

				<?php 

					echo "<ul class='artist-categories'>";
					// echo "<li></li>";
					// echo wp_list_categories( 'title_li'=>'Select category' );
					echo wp_list_categories( array(
							'taxonomy'     => 'touring-partners-type',
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

</div>

<!-- <div class="newsletter-banner row">
	Sign up to our newsletter for the latest announcements
</div> -->