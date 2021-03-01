	/*! reasonable footnotes v0.3.0 | MIT License | https://github.com/matthewhowell/reasonable-footnotes */
	var reasonable_footnotes = (function () {
		// reasonable footnotes will not work properly in Internet Explorer 11 and below
		// detect IE browsers and exit
		// since reasonable footnotes only exists to enhance existing footnotes
		// IE users will still be able to access the original footnotes
		// exiting here avoids unnecessary JS execution and likely errors
		if (window.navigator.userAgent.match(/MSIE|Trident/) !== null) {
			return false;
		}

		// private methods and properties
		let rfn = {};

		// public methods and properties
		let exports = {};
		
		// reasonable footnotes version 0.4.0
		exports.version = '0.4.0';
	
		// default config settings
		// each of these values can be overwritten when instantiating reasonable footnotes
		// by passing an object literal with alternative values
		exports.config = {
				
			// footnoteButtonText
			// define the text for the footnote button
			// default: original
			// original: uses the original footnote link text
			// number: uses the footnote number
			// ellipsis: uses an ellipsis
			footnoteButtonText: 'original',
	
			// openFootnoteButtonText
			// define the text for the footnote button in the open state
			// default: '•'
			openFootnoteButtonText: '•',
			
			// escapeKeyClosesFootnotes
			// default: true
			// true: when the escape key is pressed, all open footnotes will be closed
			// false: no action bound to the escape key
			keyClosesFootnotes: true,
			
			// closeFootnotesKeyCode
			// default: 27
			// any other reasonable keycode
			closeFootnotesKeyCode: 27,
	
	
			// hideOriginalFootnotes
			// default: true
			// true: removes the original footnotes from the page, still allows printing
			// false: leaves the original footnotes on the page
			hideOriginalFootnotes: true,
	
			// removeFootnoteBacklinks
			// footnote backlinks are defined as any <a> element that includes
			// footnoteBacklinkClass (defined below)
			// default: true
			// true: remove all footnote backlinks
			// false: leave all footnote backlinks
			removeFootnoteBacklinks: true,
			
			// alwaysVisibleForReduceMotion
			// allow the 'prefers-reduced-motion' media query to dictate footnote behavior
			// this respects the person's OS setting
			// normal footnote open includes a small button animation and a document reflow
			// leaving this set to true will remove these two 'motions'
			// default: true
			// true: footnotes will always be visible, open state
			// false: allow normal footnote open/close behaviors
			alwaysVisibleForReduceMotion: true,
			
			// existing markup details, example below
				/*
				<article>
					<p>Some text. <a href="#fn:1" class="footnote">This is a link to Footnote 1</a></p>
					<footer class="footnotes">
						<dt>1</dt>
						<dd id="fn:1">
							This is an example of expected footnote content markup.
							<a href="#fnref:1" class="reversefootnote">↩︎︎</a>
						</dd>
					</footer>
				</article>
				*/
				
				// footnoteLinkClass
				// used to identify all existing footnote links
				// either add this class to all footnote links
				// or override with an existing class that is already applied to those links
				footnoteLinkClass: 'footnote',
		
				// footnoteLinkPrefix
				// in this case, the footnoteLinkPrefix is "fn:"
				// to obtain a footnoteLinkPrefix, simple identify a footnote link
				// and remove the unique id (usually just a number) from the href
				footnoteLinkPrefix: '#fn:',
		
				// footnoteContentPrefix
				footnoteContentPrefix: 'fn:',
		
				// footnoteBacklinkClass
				// class that identifies footnote backlinks
				// for the purposes of removal
				footnoteBacklinkClass: 'reversefootnote',
		
				// footnoteContainerClass
				// used to hide a container element of footnotes
				footnoteContainerClass: 'footnotes',
	
			// generated markup details
			// the included css rules depend on these classes
			rfnContainerClass: 'rfn-inline-container',
			rfnButtonClass: 'rfn-button',
			rfnSpanClass: 'rfn-content',
			
			// define where the footnote will be displayed when open
			// previously, this accepted 'top' and 'bottom' values
			// no more, for now, inline only
			// default: inline
			// inline: displays the footnote in the flow of the text, reflow when opened/closed
			display: 'inline',
	
			// allowMultipleOpenFootnotes
			// only works for inline display, bottom display is always single footnote open
			// default: true
			// true: allows multiple footnotes to be in open state
			// false: allows only a single footnotes to be in the open state
			allowMultipleOpenFootnotes: true,
			
		};
	
		// return the current, internal next rfnId
		// this can be thought of as the uuid for footnotes within the entire document
		exports.getRfnId = function () {
			return rfn.rfnId;
		};
	
		// a reasonable beginning footnotes rfnId
		// needs to be an integer
		rfn.rfnId = 1;
	
		// increment the rfnid
		// returns the new rfnid
		rfn.incrementRfnId = function () {
			rfn.rfnId++;
			return rfn.rfnId;
		};
	
		// key handler to close open footnotes
		rfn.closeKeyHandler = function (event) {
			event = event || window.event;
			// if keydown event was triggered by defined close key
			if (event.keyCode == exports.config.closeFootnotesKeyCode) {
				// close all open inline footnotes
				closeAllFootnotes();
			}
		};

		// determine if the	'prefers-reduced-motion' media query is returning the 'reduce' value
		// this will change the behavior of reasonable footnotes
		rfn.reduceMotionMediaQuery = function () {
			const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
			if (mediaQuery.matches === true) {
				return true;
			}
			return false;
		}

		// returns collection of footnote links
		// this is primary unit that we operate on
		// assume footnote links to element that will contain the footnote content
		rfn.getFootnoteLinks = function () {
			return document.getElementsByClassName(exports.config.footnoteLinkClass);
		};
	
		// return a string with a prefix is removed
		// ("prefixexamplestring", "prefix") -> "examplestring"
		rfn.getStringSuffix = function (string, stringPrefix) {
			return string.substring(stringPrefix.length, string.length);
		};
	
		// close a single footnote element
		const closeFootnote = function (element) {
	
			const noteNumber = rfn.getStringSuffix(element.getAttribute('id'), 'rfn-content-');
	
			const button = document.getElementById('rfn-button-' + noteNumber);
			
			// https://www.w3.org/TR/2017/REC-wai-aria-1.1-20171214/#aria-expanded
			button.setAttribute('aria-expanded', 'false');
			button.classList.remove('open');
			// button.innerText = button.getAttribute('data-text');

			// remove visible class to hide footnote element
			element.classList.remove('visible');
		};
	
		// close all open inline footnotes
		const closeAllFootnotes = function () {
			// find all open inline footnotes
			const openFootnotesSelector = '.' + exports.config.rfnSpanClass + '.visible';
			const openFootnotes = document.querySelectorAll(openFootnotesSelector);
			for (let ofn of openFootnotes) {
				closeFootnote(ofn);
			}
		};

		// return the note number from a footnote element
		const getNoteNumber = function (footnoteLinkElement) {
			return rfn.getStringSuffix(footnoteLinkElement.getAttribute('href'), exports.config.footnoteLinkPrefix);
		}
		
		// remove all footnote backlink elements from document
		const removeFootnoteBacklinks = function () {
			const footnoteBacklinks = document.getElementsByClassName(
				exports.config.footnoteBacklinkClass
			);
			while (footnoteBacklinks.length > 0) {
				footnoteBacklinks[0].remove();
			}
		};

		// insert parent element before child element
			// then append child element to parent element
		const wrapChildElement = function (childElement, parentElement) {
			childElement.insertAdjacentElement('beforebegin', parentElement);
			parentElement.appendChild(childElement);
		};
	
		const openFootnoteButton = function (footnoteButton) { 
			footnoteButton.setAttribute('data-text', footnoteButton.innerText);
			footnoteButton.classList.add('open');

			// footnoteButton.innerText = exports.config.openFootnoteButtonText;
			
			// toggle aria-expanded
			// https://atomiks.github.io/tippyjs/v6/accessibility/
			footnoteButton.setAttribute('aria-expanded', 'true');
		}
		
		// open a single footnote
		const openFootnote = function (span, button) {
			span.classList.add('visible');			
			openFootnoteButton(button);
		};
	
		// add an element to the DOM
		// @element the type of HTML element
		// @parentElementId the ID of the preceding HTML element
		// @label (optional) text to be wrapped in a label span
		// @content (optional) the text content of the element
		const addFootnoteElement = function (parentElementId, label, content) {
			// create new element
			const newFootnoteContent = document.createElement('span');
	
			// use markup from original footnote
			newFootnoteContent.innerHTML = content;
	
			newFootnoteContent.classList.add(exports.config.rfnSpanClass);
				
			newFootnoteContent.setAttribute('id', 'rfn-content-' + label);
	
			const buttonElement = document.getElementById('rfn-button-' + label);
	
			const parentElement = document.getElementById(parentElementId);
	
			if (parentElement) {
				parentElement.appendChild(newFootnoteContent);
				return newFootnoteContent;
			} else {
				return false;
			}
		};
	
		// initialize reasonable footnotes
		// @config {} allows an object literal of config overrides
		exports.init = function (config) {

			// allow override config settings
			Object.assign(exports.config, config);
	
			// find all footnote links on the page
			const footnoteLinks = rfn.getFootnoteLinks();
	
			// find footnote content container
			const footnotesContainer = document.getElementsByClassName(exports.config.footnoteContainerClass);
	
			// loop through the footnote containers on the page
			// supports multiple footnotes containers, for now
			for (let fnc of footnotesContainer) {
				const footnoteLocationLinks = fnc.querySelectorAll('a.' + exports.config.footnoteBacklinkClass);
				
				// each footnote location link
				for (let fnll of footnoteLocationLinks) {
					fnll.remove();
				}
	
				// optionally hide each footnote section
				if (exports.config.hideOriginalFootnotes) {
					// apply print-only class which will allow these to be printed
					// but hide them from the document
					fnc.classList.add('print-only');
				}
			} // footnote container loop
	
			// loop through footnote links and construct inline elements
			for (let fnl of footnoteLinks) {
				
				// the current note
				const note = {};
				
				// TODO move all note elements into object
				// Note.init() or something
				
				// get the current rfnid, unique within the page
				note.id = exports.getRfnId();
				rfn.incrementRfnId();
	
				// the note number is defined as:
				// the href of the note link with the footnoteLinkPrefix removed
				note.number = getNoteNumber(fnl);
	
				// remove the href attribute
				fnl.removeAttribute('href');
				
				// add link title
				fnl.setAttribute('title', 'Footnote ' + note.number);
				
				// move the link text, this will be move into the button
				const originalLinkText = fnl.innerText;
				fnl.innerText = '';
	
				// create container for the inline footnote
				const newNoteContainer = document.createElement('span');
				newNoteContainer.classList.add(exports.config.rfnContainerClass);
							
				if (exports.config.alwaysVisibleForReduceMotion && rfn.reduceMotionMediaQuery()) {
					newNoteContainer.classList.add('reduced-motion');
				}
				
				newNoteContainer.setAttribute(
					'id',
					'rfn-inline-container-' + note.number
				);
				newNoteContainer.setAttribute('data-rfn-id', note.id);
	
				// move original footnote link into the new container
				wrapChildElement(fnl, newNoteContainer);
	
				// create button for inline footnotes
				// buttons are used because because they're natively focusable elements
				const newNoteButton = document.createElement('button');
				newNoteButton.classList.add(exports.config.rfnButtonClass);
				newNoteButton.setAttribute('id', 'rfn-button-' + note.number);
				newNoteButton.setAttribute(
					'aria-describedby',
					'rfn-content-' + note.number
				);
				newNoteButton.setAttribute('aria-expanded', 'false');
	
				// we explicitly set the tabindex, which ensures keyboard focus and click
				newNoteButton.setAttribute('tabindex', '0');
	
				// assume original link text
				let buttonText = originalLinkText;
	
				// allow button text to be overridden by config values
				if (exports.config.footnoteButtonText == 'ellipsis') {
					// use ellipsis
					buttonText = '…';
				} else if (exports.config.footnoteButtonText == 'number') {
					// use the current note number
					buttonText = note.number;
				}
	
				// set the button text of the new note button
				newNoteButton.innerText = buttonText;
	
				// append the new note button element to the footnote link
				fnl.appendChild(newNoteButton);
	
				// gather the footnote content from the original content element
				const footnoteContentId = exports.config.footnoteContentPrefix + note.number;
				const noteContent = document.getElementById(footnoteContentId);
	
				// create the new footnote content element
				const newNoteSpan = addFootnoteElement(
					'rfn-inline-container-' + note.number,
					note.number,
					noteContent.innerHTML
				);
	
				// add id to footnote span element
				newNoteSpan.setAttribute('id', 'rfn-content-' + note.number);
				
				// https://www.digitala11y.com/note-role/
				newNoteSpan.setAttribute('role', 'note');
				newNoteSpan.classList.add(exports.config.display);
				newNoteSpan.setAttribute('tabindex', '0');
	
				// create the buttonClickHandler function for each button
				const buttonClickHandler = function (e, button) {
					note.number = rfn.getStringSuffix(button.getAttribute('id'), 'rfn-button-');
					note.span = document.getElementById('rfn-content-' + note.number);
					note.isOpen = note.span.classList.contains('visible');
	
					// if open, close our footnote and exit
					if (note.isOpen) {
						closeFootnote(note.span);
						return;
					}
	
					// OR the clicked note is currently not open
	
					// optionally, close all other open footnotes
					if (exports.config.allowMultipleOpenFootnotes === false) {
						closeAllFootnotes();
					}
	
					// then open the clicked footnote
					openFootnote(note.span, button);
				};
	
				// add onclick event to each footnote button
				newNoteButton.onclick = function (e) {
					if (exports.config.alwaysVisibleForReduceMotion && rfn.reduceMotionMediaQuery() ) {
						// reduce motion by eliminating the onclick handler
						// open 
						return;						
					}
					buttonClickHandler(e, this);
				};
			} // footnote link loop
	
			// remove footnote backlinks elements
			if (exports.config.removeFootnoteBacklinks) {
				removeFootnoteBacklinks();
			}
	
			// on close keydown, close all open footnotes
			if (exports.config.keyClosesFootnotes) {
				document.addEventListener('keydown', rfn.closeKeyHandler);
			}
		};
	
		return exports;
	})();
