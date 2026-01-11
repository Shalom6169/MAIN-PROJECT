// static/js/main.js
document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  if(registerForm){
    registerForm.addEventListener("submit", async (e)=>{
      e.preventDefault();
      const data = new FormData(registerForm);
      const resp = await fetch("/api/register", {method:"POST", body:data});
      const j = await resp.json();
      if(resp.ok) alert("Registered. Check server console or mail for OTP.");
      else alert(j.detail || "Error");
    })
  }
  const loginForm = document.getElementById("loginForm");
  if(loginForm){
    loginForm.addEventListener("submit", async (e)=>{
      e.preventDefault();
      const data = new FormData(loginForm);
      const resp = await fetch("/api/login", {method:"POST", body:data});
      const j = await resp.json();
      if(resp.ok){
        localStorage.setItem("token", j.access_token);
        window.location.href = "/dashboard";
      } else alert(j.detail || "Login failed");
    })
  }
});