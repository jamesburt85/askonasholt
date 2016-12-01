<?php


    function to_plugin_options()
        {
            $options = get_option('tto_options');
            
            if (isset($_POST['atto_form_submit']) &&  wp_verify_nonce($_POST['atto_form_nonce'],'atto_form_submit') )
                {
                        
                    $options['capability'] = $_POST['capability']; 
                    
                    $options['autosort']    = isset($_POST['autosort'])     ? $_POST['autosort']    : '';
                    $options['adminsort']   = isset($_POST['adminsort'])    ? $_POST['adminsort']   : '';
                        
                    echo '<div class="updated fade"><p>' . __('Settings Saved', 'atto') . '</p></div>';

                    update_option('tto_options', $options);   
                }
                
                
            //build an array containing the user role and capability
            $user_roles = array();
            $user_roles['Subscriber']       = apply_filters('atto_user_role_capability', 'read', 'Subscriber');
            $user_roles['Contributor']      = apply_filters('atto_user_role_capability', 'edit_posts', 'Contributor');
            $user_roles['Author']           = apply_filters('atto_user_role_capability', 'publish_posts', 'Author');
            $user_roles['Editor']           = apply_filters('atto_user_role_capability', 'publish_pages', 'Editor');
            $user_roles['Administrator']    = apply_filters('atto_user_role_capability', 'install_plugins', 'Administrator');
            
            //allow to add custom roles
            $user_roles = apply_filters('atto_user_roles_and_capabilities', $user_roles);
                            
            ?>
                <div class="wrap"> 
                    <div id="icon-settings" class="icon32"></div>
                    <h2><?php _e('General Settings', 'atto') ?></h2>
                   
                    <form id="form_data" name="form" method="post">   
                        <br />
                        <table class="form-table">
                            <tbody>
                    
                                <tr valign="top">
                                    <th scope="row" style="text-align: right;"><label><?php _e( "Minimum Level to use this plugin", 'atto' ) ?></label></th>
                                    <td>
                                        <select id="role" name="capability">
                                            <?php

                                                foreach ($user_roles as $user_role => $user_capability)
                                                    {
                                                        ?><option value="<?php echo $user_capability ?>" <?php if (isset($options['capability']) && $options['capability'] == $user_capability) echo 'selected="selected"'?>><?php _e($user_role, 'atto') ?></option><?php   
                                                    }



                                            ?>
                                        </select>
                                    </td>
                                </tr>
                                
                                
                                <tr valign="top">
                                    <th scope="row" style="text-align: right;"><label><?php _e('Auto Sort', 'atto') ?></label></th>
                                    <td>
                                        <label for="autosort">
                                            <select id="autosort" name="autosort">
                                                <option value="0" <?php if ($options['autosort'] == "0") echo 'selected="selected"'?>><?php _e('OFF', 'atto') ?></option>
                                                <option value="1" <?php if ($options['autosort'] == "1") echo 'selected="selected"'?>><?php _e('ON', 'atto') ?></option>
                                            </select> <?php _e('If checked, the plug-in automatically update the WordPress queries to use the new sort (<b>No code update is necessarily</b>)', 'atto') ?>. <?php _e('Additional details about this setting can be found at', 'atto') ?> <a href="http://www.nsp-code.com/how-to-use-the-autosort-setting-for-advanced-taxonomy-terms-order/" target="_blank">Autosort Details</a>
                                        </label>
                                    </td>
                                </tr>
                                
                                <tr valign="top">
                                    <th scope="row" style="text-align: right;"><label><?php _e('Admin Sort', 'atto') ?></label></th>
                                    <td>
                                        <label for="adminsort">
                                            <select id="adminsort" name="adminsort">
                                                <option value="0" <?php if ($options['adminsort'] == "0") echo 'selected="selected"'?>><?php _e('OFF', 'atto') ?></option>
                                                <option value="1" <?php if ($options['adminsort'] == "1") echo 'selected="selected"'?>><?php _e('ON', 'atto') ?></option>
                                            </select>
                                            <?php _e("Update order of terms within the admin interface per customised sort", 'atto') ?>.
                                        </label>
                                    </td>
                                </tr>
                                
                            </tbody>
                        </table>
                        
                           
                        <p class="submit">
                            <input type="submit" name="Submit" class="button-primary" value="<?php _e('Save Settings', 'atto') ?>">
                        </p>
                    
                        
                        <?php wp_nonce_field('atto_form_submit','atto_form_nonce'); ?>
                        <input type="hidden" name="atto_form_submit" value="true" />
                        
                    </form>
                    
                </div>
                
            <?php          
            
        }

?>