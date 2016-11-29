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
<!-- 		<header>
			<h1 class="entry-title"><?php the_title(); ?></h1>
			<?php foundationpress_entry_meta(); ?>
		</header> -->
		<?php do_action( 'foundationpress_post_before_entry_content' ); ?>
		<div class="entry-content">
			<?php //the_content(); ?>

			<?php 

				// get VARS
				// $artist_photo = get_field('artist_photo');
				$main_category = get_field('main_category');
				$name = //get_field('name');
				$bio = get_field('bio');
				$website = get_field('website');
				$contact_text_area = get_field('contact_text_area');
			?>

			<div class="artist-header row">
				
				<div class="small-12 medium-4 columns">
					<?php $thumb = wp_get_attachment_image_src( get_post_thumbnail_id($post->ID), 'full' );?>
					<div class="artist-header-thumb" style="background-image: url('<?php echo $thumb['0'];?>')">
					</div>
				</div>

				<div class="small-12 medium-8 columns">
					<div class="artist-details">
						<span class="artist-category"><?php //echo $main_category; ?>
						<?php
						/* FIRST
						 * Note: This function only returns results from the default “category” taxonomy. For custom taxonomies use get_the_terms().
						 */
						$categories = get_the_terms( $post->ID, 'taxonomy' );
						// now you can view your category in array:
						// using var_dump( $categories );
						// or you can take all with foreach:
						foreach( $categories as $category ) {
						    //echo $category->term_id . ', ' . $category->slug . ', ' . $category->name . '<br />';
						} ?>
						</span>
						<span class="artist-category"><?php echo $main_category; ?></span>
						<br>
						<h3 class="artist-name"><?php the_title(); ?></h3>
					</div>

					<div class="artist-social">

						<?php if( have_rows('social_buttons') ): ?>

							<?php while( have_rows('social_buttons') ): the_row(); 

								?>

								<a href="<?php the_sub_field('social_media_link'); ?>" target="_blank">
									<i class="fa fa-<?php the_sub_field('social_media_name'); ?>" aria-hidden="true"></i>
								</a>

							<?php endwhile; ?>

						<?php endif; ?>

						<a href="http://www.<?php echo $website; ?>" target="_blank"><?php echo $website; ?></a>
						
						<a href="mailto:?subject=Artist&amp;body=<?php echo get_permalink() ?>;" title="Artist">
						  <span>Share</span>
						</a>
					</div>

				</div>
			</div>

			<div class="artist-navigation">
				<div>
					<ul>
						<li><?php the_title(); ?>:</li>
						<li><a data-scroll href="#intro">Introduction</a></li>
						<li><a data-scroll href="#video-audio">Video &amp; Audio</a></li>
						<li><a data-scroll href="#performance-schedule">Schedule</a></li>
						<li><a data-scroll href="#news-projects">News &amp; Projects</a></li>
						<li><a data-scroll href="#image-gallery">Image Gallery</a></li>
						<li><a data-scroll href="#press">Press</a></li>
						<li><button>Make enquiry</button></li>
					</ul>
				</div>
			</div>



			<div class="bio-row row" id="intro">
				<div class="small-12 medium-3 columns artist-contacts">
					Contact

					<?php if( have_rows('contact_people') ): ?>

						<?php while( have_rows('contact_people') ): the_row(); 

							?>

							<p class="caption"><?php the_sub_field('contact_name'); ?></p>
							<p class="caption"><?php the_sub_field('contact_position'); ?></p>

						<?php endwhile; ?>

					<?php endif; ?>

					<p><?php echo $contact_text_area; ?></p>

				</div>
				<div class="small-12 medium-9 columns">
					Introduction
					<p><?php echo $bio; ?></p>
				</div>
			</div>

			<div class="video-audio-area row" id="video-audio">
				Video &amp; Audio
			</div>

			<div class="performance-schedule row" id="performance-schedule">
				Performance Schedule
			</div>

			<div class="news-projects row" id="news-projects">
				News &amp; Projects
			</div>

			<div class="image-gallery row" id="image-gallery">
				Image Gallery
				<!-- using ACF Flexible content instead of the_content  -->
				<?php $acf_fields = get_fields(); ?>
				<?php include(locate_template('template-parts/acf.php')); ?>
			</div>

			<div class="press row" id="press">
				Press
			</div>

			<?php //edit_post_link( __( 'Edit', 'foundationpress' ), '<span class="edit-link">', '</span>' ); ?>
		</div>
		<footer>
			<?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
			<p><?php the_tags(); ?></p>
		</footer>
		<?php the_post_navigation(); ?>
		<?php do_action( 'foundationpress_post_before_comments' ); ?>
		<?php comments_template(); ?>
		<?php do_action( 'foundationpress_post_after_comments' ); ?>
	</article>
<?php endwhile;?>

<?php do_action( 'foundationpress_after_content' ); ?>
<?php //get_sidebar(); ?>
</div>
<?php get_footer();
