(function($) {

    $.fn.teiDisplay = function(method) {

        var methods = {

            init : function(options) {
                this.teiDisplay.settings = $.extend({}, this.teiDisplay.defaults, options);
                return this.each(function() {
                    var $element = $(this), // reference to the jQuery version of the current DOM element
                         element = this;      // reference to the actual DOM element
                    
                    // initial variables
                    var currentText = 1;
                    var totalTexts = 0;
                    var xml;
                    var xmlData;


                    //process the xml file
                    $.ajax({
                      url: $(this).teiDisplay.settings.xmlFile,
                      cache: false
                    }).done(function( xml ) {
                        xmlData = $.parseXML( xml );
                        helpers.makeWits(xml);
                    });

                    helpers.addStyles();

                });

            },

            // a public method. for demonstration purposes only - remove it!
            foo_public_method: function() {
                // code goes here
            }

        }

        var helpers = {

            makeWits: function(xml) {

            	//Reads through the xml file and makes a text holder for each witness found.
            	//Then sends the xml to addChildren to be parsed into html and added to the
            	//first text holder. 

                xml = $(xml);
                
                //get witnesses
                var witnesses = xml.find('witness');
                witnesses.each(function() {
                	console.log('initial witness ' + $(this).attr('xml:id'));
                })

                //if user has specified witnesses in the plugin options, go through and remove
                //others from the array
                if ($(this).teiDisplay.settings.witnesses) {
	
	                var includeWitnesses = [];
	                var includeWitnesses = $.map($(this).teiDisplay.settings.witnesses.split(','), $.trim);

	                console.log('include witnesses: ' + includeWitnesses);

					for (var i = witnesses.length; i >= 0; i--) {   
                		
                		console.log('testing: ' + $(witnesses[i]).attr('xml:id'));					             		
                		
                		var index = jQuery.inArray($(witnesses[i]).attr('xml:id'), includeWitnesses);
                		if (index == -1) {
                			console.log('removing: ' + $(witnesses[i]).attr('xml:id'));
                			witnesses.splice(i,1);
                		}
					
					}
    
                }//if using witnesses option

                var body = xml.find('body');
                var first = true;
                var firstWitId;
                var i = witnesses.length;

                witnesses.reverse().each(function() {

                    var witId = $(this).attr('xml:id');
                    var witName = $(this).text();

                    //make holder
                    $('#texts').prepend('<div class="text" data-witness-id="' + witId + '" id="' + witId + '" data-color="color' + i + '" data-witness-name="' + witName + '"></div>');

                    //loop through elements and add to first holder
                    if (first) {
                        helpers.addChildren(body, witId);
                        firstWitId = witId;
                        first = false;
                    }

                    i--;

                })

                helpers.copyWit(firstWitId);
                helpers.filterWits();
                helpers.addWitHeaders();
                helpers.setDimensions();
                helpers.makeWitnesses();
                helpers.makeSelects();
                helpers.textActions();
                helpers.screenActions();
                helpers.utilityActions();

            }, 

            copyWit: function(firstWitId) {

                //Copies the contents of the first text into all other text holders. At this
                //point, the text holders contains text from all witnesses.

                var texts = $('.text:not(#' + firstWitId + ')');
                texts.each(function() {
                    $('#' + firstWitId).children().clone().appendTo($(this));
                })
            }, 

            filterWits: function() {

                //Goes through each witness and gets rid of nodes belonging to other witnesses.

                $('#texts .text').each(function() {
                    var witId = $(this).attr('data-witness-id');
                    $(this).find('[data-wit != ""]').each(function() {
                        //console.log($(this).contents());
                        var wits = $(this).attr('data-wit');
                        if (wits.indexOf(witId) !== -1 || wits.indexOf('all') !== -1) {
                            //console.log($(this).attr('data-wit'));
                        } else {
                            $(this).remove();
                        }
                    })
                })
            }, 

            addWitHeaders: function() {

                //Adds header markup to each text holder.

                var i = 1;
                $('#texts .text').each(function() {
                    $(this).children().wrapAll('<div class="text-holder"></div>')
                    $(this).addClass('color' + i).prepend($(this).teiDisplay.settings.witHeader);
                    i++;
                })
            },

            appendElement: function(element, parentId) {

                $(element).contents().each(function() {
                    var nodeType = this.nodeType;
                    if (nodeType == 3) {
                        //console.log('appending ' + $(this).text() + ' to ' + parentId);
                        var text = $.trim($(this).text());
                        if (text != "") {
                            //console.log($(this).text());                  
                            $('#' + parentId).append($(this).text());
                        }
                    } else if (nodeType == 1) {
                        //console.log('appending ' + $(this).prop('tagName') + ' to ' + parentId);
                        var tagType = $(this).prop('tagName');
                        var loc = $(this).attr('loc');
                        var wit = $(this).attr('wit');
                        var type = $(this).attr('type');
                        var place = $(this).attr('place');

                        if (!wit) {
                            wit = '';
                        }
                        var id = $(this).attr('id');
                        if (id = 'undefined') {
                            id = Math.floor(Math.random()*999999);
                            $(this).attr('id', id);

                            switch(tagType) {
                                
                                case 'cb':
                                    $('#' + parentId).append('<span class="tei-place-' + place + ' tei-type-' + type + ' tei-cb" id="' + id + '" data-loc="' + loc + '" data-wit="' + wit + '"></span>')
                                    helpers.appendElement($(this), id);
                                    break;

                                case 'emph':
                                    var rend = $(this).attr('rend')
                                    $('#' + parentId).append('<span class="tei-place-' + place + ' tei-type-' + type + ' tei-emph-' + rend + '" id="' + id + '" data-loc="' + loc + '" data-wit="' + wit + '"></span>')
                                    helpers.appendElement($(this), id);
                                    break;  

                                case 'del':
                                    $('#' + parentId).append('<span class="tei-place-' + place + ' tei-type-' + type + ' tei-del" id="' + id + '" data-loc="' + loc + '" data-wit="' + wit + '"></span>')
                                    helpers.appendElement($(this), id);
                                    break;  

                                case 'div':
                                    $('#' + parentId).append('<div class="tei-place-' + place + ' tei-type-' + type + ' tei-div" id="' + id + '" data-loc="' + loc + '" data-wit="' + wit + '"></div>')
                                    helpers.appendElement($(this), id);
                                    break;  

                                case 'lg':
                                    $('#' + parentId).append('<div class="tei-place-' + place + ' tei-type-' + type + ' tei-lg" id="' + id + '" data-loc="' + loc + '" data-wit="' + wit + '"></div>')
                                    helpers.appendElement($(this), id);
                                    break;

                                case 'l':
                                    $('#' + parentId).append('<div class="tei-place-' + place + ' tei-type-' + type + ' tei-l" id="' + id + '" data-loc="' + loc + '" data-wit="' + wit + '"></div>')
                                    helpers.appendElement($(this), id);
                                    break;          

                                case 'app':
                                    $('#' + parentId).append('<span class="tei-place-' + place + ' tei-type-' + type + ' tei-app" id="' + id + '" data-loc="' + loc + '" data-wit="' + wit + '"></span>')
                                    helpers.appendElement($(this), id);
                                    break;

                                case 'rdg':
                                    $('#' + parentId).append('<span class="tei-place-' + place + ' tei-type-' + type + ' tei-rdg" id="' + id + '" data-loc="' + loc + '" data-wit="' + wit + '"></span>')
                                    helpers.appendElement($(this), id);
                                    break;                              

                                default:                                            
                                    $('#' + parentId).append('<span class="tei-place-' + place + ' tei-type-' + type + ' tei-' + tagType + '" id="' + id + '" data-loc="' + loc + '" data-wit="' + wit + '"></span>')
                                    helpers.appendElement($(this), id);
                                    break;  
                            }

                        }

                    }
                })

            }, 

            addChildren: function(xml, parentId) {
                var children = xml.children();
                children.each(function() {
                    helpers.appendElement($(this), parentId);
                })
                
            }, 

            utilityActions: function() {

                $('#utility .hide-notes').live('click', function() {
                    hideNotes();
                })
                $('#utility .show-notes').live('click', function() {
                    showNotes();
                })

                $('#utility .visual').live('click', function() {
                    makeVisual();
                })
                $('#utility .text').live('click', function() {
                    makeText();
                })  

                $('#utility .overlay').live('click', function() {
                    makeOverlay();
                })
                $('#utility .opaque').live('click', function() {
                    makeOpaque();
                })          

            }, 

            screenActions: function() {
                $('#screen').live('click', function() {
                    $(this).hide();
                    $('#texts .text').removeClass('expanded');
                })

                $('#text-advance').live('click', function() {
                    helpers.advanceText();
                })
                $('#text-regress').live('click', function() {
                    helpers.regressText();
                })  
            }, 

            advanceText: function() {
                if (currentText < totalTexts) {
                    var offset = $('#texts').position();
                    var newOffset = offset.left - 421;
                    $('#texts').animate({
                        left: newOffset + 'px',
                    }, 300 );
                    currentText++;
                }
            }, 

            regressText: function() {
                if (currentText > 1) {
                    var offset = $('#texts').position();
                    var newOffset = offset.left + 421;
                    $('#texts').animate({
                        left: newOffset + 'px',
                    }, 300 );
                    currentText--;
                }
            },

            setDimensions: function() {

                var textWidth = $('#texts .text').length * 420 + 24;
                var actionHeight = $('#actions').height();
                var newHeight = $(window).height() - actionHeight - 60;

                $('#texts').css('width', textWidth + 'px');
                $('#texts .text').css('height', newHeight + 'px').append('<div class="textHeightFix"></div>');
                newHeight -= 20;
                $('#texts .text-holder, #texts .visual-holder').css('height', newHeight + 'px');

            },

            makeWitnesses: function() {
                $('#texts .text').each(function() {
                    var color = $(this).attr('data-color');     
                    var id = $(this).attr('data-witness-id');
                    var name = $(this).attr('data-witness-name');
                    $('#witnesses').append('<div class="witness ' + color + '" data-witness-id="' + id + '"><p>' + name + '</p></div>')
                })  
                $('#witnesses').sortable({ 
                    axis: 'x', 
                    stop: function( event, ui ) {
                        var last, current;
                        var count = 0;
                        $('#witnesses .witness').each(function() {
                            current = $('#texts .text[data-witness-id="' + $(this).attr('data-witness-id') + '"]').remove();
                            if (count != 0) {
                                last.after(current);
                            } else {
                                $('#texts').prepend(current);
                            }
                            last = current;
                            count++;
                        })
                    }
                });
                $('#witnesses .witness').live('dblclick', function() {
                    var witnessId = $(this).attr('data-witness-id');
                    var currentText = $('#texts .text[data-witness-id="' + witnessId + '"]');
                    $('#texts').prepend(currentText);
                    var currentWitness = $(this).remove();
                    $('#witnesses').prepend(currentWitness);
                })

            }, 

            textActions: function() {

                $('.text .text-actions .expand').live('click', function() {
                    $(this).parent().parent().addClass('expanded');
                    $('#screen').show();
                })

                /*
                $('.text-holder *[data-loc != "undefined"]').live('dblclick', function() {
                    var identifier = $(this).attr('data-loc');
                    if ($(this).hasClass('focused')) {
                        resetFocus();
                    } else {
                        $('.text-holder > *').removeClass('focused');
                        $(this).addClass('focused');
                        $('#text-holder *[data-loc == "' + identifier + '"]').addClass('focused');
                        $('#texts .text').addClass('focus');            
                    }

                })
                */

            },

            makeSelects: function() {
                $('.text-holder *[data-loc != "undefined"]').live('click', function() {
                    var identifier = $(this).attr('data-loc');
                    $('.text-holder .active').removeClass('active');
                    $('.text *[data-loc = "' + identifier + '"]').each(function() {
                        if ($(this).hasClass('active')) {
                            $(this).removeClass('active');
                        } else {
                            $(this).addClass('active');         
                        }
                    })

                })
            },

            addStyles: function() {

            	var backgroundElements = [];
	            var backgroundElements = $.map($(this).teiDisplay.settings.background.split(','), $.trim);

	            var n = backgroundElements.length;

	            if (n > 0) {
		            var cssString = '<style>';
		            for (var i = 0; i < n; i++) {
					    cssString += '.' + backgroundElements[i] + '{ ' + $(this).teiDisplay.settings.backgroundStyles[i] + '; }';
					}	
					cssString += '</style>';
	            	$('body').append(cssString);
	            }//if
            }





        }//helpers

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error( 'Method "' +  method + '" does not exist in teiDisplay plugin!');
        }

    }

    $.fn.teiDisplay.defaults = {
        xmlFile: '',
        witnesses: '',
        background: '',
        witHeader: '<div class="text-actions"><a href="#" class="expand">+</a></div>',
        backgroundStyles: [
        	'background-color: #ffcccc',
        	'background-color: #ccffcc',
        	'background-color: #ccccff'      	
        ]
    }

    $.fn.teiDisplay.settings = {}

})(jQuery);




















