/* Author: Daniel Carter

*/

$(document).ready(function(){

	$('#tei-1').teiDisplay({
		xmlFile: 'data/filmballad.xml',
		annotations: 'data/annotations.json',
		//witnesses: 'v4n8,v4n11',
		background: 'tei-type-filmic, tei-type-pulp'
	});	

	$('#tei-single').teiDisplay({
		xmlFile: 'data/orchardFarming.xml',
		fixFirst: false,
		height: 500,
		//annotations: 'data/annotations.json',
		//witnesses: 'v4n8,v4n11',
		//background: 'tei-type-filmic, tei-type-pulp'
	});		

})//onReady

