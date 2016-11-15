<?php
/**
 * Template part for splash page hero
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>

<?php if( get_field('video_or_promo') == 'promo' ); { 
  
  //vars
  $image = get_field('background_image'); 
  $sub_header = get_field('sub_header'); 
  $header = get_field('header'); 
  $blurb = get_field('blurb'); 
?>

  <div class="splash-page-hero" style="background-image: url('<?php echo $image['url']; ?>')">
      
      <a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
        <img src="<?php echo get_template_directory_uri(); ?>/assets/images/askonasholt-logo.png">
      </a>

    <div class="hero-text-container hero-text">

      <span class="hero-sub-header"><?php echo $sub_header; ?></span><br/>
      <span class="hero-header"><?php echo $header; ?></span><br/>
      <span class="hero-blurb"><?php echo $blurb; ?></span>

        <?php
        // loop through the rows of data
          while ( have_rows('buttons') ) : the_row();

        $button_text = get_sub_field('button_text');
        $button_destination = get_sub_field('button_destination');

        ?>

        <button class="hero-button">
          <a href="<?php echo $button_destination; ?>">
            <?php echo $button_text; ?>
          </a>
        </button>

    </div>

      <?php endwhile; ?>

  </div>

<?php }; ?>
