<!-- //Nav tiles at bottom of pages -->


<div class="more-page-links row">
    <h3 class="section-header">Find out more</h3>
    <?php
     
    /* if the current pages has a parent, i.e. we are on a subpage */
    if($post->post_parent){
      //$children = wp_list_pages("title_li=&include=".$post->post_parent."&echo=0"); // list the parent page
      $children .= wp_list_pages("title_li=&child_of=".$post->post_parent."&echo=0"); // append the list of children pages to the same $children variable
    } 
     
    /* else if the current page does not have a parent, i.e. this is a top level page */
    else { 
      $children = wp_list_pages("title_li=&child_of=".$post->ID."&echo=0"); // form a list of the children of the current page
    }
     
    /* if we ended up with any pages from the queries above */
    if ($children) { ?>
      <ul class="submenu page-nav-buttons">
        <?php echo $children; /*print list of pages*/ ?>
      </ul>
    <?php } ?>

</div>