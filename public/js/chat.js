const socket = io();

// const documentHeight = () => {
//     const doc = document.documentElement;
//     doc.style.setProperty("--doc-height", `${window.innerHeight}px`);
// };
// window.addEventListener("resize", documentHeight);
// documentHeight();

const $sectionMessage = document.querySelector(".section-message");

const $friends = document.querySelector(".friends");
const $modal = document.querySelector(".modal");
const $overlay = document.querySelector(".overlay");
const $requests = document.querySelector(".requests");
const $searchResult = document.querySelector(".search-result");
const $usernameDiv = document.querySelector(".receiver");
const $messageBox = document.querySelector(".message-box");
const $addFriend = document.querySelector(".add-friend");
const $inbox = document.querySelector(".inbox");
const $header = document.querySelector(".header");

const $messagesContainer = document.querySelector(".messages");
const $friendsContainer = document.querySelector(".friends-container");
const $searchResultContainer = document.querySelector(".search-result-container");
const $modalContainer = document.querySelector(".modal-data");
const $requestContainer = document.querySelector(".request-container");
const $inboxContainer = document.querySelector(".inbox-container");
const $profileButtonContainer = document.querySelector(".profile-button-container");

const $messageForm = document.querySelector(".message-form");
const $searchForm = document.querySelector(".search");

const $messageField = document.querySelector(".message-field");
const $searchField = document.querySelector(".search-field");

const $friendsIcon = document.querySelector(".friends-icon");
const $addIcon = document.querySelector(".add-icon");
const $inboxIcon = document.querySelector(".inbox-icon");
const $requestIcon = document.querySelector(".request-icon");
const $closeModal = document.querySelector(".close-modal");
const $downArrowIcon = document.querySelector(".down-arrow-button");

//mustache templates
const messageLeftTemplate = document.querySelector("#message-left-template").innerHTML;
const messageRightTemplate = document.querySelector("#message-right-template").innerHTML;
const friendTemplate = document.querySelector("#friend-template").innerHTML;
const searchResultTemplate = document.querySelector("#search-result-template").innerHTML;
const modalTemplate = document.querySelector("#modal-template").innerHTML;
const modalButtonTemplate = document.querySelector("#modal-button-template").innerHTML;
const modalFriendTemplate = document.querySelector("#modal-friend-template").innerHTML;
const requestTemplate = document.querySelector("#request-template").innerHTML;
const rejectButtonTemplate = document.querySelector("#reject-button-template").innerHTML;
const inboxUserTemplate = document.querySelector("#inbox-user-template").innerHTML;
const inboxTemplate = document.querySelector("#inbox-template").innerHTML;
const deletePromptTemplate = document.querySelector("#delete-chat-template").innerHTML;
const profileButtonTemplate = document.querySelector("#profile-button-template").innerHTML;
const profileModalTemplate = document.querySelector("#profile-modal-template").innerHTML;

