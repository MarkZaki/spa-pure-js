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
};

document.addEventListener("DOMContentLoaded", function () {
  const formVideoRequestElm = document.getElementById("formVideoRequest");
  const formLoginElm = document.getElementById("formLogin");
  const sortByElms = document.querySelectorAll("[id*=sort_by_]");
  const searchBoxElm = document.getElementById("search_box");
  const appContent = document.querySelector(".app-content");

  const loginData = new FormData(formLoginElm);

  formLoginElm.addEventListener("submit", (e) => {
    e.preventDefault();
    fetch(`${server}/users/login`, {
      method: "POST",
      body: loginData,
    })
      .then((bold) => bold.json())
      .then((data) => {
        state.userID.a = data.id;
        state.author_name = data.author_name;
        state.author_email = data.author_email;
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
    <div class="card mb-3">
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
        <div class="d-flex flex-column text-center">
          <a id="votes_ups_${vidInfo._id}" class="btn btn-link">🔺</a>
          <h3 id="score_vote_${vidInfo._id}">${
    vidInfo.votes.ups.length - vidInfo.votes.downs.length
  }</h3>
          <a id="votes_downs_${vidInfo._id}" class="btn btn-link">🔻</a>
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
  const listOfVidElm = document.getElementById("listOfRequests");
  const vidReqContainerElm = document.createElement("div");
  vidReqContainerElm.innerHTML = vidTemplate;

  if (isPrepend) {
    listOfVidElm.prepend(vidReqContainerElm);
  } else {
    listOfVidElm.append(vidReqContainerElm);
  }

  style_votes(vidInfo.votes, vidInfo._id);

  const voteScoreElm = document.getElementById(`score_vote_${vidInfo._id}`);
  const votesElms = document.querySelectorAll(
    `[id^=votes_][id$=_${vidInfo._id}]`
  );

  votesElms.forEach((elm) => {
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
  return fetch(
    `${server}/video-request?sortBy=${sortBy}&searchTerm=${searchTerm}`
  )
    .then((blob) => blob.json())
    .then((data) => {
      listOfVidElm.innerHTML = "";
      data.forEach((vidInfo) => {
        getSingleVidReq(vidInfo);
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
