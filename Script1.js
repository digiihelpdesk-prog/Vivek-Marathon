// CONFIG
var APPS_SCRIPT_URL = "YOUR_APPS_SCRIPT_URL_HERE"; // ← your deployed Apps Script URL
var USE_LOCAL_MODE  = false;

// 🔴 RAZORPAY CONFIG — replace with your real keys
var RAZORPAY_KEY_ID  = "rzp_test_XXXXXXXXXXXXXXXX"; // ← your Razorpay Key ID
var RAZORPAY_AMOUNT  = 25000;  // Amount in PAISE (250 rupees = 25000 paise)
var RAZORPAY_NAME    = "Vivek University";
var RAZORPAY_DESC    = "Vivek Marathon 2025 — Registration Fee";
var RAZORPAY_COLOR   = "#e8232a";
var RAZORPAY_LOGO    = ""; // ← optional: URL to your logo image

// FORM NO — auto increments from 101
function peekFormNo() {
  var current = parseInt(localStorage.getItem("vm2025_formNo") || "100");
  return current + 1;
}
function getNextFormNo() {
  var next = peekFormNo();
  localStorage.setItem("vm2025_formNo", next);
  return next;
}

window.addEventListener("load", function() {
  document.getElementById("formNo").value = peekFormNo();
});

// ── Auto-update declaration name ──
document.getElementById("fullName").addEventListener("input", function() {
  var v = this.value.trim() || "__________";
  document.getElementById("declName").textContent = v;
});

// ── Radio Button Helper ──
function selectRadio(groupId, el, name, value) {
  document.querySelectorAll("#" + groupId + " .radio-btn").forEach(function(b) {
    b.classList.remove("selected");
  });
  el.classList.add("selected");
}

// ── Calculate Age ──
function calcAge() {
  var dob = document.getElementById("dob").value;
  if (!dob) return;
  var today = new Date();
  var birth = new Date(dob);
  var age   = today.getFullYear() - birth.getFullYear();
  var m     = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  document.getElementById("age").value = age > 0 ? age : "";
}

// ── Get Radio Value ──
function getRadio(name) {
  var el = document.querySelector('input[name="' + name + '"]:checked');
  return el ? el.value : "";
}

// ── Save locally as backup ──
function saveLocally(payload) {
  try {
    var all = JSON.parse(localStorage.getItem("vm2025_registrations") || "[]");
    all.push(payload);
    localStorage.setItem("vm2025_registrations", JSON.stringify(all));
  } catch(e) {}
}

// ── Current form data (used by Razorpay callback) ──
var currentPayload = null;

// SUBMIT — saves data then opens Razorpay
function submitForm() {
  var fullName     = document.getElementById("fullName").value.trim();
  var fatherName   = document.getElementById("fatherName").value.trim();
  var dob          = document.getElementById("dob").value;
  var age          = document.getElementById("age").value;
  var gender       = getRadio("gender");
  var mobile       = document.getElementById("mobile").value.trim();
  var email        = document.getElementById("email").value.trim();
  var address      = document.getElementById("address").value.trim();
  var tshirt       = getRadio("tshirt");
  var bloodGroup   = document.getElementById("bloodGroup").value;
  var height       = document.getElementById("height").value;
  var weight       = document.getElementById("weight").value;
  var healthIssues = document.getElementById("healthIssues").value.trim();
  var declCheck    = document.getElementById("declCheck").checked;

  // ── Validation ──
  if (!fullName)   { showStatus("s-error", "⚠️ Please enter Full Name."); return; }
  if (!fatherName) { showStatus("s-error", "⚠️ Please enter Father's Name."); return; }
  if (!dob)        { showStatus("s-error", "⚠️ Please select Date of Birth."); return; }
  if (parseInt(age) < 16) { showStatus("s-error", "⚠️ Minimum age is 16 years."); return; }
  if (!gender)     { showStatus("s-error", "⚠️ Please select Gender."); return; }
  if (!mobile || !/^\d{10}$/.test(mobile)) { showStatus("s-error", "⚠️ Please enter a valid 10-digit Mobile Number."); return; }
  if (!address)    { showStatus("s-error", "⚠️ Please enter Address."); return; }
  if (!tshirt)     { showStatus("s-error", "⚠️ Please select T-Shirt Size."); return; }
  if (!declCheck)  { showStatus("s-error", "⚠️ Please agree to the Declaration."); return; }

  var formNo = getNextFormNo();

  currentPayload = {
    formNo:        formNo,
    timestamp:     new Date().toLocaleString("en-IN"),
    fullName:      fullName,
    fatherName:    fatherName,
    dob:           dob,
    age:           age,
    gender:        gender,
    mobile:        mobile,
    email:         email,
    address:       address,
    tshirt:        tshirt,
    bloodGroup:    bloodGroup,
    height:        height,
    weight:        weight,
    healthIssues:  healthIssues,
    paymentStatus: "Pending"
  };

  document.getElementById("submitBtn").disabled = true;
  showStatus("s-loading", "⏳ Processing... Opening payment window.");

  // Open Razorpay after a brief delay so the status message shows
  setTimeout(function() {
    openRazorpay(currentPayload);
  }, 400);
}

