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


      <ul>
      <?php
      // we add this, to show all posts in our
      // Glossary sorted alphabetically
      if (is_category('news')) 
      {
      $args = array( 'posts_per_page' => -1, 'orderby'=> 'title', 'order' => 'ASC' );
      $glossaryposts = get_posts( $args ); 
      }
      foreach( $glossaryposts as $post ) :  setup_postdata($post); 
       ?>
      <li><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></li>
      <?php endforeach; ?>
      </ul>

    <div class="row">
      <div class="small-6 columns header-row">
        <h3 class="section-header">
          Latest News &amp; Features &nbsp;
          <br class="hide-for-medium" />
        </h3>
      </div>
      <div class="small-6 columns view-all">
        <a class="view-link" href="<?php echo get_site_url(); ?>/the-green-room">View all &nbsp;
          <svg class="red-arrow" width="19px" height="19px" viewBox="469 852 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <g id="Group-6" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(470.000000, 853.000000)">
                  <path d="M2.33453917,14.1812268 L13.6654423,2.88473916" id="Path-2" stroke="#BA0C2F" transform="translate(7.999991, 8.532983) rotate(45.000000) translate(-7.999991, -8.532983) "></path>
                  <polyline id="Path-3" stroke="#BA0C2F" transform="translate(10.324505, 8.521204) rotate(45.000000) translate(-10.324505, -8.521204) " points="14.5739552 12.7712037 14.5739552 4.27120371 6.07505388 4.27120371"></polyline>
              </g>
          </svg>
        </a>
      </div>
    </div>
    
    <div class="row" data-equalizer data-equalize-on="medium" id="test-eq">
    
    <!-- Get news items -->
      <?php 

        // Query Args
          $args = array(

            'post_type'   => 'post',
            'category_slug' => array( 'news', 'interviews', 'features' ),
            'cat' => '-'.get_cat_ID('audio').',-'.get_cat_ID('video'),
            'posts_per_page' => 4,
            'tax_query' => array(
                //array(
                  //'taxonomy' => 'magazine-content-type',
                  //'field'    => 'slug',
                  //'terms'    => 'news',
                //),
              ),
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
   
      <!-- using ACF Flexible content instead of the_content  -->
      <?php $acf_fields = get_fields(); ?>
      <?php include(locate_template('template-parts/acf.php')); ?>

<!-- <div id="page-full-width" 
role="main"> -->
<div class="row">
  <div class="small-6 columns header-row">
    <h3 class="section-header">
      Latest Events &nbsp;      
    </h3>
  </div>
  <div class="small-6 columns view-all">
    <a class="view-link" href="<?php echo get_site_url(); ?>/events/">View all &nbsp;
      <svg class="red-arrow" width="19px" height="19px" viewBox="469 852 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <g id="Group-6" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(470.000000, 853.000000)">
              <path d="M2.33453917,14.1812268 L13.6654423,2.88473916" id="Path-2" stroke="#BA0C2F" transform="translate(7.999991, 8.532983) rotate(45.000000) translate(-7.999991, -8.532983) "></path>
              <polyline id="Path-3" stroke="#BA0C2F" transform="translate(10.324505, 8.521204) rotate(45.000000) translate(-10.324505, -8.521204) " points="14.5739552 12.7712037 14.5739552 4.27120371 6.07505388 4.27120371"></polyline>
          </g>
      </svg>
    </a>
  </div>
<!-- Get Events -->
<?php 

    $event_args = events_set_default_args( 'home' );
    get_template_part( 'template-parts/content-events-home');  

?>
</div>  

<div class="video-audio-area" id="video-audio">
    
    <div class="row">
      <div class="small-6 columns header-row">
        <h4 class="section-header">
          Latest Video &amp; Audio &nbsp;
          <br class="hide-for-medium" />
        </h4> 
      </div>
      <div class="small-6 columns view-all">
       <a class="view-link" href="<?php echo get_site_url(); ?>/the-green-room">View all &nbsp;
        <svg class="red-arrow" width="19px" height="19px" viewBox="469 852 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <g id="Group-6" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(470.000000, 853.000000)">
                  <path d="M2.33453917,14.1812268 L13.6654423,2.88473916" id="Path-2" stroke="#BA0C2F" transform="translate(7.999991, 8.532983) rotate(45.000000) translate(-7.999991, -8.532983) "></path>
                  <polyline id="Path-3" stroke="#BA0C2F" transform="translate(10.324505, 8.521204) rotate(45.000000) translate(-10.324505, -8.521204) " points="14.5739552 12.7712037 14.5739552 4.27120371 6.07505388 4.27120371"></polyline>
              </g>
          </svg>
        </a>
      </div>
    </div>   

    <div class="row" data-equalizer data-equalize-on="medium" id="test-eq">
        <?php 

        /*
        *  Query posts for a relationship value.
        *  This method uses the meta_query LIKE to match the string "123" to the database value a:1:{i:0;s:3:"123";} (serialized array)
        */
        $videos = get_posts(array(
          'post_type' => 'post',
          'category_slug' => 'video',
          'posts_per_page' => 4,
          'category'         => 'video',
          'category_name'    => 'video',
          'meta_key' => 'editors_pick',
          'meta_value' => 'yes',          

          // 'meta_query' => array(
          //   array(
          //     'key' => 'artist', // name of custom field
          //     'value' => '"' . get_the_ID() . '"', // matches exaclty "123", not just 123. This prevents a match for "1234"
          //     'compare' => 'LIKE'
          //   )
          // )
        ));

        ?>

        <?php if( $videos ): ?>
          <!-- <ul> -->
          <?php
            foreach( $videos as $post ):
              setup_postdata( $post );

              //get_template_part( 'template-parts/content-post' );

            ?>

              <div class="small-12 medium-6 large-3 columns artist-video-area animated waypoint is-hidden-onload">
                <a href="<?php the_permalink(); ?>"> 
                  <?php get_template_part( 'template-parts/video-player' ); ?>
                </a>
              </div>

            <?php

            endforeach;

            wp_reset_postdata();

            ?>
          <!--  </ul> -->
        <?php endif; ?>

    </div>

  </div>





<!--       <footer>
          <?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
          <p><?php the_tags(); ?></p>
      </footer> -->
      <?php do_action( 'foundationpress_page_before_comments' ); ?>
      <?php comments_template(); ?>
      <?php do_action( 'foundationpress_page_after_comments' ); ?>
  </article>
<?php endwhile;?>

<?php do_action( 'foundationpress_after_content' ); ?>

<!-- </div> -->

<?php get_template_part( 'template-parts/link-banner' ) ?>

<?php get_footer();
