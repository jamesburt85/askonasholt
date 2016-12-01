<?php


    function TOPluginInterface()
        {
            global $wpdb, $wp_locale;
            
            $options = get_option('tto_options');
              
            $taxonomy = isset($_REQUEST['taxonomy']) ? $_REQUEST['taxonomy'] : '';
            $post_type = isset($_REQUEST['post_type']) ? $_REQUEST['post_type'] : '';
            
            if(empty($post_type))
                {
                    $screen = get_current_screen();
                    
                    if(isset($screen->post_type)    && !empty($screen->post_type))
                        $post_type  =   $screen->post_type;
                        else
                        {
                            switch($screen->parent_file)
                                {
                                    case "upload.php" :
                                                                $post_type  =   'attachment';
                                                                break;
                                                        
                                    case "shopp-products"   :
                                                                $post_type  =   'shopp_product';
                                                                break;
                                                
                                    default:
                                                                $post_type  =   'post';   
                                }
                        }       
                }
                    
            $post_type_taxonomies = get_object_taxonomies($post_type);
        
            //use the first taxonomy if emtpy taxonomy
            if ($taxonomy == '' || !taxonomy_exists($taxonomy))
                {
                    reset($post_type_taxonomies);   
                    $taxonomy = current($post_type_taxonomies);
                }
                                
            $post_type_data = get_post_type_object($post_type);
            
            if (!taxonomy_exists($taxonomy))
                $taxonomy = '';
            
            //set as default for auto
            $order_type = (isset($options['taxonomy_settings'][$taxonomy]['order_type'])) ? $options['taxonomy_settings'][$taxonomy]['order_type'] : 'manual'; 
            
            
            $taxonomy_info = get_taxonomy($taxonomy);
            
            
            if (isset($_GET['switch_order_type']))
                {
                    $order_type =   $_GET['switch_order_type'];
                              
                    //save the new order
                    $options['taxonomy_settings'][$taxonomy]['order_type'] = $order_type;
                    update_option('tto_options', $options); 
                    
                    echo '<div class="message updated fade"><p>'. __('Order type for','atto') . ' ' .$taxonomy_info->label.' '. __('Switched to', 'atto'). ' ' . ucfirst($order_type)  .'</p></div>';  
                }
                        
            //check for order type update
            if (isset($_POST['order_type']))
                {
                    $new_order_type = $_POST['order_type'];
                    if ($new_order_type != 'auto' && $new_order_type != 'manual')
                        $new_order_type = '';
                        
                    if ($new_order_type != '')
                        {
                            
                            echo '<div class="message updated fade"><p>'. __('Order updated','atto') .'</p></div>';
                            $order_type = $new_order_type;
                            
                            //save the new order
                            $options['taxonomy_settings'][$taxonomy]['order_type'] = $order_type;

                            //update the orde_by
                            if (isset($_POST['auto_order_by']))
                                {
                                    $new_order_by = $_POST['auto_order_by'];
                                    if ($new_order_by != '')
                                        $options['taxonomy_settings'][$taxonomy]['auto']['order_by'] = $new_order_by;
                                } 
                            
                            //update the orde_by
                            if (isset($_POST['auto_order']))
                                {
                                    $new_order = $_POST['auto_order'];
                                    if ($new_order_by != '')
                                        $options['taxonomy_settings'][$taxonomy]['auto']['order'] = $new_order;
                                }    
                                
                            update_option('tto_options', $options);                        
                        }
                }
            
            if(isset($taxonomy_info->hierarchical) && $taxonomy_info->hierarchical === TRUE)    
                $is_hierarchical = TRUE;
                else
                $is_hierarchical = FALSE;

            
            $current_section_parent_file    =   '';
     
            switch($post_type)
                {
                    case "post" :
                                    $current_section_parent_file    =    "edit.php";
                                    break;
                    case "attachment" :
                                    $current_section_parent_file    =   "upload.php";
                                    break;
                }
    
            ?>    
            <div id="atto" class="wrap">
                <h2><?php _e('Taxonomy Order', 'atto') ?></h2>

                <div id="ajax-response"></div>
                
                <noscript>
                    <div class="error message">
                        <p><?php _e('This plugin can\'t work without javascript, because it\'s use drag and drop and AJAX.', 'atto') ?></p>
                    </div>
                </noscript>

                <div class="clear"></div>
                
                <?php do_action('ato_interface_before_form'); ?>
                
                <form action="<?php  echo $current_section_parent_file ?>" method="get" id="to_form">
                    <input type="hidden" name="page" value="to-interface-<?php echo $post_type ?>" />
                    <?php
                
                     if (!in_array($post_type, array('post', 'attachment')))
                        echo '<input type="hidden" name="post_type" value="'. $post_type .'" />';

                    
                                            
                    if (count($post_type_taxonomies) > 1)
                        {
                
                            ?>
                            
                            <h4><?php echo ucfirst($post_type_data->labels->name) ?> Taxonomies</h4>
                            <table cellspacing="0" class="wp-list-taxonomy widefat fixed">
                                <thead>
                                <tr>
                                    <th style="" class="column-cb check-column" id="cb" scope="col">&nbsp;</th><th style="" class="" id="author" scope="col"><?php _e('Taxonomy Title', 'atto') ?></th><th style="" class="manage-column" id="categories" scope="col"><?php _e('Total Terms', 'atto') ?></th>    </tr>
                                </thead>

                                <tfoot>
                                <tr>
                                    <th style="" class="column-cb check-column" id="cb" scope="col">&nbsp;</th><th style="" class="" id="author" scope="col"><?php _e('Taxonomy Title', 'atto') ?></th><th style="" class="manage-column" id="categories" scope="col"><?php _e('Total Terms', 'atto') ?></th>    </tr>
                                </tfoot>

                                <tbody id="the-list">
                                <?php
                                    
                                    $alternate = FALSE;
                                    foreach ($post_type_taxonomies as $key => $post_type_taxonomy)
                                        {
                                            $taxonomy_info = get_taxonomy($post_type_taxonomy);

                                            $alternate = $alternate === TRUE ? FALSE :TRUE;
                                            
                                            
                                            $args = array(
                                                            'hide_empty'    =>  0
                                                            );
                                            $taxonomy_terms = get_terms($post_type_taxonomy, $args);
                                                             
                                            ?>
                                                <tr valign="top" class="<?php if ($alternate === TRUE) {echo 'alternate ';} ?>" id="taxonomy-<?php echo $taxonomy  ?>">
                                                        <th class="check-column" scope="row"><input type="radio" onclick="to_change_taxonomy(this)" value="<?php echo $post_type_taxonomy ?>" <?php if ($post_type_taxonomy == $taxonomy) {echo 'checked="checked"';} ?> name="taxonomy">&nbsp;</th>
                                                        <td class="categories column-categories"><b><?php echo $taxonomy_info->label ?></b> (<?php echo  $taxonomy_info->labels->singular_name; ?>)</td>
                                                        <td class="categories column-categories"><?php echo count($taxonomy_terms) ?></td>
                                                </tr>
                                            
                                            <?php
                                        }
                                ?>
                                </tbody>
                            </table>
                            <br /><br /> 
                            <?php
                        }
                            ?>
                </form>
              
                <script type="text/javascript">    

                    var taxonomy    = '<?php echo $taxonomy ?>';

                </script>
               
               
                <?php

                    $url_query_vars =   array(
                                                "page"          =>  "to-interface-" .   $post_type,
                                                "taxonomy"      =>  $taxonomy 
                                                );

                    if (!in_array($post_type, array('post', 'attachment')))   
                        $url_query_vars['post_type']    =   $post_type;
                 
                ?>
                <form action="<?php  echo $current_section_parent_file ?>?<?php echo http_build_query($url_query_vars) ?>" method="post" id="to_form">
                    <input type="hidden" name="order_type" value="<?php echo $order_type ?>" />
                    <?php
                
                    if (!in_array($post_type, array('post', 'attachment')))
                        echo '<input type="hidden" name="post_type" value="'. $post_type .'" />';
                
                    $url_query_vars =   array(
                                                "page"          =>  "to-interface-" .   $post_type,
                                                "taxonomy"      =>  $taxonomy 
                                                );
                    
                    if (!in_array($post_type, array('post', 'attachment')))   
                        $url_query_vars['post_type']    =   $post_type;
                     
                    ?>
                
                <h2 class="nav-tab-wrapper" id="apto-nav-tab-wrapper">
                    <a href="<?php  echo $current_section_parent_file ?>?<?php echo http_build_query(array_merge($url_query_vars, array("switch_order_type" => "auto"))) ?>" class="nav-tab<?php if ($order_type == 'auto') {echo ' nav-tab-active';} ?>"><?php _e('Automatic Order', 'atto') ?></a>
                    <a href="<?php  echo $current_section_parent_file ?>?<?php echo http_build_query(array_merge($url_query_vars, array("switch_order_type" => "manual"))) ?>" class="nav-tab<?php if ($order_type == 'manual') {echo ' nav-tab-active';} ?>"><?php _e('Manual Order', 'atto') ?></a>
                </h2>
                <?php if ($order_type == 'auto')
                        {
                           ?>
                            <div class="atto_metabox">
                                                   
                                <table class="widefat">
                                    <tbody>
                                        <tr valign="top">
                                            <td class="label">
                                                <label for=""><?php _e('Order By', 'atto') ?></label>
                                            </td>
                                            <td>
                                                <?php
                                                
                                                    $auto_order_by = isset($options['taxonomy_settings'][$taxonomy]['auto']['order_by']) ? $options['taxonomy_settings'][$taxonomy]['auto']['order_by'] : 'name';

                                                ?>
                                                <input type="radio" <?php if ($auto_order_by == 'default') {echo 'checked="checked"'; } ?> value="default" id="order_by_default" name="auto_order_by" />
                                                <label for="order_by_default"><?php _e('Default', 'atto') ?></label><br>
                                                
                                                <input type="radio" <?php if ($auto_order_by == 'id') {echo 'checked="checked"'; } ?> value="id" id="order_by_id" name="auto_order_by" />
                                                <label for="order_by_id"><?php _e('Creation Time / ID', 'atto') ?></label><br>
                                                
                                                <input type="radio" <?php if ($auto_order_by == 'name') {echo 'checked="checked"'; } ?> value="name" id="order_by_name" name="auto_order_by" />
                                                <label for="order_by_name"><?php _e('Name', 'atto') ?></label><br>
                                                
                                                <input type="radio" <?php if ($auto_order_by == 'count') {echo 'checked="checked"'; } ?> value="count" id="order_by_count" name="auto_order_by" />
                                                <label for="order_by_count"><?php _e('Count', 'atto') ?></label><br>
                                                
                                                <input type="radio" <?php if ($auto_order_by == 'slug') {echo 'checked="checked"'; } ?> value="slug" id="order_by_slug" name="auto_order_by" />
                                                <label for="order_by_slug"><?php _e('Slug', 'atto') ?></label><br>
                                                
                                                <input type="radio" <?php if ($auto_order_by == 'random') {echo 'checked="checked"'; } ?> value="random" id="order_by_random" name="auto_order_by" />
                                                <label for="order_by_random"><?php _e('Random', 'atto') ?></label><br>
                                                 
                                            </td>
                                        </tr>
                               
                                        <tr valign="top">
                                            <td class="label">
                                                <label for=""><?php _e('Order', 'atto') ?></label>
                                            </td>
                                            <td>
                                                <?php
                                                
                                                    $auto_order = isset($options['taxonomy_settings'][$taxonomy]['auto']['order']) ? $options['taxonomy_settings'][$taxonomy]['auto']['order'] : 'desc';

                                                ?>
                                                
                                                <input type="radio" <?php if ($auto_order == 'desc') {echo 'checked="checked"'; } ?> value="desc" id="order_desc" name="auto_order" />
                                                <label for="order_desc"><?php _e('Descending', 'atto') ?></label><br>

                                                <input type="radio" <?php if ($auto_order == 'asc') {echo 'checked="checked"'; } ?> value="asc" id="order_asc" name="auto_order" />
                                                <label for="order_asc"><?php _e('Ascending', 'atto') ?></label><br>
                                                
                                            </td>
                                        </tr>
                                        
                                        <tr class="submit">
                                            <td class="label">&nbsp;</td>
                                    
                                            <td align="right">
                                                <input type="submit" value="<?php _e('Update', 'atto') ?>" class="button-primary" name="update">
                                            </td>    
                                        </tr>
                                        
                                    </tbody>
                                </table>
                    
                                
                            </div>
                            
                            <?php
                        }
                ?>
               
               
               
               
               <?php if ($order_type == 'manual')
                        {
                           ?>
                            <div id="order-terms">
                                
                                <div id="nav-menu-header">
                                    <div class="major-publishing-actions">

                                            
                                            <div class="alignright actions">
                                                <p class="actions">
                  
                                                    <span class="img_spacer">&nbsp;
                                                        <img alt="" src="<?php echo ATTO_URL ?>/images/wpspin_light.gif" class="waiting pto_ajax_loading" style="display: none;">
                                                    </span>
                                                    <a href="javascript:;" class="save-order button-primary"><?php _e('Update', 'atto') ?></a>
                                                </p>
                                            </div>
                                            
                                            <div class="clear"></div>

                                    </div><!-- END .major-publishing-actions -->
                                </div><!-- END #nav-menu-header -->

                                
                                <div id="post-body">                    
                                    
                                        <ul id="sortable">
                                            <?php 
                                                
                                                listTerms($taxonomy); 
                                            ?>
                                        </ul>
                                        
                                        <div class="clear"></div>
                                </div>
                                
                                <div id="nav-menu-footer">
                                    <div class="major-publishing-actions">
                                            <div class="alignright actions">
                                                <img alt="" src="<?php echo ATTO_URL ?>/images/wpspin_light.gif" class="waiting pto_ajax_loading" style="display: none;">
                                                <a href="javascript:;" class="save-order button-primary"><?php _e('Update', 'atto') ?></a>
                                            </div>
                                            
                                            <div class="clear"></div>

                                    </div><!-- END .major-publishing-actions -->
                                </div><!-- END #nav-menu-header -->
                                
                            </div>
                            
                            <?php
                        }
                ?> 

                </form>

                
                <script type="text/javascript">
    
                    jQuery(document).ready(function() {
                        
                        jQuery('ul#sortable').nestedSortable({
                                handle:             'div',
                                tabSize:            20,
                                listType:           'ul',
                                items:              'li',
                                toleranceElement:   '> div',
                                placeholder:        'ui-sortable-placeholder',
                                disableNesting:     'no-nesting'
                                <?php
                    
                                    if ($is_hierarchical === TRUE)
                                        {
                                        }
                                        else
                                        {
                                            ?>,disableNesting      :true<?php
                                        }
                                ?>});
                          
                        jQuery(".save-order").bind( "click", function() {
                            jQuery(this).parent().find('img').show();
                            
                            var serialized = jQuery('ul#sortable').nestedSortable('serialize');
                            
                            jQuery.post( ajaxurl, { 
                                                        action:         'update-taxonomy-order', 
                                                        order:          jQuery("#sortable").nestedSortable("serialize"),
                                                        taxonomy:       taxonomy
                            }, function() {
                                    jQuery("#ajax-response").html('<div class="message updated fade"><p><?php _e( "Items Order Updated", 'atto' ) ?></p></div>');
                                    jQuery("#ajax-response div").delay(3000).hide("slow");
                                    jQuery('img.pto_ajax_loading').hide();
                                });
                        });
                    });
                </script>
                
            </div>
            <?php 
            
            
        }
    
    
    function listTerms($taxonomy) 
            {

                // Query pages.
                $args = array(
                            'orderby'       =>  'term_order',
                            'depth'         =>  0,
                            'child_of'      => 0,
                            'hide_empty'    =>  0
                );
                $taxonomy_terms = get_terms($taxonomy, $args);

                $output = '';
                if (count($taxonomy_terms) > 0)
                    {
                        $output = TOwalkTree($taxonomy_terms, $args['depth'], $args);    
                    }

                echo $output; 
                
            }
        
        function TOwalkTree($taxonomy_terms, $depth, $r) 
            {
                $walker = new TO_Terms_Walker; 
                $args = array($taxonomy_terms, $depth, $r);
                return call_user_func_array(array(&$walker, 'walk'), $args);
            }

?>