// key    11eaa2ee2ebb78f1cfb25971ad39c74d

// url https://api.nytimes.com/svc/search/v2/articlesearch.json"
// params: apikey, q (search term)

//Step 1: setting a global variable for shorthand document.querySelector
var qs = function(input) {
	return document.querySelector(input)
}


//This is our Backbone Collection, which handles the multiple articles we have on the front page after searching.
var NewsCollection = Backbone.Collection.extend({						// Create Backbone Collection.
	url: 'https://api.nytimes.com/svc/search/v2/articlesearch.json',	// Pass in URL as one key.
	_key: '11eaa2ee2ebb78f1cfb25971ad39c74d',							// Pass in _key(APIkey) as another key.
	parse: function(rawJSON) {											// Parse is reserved. Takes in JSON.
		//takes as input the raw response. use parse if you need to 
		//drill down and find the array that you want to use as your
		//array of models. return that array. it will get stored on the
		// .models property of the collection.
		return rawJSON.response.docs 									// Returns data, drilled down into response
	}																	// and then further into docs. Best way to 
})																		// determine is to console log the data
																		// and look where you need to go.

// This is our Backbone Model, which handles the data for the individual article detail.
var NewsModel = Backbone.Model.extend({								 // Create Backbone Model.
	url: 'https://api.nytimes.com/searchvc/search/v2/articlesearch.json', // Pass in URL as one key.
	_key: '11eaa2ee2ebb78f1cfb25971ad39c74d',						 // Pass in _key(APIkey) as another key.
	parse: function(rawJSON){										 // Parse is reserved. Takes in JSON.
		// console.log(rawJSON)
		return rawJSON.response.docs[0]								 // Returns data, drilled into data.response.docs
	}																 // [0]. Why [0]? Docs is an array, not an object
})																	 // ,so you have to drill down via []  


// This is our Backbone View to render our Collection to the page.
var NewsView = Backbone.View.extend({								// Create Backbone View.
	// the el property is the DOM node that will contain the view (exclusively)
	el: qs('#container'),

	// keys have the form "<event type> <selector>". values are event handlers.
	// the handler will be assigned to EVERY node matching the selector. 
	// pretty darn convenient! 

	// note that this will only work if the view has an .el property. the <selector>
	// is sought WITHIN the view's .el 

	// i.e., the events are assigned to node's contained within the view. 
	// backbone can only know WHAT is within the view, if it knows what element
	// will contain the view.
	events: {
		"click .snippetContainer": "_handleClick"
	},

	initialize: function(coll) {							
															// Reserved keyword, runs first. Takes in collection.
															// Input to initialize
															// is the input passed in to the constructor with 
															//`new NewsView(INPUT_COLLECTION)`
		var thisView = this 								// Training wheels. Don't need - simply setting
															// "this" equal to a variable, to be used on bind Fn	
		// add the input collection as a property on the view, 
		// so that it can be accessed from anywhere on the 
		// view object. 
		this.coll = coll

		// subscribe to the "sync" event on the view's collection, so that
		// as soon as the collection gets data, the view will automatically render.
		var boundRender = this._render.bind(thisView)		
		this.coll.on('sync',boundRender)
	},
		// Per the .events property defined above, the below function will run when any element with the class
		// .snippet is clicked. I.E. when you click on element "snippet", 
		// it triggers this function. Takes in an eventObj, and sets the URL to be detail/"the individual data-
		// attribute ID of the eventObj's target".
	_handleClick: function(e) {
		var articleDiv = e.target
		window.articleDiv = articleDiv   // purely for debugging/experimentation. setting something as a property
		// on the window object makes that variable directly accessible in the browser console, so we can inspect it
		// and try out code before we write that code into our script.
		location.hash = 'detail/' + articleDiv.getAttribute('data-id') // Set the path once you click on an element
	},																   // (in our case "snippet") to be #detail +
																	   // the data-attribute ID of the eventObj's 
																	   // target.

	// What actually "paints" to the page. For each Model in the Collection, create a <div data-id=""> with the
	// individual ID and assign a class called "snippet" to the div as well. Then render this to the HTML via
	// innerHTML
	_render: function() {
		var docsArray = this.coll.models
		var htmlString = ''
		for (var i = 0; i < docsArray.length; i ++) {
			var articleMod = docsArray[i]
			// .get() is a method on a model that will pull a value out of
			// the model's .attributes.
			htmlString += '<div data-id="' + articleMod.get('_id') + '" class="snippetContainer">' 
			htmlString += articleMod.get('snippet')   // Could use articleMod.attributes.snippet for example
													  // This snippet here has no relation to the class name snippet
													  // that we created on line 86. This snippet comes from API docs
			htmlString += '</div>'
		}
		this.el.innerHTML = htmlString
	}
})

