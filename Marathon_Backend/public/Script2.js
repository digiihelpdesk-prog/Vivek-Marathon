// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
var BACKEND_URL     = "https://your-marathon-backend.up.railway.app"; // ← update after deploy
var RAZORPAY_KEY_ID = "rzp_live_871H2Jybngmseo";
var RAZORPAY_AMOUNT = 30000; // ₹300 in paise
var RAZORPAY_NAME   = "Vivek University";
var RAZORPAY_DESC   = "Vivek Marathon 2026 — Registration Fee";
var RAZORPAY_COLOR  = "#e8232a";
var RAZORPAY_LOGO   = "";

// ── Department → Programme Mapping ──
var DEPT_PROGRAMMES = {
  "eng":     ["B.Tech", "M.Tech", "Diploma", "Ph.D"],
  "pharma":  ["BCA", "MCA", "B.Com", "M.Com", "BBA", "MBA", "LLB", "LLM", "B.A LLB"],
  "mgmt":    ["LLB", "LLM", "B.A LLB", "Ph.D (Law)"],
  "science": ["B.Sc", "M.Sc", "Ph.D (Science)"],
  "arts":    ["B.Pharm", "M.Pharm", "D.Pharm", "Ph.D (Pharmacy)"],
  "commerce":["B.Sc (Nursing)", "M.Sc (Nursing)", "Post Basic B.Sc Nursing"],
  "law":     ["B.Ed", "M.Ed", "Ph.D (Education)"],
  "edu":     ["BAMS", "M.D (Ayurveda)", "Ph.D (Ayurveda)"],
  "agri":    ["B.Sc (Agriculture)", "M.Sc (Agriculture)"],
  "na":      ["Not Applicable", "Other"]
};

function filterProgrammes() {
  var dept    = document.getElementById("department").value;
  var progSel = document.getElementById("programme");
  progSel.innerHTML = "";
  if (!dept) {
    progSel.innerHTML = '<option value="">Select School First</option>';
    progSel.disabled = true;
    return;
  }
  var programmes = DEPT_PROGRAMMES[dept] || ["Other"];
  var defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "Select Programme";
  progSel.appendChild(defaultOpt);
  programmes.forEach(function(p) {
    var opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    progSel.appendChild(opt);
  });
  progSel.disabled = false;
}

// ── Form No (local preview only) ──
function peekFormNo() {
  var current = parseInt(localStorage.getItem("vm2026_formNo") || "100");
  return "VM" + (current + 1);
}
function getNextFormNo() {
  var current = parseInt(localStorage.getItem("vm2026_formNo") || "100");
  var next = current + 1;
  localStorage.setItem("vm2026_formNo", next);
  return "VM" + next;
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

// ── Current form data ──
var currentPayload = null;

// ══════════════════════════════════════════
// SUBMIT FORM
// ══════════════════════════════════════════
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
  var dept         = document.getElementById("department");
  var school       = dept.options[dept.selectedIndex] ? dept.options[dept.selectedIndex].text : "";
  if (school === "Select School") school = "";
  var programme    = document.getElementById("programme").value;
  var batchYear    = document.getElementById("batchYear").value;
  var declCheck    = document.getElementById("declCheck").checked;

  // Validation
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
    formNo, timestamp: new Date().toLocaleString("en-IN"),
    fullName, fatherName, dob, age, gender, mobile, email, address,
    tshirt, bloodGroup, height, weight, healthIssues,
    school, programme, batchYear,
    paymentStatus: "Pending", amount: 300
  };

  document.getElementById("submitBtn").disabled = true;
  showStatus("s-loading", "⏳ Processing... Opening payment window.");

  setTimeout(function() { openRazorpay(currentPayload); }, 400);
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
    prefill: { name: payload.fullName, contact: payload.mobile, email: payload.email || "" },
    notes: { form_no: payload.formNo, participant: payload.fullName, tshirt_size: payload.tshirt },

    handler: function(response) {
      payload.paymentStatus  = "Paid";
      payload.paymentId      = response.razorpay_payment_id;
      payload.paymentOrderId = response.razorpay_order_id || "";
      saveToBackend(payload);
    },

    modal: {
      ondismiss: function() {
        payload.paymentStatus = "Pending";
        payload.paymentId     = "";
        saveToBackend(payload);
      }
    }
  };

  try {
    var rzp = new Razorpay(options);
    rzp.on("payment.failed", function(response) {
      payload.paymentStatus = "Failed";
      payload.paymentId     = response.error.metadata ? response.error.metadata.payment_id : "";
      saveToBackend(payload);
      showStatus("s-error", "❌ Payment failed: " + response.error.description);
      document.getElementById("submitBtn").disabled = false;
    });
    rzp.open();
    document.getElementById("formStatus").style.display = "none";
  } catch(e) {
    showStatus("s-error", "❌ Could not load Razorpay: " + e.message);
    document.getElementById("submitBtn").disabled = false;
  }
}

// ══════════════════════════════════════════
// SAVE TO BACKEND
// ══════════════════════════════════════════
function saveToBackend(payload) {
  fetch(BACKEND_URL + "/api/register", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload)
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    console.log("✅ Saved to backend:", data);
    if (payload.paymentStatus === "Paid") {
      showSuccess(payload.fullName, payload.formNo, payload.paymentId);
    } else {
      showSuccessPending(payload.fullName, payload.formNo);
    }
  })
  .catch(function(err) {
    console.error("❌ Backend error:", err);
    if (payload.paymentStatus === "Paid") {
      showSuccess(payload.fullName, payload.formNo, payload.paymentId);
    } else {
      showSuccessPending(payload.fullName, payload.formNo);
    }
  });
}

// ── Show success after PAID ──
function showSuccess(fullName, formNo, paymentId) {
  document.getElementById("formFields").style.display    = "none";
  document.getElementById("successScreen").style.display = "block";
  document.getElementById("formStatus").style.display    = "none";
  document.getElementById("successFormNo").textContent   = "Form No: " + formNo;
  document.getElementById("successPayId").textContent    = "Payment ID: " + paymentId;
  document.getElementById("successPayId").style.display  = "block";
  document.getElementById("successPayNote").innerHTML    = "✅ Payment confirmed! Registration complete. Check your email for confirmation.";
  document.getElementById("successPayNote").style.color  = "#00804a";
  document.getElementById("retryPayBtn").style.display   = "none";
}

// ── Show success after PENDING ──
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

  ["fullName","fatherName","dob","age","mobile","email","address","height","weight","healthIssues"]
    .forEach(function(id) { document.getElementById(id).value = ""; });

  document.getElementById("bloodGroup").value = "";
  document.getElementById("department").value = "";
  document.getElementById("batchYear").value  = "";
  var progSel = document.getElementById("programme");
  progSel.innerHTML = '<option value="">Select School First</option>';
  progSel.disabled  = true;
  document.getElementById("declCheck").checked    = false;
  document.getElementById("declName").textContent = "__________";
  document.getElementById("formStatus").style.display = "none";
  document.getElementById("formNo").value = peekFormNo();

  document.querySelectorAll(".radio-btn").forEach(function(b) { b.classList.remove("selected"); });
  document.querySelectorAll('input[type="radio"]').forEach(function(r) { r.checked = false; });
}

// ── Show status message ──
function showStatus(cls, msg) {
  var el = document.getElementById("formStatus");
  el.className = "status-msg " + cls;
  el.textContent = msg;
  el.style.display = "block";
}
