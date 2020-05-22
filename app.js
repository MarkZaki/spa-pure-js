const server = "http://localhost:5000";

const state = {
  userID: {
    aInternal: "",
    aListener: function (val) {},
    set a(val) {
      this.aInternal = val;
      this.aListener(val);
    },
    get a() {
      return this.aInternal;
    },
    registerListener: function (listener) {
      this.aListener = listener;
    },
  },
  sortBy: "newFirst",
  searchTerm: "",
  author_name: "",
  author_email: "",
  isAdmin: false,
};

document.addEventListener("DOMContentLoaded", function () {
  const formVideoRequestElm = document.getElementById("formVideoRequest");
  const formLoginElm = document.getElementById("formLogin");
  const sortByElms = document.querySelectorAll("[id*=sort_by_]");
  const searchBoxElm = document.getElementById("search_box");
  const appContent = document.querySelector(".app-content");

  formLoginElm.addEventListener("submit", (e) => {
    e.preventDefault();
    const loginData = {
      author_name: formLoginElm["author_name"].value,
      author_email: formLoginElm["author_email"].value,
    };
    console.log(loginData);
    fetch(`${server}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    })
      .then((bold) => bold.json())
      .then((data) => {
        state.userID.a = data.id;
        state.author_name = data.author_name;
        state.author_email = data.author_email;
        if (data.admin) {
          state.isAdmin = true;
          document
            .getElementById("normal-user-content")
            .classList.add("d-none");
        }
        formLoginElm.classList.add("d-none");
        appContent.classList.remove("d-none");
      });
  });

  state.userID.registerListener(function (val) {
    loadAllVidReqs(state.sortBy, state.searchTerm);
  });
  sortByElms.forEach((elm) => {
    elm.addEventListener("click", function (e) {
      e.preventDefault();
      state.sortBy = this.querySelector("input").value;
      console.log(
        "you triggered the func",
        this.querySelector("input").value,
        state.sortBy
      );
      loadAllVidReqs(state.sortBy, state.searchTerm);
      this.classList.add("active");
      if (state.sortBy === "topVotedFirst") {
        document.getElementById("sort_by_new").classList.remove("active");
      } else {
        document.getElementById("sort_by_vote").classList.remove("active");
      }
    });
  });

  searchBoxElm.addEventListener(
    "input",
    debounce((e) => {
      state.searchTerm = e.target.value;
      loadAllVidReqs(state.sortBy, state.searchTerm);
    }, 300)
  );

  formVideoRequestElm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(formVideoRequestElm);

    formData.append("author_id", state.userID.a);
    formData.append("author_name", state.author_name);
    formData.append("author_email", state.author_email);

    const isValid = validateForm(formData);

    if (!isValid) return;

    fetch(`${server}/video-request`, {
      method: "POST",
      body: formData,
    })
      .then((bold) => bold.json())
      .then((data) => getSingleVidReq(data, true));
    formVideoRequestElm.reset();
  });
});
function getSingleVidReq(vidInfo, isPrepend = false) {
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
    <div class="card mb-3" id="id_${vidInfo._id}_id">
    ${
      state.isAdmin
        ? `<div class="card-header d-flex justify-content-between">
    <select id="admin_change_status_${vidInfo._id}" value=${vidInfo.status}>
      <option value="new">new</option>
      <option value="planned">planned</option>
      <option value="done">done</option>
    </select>
    <div class="input-group ml-2 mr-5 d-none" id="input_video_req_container_${vidInfo._id}">
        <input type="text" placeholder="Youtube link here..." class="form-control" id="admin_video_res_${vidInfo._id}">
        <div class="input-group-append">
          <button class="btn btn-outline-secondary" type="button" id="admin_save_video_res_${vidInfo._id}">save</button>
        </div>
    </div>
    <button class="btn btn-danger" id="admin_delete_video_req_${vidInfo._id}">Delete</button>
</div>`
        : ""
    }
      <div class="card-body d-flex justify-content-between flex-row">
        <div class="d-flex flex-column">
          <h3>${vidInfo.topic_title}</h3>
          <p class="text-muted mb-2">${vidInfo.topic_details}</p>
          <p class="mb-0 text-muted">
            ${
              vidInfo.expected_result &&
              `<strong>Expected results:</strong> ${vidInfo.expected_result}`
            }
          </p>
        </div>
        ${
          vidInfo.status === "done"
            ? `<div>
        <iframe src="https://youtube.com/embed/${vidInfo.video_ref.link}" frameborder="0" width="240" allowfullscreen></iframe>
      </div>`
            : ``
        }
        <div class="d-flex flex-column text-center">
          <a id="votes_ups_${vidInfo._id}" class="btn btn-link">🔺</a>
          <h3 id="score_vote_${vidInfo._id}">${
    vidInfo.votes.ups.length - vidInfo.votes.downs.length
  }</h3>
          <a id="votes_downs_${vidInfo._id}" class="btn btn-link">🔻</a>
        </div>
      </div>
      <div class="card-footer d-flex flex-row justify-content-between">
        <div class="${
          vidInfo.status === "done"
            ? "text-success"
            : vidInfo.status === "planned"
            ? "text-primary"
            : ""
        }">
          <span id="vid_req_status_${
            vidInfo._id
          }">${vidInfo.status.toUpperCase()}</span>
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
  const listOfVidElm = document.getElementById("listOfRequests");
  const vidReqContainerElm = document.createElement("div");
  vidReqContainerElm.innerHTML = vidTemplate;

  if (isPrepend) {
    listOfVidElm.prepend(vidReqContainerElm);
  } else {
    listOfVidElm.append(vidReqContainerElm);
  }

  if (state.isAdmin) {
    const adminChangeStatusElm = document.getElementById(
      `admin_change_status_${vidInfo._id}`
    );
    const adminVideoResElm = document.getElementById(
      `admin_video_res_${vidInfo._id}`
    );
    const adminSaveVideoResElm = document.getElementById(
      `admin_save_video_res_${vidInfo._id}`
    );
    const adminDeleteVideoReqElm = document.getElementById(
      `admin_delete_video_req_${vidInfo._id}`
    );
    const adminVideoResContainer = document.getElementById(
      `input_video_req_container_${vidInfo._id}`
    );
    adminChangeStatusElm.querySelectorAll("option").forEach((option) => {
      if (option.value === vidInfo.status) {
        if (option.value === "done") {
          adminVideoResContainer.classList.remove("d-none");
        } else {
          adminVideoResContainer.classList.add("d-none");
        }
        option.selected = true;
        adminVideoResElm.value = vidInfo.video_ref.link;
      }
    });

    adminChangeStatusElm.addEventListener("change", (e) => {
      if (e.target.value === "done") {
        adminVideoResContainer.classList.remove("d-none");
        document.getElementById(
          `vid_req_status_${vidInfo._id}`
        ).innerText = e.target.value.toUpperCase();
      } else {
        adminVideoResContainer.classList.add("d-none");
        // TODO: FETCH FUNCTION
        updateStatus(vidInfo._id, e.target.value);
      }
    });

    adminSaveVideoResElm.addEventListener("click", (e) => {
      e.preventDefault();
      if (!adminVideoResElm.value) {
        adminVideoResElm.classList.add("is-invalid");
        adminVideoResElm.addEventListener("input", function () {
          this.classList.remove("is-invalid");
        });
        return;
      }
      // TODO: FETCH FUNCTION
      updateStatus(vidInfo._id, "done", adminVideoResElm.value);
    });

    adminDeleteVideoReqElm.addEventListener("click", (e) => {
      const isSure = confirm(
        `Are You Sure you want to delete "${vidInfo.topic_title}"?`
      );

      if (!isSure) {
        return;
      }

      e.preventDefault();
      fetch(`${server}/video-request`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vidInfo._id }),
      })
        .then((res) => res.json())
        .then((data) => {
          const deletedElm = document.getElementById(`id_${vidInfo._id}_id`);
          deletedElm.remove();
        });
    });
  }

  style_votes(vidInfo.votes, vidInfo._id);

  const voteScoreElm = document.getElementById(`score_vote_${vidInfo._id}`);
  const votesElms = document.querySelectorAll(
    `[id^=votes_][id$=_${vidInfo._id}]`
  );

  votesElms.forEach((elm) => {
    if (state.isAdmin) {
      const voteUpsElm = document.getElementById(`votes_ups_${vidInfo._id}`);
      const voteDownsElm = document.getElementById(
        `votes_downs_${vidInfo._id}`
      );
      voteUpsElm.style.opacity = "0.5";
      voteDownsElm.style.opacity = "0.5";
      voteUpsElm.style.cursor = "not-allowed";
      voteDownsElm.style.cursor = "not-allowed";
      return;
    }
    elm.addEventListener("click", function (e) {
      e.preventDefault();
      const [votes, vote_type, id] = e.target.getAttribute("id").split("_");

      fetch(`${server}/video-request/vote`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          vote_type,
          user_id: state.userID.a,
        }),
      })
        .then((bolb) => bolb.json())
        .then((data) => {
          voteScoreElm.innerText = data.ups.length - data.downs.length;
          style_votes(data, vidInfo._id, vote_type);
        });
    });
  });
}

function updateStatus(videoID, status, videoResValue = "") {
  fetch(`${server}/video-request`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: videoID,
      status: status,
      resVideo: videoResValue,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById(
        `vid_req_status_${videoID}`
      ).innerText = data.status.toUpperCase();

      console.log(data);
    });
}

function style_votes(data, id, vote_type) {
  if (!vote_type) {
    if (data.ups.includes(state.userID.a)) {
      vote_type = "ups";
    } else if (data.downs.includes(state.userID.a)) {
      vote_type = "downs";
    } else {
      return;
    }
  }

  const voteUpsElm = document.getElementById(`votes_ups_${id}`);
  const voteDownsElm = document.getElementById(`votes_downs_${id}`);
  const voteDirElm = vote_type === "ups" ? voteUpsElm : voteDownsElm;
  const otherDirElm = vote_type === "ups" ? voteDownsElm : voteUpsElm;

  if (data[vote_type].includes(state.userID.a)) {
    voteDirElm.style.opacity = 1;
    otherDirElm.style.opacity = "0.5";
  } else {
    otherDirElm.style.opacity = 1;
  }
}

function loadAllVidReqs(sortBy = "newFirst", searchTerm = "") {
  const listOfVidElm = document.getElementById("listOfRequests");
  console.log("about to fetch", sortBy);
  return fetch(
    `${server}/video-request?sortBy=${sortBy}&searchTerm=${searchTerm}`
  )
    .then((blob) => blob.json())
    .then((data) => {
      listOfVidElm.innerHTML = "";
      data.forEach((vidInfo) => {
        getSingleVidReq(vidInfo);
        console.log("supposed to be rendered");
      });
    });
}

function debounce(fn, time) {
  let timeout;

  return function () {
    const functionCall = () => fn.apply(this, arguments);
    clearTimeout(timeout);
    timeout = setTimeout(functionCall, time);
  };
}

function validateForm(formData) {
  const topic = formData.get("topic_title");
  const topicDetails = formData.get("topic_details");

  if (!topic || topic.length > 30) {
    document.querySelector("[name=topic_title]").classList.add("is-invalid");
  }

  if (!topicDetails) {
    document.querySelector("[name=topic_details]").classList.add("is-invalid");
  }

  const allInvalidElms = document
    .getElementById("formVideoRequest")
    .querySelectorAll(".is-invalid");

  if (allInvalidElms.length) {
    allInvalidElms.forEach((elm) => {
      elm.addEventListener("input", function () {
        this.classList.remove("is-invalid");
      });
    });
    return false;
  }

  return true;
}
