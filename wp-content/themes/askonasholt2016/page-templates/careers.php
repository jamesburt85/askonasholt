<?php
/*
Template Name: Careers
*/
get_header(); ?>

<?php get_template_part( 'template-parts/center-text-hero' ); ?>

<div id="narrow-text-page" role="main">

<?php do_action( 'foundationpress_before_content' ); ?>
<?php while ( have_posts() ) : the_post(); ?>
  <article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">
<!--       <header>
          <h1 class="entry-title"><?php the_title(); ?></h1>
      </header> -->
      <?php do_action( 'foundationpress_page_before_entry_content' ); ?>
      <div class="entry-content">
        <div class="row">
          <div class="small-12 columns">
            <?php the_content(); ?>

            
            <?php if ( have_rows('vacancy_accordion') ); { ?>
            
              <h4 class="section-header">Vacancies</h4>
              <div class="press-row vacancies" id="bottom">
                <ul class="accordion" data-accordion data-allow-all-closed="true">
            <?php while ( have_rows('vacancy_accordion') ) { the_row();

              $vacancy_title = get_sub_field('vacancy_title');
              $vacancy_details = get_sub_field('vacancy_details'); ?>
              
                  <li class="accordion-item" data-accordion-item>
                    
                    <a href="#" class="accordion-title"><?php //the_title(); ?> 

                      <?php echo $vacancy_title; ?>
                        
                        <span class="more-info">More info &nbsp;
                            <svg width="19px" height="19px" viewBox="1365 1803 19 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                <defs></defs>
                                <polyline id="Path-3-Copy-2" stroke="#BA0C2F" stroke-width="1" fill="none" transform="translate(1374.485830, 1812.485830) rotate(135.000000) translate(-1374.485830, -1812.485830) " points="1380.48583 1818.48661 1380.48583 1806.48505 1368.48583 1806.48505"></polyline>
                            </svg>
                        </span>

                    </a>

                    <div class="accordion-content" data-tab-content>
                      <p><?php echo $vacancy_details; ?></p>
                    </div>

                  </li>

              <?php } ?>
                </ul>
              </div>

            <?php } ?>

          </div>
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

<?php get_template_part( 'template-parts/page-nav-tiles' ); ?>

<?php get_template_part( 'template-parts/link-banner' ); ?>

<?php get_footer();
