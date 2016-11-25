
<div class="artist-filtering-block" style="background-image: url('<?php echo get_template_directory_uri(); ?>/assets/images/bg-general-official.jpg');">
	
	<header class="filter-header">
		<h2>Clients</h2>
		<p>Optional Description</p>
		<?php //foundationpress_entry_meta(); ?>
	</header>


	<div class="row">

		<div class="small-12 columns">

			<?php 

				echo "<ul class='artist-categories'>";
				// echo "<li></li>";
				// echo wp_list_categories( 'title_li'=>'Select category' );
				echo wp_list_categories( array(
						'taxonomy'     => 'clients-type',
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

<!-- <div class="newsletter-banner row">
	Sign up to our newsletter for the latest announcements
</div> -->