/* Functionalities related to the modals */

const showModal = (html) => {
    $modal.style.display = "flex";
    $overlay.classList.remove("hidden");
    $modalContainer.insertAdjacentHTML("beforeend", html);
};

const closeModal = () => {
    $modal.style.display = "none";
    $modalContainer.innerHTML = "";
    $overlay.classList.add("hidden");
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

const renderDeletePrompt = () => {
    const html = Mustache.render(deletePromptTemplate);
    showModal(html);

    const $yesButton = document.querySelector(".yes-button");
    const $noButton = document.querySelector(".no-button");

    $yesButton.addEventListener("click", () => {
        socket.emit("delete chats", socket.selectedUser);
        closeModal();
    });

    $noButton.addEventListener("click", closeModal);
};

socket.on("fetched own profile", ({ username, email }) => {
    const phtml = Mustache.render(profileModalTemplate, { user: username, email: email });
    showModal(phtml);

    const $logoutButton = document.querySelector(".logout-button");

    $logoutButton.addEventListener("click", () => {
        socket.emit("logout");
    });
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

            closeModal();

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

$closeModal.addEventListener("click", closeModal);
