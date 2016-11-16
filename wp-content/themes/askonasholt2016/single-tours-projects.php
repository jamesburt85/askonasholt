<?php
/**
 * The template for displaying all single posts and attachments
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>

<?php //get_template_part( 'template-parts/featured-image' ); ?>


<?php get_template_part( 'template-parts/single-tour-project-hero' ); ?>

<div id="single-post" role="main">

<?php do_action( 'foundationpress_before_content' ); ?>
<?php while ( have_posts() ) : the_post(); ?>
	<article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">

		<h1>page navigation here</h1>
		<ul>
			<li>tour name</li>
			<li>intro</li>
			<li>etc</li>

			<!-- getting ACF Flexible content navigation  -->
			<?php $acf_fields = get_fields(); ?>
			<?php include(locate_template('template-parts/acf-navigation.php')); ?>

		</ul>


		<?php do_action( 'foundationpress_post_before_entry_content' ); ?>
		<div class="entry-content">
			<?php the_content(); ?>
			<?php //edit_post_link( __( 'Edit', 'foundationpress' ), '<span class="edit-link">', '</span>' ); ?>

			<?php 
				// get VARS
				$start_date = get_field('start_date');
				$end_date = get_field('end_date');
				$blurb = get_field('blurb');
				$video = get_field('video');
				$tour_events = get_field('tour_events');

			?>

			<div class="row">
				<div class="small-12 medium-3 columns">
					Contact <br/>
					Artist(s) <br/>
					Further Info <br/>
				</div>
				<div class="small-12 medium-9 columns">
					About the Tour/Project
					<span><?php echo $blurb; ?></span>
					Read More
				</div>
			</div>


			<div class="row schedule row">	
				<div class="small-12 medium-3 columns">
					Schedule
				</div>
				
				<div class="small-12 medium-9 columns">

				<?php 
				//print_r($tour_events);

				?>

				<?php 

				  // Query Args
				  $args = array(

				    'post_type' => 'events',
				    'post__in'  => $tour_events,
				    
				  );

				  // The Query
				  $the_query = new WP_Query( $args );

				  // The Loop
				  if ( $the_query->have_posts() ) {
				    // echo '<ul>';
				    while ( $the_query->have_posts() ) {
				      $the_query->the_post();
				      // echo '<li>' . get_the_title() . '</li>';
				      get_template_part( 'template-parts/content-tour-event-listing' );

				      //get_template_part( 'template-parts/.....' );
				    }
				    // echo '</ul>';
				    /* Restore original Post Data */
				    wp_reset_postdata();
				  } else {
				    // no posts found
				  }
				?>
				</div>
			</div>

			<div class="row large-video-row">
				<iframe width="560" height="315" src="https://www.youtube.com/embed/<?php echo $video; ?>" frameborder="0" allowfullscreen></iframe>
			</div>

			<!-- using ACF Flexible content instead of the_content  -->
			<?php include(locate_template('template-parts/acf.php')); ?>

		</div>

		<footer>
			<?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
			<p><?php the_tags(); ?></p>
		</footer>
		<?php //the_post_navigation(); ?>
		<?php do_action( 'foundationpress_post_before_comments' ); ?>
		<?php comments_template(); ?>
		<?php do_action( 'foundationpress_post_after_comments' ); ?>
	</article>
<?php endwhile;?>

<?php do_action( 'foundationpress_after_content' ); ?>
<?php //get_sidebar(); ?>
</div>
<?php get_footer();
