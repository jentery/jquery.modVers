(function($) {

    $.fn.teiDisplay = function(method) {

        var methods = {

            init : function(options) {
                
                this.teiDisplay.settings = $.extend({}, this.teiDisplay.defaults, options);

                return this.each(function() {
                    
                    var $element = $(this), // reference to the jQuery version of the current DOM element
                         element = this;      // reference to the actual DOM element                 

                    var data = $element.data('teiDisplay');

                    //add elements to document
                    helpers.addElements($(this));

                    //process the xml file
                    $.ajax({
                      url: data.xmlFile,
                      cache: false,
                      dataType: "text",
                    }).done(function( xml ) {
                        xml = xml.replace('<?xml version="1.0" ?>', '');
                        xmlData = $.parseXML( xml );
                        helpers.makeWits(xmlData, element);
                    });

                });

            },

        }

        var helpers = {

 
            addElements: function(holder) {

                holder.append($(this).teiDisplay.settings.advanceButtons); 
                holder.append($(this).teiDisplay.settings.textHolder); 
                holder.append($(this).teiDisplay.settings.utility); 
                holder.append($(this).teiDisplay.settings.annotationPanel); 
                
                vizPanel = '<div id="teiDisplayVizPanel" class="teiDisplayPanel"><div style="width: ' + $(this).teiDisplay.settings.textWidth + 'px"><a href="#" class="close">x</a></div>';

                holder.append(vizPanel); 

                console.log(holder.data('teiDisplay').fixFirst);

                //Unfix the first text if option
                if (holder.data('teiDisplay').fixFirst != true && holder.data('teiDisplay').fixFirst != undefined) {
                    holder.addClass('teiFreeFirst');
                }

                 if (holder.data('teiDisplay').fullscreen != true && holder.data('teiDisplay').fullscreen != undefined) {
                    holder.css('overflow', 'hidden');
                    holder.addClass('teiNotFullScreen').css('position','relative');
                    $('#teiTexts').css('margin-left', '0px');
                }               

                //Set the holder height if needed.
                if (holder.data('teiDisplay').height) {
                    holder.css('height', holder.data('teiDisplay').height + 'px');
                }

                //Add a developer bar if needed
                if (holder.data('teiDisplay').dev) {
                    $('body').append('<div id="teiDisplayDev"><p></p></div>');
                }


            },

            makeWits: function(xml, holder) {

                //Reads through the xml file and makes a text holder for each witness found.
                //Then sends the xml to addChildren to be parsed into html and added to the
                //first text holder. Also adds a div that contains general information about
                //the text.

                xml = $(xml);

                //Append info panel.
                titleStatement = xml.find("titleStmt");
                publicationStatement = xml.find("publicationStmt");
                notesStatement = xml.find("notesStmt");

                title = titleStatement.children('title').text();
                author = titleStatement.children('author').text();
                editor = titleStatement.children('editor').text();
                respStatement = titleStatement.children('respStmt').text();
                publisher = publicationStatement.children('publisher').text();
                publisherAddress = publicationStatement.children('address').text();
                availability = publicationStatement.children('availability').text();
                notes = notesStatement.children('note');
                sourceDescription = xml.find("sourceDesc").text();

                infoPanel = '<div id="teiDisplayInfoPanel" class="teiDisplayPanel"><div style="width: ' + $(this).teiDisplay.settings.textWidth + 'px"><a href="#" class="close">x</a>';
                if (title) {
                    infoPanel += '<h3>Title</h3><p>' + title + '</p>';
                }
                if (author) {
                    infoPanel += '<h3>Author</h3><p>' + author + '</p>';
                } 
                if (editor) {
                    infoPanel += '<h3>Editor</h3><p>' + editor + '</p>';
                } 
                if (publisher) {
                    infoPanel += '<h3>Publisher</h3><p>' + publisher + '</p>';
                }
                if (publisherAddress) {
                    infoPanel += '<h3>Publisher Address</h3><p>' + publisherAddress + '</p>';
                }                
                if (respStatement) {
                    infoPanel += '<h3>Statement of Responsibility</h3><p>' + respStatement + '</p>';
                }  
                if (availability) {
                    infoPanel += '<h3>Availability</h3><p>' + availability + '</p>';
                }                                                                
                if (notes) {
                    infoPanel += '<h3>Notes</h3>';
                    $(notes).each(function() {
                        infoPanel += '<p>' + $(this).text() + '</p>';
                    })
                } 
                if (sourceDescription) {
                    infoPanel += '<h3>Source Description</h3><p>' + sourceDescription + '</p>';
                } 
                infoPanel += '</div></div>';
                $(holder).append(infoPanel);

                //Get witnesses.
                var witnesses = xml.find('witness');

                //If user has specified witnesses in the plugin options, go through and remove
                //others from the array.
                if ($(holder).data('teiDisplay').witnesses) {
    
                    var includeWitnesses = [];
                    var includeWitnesses = $.map($(holder).data('teiDisplay').witnesses.split(','), $.trim);

                    for (var i = witnesses.length; i >= 0; i--) {   
                                                
                        var index = jQuery.inArray($(witnesses[i]).attr('xml:id'), includeWitnesses);
                        if (index == -1) {
                            witnesses.splice(i,1);
                        }
                    }
                }

                var body = xml.find('body');
                var first = true;
                var firstWitId;
                var i = witnesses.length;

                witnesses.reverse().each(function() {

                    //count the total number of witnesses
                    $(this).teiDisplay.internals.totalTexts++;

                    var witId = $(this).attr('xml:id');
                    var witName = $(this).text();

                    //make holder
                    $('#teiTexts').prepend('<div class="text" data-witness-id="' + witId + '" id="' + witId + '" data-color="color' + i + '" data-witness-name="' + witName + '"></div>');

                    //loop through elements and add to first holder
                    if (first) {
                        helpers.addChildren(body, witId, holder);
                        firstWitId = witId;
                        first = false;
                    }

                    i--;

                })

                helpers.copyWit(firstWitId, holder);
                helpers.filterWits(holder);
                helpers.addWitHeaders(holder);
                helpers.processFacs(holder);
                helpers.filterLocs(holder);
                helpers.setDimensions(holder);
                helpers.makeWitnesses(holder);
                helpers.textActions(holder);

                if ($(holder).data('teiDisplay').annotations) {
                    helpers.makeNotes(holder);
                }

                if ($(holder).data('teiDisplay').highlights) {
                    helpers.makeHighlights(holder);
                }  

            }, 

            makeHighlights: function(holder) {

                //Reads an optional json file with highlight information and adds
                //highlights to texts.

                $.getJSON($(holder).data('teiDisplay').highlights, function(data) {

                    //add legend
                    if (data.highlights.items.length > 0) {
                        $('#teiDisplayActions').append('<a id="teiDisplayShowLegend" href="#"><span class="first"></span><span class="second"></span><span class="third"></span><span class="fourth"></span></a>');

                        legendPanel = '<div id="teiDisplayLegendPanel" class="teiDisplayPanel"><div style="width: ' + $(this).teiDisplay.settings.textWidth + 'px"><a href="#" class="close">x</a><h3>Legend</h3>';

                    }

                  $.each(data.highlights.items, function(i,item) {

                    legendPanel += '<p class="background' + i + '">' + item.description + '</p>';

                    var includeLocs = [];
                    var includeLocs = $.map(item.loc.split(','), $.trim);
           
                    if (item.wit) {
                        var includeWitnesses = [];
                        var includeWitnesses = $.map(item.wit.split(','), $.trim);

                        for (var k = includeWitnesses.length; k >= 0; k--) {   

                            for (var j = includeLocs.length; j >= 0; j--) {   

                                $('.text[data-witness-id="' + includeWitnesses[k] + '"] [data-loc="' + includeLocs[j] + '"]').addClass('background' + i);

                            }//foreach loc

                        }//foreach wit

                    } else {

                        for (var j = 0; j < includeLocs.length; j++) {   

                            $('.text [data-loc="' + includeLocs[j] + '"]').addClass('background' + i);

                        }//foreach loc
                    } //else

                  }); //each

                $(holder).append(legendPanel);

                })//getJSON


            },

            makeNotes: function(holder) {

                //Reads an optional json file with annotation information and adds
                //annotations to texts.

                $.getJSON($(holder).data('teiDisplay').annotations, function(data) {

                  $.each(data.annotations.items, function(i,item) {
           
                    if (item.wit) {
                        var includeWitnesses = [];
                        var includeWitnesses = $.map(item.wit.split(','), $.trim);

                        for (var i = includeWitnesses.length; i >= 0; i--) {   
                            $('.text[data-witness-id="' + includeWitnesses[i] + '"] [data-loc="' + item.loc + '"]').prepend(
                                '<span class="teiDisplayAnnotation" data-annotation-text="' + item.text + '"></span>'
                            );
                        }//foreach wit

                    } else {
                        $('.text [data-loc="' + item.loc + '"]').prepend(
                            '<span class="teiDisplayAnnotation" data-annotation-text="' + item.text + '"></span>'
                        );
                    }
                  });

                })//getJSON


            },

            copyWit: function(firstWitId, holder) {

                //Copies the contents of the first text into all other text holders. At this
                //point, the text holders contains text from all witnesses. Also copies contents
                //into the visualization panel.

                var texts = $('.text:not(#' + firstWitId + ')');
                texts.each(function() {
                    $('#' + firstWitId).children().clone().appendTo($(this));
                })

                 $('#' + firstWitId).children().clone().appendTo($('#teiDisplayVizPanel div:first'));                

            }, 

            filterWits: function(holder) {

                //Goes through each witness and gets rid of nodes belonging to other witnesses.
                //Also deletes empty nodes

                $('#teiTexts .text').each(function() {
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

                $('.text .tei-rdg:empty').remove();
                $('.text .tei-app:empty').remove();

            }, 

            filterLocs: function(holder) {

                //If specific locs are included in the data object, gets rid of others. 

                var includeLocs;
                
                if ($(holder).data('teiDisplay').locs) {
                    includeLocs = $.map($(holder).data('teiDisplay').locs.split(','), $.trim);
                }

                if (includeLocs) {
                    $('.teiTextHolder *[data-loc != "undefined"]').each(function() {
                    
                        if (includeLocs.indexOf($(this).attr('data-loc')) !== -1) {
                        
                        } else {  
                            $(this).remove();                                
                        }

                    })//each
                }//if 

            },             

            addWitHeaders: function(holder) {

                //Adds header markup to each text holder.

                var i = 1;
                $('#teiTexts .text').each(function() {

                    var witTitle = $(this).attr('data-witness-name');

                    $(this).children().wrapAll('<div class="teiTextHolder"></div>')
                    $(this).addClass('color' + i).prepend($(this).teiDisplay.settings.witHeader);

                    $(this).children('.teiDisplayTextActions').prepend('<p class="teiDisplayWitnessTitle">' + witTitle + '</p>');
                    
                    i++;
                })
            },

            processFacs: function(holder) {

                //Adds total number of pages to page breaks.

                $('#teiTexts .text').each(function() {

                    var currentPage = 1;
                    var totalPages = 0;

                    $(this).find('.tei-pb').each(function() {
                        $(this).append('<span class="tei-pb-icon"> ' + currentPage + '/<span class="teiTotalPages"></span></span>')
                        currentPage++;
                        totalPages++;
                    })

                    $(this).find('.tei-pb .teiTotalPages').html(totalPages);

                })

            },

            appendElement: function(element, parentId, holder) {

                //Recursively adds each element from the XML document to the HTML document.

                $(element).contents().each(function() {
                    
                    var nodeType = this.nodeType;

                    if (nodeType == 3) {

                        var text = $.trim($(this).text());
                        if (text != "") {
                            $('#' + parentId).append($(this).text());
                        }
                    
                    } else if (nodeType == 1) {

                        var tagType = $(this).prop('tagName');
                        var loc = $(this).attr('loc');
                        var wit = $(this).attr('wit');
                        var type = $(this).attr('type');
                        var place = $(this).attr('place');
                        var facs = $(this).attr('facs');
                        if (!facs) {
                            facs = '';
                        }
                        var rend = $(this).attr('rend')
                        if (!wit) {
                            wit = '';
                        }
                        var id = $(this).attr('id');
                        if (id = 'undefined') {
                            id = Math.floor(Math.random()*999999);
                            $(this).attr('id', id);
                        }//if


                        switch(tagType) {
                            default:                                            

                                $('#' + parentId).append('<span class="tei-place-' + place + ' tei-' + tagType + ' tei-emph-' + rend + ' tei-type-' + type + '" id="' + id + '" data-loc="' + loc + '" data-wit="' + wit + '" data-facs="' + facs + '"></span>');
                                helpers.appendElement($(this), id, holder);
                                break;  
                        }//switch


                    }//elseif tag node
                
                })//each element

            }, 

            addChildren: function(xml, parentId, holder) {

                //Gets the XML elements and passes them each to appendElement().

                var children = xml.children();
                children.each(function() {
                    helpers.appendElement($(this), parentId);
                })
                
            }, 

            advanceText: function() {

                //Moves the texts 1 to the left.

                if ($(this).teiDisplay.internals.currentText < $(this).teiDisplay.internals.totalTexts) {
                    var offset = $('#teiTexts').position();
                    var newOffset = offset.left - $(this).teiDisplay.settings.textWidth;
                    $('#teiTexts').animate({
                        left: newOffset + 'px',
                    }, 300 );
                    $(this).teiDisplay.internals.currentText++;
                }
            }, 

            regressText: function() {

                //Moves the texts 1 to the right.

                if ($(this).teiDisplay.internals.currentText > 1) {

                    var offset = $('#teiTexts').position();
                    var newOffset = offset.left + $(this).teiDisplay.settings.textWidth;

                    $('#teiTexts').animate({
                        left: newOffset + 'px',
                    }, 300 );
                    $(this).teiDisplay.internals.currentText--;
                }
            },

            resetTexts: function(holder) {

                //Moves the texts to their original position

                $('#teiTexts').animate({
                    left: '0px',
                }, 300 );
                $(this).teiDisplay.internals.currentText = 1;                

            },

            setDimensions: function(holder) {

                //Sets dimensions relative to size of window.

                var textWidth = $('#teiTexts .text').length * $(this).teiDisplay.settings.textWidth + 24;
                var actionHeight = $('#teiDisplayActions').height();

                if ($(holder).data('teiDisplay').fullscreen == true || $(holder).data('teiDisplay').fullscreen == undefined) {
                    var newHeight = $(window).height() - actionHeight - 60;                    
                } else {
                    var newHeight = $(holder).height() - actionHeight - 60;                    
                }

                $('#teiTexts').css('width', textWidth + 'px');
                $('#teiTexts .text').css('height', newHeight + 'px').append('<div class="textHeightFix"></div>');
               
                
                if ($(holder).data('teiDisplay').fullscreen == true || $(holder).data('teiDisplay').fullscreen == undefined) {
                    newHeight -= 55;
                } else {
                    newHeight -= 20;
                }

                
                $('#teiTexts .teiTextHolder').css('height', newHeight + 'px');
            },

            makeWitnesses: function(holder) {

                //Creates the witnesses in the bottom bar.

                $('#teiTexts .text').each(function() {
                    var color = $(this).attr('data-color');     
                    var id = $(this).attr('data-witness-id');
                    var name = $(this).attr('data-witness-name');
                    $('#teiDisplayWitnesses').append('<div class="witness ' + color + '" data-witness-id="' + id + '"><span class="teiWitnessGrip"></span><p>' + name + '</p></div>')
                })  

                //Sortable
                $('#teiDisplayWitnesses').sortable({ 
                    axis: 'x', 
                    stop: function( event, ui ) {
                        var last, current;
                        var count = 0;
                        $('#teiDisplayWitnesses .witness').each(function() {
                            current = $('#teiTexts .text[data-witness-id="' + $(this).attr('data-witness-id') + '"]').remove();
                            if (count != 0) {
                                last.after(current);
                            } else {
                                $('#teiTexts').prepend(current);
                            }
                            last = current;
                            count++;
                        })
                    }
                });

                //Double-click action
                $('#teiDisplayWitnesses .witness').live('dblclick', function() {

                    helpers.makeWitnessActive($(this).attr('data-witness-id'), holder);

                })

            }, 

            makeWitnessActive: function(witnessId, holder) {

                    console.log('1');

                    //Moves a witness to first in the set of texts.

                    var currentText = $('#teiTexts .text[data-witness-id="' + witnessId + '"]');
                    $('#teiTexts').prepend(currentText);
                    var activeElement = $('#teiTexts .text[data-witness-id="' + witnessId + '"] .active:first');
                    var elementHolder = activeElement.parents('.teiTextHolder')

                    helpers.scrollToElement(activeElement, elementHolder, 1);
                   
                    var currentWitness = $('#teiDisplayWitnesses .witness[data-witness-id="' + witnessId + '"]').remove();
                    $('#teiDisplayWitnesses').prepend(currentWitness);

                    helpers.resetTexts(holder);

            },

            textActions: function(holder) {

                //Adds actions to expand texts, display facsimile images, etc.

                //Clear overlays
                $('#teiDisplayFacsimileOverlay, #teiDisplayScreen').live('click', function() {
                    helpers.clearOverlays();
                    $('#teiTexts .text').removeClass('expanded');          
                    return false;
                })

                //Text advance and regress
                $('#teiDisplayTextAdvance').live('click', function() {
                    helpers.advanceText();
                    return false;
                })

                $('#teiDisplayTextRegress').live('click', function() {
                    helpers.regressText();
                    return false;
                })       

                //Annotations
                $('#teiDisplayAnnotationPanel .teiDisplayAnnotation a.close').live('click', function () {
                    helpers.clearOverlays();
                    return false;
                })          

                //Text Expansion
                $('.text .teiDisplayTextActions .expand').live('click', function() {
                    var textParent = $(this).parent().parent();
                    var witnessId = textParent.attr('data-witness-id');
                    helpers.makeWitnessActive(witnessId, holder);
                    helpers.addOverlay();
                    $('#teiTexts').addClass('expanded');
                    textParent.addClass('expanded');
                    $(this).html('-');
                    return false;
                })

                $('.text.expanded .teiDisplayTextActions .expand').live('click', function() {
                    helpers.clearOverlays();
                    $('#teiTexts').removeClass('expanded');
                    $(this).parent().parent().removeClass('expanded');
                    $(this).html('+');
                    return false;                    
                })

                //Facsimiles
                $('.text .tei-pb[data-facs!=""]').live('click', function() {
                    helpers.addFacsimileOverlay($(this).attr('data-facs'), $(this).closest('.text').attr('data-color'));
                    return false;
                })

                $('#teiDisplayFacsimileOverlay .close').live('click', function() {
                    helpers.clearOverlays();
                    return false;
                });

                //Info/Legend/Viz Panel
                $('.teiDisplayPanel .close').live('click', function() {
                    helpers.clearOverlays();
                    return false;
                })

                $('#teiDisplayActions .teiDisplayShowInfo').live('click', function() {
                    if ($('#teiDisplayInfoPanel').hasClass('active')) {
                        helpers.clearOverlays();
                    } else {
                        helpers.clearOverlays();
                        helpers.showInfoPanel();
                    }
                    return false;
                })  

                $('#teiDisplayActions #teiDisplayShowLegend').live('click', function() {
                    if ($('#teiDisplayLegendPanel').hasClass('active')) {
                        helpers.clearOverlays();
                    } else {
                        helpers.clearOverlays();
                        helpers.showLegendPanel();
                    }
                    return false;
                })  

                $('#teiDisplayActions #teiDisplayShowViz').live('click', function() {
                    
                    if ($('#teiDisplayVizPanel').hasClass('active')) {
                        helpers.clearOverlays();
                    } else {
                        helpers.clearOverlays();
                        helpers.showVizPanel();
                    }
                    
                    return false;
                
                })                                                

                //Adds a click event to elements with a data-loc attribute that highlights all elements
                //with that data-loc.
                
                $('.teiTextHolder *[data-loc != "undefined"]').live('click', function() {

                    var identifier = $(this).attr('data-loc');
                    if ($(holder).data('teiDisplay').dev) {
                        $('#teiDisplayDev p').html('loc: ' + identifier);
                    }
                    
                    $('.teiTextHolder .active').removeClass('active');
                    $('#teiDisplayWitnesses .witness').removeClass('active');

                    if (identifier != undefined) {

                        $('.text *[data-loc="' + identifier + '"]').each(function() {

                            console.log('1');

                            $(this).addClass('active');
                            var holder = $(this).parents('.teiTextHolder')
                            var wit = holder.parent().attr('data-witness-id');

                            $('#teiDisplayWitnesses .witness[data-witness-id="' + wit + '"]').addClass('active');

                            helpers.scrollToElement($(this), holder);

                        })

                    }

                    //Annotations
                    var annotation = $(this).children('.teiDisplayAnnotation');

                    if (annotation.length > 0) {
                        helpers.clearAnnotations();
                        helpers.addAnnotation(annotation.attr('data-annotation-text'));
                        helpers.openAnnotationPanel();
                    }

                    else {
                        helpers.clearAnnotations();
                        helpers.closeAnnotationPanel();
                    }
                })

                //Adds a double click event to everything with a data-loc attribute that brings up
                //a panel with the text differences highlighted.
                
                /**
                $('.teiTextHolder *[data-loc != "undefined"]').live('dblclick', function() {

                    helpers.clearOverlays();

                    var identifier = $(this).attr('data-loc');
                    var baseText = $(this).clone().removeAttributes().text();
                    var baseHolder = $(this).parents('.teiTextHolder')
                    var baseWit = baseHolder.parent().attr('data-witness-id');

                    $('.teiTextHolder .active').removeClass('active');
                    $('#teiDisplayWitnesses .witness').removeClass('active');

                    diffPanel = '<div id="teiDisplayDiffPanel" class="teiDisplayPanel"><div style="width: ' + $(this).teiDisplay.settings.textWidth + 'px"><a href="#" class="close">x</a>';

                    $('.text *[data-loc = "' + identifier + '"]').each(function() {

                        $(this).addClass('active');
                        var holder = $(this).parents('.teiTextHolder');
                        var wit = holder.parent().attr('data-witness-id');
                        var compText = $(this).clone().removeAttributes().text();

                        var witPrefix = ''
                        if (wit == baseWit) {
                            witPrefix = 'Base: ';
                        }

                        $('#teiDisplayWitnesses .witness[data-witness-id="' + wit + '"]').addClass('active');
                        var witTitle = $('#teiDisplayWitnesses .witness[data-witness-id="' + wit + '"]').text();

                        helpers.scrollToElement($(this), holder);

                        diffPanel += '<h3>' + witPrefix + witTitle + '</h3>';
                        diffPanel += '<p>' + diffString(baseText, compText) + '</p>';
                        
                    })

                    $(holder).append(diffPanel);

                    helpers.showDiffPanel();

                })**/

            },

            scrollToElement: function(element, holder, duration) {

                //Scrolls the text holder to the specified element

                if ($(element).position()) {

                    var newOffset = $(holder).scrollTop() + $(element).position().top - 200;

                    if (duration == 1) {
                        $(holder).animate({
                            scrollTop: newOffset
                        }, 0);
                    } else {
                        $(holder).animate({
                            scrollTop: newOffset
                        }, 300);                    
                    }

                }

            },

            addAnnotation: function(text) {

                //Removes all annotations from the annotation panel.

                $('#teiDisplayAnnotationPanel').append('<div class="teiDisplayAnnotation">' + text + '<a href="#" class="close">x</a></div>');
            
            },

            clearAnnotations: function() {

                //Removes all annotations from the annotation panel.

                $('#teiDisplayAnnotationPanel .teiDisplayAnnotation').remove();
            
            },

            openAnnotationPanel: function() {

                //Opens the annotation panel.

                $('#teiDisplayAnnotationPanel').show();
            
            }, 

            closeAnnotationPanel: function() {

                //Closes the annotation panel.

                $('#teiDisplayAnnotationPanel').hide();
            
            },   

            clearExpanded: function() {

                $('#teiTexts').removeClass('expanded');
                $('.text').removeClass('expanded');
                $('.teiDisplayTextActions .expand').html('+');
                $('#teiDisplayFacsimileOverlay, #teiDisplayScreen').remove();

            },       

            addFacsimileOverlay: function(imageUrl, color) {
                helpers.clearExpanded();
                helpers.addOverlay();
                $('body').append('<div id="teiDisplayFacsimileOverlay" class="' + color + '"><a href="#" title="Close Facsimile" class="close">x</a><img id="teiDisplayFacsimile" src="' + imageUrl + '" style="width: 200px;"/></div>');
                $('#teiDisplayFacsimile').addimagezoom($(this).teiDisplay.settings.zoomOptions); 
                $('#teiDisplayFacsimileOverlay, #teiDisplayScreen').show();            
            },

            addOverlay: function() {
                $('body').append('<div id="teiDisplayScreen"></div>');
                $('#teiDisplayScreen').show();  
            },

            showInfoPanel: function() { 
                $('#teiDisplayInfoPanel').addClass('active');     
            }, 

            showLegendPanel: function() { 
                $('#teiDisplayLegendPanel').addClass('active');     
            }, 

            showVizPanel: function() { 
                $('#teiDisplayVizPanel').addClass('active');     
            }, 

            showDiffPanel: function() { 
                $('#teiDisplayDiffPanel').addClass('active');     
            },                                     

            clearOverlays: function() {
                $('#teiDisplayFacsimileOverlay, #teiDisplayScreen').remove();   
                $('.featuredimagezoomerhidden, .zoomtracker').remove();
                $('#teiTexts .teiDisplayTextActions a.expand').html('+');  
                $('.teiDisplayPanel').removeClass('active');  
                $('#teiDisplayDiffPanel').remove();    
                helpers.clearExpanded();
                helpers.closeAnnotationPanel();  
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
        height: '',
        fixFirst: true,
        annnotations: '',
        witnesses: '',
        background: '',
        textWidth: 421,
        witHeader: '<div class="teiDisplayTextActions"><a href="#" class="expand">+</a></div>',
        advanceButtons: '<div id="teiDisplayTextAdvance"><div></div></div><div id="teiDisplayTextRegress"><div></div></div>',
        textHolder: '<div id="teiTexts"><div id="screen"></div></div>',
        utility: '<div id="teiDisplayActions"><a href="#" id="teiDisplayShowViz" title="Show Visualization">v</a><a href="#" class="teiDisplayShowInfo" title="Show Information">i</a><div id="teiDisplayWitnesses"></div><div id="notes"></div></div>',
        annotationPanel: '<div id="teiDisplayAnnotationPanel"><div></div></div>',
        zoomOptions: {  
            magnifiersize: [700,630],
            curshade: true
        }

    }

    $.fn.teiDisplay.settings = {}

    $.fn.teiDisplay.internals = {
        currentText: 1,
        totalTexts: 0,
        xml: '',
        xmlData:''
    }

})(jQuery);

jQuery.fn.reverse = [].reverse;



//Remove all attributes from an element. Code from http://stackoverflow.com/questions/1870441/remove-all-attributes

jQuery.fn.removeAttributes = function() {
  return this.each(function() {
    var attributes = $.map(this.attributes, function(item) {
      return item.name;
    });
    var img = $(this);
    $.each(attributes, function(i, item) {
    img.removeAttr(item);
    });
  });
}











// Multi-Zoom Script (c)2012 John Davenport Scheuer
// as first seen in http://www.dynamicdrive.com/forums/
// username: jscheuer1 - This Notice Must Remain for Legal Use
// requires: a modified version of Dynamic Drive's Featured Image Zoomer (w/ adjustable power) (included)

/*Featured Image Zoomer (May 8th, 2010)
* This notice must stay intact for usage 
* Author: Dynamic Drive at http://www.dynamicdrive.com/
* Visit http://www.dynamicdrive.com/ for full source code
*/

// Feb 21st, 2011: Script updated to v1.5, which now includes new feature by jscheuer1 (http://www.dynamicdrive.com/forums/member.php?u=2033) to show optional "magnifying lens" while over thumbnail image.
// March 1st, 2011: Script updated to v1.51. Minor improvements to inner workings of script.
// July 9th, 12': Script updated to v1.5.1, which fixes mouse wheel issue with script when used with a more recent version of jQuery.
// Nov 5th, 2012: Unofficial update to v1.5.1m for integration with multi-zoom (adds multiple images to be zoomed via thumbnail activated image swapping)
// Nov 28th, 2012: Version 2.1 w/Multi Zoom, updates - new features and bug fixes

var featuredimagezoomer = { // the two options for Featured Image Zoomer:
    loadinggif: 'spinningred.gif', // full path or URL to "loading" gif
    magnifycursor: 'crosshair' // value for CSS's 'cursor' property when over the zoomable image
};

    //////////////// No Need To Edit Beyond Here ////////////////

//jQuery.noConflict();

(function($){

    $('head').append('<style type="text/css">.featuredimagezoomerhidden {visibility: hidden!important;}</style>');

    $.fn.multizoomhide = function(){
        return $('<style type="text/css">' + this.selector + ' {visibility: hidden;}<\/style>').appendTo('head');
    };

    $.fn.addmultizoom = function(options){

        var indoptions = {largeimage: options.largeimage}, $imgObj = $(options.imgObj + ':not(".thumbs")'),
        $descArea = $(options.descArea), first = true, splitre = /, ?/;

        options = $.extend({
                speed: 'slow',
                initzoomablefade: true,
                zoomablefade: true
            }, options);

        function loadfunction(){
            var lnk = this, styleobj1 = {}, styleobj2 = {}, $nim, lnkd, lnkt, lnko, w, h;
            if((lnkd = lnk.getAttribute('data-dims'))){
                lnkd = lnkd.split(splitre);
                w = lnkd[0]; h = lnkd[1];
            }
            $(new Image()).error(function(){
                if(lnk.tagName && !options.notmulti){
                    alert("Error: I couldn't find the image:\n\n" + lnk.href + ((lnkt = lnk.getAttribute('data-title'))? '\n\n"' + lnkt + '"' : ''));
                    if((lnko = $imgObj.data('last-trigger'))){
                        first = true;
                        $(lnko).trigger('click');
                    }
                }
            }).load(function(){
                var opacity = $imgObj.css('opacity'), combinedoptions = {}, $parent;
                if(isNaN(opacity)){opacity = 1;}
                if(options.notmulti || !indoptions.largeimage){
                    w = options.width || $imgObj.width(); h = options.height || $imgObj.height();
                }
                $imgObj.attr('src', this.src).css({width: w || options.width || this.width, height: (h = +(h || options.height || this.height))});
                if($imgObj.data('added')) {$imgObj.data('added').remove()};
                $imgObj.data('last-trigger', lnk);
                if(options.imagevertcenter){styleobj1 = {top: ($imgObj.parent().innerHeight() - h) / 2};}
                $imgObj.css(styleobj1).addimagezoom($.extend(combinedoptions, options, indoptions))
                    .data('added', $('.magnifyarea:last' + (combinedoptions.cursorshade? ', .cursorshade:last' : '') + ', .zoomstatus:last, .zoomtracker:last'));
                if(options.magvertcenter){
                    $('.magnifyarea:last').css({marginTop: (h - $('.magnifyarea:last').height()) / 2});
                }
                if(options.descpos){
                    $parent = $imgObj.parent();
                    styleobj2 = {left: $parent.offset().left + ($parent.outerWidth() - $parent.width()) / 2, top: h + $imgObj.offset().top};
                }
                if(options.notmulti){
                    $descArea.css(styleobj2);
                } else {
                    $descArea.css(styleobj2).empty().append(lnk.getAttribute('data-title') || '');
                }
                if(+opacity < 1){$imgObj.add($descArea).animate({opacity: 1}, options.speed);}
            }).attr('src', $imgObj.data('src'));
        }

        this.click(function(e){
            e.preventDefault();
            var src = $imgObj.attr('src'), ms, zr, cs, opacityObj = {opacity: 0};
            if(!first && (src === this.href || src === this.getAttribute('href'))){return;}
            if(first && !options.initzoomablefade || !options.zoomablefade){opacityObj = {};}
            first = false;
            indoptions.largeimage = this.getAttribute('data-large') || options.largeimage || '';
            if(indoptions.largeimage === 'none'){indoptions.largeimage = '';}
            if((ms = this.getAttribute('data-magsize')) || options.magnifiersize){
                indoptions.magnifiersize = (ms? ms.split(splitre) : '') || options.magnifiersize;
            } else {delete indoptions.magnifiersize;}
            indoptions.zoomrange = ((zr = this.getAttribute('data-zoomrange'))? (zr = zr.split(splitre)) : '') || options.zoomrange || '';
            if(zr){zr[0] = +zr[0]; zr[1] = +zr[1];}
            indoptions.cursorshade = ((cs = this.getAttribute('data-lens'))? cs : '') || options.cursorshade || '';
            if(cs){indoptions.cursorshade = eval(cs);}
            $imgObj.data('added') &&
                $imgObj.stop(true, true).data('added').not('.zoomtracker').remove().end()
                    .css({background: 'url(' + featuredimagezoomer.loadinggif + ') center no-repeat'});
            $imgObj.css($.extend({visibility: 'visible'}, ($imgObj.data('added')? options.zoomablefade? {opacity: 0.25} : opacityObj : opacityObj))).data('src', this.href);
            $descArea.css($.extend({visibility: 'visible'}, opacityObj));
            loadfunction.call(this);
        }).eq(0).trigger('click');

        return this;
    };

    // Featured Image Zoomer main code:

    $.extend(featuredimagezoomer, {

        dsetting: { //default settings
                magnifierpos: 'right',
                magnifiersize:[200, 200],
                cursorshadecolor: '#fff',
                cursorshadeopacity: 0.3,
                cursorshadeborder: '1px solid black',
                cursorshade: false,
                leftoffset: 15, //offsets here are used (added to) the width of the magnifyarea when
                rightoffset: 10 //calculating space requirements and to position it visa vis any drop shadow
            },

        isie: (function(){/*@cc_on @*//*@if(@_jscript_version >= 5)return true;@end @*/return false;})(), //is this IE?

        showimage: function($tracker, $mag, showstatus){
            var specs=$tracker.data('specs'), d=specs.magpos, fiz=this;
            var coords=$tracker.data('specs').coords //get coords of tracker (from upper corner of document)
            specs.windimensions={w:$(window).width(), h:$(window).height()}; //remember window dimensions
            var magcoords={} //object to store coords magnifier DIV should move to
            magcoords.left = coords.left + (d === 'left'? -specs.magsize.w - specs.lo : $tracker.width() + specs.ro);
            //switch sides for magnifiers that don't have enough room to display on the right if there's room on the left:
            if(d!=='left' && magcoords.left + specs.magsize.w + specs.lo >= specs.windimensions.w && coords.left - specs.magsize.w >= specs.lo){
                magcoords.left = coords.left - specs.magsize.w - specs.lo;
            } else if(d==='left' && magcoords.left < specs.ro) { //if there's no room on the left, move to the right
                magcoords.left = coords.left + $tracker.width() + specs.ro;
            }
            $mag.css({left: magcoords.left, top:coords.top}).show(); //position magnifier DIV on page
            specs.$statusdiv.html('Current Zoom: '+specs.curpower+'<div style="font-size:80%">Use Mouse Wheel to Zoom In/Out</div>');
            if (showstatus) //show status DIV? (only when a range of zoom is defined)
                fiz.showstatusdiv(specs, 400, 2000);
        },

        hideimage: function($tracker, $mag, showstatus){
            var specs=$tracker.data('specs');
            $mag.hide();
            if (showstatus)
                this.hidestatusdiv(specs);
        },

        showstatusdiv: function(specs, fadedur, showdur){
            clearTimeout(specs.statustimer)
            specs.$statusdiv.css({visibility: 'visible'}).fadeIn(fadedur) //show status div
            specs.statustimer=setTimeout(function(){featuredimagezoomer.hidestatusdiv(specs)}, showdur) //hide status div after delay
        },

        hidestatusdiv: function(specs){
            specs.$statusdiv.stop(true, true).hide()
        },

        getboundary: function(b, val, specs){ //function to set x and y boundaries magnified image can move to (moved outside moveimage for efficiency)
            if (b=="left"){
                var rb=-specs.imagesize.w*specs.curpower+specs.magsize.w
                return (val>0)? 0 : (val<rb)? rb : val
            }
            else{
                var tb=-specs.imagesize.h*specs.curpower+specs.magsize.h
                return (val>0)? 0 : (val<tb)? tb : val
            }
        },

        moveimage: function($tracker, $maginner, $cursorshade, e){
            var specs=$tracker.data('specs'), csw = Math.round(specs.magsize.w/specs.curpower), csh = Math.round(specs.magsize.h/specs.curpower),
            csb = specs.csborder, fiz = this, imgcoords=specs.coords, pagex=(e.pageX || specs.lastpagex), pagey=(e.pageY || specs.lastpagey),
            x=pagex-imgcoords.left, y=pagey-imgcoords.top;
            $cursorshade.css({ // keep shaded area sized and positioned proportionately to area being magnified
                visibility: '',
                width: csw,
                height: csh,
                top: Math.min(specs.imagesize.h-csh-csb, Math.max(0, y-(csb+csh)/2)) + imgcoords.top,
                left: Math.min(specs.imagesize.w-csw-csb, Math.max(0, x-(csb+csw)/2)) + imgcoords.left
            });
            var newx=-x*specs.curpower+specs.magsize.w/2 //calculate x coord to move enlarged image
            var newy=-y*specs.curpower+specs.magsize.h/2
            $maginner.css({left:fiz.getboundary('left', newx, specs), top:fiz.getboundary('top', newy, specs)})
            specs.$statusdiv.css({left:pagex-10, top:pagey+20})
            specs.lastpagex=pagex //cache last pagex value (either e.pageX or lastpagex), as FF1.5 returns undefined for e.pageX for "DOMMouseScroll" event
            specs.lastpagey=pagey
        },

        magnifyimage: function($tracker, e, zoomrange){
            if (!e.detail && !e.wheelDelta){e = e.originalEvent;}
            var delta=e.detail? e.detail*(-120) : e.wheelDelta //delta returns +120 when wheel is scrolled up, -120 when scrolled down
            var zoomdir=(delta<=-120)? "out" : "in"
            var specs=$tracker.data('specs')
            var magnifier=specs.magnifier, od=specs.imagesize, power=specs.curpower
            var newpower=(zoomdir=="in")? Math.min(power+1, zoomrange[1]) : Math.max(power-1, zoomrange[0]) //get new power
            var nd=[od.w*newpower, od.h*newpower] //calculate dimensions of new enlarged image within magnifier
            magnifier.$image.css({width:nd[0], height:nd[1]})
            specs.curpower=newpower //set current power to new power after magnification
            specs.$statusdiv.html('Current Zoom: '+specs.curpower)
            this.showstatusdiv(specs, 0, 500)
            $tracker.trigger('mousemove')
        },

        highestzindex: function($img){
            var z = 0, $els = $img.parents().add($img), elz;
            $els.each(function(){
                elz = $(this).css('zIndex');
                elz = isNaN(elz)? 0 : +elz;
                z = Math.max(z, elz);
            });
            return z;
        },

        init: function($img, options){
            var setting=$.extend({}, this.dsetting, options), w = $img.width(), h = $img.height(), o = $img.offset(),
            fiz = this, $tracker, $cursorshade, $statusdiv, $magnifier, lastpage = {pageX: 0, pageY: 0},
            basezindex = setting.zIndex || this.highestzindex($img);
            if(h === 0 || w === 0){
                $(new Image()).load(function(){
                    featuredimagezoomer.init($img, options);
                }).attr('src', $img.attr('src'));
                return;
            }
            $img.css({visibility: 'visible'});
            setting.largeimage = setting.largeimage || $img.get(0).src;
            $magnifier=$('<div class="magnifyarea" style="position:absolute;z-index:'+basezindex+';width:'+setting.magnifiersize[0]+'px;height:'+setting.magnifiersize[1]+'px;left:-10000px;top:-10000px;visibility:hidden;overflow:hidden;border:1px solid black;" />')
                .append('<div style="position:relative;left:0;top:0;z-index:'+basezindex+';" />')
                .appendTo(document.body) //create magnifier container
            //following lines - create featured image zoomer divs, and absolutely positioned them for placement over the thumbnail and each other:
            if(setting.cursorshade){
                $cursorshade = $('<div class="cursorshade" style="visibility:hidden;position:absolute;left:0;top:0;z-index:'+basezindex+';" />')
                    .css({border: setting.cursorshadeborder, opacity: setting.cursorshadeopacity, backgroundColor: setting.cursorshadecolor})
                    .appendTo(document.body);
            } else { 
                $cursorshade = $('<div />'); //dummy shade div to satisfy $tracker.data('specs')
            }
            $statusdiv = $('<div class="zoomstatus preloadevt" style="position:absolute;visibility:hidden;left:0;top:0;z-index:'+basezindex+';" />')
                .html('<img src="'+this.loadinggif+'" />')
                .appendTo(document.body); //create DIV to show "loading" gif/ "Current Zoom" info
            $tracker = $('<div class="zoomtracker" style="cursor:progress;position:absolute;z-index:'+basezindex+';left:'+o.left+'px;top:'+o.top+'px;height:'+h+'px;width:'+w+'px;" />')
                .css({backgroundImage: (this.isie? 'url(cannotbe)' : 'none')})
                .appendTo(document.body);
            $(window).bind('load resize', function(){ //in case resizing the window repostions the image or description
                    var o = $img.offset(), $parent;
                    $tracker.css({left: o.left, top: o.top});
                    if(options.descpos && options.descArea){
                        $parent = $img.parent();
                        $(options.descArea).css({left: $parent.offset().left + ($parent.outerWidth() - $parent.width()) / 2, top: $img.height() + o.top});
                    }
                });

            function getspecs($maginner, $bigimage){ //get specs function
                var magsize={w:$magnifier.width(), h:$magnifier.height()}
                var imagesize={w:w, h:h}
                var power=(setting.zoomrange)? setting.zoomrange[0] : ($bigimage.width()/w).toFixed(5)
                $tracker.data('specs', {
                    $statusdiv: $statusdiv,
                    statustimer: null,
                    magnifier: {$outer:$magnifier, $inner:$maginner, $image:$bigimage},
                    magsize: magsize,
                    magpos: setting.magnifierpos,
                    imagesize: imagesize,
                    curpower: power,
                    coords: getcoords(),
                    csborder: $cursorshade.outerWidth(),
                    lo: setting.leftoffset,
                    ro: setting.rightoffset
                })
            }

            function getcoords(){ //get coords of thumb image function
                var offset=$tracker.offset() //get image's tracker div's offset from document
                return {left:offset.left, top:offset.top}
            }

            $tracker.mouseover(function(e){
                        $cursorshade.add($magnifier).add($statusdiv).removeClass('featuredimagezoomerhidden');
                        $tracker.data('premouseout', false);
                }).mouseout(function(e){
                        $cursorshade.add($magnifier).add($statusdiv.not('.preloadevt')).addClass('featuredimagezoomerhidden');
                        $tracker.data('premouseout', true);
                }).mousemove(function(e){ //save tracker mouse position for initial magnifier appearance, if needed
                    lastpage.pageX = e.pageX;
                    lastpage.pageY = e.pageY;
                });

            $tracker.one('mouseover', function(e){
                var $maginner=$magnifier.find('div:eq(0)')
                var $bigimage=$('<img src="'+setting.largeimage+'"/>').appendTo($maginner)
                var largeloaded = featuredimagezoomer.loaded[$('<a href="'+setting.largeimage+'"></a>').get(0).href];
                var showstatus=setting.zoomrange && setting.zoomrange[1]>setting.zoomrange[0]
                var imgcoords=getcoords()
                if(!largeloaded){
                    $img.stop(true, true).css({opacity:0.1}) //"dim" image while large image is loading
                    $statusdiv.css({left:imgcoords.left+w/2-$statusdiv.width()/2, top:imgcoords.top+h/2-$statusdiv.height()/2, visibility:'visible'})
                }
                $bigimage.bind('loadevt', function(event, e){ //magnified image ONLOAD event function (to be triggered later)
                    if(e.type === 'error'){
                        $img.css({opacity: 1}).data('added').remove();
                        var src = $('<a href="' + $bigimage.attr('src') + '"></a>').get(0).href;
                        if(window.console && console.error){
                            console.error('Cannot find Featured Image Zoomer larger image: ' + src);
                        } else {
                            alert('Cannot find Featured Image Zoomer larger image:\n\n' + src);
                        }
                        return;
                    }
                    featuredimagezoomer.loaded[this.src] = true;
                    $img.css({opacity:1}) //restore thumb image opacity
                    $statusdiv.empty().css({border:'1px solid black', background:'#C0C0C0', padding:'4px', font:'bold 13px Arial', opacity:0.8}).hide().removeClass('preloadevt');
                    if($tracker.data('premouseout')){
                        $statusdiv.addClass('featuredimagezoomerhidden');
                    }
                    if (setting.zoomrange){ //if set large image to a specific power
                        var nd=[w*setting.zoomrange[0], h*setting.zoomrange[0]] //calculate dimensions of new enlarged image
                        $bigimage.css({width:nd[0], height:nd[1]})
                    }
                    getspecs($maginner, $bigimage) //remember various info about thumbnail and magnifier
                    $magnifier.css({display:'none', visibility:'visible'})
                    $tracker.mouseover(function(e){ //image onmouseover
                        $tracker.data('specs').coords=getcoords() //refresh image coords (from upper left edge of document)
                        fiz.showimage($tracker, $magnifier, showstatus)
                    })
                    $tracker.mousemove(function(e){ //image onmousemove
                        fiz.moveimage($tracker, $maginner, $cursorshade, e)
                    })
                    if (!$tracker.data('premouseout')){
                        fiz.showimage($tracker, $magnifier, showstatus);
                        fiz.moveimage($tracker, $maginner, $cursorshade, lastpage);
                    }
                    $tracker.mouseout(function(e){ //image onmouseout
                        fiz.hideimage($tracker, $magnifier, showstatus)
                    }).css({cursor: fiz.magnifycursor});
                    if (setting.zoomrange && setting.zoomrange[1]>setting.zoomrange[0]){ //if zoom range enabled
                        $tracker.bind('DOMMouseScroll mousewheel', function(e){
                            fiz.magnifyimage($tracker, e, setting.zoomrange);
                            e.preventDefault();
                        });
                    } else if(setting.disablewheel){
                        $tracker.bind('DOMMouseScroll mousewheel', function(e){e.preventDefault();});
                    }
                })  //end $bigimage onload
                if ($bigimage.get(0).complete){ //if image has already loaded (account for IE, Opera not firing onload event if so)
                    $bigimage.trigger('loadevt', {type: 'load'})
                }
                else{
                    $bigimage.bind('load error', function(e){$bigimage.trigger('loadevt', e)})
                }
            })
        },

        iname: (function(){var itag = $('<img />'), iname = itag.get(0).tagName; itag.remove(); return iname;})(),

        loaded: {},

        hashre: /^#/
    });

    $.fn.addimagezoom = function(options){
        var sel = this.selector, $thumbs = $(sel.replace(featuredimagezoomer.hashre, '.') + '.thumbs a');
        options = options || {};
        if(options.multizoom !== null && ($thumbs).size()){
            $thumbs.addmultizoom($.extend(options, {imgObj: sel, multizoom: null}));
            return this;
        } else if(options.multizoom){
            $(options.multizoom).addmultizoom($.extend(options, {imgObj: sel, multizoom: null}));
            return this;
        } else if (options.multizoom !== null){
            return this.each(function(){
                if (this.tagName !== featuredimagezoomer.iname)
                    return true; //skip to next matched element
                $('<a href="' + this.src + '"></a>').addmultizoom($.extend(options, {imgObj: sel, multizoom: null, notmulti: true}));
            });
        }
        return this.each(function(){ //return jQuery obj
            if (this.tagName !== featuredimagezoomer.iname)
                return true; //skip to next matched element
            featuredimagezoomer.init($(this), options);
        });
    };

})(jQuery);





/*
 * Javascript Diff Algorithm
 *  By John Resig (http://ejohn.org/)
 *  Modified by Chu Alan "sprite"
 *
 * Released under the MIT license.
 *
 * More Info:
 *  http://ejohn.org/projects/javascript-diff-algorithm/
 */

function escape(s) {
    var n = s;
    n = n.replace(/&/g, "&amp;");
    n = n.replace(/</g, "&lt;");
    n = n.replace(/>/g, "&gt;");
    n = n.replace(/"/g, "&quot;");

    return n;
}

function diffString( o, n ) {
  o = o.replace(/\s+$/, '');
  n = n.replace(/\s+$/, '');

  var out = diff(o == "" ? [] : o.split(/\s+/), n == "" ? [] : n.split(/\s+/) );
  var str = "";

  var oSpace = o.match(/\s+/g);
  if (oSpace == null) {
    oSpace = ["\n"];
  } else {
    oSpace.push("\n");
  }
  var nSpace = n.match(/\s+/g);
  if (nSpace == null) {
    nSpace = ["\n"];
  } else {
    nSpace.push("\n");
  }

  if (out.n.length == 0) {
      for (var i = 0; i < out.o.length; i++) {
        str += '<del>' + escape(out.o[i]) + oSpace[i] + "</del>";
      }
  } else {
    if (out.n[0].text == null) {
      for (n = 0; n < out.o.length && out.o[n].text == null; n++) {
        str += '<del>' + escape(out.o[n]) + oSpace[n] + "</del>";
      }
    }

    for ( var i = 0; i < out.n.length; i++ ) {
      if (out.n[i].text == null) {
        str += '<ins>' + escape(out.n[i]) + nSpace[i] + "</ins>";
      } else {
        var pre = "";

        for (n = out.n[i].row + 1; n < out.o.length && out.o[n].text == null; n++ ) {
          pre += '<del>' + escape(out.o[n]) + oSpace[n] + "</del>";
        }
        str += " " + out.n[i].text + nSpace[i] + pre;
      }
    }
  }
  
  return str;
}

function randomColor() {
    return "rgb(" + (Math.random() * 100) + "%, " + 
                    (Math.random() * 100) + "%, " + 
                    (Math.random() * 100) + "%)";
}
function diffString2( o, n ) {
  o = o.replace(/\s+$/, '');
  n = n.replace(/\s+$/, '');

  var out = diff(o == "" ? [] : o.split(/\s+/), n == "" ? [] : n.split(/\s+/) );

  var oSpace = o.match(/\s+/g);
  if (oSpace == null) {
    oSpace = ["\n"];
  } else {
    oSpace.push("\n");
  }
  var nSpace = n.match(/\s+/g);
  if (nSpace == null) {
    nSpace = ["\n"];
  } else {
    nSpace.push("\n");
  }

  var os = "";
  var colors = new Array();
  for (var i = 0; i < out.o.length; i++) {
      colors[i] = randomColor();

      if (out.o[i].text != null) {
          os += '<span style="background-color: ' +colors[i]+ '">' + 
                escape(out.o[i].text) + oSpace[i] + "</span>";
      } else {
          os += "<del>" + escape(out.o[i]) + oSpace[i] + "</del>";
      }
  }

  var ns = "";
  for (var i = 0; i < out.n.length; i++) {
      if (out.n[i].text != null) {
          ns += '<span style="background-color: ' +colors[out.n[i].row]+ '">' + 
                escape(out.n[i].text) + nSpace[i] + "</span>";
      } else {
          ns += "<ins>" + escape(out.n[i]) + nSpace[i] + "</ins>";
      }
  }

  return { o : os , n : ns };
}

function diff( o, n ) {
  var ns = new Object();
  var os = new Object();
  
  for ( var i = 0; i < n.length; i++ ) {
    if ( ns[ n[i] ] == null )
      ns[ n[i] ] = { rows: new Array(), o: null };
    ns[ n[i] ].rows.push( i );
  }
  
  for ( var i = 0; i < o.length; i++ ) {
    if ( os[ o[i] ] == null )
      os[ o[i] ] = { rows: new Array(), n: null };
    os[ o[i] ].rows.push( i );
  }
  
  for ( var i in ns ) {
    if ( ns[i].rows.length == 1 && typeof(os[i]) != "undefined" && os[i].rows.length == 1 ) {
      n[ ns[i].rows[0] ] = { text: n[ ns[i].rows[0] ], row: os[i].rows[0] };
      o[ os[i].rows[0] ] = { text: o[ os[i].rows[0] ], row: ns[i].rows[0] };
    }
  }
  
  for ( var i = 0; i < n.length - 1; i++ ) {
    if ( n[i].text != null && n[i+1].text == null && n[i].row + 1 < o.length && o[ n[i].row + 1 ].text == null && 
         n[i+1] == o[ n[i].row + 1 ] ) {
      n[i+1] = { text: n[i+1], row: n[i].row + 1 };
      o[n[i].row+1] = { text: o[n[i].row+1], row: i + 1 };
    }
  }
  
  for ( var i = n.length - 1; i > 0; i-- ) {
    if ( n[i].text != null && n[i-1].text == null && n[i].row > 0 && o[ n[i].row - 1 ].text == null && 
         n[i-1] == o[ n[i].row - 1 ] ) {
      n[i-1] = { text: n[i-1], row: n[i].row - 1 };
      o[n[i].row-1] = { text: o[n[i].row-1], row: i - 1 };
    }
  }
  
  return { o: o, n: n };
}



