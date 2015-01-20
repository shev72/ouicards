var start; // used to initialize the app
var browseState; // used to keep state in browse mode: 1:question displaying ; 2:answer displaying
var hbrowseThread; // handler of timing in browse mode
var browseTimeElapsed; // to keep time elapsed in browse mode
var browseTimerLaunched = false;
var studyState; // used to keep state in study mode when useprogressbar is on: 1:question displaying ; 2:answer displaying
var hstudyThread;
var studyTimeElapsed;
var studyTimerLaunched = false;
var progressBarStep = 50;
var hprogressThread;
var progressTimerLaunched = false;

$(document).ready(function() {//alert(localStorage.settings);
	
  // Load default questions if no flashcards are found in localStorage
  if (!localStorage.flashcards || localStorage.flashcards === '[]')
    ouicards.loadFromArray(myFlashcards);
  if (!localStorage.settings || localStorage.settings === '[]')
    ouicards.loadSettingsFromArray(mySettings);
  else
    ouicards.getSettingsFromLS();
    
  
  initializeHandlers();
  
  window.addEventListener('resize', resizeWin, false);
  window.addEventListener('orientationchange', resizeWin, false);  
  
  resizeWin();
});

function initializeHandlers() {
	
  // Unbind all events, in case the user loads new flashcard questions
  $('#load-questions').unbind();
  $('.correct').unbind();
  $('.wrong').unbind();
  $('.question').unbind();
  $('.answer').unbind();

  ouicards.getFromLS();
  updateFooter();

	$( "#progressbar" ).progressbar({
		value: 0,
		max: (ouicards.settings["maxSecondsUntilWrong"]-1)*1000
	});
	
	if(ouicards.settings['mode'] == 'b'){
			$("#progressbar").css({"display": "none"});
	}
  
  $('.mode-icon').text(ouicards.settings['mode']);
  // Load question functionality
  $('.upload label').on('click', function() {
    $('.upload-questions-label').hide();
    //$('.upload').css({"padding": " 0 2px 10px 2px"});
    $('#questions-input-area').show(100, function(){
      $('#load-questions').show(400);
    });
  });

  $('#load-questions').on('click', function() {
    initializeHandlers(ouicards.loadFromBrowser('#questions-input-area', ','));
    changeQuestion();
    $('#questions-input-area').hide();
    //$('.upload').css({"padding": "10px"});
    $('#load-questions').hide();
    $('.upload-questions-label').text("Upload New Questions");
    $('.upload-questions-label').show();
    
    start = true;
  });
  
  // Show Menu
	$('.menu-button').on('click', function(){
		$('.menu').css({"display": "inline"});
		
		$('#close-menu').on('click', function(){
			$('.menu').css({"display": "none"});
		});
	});
	
	// Show Setting
	$('#open-setting').on('click', function(){
		$('.setting').css({"display": "inline"});
		
		showSettings();
		
		$('.setting-no').on('click', function(){
			$('.setting').css({"display": "none"});
		});
		
		$('.setting-ok').on('click', function(){
			saveSettings();
			$('.setting').css({"display": "none"});
		});
		
	});
	
	// Change Mode
	$('.mode-button').on('click', function(){
		if(ouicards.settings['mode'] == 's'){
			ouicards.settings['mode'] = 'b';
			$("#progressbar").css({"display": "none"});
			
			
		}else{
			ouicards.settings['mode'] = 's';
			$("#progressbar").css({"display": "block"});
		}
		$('.mode-icon').text(ouicards.settings['mode']);
		
		ouicards.saveSettingsToLS();
		
		location.reload();
	});

  // Correct and wrong answer functionality
  $('.correct').on('click', function() {
    if (!start) {
      console.log(start);
      start = true;
      changeQuestion();
      return;
    }

    if(ouicards.settings['mode'] == 's') ouicards.correct();
    changeQuestion();
    if(ouicards.settings['mode'] == 's') updateFooter();
  });

  $('.wrong').on('click', function() {
    if (!start) {
      start = true;
      changeQuestion();
      return;
    }
    
    if(ouicards.settings['mode'] == 's') ouicards.wrong();
    changeQuestion();
    if(ouicards.settings['mode'] == 's') updateFooter();
  });


  function changeQuestion() {
    var newQuestion = ouicards.next();

    if (newQuestion === undefined) {
      console.log('Trying to load an undefined question into the DOM.');
      return;
    }
    
    $('.question').html(newQuestion.question);
    $('.answer').html(newQuestion.answer);
    $('.answer').children().hide();  
    
    if(ouicards.settings['mode'] == 'b'){
    	
    	browseState = 1;
    	browseTimeElapsed = 0;
    	if(!browseTimerLaunched){
    		hbrowseThread = setInterval(b_modeTiming,1000);
    		browseTimerLaunched = true;
    	}
    	
    }else if(ouicards.settings['mode'] == 's' && ouicards.settings['useProgressBar']){
    	
    	studyState = 1;
    	studyTimeElapsed = 0;
    	if(!studyTimerLaunched){
    		
    		hstudyThread = setInterval(s_modeTiming,1000);
    		studyTimerLaunched = true;
			
    	}
    	resetProgressbarTimer();
    	
    }

  }
  
  //Manages timing in browse mode
  function b_modeTiming(){
  	 if(browseState == 1){
  	 	
  	 	if(browseTimeElapsed < (ouicards.settings['firstSideTime']  )){
  	 		browseTimeElapsed++;
  	 	}else{
  	 		
  	 		$('.answer p').show();
  	 		
  	 	   browseState = 2;
    		browseTimeElapsed = 0;
    		
  	 	}
  	 	
  	 }else{
  	 	
  	 	if(browseTimeElapsed < (ouicards.settings['secondSideTime']  )){
  	 		browseTimeElapsed++;
  	 	}else{
  	 		
    		var newQuestion = ouicards.next();

    		if (newQuestion === undefined) {
      		console.log('Trying to load an undefined question into the DOM.');
      		return;
    		}
    		$('.question').html(newQuestion.question);
    		$('.answer').html(newQuestion.answer);
    		$('.answer').children().hide();   
    		browseState = 1;
    		browseTimeElapsed = 0; 	
  	 	}
  	 }
  }
  
	
	  
  
  //Manages timing in study mode
  function s_modeTiming(){
  	 if(studyState == 1){
  	 	
  	 	if(!progressTimerLaunched){
    		progressThread = setInterval(progressBarTimer, progressBarStep);
    		progressTimerLaunched = true;
    	}
    	
  	 	if(studyTimeElapsed < (ouicards.settings['maxSecondsUntilWrong']  )){
  	 		studyTimeElapsed++;
  	 		
  	 	}else{
  	 		
  	 		resetProgressbarTimer();		
  	 		
  	 		$('.answer p').show();
  	 		
  	 		ouicards.wrong();
  	 		updateFooter();
  	 		
  	 	   studyState = 2;
    		studyTimeElapsed = 0;
    		
    		
  	 	}
  	 	
  	 }else{
  	 	
  	 	if(studyTimeElapsed < (ouicards.settings['maxSecondsUntilWrong'] )){
  	 		studyTimeElapsed++;
  	 	}else{
  	 	   
    		var newQuestion = ouicards.next();

    		if (newQuestion === undefined) {
      		console.log('Trying to load an undefined question into the DOM.');
      		return;
    		}
    		$('.question').html(newQuestion.question);
    		$('.answer').html(newQuestion.answer);
    		$('.answer').children().hide();   
    		studyState = 1;
    		studyTimeElapsed = 0; 
    		
  	 	}
  	 }
  }
  
	function resetProgressbarTimer(){
		
		clearInterval(progressThread);
			progressTimerLaunched=false;  	 
			
			$( "#progressbar" ).progressbar({
				value: 0
			});
	}  
  
  function progressBarTimer(){
  		var tmp = $( "#progressbar" ).progressbar( "option", "value" );
  		
  	 	$("#progressbar").progressbar({
							value: tmp + progressBarStep
		});
	}
	
  
  function saveSettings(){
  	
  	var tmp = $('#firstSideTime').val();
  	ouicards.settings['firstSideTime'] = tmp;
  	
  	tmp = $('#secondSideTime').val();
  	ouicards.settings['secondSideTime'] = tmp;
  	
  	tmp = $('#nbCardsInGroup').val();
  	ouicards.settings['nbCardsInGroup'] = tmp;
  	
  	tmp = $('#nbGroupRepetition').val();
  	ouicards.settings['nbGroupRepetition'] = tmp;
  	
  	tmp = $('#secsBeforeCorrectDisplayed').val();
  	ouicards.settings['secsBeforeCorrectDisplayed'] = tmp;
  	
  	tmp = $('#maxSecondsUntilWrong').val();
  	ouicards.settings['maxSecondsUntilWrong'] = tmp;
  	
  	tmp = $("#useProgressBar").prop('checked');
  	ouicards.settings['useProgressBar'] = tmp;
  	
  	ouicards.saveSettingsToLS();
  	
  	$( "#progressbar" ).progressbar({
		value: 0,
		max: (ouicards.settings["maxSecondsUntilWrong"]-1)*1000
	});
  	
  }
  
  function showSettings(){
  	
  	$("#useProgressBar").prop('checked',ouicards.settings['useProgressBar']);
  	$('#maxSecondsUntilWrong').val(ouicards.settings['maxSecondsUntilWrong']);
  	$('#secsBeforeCorrectDisplayed').val(ouicards.settings['secsBeforeCorrectDisplayed']);
  	
  	$('#firstSideTime').val(ouicards.settings['firstSideTime']);
  	$('#secondSideTime').val(ouicards.settings['secondSideTime']);
  	$('#nbCardsInGroup').val(ouicards.settings['nbCardsInGroup']);
  	$('#nbGroupRepetition').val(ouicards.settings['nbGroupRepetition']);
  }

  $('.question').on('click', function() {
    $('.answer p').show();
  });

  $('.answer').on('click', function() {
    $('.answer p').show();
  });

  // Update footer info
  function updateFooter() {
    $('.questions-count').html(ouicards.flashcards.length + ' questions');
    $('#stat-details').text(ouicards.bucketA.length + ' - ' +
                            ouicards.bucketB.length + ' - ' +
                            ouicards.bucketC.length);
  }
}

