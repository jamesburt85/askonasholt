<?php
/*
Template Name: Contact
*/
get_header(); ?>

<?php get_template_part( 'template-parts/center-text-hero'); ?>

<div id="page-full-width" role="main">

<?php do_action( 'foundationpress_before_content' ); ?>
<?php while ( have_posts() ) : the_post(); ?>
  <article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">
      <?php do_action( 'foundationpress_page_before_entry_content' ); ?>
     
      <div class="entry-content">
          <?php the_content(); ?>

          <div class="row">
            <h4 class="section-header small-12 columns">Contact Details</h4>
          </div>

          <!-- Contact Page -->
          <div class="row contact-page-wrapper">
            
            <div class="small-12 medium-3 columns contact-details">
              
              <div class="contact-details">

                <?php if ( have_rows('telephone_number') ); { ?>

                  <div class="contact-details-section">
                    <span class="bold">Telephone<br/></span>
                    <?php while ( have_rows('telephone_number') ) { the_row();

                      $number = get_sub_field('number');

                      ?>

                      <p><?php echo $number; ?></p>

                    <?php } ?>
                  </div>
                <?php } ?>


                <?php if ( have_rows('fax_details') ); { ?>
                  <div class="contact-details-section">    
                    <span class="bold">Fax<br/></span>
                    <?php while ( have_rows('fax_details') ) { the_row();

                      $fax_number = get_sub_field('fax_number');

                      ?>

                      
                      <p><?php echo $fax_number; ?></p>

                    <?php } ?>
                  </div>
                <?php } ?>

                <?php if ( have_rows('e-mail_details') ); { ?>
                  <div class="contact-details-section">  
                    <span class="bold">E-mail<br/></span>
                    <?php while ( have_rows('e-mail_details') ) { the_row();

                      $e_mail = get_sub_field('e-mail_address');

                      ?>

                      
                      <p><?php echo $e_mail; ?></p>

                    <?php } ?>
                  </div>
                <?php } ?>

                <?php
                  // get VARS
                  $address = get_field('address');

                ?>
                <div class="contact-details-section">
                  <span class="bold">Address<br/></span>
                  <span><?php echo $address; ?></span>
                </div>

              </div> <!-- Contact Details End -->
              
            </div>

            <div class="small-12  medium-9 columns">
              <div id="map">
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2482.7350865574026!2d-0.11687768422964813!3d51.51807597963692!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761b4a5386ade9%3A0xea4c330ceba327a2!2sAskonas+Holt!5e0!3m2!1sen!2suk!4v1479744564941" width="100%" height="500" frameborder="0" style="border:0" allowfullscreen></iframe>
              </div>
            </div>

        </div> <!-- Row END -->

        <div class="row">
          <div class="small-12 columns">
            <p>To get in touch with one of our staff directly please go to the <a href="<?php echo site_url(); ?>/people">People</a> page</p>
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
