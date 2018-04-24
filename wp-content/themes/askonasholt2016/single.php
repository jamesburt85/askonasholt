<?php
/**
 * The template for displaying all single posts and attachments
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>

<?php get_template_part( 'template-parts/center-text-hero' ); ?>

<div id="single-post" role="main">

<?php do_action( 'foundationpress_before_content' ); ?>
<?php while ( have_posts() ) : the_post(); ?>
	<article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">
		
		<div class="small-12 columns">
			<header>
				
				<h3 class="entry-title section-header small-gap"><?php //the_title(); ?></h3>
				
				<div class="blog-meta">
					<?php the_category(); ?>
					<?php foundationpress_entry_meta(); ?>
					<br>
					<?php if( get_field('add_author_name') ): ?>	
						<p> Author: <?php the_field('author_name'); ?></p> 
					<?php endif; ?>
				</div>

				<hr/>

				<div class="row">

					<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'fp-large' );?>
					<?php if($thumb): ?>
						<div class="tour-hero" style="background-image: url('<?php echo $thumb['0'];?>'); margin-bottom: 1rem;"></div>
					<?php endif ?>

					<?php the_content(); ?>

				</div>
				
			</header>

			<?php do_action( 'foundationpress_post_before_entry_content' ); ?>

			<?php get_template_part('template-parts/sharing-block' ); ?>

			<div class="entry-content row">
				<!-- <div class="small-12 columns"> -->

				<?php 
					if ( has_post_format( 'audio' )) {
					  // echo 'this is the AUDIO format';
					  get_template_part( 'template-parts/audio-player' );
					} 

					elseif (has_post_format( 'video' )) {
						//echo 'this is the VIDEO format';
						//the_content();
						//getting ACF Flexible content navigation
						$acf_fields = get_fields();
						include(locate_template('template-parts/acf.php'));
						get_template_part( 'template-parts/video-choice' );

					}

					elseif (has_post_format( 'standard' )) {
						//the_content();
						//getting ACF Flexible content navigation
						$acf_fields = get_fields();
						include(locate_template('template-parts/acf.php'));
					}
				?>

				<!-- using ACF Flexible content instead of the_content  -->
				<?php $acf_fields = get_fields(); ?>
				<?php include(locate_template('template-parts/acf.php')); ?>
				
				<div class="artist-list">
					
					<?php 

						$artist = get_field('artist');

						// Obtain list of columns
						foreach ($artist as $key => $row) {
							$artist_name[$key] = get_the_title($row);
						}

						// Sort the data by restaurant name column, ascending
						array_multisort($artist_name, SORT_ASC, $artist);

						if(has_post_format( 'audio' ) || has_post_format( 'video' )) {
							$artist = get_field('related_artist');
						}

						$touring_partners = get_field('related_client');
						// print_r($artist);

						// print_r($touring_partners);

						// Obtain list of columns
						foreach ($touring_partners as $key => $row) {
							$touring_partner_name[$key] = get_the_title($row);
						}

						// Sort the data by restaurant name column, ascending
						array_multisort($touring_partner_name, SORT_ASC, $touring_partners);

						if (!empty($artist)) { ?>

							<h4 class="section-header">Featured Artist(s)</h4>

							<?php foreach ($artist as $artist_id) { 

								# Get Permalink to artist page:
								$artist_url = get_permalink($artist_id);	

								?> 

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
										
										<a href="<?php echo $artist_url; ?>">
											<img class="circle-thumb" src="<?php echo $thumb_url ?>">
										</a>
										
										<div class="side-bar-artist-details">
											<a class="side-bar-link" href="<?php echo $artist_url; ?>">
												<span class="side-bar-artist-name simple-listing"><?php echo get_the_title( $artist_id) ?></span>&nbsp;<br/>
											</a>
											<?php # If this artist has an artist-type
											# - Will only EVER return the first result in the artist type array
											//if ( !empty( $artist_types)): ?>
												<span><?php //echo $artist_types[0]->name ?></span>
											<?php //endif ?>

											<a href="<?php echo $artist_url; ?>">
												<span class="more-info show-for-medium">Visit Artist Page</span>
												<span class="more-info hide-for-medium">View</span>
											</a>
										</div>

									</div>

								<?php
							}
						}

						if (!empty($touring_partners)) { ?>

							<h4 class="section-header">Featured Touring Partner(s)</h4>

							<?php foreach ($touring_partners as $touring_partner_id) { 

								# Get Permalink to artist page:
								$artist_url = get_permalink($touring_partner_id);	

								?> 

									<div class="side-bar-artist"> <?php
										# Get featured image id
										$thumb_id = get_post_thumbnail_id($touring_partner_id);
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
										$artist_types = get_the_terms( $touring_partner_id, 'artist-type');

										?>
										
										<a href="<?php echo $artist_url; ?>">
											<img class="circle-thumb" src="<?php echo $thumb_url ?>">
										</a>
										
										<div class="side-bar-artist-details">
											<a class="side-bar-link" href="<?php echo $artist_url; ?>">
												<span class="side-bar-artist-name simple-listing"><?php echo get_the_title( $touring_partner_id) ?></span>&nbsp;<br/>
											</a>
											<?php # If this artist has an artist-type
											# - Will only EVER return the first result in the artist type array
											//if ( !empty( $artist_types)): ?>
												<span><?php //echo $artist_types[0]->name ?></span>
											<?php //endif ?>

											<a href="<?php echo $artist_url; ?>">
												<span class="more-info show-for-medium">Visit Artist Page</span>
												<span class="more-info hide-for-medium">View</span>
											</a>
										</div>

									</div>

								<?php
							}
						} ?>						
				</div>

				

				<?php // the_content(); ?>
				<?php //edit_post_link( __( 'Edit', 'foundationpress' ), '<span class="edit-link">', '</span>' ); ?>
		<!-- 	</div> -->
			</div>
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

<div class="full-width">
	<hr>

	<div class="row">
		<h4 class="section-header center">Related Articles</h4>
		<?php

		$related = get_posts( array( 'category__in' => wp_get_post_categories($post->ID), 'numberposts' => 4, 'post__not_in' => array($post->ID) ) );
		if( $related ) foreach( $related as $post ) {
		setup_postdata($post); ?>

		    <?php get_template_part( 'template-parts/content-post' ); ?>

		<?php }
		wp_reset_postdata(); ?>
	</div>

</div>

<?php get_template_part( 'template-parts/link-banner' ); ?>

<?php get_footer();
