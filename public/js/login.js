const $header = document.querySelector(".auth-header");
const $form = document.querySelector(".auth-form");
const $username = document.querySelector(".input-field[name='username']");
const $password = document.querySelector(".input-field[name='password']");
const $errorPrompt = document.querySelector(".error-prompt");

$form.addEventListener("submit", async (e) => {
    e.preventDefault();
    $errorPrompt.innerHTML = "";
    const formData = {
        username: $username.value,
        password: $password.value,
    };

    const jsonData = JSON.stringify(formData);

    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: jsonData,
    })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            if (data.error) throw new Error(data.error);

            window.location.replace("/chat");
        })
        .catch((error) => {
            const html = `<p class="error-message">${error.message}</p>`;
            $errorPrompt.insertAdjacentHTML("beforeend", html);
            setTimeout(() => {
                $errorPrompt.innerHTML = "";
            }, 5000);
        });
});
