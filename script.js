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
      if (index % 2 === 0) {
        leftCol.appendChild(card);
      } else {
        rightCol.appendChild(card);
      }
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

function openChat(symptom) {
  if (!document.body.classList.contains("split-active")) {
    toggleSplitMode();
  }

  const chatBody = document.getElementById("chatBody");

  const userMsg = document.createElement("div");
  userMsg.className = "chat-message";
  userMsg.style.background = "#eef";
  userMsg.style.textAlign = "right";
  userMsg.style.alignSelf = "flex-end";
  userMsg.innerText = "I have a " + symptom;
  chatBody.appendChild(userMsg);

  chatBody.scrollTop = chatBody.scrollHeight;

  setTimeout(() => {
    const aiMsg = document.createElement("div");
    aiMsg.className = "chat-message";
    aiMsg.style.alignSelf = "flex-start";
    aiMsg.innerText = `I see you're experiencing ${symptom.toLowerCase()}. Can you tell me more about it?`;
    chatBody.appendChild(aiMsg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }, 500);
}

function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (text === "") return;

  const chatBody = document.getElementById("chatBody");

  const userMsg = document.createElement("div");
  userMsg.className = "chat-message";
  userMsg.style.background = "#eef";
  userMsg.style.textAlign = "right";
  userMsg.style.alignSelf = "flex-end";
  userMsg.innerText = text;
  chatBody.appendChild(userMsg);

  input.value = "";

  chatBody.scrollTop = chatBody.scrollHeight;

  setTimeout(() => {
    const aiMsg = document.createElement("div");
    aiMsg.className = "chat-message";
    aiMsg.style.alignSelf = "flex-start";
    aiMsg.innerText = "I understand. Can you tell me how long you've felt this way?";
    chatBody.appendChild(aiMsg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.getElementById("userInput");
  if (inputField) {
    inputField.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }
});