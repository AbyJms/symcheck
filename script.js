/* LOGIN PAGE LOGIC */
const loginBtn = document.querySelector('.login-btn'); 
const modal = document.getElementById('loginModal');

loginBtn.addEventListener('click', () => { toggleLogin(); });

function toggleLogin() {
  const isOpen = modal.classList.contains('open');
  if (!isOpen) {
    modal.classList.add('open');
  } else {
    modal.classList.remove('open');
  }
}

modal.addEventListener('click', (e) => {
  if (e.target === modal) toggleLogin();
});

function submitLogin() {
  const name = document.getElementById('loginName').value;
  loginBtn.textContent = name || "Login";
  const pass = document.getElementById('loginPass').value;
  
  if(name && pass) {
    alert(`Welcome, ${name}!`);
    toggleLogin(); 
  } else {
    alert("Please fill in both fields.");
  }
}


/* MAIN PAGE LOGIC */

// 1. Helper Function: Send text to Backend & Show Reply
// This handles the "Thinking..." bubble and the fetch request
async function askServer(userText) {
  const chatBody = document.getElementById("chatBody");

  // A. Create "Thinking..." bubble
  const loadingMsg = document.createElement("div");
  loadingMsg.className = "chat-message";
  loadingMsg.style.alignSelf = "flex-start";
  loadingMsg.innerText = "Thinking...";
  chatBody.appendChild(loadingMsg);
  chatBody.scrollTop = chatBody.scrollHeight;

  try {
    // B. Send to Real Server
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText })
    });

    const data = await response.json();

    // C. Remove "Thinking..." and show Real Answer
    chatBody.removeChild(loadingMsg);

    const aiMsg = document.createElement("div");
    aiMsg.className = "chat-message";
    aiMsg.style.alignSelf = "flex-start";
    aiMsg.innerText = data.reply; // <--- The real answer from Llama 3
    chatBody.appendChild(aiMsg);

  } catch (error) {
    chatBody.removeChild(loadingMsg);
    const errorMsg = document.createElement("div");
    errorMsg.className = "chat-message";
    errorMsg.style.color = "red";
    errorMsg.innerText = "Error: Server not reachable.";
    chatBody.appendChild(errorMsg);
  }
  
  chatBody.scrollTop = chatBody.scrollHeight;
}


// 2. Open Chat (Clicked a Card)
function openChat(symptom) {
  if (!document.body.classList.contains("split-active")) {
    toggleSplitMode();
  }

  const chatBody = document.getElementById("chatBody");
  const text = "I have a " + symptom;

  // Show User Message Bubble
  const userMsg = document.createElement("div");
  userMsg.className = "chat-message";
  userMsg.style.background = "#eef";
  userMsg.style.textAlign = "right";
  userMsg.style.alignSelf = "flex-end";
  userMsg.innerText = text;
  chatBody.appendChild(userMsg);
  chatBody.scrollTop = chatBody.scrollHeight;

  // TRIGGER REAL AI (No more setTimeout!)
  askServer(text);
}


// 3. Send Message (Typed in Box)
function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (text === "") return;

  const chatBody = document.getElementById("chatBody");

  // Show User Message Bubble
  const userMsg = document.createElement("div");
  userMsg.className = "chat-message";
  userMsg.style.background = "#eef";
  userMsg.style.textAlign = "right";
  userMsg.style.alignSelf = "flex-end";
  userMsg.innerText = text;
  chatBody.appendChild(userMsg);

  // Clear Input
  input.value = "";
  chatBody.scrollTop = chatBody.scrollHeight;

  // TRIGGER REAL AI
  askServer(text);
}


// 4. Split Mode UI Logic
function toggleSplitMode() {
  const body = document.body;
  const originalGrid = document.getElementById("originalGrid");
  const splitLayout = document.getElementById("splitLayout");
  const leftCol = document.getElementById("leftCol");
  const rightCol = document.getElementById("rightCol");
  const centerCol = document.getElementById("centerCol");
  const chatBox = document.getElementById("chatBox");

  const isSplit = body.classList.contains("split-active");

  if (!isSplit) {
    body.classList.add("split-active");
    splitLayout.classList.add("active");
    centerCol.appendChild(chatBox);
    chatBox.style.display = "flex";

    const cards = Array.from(originalGrid.children);
    cards.forEach((card, index) => {
      if (index % 2 === 0) leftCol.appendChild(card);
      else rightCol.appendChild(card);
    });

  } else {
    body.classList.remove("split-active");
    splitLayout.classList.remove("active");
    document.body.appendChild(chatBox);
    chatBox.style.display = "none";

    const leftCards = Array.from(leftCol.children);
    const rightCards = Array.from(rightCol.children);
    [...leftCards, ...rightCards].forEach(card => {
        originalGrid.appendChild(card);
    });
  }
}

// 5. Enter Key Listener
document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.getElementById("userInput");
  if (inputField) {
    inputField.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  }
});