(function () {
  "use strict";

  var initialized = false;
  var apiBaseStorageKey = "expenseflowApiBase";

  var data = {
    brand: {
      name: "ExpenseFlow",
      product: "Expense Reports"
    },
    footer: {
      left: "Copyright (c) 2024, ExpenseFlow. All rights reserved.",
      right: "Privacy Statement"
    },
    wizardSteps: [
      "General Information",
      "Cash and Other Expenses",
      "Expense Allocations",
      "Review"
    ],
    currencies: [
      "HKD - Hong Kong Dollar",
      "USD - US Dollar",
      "EUR - Euro",
      "GBP - British Pound",
      "CNY - Chinese Yuan",
      "JPY - Japanese Yen",
      "SGD - Singapore Dollar"
    ],
    currenciesOptional: [
      "",
      "HKD - Hong Kong Dollar",
      "USD - US Dollar",
      "EUR - Euro",
      "GBP - British Pound",
      "CNY - Chinese Yuan",
      "JPY - Japanese Yen",
      "SGD - Singapore Dollar"
    ],
    expenseTypes: [
      "",
      "Conference - Accommodation",
      "Conference - Airfare (Basic Economy Class)",
      "Conference - Airfare (Other than Basic Economy Class)",
      "Conference - Other Conference Expenses",
      "Conference - Subsistence Allowance",
      "Insurance (for FEO use only)",
      "Others",
      "Recovery of insurance (for FEO use only)",
      "Travelling - Accommodation",
      "Travelling - Airfare (Basic Economy Class)",
      "Travelling - Airfare (Other than Basic Economy Class)",
      "Travelling - Other Travelling Expenses",
      "Travelling - Subsistence Allowance"
    ],
    naturalAccountByExpenseType: {
      "Conference - Accommodation": "10110",
      "Conference - Airfare (Basic Economy Class)": "10120",
      "Conference - Airfare (Other than Basic Economy Class)": "10120",
      "Conference - Other Conference Expenses": "10130",
      "Conference - Subsistence Allowance": "10148",
      "Insurance (for FEO use only)": "10160",
      "Others": "10999",
      "Recovery of insurance (for FEO use only)": "10160",
      "Travelling - Accommodation": "10110",
      "Travelling - Airfare (Basic Economy Class)": "10120",
      "Travelling - Airfare (Other than Basic Economy Class)": "10120",
      "Travelling - Other Travelling Expenses": "10130",
      "Travelling - Subsistence Allowance": "10148"
    },
    employeeAllocations: {
      "Yu, Tao": {
        analysis: "200010861",
        budgetHolder: "116802",
        costCentre: "14700",
        fundSource: "400"
      },
      "Chan Tai Man": {
        analysis: "200010861",
        budgetHolder: "116802",
        costCentre: "14700",
        fundSource: "400"
      }
    },
    perDiemExpenseTypes: [
      "",
      "Conference - Subsistence Allowance",
      "Travelling - Subsistence Allowance"
    ],
    templates: [
      { value: "", label: "" },
      { value: "CPDG", label: "CPDG" },
      { value: "Local_Travelling", label: "Local_Travelling" },
      { value: "Official_Entertain", label: "Official_Entertain" },
      { value: "Others", label: "Others" },
      { value: "Overseas_Travelling", label: "Overseas_Travelling" },
      { value: "Sabbatical_Leave", label: "Sabbatical_Leave" },
      { value: "URC_Conference_Grant", label: "URC_Conference_Grant" }
    ],
    notes: {
      defaultTemplate: "CPDG",
      templates: {
        CPDG: {
          desc: "Continuing Professional Development Grant",
          notes: [
            "Expenses must relate directly to the approved Continuing Professional Development activity and fall within the approved period.",
            "Claims should be submitted within 30 days after completion of the activity.",
            "Official receipt(s) should be scanned and uploaded to the Expense Report, while the original should be sent to Department Checker for review and filing.",
            "By submitting this claim, the claimant certifies that the expenses were incurred for carrying out official University business on the date(s) shown within the relevant regulations and policies, the amounts claimed were genuine, correct and have never been charged to the HKU Corporate Credit Card.",
            "For details, please refer to Staff Handbook/Staff Manual."
          ]
        },
        Local_Travelling: {
          desc: "Local Travelling Claim",
          notes: [
            "Local travelling should be necessary for official duties and normally within Hong Kong.",
            "Public transport fares should be supported by receipts where available; taxi fares require justification.",
            "Private car mileage is reimbursable only with prior approval and proper documentation.",
            "Claims should be submitted within 30 days after the travel date.",
            "By submitting this claim, the claimant certifies that the expenses were incurred for carrying out official University business on the date(s) shown within the relevant regulations and policies, the amounts claimed were genuine, correct and have never been charged to the HKU Corporate Credit Card."
          ]
        },
        Official_Entertain: {
          desc: "Official Entertainment Claim",
          notes: [
            "Official entertainment must serve a clear business purpose and comply with departmental guidelines.",
            "Please state the purpose, venue, and names of attendees in the description or attachments.",
            "Itemized receipts are required and should show date, amounts, and payment method.",
            "Tips and service charges should be reasonable; alcoholic beverages are not reimbursable unless pre-approved.",
            "Claims should be submitted within 30 days after the event.",
            "By submitting this claim, the claimant certifies that the expenses were incurred for carrying out official University business on the date(s) shown within the relevant regulations and policies, the amounts claimed were genuine, correct and have never been charged to the HKU Corporate Credit Card."
          ]
        },
        Others: {
          desc: "Other Expense Claim",
          notes: [
            "This template should be used only when the expense does not fit another specific template.",
            "Please provide clear justification and attach any prior approval where applicable.",
            "Official receipt(s) should be scanned and uploaded to the Expense Report, while the original should be sent to Department Checker for review and filing.",
            "Claims should be submitted within 30 days after the expense date.",
            "By submitting this claim, the claimant certifies that the expenses were incurred for carrying out official University business on the date(s) shown within the relevant regulations and policies, the amounts claimed were genuine, correct and have never been charged to the HKU Corporate Credit Card."
          ]
        },
        Overseas_Travelling: {
          desc: "Overseas Travelling Claim",
          notes: [
            "Overseas Travelling must have appropriate work-related justification and is subject to pre-approval by the corresponding Approving Authority (or his/her delegate). Any staff member who makes business trip that has not been properly authorized beforehand could be held personally liable for the costs of the trip.",
            "Expenses claims of the trip should be made within 30 days after the trip. The claim should have no material deviation from the approved Overseas Travelling Application, including the original budget estimates of the trip.",
            "Official receipt(s) should be scanned and uploaded to the Expense Report, while the original should be sent to Department Checker for review and filing.",
            "By submitting this claim, the claimant certifies that the expenses were incurred for carrying out official University business on the date(s) shown within the relevant regulations and policies, the amounts claimed were genuine, correct and have never been charged to the HKU Corporate Credit Card.",
            "Please fill in the purpose of the duty trip (e.g. conference / visit / research / training / others (please specify)).",
            "If for any non-business or personal reasons that a traveling staff wants to stopover certain destination in a trip, any extra expense from the stopover must be borne by the staff personally.",
            "Airfare.",
            "All air travels should be made by economy-class flights. Business (or premium-economy) tickets may be considered for flying time over 9 hours (excluding transit hours) but only if there are any special justifications pre-approved by the Approving Authority. No first-class airfare should be taken by any staff of the University.",
            "Subsistence allowance.",
            "They are fixed amounts payable to the traveling staff to reimburse the basic living costs incurred by the staff during his/her stay outside of Hong Kong. Such costs would include the cost of the appropriate standard of accommodation and meals, laundry charges, casual entertainment, gratuities, traveling expenses within towns and all minor incidental out-of-pocket expenses. Different daily allowance rates are set for different countries or cities with reference to the practice of Hong Kong Government in this regard.",
            "Different rates will apply for business travel and overseas training. Department checker is reminded to check if the claimed allowance from the relevant rates of overseas training calculated by the claimant is correct before submission for approval.",
            "Where the rates of allowances are not adequate to cover the actual expenses, the Approving Authority may authorize reimbursement of such portion of the actual expenses incurred as he/she considers reasonably economical, having regard to special circumstances of the cases.",
            "Other trip specific expenses.",
            "The subsistence allowances do not cover other expenses which are specific to a trip, e.g. conference registration fees. The incurrence of any such expenses would need to be pre-approved in the Overseas Travelling Application before the staff may claim for their reimbursement after the trip.",
            "The University has taken Group Travel Insurance Policy to cover business travels of staff. Claim for separate travel insurance is therefore not accepted.",
            "Proof for applicable exchange rate if the payments are in foreign currencies or else the relevant market rate published by the Hong Kong Association of Banks, where applicable, will be applied for reimbursement purpose.",
            "Travel insurance under the University's Group Travel Insurance Policy has already been taken out to cover official travelling activities. Claim for separate travel insurance premium is not payable.",
            "The following rates are available from the FEO Intranet homepage for easy reference which will also be updated from time to time:",
            "Subsistence allowance for business travel outside Hong Kong; and",
            "Subsistence allowance for overseas training."
          ],
          useBudget: true
        },
        Sabbatical_Leave: {
          desc: "Sabbatical Leave Claim",
          notes: [
            "Expenses must be consistent with the approved Sabbatical Leave plan and funding conditions.",
            "Airfare and accommodation claims require itineraries, booking confirmations, and receipts.",
            "Any private portion of travel must be excluded from the claim.",
            "Official receipt(s) should be scanned and uploaded to the Expense Report, while the original should be sent to Department Checker for review and filing.",
            "By submitting this claim, the claimant certifies that the expenses were incurred for carrying out official University business on the date(s) shown within the relevant regulations and policies, the amounts claimed were genuine, correct and have never been charged to the HKU Corporate Credit Card."
          ]
        },
        URC_Conference_Grant: {
          desc: "URC Conference Grant Claim",
          notes: [
            "Expenses must be within the URC approved budget and period; attach the approval letter where applicable.",
            "Conference registration, airfare, and accommodation should be supported by receipts and proof of payment.",
            "Claims should be submitted within 30 days after the conference end date.",
            "Official receipt(s) should be scanned and uploaded to the Expense Report, while the original should be sent to Department Checker for review and filing.",
            "By submitting this claim, the claimant certifies that the expenses were incurred for carrying out official University business on the date(s) shown within the relevant regulations and policies, the amounts claimed were genuine, correct and have never been charged to the HKU Corporate Credit Card."
          ]
        }
      }
    }
  };

  function sanitizeApiBase(value) {
    if (!value) {
      return "";
    }
    return String(value).replace(/\/+$/, "");
  }

  function isLocalHost() {
    var host = window.location && window.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1";
  }

  function resolveApiBase() {
    if (typeof window === "undefined") {
      return "/api";
    }
    var base = "";
    if (window.ExpenseFlowApiBase || window.EXPENSEFLOW_API_BASE) {
      base = window.ExpenseFlowApiBase || window.EXPENSEFLOW_API_BASE;
    }
    if (!base) {
      try {
        base = localStorage.getItem(apiBaseStorageKey) || "";
      } catch (error) {
        base = "";
      }
    }
    if (!base && isLocalHost()) {
      return "http://localhost:8000/api";
    }
    if (!base && document && document.body) {
      base = document.body.getAttribute("data-api-base") || "";
    }
    if (base) {
      return sanitizeApiBase(base);
    }
    if (window.location && window.location.port === "5173") {
      return "http://localhost:8000/api";
    }
    return "/api";
  }

  function resolveApiEndpoint(endpoint) {
    var base = sanitizeApiBase(resolveApiBase());
    if (!endpoint) {
      return base;
    }
    var value = String(endpoint);
    if (/^(https?:|data:|blob:)/i.test(value)) {
      return value;
    }
    if (value.indexOf("/api/") === 0) {
      return base + value.slice(4);
    }
    if (value === "/api") {
      return base;
    }
    if (value.charAt(0) !== "/") {
      return base + "/" + value;
    }
    return base + value;
  }

  function setApiBase(value) {
    if (typeof localStorage === "undefined") {
      return;
    }
    if (!value) {
      localStorage.removeItem(apiBaseStorageKey);
      return;
    }
    localStorage.setItem(apiBaseStorageKey, String(value));
  }

  var perDiemDefault = { currency: "HKD", amount: 900, rate: 1 };
  var perDiemByCountry = {
    "Australia": { currency: "AUD", amount: 300, rate: 5.2 },
    "Austria": { currency: "EUR", amount: 230, rate: 8.5 },
    "Belgium": { currency: "EUR", amount: 220, rate: 8.5 },
    "Brazil": { currency: "BRL", amount: 450, rate: 1.55 },
    "Canada": { currency: "CAD", amount: 280, rate: 5.8 },
    "China": { currency: "CNY", amount: 900, rate: 1.08 },
    "Czech Republic": { currency: "CZK", amount: 1400, rate: 0.36 },
    "Denmark": { currency: "DKK", amount: 900, rate: 1.2 },
    "Egypt": { currency: "EGP", amount: 1800, rate: 0.25 },
    "France": { currency: "EUR", amount: 230, rate: 8.5 },
    "Germany": { currency: "EUR", amount: 220, rate: 8.5 },
    "Greece": { currency: "EUR", amount: 200, rate: 8.5 },
    "India": { currency: "INR", amount: 5500, rate: 0.095 },
    "Indonesia": { currency: "IDR", amount: 900000, rate: 0.0005 },
    "Ireland": { currency: "EUR", amount: 220, rate: 8.5 },
    "Italy": { currency: "EUR", amount: 220, rate: 8.5 },
    "Japan": { currency: "JPY", amount: 23000, rate: 0.053 },
    "Malaysia": { currency: "MYR", amount: 400, rate: 1.65 },
    "Netherlands": { currency: "EUR", amount: 230, rate: 8.5 },
    "New Zealand": { currency: "NZD", amount: 270, rate: 4.9 },
    "Norway": { currency: "NOK", amount: 2200, rate: 0.75 },
    "Philippines": { currency: "PHP", amount: 4000, rate: 0.14 },
    "Poland": { currency: "PLN", amount: 700, rate: 1.9 },
    "Portugal": { currency: "EUR", amount: 200, rate: 8.5 },
    "Qatar": { currency: "QAR", amount: 700, rate: 2.14 },
    "Russia": { currency: "RUB", amount: 12000, rate: 0.085 },
    "Saudi Arabia": { currency: "SAR", amount: 700, rate: 2.08 },
    "Singapore": { currency: "SGD", amount: 320, rate: 5.8 },
    "South Africa": { currency: "ZAR", amount: 1500, rate: 0.42 },
    "South Korea": { currency: "KRW", amount: 150000, rate: 0.006 },
    "Spain": { currency: "EUR", amount: 210, rate: 8.5 },
    "Sweden": { currency: "SEK", amount: 2100, rate: 0.65 },
    "Switzerland": { currency: "CHF", amount: 240, rate: 8.9 },
    "Taiwan": { currency: "TWD", amount: 2600, rate: 0.25 },
    "Thailand": { currency: "THB", amount: 2000, rate: 0.22 },
    "Turkey": { currency: "TRY", amount: 3500, rate: 0.25 },
    "United Arab Emirates": { currency: "AED", amount: 700, rate: 2.12 },
    "United Kingdom": { currency: "GBP", amount: 190, rate: 9.8 },
    "United States": { currency: "USD", amount: 300, rate: 7.76 },
    "Vietnam": { currency: "VND", amount: 800000, rate: 0.00033 }
  };
  var perDiemByCity = {
    "Australia - Melbourne": { currency: "AUD", amount: 310, rate: 5.2 },
    "Australia - Sydney": { currency: "AUD", amount: 330, rate: 5.2 },
    "Canada - Toronto": { currency: "CAD", amount: 300, rate: 5.8 },
    "Canada - Vancouver": { currency: "CAD", amount: 300, rate: 5.8 },
    "China - Beijing": { currency: "CNY", amount: 1000, rate: 1.08 },
    "China - Shanghai": { currency: "CNY", amount: 1100, rate: 1.08 },
    "China - Hong Kong": { currency: "HKD", amount: 900, rate: 1 },
    "France - Paris": { currency: "EUR", amount: 260, rate: 8.5 },
    "Germany - Frankfurt": { currency: "EUR", amount: 240, rate: 8.5 },
    "Japan - Tokyo": { currency: "JPY", amount: 25000, rate: 0.053 },
    "Singapore - Singapore": { currency: "SGD", amount: 340, rate: 5.8 },
    "South Korea - Seoul": { currency: "KRW", amount: 180000, rate: 0.006 },
    "Switzerland - Zurich": { currency: "CHF", amount: 260, rate: 8.9 },
    "Taiwan - Taipei": { currency: "TWD", amount: 2800, rate: 0.25 },
    "United Arab Emirates - Dubai": { currency: "AED", amount: 750, rate: 2.12 },
    "United Kingdom - London": { currency: "GBP", amount: 220, rate: 9.8 },
    "United States - New York": { currency: "USD", amount: 363, rate: 7.76 },
    "United States - San Francisco": { currency: "USD", amount: 360, rate: 7.76 },
    "United States - Menlo Park": { currency: "USD", amount: 320, rate: 7.76 },
    "United States - Los Angeles": { currency: "USD", amount: 330, rate: 7.76 },
    "United States - Washington DC": { currency: "USD", amount: 320, rate: 7.76 },
    "United States - Boston": { currency: "USD", amount: 320, rate: 7.76 },
    "United States - Seattle": { currency: "USD", amount: 320, rate: 7.76 },
    "United States - San Diego": { currency: "USD", amount: 290, rate: 7.76 },
    "United States - Chicago": { currency: "USD", amount: 300, rate: 7.76 }
  };

  var currencyLabels = {
    AED: "UAE Dirham",
    AUD: "Australian Dollar",
    BRL: "Brazilian Real",
    CAD: "Canadian Dollar",
    CHF: "Swiss Franc",
    CNY: "Chinese Yuan",
    CZK: "Czech Koruna",
    DKK: "Danish Krone",
    EGP: "Egyptian Pound",
    EUR: "Euro",
    GBP: "British Pound",
    HKD: "Hong Kong Dollar",
    IDR: "Indonesian Rupiah",
    INR: "Indian Rupee",
    JPY: "Japanese Yen",
    KRW: "South Korean Won",
    MYR: "Malaysian Ringgit",
    NOK: "Norwegian Krone",
    NZD: "New Zealand Dollar",
    PHP: "Philippine Peso",
    PLN: "Polish Zloty",
    QAR: "Qatari Riyal",
    RUB: "Russian Ruble",
    SAR: "Saudi Riyal",
    SEK: "Swedish Krona",
    SGD: "Singapore Dollar",
    THB: "Thai Baht",
    TRY: "Turkish Lira",
    TWD: "New Taiwan Dollar",
    USD: "US Dollar",
    VND: "Vietnamese Dong",
    ZAR: "South African Rand"
  };

  function buildCurrencyList() {
    var codes = {};
    function addCode(code) {
      if (!code) {
        return;
      }
      codes[code] = true;
    }
    addCode(perDiemDefault.currency);
    Object.keys(perDiemByCountry).forEach(function (key) {
      addCode(perDiemByCountry[key].currency);
    });
    Object.keys(perDiemByCity).forEach(function (key) {
      addCode(perDiemByCity[key].currency);
    });
    var sorted = Object.keys(codes).sort();
    if (codes.HKD) {
      sorted = ["HKD"].concat(
        sorted.filter(function (code) {
          return code !== "HKD";
        })
      );
    }
    return sorted.map(function (code) {
      var label = currencyLabels[code] || code;
      return code + " - " + label;
    });
  }

  var currencyOptions = buildCurrencyList();
  data.currencies = currencyOptions;
  data.currenciesOptional = [""].concat(currencyOptions);

  function resolvePerDiemConfig(destinationValue) {
    if (!destinationValue) {
      return perDiemDefault;
    }
    if (perDiemByCity[destinationValue]) {
      return perDiemByCity[destinationValue];
    }
    var parts = destinationValue.split(" - ");
    var country = parts[0] || "";
    return perDiemByCountry[country] || perDiemDefault;
  }

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) {
        return fallback;
      }
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  var storage = {
    getHeader: function () {
      return readJSON("expenseHeader", {});
    },
    saveHeader: function (header) {
      writeJSON("expenseHeader", header || {});
    },
    getLines: function () {
      return readJSON("expenseLines", {});
    },
    saveLines: function (lines) {
      writeJSON("expenseLines", lines || {});
    },
    getPerDiemLines: function () {
      return readJSON("perDiemLines", {});
    },
    savePerDiemLines: function (lines) {
      writeJSON("perDiemLines", lines || {});
    },
    getTargetLine: function () {
      var stored = localStorage.getItem("expenseTargetLine");
      var parsed = parseInt(stored, 10);
      if (!parsed || parsed < 1) {
        return 1;
      }
      return parsed;
    },
    setTargetLine: function (value) {
      var numeric = parseInt(value, 10);
      if (!numeric || numeric < 1) {
        numeric = 1;
      }
      localStorage.setItem("expenseTargetLine", String(numeric));
    },
    getPerDiemTargetLine: function () {
      var stored = localStorage.getItem("perDiemTargetLine");
      var parsed = parseInt(stored, 10);
      if (!parsed || parsed < 1) {
        return 1;
      }
      return parsed;
    },
    setPerDiemTargetLine: function (value) {
      var numeric = parseInt(value, 10);
      if (!numeric || numeric < 1) {
        numeric = 1;
      }
      localStorage.setItem("perDiemTargetLine", String(numeric));
    }
  };

  function lineHasData(lineData) {
    if (!lineData) {
      return false;
    }
    return Boolean(
      lineData.receiptDate ||
        lineData.receiptAmount ||
        lineData.expenseType ||
        lineData.description ||
        lineData.reimbAmount ||
        lineData.receiptCurrency ||
        lineData.exchangeRate
    );
  }

  function getNonEmptyLineKeys(lines) {
    return Object.keys(lines || {})
      .map(function (key) {
        return parseInt(key, 10);
      })
      .filter(function (key) {
        return Number.isFinite(key) && lineHasData(lines[String(key)]);
      })
      .sort(function (a, b) {
        return a - b;
      });
  }

  function compactLines(lines) {
    var keys = getNonEmptyLineKeys(lines);
    var compacted = {};
    keys.forEach(function (key, index) {
      compacted[String(index + 1)] = lines[String(key)];
    });
    return compacted;
  }

  function parseAmount(value) {
    if (!value) {
      return 0;
    }
    var cleaned = String(value).replace(/[^0-9.]/g, "");
    var parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatReceiptAmount(lineData) {
    if (!lineData || !lineData.receiptAmount) {
      return "";
    }
    var currency = lineData.receiptCurrency || "HKD";
    return lineData.receiptAmount + " " + currency;
  }

  function formatReimbAmount(lineData) {
    if (!lineData) {
      return "";
    }
    if (lineData.reimbAmount) {
      return lineData.reimbAmount;
    }
    return lineData.receiptAmount ? lineData.receiptAmount : "";
  }

  function formatDateRange(dates) {
    if (!dates || !dates.length) {
      return "";
    }
    var sorted = dates.slice().sort();
    var first = sorted[0];
    var last = sorted[sorted.length - 1];
    return first === last ? first : first + " - " + last;
  }

  function renderTopbar(container) {
    var user = container.getAttribute("data-user") || document.body.getAttribute("data-user") || "User";
    container.className = "topbar";
    container.innerHTML =
      "<div class=\"logo\">" +
      "<span class=\"brand-name\">" + data.brand.name + "</span>" +
      "<span class=\"expense\">" + data.brand.product + "</span>" +
      "</div>" +
      "<div class=\"user\">Logged In As " + user + "</div>";
  }

  function renderFooter(container) {
    container.className = "footer";
    container.innerHTML = "<div>" + data.footer.left + "</div><div>" + data.footer.right + "</div>";
  }

  function renderWizard(container) {
    var current = parseInt(container.getAttribute("data-step"), 10);
    if (!current || current < 1) {
      current = 1;
    }

    container.className = "wizard";
    container.innerHTML = "";

    var line = document.createElement("div");
    line.className = "wizard-line";
    container.appendChild(line);

    var steps = document.createElement("div");
    steps.className = "wizard-steps";

    data.wizardSteps.forEach(function (label, index) {
      var stepIndex = index + 1;
      var step = document.createElement("div");
      step.className = "wizard-step";
      if (stepIndex < current) {
        step.className += " done";
      } else if (stepIndex === current) {
        step.className += " active";
      }

      var dot = document.createElement("div");
      dot.className = "wizard-dot";
      if (stepIndex < current) {
        dot.className += " done";
      } else if (stepIndex === current) {
        dot.className += " active";
      }

      var text = document.createElement("div");
      text.textContent = label;

      step.appendChild(dot);
      step.appendChild(text);
      steps.appendChild(step);
    });

    container.appendChild(steps);
  }

  function resolveOptions(key) {
    if (key === "currencies") {
      return data.currencies;
    }
    if (key === "currencies-optional") {
      return data.currenciesOptional;
    }
    if (key === "expense-types") {
      return data.expenseTypes;
    }
    if (key === "per-diem-expense-types") {
      return data.perDiemExpenseTypes;
    }
    if (key === "templates") {
      return data.templates;
    }
    return null;
  }

  function populateSelect(select, options) {
    if (!options) {
      return;
    }
    var existingValue = select.value;
    select.innerHTML = "";
    options.forEach(function (option) {
      var item = document.createElement("option");
      if (typeof option === "string") {
        item.value = option;
        item.textContent = option;
      } else {
        item.value = option.value;
        item.textContent = option.label;
      }
      select.appendChild(item);
    });

    var defaultValue = select.getAttribute("data-default");
    if (existingValue) {
      select.value = existingValue;
    }
    if (!select.value && defaultValue) {
      select.value = defaultValue;
    }
  }

  function populateSelects() {
    document.querySelectorAll("select[data-options]").forEach(function (select) {
      var key = select.getAttribute("data-options");
      populateSelect(select, resolveOptions(key));
    });
  }

  function initLayout() {
    document.querySelectorAll("[data-component='topbar']").forEach(renderTopbar);
    document.querySelectorAll("[data-component='footer']").forEach(renderFooter);
    document.querySelectorAll("[data-component='wizard']").forEach(renderWizard);
  }

  function initDatePicker(options) {
    var config = options || {};
    var modalId = config.modalId || "date-modal";
    var triggerSelector = config.triggerSelector || ".calendar-btn";
    var inputSelector = config.inputSelector || ".date-input";
    var onSelect = typeof config.onSelect === "function" ? config.onSelect : null;

    var modal = document.getElementById(modalId);
    if (!modal) {
      return null;
    }

    var cancelBtn = modal.querySelector("#date-cancel");
    var monthSelect = modal.querySelector("#month-select");
    var yearSelect = modal.querySelector("#year-select");
    var monthPrev = modal.querySelector("#month-prev");
    var monthNext = modal.querySelector("#month-next");
    var calendarBody = modal.querySelector("#calendar-body");

    if (!monthSelect || !yearSelect || !monthPrev || !monthNext || !calendarBody) {
      return null;
    }

    var monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];
    var monthAbbr = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];

    var currentMonth = 8;
    var currentYear = 2025;
    var activeInput = null;

    function openModal(input) {
      activeInput = input;
      renderCalendar();
      modal.classList.add("open");
    }

    function closeModal() {
      modal.classList.remove("open");
      activeInput = null;
    }

    function setSelectOptions() {
      monthSelect.innerHTML = "";
      for (var m = 0; m < 12; m += 1) {
        var option = document.createElement("option");
        option.value = String(m);
        option.textContent = monthNames[m];
        monthSelect.appendChild(option);
      }

      yearSelect.innerHTML = "";
      for (var y = 2020; y <= 2035; y += 1) {
        var yearOption = document.createElement("option");
        yearOption.value = String(y);
        yearOption.textContent = String(y);
        yearSelect.appendChild(yearOption);
      }
    }

    function formatDate(day, monthIndex, year) {
      var dayText = day < 10 ? "0" + day : String(day);
      return dayText + "-" + monthAbbr[monthIndex] + "-" + year;
    }

    function renderCalendar() {
      monthSelect.value = String(currentMonth);
      yearSelect.value = String(currentYear);
      calendarBody.innerHTML = "";

      var firstDay = new Date(currentYear, currentMonth, 1).getDay();
      var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      var row = document.createElement("tr");

      for (var i = 0; i < firstDay; i += 1) {
        row.appendChild(document.createElement("td"));
      }

      for (var day = 1; day <= daysInMonth; day += 1) {
        if ((firstDay + day - 1) % 7 === 0 && day !== 1) {
          calendarBody.appendChild(row);
          row = document.createElement("tr");
        }
        var cell = document.createElement("td");
        var button = document.createElement("button");
        button.type = "button";
        button.textContent = String(day);
        button.setAttribute("data-date", formatDate(day, currentMonth, currentYear));
        button.addEventListener("click", function (event) {
          if (activeInput) {
            activeInput.value = event.currentTarget.getAttribute("data-date");
            if (onSelect) {
              onSelect(activeInput);
            }
          }
          closeModal();
        });
        cell.appendChild(button);
        row.appendChild(cell);
      }

      if (row.children.length > 0) {
        calendarBody.appendChild(row);
      }
    }

    function adjustMonth(delta) {
      currentMonth += delta;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear -= 1;
      } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear += 1;
      }
      renderCalendar();
    }

    setSelectOptions();

    monthSelect.addEventListener("change", function () {
      currentMonth = parseInt(monthSelect.value, 10);
      renderCalendar();
    });

    yearSelect.addEventListener("change", function () {
      currentYear = parseInt(yearSelect.value, 10);
      renderCalendar();
    });

    monthPrev.addEventListener("click", function () {
      adjustMonth(-1);
    });

    monthNext.addEventListener("click", function () {
      adjustMonth(1);
    });

    document.querySelectorAll(triggerSelector).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var input = btn.parentElement.querySelector(inputSelector);
        if (input) {
          openModal(input);
        }
      });
    });

    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeModal();
      }
    });

    if (cancelBtn) {
      cancelBtn.addEventListener("click", closeModal);
    }

    return {
      open: openModal,
      close: closeModal
    };
  }

  function init() {
    if (initialized) {
      return;
    }
    initialized = true;
    initLayout();
    populateSelects();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function initExpenseFlowStateSync() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }
    if (window.__expenseflowStateSyncInitialized) {
      return;
    }
    window.__expenseflowStateSyncInitialized = true;

    var DEFAULT_REPORT_NUMBER = "ER-2025-1106-001";
    var expenseflowTrackedKeys = {
      expenseHeader: true,
      expenseHeaderDraft: true,
      expenseHeaderDirty: true,
      expenseLines: true,
      expenseLinesDraft: true,
      perDiemLines: true,
      perDiemLinesDraft: true,
      expenseAllocations: true,
      expenseTargetLine: true,
      perDiemTargetLine: true,
      cashExpensesDirty: true,
      cashExpensesActiveTab: true,
      expenseAttachmentsDraft: true,
      reviewApprovers: true,
      reviewApproversDraft: true,
      reviewApproversDirty: true,
      submittedExpenseReports: true,
      submittedReportSequence: true
    };
    var expenseflowJsonKeys = {
      expenseHeader: true,
      expenseHeaderDraft: true,
      expenseLines: true,
      expenseLinesDraft: true,
      perDiemLines: true,
      perDiemLinesDraft: true,
      expenseAllocations: true,
      expenseAttachmentsDraft: true,
      reviewApprovers: true,
      reviewApproversDraft: true,
      submittedExpenseReports: true,
      submittedReportSequence: true
    };
    var syncDelay = 600;
    var syncTimer = null;
    var lastSnapshot = null;
    var lastPayload = null;

    function parseStorageValue(key, raw) {
      if (!expenseflowJsonKeys[key]) {
        return raw;
      }
      try {
        return JSON.parse(raw);
      } catch (error) {
        return raw;
      }
    }

    function buildSnapshot() {
      var snapshot = {};
      Object.keys(expenseflowTrackedKeys).forEach(function (key) {
        var raw = localStorage.getItem(key);
        if (raw === null) {
          return;
        }
        snapshot[key] = parseStorageValue(key, raw);
      });
      return snapshot;
    }

    function normalizeSubmittedReports(reports) {
      if (!Array.isArray(reports)) {
        return [];
      }
      return reports.filter(function (report) {
        return (
          report &&
          report.reportNumber &&
          report.reportNumber !== DEFAULT_REPORT_NUMBER
        );
      });
    }

    function buildPatch(snapshot) {
      var localPatch = {};
      Object.keys(snapshot).forEach(function (key) {
        localPatch[key] = snapshot[key];
      });
      if (lastSnapshot) {
        Object.keys(lastSnapshot).forEach(function (key) {
          if (!Object.prototype.hasOwnProperty.call(snapshot, key)) {
            localPatch[key] = null;
          }
        });
      }

      return {
        expenseflow: {
          local_storage: localPatch,
          submitted_expense_reports: normalizeSubmittedReports(
            snapshot.submittedExpenseReports
          )
        }
      };
    }

    function syncNow(useKeepalive) {
      syncTimer = null;
      if (typeof fetch !== "function") {
        return;
      }
      var snapshot = buildSnapshot();
      if (!lastSnapshot && !Object.keys(snapshot).length) {
        return;
      }
      var patch = buildPatch(snapshot);
      var payload = {
        data: patch,
        note: "Auto sync ExpenseFlow local state."
      };
      var payloadKey = JSON.stringify(payload.data);
      if (payloadKey === lastPayload) {
        lastSnapshot = snapshot;
        return;
      }
      lastSnapshot = snapshot;
      lastPayload = payloadKey;
      fetch(resolveApiEndpoint("/state"), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: Boolean(useKeepalive)
      }).catch(function () {});
    }

    function scheduleSync() {
      if (syncTimer) {
        clearTimeout(syncTimer);
      }
      syncTimer = setTimeout(function () {
        syncNow(false);
      }, syncDelay);
    }

    function handleStorageChange(key) {
      if (!expenseflowTrackedKeys[key]) {
        return;
      }
      scheduleSync();
    }

    var originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key, value) {
      originalSetItem(key, value);
      handleStorageChange(key);
    };

    var originalRemoveItem = localStorage.removeItem.bind(localStorage);
    localStorage.removeItem = function (key) {
      originalRemoveItem(key);
      handleStorageChange(key);
    };

    if (typeof localStorage.clear === "function") {
      var originalClear = localStorage.clear.bind(localStorage);
      localStorage.clear = function () {
        originalClear();
        scheduleSync();
      };
    }

    window.addEventListener("pagehide", function () {
      syncNow(true);
    });
  }

  window.ExpenseApp = {
    data: data,
    api: {
      getBase: resolveApiBase,
      resolveEndpoint: resolveApiEndpoint,
      setBase: setApiBase
    },
    storage: storage,
    lines: {
      hasData: lineHasData,
      getNonEmptyKeys: getNonEmptyLineKeys,
      compact: compactLines
    },
    format: {
      parseAmount: parseAmount,
      formatReceiptAmount: formatReceiptAmount,
      formatReimbAmount: formatReimbAmount,
      formatDateRange: formatDateRange
    },
    perDiem: {
      default: perDiemDefault,
      byCountry: perDiemByCountry,
      byCity: perDiemByCity,
      resolve: resolvePerDiemConfig
    },
    datePicker: {
      init: initDatePicker
    },
    ui: {
      populateSelects: populateSelects
    }
  };

  initExpenseFlowStateSync();
})();
