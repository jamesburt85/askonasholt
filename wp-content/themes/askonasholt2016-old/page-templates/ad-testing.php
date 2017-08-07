<?php
/*
Template Name: AD TESTING
*/
get_header(); ?>

<?php get_template_part( 'template-parts/featured-image' ); ?>

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

     	<div class="row temp-testing-mp3">
     	  <h1>testing mp3</h1>

     	  <audio controls>
     	    <source src="<?php echo get_template_directory_uri(); ?>/assets/mp3/test.mp3" type="audio/mp3">
     	    <!-- <source src="/path/to/audio.ogg" type="audio/ogg"> -->
     	  </audio>

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




