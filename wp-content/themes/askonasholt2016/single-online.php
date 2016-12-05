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
			
			<h1 class="entry-title"><?php the_title(); ?></h1>
			<?php //foundationpress_entry_meta(); ?>
			
			<span class="single-magazine-category"><?php //echo $main_category; ?>
				<!-- *** Details in functions.php for getting taxonomy/terms *** -->
				<?php echo wpdocs_custom_taxonomies_terms_links(); ?>
				<?php the_date('d-m-y'); ?>
			</span>

		</header>

		<?php do_action( 'foundationpress_post_before_entry_content' ); ?>
		
		<div class="entry-content">

			<iframe width="560" height="315" src="<?php the_field('link'); ?>" frameborder="0" allowfullscreen></iframe>

			<div id="share-buttons">
			    
			    <!-- Email -->
			    <a href="mailto:?Subject=Simple Share Buttons&amp;Body=Askonas%20Holt%20 <?php the_permalink(); ?>">
			        <img src="https://simplesharebuttons.com/images/somacro/email.png" alt="Email" />
			    </a>
			 
			    <!-- Facebook -->
			    <a href="http://www.facebook.com/sharer.php?u=https:<?php the_permalink(); ?>" target="_blank">
			        <img src="https://simplesharebuttons.com/images/somacro/facebook.png" alt="Facebook" />
			    </a>

			    <!-- Google+ -->
			    <a href="https://plus.google.com/share?url=https:<?php the_permalink(); ?>" target="_blank">
			        <img src="https://simplesharebuttons.com/images/somacro/google.png" alt="Google" />
			    </a>
			    
			    <!-- LinkedIn -->
			    <a href="http://www.linkedin.com/shareArticle?mini=true&amp;url=https:<?php the_permalink(); ?>" target="_blank">
			        <img src="https://simplesharebuttons.com/images/somacro/linkedin.png" alt="LinkedIn" />
			    </a>

			    <!-- Twitter -->
			    <a href="https://twitter.com/share?url=https:<?php the_permalink(); ?>&amp;text=Askona%20Holt&amp;hashtags=askonasholt" target="_blank">
			        <img src="https://simplesharebuttons.com/images/somacro/twitter.png" alt="Twitter" />
			    </a>

			</div>
		<div class="artist-list">
			<?php 

				$artist = get_field('artist');
				//print_r($artist);

				if (!empty($artist)) {
					foreach ($artist as $artist_id) { ?> 
						

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
			<h4 class="section-header">About the Performance</h4>

			
			<?php the_content(); ?>

			<?php //edit_post_link( __( 'Edit', 'foundationpress' ), '<span class="edit-link">', '</span>' ); ?>
		</div>


		<footer>
			<?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
			<p><?php the_tags(); ?></p>
		</footer>
		<?php //the_post_navigation(); ?>
		<?php // do_action( 'foundationpress_post_before_comments' ); ?>
		<?php // comments_template(); ?>
		<?php // do_action( 'foundationpress_post_after_comments' ); ?>
	</article>
<?php endwhile;?>

<?php do_action( 'foundationpress_after_content' ); ?>
<?php //get_sidebar(); ?>
</div>

<?php get_template_part('template-parts/link-banner' ); ?>

<?php get_footer();
