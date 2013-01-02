/* Author: Daniel Carter

*/

$(document).ready(function(){

	$('#tei-1').data('teiDisplay', {
		xmlFile: 'data/filmballad.xml',
		annotations: 'data/annotations.json',
		highlights: 'data/annotations.json',
		//witnesses: 'v4n8,v4n11',
		//fixFirst: true
		//dev: true
	});

	$('#tei-1').teiDisplay({
	});	



	$('#tei-single').data('teiDisplay', {
		xmlFile: 'data/filmballad.xml',
		fixFirst: false,
		height: 500,
		annotations: 'data/annotations.json',
		//highlights: 'data/annotations.json',		
		//witnesses: 'v4n8,v4n11',
		//background: 'tei-type-filmic, tei-type-pulp'
	});

	$('#tei-single').teiDisplay();		

})//onReady

