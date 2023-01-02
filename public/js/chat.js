const socket = io();

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





const renderProfileButton = (username) => {
    $profileButtonContainer.innerHTML = "";
    const html = Mustache.render(profileButtonTemplate, { user: username });
    $profileButtonContainer.insertAdjacentHTML("beforeend", html);

    const $profileButton = document.querySelector(".profile-button");
    $profileButton.addEventListener("click", () => {
        socket.emit("fetch own profile");
    });
};


// Socket.io event listeners for user profile related actions
socket.on("user connected", (username) => {
    socket.username = username;
    socket.emit("fetch inbox messages");

    renderProfileButton(username);
});

socket.on("connect_error", () => {
    window.location.replace("/");
});

socket.on("logged out", () => {
    window.location.replace("/");
});



