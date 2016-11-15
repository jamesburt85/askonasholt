<?php
/**
 * The default template for displaying content
 *
 * Used for both single and index/archive/search.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>

<div id="post-<?php the_ID(); ?>" <?php post_class('blogpost-entry small-12 medium-6 large-3 columns'); ?>>
<!-- 	<header>
		<h2><a href="<?php //the_permalink(); ?>"><?php //the_title(); ?></a></h2>
		<?php //foundationpress_entry_meta(); ?>
	</header> -->
	<div class="entry-content">
		<?php // the_content( __( 'Continue reading...', 'foundationpress' ) ); ?>


	<?php 

		// get VARS
		$artist_photo = get_field('artist_photo');
		$main_category = get_field('main_category');
		$name = get_field('name');
		$bio = get_field('bio');

		// if no image, use default
		if (!$artist_photo){
			$artist_photo = get_template_directory_uri().'/assets/images/default.jpg';
		}

		// temp. for testing. If no name, then use title.
		if (!$name){
			$name = get_the_title();
		}

	?>


		<!-- <div class="row"> -->
			
			<?php $category = get_the_category();
			$firstCategory = $category[0]->cat_name;?>

			<div class="artist-filter <?php echo $firstCategory; ?>">	
				
				<div class="artist-photo-wrapper">
					<a href="<?php the_permalink(); ?>">
						<div class="artist-thumb image-popup-no-margins" style="background-image: url('<?php echo $artist_photo; ?>')">
						</div>
					</a>
					
					<div class="overlay">
						<a href="#">
							<i class="fa fa-eye" aria-hidden="true"></i>
							<span>Quick Look</span>
						</a>
					</div>
				</div>


				<div class="artist-details">
					<a href="<?php the_permalink(); ?>">
						<span class="artist-category"><?php echo $main_category; ?></span>
						<br>
						<span class="artist-name"><?php echo $name; ?></span>
					</a>
				</div>

			</div>

		<!-- </div> -->


	</div>
	<footer>
		<?php $tag = get_the_tags(); if ( $tag ) { ?><p><?php the_tags(); ?></p><?php } ?>
	</footer>
</div>
