const target = new Date("2027-01-09T16:00:00-03:00").getTime();

function updateCountdown(){
  const diff = Math.max(0, target - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  document.querySelector("#days").textContent = String(days).padStart(2,"0");
  document.querySelector("#hours").textContent = String(hours).padStart(2,"0");
  document.querySelector("#minutes").textContent = String(minutes).padStart(2,"0");
  document.querySelector("#seconds").textContent = String(seconds).padStart(2,"0");
}
updateCountdown();
setInterval(updateCountdown,1000);

const welcome = document.querySelector("#welcome");
const invitation = document.querySelector("#invitation");
const music = document.querySelector("#bgMusic");
const musicToggle = document.querySelector("#musicToggle");
music.volume = 0.6;

const updateToggle = () => {
  musicToggle.classList.toggle("muted", music.paused);
  musicToggle.textContent = music.paused ? "♪" : "❚❚";
};
const enter = (withMusic) => {
  welcome.classList.add("hidden");
  invitation.classList.remove("hidden");
  document.body.classList.remove("no-scroll");
  window.scrollTo(0,0);
  musicToggle.classList.remove("hidden");
  if (withMusic) music.play().catch(()=>{});
  updateToggle();
};
musicToggle.addEventListener("click", () => {
  music.paused ? music.play().catch(()=>{}) : music.pause();
});
music.addEventListener("play", updateToggle);
music.addEventListener("pause", updateToggle);
document.querySelector("#enterBtn").addEventListener("click", () => enter(true));
document.querySelector("#silentBtn").addEventListener("click", () => enter(false));
document.body.classList.add("no-scroll");

function makeICS(type){
  const isParty = type === "party";
  const start = isParty ? "20270109T190000" : "20270109T160000";
  const end = isParty ? "20270110T070000" : "20270109T173000";
  const summary = isParty ? "Boda de Iván y Javiera — Fiesta" : "Boda de Iván y Javiera — Ceremonia";
  const location = isParty ? "Club Pesca y Caza Paillaco, T-65 km 1.6, Paillaco" : "Catedral Osorno, Manuel Antonio Matta 662, Osorno";
  const ics = [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//IvanYJaviera//Invitacion//ES",
    "BEGIN:VEVENT",`DTSTART;TZID=America/Santiago:${start}`,`DTEND;TZID=America/Santiago:${end}`,
    `SUMMARY:${summary}`,`LOCATION:${location}`,"END:VEVENT","END:VCALENDAR"
  ].join("\r\n");
  const blob = new Blob([ics],{type:"text/calendar;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download=(isParty?"fiesta":"ceremonia")+"_ivan_javiera.ics";
  a.click(); URL.revokeObjectURL(url);
  showToast("Se descargó el evento para tu calendario.");
}
document.querySelectorAll("[data-calendar]").forEach(btn=>{
  btn.addEventListener("click",()=>makeICS(btn.dataset.calendar));
});

function showToast(message){
  const toast=document.querySelector("#toast");
  toast.textContent=message;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"),2800);
}

const WHATSAPP_NUMBER = "56944378404";

function sendWhatsApp(message){
  if(WHATSAPP_NUMBER.includes("X")){
    showToast("Formulario listo. Falta configurar el WhatsApp de los novios.");
    return;
  }
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
}

const rsvpForm = document.querySelector("#rsvpForm");
const menuChoices = document.querySelector("#menuChoices");
const MAIN_OPTIONS = ["Carne mechada","Salmón"];
const SIDE_OPTIONS = ["Arroz","Papas doradas","Puré"];

function optionsHTML(list){
  return `<option value="">Selecciona</option>` + list.map(o=>`<option value="${o}">${o}</option>`).join("");
}

function renderMenuChoices(){
  const attending = rsvpForm.elements["attendance"].value === "Sí, asistiré";
  const guests = parseInt(rsvpForm.elements["guests"].value, 10);
  const prevNotes = rsvpForm.elements["menu_notes"]?.value || "";
  if(!attending || !guests){ menuChoices.innerHTML = ""; return; }
  let html = "";
  for(let i = 1; i <= guests; i++){
    const who = guests === 1 ? "Tu menú" : `Menú persona ${i}`;
    html += `<fieldset class="menu-person">
      <legend>${who}</legend>
      <label>Plato de fondo
        <select name="main_${i}" required>${optionsHTML(MAIN_OPTIONS)}</select>
      </label>
      <label>Guarnición
        <select name="side_${i}" required>${optionsHTML(SIDE_OPTIONS)}</select>
      </label>
    </fieldset>`;
  }
  html += `<label>Detalles de tu menú (opcional)
      <textarea name="menu_notes" rows="3" placeholder="Escribe aquí cualquier indicación sobre tu menú: cambios, alergias, otra preferencia..."></textarea>
    </label>`;
  menuChoices.innerHTML = html;
  rsvpForm.elements["menu_notes"].value = prevNotes;
}
rsvpForm?.elements["attendance"].addEventListener("change", renderMenuChoices);
rsvpForm?.elements["guests"].addEventListener("change", renderMenuChoices);

rsvpForm?.addEventListener("submit",(e)=>{
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  const guests = parseInt(data.get("guests"), 10) || 0;
  let menu = "";
  if(data.get("attendance") === "Sí, asistiré"){
    const lines = [];
    for(let i = 1; i <= guests; i++){
      const label = guests === 1 ? "Menú" : `Persona ${i}`;
      lines.push(`${label}: ${data.get("main_"+i)} + ${data.get("side_"+i)}`);
    }
    menu = `\nMenú (coctelería de entrada incluida):\n${lines.join("\n")}`;
    const menuNotes = (data.get("menu_notes") || "").trim();
    if(menuNotes) menu += `\nDetalles del menú: ${menuNotes}`;
  }
  sendWhatsApp(`💍 CONFIRMACIÓN — Iván & Javiera
Nombre: ${data.get("name")}
Asistencia: ${data.get("attendance")}
Personas: ${data.get("guests")}${menu}
Comentarios: ${data.get("notes") || "Sin comentarios"}`);
});

document.querySelector("#songForm")?.addEventListener("submit",(e)=>{
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  sendWhatsApp(`🎵 SUGERENCIA DE CANCIÓN — Iván & Javiera
Nombre: ${data.get("name")}
Canción: ${data.get("song")}
Link: ${data.get("link") || "Sin link"}`);
});

document.querySelector("#giftForm")?.addEventListener("submit",(e)=>{
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  sendWhatsApp(`🎁 SUGERENCIA DE REGALO — Iván & Javiera
Nombre: ${data.get("name")}
Sugerencia: ${data.get("gift")}`);
});