// ══════════════════════════════════════════
// RAZORPAY PAYMENT
// ══════════════════════════════════════════
function openRazorpay(payload) {
  var options = {
    key:         RAZORPAY_KEY_ID,
    amount:      RAZORPAY_AMOUNT,
    currency:    "INR",
    name:        RAZORPAY_NAME,
    description: RAZORPAY_DESC,
    image:       RAZORPAY_LOGO,
    theme:       { color: RAZORPAY_COLOR },

    // Pre-fill participant details
    prefill: {
      name:    payload.fullName,
      contact: payload.mobile,
      email:   payload.email || ""
    },

    notes: {
      form_no:      payload.formNo,
      participant:  payload.fullName,
      tshirt_size:  payload.tshirt
    },

    // ── Payment SUCCESS ──
    handler: function(response) {
      payload.paymentStatus  = "Paid";
      payload.paymentId      = response.razorpay_payment_id;
      payload.paymentOrderId = response.razorpay_order_id || "";

      saveLocally(payload);
      sendToSheet(payload);
      showSuccess(payload.fullName, payload.formNo, response.razorpay_payment_id);
    },

    // ── Modal closed / dismissed ──
    modal: {
      ondismiss: function() {
        // Payment was cancelled — save as pending and show success with warning
        payload.paymentStatus = "Pending";
        payload.paymentId     = "";
        saveLocally(payload);
        sendToSheet(payload);
        showSuccessPending(payload.fullName, payload.formNo);
      }
    }
  };

  try {
    var rzp = new Razorpay(options);
    rzp.on("payment.failed", function(response) {
      payload.paymentStatus = "Failed";
      payload.paymentId     = response.error.metadata ? response.error.metadata.payment_id : "";
      saveLocally(payload);
      sendToSheet(payload);
      showStatus("s-error", "❌ Payment failed: " + response.error.description + ". You can retry from the next screen.");
      document.getElementById("submitBtn").disabled = false;
      showSuccessPending(payload.fullName, payload.formNo);
    });
    rzp.open();
    document.getElementById("formStatus").style.display = "none";
  } catch(e) {
    showStatus("s-error", "❌ Could not load Razorpay. Please check your Key ID and internet connection.");
    document.getElementById("submitBtn").disabled = false;
  }
}

// ══════════════════════════════════════════
// SEND TO GOOGLE SHEET
// ══════════════════════════════════════════
function sendToSheet(payload) {
  if (USE_LOCAL_MODE || !APPS_SCRIPT_URL || APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") return;

  var formData = new FormData();
  formData.append("data", JSON.stringify(payload));

  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    mode:   "no-cors",
    body:   formData
  }).catch(function() {
    // Silent fail — data already saved locally
  });
}

// ── Show success after PAID ──
function showSuccess(fullName, formNo, paymentId) {
  document.getElementById("formFields").style.display    = "none";
  document.getElementById("successScreen").style.display = "block";
  document.getElementById("formStatus").style.display    = "none";

  document.getElementById("successFormNo").textContent    = "Form No: " + formNo;
  document.getElementById("successPayId").textContent     = "Payment ID: " + paymentId;
  document.getElementById("successPayId").style.display   = "block";
  document.getElementById("successPayNote").innerHTML     = "✅ Payment confirmed! Your registration is complete.";
  document.getElementById("successPayNote").style.color   = "#00804a";
  document.getElementById("retryPayBtn").style.display    = "none";
}

// ── Show success after PENDING / cancelled ──
function showSuccessPending(fullName, formNo) {
  document.getElementById("formFields").style.display    = "none";
  document.getElementById("successScreen").style.display = "block";
  document.getElementById("formStatus").style.display    = "none";

  document.getElementById("successFormNo").textContent   = "Form No: " + formNo;
  document.getElementById("successPayId").style.display  = "none";
  document.getElementById("successPayNote").innerHTML    = "⚠️ Payment <u>not completed</u>. Your form is saved. Click below to pay now.";
  document.getElementById("successPayNote").style.color  = "#e8232a";
  document.getElementById("retryPayBtn").style.display   = "inline-block";
}

// ── Retry payment ──
function retryPayment() {
  if (currentPayload) openRazorpay(currentPayload);
}

// ══════════════════════════════════════════
// RESET
// ══════════════════════════════════════════
function resetForm() {
  document.getElementById("successScreen").style.display = "none";
  document.getElementById("formFields").style.display    = "block";
  document.getElementById("submitBtn").disabled = false;
  currentPayload = null;

  ["fullName","fatherName","dob","age","mobile","email","address",
   "height","weight","healthIssues"].forEach(function(id) {
    document.getElementById(id).value = "";
  });

  document.getElementById("bloodGroup").value    = "";
  document.getElementById("declCheck").checked   = false;
  document.getElementById("declName").textContent = "__________";
  document.getElementById("formStatus").style.display = "none";
  document.getElementById("formNo").value = peekFormNo();

  document.querySelectorAll(".radio-btn").forEach(function(b) {
    b.classList.remove("selected");
  });
  document.querySelectorAll('input[type="radio"]').forEach(function(r) {
    r.checked = false;
  });
}

// ── Show status message ──
function showStatus(cls, msg) {
  var el = document.getElementById("formStatus");
  el.className   = "status-msg " + cls;
  el.textContent = msg;
  el.style.display = "block";
}
