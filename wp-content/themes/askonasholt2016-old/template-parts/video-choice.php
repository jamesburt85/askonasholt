
	<!-- If video choice is an EMBED -->
	<?php 	if( get_field('video_type') == 'Embed' ):
		
		the_field('embed_script');

		//If the video choice is YOUTUBE
		elseif (get_field('video_type') == 'Youtube'): ?>
		
		<iframe width="560" height="315" src="https://www.youtube.com/embed/<?php the_field('youtube_video_id'); ?>" frameborder="0" allowfullscreen></iframe>

	<?php
		//If the video chooice is VIMEO
		elseif (get_field('video_type') == 'Vimeo'): ?>
		
		<iframe src="https://player.vimeo.com/video/<?php the_field('vimeo_video_id'); ?>" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
			
	<?php endif; ?>




