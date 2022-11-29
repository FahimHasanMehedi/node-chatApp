const $header = document.querySelector(".auth-header");
const $form = document.querySelector(".auth-form");
const $username = document.querySelector(".input-field[name='username']");
const $password = document.querySelector(".input-field[name='password']");



$form.addEventListener("submit", async (e) => {
    e.preventDefault();
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
            console.log(data);
            window.location.replace("../chat.html");
        })
        .catch((error) => {
            const html = `<p class="error-message">${error.message}</p>`;
            $header.insertAdjacentHTML("afterend", html);
        });
});
