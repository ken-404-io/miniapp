const API = "https://your-backend.railway.app"; // Replace with your Railway URL
const tg = window.Telegram.WebApp;
const initData = tg.initData;
const userId = tg.initDataUnsafe?.user?.id;

tg.ready();
tg.expand();

// --- API helpers ---
async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Init-Data": initData,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// --- State ---
let state = { balance: 0, total_earned: 0, earning_enabled: true };

function fmt(n) {
  return "₱" + parseFloat(n).toFixed(2);
}

// --- Render ---
function render() {
  document.getElementById("balance").textContent = fmt(state.balance);
  document.getElementById("total-earned").textContent = `Total earned: ${fmt(state.total_earned)}`;
  document.getElementById("earning-toggle").checked = state.earning_enabled;
  document.getElementById("watch-btn").disabled = !state.earning_enabled;
}

// --- Load user ---
async function loadMe() {
  try {
    const data = await api("GET", "/api/me");
    state = { ...state, ...data };
    render();
  } catch (e) {
    showMsg("load-msg", e.message, true);
  }
}

// --- Earning toggle ---
document.getElementById("earning-toggle").addEventListener("change", async (e) => {
  const enabled = e.target.checked;
  try {
    await api("POST", "/api/toggle-earning", { enabled });
    state.earning_enabled = enabled;
    render();
  } catch (err) {
    e.target.checked = !enabled; // revert
    showMsg("load-msg", err.message, true);
  }
});

// --- Watch ad ---
const ZONE_ID = "REPLACE_WITH_ZONE_ID"; // Replace with your Monetag zone ID

document.getElementById("watch-btn").addEventListener("click", async () => {
  const btn = document.getElementById("watch-btn");
  btn.disabled = true;
  clearMsg("ad-msg");

  try {
    await window[`show_${ZONE_ID}`]({ ymid: userId });
    // Ad completed — credit the user
    const result = await api("POST", "/api/reward");
    state.balance = result.balance;
    render();
    showMsg("ad-msg", `+${fmt(result.credited)} credited! New balance: ${fmt(result.balance)}`);
  } catch (err) {
    showMsg("ad-msg", err.message || "Ad not available right now. Try again shortly.", true);
  } finally {
    btn.disabled = !state.earning_enabled;
  }
});

// --- Withdraw form ---
document.getElementById("open-withdraw-btn").addEventListener("click", () => {
  document.getElementById("withdraw-form").classList.toggle("open");
});

let pendingWithdrawal = null;

document.getElementById("withdraw-submit-btn").addEventListener("click", () => {
  clearMsg("withdraw-msg");
  const amount = parseFloat(document.getElementById("w-amount").value);
  const channel = document.getElementById("w-channel").value;
  const account_number = document.getElementById("w-number").value.trim();
  const account_name = document.getElementById("w-name").value.trim();

  if (!amount || isNaN(amount)) return showMsg("withdraw-msg", "Enter a valid amount.", true);
  if (!account_number) return showMsg("withdraw-msg", "Enter mobile number.", true);
  if (!account_name) return showMsg("withdraw-msg", "Enter account name.", true);

  pendingWithdrawal = { amount, channel, account_number, account_name };

  const channelLabel = channel === "GCASH" ? "GCash" : "Maya";
  document.getElementById("modal-text").textContent =
    `Send ${fmt(amount)} to ${channelLabel} ${account_number} (${account_name})? Mistakes cannot be undone.`;

  document.getElementById("modal-overlay").classList.add("open");
});

document.getElementById("modal-cancel").addEventListener("click", () => {
  document.getElementById("modal-overlay").classList.remove("open");
  pendingWithdrawal = null;
});

document.getElementById("modal-confirm").addEventListener("click", async () => {
  document.getElementById("modal-overlay").classList.remove("open");
  if (!pendingWithdrawal) return;

  try {
    await api("POST", "/api/withdraw", pendingWithdrawal);
    state.balance -= pendingWithdrawal.amount;
    render();
    pendingWithdrawal = null;
    document.getElementById("withdraw-form").classList.remove("open");
    showMsg("withdraw-msg", "Withdrawal request submitted! We'll process it shortly.");
    await loadWithdrawals();
  } catch (err) {
    showMsg("withdraw-msg", err.message, true);
  }
});

// --- Withdrawal history ---
async function loadWithdrawals() {
  try {
    const rows = await api("GET", "/api/withdrawals");
    const list = document.getElementById("withdrawals-list");
    if (!rows.length) {
      list.innerHTML = '<p class="empty">No withdrawals yet.</p>';
      return;
    }
    list.innerHTML = rows.map(w => `
      <div class="withdrawal-item">
        <div class="wi-left">
          <div class="wi-amount">${fmt(w.amount)}</div>
          <div class="wi-detail">${w.channel} ${w.account_number}${w.reference_number ? ` · Ref: ${w.reference_number}` : ""}</div>
        </div>
        <span class="badge badge-${w.status}">${w.status}</span>
      </div>
    `).join("");
  } catch {
    // Silent — not critical
  }
}

// --- Helpers ---
function showMsg(id, text, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `msg ${isError ? "msg-error" : "msg-success"}`;
}

function clearMsg(id) {
  const el = document.getElementById(id);
  if (el) { el.textContent = ""; el.className = ""; }
}

// --- Init ---
loadMe();
loadWithdrawals();
