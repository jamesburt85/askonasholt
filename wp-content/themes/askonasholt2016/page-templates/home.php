<?php
/*
Template Name: Home
*/
get_header(); ?>

<?php //get_template_part( 'template-parts/featured-image' ); ?>
<?php get_template_part( 'template-parts/home-hero' ); ?>

<div id="page-full-width" role="main">

<?php do_action( 'foundationpress_before_content' ); ?>
<?php while ( have_posts() ) : the_post(); ?>
  <article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">
<!--       <header>
          <h1 class="entry-title"><?php the_title(); ?></h1>
      </header> -->
      <?php do_action( 'foundationpress_page_before_entry_content' ); ?>
      
      <div class="entry-content">
          <?php the_content(); ?>
      </div>

    <h2>
      Latest News &amp; Features 
      <a href="<?php echo get_site_url(); ?>/magazine">View all</a>
    </h2>

    <div class="row">
    
    <!-- Get news items -->
      <?php 

        // Query Args
          $args = array(

            'post_type'   => 'magazine',
            'posts_per_page' => 4,
            'tax_query' => array(
                array(
                  'taxonomy' => 'magazine-content-type',
                  'field'    => 'slug',
                  'terms'    => 'news',
                ),
              ),
          );

          // The Query
          $the_query = new WP_Query( $args );

        // The Loop
        if ( $the_query->have_posts() ) {

          while ( $the_query->have_posts() ) {
            $the_query->the_post();

            get_template_part( 'template-parts/magazine-blocks' );

          }

          /* Restore original Post Data */
          wp_reset_postdata();
        } else {
          // no posts found
        }
      ?>
    </div>

   
      <!-- using ACF Flexible content instead of the_content  -->
      <?php $acf_fields = get_fields(); ?>
      <?php include(locate_template('template-parts/acf.php')); ?>


    <h2>
      Latest Events
      <a href="<?php echo get_site_url(); ?>/tours-and-projects/upcoming">View all</a>
    </h2>
      <!-- Get Events -->
        <?php 

          // Query Args
            $args = array(

              'post_type'   => 'events',
              'posts_per_page' => 4,
            );

            // The Query
            $the_query = new WP_Query( $args );

          // The Loop
          if ( $the_query->have_posts() ) {
            echo '<ul>';
            while ( $the_query->have_posts() ) {
              $the_query->the_post();
              echo '<li>' . get_the_title() . '</li>';

              //get_template_part( 'template-parts/.....' );
            }
            echo '</ul>';
            /* Restore original Post Data */
            wp_reset_postdata();
          } else {
            // no posts found
          }
        ?>

    <h2>
      Latest Video &amp; Audio
      <a href="<?php echo get_site_url(); ?>/magazine">View all</a>
    </h2>
    
    <!-- Video items -->
    <div class="row">
     <?php 

         // Query Args
           $args = array(

             'post_type'   => 'magazine',
             'posts_per_page' => 4,
             'tax_query' => array(
                 array(
                   'taxonomy' => 'magazine-content-type',
                   'field'    => 'slug',
                   'terms'    => 'video',
                 ),
               ),
           );

           // The Query
           $the_query = new WP_Query( $args );

         // The Loop
         if ( $the_query->have_posts() ) {

           while ( $the_query->have_posts() ) {
             $the_query->the_post();

             get_template_part( 'template-parts/magazine-blocks' );

           }

           /* Restore original Post Data */
           wp_reset_postdata();
         } else {
           // no posts found
         }
       ?>
      </div>

       <!-- Audio items -->
       <div class="row">
         <?php 

             // Query Args
               $args = array(

                 'post_type'   => 'post',
                 //'format' => 'audio',
                 'post_format' => 'post-format-audio',
                 'posts_per_page' => 4,
                 //'tax_query' => array(
                     //array(
                       //'taxonomy' => 'magazine-content-type',
                       //'field'    => 'slug',
                       //'terms'    => 'audio',
                     //),
                   //),
               );

               // The Query
               $the_query = new WP_Query( $args );

             // The Loop
             if ( $the_query->have_posts() ) {

               while ( $the_query->have_posts() ) {
                 $the_query->the_post();

                 get_template_part( 'template-parts/magazine-blocks' );

               }

               /* Restore original Post Data */
               wp_reset_postdata();
             } else {
               // no posts found
             }
           ?>
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

<?php get_footer();