// This is our individual article detailed View. Create a new View, set the el (reserved word) to be document.
// querySelector("#container"). 
var DetailView = Backbone.View.extend({
	el: qs('#container'),

// Intialize is reserved. Takes in the model now instead of collection since it's the individual article view.
// Set the model to be a property on this view, so it can be accessed anywhere on this object. Input to initialize
// is the input passed in to the constructor with `new DetailView(INPUT_MODEL)`
	initialize: function(model){
		this.model = model
		var boundRender = this._render.bind(this)
		this.model.on('sync', boundRender)

	},


	_render: function (){
		console.log(this.model)
		var story = this.model
		var imgUrlBase = 'https://static01.nyt.com/'
		var htmlString = ''
		htmlString += '<div class="story">'
		htmlString += '<h1>' + story.get('headline').main + '</h1>'
		htmlString += '<img src="'+ imgUrlBase + story.get("multimedia")[1].url +' ">'
		htmlString += '</div>'
		this.el.innerHTML = htmlString
	}
})

//Step 2: Create a Backbone.Router constructor object
var NewsRouter = Backbone.Router.extend({
	//Begin definition of routes via routes object.
	routes: {
		"detail/:articleId": "doDetailView",  // Route for individual news article. if URL includes "#detail/xx", run
		"search/:topic": "doArticleSearch",   // Route for articles search. if URL includes "#search/xx", run
		"home": "showHomePage",   			  // Route for homepage. if URL includes #home, run
		"*catchall": "redirect"				  // Route for everything else not caught in above routes. Splat operator
	},
	//Searching for articles via keywords in input element box.
	doArticleSearch: function(searchTerm) {          // Takes in a Search term parameter.
		var searchCollection = new NewsCollection()  // Creating a new instance of Collection constructor.
		searchCollection.fetch({					 // On new instance of collection, apply fetch method, with
			data: {									 // data attributes of apikey and q (how their API url is).
				apikey: searchCollection._key,	 // ._key is coming from NewsCollection.
				q: searchTerm						 // searchTerm is our parameter input.
			}

		})
		new NewsView(searchCollection)	// Creating new instance of our multiple article View, taking in our 
	},									// new instance we created for the Collection. We have to create a new	
										// instance of the View to have it render onto the page and list articles.
	
	// Creating the individual pages for each entry found via article Search.
	doDetailView: function(id) {		// Takes in individual ID parameter unique to each article.
		var newsModel = new NewsModel() // Creating new instance of Backbone Model.
		newsModel.fetch({				// Invoking fetch method with data attributes of:
			data: {
				fq: "_id:" + id,		// FQ, which is string "_id" put together with the individual ID for article.
				apikey: newsModel._key// APIkey, coming from NewsModel
			}
		})
		new DetailView(newsModel)		//Creating new instance of our individual article View, taking in the Model. 
		// ***that model will be passed into the view's .initialize() method!!!***
	},
	//If anything is caught that doesn't go to home, article search, or individual article.
	redirect: function() {
		location.hash = "home"			//set the location hash (after the #) to home.
	},

	//Home Page upon loading website
	showHomePage: function() {
		var homeCollection = new NewsCollection() //Create new instance of Collection
		console.log(homeCollection)
		homeCollection.fetch({					  //Invoking fetch method on Collection, with data attributes
												  //APIkey, which is coming from the Collection

			// json is actually the default, but ... IMPORTANT!
			// for the etsy database you'll need to set the dataType to jsonp
			// dataType: 'jsonp',
			// processData: true,
			// the data property is where we put the parameters that go on the end of the url
			data: {
				apikey: homeCollection._key
			}
		})
		new NewsView(homeCollection)			//Creating new instance of the multi-article View, taking in
	},											//the Collection
		// ***that collection will be passed into the view's .initialize() method!!!***

	//First thing that will run under Backbone Router, the initialize function is reserved and automatically run.
	initialize: function() {
		Backbone.history.start() 	//Syntax to tell Backbone to start listening for hash changes
	}
})

new NewsRouter()  //create new instance of Router constructor so it can begin looking for changes