const autoScroll = () => {
    const $newMessage = $messagesContainer.lastElementChild;

    const newMessageHeight = $newMessage.offsetHeight + parseInt(getComputedStyle($newMessage).marginBottom);

    const visibleHeight = $messagesContainer.offsetHeight;

    const scrolledHeight = $messagesContainer.scrollTop + visibleHeight;

    const totalHeight = $messagesContainer.scrollHeight;

    if (scrolledHeight >= totalHeight - 12 * newMessageHeight) $messagesContainer.scrollTo(0, totalHeight);
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

const renderProfileButton = (username) => {
    $profileButtonContainer.innerHTML = "";
    const html = Mustache.render(profileButtonTemplate, { user: username });
    $profileButtonContainer.insertAdjacentHTML("beforeend", html);

    const $profileButton = document.querySelector(".profile-button");
    $profileButton.addEventListener("click", () => {
        socket.emit("fetch own profile");
    });
};

const renderFriends = (friend) => {
    const html = Mustache.render(friendTemplate, { user: friend.username });
    $friendsContainer.insertAdjacentHTML("beforeend", html);
};

const renderSearch = (user) => {
    const html = Mustache.render(searchResultTemplate, { user });
    $searchResultContainer.insertAdjacentHTML("beforeend", html);
};

const renderRequests = (request) => {
    const html = Mustache.render(requestTemplate, { user: request.username });
    $requestContainer.insertAdjacentHTML("beforeend", html);
};

const renderDeletePrompt = () => {
    $modal.style.display = "flex";
    $overlay.classList.remove("hidden");
    const html = Mustache.render(deletePromptTemplate);
    $modalContainer.insertAdjacentHTML("beforeend", html);

    const $yesButton = document.querySelector(".yes-button");
    const $noButton = document.querySelector(".no-button");

    $yesButton.addEventListener("click", () => {
        socket.emit("delete chats", socket.selectedUser);
    });

    $noButton.addEventListener("click", () => {
        $modal.style.display = "none";
        $modalContainer.innerHTML = "";
        $overlay.classList.add("hidden");
    });
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

const renderFriendReqModal = (username) => {
    $modalContainer.innerHTML = "";
    const html = Mustache.render(modalTemplate, { user: username, action: "Accept" });
    $modalContainer.insertAdjacentHTML("beforeend", html);
    const bhtml = Mustache.render(rejectButtonTemplate);
    $modalContainer.insertAdjacentHTML("beforeend", bhtml);

    $overlay.classList.remove("hidden");
    $modal.style.display = "flex";

    const $addButton = document.querySelector(".add-button");

    const $rejectButton = document.querySelector(".reject-button");

    $addButton.addEventListener("click", () => {
        $addButton.disabled = "true";
        $rejectButton.disabled = "true";

        socket.emit("add friend", username);
    });

    $rejectButton.addEventListener("click", () => {
        $addButton.disabled = "true";
        $rejectButton.disabled = "true";

        socket.emit("delete request", username);
    });
};

socket.on("user connected", (username) => {
    socket.username = username;
    socket.emit("fetch inbox messages");

    renderProfileButton(username);
});

socket.on("fetched friends", (friends) => {
    $friendsContainer.innerHTML = "";
    for (let n of friends) {
        renderFriends(n);
    }
});

socket.on("added friend", ({ from, user }) => {
    if (user !== socket.username) return;

    socket.emit("get friends");
});

socket.on("unfriended", ({ from, to }) => {
    if (!(socket.username === from || socket.username === to)) return;
    socket.emit("get friends");
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
    } else{
        socket.emit('fetch inbox messages')
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

socket.on("fetched requests", (requests) => {
    $requestContainer.innerHTML = "";
    for (let r of requests) {
        renderRequests(r);
    }
});

socket.on("fetched own profile", ({ username, email }) => {
    $modal.style.display = "flex";
    $overlay.classList.remove("hidden");
    $modalContainer.innerHTML = "";
    const phtml = Mustache.render(profileModalTemplate, { user: username, email: email });
    $modalContainer.insertAdjacentHTML("beforeend", phtml);
    const $logoutButton = document.querySelector(".logout-button");

    $logoutButton.addEventListener("click", () => {
        socket.emit("logout");
    });
});

socket.on("deleted request", () => {
    socket.emit("fetch requests");
});

socket.on("deleted chats", ({ from, to }) => {
    if (!(socket.username === from || socket.username === to)) return;

    $sectionMessage.style.display = "none";
    socket.emit("fetch inbox messages");
});

socket.on("connect_error", () => {
    window.location.replace("/");
});

socket.on("added request", ({ to }) => {
    if (socket.username !== to) return;

    socket.emit("fetch requests");
});

socket.on("search results", (results) => {
    for (let r of results) {
        renderSearch(r.username);
    }
});

socket.on("join room", ({ to, roomname }) => {
    if (socket.username !== to) return;
    socket.emit("join room", roomname);
});

socket.on("show user modal", ({ username, isFriend, isReceived, isSent }) => {
    $modalContainer.innerHTML = "";
    $overlay.classList.remove("hidden");
    $modal.style.display = "flex";
    let html = Mustache.render(modalTemplate, { user: username, action: "Add" });
    $modalContainer.insertAdjacentHTML("beforeend", html);
    if (isFriend) {
        html = Mustache.render(modalFriendTemplate);
        $modalContainer.insertAdjacentHTML("beforeend", html);
        const $unfriendButton = document.querySelector(".unfriend-button");

        $unfriendButton.addEventListener("click", () => {
            $unfriendButton.disabled = true;
            $messagesContainer.innerHTML = "";
            $usernameDiv.innerHTML = "";
            $sectionMessage.style.display = "none";

            socket.emit("unfriend", username);
            socket.emit("delete chats", username);
        });
    } else if (isSent) {
        html = Mustache.render(modalButtonTemplate);
        $modalContainer.insertAdjacentHTML("beforeend", html);
        const $addButton = document.querySelector(".add-button");
        const $sentPrompt = document.querySelector(".sent-req-prompt");

        $addButton.style.display = "none";
        // $addButton.classList.add("hidden");
        $sentPrompt.classList.remove("hidden");
    } else if (isReceived) {
        renderFriendReqModal(username);
    } else {
        html = Mustache.render(modalButtonTemplate);
        $modalContainer.insertAdjacentHTML("beforeend", html);
        const $addButton = document.querySelector(".add-button");

        $addButton.addEventListener("click", () => {
            $addButton.disabled = "true";

            socket.emit("add request", {
                to: username,
            });
        });
    }
});

socket.on("logged out", () => {
    window.location.replace("/");
});

$friendsIcon.addEventListener("click", () => {
    $inbox.style.display = "none";
    $requests.style.display = "none";
    $addFriend.style.display = "none";
    $usernameDiv.innerHTML = "";
    $messagesContainer.innerHTML = "";
    $requestContainer.innerHTML = "";
    $friends.style.display = "flex";
    $sectionMessage.style.display = "none";
    socket.emit("get friends");
});

$addIcon.addEventListener("click", () => {
    $inbox.style.display = "none";
    $requests.style.display = "none";
    $friends.style.display = "none";
    $searchResult.classList.add("hidden");
    $friendsContainer.innerHTML = "";
    $messagesContainer.innerHTML = "";
    $requestContainer.innerHTML = "";
    $sectionMessage.style.display = "none";
    $addFriend.style.display = "flex";
});

$requestIcon.addEventListener("click", () => {
    $inbox.style.display = "none";
    $friends.style.display = "none";
    $addFriend.style.display = "none";
    $sectionMessage.style.display = "none";
    $requests.style.display = "flex";
    $messagesContainer.innerHTML = "";
    $requestContainer.innerHTML = "";
    socket.emit("fetch requests");
});

$downArrowIcon.addEventListener("click", () => {
    $messagesContainer.scrollTo({
        top: $messagesContainer.scrollHeight,
        left: 0,
        behavior: "smooth",
    });
});

const renderInbox = ({ friend, lastMessage, sender }) => {
    if (sender === socket.username) {
        const html = Mustache.render(inboxTemplate, { friend, lastMessage, sender: "you:" });
        $inboxContainer.insertAdjacentHTML("beforeend", html);
    } else {
        const html = Mustache.render(inboxTemplate, { friend, lastMessage, sender: "" });
        $inboxContainer.insertAdjacentHTML("beforeend", html);
    }
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

$inboxIcon.addEventListener("click", () => {
    $inbox.style.display = "flex";
    $friends.style.display = "none";
    $addFriend.style.display = "none";
    $sectionMessage.style.display = "none";
    $requests.style.display = "none";

    socket.emit("fetch inbox messages");
});

$closeModal.addEventListener("click", () => {
    $modal.style.display = "none";
    $overlay.classList.add("hidden");
    $modalContainer.innerHTML = "";
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

$searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    $searchResult.style.display = "flex";
    $searchResultContainer.innerHTML = "";
    const username = $searchField.value;
    $searchField.value = "";
    $searchField.focus();
    socket.emit("search people", username);
});

const openChat = (e) => {
    const user = e.target.closest(".people-button");

    if (!user) return;

    const username = user.getAttribute("name");
    socket.selectedUser = username;
    $messagesContainer.innerHTML = "";
    $usernameDiv.innerHTML = "";
    $sectionMessage.style.display = "flex";
    $usernameDiv.style.display = "flex";

    renderInboxTitle(username);

    socket.emit("fetch messages", {
        to: socket.selectedUser,
    });

    $messageField.focus();
};

$friendsContainer.addEventListener("click", openChat);

$requestContainer.addEventListener("click", (e) => {
    const username = e.target.closest(".people-button").getAttribute("name");
    renderFriendReqModal(username);
});

$searchResultContainer.addEventListener("click", (e) => {
    // $modalContainer.innerHTML = "";
    const username = e.target.closest(".people-button").getAttribute("name");
    socket.emit("fetch user profile", username);
});

$inboxContainer.addEventListener("click", openChat);
