const showMessages = () => {
    $messagesContainer.innerHTML = "";
    $usernameDiv.innerHTML = "";
    $sectionMessage.style.display = "flex";
    $usernameDiv.style.display = "flex";
};

const openChat = (e) => {
    const user = e.target.closest(".people-button");

    if (!user) return;

    const username = user.getAttribute("name");
    socket.selectedUser = username;
    showMessages();

    renderInboxTitle(username);

    socket.emit("fetch messages", {
        to: socket.selectedUser,
    });

    $messageField.focus();
};

const renderMessage = (message, direction) => {
    let html;
    if (direction === "right") {
        html = Mustache.render(messageRightTemplate, { message });
    } else {
        html = Mustache.render(messageLeftTemplate, { message });
    }
    $messagesContainer.insertAdjacentHTML("beforeend", html);
    autoScroll();
};

const renderInbox = ({ friend, lastMessage, sender }) => {
    if (sender === socket.username) {
        const html = Mustache.render(inboxTemplate, { friend, lastMessage, sender: "you:" });
        $inboxContainer.insertAdjacentHTML("beforeend", html);
    } else {
        const html = Mustache.render(inboxTemplate, { friend, lastMessage, sender: "" });
        $inboxContainer.insertAdjacentHTML("beforeend", html);
    }
};

const renderInboxTitle = (user) => {
    const html = Mustache.render(inboxUserTemplate, { user });
    $usernameDiv.insertAdjacentHTML("beforeend", html);

    const $userInfoIcon = document.querySelector(".user-info-button");
    const $chatDeleteIcon = document.querySelector(".chat-delete-button");
    $userInfoIcon.addEventListener("click", () => {
        const username = $userInfoIcon.getAttribute("name");
        socket.emit("fetch user profile", username);
    });
    $chatDeleteIcon.addEventListener("click", () => {
        renderDeletePrompt();
    });
};

socket.on("fetched inbox messages", (inbox) => {
    $inboxContainer.innerHTML = "";

    for (let i of inbox) {
        renderInbox({ friend: i.friendUsername, lastMessage: i.lastMessage, sender: i.sender });
    }
    const $inboxLastMsg = document.querySelectorAll(".inbox-last-message");
    for (let el of $inboxLastMsg) {
        if (el.scrollWidth > el.clientWidth) {
            el.insertAdjacentHTML("afterend", "<span>......</span>");
        }
    }
});

socket.on("private message", (chat) => {
    const $chatDeleteIcon = document.querySelector(".chat-delete-button");
    if ($chatDeleteIcon?.disabled) $chatDeleteIcon.disabled = false;

    if (chat.sender === socket.username) {
        renderMessage(chat.message, "right");
        socket.emit("fetch inbox messages");
    } else if (socket.selectedUser === chat.sender) {
        renderMessage(chat.message, "left");
        socket.emit("fetch inbox messages");
    } else {
        socket.emit("fetch inbox messages");
    }
});

socket.on("fetched messages", (chats) => {
    const $chatDeleteIcon = document.querySelector(".chat-delete-button");

    if (chats.length === 0) {
        return ($chatDeleteIcon.disabled = true);
    }
    $chatDeleteIcon.disabled = false;
    for (let c of chats) {
        if (c.sender === socket.username) {
            renderMessage(c.message, "right");
        } else {
            renderMessage(c.message, "left");
        }
    }

    $messagesContainer.addEventListener("scroll", (e) => {
        const totalHeight = $messagesContainer.scrollHeight;
        const scrolledHeight = $messagesContainer.scrollTop;
        const visibleHeight = $messagesContainer.offsetHeight;

        if (totalHeight - scrolledHeight > 2 * visibleHeight) {
            $downArrowIcon.classList.remove("hidden");
        } else {
            $downArrowIcon.classList.add("hidden");
        }
    });
});

socket.on("deleted chats", ({ from, to }) => {
    if (!(socket.username === from || socket.username === to)) return;

    $sectionMessage.style.display = "none";
    socket.emit("fetch inbox messages");
});

$inboxIcon.addEventListener("click", () => {
    $inbox.style.display = "flex";
    $friends.style.display = "none";
    $addFriend.style.display = "none";
    $sectionMessage.style.display = "none";
    $requests.style.display = "none";

    socket.emit("fetch inbox messages");
});

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if ($messageField.value === "") return;
    socket.emit("private message", {
        to: socket.selectedUser,
        message: $messageField.value,
    });
    $messageField.value = "";
    $messageField.focus();
});

$downArrowIcon.addEventListener("click", () => {
    $messagesContainer.scrollTo({
        top: $messagesContainer.scrollHeight,
        left: 0,
        behavior: "smooth",
    });
});

$inboxContainer.addEventListener("click", openChat);
