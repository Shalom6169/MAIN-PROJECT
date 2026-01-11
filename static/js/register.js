// static/js/register.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const msg = document.getElementById("msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    const formData = new FormData(form);

    try {
      const resp = await fetch(form.action, { method: "POST", body: formData });
      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { message: text }; }

      if (resp.ok) {
        msg.style.color = "green";
        msg.textContent = data.message || "Registered successfully. Check console for OTP (dev).";
        // show user ID to verify (dev)
        if (data.user_id) msg.textContent += ` Your user id: ${data.user_id}`;
      } else {
        msg.style.color = "crimson";
        msg.textContent = data.detail || data.error || data.message || `Error ${resp.status}`;
      }
    } catch (err) {
      msg.style.color = "crimson";
      msg.textContent = "Network error";
      console.error(err);
    }
  });
});