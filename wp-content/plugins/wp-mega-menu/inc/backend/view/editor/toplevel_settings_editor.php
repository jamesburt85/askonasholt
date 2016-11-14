
<?php 
if(isset($_GET['action']) && $_GET['action'] == 'edit_theme'){
if(isset($_GET['theme_id'])){
	
   	  if(isset($theme_settings['top_menu'])){
		
		$toplevel_enable_background_hover     		  = (isset($theme_settings['top_menu']['enable_background_hover'])?$theme_settings['top_menu']['enable_background_hover']:'');
		$toplevel_background_hover_from       		  = (isset($theme_settings['top_menu']['background_hover_from'])?$theme_settings['top_menu']['background_hover_from']:'');
		$toplevel_background_hover_to         		  = (isset($theme_settings['top_menu']['background_hover_to'])?$theme_settings['top_menu']['background_hover_to']:'');
		$toplevel_font_color                 	      = (isset($theme_settings['top_menu']['font_color'])?$theme_settings['top_menu']['font_color']:'');
		$toplevel_font_color_active          		  = (isset($theme_settings['top_menu']['font_color_active'])?$theme_settings['top_menu']['font_color_active']:'');
		$toplevel_font_size                  		  = (isset($theme_settings['top_menu']['font_size'])?$theme_settings['top_menu']['font_size']:'');
		
		$toplevel_font_weight_hover           		  = (isset($theme_settings['top_menu']['font_weight_hover'])?$theme_settings['top_menu']['font_weight_hover']:'');
		$toplevel_transform                   		  = (isset($theme_settings['top_menu']['transform'])?$theme_settings['top_menu']['transform']:'');
		$toplevel_font_family                 	      = (isset($theme_settings['top_menu']['font_family'])?$theme_settings['top_menu']['font_family']:'');
		$toplevel_font_decoration             		  = (isset($theme_settings['top_menu']['font_decoration'])?$theme_settings['top_menu']['font_decoration']:'');
		$toplevel_font_decoration_hover      		  = (isset($theme_settings['top_menu']['font_decoration_hover'])?$theme_settings['top_menu']['font_decoration_hover']:'');
		
		$toplevel_enable_menu_divider                 = (isset($theme_settings['top_menu']['enable_menu_divider'])?$theme_settings['top_menu']['enable_menu_divider']:'');
		$toplevel_menu_divider_color          		  = (isset($theme_settings['top_menu']['menu_divider_color'])?$theme_settings['top_menu']['menu_divider_color']:'');
		$toplevel_opacity_glow                		  = (isset($theme_settings['top_menu']['opacity_glow'])?$theme_settings['top_menu']['opacity_glow']:'');
	
	}

}
}
?>
 <!----------------Top Level Menu Items settings  -------------------------->
		        <div class="apmm-slideToggle" id="toplevelitems_settings"  style="cursor:pointer;">
		          <div class="title_toggle"><?php _e('Top Level Menu Items Settings',APMM_TD);?></div>
		        </div>
		        <div class="apmm-Togglebox apmm-slideTogglebox_toplevelitems_settings" style="display: none;">

					<table cellspacing="0" class="widefat apmm_create_seciton">
						<tbody>


							 <tr>
								<td>
									<label><?php _e('Background [Hover]',APMM_TD);?></label>
									<p class="description left_note"><?php _e('Select from background color on hover.',APMM_TD);?></p>
								</td> 
								<td>
								  <label for="top_menu_bg_hover" class="label_field">
								    <div class="wpmm-switch">
									  <input type="checkbox" value="1" <?php echo (isset($toplevel_enable_background_hover) && $toplevel_enable_background_hover == 1)?'checked':'';?> id="top_menu_bg_hover" 
									  class="apmm_enable_menu_background" 
									  name="apmm_theme[top_menu][enable_background_hover]">
									   <label for="top_menu_bg_hover"></label>
                                     </div>
									  <span><?php _e('Enable',APMM_TD);?></span>
								     </label><br/><br/>
									  <label class="ap-mega_multiple_field">
										<span><?php _e('Bg Color',APMM_TD);?></span>
										<input type="text" value="<?php echo (!isset($toplevel_background_hover_from))?'':esc_attr($toplevel_background_hover_from);?>" data-alpha="true" name="apmm_theme[top_menu][background_hover_from]" class="apmm-color-picker" >
										</label>

								</td>
							</tr>

							<tr>
								<td>
									<label><?php _e('Fonts',APMM_TD);?></label>
									<p class="description left_note">
									<?php _e('Note:Bg Color [Active]:Bg Color of items that are active (hover/click depending on trigger),
									<br/>Font Color [Current]:Color of items current to the viewed page.',APMM_TD);?>
									</p>
								</td>
								<td>
								
								<label class="ap-mega_container-padding">
								<span><?php _e('Background Active Color',APMM_TD);?></span>
								<input type="text" name="apmm_theme[top_menu][bg_active_color]" 
								class="apmega-menu_bar_padding apmm-color-picker" value="<?php echo (!isset($toplevel_font_color))?'':esc_attr($toplevel_font_color);?>">
								</label>
								<label class="ap-mega_container-padding">
								<span><?php _e('Color [Active]',APMM_TD);?></span>
								
								<input type="text" name="apmm_theme[top_menu][font_color_active]" 
								class="apmega-menu_bar_padding apmm-color-picker" value="<?php echo (!isset($toplevel_font_color_active))?'':esc_attr($toplevel_font_color_active);?>">
								
								</label>
								
                                <label data-validation="px" class="ap-mega_container-padding">
								<span><?php _e('Size',APMM_TD);?></span>
								<input type="text" value="<?php echo (!isset($toplevel_font_size))?'0px':esc_attr($toplevel_font_size);?>" name="apmm_theme[top_menu][font_size]" 
								class="apmega-menu_bar_padding">
								</label>
								
							
								<label class="ap-mega_container-padding">
								<span><?php _e('Weight On Hover',APMM_TD);?></span>
								   <select name="apmm_theme[top_menu][font_weight_hover]" 
									class="apmm_fontweight_hover">
									   <option value="theme_default" <?php if(isset($toplevel_font_weight_hover) && $toplevel_font_weight_hover == "theme_default") echo "selected='selected'";?>><?php _e('Theme Default',APMM_TD);?></option>
									   <option value="normal" <?php if(isset($toplevel_font_weight_hover) && $toplevel_font_weight_hover == "normal") echo "selected='selected'";?>><?php _e('Normal(400)',APMM_TD);?></option>
									   <option value="bold" <?php if(isset($toplevel_font_weight_hover) && $toplevel_font_weight_hover == "bold") echo "selected='selected'";?>><?php _e('Bold(700)',APMM_TD);?></option>
									   <option value="light" <?php if(isset($toplevel_font_weight_hover) && $toplevel_font_weight_hover == "light") echo "selected='selected'";?>><?php _e('Light(300)',APMM_TD);?></option>
									</select>
								</label>

								<label class="ap-mega_container-padding">
								<span><?php _e('Transform',APMM_TD);?></span>
									<select name="apmm_theme[top_menu][transform]" 
										class="apmm_transform">
										   <option value="normal" <?php if(isset($toplevel_transform) && $toplevel_transform == "normal") echo "selected='selected'";?>><?php _e('Normal',APMM_TD);?></option>
										   <option value="capitalize" <?php if(isset($toplevel_transform) && $toplevel_transform == "capitalize") echo "selected='selected'";?>><?php _e('Capitalize',APMM_TD);?></option>
										   <option value="uppercase" <?php if(isset($toplevel_transform) && $toplevel_transform == "uppercase") echo "selected='selected'";?>><?php _e('Uppercase',APMM_TD);?></option>
										   <option value="lowercase" <?php if(isset($toplevel_transform) && $toplevel_transform == "lowercase") echo "selected='selected'";?>><?php _e('Lowercase',APMM_TD);?></option>
										</select>
								</label>

								<label class="ap-mega_container-padding">
								<span><?php _e('Decoration',APMM_TD);?></span>
									<select name="apmm_theme[top_menu][font_decoration]" class="apmm_font_decoration">
										   <option value="none" <?php if(isset($toplevel_font_decoration) && $toplevel_font_decoration == "none") echo "selected='selected'";?>><?php _e('None',APMM_TD);?></option>
										   <option value="underline" <?php if(isset($toplevel_font_decoration) && $toplevel_font_decoration == "underline") echo "selected='selected'";?>><?php _e('Underline',APMM_TD);?></option>
										</select>
								</label>
								<label class="ap-mega_container-padding">
								<span><?php _e('Decoration On Hover',APMM_TD);?></span>
									<select name="apmm_theme[top_menu][font_decoration_hover]" class="apmm_font_decoration_hover">
										   <option value="none"  <?php if(isset($toplevel_font_decoration_hover) && $toplevel_font_decoration_hover == "none") echo "selected='selected'";?>><?php _e('None',APMM_TD);?></option>
										   <option value="underline" <?php if(isset($toplevel_font_decoration_hover) && $toplevel_font_decoration_hover == "underline") echo "selected='selected'";?>><?php _e('Underline',APMM_TD);?></option>
										</select>
								</label>
                  
							 
								</td>
							</tr>
							
					
							 <tr>
								<td>
									<label><?php _e('Menu Left Dividers',APMM_TD);?></label>
									<p class="description left_note"><?php _e('Enable dividers and set color for it.<br/> For Glow Opacity:
									A number between 0 and 1 representing the opacity of the inner box shadow on the items left edge. Used to give the buttons a sense of depth.',APMM_TD);?></p>
								</td> 
								<td>
								  <label for="top_menu_divider_color" class="label_field">
								    <div class="wpmm-switch">
									  <input type="checkbox" value="1" <?php echo (isset($toplevel_enable_menu_divider) && $toplevel_enable_menu_divider == 1)?'checked':'';?> id="top_menu_divider_color" class="apmm_menu_divider_color" 
									  name="apmm_theme[top_menu][enable_menu_divider]">
									   <label for="top_menu_divider_color"></label>
                                     </div>
									  <span><?php _e('Enable',APMM_TD);?></span>
								    </label>
										
                                    <input type="text" value="<?php echo (!isset($toplevel_menu_divider_color))?'':esc_attr($toplevel_menu_divider_color);?>" name="apmm_theme[top_menu][menu_divider_color]" class="apmm-color-picker" >
								    <br/><br/><label class="label_field">
									  <span><?php _e('Item Divider Glow Opacity',APMM_TD);?></span></label>
									  <input type="text" value="<?php echo (!isset($toplevel_opacity_glow))?'0.5':esc_attr($toplevel_opacity_glow);?>" id="top_menu_opacity_glow" class="apmm_menu_opacity_glow" 
									  name="apmm_theme[top_menu][opacity_glow]">
									  
								   

								</td>
							</tr>


					
						</tbody>
						</table>
		             </div>
              <!----------------Top Level Menu Items settings  End-------------------------->