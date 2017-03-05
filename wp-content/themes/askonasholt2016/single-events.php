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

		<?php do_action( 'foundationpress_post_before_entry_content' ); ?>
		
		<div class="entry-content row">
			<div class="small-12 columns">

				<h4 class="section-header">About the Event</h4>
				
				<?php //the_content(); ?>


		    	<?php get_template_part('template-parts/sharing-block' ); ?>

		    		<?php if( get_field('time') ): ?>
		    			<span><?php the_field('time'); ?></span>
		    		<?php endif; ?>

		    		<?php if( get_field('date') ): ?>
		    			<span><?php the_field('date'); ?></span>
		    		<?php endif; ?>

		    		<?php if( get_field('venue') ): ?>
		    			<span><?php the_field('venue'); ?></span>
		    		<?php endif; ?>

		    		<?php if( get_field('city') ): ?>
		    			<span><?php the_field('city'); ?></span>
		    		<?php endif; ?>

		    		<?php if( get_field('more_info') ): ?>
		    			<p><?php the_field('more_info'); ?></p>
		    		<?php endif; ?>
			
				<div class="artist-list">
					<?php 

					$artist = get_field('related_artists');
					//print_r($artist);

					if (!empty($artist)) { ?>

					<h4 class="section-header">
						Artists
					</h4>

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
									
									<img class="circle-thumb" src="<?php echo $thumb_url ?>">
									
									<div class="side-bar-artist-details simple-listing">
										<a class="side-bar-link" href="<?php echo $artist_url; ?>">
											<span class="side-bar-artist-name"><?php echo get_the_title( $artist_id) ?></span>&nbsp;<br/>
										</a>
										<a href="<?php echo $artist_url; ?>">
											<span class="more-info show-for-medium">Visit Artist Page</span>
											<span class="more-info hide-for-medium">View</span>
										</a>
									
										<?php # If this artist has an artist-type
										# - Will only EVER return the first result in the artist type array
										//if ( !empty( $artist_types)): ?>
											<span><?php //echo $artist_types[0]->name ?></span>
										<?php //endif ?>
									</div>

								</div>
						
						<?php }
					} ?>
				</div>


				<div class="artist-list">
					<?php 

					$artist = get_field('related_touring_partners');
					//print_r($artist);

					if (!empty($artist)) { ?>

					<h4 class="section-header">
						Touring Partners
					</h4>

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
									
									<img class="circle-thumb" src="<?php echo $thumb_url ?>">
									
									<div class="side-bar-artist-details simple-listing">
										<a class="side-bar-link" href="<?php echo $artist_url; ?>">
											<span class="side-bar-artist-name"><?php echo get_the_title( $artist_id) ?></span>&nbsp;<br/>
										</a>
										<a href="<?php echo $artist_url; ?>">
											<span class="more-info show-for-medium">Visit Partner Page</span>
											<span class="more-info hide-for-medium">View</span>
										</a>
									
										<?php # If this artist has an artist-type
										# - Will only EVER return the first result in the artist type array
										//if ( !empty( $artist_types)): ?>
											<span><?php //echo $artist_types[0]->name ?></span>
										<?php //endif ?>
									</div>

								</div>
						
						<?php }
					} ?>
				</div>
			
			</div>
		</div>

		<!-- using ACF Flexible content instead of the_content  -->
		<?php $acf_fields = get_fields(); ?>
		<?php include(locate_template('template-parts/acf.php')); ?>


		<footer>
			<?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
			<p><?php the_tags(); ?></p>
		</footer>

	</article>

<?php endwhile;?>

<?php do_action( 'foundationpress_after_content' ); ?>

</div>

<?php get_template_part('template-parts/link-banner' ); ?>

<?php get_footer();
