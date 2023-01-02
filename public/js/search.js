const renderSearch = (user) => {
    const html = Mustache.render(searchResultTemplate, { user });
    $searchResultContainer.insertAdjacentHTML("beforeend", html);
};

socket.on("search results", (results) => {
    for (let r of results) {
        renderSearch(r.username);
    }
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

$searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    $searchResult.style.display = "flex";
    $searchResultContainer.innerHTML = "";
    const username = $searchField.value;
    $searchField.value = "";
    $searchField.focus();
    socket.emit("search people", username);
});

$searchResultContainer.addEventListener("click", (e) => {
    // $modalContainer.innerHTML = "";
    const username = e.target.closest(".people-button").getAttribute("name");
    socket.emit("fetch user profile", username);
});
