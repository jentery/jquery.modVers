# jquery.modVers Documentation

Plugin and documentation by [Daniel Carter][1] ([carter.daniel.w@gmail.com][2]) 

### About this plugin

### About the Text Encoding Initiative

The [Text Encoding Initiative][9] (TEI) is an organization that maintains a set of guidelines for encoding textual documents for research and preservation. The most recent version of the guidelines, P5, describe an XML schema that can be used to semantically represent texts in digital form; additionally, using the guidelines' [critical apparatus module][10], editors can encode information about multiple versions of a text. This plugin allows texts encoded using the [parallel segmentation method][11] to be embedded in an HTML page. 

### Preparing TEI files

TEI files to be displayed using this plugin should: 

*   **contain a [][12] element.** The  element describes the witnesses that are included in the TEI file. Each  element should include an xml:id attribute that identifies the witness. Example: 
    
        
                <listWit>
                  <witness xml:id="v1">First Version</witness>
                  <witness xml:id="v2">Second Version</witness>
                  <witness xml:id="v3">Third Version</witness>
                </listWit>
                        
                    

*   **encode textual variants using the [parallel segmentation method][11].** 
    
        
                <l>
                  The
                  <app>
                    <rdg wit="v1">cow</rdg>
                    <rdg wit="v2">cat</rdg>
                    <rdg wit="v3">horse</rdg>
                  </app>
                  jumped over the moon.
                </l>
                        
                    
    
    Note: this plugin does not currently support the  element. 

*   **wrap text to be displayed in a  tag.** 
        
                <div>
                  <l>The cow jumped over the moon.</l>
                  <l>The fork ran away with the spoon.</l>
                </div>
                        
                      

### Basic Usage

1.  **Include jquery.modVers.css in your document's head.** 
    
        
                      

2.  **Include jQuery.**
    
        
                    

3.  **Include jQuery.modVers.js.**
    
        
                    

4.  **Create an element that will hold the interface.** 
    
        
                    

5.  **Specify TEI files and other options.** This will usually be done within a $(document).ready function. 
    
              $('#teiHolder').data('modVers', {
                xmlFile: 'data/yourTeiFile.xml'
              });
                    
    
    See also [Options][7] below. 

6.  **Call the modVers function.** This will create an interface for the TEI file specified in the previous step in the element specified. 
    
              $('#tei').modVers(); 
                    

### Options

The interface created by this plugin can be modified using the following options, specified as follows: 

              $('#teiHolder').data('modVers', {
                annotations: 'data/annotations.json',
                dev: true,
                fixFirst: false,
                fullscreen: false,
                height: 300,
                highlights: 'data/highlights.json',
                locs: 'a,b,c',    
                witnesses: 'v1,v2',
                xmlFile: 'data/yourTeiFile.xml'
              });
          

*   **annotations**: Specifies a JSON file that contains annotations for the displayed TEI file. The JSON file should adhere to the following structure: 
    
        "annotations": {
                        "items": [
                            {
                                "loc": "a", //Specifies the element the annotation should be applied to.
                                "wit": "v1,v2", //Specifies, using a comma-separated list, the witnesses the annotation should be applied to. If the annotation should be applied across all witnesses, do not include this attribute.
                                "text": "This is the text of the annotation." 
                            },
                            {
                                "loc": "f",
                                "text": "This annotation will be applied across all witnesses."
                            }
                        ]
                    }
                  

*   **dev**: If set to true, the interface will display the loc attribute of elements when they are clicked on. Defaults to false. 

*   **fixFirst**: If set to true, the panel holding the first witness will remain fixed in place, and other panels will slide behind it. If set to false, all panel will slide. If the fullscreen option is set to false, this option will also be false. Defaults to true. 

*   **fullscreen**: If set to true, the interface will take up the entire screen. If set to false, the interface will be confined to the dimensions of its holder element. Defaults to true. 

*   **highlights**: Specifies a JSON file that can be used to highlight regions of the text. If this option is included, a legend will also be generated as part of the interface. The JSON file should adhere to the following structure: 
    
        "highlights": {
                        "items": [
                            {
                                "loc": "a,b,c", //Specifies the elements to be highlighted.
                                "description": "Description of the highlighted text." // Provides a description of the highlighted text. This information will be displayed in the legend.
                            },
                            {
                                "loc": "t,u,ff,gg,hh",
                                "description": "Free-indirect speech"
                            },
                        ]
                    }
                  

*   **locs**: Specifies the elements to be included in the interface. If this option is not included, all the elements from the TEI document will be included. 

*   **witnesses**: Specifies the witnesses to be included in the interface. If this option is not included, all the witnesses from the TEI document will be included. 

*   **xmlFile**: Specifies the TEI file to be displayed. 

 [1]: http://holden.ischool.utexas.edu/www.daniel.inletters.com
 [2]: mailto:carter.daniel.w%40gmail.com
 [9]: http://www.tei-c.org/
 [10]: http://www.tei-c.org/release/doc/tei-p5-doc/en/html/TC.html
 [11]: http://www.tei-c.org/release/doc/tei-p5-doc/en/html/TC.html#TCAPPS
 [12]: http://www.tei-c.org/release/doc/tei-p5-doc/en/html/ref-listWit.html  