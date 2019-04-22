<div class="filtering-block artist-filtering-block">

	<div class="filtering-block-inner">

		<header class="filter-header">
			<h2 class="hero-heading">Artists</h2>
			<?php if ( !empty(get_the_archive_description()) ) : ?>
			<h3 class="hero-header-text"><?php the_archive_description(); ?></h3>
			<?php endif; ?>
		</header>

		<div class="row">

			<div class="small-12 columns filter-area">

				<?php 

					echo '<ul class="artist-categories"><li class="cat-item-all">';
						echo '<a href="/artists/">all</a></li>';
					// echo "<li></li>";
					// echo wp_list_categories( 'title_li'=>'Select category' );


					// $category_list = wp_list_categories( array(
					// 		'taxonomy' => 'artist-type',
					//         'orderby' => 'name',
					//         'order'=>'ASC',
					//         'title_li' => '',
					//         'exclude' => 1, // don't show uncategorised
					//         'show_option_all' => 'all',
					//         'walker'       => new Walker_Category_Find_Parents(),
					//         'echo' => 0
					//     ) );

					// // a quick hack to replace the url - would be better to create an option for this type of artist to indicate that it should link directly to the artist page
					// $category_list = str_replace('?taxonomy=artist-type&#038;term=partitura-project', 'artists/partitura-project/', $category_list);

					$category_ids = get_all_category_ids();

					$args = array(
						'taxonomy' => 'artist-type',
					    'orderby' => 'name',
					    'order'=>'ASC',
					    'exclude' => 1, // don't show uncategorised
						'parent' => 0
					);
					$categories = get_categories( $args );
					foreach ( $categories as $category ) {
						echo '<li' . ( ( get_queried_object()->term_id === $category->term_id )? ' class="current-cat"' : '' ) . ( ( get_queried_object()->parent === $category->term_id )? ' class="current-cat-parent"' : '' ) . '><a href="' . get_category_link( $category->term_id ) . '" rel="bookmark">' . $category->name . '</a></li>';
					}				

					echo '</ul>';

				    $children = get_categories( array ('taxonomy' => 'artist-type', 'parent' => get_queried_object()->term_id ));

				    if(get_queried_object()->parent) {

				    	$children = get_categories( array ('taxonomy' => 'artist-type', 'parent' => get_queried_object()->parent ));

				    }

				    if( $children && $_GET['term'] ) {

					    echo '<ul class="children">';

						foreach ($children as $c) {
						    $kids .= '<li' . ( ( get_queried_object()->term_id === $c->term_id )? ' class="current-cat"' : '' ) . '><a href="' . get_category_link( $c->term_id ) . '" rel="bookmark">' . $c->name . '</a></li>';
						}

						// a quick hack to replace the url - would be better to create an option for this type of artist to indicate that it should link directly to the artist page
						$kids = str_replace('?taxonomy=artist-type&term=partitura-project', 'artists/partitura-project/', $kids);

						echo $kids;

						echo '</ul>';

					}

				?>

			</div>
		
		</div>

	</div>

</div>