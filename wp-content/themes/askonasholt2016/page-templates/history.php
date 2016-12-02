<?php
/*
Template Name: History
*/
get_header(); ?>

<?php //get_template_part( 'template-parts/featured-image' ); ?>
<?php get_template_part( 'template-parts/center-text-hero' ); ?>

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
         
         <?php

         if ( have_rows('timeline_item') ); { ?>

          <section id="cd-timeline" class="cd-container">

            <?php while ( have_rows('timeline_item') ) { the_row();

              $image = get_sub_field('section_image');
              $section_title = get_sub_field('section_title');
              $section_copy = get_sub_field('section_copy');
              $date = get_sub_field('date');

            ?>

              <div class="cd-timeline-block">
                
                <div class="cd-timeline-img cd-picture">
                   <!-- <img src="/assets/images/cd-icon-picture.svg" alt="Picture"> -->
                </div> <!-- cd-timeline-img -->

                <div class="cd-timeline-content">
                  
                  <h2><?php echo $section_title; ?></h2>
                    <div class="medium-6 columns"><p><?php echo $section_copy; ?></p></div>
                    <div class="medium-6 columns"><img src="<?php echo $image; ?>"></div>
                    <!--  <a href="#0" class="cd-read-more">Read more</a> -->
                  <span class="cd-date"><?php echo $date; ?></span>
                  
                </div> <!-- cd-timeline-content -->

              </div> <!-- cd-timeline-block -->
              
            <?php } ?>

          </section>

         <?php } ?>


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
