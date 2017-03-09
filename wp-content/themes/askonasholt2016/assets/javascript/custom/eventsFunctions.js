!function($) {

	$(document).ready( function(){
        
        
        
        //
        // date picker
        //
        $('#datepicker').fdatepicker({
            format:'yyyy-mm-dd'    
        })
        .on('changeDate', function (ev) {
            var new_date = $('#datepicker').data('date');
            // assign to hidden input
            $('#date').val( new_date );
            // show in select drop down
            var dateAr = new_date.split('-');
            $('#date_display').text( dateAr[2]+'/'+dateAr[1]+'/'+dateAr[0].slice(-2) );
            $('#date_type').val( 'date' );
            
        });
        
        
        //
        // speceifc day click
        //
        $('#date_type').change( function(){
           // show datepicker
           if( $(this).val() == 'date' ){
                $('#datepicker').click();
           }
        });
        
        
        
            
        // submit events form
        $('#events-form').on('submit', function(e) {
            
            e.preventDefault();
            
            $('#events-results-spinner').show();
            $('#load-more-events').hide();
            $('#no-events-found').hide();
            
            // reset page number
            $('input[name="page_number"]').val( 1 );
            
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
                    $('#no-events-found').show();
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