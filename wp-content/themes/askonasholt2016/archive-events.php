<?php
/**
 * The template for displaying archive pages
 *
 * Used to display archive-type pages if nothing more specific matches a query.
 * For example, puts together date-based pages if no date.php file exists.
 *
 * If you'd like to further customize these archive views, you may create a
 * new template file for each one. For example, tag.php (Tag archives),
 * category.php (Category archives), author.php (Author archives), etc.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>


<div id="archive" role="main">

	<article class="main-content">

		<?php get_template_part( 'template-parts/events-hero'); ?>
	
		<?php
		// adding in the live events block 
		get_template_part( 'template-parts/live-events-listing' ); 
        
        ?>
        
        <?php
            // inti default events args for form
            $event_args = events_set_default_args();
     
        ?>
        
		<h3 class="section-header center">Browse Upcoming Events</h3>
        
		<div class="events-filtering-bar">
        
            <form id="events-form" action="#" method="POST" >
            
                <input type="hidden" name="page_number" value="<?php echo ($event_args['page_number']+1);?>">
            
                Upcoming events:
                <select name="date_type">
                    <option value="today">Today</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                    <option value="date">Specefic Day...</option>
                </select>
                
                <input name="date" value="<?php echo $event_args['date'];?>">
                
                <i class="fa fa-calandar"></i>
                
                In:
                <input type="#" name="location" placeholder="(enter city or venue)" >
                
                <button type="submit">Filter <i class="fa fa-spinner fa-spin" id="events-results-spinner"  style="display:none;"></i></button>
                
            </form>
            
		</div>
        
        <div id="events-results">
            <?php get_template_part( 'template-parts/content-events-home');  ?>
        </div>
        
		<hr/>        

        <div class="text-center">
            <button class="button" id="load-more-events" >Load More <i id="load-more-events-spinner" class="fa fa-spinner fa-spin" style="display:none;"></i></button>
        </div>


	</article>

</div>

<?php get_template_part( 'template-parts/link-banner' ); ?>

<?php get_footer();
