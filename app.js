const server = "http://localhost:5000";

document.addEventListener("DOMContentLoaded", function () {
  const formVideoRequest = document.getElementById("formVideoRequest");

  formVideoRequest.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(formVideoRequest);

    fetch(`${server}/video-request`, {
      method: "POST",
      body: formData,
    })
      .then((bold) => bold.json())
      .then((data) => console.log(data));
  });
});
