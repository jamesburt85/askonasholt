<?php
/*
Template Name: tour-stories
*/
get_header(); ?>

<?php //get_template_part( 'template-parts/featured-image' ); ?>
<?php //get_template_part( 'template-parts/home-hero' ); ?>

<div id="page-full-width" role="main">

<?php do_action( 'foundationpress_before_content' ); ?>
<?php while ( have_posts() ) : the_post(); ?>
  <article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">
<!--       <header>
          <h1 class="entry-title"><?php the_title(); ?></h1>
      </header> -->
      <?php do_action( 'foundationpress_page_before_entry_content' ); ?>
      
      <div class="artist-filtering-block">
        
        <?php get_template_part( 'template-parts/center-text-hero' ); ?>

      </div>

      <div class="entry-content">
          <?php the_content(); ?>

          <!-- Getting all items with Tour category -->
          <div class="row">
          
          <!-- Get news items -->
            <?php 

              // Query Args
                $args = array(

                  'post_type'   => 'post',
                  'category_name' => 'tour',
                );

                // The Query
                $the_query = new WP_Query( $args );

              // The Loop
              if ( $the_query->have_posts() ) {

                while ( $the_query->have_posts() ) {
                  $the_query->the_post();

                  get_template_part( 'template-parts/content-post' );

                }

                /* Restore original Post Data */
                wp_reset_postdata();
              } else {
                // no posts found
              }
            ?>
          </div>
      </div>
      <footer>
          <?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
          <p><?php the_tags(); ?></p>
      </footer>
      <?php do_action( 'foundationpress_page_before_comments' ); ?>
      <?php comments_template(); ?>
      <?php do_action( 'foundationpress_page_after_comments' ); ?>
  </article>
<?php endwhile;?>

<?php do_action( 'foundationpress_after_content' ); ?>

</div>

<?php get_template_part( 'template-parts/link-banner' ); ?>

<?php get_footer();
