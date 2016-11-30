<div class="artist-filtering-block" style="background-image: url('<?php echo get_template_directory_uri(); ?>/assets/images/bg-general-official.jpg');">

<?php	
	$description = get_field( "optional_description" );

	if( $description ) {
	    
	    echo $description;

	} else {

	    echo 'empty';
	    
	}
?>

	<header class="filter-header">
		<h2 class="hero-heading">People</h2>
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
						'taxonomy'     => 'people-type',
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