;(function(exports) {
	

  function loadFromArray(array) {
    ouicards.flashcards = array;
    resetBuckets();
  }
  
  function loadSettingsFromArray(array){
  	 ouicards.settings =array;
  }

  function loadFromBrowser(selector, delimiter) {
    var flashcards = [],
        userInput  = $(selector).val().split('\n');

    // Get rid of empty questions
    userInput = userInput.filter(function(card) {
       return card !== "";
     });

    if (userInput.length === 0) {
      console.log('There are no flashcards to upload.');
      return;
    }

    userInput.forEach(function(card) {
      var parsedCard = card.split(delimiter);
      flashcards.push({question: parsedCard[0], answer: parsedCard[1]});
    });

    ouicards.flashcards = flashcards;
    resetBuckets();
    return getFromLS();
  }

  function next() {
    var newQuestion,
        bigInterval   = Math.ceil(ouicards.flashcards.length / 3) + 1,
        smallInterval = Math.ceil(ouicards.flashcards.length / 6) + 1;
        
    if(ouicards.settings['mode']=='b'){
    
    	newQuestion = buildQuestionHTML(ouicards.flashcards[ouicards.counter-1]);
    	
    	//if end of group is reached
    	if((ouicards.counter % ouicards.settings['nbCardsInGroup']) == 0){
    		
    		//if number of repetition for a group is reached
    		if(ouicards.groupRepetition == (ouicards.settings['nbGroupRepetition'])){
    			
    			ouicards.counter = ouicards.settings['nbCardsInGroup'] * ouicards.groupCounter + 1;
    			ouicards.groupCounter++;
    			ouicards.groupRepetition=1;
    			
    		//else
    		}else{
    			
    			ouicards.counter = ouicards.settings['nbCardsInGroup'] * (ouicards.groupCounter - 1) + 1;
    			ouicards.groupRepetition++;
    			
    		}
    		
    	}else{
    		ouicards.counter++;
    	}
    	
    	if(ouicards.counter > ouicards.flashcards.length){
    		ouicards.groupRepetition=1;
    		ouicards.counter = 1;
    		ouicards.groupCounter = 1;
    	}
        	
    }else{

    // Show an answer from bucket C once every bigInterval 
    // So long as Bucket C it's not empty
    if (ouicards.counter % bigInterval === 0 && ouicards.bucketC.length !== 0) {
      newQuestion = getQuestion(ouicards.bucketC);
      ouicards.currentBucket = ouicards.bucketC;

    // Show an answer from bucket B once every smallInterval
    // So long as Bucket B it's not empty
    } else if (ouicards.counter % smallInterval === 0 && ouicards.bucketB.length !== 0) {
      newQuestion = getQuestion(ouicards.bucketB);
      ouicards.currentBucket = ouicards.bucketB;

    // Show an answer from Bucket A, so long as it's not empty
    } else if (ouicards.bucketA.length !== 0) {
      newQuestion = getQuestion(ouicards.bucketA);
      ouicards.currentBucket = ouicards.bucketA;

    // Show an answer from Bucket B, so long as it's not empty
    } else if (ouicards.bucketB.length !== 0) {
      newQuestion = getQuestion(ouicards.bucketB);
      ouicards.currentBucket = ouicards.bucketB;

    // Show a question from Bucket C, so long as it's not empty
    } else if (ouicards.bucketC.length !== 0) {
      newQuestion = getQuestion(ouicards.bucketC);
      ouicards.currentBucket = ouicards.bucketC;
    } else {
      console.log('There was a serious problem with ouicards. You should never see ');
    }

    // Reset ouicards.counter if it's greater than flashcard count, otherwise ++ it
    ouicards.counter >= ouicards.flashcards.length ? ouicards.counter = 1 : ouicards.counter++;
    }
    
    return newQuestion;
  }

  function correct() {
    if (ouicards.currentBucket === ouicards.bucketA) {
      moveQuestion(ouicards.bucketA, ouicards.bucketB);
    } else if (ouicards.currentBucket === ouicards.bucketB) {
      moveQuestion(ouicards.bucketB, ouicards.bucketC);
    } else if (ouicards.currentBucket === ouicards.bucketC) {
      moveQuestion(ouicards.bucketC, ouicards.bucketC);
    } else
      console.log('Hmm, you should not be here.');
    saveToLS();
  }

  function wrong() {
    moveQuestion(ouicards.currentBucket, ouicards.bucketA);
    saveToLS();
  }

  function moveQuestion(fromBucket, toBucket) {
    toBucket.push(fromBucket.shift());
  }

  function getQuestion(bucket) {
    // Prevent from looping thru an empty bucket
    if (!bucket || bucket.length === 0) {
      console.log("You can't load an empty set of questions.");
      return;
    }

    return buildQuestionHTML(bucket[0]);
  }

  function buildQuestionHTML(rawQuestion) {
    var questionEl, answerEl;

    questionEl = document.createElement('p');
    questionEl.innerHTML = rawQuestion.question;

    answerEl = document.createElement('p');
    answerEl.innerHTML = rawQuestion.answer.replace(/\n/g, '<br>');

    return {question: questionEl, answer: answerEl};
  }

  function saveToLS() {
    localStorage.flashcards = JSON.stringify(ouicards.flashcards);
    localStorage.bucketA    = JSON.stringify(ouicards.bucketA);
    localStorage.bucketB    = JSON.stringify(ouicards.bucketB);
    localStorage.bucketC    = JSON.stringify(ouicards.bucketC);
  }
  
  function saveSettingsToLS() {
    localStorage.settings = JSON.stringify(ouicards.settings);
  }

    function randomizeBuckets() {
        ouicards.bucketA.sort(function () { return (Math.round(Math.random()) - 0.5); });
        ouicards.bucketB.sort(function () { return (Math.round(Math.random()) - 0.5); });
        ouicards.bucketC.sort(function () { return (Math.round(Math.random()) - 0.5); });

    }

    function getFromLS() {
    ouicards.flashcards    = JSON.parse(localStorage.flashcards || '[]');
    ouicards.bucketA       = JSON.parse(localStorage.bucketA    || '[]');
    ouicards.bucketB       = JSON.parse(localStorage.bucketB    || '[]');
    ouicards.bucketC       = JSON.parse(localStorage.bucketC    || '[]');
    ouicards.currentBucket = ouicards.bucketA.length ? ouicards.bucketA :
                         ouicards.bucketB.length ? ouicards.bucketB :
                         ouicards.bucketC.length ? ouicards.bucketC : [];
                         
                         
    ouicards.counter = 1;
    return {flashcards: ouicards.flashcards, bucketA: ouicards.bucketA, bucketB: ouicards.bucketB, bucketC: ouicards.bucketC};
  }
  
  function getSettingsFromLS() {
    ouicards.settings    = JSON.parse(localStorage.settings || '{}');
  }

  function resetBuckets() {
    ouicards.bucketA       = ouicards.flashcards.slice(0);
    ouicards.currentBucket = ouicards.bucketA;
    ouicards.bucketB       = [];
    ouicards.bucketC       = [];
    ouicards.counter       = 1;
    saveToLS();
  }
  

  exports.ouicards = {
    currentBucket:      [],
    flashcards:         [],
    bucketA:            [],
    bucketB:            [],
    bucketC:            [],
    counter:            1,
    loadFromArray:      loadFromArray,
    loadFromBrowser:    loadFromBrowser,
    next:               next,
    correct:            correct,
    wrong:              wrong,
    moveQuestion:       moveQuestion,
    getQuestion:        getQuestion,
    buildQuestionHTML:  buildQuestionHTML,
    saveToLS:           saveToLS,
    getFromLS:          getFromLS,
    resetBuckets:       resetBuckets,
    settings: {},
    randomizeBuckets:randomizeBuckets,
    loadSettingsFromArray:      loadSettingsFromArray,
    saveSettingsToLS:	saveSettingsToLS,
    getSettingsFromLS:	getSettingsFromLS,
    mode:					'',
    groupCounter:			1,
    groupRepetition:		1
  };
 

// jQuery magic
  var showNext = function() {
      var result = next();
      var q, a,t;
      q = result['question'];
      a = result['answer'];
      if (ouicards.settings['RndSide']) {
          if (Math.random() < .5) {
              t = a;
              a = q;
              q = t;
          }
      }
      
    $('#current-question').first().html(q);
    $('#current-answer').first().hide().html(a);
  };

  $.fn.ouicards = function() {
    var result = [];
    this.find('ul').hide().children().each(function() {
      result.push({
        question: $(this).find('.question').text(),
        answer: $(this).find('.answer').text()
      });
    });
    
    loadFromArray(result);

    $('a#correct').click(function(event) {
      event.preventDefault();
      correct();
      showNext();
    });

    $('a#wrong').click(function(event) {
      event.preventDefault();
      wrong();
      showNext();
    });

    $('a#show-answer').click(function(event){
      event.preventDefault();
      $('#current-answer').first().show();
    });

    showNext();
  };

})(this);