function wrapWords() {
    $('#texts .text .text-holder .paragraph').each(function() {
        var id = $(this).attr('data-identifier');
        var visual = $(this).parent().parent().children('.visual-holder');
        var newString = '<div class="paragraph" data-identifier="' + id + '">';
        var text = $(this).text().replace(/(\r\n|\n|\r)/gm,"").split(/,| |—/);
        for( var i = 0, len = text.length; i < len; i++ ) {
            text[i] = '<span>' + text[i] + '</span>';
            newString += text[i];
        }
        newString += '</div>';
        visual.append(newString);
    })

    $('#texts .text .text-holder .line').each(function() {
        var id = $(this).attr('data-identifier');
        var visual = $(this).parent().parent().children('.visual-holder');
        var newString = '<div class="line" data-identifier="' + id + '">';
        var text = $(this).text().replace(/(\r\n|\n|\r)/gm,"").split(/,| |—/);
        for( var i = 0, len = text.length; i < len; i++ ) {
            text[i] = '<span>' + text[i] + '</span>';
            newString += text[i];
        }
        newString += '</div>';
        visual.append(newString);
    })

}//wrapWords

function resetFocus() {
    $('.text .paragraph, .text .line').removeClass('focused');
    $('#texts .text').removeClass('focus');
}

function loadNotes(notes) {
    for (var i = 0; i < 4; i++) {
        var note = notes[i];
        for (var key in notes[i]) {
            for(var key2 in note[key]) {
                if (key2 == 'location') {
                    var location = note[key][key2];
                } else if (key2 == 'content') {
                    var content = note[key][key2];
                }
            }
            $('.text div[data-identifier="' + location + '"]').addClass('hasNote').prepend("<span class='note-indicator'>* </span>");
            $('#actions #notes').append('<div class="note" data-identifier="' + location + '"><a class="close">X</a>' + content + '</div>');
        }
    }
    $('#notes .note a.close').live('click', function() {
        $(this).parent().removeClass('active');
    })
}

function showNote(line) {
    showNotes();
    var note = $('#notes div[data-identifier="' + line + '"]').addClass('active').remove();
    $('#notes').prepend(note);
}//showNotes

function hideNote(line) {
    $('#notes div[data-identifier="' + line + '"]').removeClass('active');
}//showNotes

function hideNotes() {
    $('#notes').hide();
    $('#utility .hide-notes').hide();
    $('#utility .show-notes').show();
    setDimensions();
}

function showNotes() {
    $('#notes').show();
    $('#utility .hide-notes').show();
    $('#utility .show-notes').hide();   
    setDimensions();
}

function makeOpaque() {
    $('#utility .opaque').hide();
    $('#utility .overlay').show();  
    $('body').addClass('opaque').removeClass('overlay');    
}

function makeOverlay() {
    $('#utility .opaque').show();
    $('#utility .overlay').hide();  
    $('body').addClass('overlay').removeClass('opaque');    
}

jQuery.fn.reverse = [].reverse;