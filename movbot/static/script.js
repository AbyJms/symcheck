const chatInput = document.querySelector(".inputbox textarea");
const sendChatMessage = document.querySelector(".send-btn");
const chatbox = document.querySelector(".chatbox");

let userMessage;

// Create a chat message (user or bot)
const createChatList = (message, className) => {
  const chatList = document.createElement("li");
  chatList.classList.add(className);
  let chatContent = className === "outgoing" 
    ? `<p>${message}</p>` 
    : `<div class="avatar"><i class="fas">&#xf0f0;</i></div><p id="symcheck">${message}</p>`;
  chatList.innerHTML = chatContent;
  return chatList;
};

const generateResponse = () => {
  return fetch("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: userMessage })
  })
    .then(res => res.json())
.then(data => {
  let botReply = data.reply;
  if (!botReply) {
    botReply = "Sorry, I didn't understand that.";
  }
  const formattedReply = botReply
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>")
    .replace(/•/g, "•&nbsp;");

  const responseElement = createChatList(formattedReply, "incoming");
  document.querySelector(".typing")?.parentElement.replaceWith(responseElement);
})

    .catch((error) => {
      console.error("Error:", error);
      const errorMessage = createChatList("Oops! Something went wrong.", "incoming");
      document.querySelector(".typing")?.parentElement.replaceWith(errorMessage);
    });
};

const handleChat = () => {
  userMessage = chatInput.value.trim();
  if (!userMessage) return;

  chatbox.appendChild(createChatList(userMessage, "outgoing"));
  chatInput.value = "";

  const botTyping = document.createElement("li");
  botTyping.classList.add("incoming");

  const thinkingP = document.createElement("p");
  thinkingP.id = "symcheck";
  thinkingP.classList.add("typing");
  thinkingP.textContent = "Thinking";

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.innerHTML = `<i class="fas">&#xf0f0;</i>`;

  botTyping.appendChild(avatar);
  botTyping.appendChild(thinkingP);
  chatbox.appendChild(botTyping);

  let dots = 0;
  const interval = setInterval(() => {
    thinkingP.textContent = "Thinking" + ".".repeat(dots);
    dots = (dots + 1) % 4;
  }, 500);

  generateResponse().then(() => clearInterval(interval));
};

sendChatMessage.addEventListener("click", handleChat);
