!function($) {

	$(document).ready( function(){
            
        // submit events form
        $('#events-form').on('submit', function(e) {
            
            e.preventDefault();
            
            $('#events-results-spinner').show();
            $('#load-more-events').hide();
            
            // reset page number
            $('input[name="page_number"]').val( 1 );
            
            $('#events-results').html( '' );
            
            var data = $("#events-form").serializeArray();
                        
            var ajax_data = {
                'action': 'events_ajax_get_events',
                'data': data,
            };

            jQuery.post( js_vars.ajaxurl+window.location.search, ajax_data, function(response) {

                // replace events list
                $('#events-results-spinner').hide();
                $('#events-results').html( response );
            
                if ( response.indexOf("accordion") >= 0 ){
                    // has results
                    
                    $('#load-more-events').show();
                
                    //  page number
                    $('input[name="page_number"]').val( 2 ); 
                    
                    // recalc accordians
                    $(document).foundation();
                    
                } else {
                    //no results
                    
                }          
                
            });
                
        });
        
        
        // load more
        $('#load-more-events').on( 'click', function(e) {
            
            $('#load-more-events').prop("disabled", true);       
            $('#load-more-events-spinner').show();
            
            var data = $("#events-form").serializeArray();
                        
            var ajax_data = {
                'action': 'events_ajax_get_events',
                'data': data,
            };

            jQuery.post( js_vars.ajaxurl+window.location.search, ajax_data, function(response) {
                
                $('#load-more-events').prop("disabled", false);
                $('#load-more-events-spinner').hide();
                
                // replace events list
                $('#events-results').append( response );
            
                if ( response.indexOf("accordion") >= 0 ){
                    // has results
                    
                    $('#load-more-events').show();
                                      
                    // increase page number
                    page_number = parseInt( $('input[name="page_number"]').val() );
                    $('input[name="page_number"]').val( page_number+1 );
                    
                    // recalc accordians
                    $(document).foundation();   
                    
                } else {
                    //no results
                    $('#load-more-events').hide();
                }
                



            });            
          
            
        });
        
        
    });
    
}(window.jQuery);