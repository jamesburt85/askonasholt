<?php
/**
 * The template for displaying all single posts and attachments
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>

<?php //get_template_part( 'template-parts/featured-image' ); ?>

<div id="single-post" role="main">

<?php do_action( 'foundationpress_before_content' ); ?>
<?php while ( have_posts() ) : the_post(); ?>
	<article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">
		<header>
			
			<h3 class="entry-title section-header small-gap"><?php the_title(); ?></h3>
			
			<div class="blog-meta">
				<?php the_category(); ?>
				<?php foundationpress_entry_meta(); ?>
			</div>

			<hr/>
			
		</header>
		<?php do_action( 'foundationpress_post_before_entry_content' ); ?>

		<?php get_template_part('template-parts/sharing-block' ); ?>

		<div class="entry-content row">

			<?php 
				if ( has_post_format( 'audio' )) {
				  // echo 'this is the AUDIO format';
				  get_template_part( 'template-parts/audio-player' );
				} 

				elseif (has_post_format( 'video' )) {
					//echo 'this is the VIDEO format';
					the_content();
					//getting ACF Flexible content navigation
					$acf_fields = get_fields();
					include(locate_template('template-parts/acf.php'));
				}

				else {
					the_content();
					//getting ACF Flexible content navigation
					$acf_fields = get_fields();
					include(locate_template('template-parts/acf.php'));
				}
			?>
			
			<div class="artist-list">
				
				<?php 

					$artist = get_field('artist');
					//print_r($artist);

					if (!empty($artist)) { ?>

						<h4 class="section-header">Featured Artist(s)</h4>

						<?php foreach ($artist as $artist_id) { ?> 

								<div class="side-bar-artist"> <?php
									# Get featured image id
									$thumb_id = get_post_thumbnail_id($artist_id);
									# If theere is not a featured image
									if ( empty( $thumb_id)) {
										$thumb_url = 'http://placehold.it/150x150';
									# Yeay, we haven image ID
									} else {
										# Get the image from the image ID
										$thumb_url_array = wp_get_attachment_image_src($thumb_id, 'thumbnail', true);
										$thumb_url = $thumb_url_array[0];
									}
									//echo $thumb_url;

									# Get post terms as array
									$artist_types = get_the_terms( $artist_id, 'artist-type');

									?>
									
									<img class="circle-thumb" src="<?php echo $thumb_url ?>">
									
									<div class="side-bar-artist-details">
										<span class="side-bar-artist-name"><?php echo get_the_title( $artist_id) ?></span>&nbsp;<br/>
									
										<?php # If this artist has an artist-type
										# - Will only EVER return the first result in the artist type array
										//if ( !empty( $artist_types)): ?>
											<span><?php //echo $artist_types[0]->name ?></span>
										<?php //endif ?>

										<a href="<?php the_permalink(); ?>">
											<span class="more-info">Visit Artist Page</span>
										</a>
									</div>

								</div>
							
				<!-- 					<?php # If the artist has an artist type
							if ( !empty( $artist_types)): ?>
								<ul>
								<?php # Loop through all the artist types for this artist,
								# - and output them all!
								foreach ($artist_types as $type): ?>
									<li><?php echo $type->name ?></li>
								<?php endforeach ?>
								</ul>
							<?php endif ?> -->
						
							<?php
						}
					} ?>
			</div>

			

			<?php // the_content(); ?>
			<?php //edit_post_link( __( 'Edit', 'foundationpress' ), '<span class="edit-link">', '</span>' ); ?>
		</div>
		
		<footer>
			<?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
			<p><?php the_tags(); ?></p>
		</footer>
		<?php // the_post_navigation(); ?>
		<?php // do_action( 'foundationpress_post_before_comments' ); ?>
		<?php // comments_template(); ?>
		<?php // do_action( 'foundationpress_post_after_comments' ); ?>
	</article>
<?php endwhile;?>

<?php do_action( 'foundationpress_after_content' ); ?>
<?php //get_sidebar(); ?>

</div>

<div class="full-width row">
	<hr>
	<h4 class="section-header center">Related Articles</h4>
	<?php

	$related = get_posts( array( 'category__in' => wp_get_post_categories($post->ID), 'numberposts' => 4, 'post__not_in' => array($post->ID) ) );
	if( $related ) foreach( $related as $post ) {
	setup_postdata($post); ?>

	    <?php get_template_part( 'template-parts/content-post' ); ?>

	<?php }
	wp_reset_postdata(); ?>

</div>

<?php get_template_part( 'template-parts/link-banner' ); ?>

<?php get_footer();
