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

    <div class="header-row">
      <h3 class="section-header">
        Latest News &amp; Features &nbsp;
      </h3>
      <a class="view-link" href="<?php echo get_site_url(); ?>/magazine">View all &nbsp;
        <svg class="red-arrow" width="19px" height="19px" viewBox="469 852 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <g id="Group-6" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(470.000000, 853.000000)">
                <path d="M2.33453917,14.1812268 L13.6654423,2.88473916" id="Path-2" stroke="#BA0C2F" transform="translate(7.999991, 8.532983) rotate(45.000000) translate(-7.999991, -8.532983) "></path>
                <polyline id="Path-3" stroke="#BA0C2F" transform="translate(10.324505, 8.521204) rotate(45.000000) translate(-10.324505, -8.521204) " points="14.5739552 12.7712037 14.5739552 4.27120371 6.07505388 4.27120371"></polyline>
            </g>
        </svg>
      </a>
      
    </div>
    
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
</div>
   
      <!-- using ACF Flexible content instead of the_content  -->
      <?php $acf_fields = get_fields(); ?>
      <?php include(locate_template('template-parts/acf.php')); ?>

<div id="page-full-width" role="main">

    <h3 class="section-header">
      Latest Events &nbsp;
      <a href="<?php echo get_site_url(); ?>/tours-and-projects/upcoming">View all &nbsp;
        <svg class="red-arrow" width="19px" height="19px" viewBox="469 852 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <g id="Group-6" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(470.000000, 853.000000)">
                <path d="M2.33453917,14.1812268 L13.6654423,2.88473916" id="Path-2" stroke="#BA0C2F" transform="translate(7.999991, 8.532983) rotate(45.000000) translate(-7.999991, -8.532983) "></path>
                <polyline id="Path-3" stroke="#BA0C2F" transform="translate(10.324505, 8.521204) rotate(45.000000) translate(-10.324505, -8.521204) " points="14.5739552 12.7712037 14.5739552 4.27120371 6.07505388 4.27120371"></polyline>
            </g>
        </svg>
      </a>
    </h3>
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

    <h3 class="section-header">
      Latest Video &amp; Audio &nbsp;
      <a href="<?php echo get_site_url(); ?>/magazine">View all &nbsp;
      <svg class="red-arrow" width="19px" height="19px" viewBox="469 852 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <g id="Group-6" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(470.000000, 853.000000)">
                <path d="M2.33453917,14.1812268 L13.6654423,2.88473916" id="Path-2" stroke="#BA0C2F" transform="translate(7.999991, 8.532983) rotate(45.000000) translate(-7.999991, -8.532983) "></path>
                <polyline id="Path-3" stroke="#BA0C2F" transform="translate(10.324505, 8.521204) rotate(45.000000) translate(-10.324505, -8.521204) " points="14.5739552 12.7712037 14.5739552 4.27120371 6.07505388 4.27120371"></polyline>
            </g>
        </svg>
      </a>
    </h3>
    
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