function resizeWin(){
	
	var ratio = 0.5;
	
	var b_width = window.innerWidth;
	var b_height = window.innerHeight;
	
	var win = $(".flashcard");
	//alert(b_width+","+b_height);
	
	var n_height;
	var n_width;
	var margin_top;
	var margin_left;
	
	var mobile_device =  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	
	if(mobile_device){
		
		n_height = b_height;
		n_width = b_width;
		
	}else{
		n_height = b_height;
		n_width = b_height * ratio;
	}

	margin_top = -n_height/2;
	margin_left = -n_width/2;	
	
	win.css({"height":n_height+"px"});
	win.css({"width":n_width+"px"});
	win.css({"margin-top":margin_top+"px"});
	win.css({"margin-left":margin_left+"px"});
	
	//Also set question and answer area automatically	
	
	var question = $(".question");
	var answer = $(".answer");
	var header_height = 35;//as defined in the style sheet 
	var footer_height = 30;//as defined in the style sheet 
	var controls_height = 50;//as defined in the style sheet 
	var remaining_height = n_height - (header_height + footer_height + controls_height);
	
	if(n_height > n_width){
		question.css({"height":remaining_height / 3 +"px"});		
		
		question.css({"top":header_height+"px"});
		answer.css({"top":remaining_height / 3 + 30 +"px"});
		
		question.css({"bottom":"auto"});
		answer.css({"bottom":footer_height+controls_height+"px"});
		
		question.css({"width":"100%"});
		answer.css({"width":"100%"});
		
		question.css({"left":"0"});
		answer.css({"left":"0"});
		
	}else{
		question.css({"top":header_height+"px"});
		answer.css({"top":header_height+"px"});
		
		question.css({"bottom":footer_height+controls_height+"px"});
		answer.css({"bottom":footer_height+controls_height+"px"});
		
		question.css({"width":"50%"});
		answer.css({"width":"50%"});
		
		question.css({"left":"0"});
		answer.css({"left":"50%"});
		
		
		
	}
	
	
}
