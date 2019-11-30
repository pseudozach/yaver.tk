console.log("am I the 107th caller? aka yaver by pseudozach...");


//bs stuff
document.getElementById('signin-button').addEventListener('click', function() {
   blockstack.redirectToSignIn()
 })

document.getElementById('anonlogin').addEventListener('click', function() {
   Snackbar.show({text: 'Logged in anonymously' ,pos: "bottom-center"});
   $("#signout-button").show();
    $("#signin-button").hide();
    $("#anonlogin").hide();
 })
document.getElementById('signout-button').addEventListener('click', function() {
 blockstack.signUserOut(window.location.origin);
  $("#signout-button").hide();
    $("#signin-button").show();
    $("#anonlogin").show();
})

var glusername = "anonyaver";
var userSession;
// const appConfig = new AppConfig(['store_write', 'publish_data']);
const TASKS_FILENAME = 'yaver.json';

 if (blockstack.isUserSignedIn()) {
  const userData = blockstack.loadUserData()
  	Snackbar.show({text: 'Logged in with Blockstack: '+userData.username ,pos: "bottom-center"});
  	glusername = userData.username.split(".")[0];
    $("#signout-button").show();
    $("#signin-button").hide();
    $("#anonlogin").hide();
    // blockstack.loadUserData().gaiaHubConfig
    // userSession = new UserSession(appConfig)
   // showProfile(userData.profile, userData.username)
 } else if (blockstack.isSignInPending()) {
   blockstack.handlePendingSignIn()
   .then(userData => {
   		Snackbar.show({text: 'Logged in with Blockstack: '+userData.username ,pos: "bottom-center"});
   		glusername = userData.username.split(".")[0];
      $("#signout-button").show();
      $("#signin-button").hide();
      $("#anonlogin").hide();
      // userSession = new UserSession(appConfig)
     // showProfile(userData.profile, userData.username)
   })
 }



function savetogaia(tasks){
  const options = { encrypt: false };
  blockstack.putFile(TASKS_FILENAME, JSON.stringify(tasks), options);

  var gaiaconfig = {address: "address"};
  if(blockstack.isUserSignedIn()){
    gaiaconfig = blockstack.loadUserData().gaiaHubConfig;
    //pass data to backend so we can fetch later
    firebase.database().ref("yaverusers/" + glusername + "/gaia").set(gaiaconfig);
  } else {
    //pass data to backend so we can fetch later
    firebase.database().ref("yaverusers/" + glusername + "/gaia").set(tasks);
  }
  
}

function getfromgaia(){
  const options = { decrypt: false };
  blockstack.getFile(TASKS_FILENAME, options)
  .then((content) => {
    if(content) {
      const tasks = JSON.parse(content);
      // this.setState({tasks});
      console.log("tasks: ", tasks);
    } 
  });
}

var currenthost = "https://amithe107thcaller.herokuapp.com";

var stepper4;
$(function(){
	stepper4 = new Stepper(document.querySelector('.bs-stepper'));
    $("#submitbutton").on('touch click', function(){

    	if($("#exampleInputEmailV1").val() == "" || $("#exampleInputPasswordV2").val() == ""|| 
    		$("#exampleInputPasswordV4").val() == "" || $("#exampleInputPasswordV3").val() == ""){
    		Snackbar.show({text: 'Please provide all information' ,pos: "bottom-center"});
    		return false;
    	} else {
    		Snackbar.show({text: 'Creating payment request. please wait...' ,pos: "bottom-center"});
    	}

      var data = {
              phoneNumber: $("#exampleInputEmailV1").val(),
              userNumber: $("#exampleInputPasswordV2").val(),
              count: $("#exampleInputPasswordV4").val(),
              whattosay: $("#exampleInputPasswordV3").val(),
              positive: "yes",
              negative: "no"
          };

      savetogaia(data);

    	$.ajax({
	        url: currenthost + '/createcallconnect',
	        method: 'POST',
	        // dataType: 'json',
	        // data: json,

          //new way
          data: {userId: glusername}
	        
          //old way
          // data: {
	        //     phoneNumber: $("#exampleInputEmailV1").val(),
	        //     userNumber: $("#exampleInputPasswordV2").val(),
	        //     count: $("#exampleInputPasswordV4").val(),
	        //     whattosay: $("#exampleInputPasswordV3").val(),
	        //     positive: "yes",
	        //     negative: "no"
	        // }
	    }).done(function(data) {
	        // The JSON sent back from the server will contain a success message
	        console.log("createcallconnect: ", data);
	        var orderId = data.split(",")[1];
	          var pwstr = data.split(",")[2];
	          var obfOrderId = orderId.replace(/[^0-9a-z]/gi, '');
	          //start checking for invoice payment
	          checkInvoice(obfOrderId, orderId, pwstr);
	    }).fail(function(error) {
	        console.log(JSON.stringify(error));
	    });
	  });


    new ClipboardJS('.btncopy');
}) // end of ready

