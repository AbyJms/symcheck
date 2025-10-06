const chatBox = document.getElementById("chatBox");
const chatBody = document.getElementById("chatBody");
const userInput = document.getElementById("userInput");

function toggleChat() {
  chatBox.style.display = chatBox.style.display === "flex" ? "none" : "flex";
}

function sendMessage() {
  const message = userInput.value.trim();
  if (message === "") return;

  const userMsg = document.createElement("div");
  userMsg.classList.add("chat-message");
  userMsg.style.background = "#00aaff";
  userMsg.style.color = "#fff";
  userMsg.style.textAlign = "right";
  userMsg.textContent = message;
  chatBody.appendChild(userMsg);

  userInput.value = "";
  chatBody.scrollTop = chatBody.scrollHeight;

  // Simulate AI response
  setTimeout(() => {
    const aiMsg = document.createElement("div");
    aiMsg.classList.add("chat-message");
    aiMsg.textContent =
      "I'm here to help! Could you tell me when your symptom started and how severe it is?";
    chatBody.appendChild(aiMsg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }, 800);
}

function openChat(symptom) {
  toggleChat();
  const aiMsg = document.createElement("div");
  aiMsg.classList.add("chat-message");
  aiMsg.textContent = `I see you're experiencing ${symptom.toLowerCase()}. Can you tell me more about it?`;
  chatBody.appendChild(aiMsg);
  chatBody.scrollTop = chatBody.scrollHeight;
}
