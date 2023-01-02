const renderRequests = (request) => {
    const html = Mustache.render(requestTemplate, { user: request.username });
    $requestContainer.insertAdjacentHTML("beforeend", html);
};

socket.on("fetched requests", (requests) => {
    $requestContainer.innerHTML = "";
    for (let r of requests) {
        renderRequests(r);
    }
});

socket.on("added request", ({ to }) => {
    if (socket.username !== to) return;

    socket.emit("fetch requests");
});

socket.on("deleted request", () => {
    socket.emit("fetch requests");
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

$requestContainer.addEventListener("click", (e) => {
    const username = e.target.closest(".people-button").getAttribute("name");
    renderFriendReqModal(username);
});