//Last step: add the "press enter" keydown event.
//Using shorthand querySelector on input element, attach a keydown event, which takes in an eventObject
//and determines if it matches Enter (13). If so, set string "search/" and the text from input as the
//location.hash, or the URL after the index.html# (the hash).
qs('input').addEventListener('keydown',function(e) {
	if (e.keyCode === 13) {
		location.hash = "search/" + e.target.value
	}
})

// >>>>>>>>>>THE END >>>>>>>>>>>>>>













// =======
// console.log('hello world')



// // store some global variables
// var key = "11eaa2ee2ebb78f1cfb25971ad39c74d:6:60564213"
// var baseURL = "http://api.nytimes.com/svc/search/v2/articlesearch.json?"
// var headlineContainer = document.querySelector("#headlineContainer")
// var inputEl = document.querySelector("input")

// // functions, in alphabetical order

// // the controller function. it responds to hash changes (see the
// 	// event listener below), and it takes the appropriate action
// 	// according to the hash. its role might seem trivial right now,
// 	// and even unnecessary. but as our apps get bigger and bigger,
// 	// we will see the controller as the crucial "brain" of our app,
// 	// choosing one of various possible actions based on the "route",
// 	// or hash. it will be hugely helpful to have the app's behavior
// 	// centralized in this way.
// var controller = function() {
// 	var hash = location.hash.substr(1)
// 	doRequest(query) 
// }

// // turns an object (a collection of key-value pairs, right?) into a parameter
// 	// string of the form key1=value1&key2=value2&key3=value3 etc etc.
// var formatURLparams = function(paramsObj) {
//     var paramString = ''
//  	for (var aKey in paramsObj) {
//         var val = paramsObj[aKey]
//         paramString += "&" + aKey + "=" + paramsObj[aKey]
//     }
//     return paramString.substr(1)
// }


// // takes as input an object representing a nytimes article. returns 
// 	// an html string that has the article's headline as its text
// 	// content.
// var docToHTML = function(docObject) {
// 	console.log(docObject.headline.main)
// 	return '<h1 class="headline">' + docObject.headline.main + '</h1>'
// }

// // takes as input the object returned from the nytimes server. accesses
// 	// the article array stored on that object. each element of the array 
// 	// is an object. for each object in the array, our function uses the 
// 	// docToHTML function to generate an h1 tag. all those h1 tags are 
// 	// collected in a string, and that string assigned into the innerHTML
// 	// of our headlineContainer. 
// var handleResponse = function(jsonData) {
// 	var docsArray = jsonData.response.docs
// 	var htmlString = ''
// 	for (var i = 0; i < docsArray.length; i ++) {
// 		var doc = docsArray[i]
// 		var docHTML = docToHTML(doc)
// 		htmlString += docHTML
// 	}
// 	headlineContainer.innerHTML = htmlString
// }

// // doRequest sets the two above functions in motion. it takes as input a query 
// 	// (the string that will be our search term). it uses that query to construct
// 	// the url it will use to send a request to the new york times server. that
// 	// request returns a promise, and we use the promises .then method to queue 
// 	// up our handleResponse function, which will be invoked when the data arrives. 
// 	// when that data does arrive, it will be passed into our handleResponse 
// 	// function.
// var doRequest = function(query) {
// 	console.log(query)
// 	var params = {
// 		"api-key": key,
// 		q: query
// 	}
// 	var fullURL = baseURL + formatURLparams(params)
// 	console.log(fullURL)
// 	var promise = $.getJSON(fullURL)
// 	promise.then(handleResponse)
// }

// // this is the function that will be invoked when a user presses a key while
// 	// focused on the input box. all of its code is inside an "if" block, 
// 	// because we will do nothing unless the user has pressed enter. if the
// 	// user has pressed enter, we will locate the input element where the key 
// 	// event took place, then we will extract the text that was typed into
// 	// that input element. then we will write that text into the hash at the
// 	// end of the url.
// var handleUserInput = function(keyEvent) {
// 	if (keyEvent.keyCode === 13) {
// 		var inputEl = keyEvent.target
// 		var query = inputEl.value
// 		location.hash = "search/" + query
// 	}
// }

// // every time a key is pressed down while the user is focused on the `input`
// // box, the handleUserInput function will be invoked.
// inputEl.addEventListener("keydown",handleUserInput)

// // every time the hash changes (right now, it only changes in handleUserInput), 
// // the controller function will be invoked. 
// window.addEventListener("hashchange",controller)

// // on a fresh page load, we will use the hash at the end of the url to determine
// // the query we will build our request with. 
// doRequest(location.hash.substr(1))

