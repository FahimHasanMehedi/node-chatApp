const renderFriends = (friend) => {
    const html = Mustache.render(friendTemplate, { user: friend.username });
    $friendsContainer.insertAdjacentHTML("beforeend", html);
};

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
    closeModal();
    socket.emit("get friends");
});

socket.on("join room", ({ to, roomname }) => {
    if (socket.username !== to) return;
    socket.emit("join room", roomname);
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

$friendsContainer.addEventListener("click", openChat);
