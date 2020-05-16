const server = "http://localhost:5000";

document.addEventListener("DOMContentLoaded", function () {
  const formVideoRequestElm = document.getElementById("formVideoRequest");
  const listOfVidElm = document.getElementById("listOfRequests");

  fetch(`${server}/video-request`)
    .then((blob) => blob.json())
    .then((data) => {
      data.forEach((vidReq) => {
        listOfVidElm.appendChild(getSingleVidReq(vidReq));
      });
    });

  formVideoRequestElm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(formVideoRequestElm);

    fetch(`${server}/video-request`, {
      method: "POST",
      body: formData,
    })
      .then((bold) => bold.json())
      .then((data) => console.log(data));
  });
});

function getSingleVidReq(vidInfo) {
  const level_color = vidInfo.target_level;
  let bgColor = "success";
  switch (level_color) {
    case "beginner":
      bg_color = "success";
      break;
    case "medium":
      bgColor = "warning";
      break;
    case "advanced":
      bgColor = "danger";
      break;
    default:
      bgColor = "success";
  }
  const vidTemplate = `
    <div class="card mb-3">
      <div class="card-body d-flex justify-content-between flex-row">
        <div class="d-flex flex-column">
          <h3>${vidInfo.topic_title}</h3>
          <p class="text-muted mb-2">${vidInfo.topic_details}</p>
          <p class="mb-0 text-muted">
            <strong>Expected results:</strong> ${vidInfo.expected_result}
          </p>
        </div>
        <div class="d-flex flex-column text-center">
          <a class="btn btn-link">🔺</a>
          <h3>0</h3>
          <a class="btn btn-link">🔻</a>
        </div>
      </div>
      <div class="card-footer d-flex flex-row justify-content-between">
        <div>
          <span class="text-info">${vidInfo.status.toUpperCase()}</span>
          &bullet; added by <strong>${vidInfo.author_name}</strong> on
          <strong>${new Date(vidInfo.submit_date).toLocaleDateString()}</strong>
        </div>
        <div class="d-flex justify-content-center flex-column 408ml-auto mr-2">
          <div class="badge badge-${bgColor}">
            ${vidInfo.target_level}
          </div>
        </div>
      </div>
    </div>
  `;
  const vidReqContainerElm = document.createElement("div");
  vidReqContainerElm.innerHTML = vidTemplate;
  return vidReqContainerElm;
}