function checkInvoice(obfOrderId, orderId, pwstr) {
  // var str = $( "form" ).serialize();
//   console.log("zitoshi checkInvoice: " + orderId);

  var orderPaymentStateRef = firebase.database().ref("lnorders/" + orderId + '/payment_paid');
  orderPaymentStateRef.on('value', function(snapshot) {
    var isPaid = snapshot.val();
    // console.log("isPaid: " + isPaid);
    if(isPaid) {
      paymentReceived(orderId, pwstr);
      orderPaymentStateRef.off();
    } else {
      console.log("not paid yet.");
    }

  });

  var orderInvoiceRef = firebase.database().ref("lnorders/" + orderId + '/invoice');
  orderInvoiceRef.on('value', function(snapshot) {
    var invoice = snapshot.val();
    //  console.log("fetching invoice: " + JSON.stringify(invoice));
    // console.log("invoice triggered: " + invoice.payreq);

    var payReqString = "";
//      apptype == "paybear" && 
    if(invoice && invoice.payment_request) {
      // $("#orderId").text(orderIdString);
//       console.log("ln payment requested");
      payReqString = invoice.payment_request;
    } else if(invoice && invoice.lightning_invoice.payreq) {
      console.log("opennode ln payment requested");
      payReqString = invoice.lightning_invoice.payreq;
    } else {
       console.log("payreq value issue");
    }

    if(payReqString.trim().length > 0) {
      $("#qrcodeholder").empty();
      // $("#pbqrcodeholder").empty();
      payReqString = payReqString.trim();
      if(payReqString != "") {
        // console.log("setting address: ", payReqString);
        // var totalbtcamount = 100;

        // console.log("setting payment request: ", payReqString);
        new QRCode(document.getElementById("qrcodeholder"), "lightning:" + payReqString);
//        $("#lninvoiceholder").text(payReqString);
          $("#lninvoiceholder").val(payReqString);
        $("#openwithwallet").attr("href", "lightning:" + payReqString);
      } else {
        console.log("issue with payReqString");
      }
        
    }
     
      $("#feesatoshi").text($("#exampleInputPasswordV4").val() * 200); 
      $("#paymentstatus").text("Awaiting Payment...");
      $('#pickCardModal').modal("show");
      
      if(webln != null){
//        var payReqString = $("#lninvoiceholder").text();
        requestWebLnPayment(payReqString);
      }

  });

}

function toggleCheckmark() {
  $('.circle-loader').toggleClass('load-complete');
  $('.checkmark').toggle();
  // console.log("toggle checkmark");
}

var voting = false;
function paymentReceived(orderId, pwstr) {
  console.log("paymentReceived@" + new Date());
  $("#checkmarkholder")[0].scrollIntoView({behavior: "smooth", block: "start"});
  toggleCheckmark();
  invoiceTriggered = false;
  $("#paymentstatus").text("Payment Received!");
  setTimeout(function() {
  	Snackbar.show({text: 'Yaver is making your calls. You will be connected if other party responds positively.' ,pos: "bottom-center"});
  	$('#pickCardModal').modal("hide");
  }, 1500);
}


















let webln;
async function setupWebLN(){
        //webln
//    console.log("setupWebLN started");
    try {
      webln = await WebLN.requestProvider();
    } catch (err) {
      // Handle users without WebLN
        console.log("no webln");
    }
}

async function requestWebLnPayment(payReqString){
    if (webln) {
        try {
          var payresponse = await webln.sendPayment(payReqString);
        } catch (err) {
          // Handle users without WebLN
//            console.log("no payment");
        }
        if(payresponse){
            console.log("preimage: ", payresponse.preimage);
        }
    }
}

async function sendWebLnPayment(amount){
    if (webln) {
        try {
          var payreq = await webln.makeInvoice(parseInt(amount));
          console.log("paymentRequest: ", payreq.paymentRequest);
        } catch (err) {
          // Handle users without WebLN
//            console.log("no WebLN");
        }
    if(payreq){
//            console.log("paymentRequest: ", payreq.paymentRequest);  
//            return payreq.paymentRequest;
            $("#form29").trigger("focusin");
            $("#form29").val(payreq.paymentRequest);
            $("#payreqinfotext").text('Payment request generated by 💎 Joule extension. Ready to withdraw.');
            $("#payreqlabel").remove();
    }
    }
}

async function sendWebLnPaymentzero(){
    if (webln) {
        try {
          var payreq = await webln.makeInvoice();
          console.log("paymentRequestzero: ", payreq.paymentRequest);
        } catch (err) {
          // Handle users without WebLN
//            console.log("no WebLN");
        }
    if(payreq){
//            console.log("paymentRequest: ", payreq.paymentRequest);  
//            return payreq.paymentRequest;
// $("#voterpayreqcontainer").show();
            // $("#voterpayreqtext").trigger("focusin");
            $("#voterpayreqtext").val(payreq.paymentRequest);
            // $("#payreqinfotext").text('Payment request generated by 💎 Joule extension. Ready to withdraw.');
            // $("#payreqlabel").remove();
    }
    } else {
      console.log("no webln");
    }
}
