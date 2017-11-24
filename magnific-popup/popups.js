$(document).ready(function() {

$('.popup-gallery').magnificPopup({
  delegate: 'a',
  type: 'image',
  cursor: 'mfp-zoom-out-cur',
  // other options
  closeOnContentClick: 'true'
  
  gallery: {
	  enabled: true;
  }
  
});

});